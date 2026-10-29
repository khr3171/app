import {test} from 'node:test';
import assert from 'node:assert/strict';
import handler,{statistics} from '../api/index.mjs';
async function request(url,method='GET',headers={}){const response={headers:{},setHeader(k,v){this.headers[k]=v;},end(b){this.body=JSON.parse(b);}};await handler({url,method,headers:{host:'localhost',...headers}},response);return response;}
test('설정 전 비밀정보를 노출하지 않고 체험 상태를 알린다',async()=>{const r=await request('/api/config');assert.equal(r.statusCode,200);assert.equal(r.body.storage,'realtime-database');assert.equal(r.body.configured,false);assert.equal(r.body.firebase,null);assert.equal(r.headers['Cache-Control'],'no-store');});
test('설정 전 계정과 관리자 API는 성공한 것처럼 처리하지 않는다',async()=>{for(const route of ['history','admin','me']){const r=await request('/api/'+route);assert.equal(r.statusCode,503);assert.ok(r.body.error);}});
test('잘못된 메서드와 외부 출처의 쓰기를 거절한다',async()=>{assert.equal((await request('/api/results','PUT')).statusCode,405);assert.equal((await request('/api/register','POST',{origin:'https://other.example'})).statusCode,403);});
test('식당 API가 가짜 식당을 채우지 않는다',async()=>{const r=await request('/api/restaurants?area='+encodeURIComponent('서울 성수역')+'&menu='+encodeURIComponent('김밥'));assert.equal(r.statusCode,200);assert.deepEqual(r.body,{configured:false,items:[]});assert.equal((await request('/api/restaurants?area=x&menu=fake')).statusCode,400);});
test('통계는 1순위만 집계한다',()=>{const rows=[{recommendations:[{name:'김밥',category:'가벼운 식사'},{name:'초밥',category:'일식'}],persona:{name:'포근한 충전형'}}];const s=statistics(rows);assert.equal(s.total,1);assert.equal(s.byCategory['가벼운 식사'],1);assert.equal(s.byCategory['일식'],undefined);});
