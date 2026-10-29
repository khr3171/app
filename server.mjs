// Development server. Production uses Vercel Functions and Firebase.
import http from 'node:http';
import {createServer} from 'vite';
import handler from './api/index.mjs';
const vite=await createServer({server:{middlewareMode:true,hmr:false},appType:'spa'});
const server=http.createServer((req,res)=>{
 if(req.url.startsWith('/api/'))return handler(req,res);
 vite.middlewares(req,res);
});
const port=Number(process.env.PORT||3000);
server.listen(port,'127.0.0.1',()=>console.log(`런치자: http://127.0.0.1:${port}`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(async()=>{await vite.close();process.exit();}));
