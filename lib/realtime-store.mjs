// Only the server's Firebase Admin SDK can access these paths.
// Each account/result is mutated in its own transaction. Admin statistics are
// calculated from current results, so retries, adoption and deletion cannot
// leave aggregate counters out of sync.
export function createRealtimeStore(database) {
 const read=async path=>(await database.ref(path).get()).val();
 const values=snapshot=>Object.values(snapshot.val()||{});
 return {
  async getAccount(uid){return read('accounts/'+uid);},
  async createAccount(account){
   const result=await database.ref('accounts/'+account.uid).transaction(current=>current?undefined:account);
   return {created:result.committed,account:result.snapshot.val()};
  },
  async resetAdmin(account){
   return database.ref('accounts/'+account.uid).transaction(current=>{
    if(current&&current.role!=='admin')throw Error('일반 계정을 관리자로 변경할 수 없습니다.');
    return {...account,created:current?.created||account.created};
   });
  },
  async consumeLimit(key,max,now=Date.now()){
   const result=await database.ref('rateLimits/'+key).transaction(current=>{
    if(current?.expiresAt>now&&current.count>=max)return undefined;
    return {count:current?.expiresAt>now?current.count+1:1,expiresAt:current?.expiresAt>now?current.expiresAt:now+60000};
   });return result.committed;
  },
  async createResult(record){
   const result=await database.ref('results/'+record.id).transaction(current=>current?undefined:record);
   return result.snapshot.val();
  },
  async getResult(rid){return read('results/'+rid);},
  async updateResult(rid,update){
   const result=await database.ref('results/'+rid).transaction(current=>{
    // RTDB may call the updater with null before fetching the server value.
    // Returning null lets it compare/retry; aborting here would miss real data.
    return current===null?null:update(current);
   });return result.snapshot.val();
  },
  async listResults(uid){
   const ref=database.ref('results');return values(await (uid?ref.orderByChild('uid').equalTo(uid):ref).get());
  },
  async findShared(shareId){return values(await database.ref('results').orderByChild('shareId').equalTo(shareId).limitToFirst(1).get())[0]||null;},
  async countMembers(){return (await database.ref('accounts').orderByChild('role').equalTo('user').get()).numChildren();}
 };
}
