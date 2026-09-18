import express from 'express';import cookieParser from 'cookie-parser';import helmet from 'helmet';import rateLimit from 'express-rate-limit';
import { config } from './config.js';import { database } from './db.js';import { authentication } from './auth.js';import { catalog } from './catalog.js';import { orders } from './orders.js';import { payments } from './payments.js';import { HttpError } from './security.js';
export function createApp(env:NodeJS.ProcessEnv=process.env){const c=config(env),store=database(c.DATABASE_URL),app=express();
 app.disable('x-powered-by');app.set('trust proxy',1);app.use(helmet({crossOriginResourcePolicy:{policy:'same-site'},contentSecurityPolicy:false}));app.use(cookieParser());
 app.use(express.json({limit:'256kb',strict:true}));app.use(rateLimit({windowMs:60_000,limit:120,standardHeaders:true,legacyHeaders:false,skip:req=>req.path.endsWith('/webhook')}));
 app.use((req,res,next)=>{res.set('X-Content-Type-Options','nosniff');res.set('Referrer-Policy','strict-origin-when-cross-origin');res.set('Cache-Control',req.method==='GET'?'private, max-age=0':'no-store');next();});
 const auth=authentication(store.db,c);app.get('/health/live',(req,res)=>res.json({ok:true}));app.get('/health/ready',async(req,res)=>{try{await store.db.rows((await import('drizzle-orm')).sql`select 1`);res.json({ok:true});}catch{res.status(503).json({ok:false});}});
 app.use('/api/v1',auth.router);app.use('/api/v1',catalog(store.db));app.use('/api/v1',orders(store.db,auth));app.use('/api/v1',payments(store.db,auth,c));
 app.use((err:any,req:any,res:any,next:any)=>{const status=err instanceof HttpError?err.status:err.name==='ZodError'?400:err.status||500;const code=err instanceof HttpError?err.code:err.name==='ZodError'?'INVALID_REQUEST':'INTERNAL_ERROR';if(status>=500)console.error({code,error:err.message});res.status(status).json({success:false,code,message:status>=500?'Internal server error':code,request_id:req.id});});
 return {app,close:store.close};}
if(process.env.NODE_ENV!=='test'){const c=config();const {app}=createApp();app.listen(c.PORT,()=>console.log(`NOEUL API listening on ${c.PORT}`));}
