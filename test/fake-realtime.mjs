// In-memory test double. Mimics transactions' initial null and conflict retry;
// it does not replace verification against an actual Firebase instance.
export function fakeRealtimeDatabase(){
 let data={},tail=Promise.resolve();
 const clone=x=>structuredClone(x??null);
 const read=path=>path.split('/').filter(Boolean).reduce((v,k)=>v?.[k],data)??null;
 const write=(path,value)=>{const parts=path.split('/').filter(Boolean);let node=data;for(const key of parts.slice(0,-1))node=node[key]??={};const key=parts.at(-1);if(value===null)delete node[key];else node[key]=clone(value);};
 const snap=value=>({val:()=>clone(value),numChildren:()=>Object.keys(value||{}).length});
 function ref(path,query={}){return {
  async get(){let value=clone(read(path));if(query.child){value=Object.fromEntries(Object.entries(value||{}).filter(([,v])=>v[query.child]===query.value).slice(0,query.limit||Infinity));if(!Object.keys(value).length)value=null;}return snap(value);},
  orderByChild(child){return ref(path,{...query,child});},equalTo(value){return ref(path,{...query,value});},limitToFirst(limit){return ref(path,{...query,limit});},
  async transaction(update){const operation=tail.then(()=>{const current=clone(read(path));let next=update(null);if(next!==undefined&&current!==null)next=update(current);if(next===undefined)return {committed:false,snapshot:snap(current)};write(path,next);return {committed:true,snapshot:snap(next)};});tail=operation.catch(()=>{});return operation;}
 };}
 return {ref};
}
