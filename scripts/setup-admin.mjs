import {initializeApp,cert} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore} from 'firebase-admin/firestore';
import {createHash,randomBytes,scryptSync} from 'node:crypto';
const name=process.env.ADMIN_NAME||'김하림',password=process.env.ADMIN_PASSWORD;
if(!/^\d{6}$/.test(password||''))throw Error('ADMIN_PASSWORD에 관리자 6자리 비밀번호를 설정해 주세요.');
for(const key of ['FIREBASE_PROJECT_ID','FIREBASE_CLIENT_EMAIL','FIREBASE_PRIVATE_KEY'])if(!process.env[key])throw Error(`${key} 설정이 필요합니다.`);
initializeApp({credential:cert({projectId:process.env.FIREBASE_PROJECT_ID,clientEmail:process.env.FIREBASE_CLIENT_EMAIL,privateKey:process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g,'\n')})});
const db=getFirestore(),key=createHash('sha256').update(name).digest('hex'),ref=db.collection('credentials').doc(key),salt=randomBytes(24).toString('hex');
const uid=await db.runTransaction(async tx=>{const old=(await tx.get(ref)).data(),uid=old?.uid||'admin-'+key.slice(0,32),profile=await tx.get(db.collection('users').doc(uid));if(profile.exists&&profile.data().role!=='admin')throw Error('일반 계정을 관리자로 변경할 수 없습니다.');tx.set(ref,{uid,salt,password:scryptSync(password,salt,64).toString('hex')});tx.set(db.collection('users').doc(uid),{name,role:'admin',created:profile.data()?.created||new Date().toISOString()});return uid;});
try{await getAuth().revokeRefreshTokens(uid);}catch(e){if(e.code!=='auth/user-not-found')throw e;}
console.log('관리자 비밀번호 해시를 설정했습니다. 기존 계정은 다시 로그인하세요.');
