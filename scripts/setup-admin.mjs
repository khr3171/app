import {initializeApp,cert,deleteApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getDatabase} from 'firebase-admin/database';
import {createRealtimeStore} from '../lib/realtime-store.mjs';
import {createHash,randomBytes,scryptSync} from 'node:crypto';
const name=process.env.ADMIN_NAME||'김하림',password=process.env.ADMIN_PASSWORD;
if(!/^\d{6}$/.test(password||''))throw Error('ADMIN_PASSWORD에 관리자 6자리 비밀번호를 설정해 주세요.');
for(const key of ['FIREBASE_PROJECT_ID','FIREBASE_CLIENT_EMAIL','FIREBASE_PRIVATE_KEY','FIREBASE_DATABASE_URL'])if(!process.env[key])throw Error(`${key} 설정이 필요합니다.`);
const app=initializeApp({credential:cert({projectId:process.env.FIREBASE_PROJECT_ID,clientEmail:process.env.FIREBASE_CLIENT_EMAIL,privateKey:process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g,'\n')}),databaseURL:process.env.FIREBASE_DATABASE_URL.trim()});
const db=createRealtimeStore(getDatabase()),uid=createHash('sha256').update(name.normalize('NFC').trim()).digest('hex'),salt=randomBytes(24).toString('hex');
await db.resetAdmin({uid,name:name.normalize('NFC').trim(),salt,password:scryptSync(password,salt,64).toString('hex'),role:'admin',created:new Date().toISOString()});
try{await getAuth().revokeRefreshTokens(uid);}catch(e){if(e.code!=='auth/user-not-found')throw e;}
console.log('관리자 비밀번호 해시를 설정했습니다. 기존 계정은 다시 로그인하세요.');
await deleteApp(app);
