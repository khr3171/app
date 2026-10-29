import {getApps,initializeApp,cert} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore,FieldValue,Timestamp} from 'firebase-admin/firestore';
import {randomBytes,scryptSync,timingSafeEqual,createHash,createHmac} from 'node:crypto';
import {menus,recommend,persona,validAnswers} from '../public/engine.mjs';

const sha=s=>createHash('sha256').update(s).digest('hex');
const hash=(p,s)=>scryptSync(p,s,64).toString('hex');
const id=()=>randomBytes(24).toString('hex');
const adminName=()=>process.env.ADMIN_NAME||'김하림';
const config=()=>({apiKey:process.env.FIREBASE_API_KEY,authDomain:process.env.FIREBASE_AUTH_DOMAIN,projectId:process.env.FIREBASE_PROJECT_ID,appId:process.env.FIREBASE_APP_ID});
const configured=()=>Object.values(config()).every(Boolean)&&!!process.env.FIREBASE_CLIENT_EMAIL&&!!process.env.FIREBASE_PRIVATE_KEY&&!!process.env.RATE_LIMIT_SECRET;
function services(){
 if(!configured())fail('Firebase 연결 설정이 필요해요. 현재는 체험 모드로 이용할 수 있어요.',503);
 if(!getApps().length)initializeApp({credential:cert({projectId:process.env.FIREBASE_PROJECT_ID,clientEmail:process.env.FIREBASE_CLIENT_EMAIL,privateKey:process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g,'\n')})});
 return {db:getFirestore(),auth:getAuth()};
}
export function fail(message,status=400){throw Object.assign(Error(message),{status});}
function send(res,status,data){res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json; charset=utf-8');res.statusCode=status;res.end(JSON.stringify(data));}
async function body(req){if(req.body&&typeof req.body==='object'){if(JSON.stringify(req.body).length>16000)fail('입력이 너무 길어요.',413);return req.body;}let text='';for await(const c of req){text+=c;if(text.length>16000)fail('입력이 너무 길어요.',413);}try{return JSON.parse(text||'{}');}catch{fail('잘못된 입력이에요.');}}
async function limit(db,req,kind,max=15){
 const ip=process.env.VERCEL?(req.headers['x-forwarded-for']||'unknown').split(',')[0]:req.socket?.remoteAddress||'local';
 const key=createHmac('sha256',process.env.RATE_LIMIT_SECRET).update(kind+ip).digest('hex');const ref=db.collection('rateLimits').doc(key);
 const blocked=await db.runTransaction(async tx=>{const snap=await tx.get(ref),l=snap.data(),now=Date.now();if(l&&l.expiresAt.toMillis()>now&&l.count>=max)return true;tx.set(ref,{count:l&&l.expiresAt.toMillis()>now?l.count+1:1,expiresAt:Timestamp.fromMillis(l&&l.expiresAt.toMillis()>now?l.expiresAt.toMillis():now+60000)});return false;});
 if(blocked)fail('요청이 많아요. 1분 후 다시 시도해 주세요.',429);
}
async function identity(req,auth,db){const token=/^Bearer (.+)$/.exec(req.headers.authorization||'')?.[1];if(!token)fail('로그인이 필요해요.',401);let decoded;try{decoded=await auth.verifyIdToken(token,true);}catch{fail('로그인 시간이 만료됐어요. 다시 로그인해 주세요.',401);}const profile=(await db.collection('users').doc(decoded.uid).get()).data();return {uid:decoded.uid,profile,anonymous:decoded.firebase?.sign_in_provider==='anonymous'};}
function publicUser(u){return u.profile?{name:u.profile.name,role:u.profile.role}:null;}
export function statistics(rows){const byCategory={},byPersona={},byMenu={};for(const r of rows){const m=r.recommendations[0];byCategory[m.category]=(byCategory[m.category]||0)+1;byPersona[r.persona.name]=(byPersona[r.persona.name]||0)+1;byMenu[m.name]=(byMenu[m.name]||0)+1;}return {total:rows.length,byCategory,byPersona,byMenu};}
function cleanResult(r){return {id:r.id,recommendations:r.recommendations,persona:r.persona,created:r.created};}
const seoulDay=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Seoul'});
function counter(r,n){return {total:FieldValue.increment(n),byCategory:{[r.recommendations[0].category]:FieldValue.increment(n)},byMenu:{[r.recommendations[0].name]:FieldValue.increment(n)},byPersona:{[r.persona.name]:FieldValue.increment(n)}};}
export default async function handler(req,res){
 res.setHeader('X-Content-Type-Options','nosniff');
 try{
 const url=new URL(req.url,'http://localhost');const route=url.searchParams.get('route')||url.pathname.replace(/^\/api\/?/,'');const method=req.method;
 if(!['GET','POST','DELETE'].includes(method))fail('지원하지 않는 요청이에요.',405);
 if(method!=='GET'&&req.headers.origin){const origin=new URL(req.headers.origin);if(origin.host!==req.headers.host)fail('잘못된 요청 출처예요.',403);}
 if(route==='config'&&method==='GET')return send(res,200,{configured:configured(),firebase:configured()?config():null,restaurantsConfigured:!!process.env.NAVER_CLIENT_ID&&!!process.env.NAVER_CLIENT_SECRET,mapClientId:process.env.NAVER_MAP_CLIENT_ID||null});
 // Restaurant search can work independently of Firebase, but only verified NAVER results are returned.
 if(route==='restaurants'&&method==='GET'){
  const area=(url.searchParams.get('area')||'').trim(),menu=menus.find(m=>m.name===url.searchParams.get('menu'));if(area.length<2||area.length>100||!menu)fail('주소와 메뉴를 확인해 주세요.');
  if(!process.env.NAVER_CLIENT_ID||!process.env.NAVER_CLIENT_SECRET)return send(res,200,{configured:false,items:[]});
  if(!configured())fail('식당 검색 서버 설정이 필요해요. 네이버 지도를 이용해 주세요.',503);
  const {db}=services();await limit(db,req,'naver',20);
  let response;try{response=await fetch(`https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(area+' '+menu.name)}&display=5`,{headers:{'X-Naver-Client-Id':process.env.NAVER_CLIENT_ID,'X-Naver-Client-Secret':process.env.NAVER_CLIENT_SECRET},signal:AbortSignal.timeout(8000)});}catch{fail('네이버 연결이 지연돼요. 지도에서 직접 확인해 주세요.',502);}
  if(!response.ok)fail('네이버 검색을 불러오지 못했어요. 지도에서 확인해 주세요.',502);
  const b=await response.json(),clean=t=>String(t||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
  return send(res,200,{configured:true,checkedAt:new Date().toISOString(),source:'NAVER 지역 검색',items:(b.items||[]).filter(i=>/음식|카페|식당|한식|중식|일식|양식/.test(i.category||'')).map(i=>({name:clean(i.title),address:clean(i.roadAddress||i.address),category:clean(i.category),lat:Number(i.mapy)/1e7,lng:Number(i.mapx)/1e7}))});
 }
 const {db,auth}=services();
 if(['login','register'].includes(route)&&method==='POST'){
  await limit(db,req,'auth',8);const b=await body(req),name=typeof b.name==='string'?b.name.normalize('NFC').trim():'',password=typeof b.password==='string'?b.password:'';
  if(name.length<2||name.length>30||!/^\d{6}$/.test(password))fail('이름 2~30자와 생년월일 6자리를 입력해 주세요.');
  const ref=db.collection('credentials').doc(sha(name));let record=(await ref.get()).data();
  if(route==='register'){
   if(b.consent!==true)fail('기록 저장에 동의해 주세요.');
   if(name===adminName())fail('사용할 수 없는 이름이에요.',409);
   const yy=+password.slice(0,2),mm=+password.slice(2,4),dd=+password.slice(4),year=yy<=new Date().getUTCFullYear()%100?2000+yy:1900+yy,dt=new Date(Date.UTC(year,mm-1,dd));
   if(dt.getUTCFullYear()!==year||dt.getUTCMonth()!==mm-1||dt.getUTCDate()!==dd||dt>Date.now())fail('생년월일을 YYMMDD 형식으로 확인해 주세요.');
   const uid=id(),salt=id(),created=new Date().toISOString();
   await db.runTransaction(async tx=>{if((await tx.get(ref)).exists)fail('이미 등록된 이름이에요. 별칭을 덧붙여 주세요.',409);tx.set(ref,{uid,salt,password:hash(password,salt)});tx.set(db.collection('users').doc(uid),{name,role:'user',created});tx.set(db.doc('stats/global'),{users:FieldValue.increment(1)},{merge:true});});
   return send(res,201,{customToken:await auth.createCustomToken(uid)});
  }
  // Administrator is provisioned only on the server; the password never enters a client bundle.
  if(name===adminName()&&!record&&process.env.ADMIN_PASSWORD){
   const salt=id(),uid='admin-'+sha(name).slice(0,32),initial={uid,salt,password:hash(process.env.ADMIN_PASSWORD,salt)};
   await db.runTransaction(async tx=>{if(!(await tx.get(ref)).exists){tx.set(ref,initial);tx.set(db.collection('users').doc(uid),{name,role:'admin',created:new Date().toISOString()});}});record=(await ref.get()).data();
  }
  const expected=record?.password||hash('000000','dummy'),actual=hash(password,record?.salt||'dummy');const matches=timingSafeEqual(Buffer.from(expected,'hex'),Buffer.from(actual,'hex'));if(!record||!matches)fail('이름 또는 비밀번호를 확인해 주세요.',401);
  return send(res,200,{customToken:await auth.createCustomToken(record.uid)});
 }
 if(route==='shared'&&method==='GET'){
  await limit(db,req,'readshare',60);const shareId=url.searchParams.get('id')||'';if(!/^[a-f0-9]{48}$/.test(shareId))fail('공유 링크를 확인해 주세요.',404);const snap=await db.collection('shares').doc(shareId).get(),data=snap.data();if(!data)fail('공유 결과가 삭제되었거나 만료됐어요.',404);const r=(await db.collection('results').doc(data.resultId).get()).data();if(!r)fail('공유 결과가 삭제되었어요.',404);return send(res,200,cleanResult(r));
 }
 const u=await identity(req,auth,db);
 if(route==='me'&&method==='GET')return send(res,200,{user:publicUser(u)});
 if(route==='adopt'&&method==='POST'){
  if(!u.profile)fail('회원 로그인이 필요해요.',401);const b=await body(req);let old;try{old=await auth.verifyIdToken(b.guestToken,true);}catch{fail('이전 기록을 가져오지 못했어요.',401);}if(old.firebase?.sign_in_provider!=='anonymous')fail('게스트 기록만 가져올 수 있어요.',403);
  const snapshot=await db.collection('results').where('uid','==',old.uid).get();for(const doc of snapshot.docs){await db.runTransaction(async tx=>{const s=await tx.get(doc.ref);if(s.data()?.uid===old.uid)tx.update(doc.ref,{uid:u.uid});});}return send(res,200,{ok:true});
 }
 if(route==='results'&&method==='POST'){
  await limit(db,req,'results',25);const b=await body(req);if(!validAnswers(b.answers)||!['any','quick','delivery','dine'].includes(b.environment||'any'))fail('8개 질문에 모두 답해 주세요.');if(b.previous&&!menus.some(m=>m.name===b.previous))fail('직전 메뉴를 확인해 주세요.');if(!/^[a-f0-9-]{16,64}$/.test(b.requestId||''))fail('요청 번호가 없어요. 다시 시작해 주세요.');
  const rid=sha(u.uid+b.requestId),ref=db.collection('results').doc(rid);const r={id:rid,uid:u.uid,answers:b.answers,recommendations:recommend(b.answers,b.previous||'',b.environment||'any'),persona:persona(b.answers),created:new Date().toISOString(),day:seoulDay()};
  const final=await db.runTransaction(async tx=>{const old=await tx.get(ref);if(old.exists)return old.data();tx.set(ref,r);tx.set(db.doc('stats/global'),counter(r,1),{merge:true});tx.set(db.doc('days/'+r.day),{total:FieldValue.increment(1)},{merge:true});return r;});return send(res,201,cleanResult(final));
 }
 if(route==='history'&&method==='GET'){
  if(!u.profile)fail('로그인하면 기록을 모아볼 수 있어요.',401);const rows=(await db.collection('results').where('uid','==',u.uid).get()).docs.map(d=>d.data()).sort((a,b)=>b.created.localeCompare(a.created));return send(res,200,{...statistics(rows),results:rows.map(cleanResult)});
 }
 if(route==='history'&&method==='DELETE'){
  if(!u.profile)fail('로그인이 필요해요.',401);await limit(db,req,'delete',5);const docs=(await db.collection('results').where('uid','==',u.uid).get()).docs;
  // Small transactions keep concurrent result submissions and repeated deletion safe.
  for(const doc of docs)await db.runTransaction(async tx=>{const snap=await tx.get(doc.ref);if(!snap.exists)return;const r=snap.data();if(r.uid!==u.uid)return;tx.delete(doc.ref);if(r.shareId)tx.delete(db.collection('shares').doc(r.shareId));tx.set(db.doc('stats/global'),counter(r,-1),{merge:true});tx.set(db.doc('days/'+r.day),{total:FieldValue.increment(-1)},{merge:true});});return send(res,200,{ok:true});
 }
 if(route==='admin'&&method==='GET'){
  if(u.profile?.role!=='admin')fail('관리자만 볼 수 있어요.',403);const [global,today]=await Promise.all([db.doc('stats/global').get(),db.doc('days/'+seoulDay()).get()]);return send(res,200,{total:0,users:0,byCategory:{},byPersona:{},byMenu:{},...global.data(),today:today.data()?.total||0});
 }
 if(route==='share'&&method==='POST'){
  await limit(db,req,'share',20);const b=await body(req);if(!/^[a-f0-9]{64}$/.test(b.id||''))fail('공유할 결과가 없어요.',404);const ref=db.collection('results').doc(b.id);
  const share=await db.runTransaction(async tx=>{const snap=await tx.get(ref),r=snap.data();if(!r||r.uid!==u.uid)fail('내 결과만 공유할 수 있어요.',403);if(r.shareId)return r.shareId;const shareId=id();tx.update(ref,{shareId});tx.set(db.collection('shares').doc(shareId),{resultId:b.id});return shareId;});return send(res,200,{share});
 }
 fail('요청한 기능이 없어요.',404);
 }catch(e){if(e.status)return send(res,e.status,{error:e.message});console.error('API failure:',e.code||e.name);send(res,500,{error:'서버 연결에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.'});}
}
