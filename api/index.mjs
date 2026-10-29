import {getApps,initializeApp,cert} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getDatabase} from 'firebase-admin/database';
import {randomBytes,scryptSync,timingSafeEqual,createHash,createHmac} from 'node:crypto';
import {menus,recommend,persona,validAnswers} from '../lib/engine.mjs';
import {createRealtimeStore} from '../lib/realtime-store.mjs';

const sha=s=>createHash('sha256').update(s).digest('hex');
const hash=(p,s)=>scryptSync(p,s,64).toString('hex');
const id=()=>randomBytes(24).toString('hex');
const adminName=()=>process.env.ADMIN_NAME||'김하림';
const config=()=>({apiKey:process.env.FIREBASE_API_KEY,authDomain:process.env.FIREBASE_AUTH_DOMAIN,projectId:process.env.FIREBASE_PROJECT_ID,appId:process.env.FIREBASE_APP_ID});
const configured=()=>Object.values(config()).every(Boolean)&&!!process.env.FIREBASE_CLIENT_EMAIL&&!!process.env.FIREBASE_PRIVATE_KEY&&!!process.env.FIREBASE_DATABASE_URL&&!!process.env.RATE_LIMIT_SECRET;
function services(){
 if(!configured())fail('Firebase 연결 설정이 필요해요. 현재는 체험 모드로 이용할 수 있어요.',503);
 if(!getApps().length)initializeApp({credential:cert({projectId:process.env.FIREBASE_PROJECT_ID,clientEmail:process.env.FIREBASE_CLIENT_EMAIL,privateKey:process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g,'\n')}),databaseURL:process.env.FIREBASE_DATABASE_URL.trim()});
 return {db:createRealtimeStore(getDatabase()),auth:getAuth()};
}
export function fail(message,status=400){throw Object.assign(Error(message),{status});}
function send(res,status,data){res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json; charset=utf-8');res.statusCode=status;res.end(JSON.stringify(data));}
async function body(req){if(req.body&&typeof req.body==='object'){if(JSON.stringify(req.body).length>16000)fail('입력이 너무 길어요.',413);return req.body;}let text='';for await(const c of req){text+=c;if(text.length>16000)fail('입력이 너무 길어요.',413);}try{return JSON.parse(text||'{}');}catch{fail('잘못된 입력이에요.');}}
async function limit(db,req,kind,max=15){
 const ip=process.env.VERCEL?String(req.headers['x-forwarded-for']||'unknown').split(',')[0]:req.socket?.remoteAddress||'local';
 const key=createHmac('sha256',process.env.RATE_LIMIT_SECRET).update(kind+ip).digest('hex');
 if(!await db.consumeLimit(key,max))fail('요청이 많아요. 1분 후 다시 시도해 주세요.',429);
}
async function identity(req,auth,db){const token=/^Bearer (.+)$/.exec(req.headers.authorization||'')?.[1];if(!token)fail('로그인이 필요해요.',401);let decoded;try{decoded=await auth.verifyIdToken(token,true);}catch{fail('로그인 시간이 만료됐어요. 다시 로그인해 주세요.',401);}if(!/^[a-zA-Z0-9_-]{1,128}$/.test(decoded.uid))fail('지원하지 않는 계정 식별자예요.',401);const profile=await db.getAccount(decoded.uid);return {uid:decoded.uid,profile,anonymous:decoded.firebase?.sign_in_provider==='anonymous'};}
function publicUser(u){return u.profile?{name:u.profile.name,role:u.profile.role}:null;}
export function statistics(rows){const byCategory={},byPersona={},byMenu={};for(const r of rows){const m=r.recommendations[0];byCategory[m.category]=(byCategory[m.category]||0)+1;byPersona[r.persona.name]=(byPersona[r.persona.name]||0)+1;byMenu[m.name]=(byMenu[m.name]||0)+1;}return {total:rows.length,byCategory,byPersona,byMenu};}
function cleanResult(r){return {id:r.id,recommendations:r.recommendations,persona:r.persona,created:r.created};}
const seoulDay=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Seoul'});
export function createHandler({getServices=services,isConfigured=configured}={}){return async function handler(req,res){
 res.setHeader('X-Content-Type-Options','nosniff');
 try{
 const url=new URL(req.url,'http://localhost');const route=url.searchParams.get('route')||url.pathname.replace(/^\/api\/?/,'');const method=req.method;
 if(!['GET','POST','DELETE'].includes(method))fail('지원하지 않는 요청이에요.',405);
 if(method!=='GET'&&req.headers.origin){const origin=new URL(req.headers.origin);if(origin.host!==req.headers.host)fail('잘못된 요청 출처예요.',403);}
 if(route==='config'&&method==='GET')return send(res,200,{storage:'realtime-database',configured:isConfigured(),firebase:isConfigured()?config():null,restaurantsConfigured:!!process.env.NAVER_CLIENT_ID&&!!process.env.NAVER_CLIENT_SECRET,mapClientId:process.env.NAVER_MAP_CLIENT_ID||null});
 // Restaurant search can work independently of Firebase, but only verified NAVER results are returned.
 if(route==='restaurants'&&method==='GET'){
  const area=(url.searchParams.get('area')||'').trim(),menu=menus.find(m=>m.name===url.searchParams.get('menu'));if(area.length<2||area.length>100||!menu)fail('주소와 메뉴를 확인해 주세요.');
  if(!process.env.NAVER_CLIENT_ID||!process.env.NAVER_CLIENT_SECRET)return send(res,200,{configured:false,items:[]});
  if(!isConfigured())fail('식당 검색 서버 설정이 필요해요. 네이버 지도를 이용해 주세요.',503);
  const {db}=getServices();await limit(db,req,'naver',20);
  let response;try{response=await fetch(`https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(area+' '+menu.name)}&display=5`,{headers:{'X-Naver-Client-Id':process.env.NAVER_CLIENT_ID,'X-Naver-Client-Secret':process.env.NAVER_CLIENT_SECRET},signal:AbortSignal.timeout(8000)});}catch{fail('네이버 연결이 지연돼요. 지도에서 직접 확인해 주세요.',502);}
  if(!response.ok)fail('네이버 검색을 불러오지 못했어요. 지도에서 확인해 주세요.',502);
  const b=await response.json(),clean=t=>String(t||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
  return send(res,200,{configured:true,checkedAt:new Date().toISOString(),source:'NAVER 지역 검색',items:(b.items||[]).filter(i=>/음식|카페|식당|한식|중식|일식|양식/.test(i.category||'')).map(i=>({name:clean(i.title),address:clean(i.roadAddress||i.address),category:clean(i.category),lat:Number(i.mapy)/1e7,lng:Number(i.mapx)/1e7}))});
 }
 const {db,auth}=getServices();
 if(['login','register'].includes(route)&&method==='POST'){
  await limit(db,req,'auth',8);const b=await body(req),name=typeof b.name==='string'?b.name.normalize('NFC').trim():'',password=typeof b.password==='string'?b.password:'';
  if(name.length<2||name.length>30||!/^\d{6}$/.test(password))fail('이름 2~30자와 생년월일 6자리를 입력해 주세요.');
  const uid=sha(name);let record=await db.getAccount(uid);
  if(route==='register'){
   if(b.consent!==true)fail('기록 저장에 동의해 주세요.');
   if(name===adminName())fail('사용할 수 없는 이름이에요.',409);
   const yy=+password.slice(0,2),mm=+password.slice(2,4),dd=+password.slice(4),year=yy<=new Date().getUTCFullYear()%100?2000+yy:1900+yy,dt=new Date(Date.UTC(year,mm-1,dd));
   if(dt.getUTCFullYear()!==year||dt.getUTCMonth()!==mm-1||dt.getUTCDate()!==dd||dt>Date.now())fail('생년월일을 YYMMDD 형식으로 확인해 주세요.');
   const salt=id();const result=await db.createAccount({uid,name,salt,password:hash(password,salt),role:'user',created:new Date().toISOString()});
   if(!result.created)fail('이미 등록된 이름이에요. 별칭을 덧붙여 주세요.',409);
   return send(res,201,{customToken:await auth.createCustomToken(uid)});
  }
  if(name===adminName()&&!record&&process.env.ADMIN_PASSWORD){
   if(!/^\d{6}$/.test(process.env.ADMIN_PASSWORD))fail('관리자 비밀번호 환경변수를 확인해 주세요.',503);
   const salt=id();const result=await db.createAccount({uid,name,salt,password:hash(process.env.ADMIN_PASSWORD,salt),role:'admin',created:new Date().toISOString()});record=result.account;
  }
  const expected=record?.password||hash('000000','dummy'),actual=hash(password,record?.salt||'dummy');const matches=timingSafeEqual(Buffer.from(expected,'hex'),Buffer.from(actual,'hex'));if(!record||!matches)fail('이름 또는 비밀번호를 확인해 주세요.',401);
  return send(res,200,{customToken:await auth.createCustomToken(record.uid)});
 }
 if(route==='shared'&&method==='GET'){
  await limit(db,req,'readshare',60);const shareId=url.searchParams.get('id')||'';if(!/^[a-f0-9]{48}$/.test(shareId))fail('공유 링크를 확인해 주세요.',404);const r=await db.findShared(shareId);if(!r)fail('공유 결과가 삭제되었거나 만료됐어요.',404);return send(res,200,cleanResult(r));
 }
 const u=await identity(req,auth,db);
 if(route==='me'&&method==='GET')return send(res,200,{user:publicUser(u)});
 if(route==='adopt'&&method==='POST'){
  if(!u.profile)fail('회원 로그인이 필요해요.',401);const b=await body(req);let old;try{old=await auth.verifyIdToken(b.guestToken,true);}catch{fail('이전 기록을 가져오지 못했어요.',401);}if(old.firebase?.sign_in_provider!=='anonymous'||!/^[a-zA-Z0-9_-]{1,128}$/.test(old.uid))fail('게스트 기록만 가져올 수 있어요.',403);
  for(const r of await db.listResults(old.uid))await db.updateResult(r.id,current=>current.uid===old.uid?{...current,uid:u.uid}:current);
  return send(res,200,{ok:true});
 }
 if(route==='results'&&method==='POST'){
  await limit(db,req,'results',25);const b=await body(req);if(!validAnswers(b.answers)||!['any','quick','delivery','dine'].includes(b.environment||'any'))fail('8개 질문에 모두 답해 주세요.');if(b.previous&&!menus.some(m=>m.name===b.previous))fail('직전 메뉴를 확인해 주세요.');if(!/^[a-f0-9-]{16,64}$/.test(b.requestId||''))fail('요청 번호가 없어요. 다시 시작해 주세요.');
  const rid=sha(u.uid+b.requestId),r={id:rid,uid:u.uid,answers:b.answers,recommendations:recommend(b.answers,b.previous||'',b.environment||'any'),persona:persona(b.answers),created:new Date().toISOString(),day:seoulDay()};
  return send(res,201,cleanResult(await db.createResult(r)));
 }
 if(route==='history'&&method==='GET'){
  if(!u.profile)fail('로그인하면 기록을 모아볼 수 있어요.',401);const rows=(await db.listResults(u.uid)).sort((a,b)=>b.created.localeCompare(a.created));return send(res,200,{...statistics(rows),results:rows.map(cleanResult)});
 }
 if(route==='history'&&method==='DELETE'){
  if(!u.profile)fail('로그인이 필요해요.',401);await limit(db,req,'delete',5);
  for(const r of await db.listResults(u.uid))await db.updateResult(r.id,current=>current.uid===u.uid?null:current);
  return send(res,200,{ok:true});
 }
 if(route==='admin'&&method==='GET'){
  if(u.profile?.role!=='admin')fail('관리자만 볼 수 있어요.',403);
  const [rows,users]=await Promise.all([db.listResults(),db.countMembers()]);return send(res,200,{...statistics(rows),users,today:rows.filter(r=>r.day===seoulDay()).length});
 }
 if(route==='share'&&method==='POST'){
  await limit(db,req,'share',20);const b=await body(req);if(!/^[a-f0-9]{64}$/.test(b.id||''))fail('공유할 결과가 없어요.',404);const proposed=id();
  const r=await db.updateResult(b.id,current=>{if(current.uid!==u.uid)fail('내 결과만 공유할 수 있어요.',403);return {...current,shareId:current.shareId||proposed};});if(!r)fail('공유할 결과가 없어요.',404);return send(res,200,{share:r.shareId});
 }
 fail('요청한 기능이 없어요.',404);
 }catch(e){if(e.status)return send(res,e.status,{error:e.message});console.error('API failure:',e.code||e.name);send(res,500,{error:'서버 연결에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.'});}
};}
export default createHandler();
