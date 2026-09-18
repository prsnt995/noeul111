import { Router, type RequestHandler } from 'express';
import { createClient } from '@supabase/supabase-js';
import { type Database,sql } from './db.js';
import type { Config } from './config.js';
import { random,hash,encrypt,decrypt,equal,ensure } from './security.js';
export function authentication(db:Database,c:Config) {
 const cookie=c.NODE_ENV==='production'?'__Host-noeul_session':'noeul_session';
 const options={httpOnly:true,secure:c.NODE_ENV==='production',sameSite:'lax' as const,path:'/'};
 const client=()=>createClient(c.SUPABASE_URL,c.SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const authenticate:RequestHandler=async(req,res,next)=>{
  const sid=req.cookies[cookie]; ensure(typeof sid==='string',401,'SIGN_IN_REQUIRED');
  const session=await db.transaction(async tx=>{
   const [s]=await tx.rows(sql`select s.*,p.email,p.name,p.disabled,m.role from app.sessions s join app.profiles p on p.id=s.user_id left join app.staff_members m on m.user_id=p.id and m.active where s.id_hash=${hash(sid)} and s.expires_at>now() for update of s`);
   ensure(s && !s.disabled,401,'SESSION_EXPIRED');
   let tokens=decrypt(s.encrypted_tokens,c.SESSION_KEY);
   const sb=client();
   if(tokens.expires_at*1000<Date.now()+60000){
    const {data,error}=await sb.auth.refreshSession({refresh_token:tokens.refresh_token});
    ensure(!error && data.session,401,'SESSION_EXPIRED'); tokens=data.session;
    await tx.rows(sql`update app.sessions set encrypted_tokens=${encrypt(tokens,c.SESSION_KEY)},refreshed_at=now() where id_hash=${hash(sid)}`);
   }
   const {data,error}=await sb.auth.getUser(tokens.access_token);
   ensure(!error && data.user?.id===s.user_id,401,'SESSION_REVOKED');
   // getUser verifies the access token with Auth; only then inspect its assurance claim.
   const claims=JSON.parse(Buffer.from(tokens.access_token.split('.')[1],'base64url').toString());
   return {...s,aal:claims.aal,accessToken:tokens.access_token};
  });
  if(!['GET','HEAD','OPTIONS'].includes(req.method)){
   ensure(req.get('origin')===c.APP_ORIGIN,403,'ORIGIN_REJECTED');
   ensure(equal(req.get('x-csrf-token')||'',session.csrf),403,'CSRF_REJECTED');
  }
  res.locals.session=session;res.set('Cache-Control','no-store');next();
 };
 const staff=(roles:string[]):RequestHandler=> (req,res,next)=>{
  const s=res.locals.session;ensure(s && roles.includes(s.role),403,'PERMISSION_DENIED');
  ensure(s.aal==='aal2',403,'MFA_REQUIRED');next();
 };
 const router=Router();
 router.get('/auth/google/start',async(req,res)=>{
  const state=random(); const values=new Map<string,string>();
  const sb=createClient(c.SUPABASE_URL,c.SUPABASE_PUBLISHABLE_KEY,{auth:{flowType:'pkce',autoRefreshToken:false,detectSessionInUrl:false,persistSession:true,storage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>{values.set(k,v);},removeItem:k=>{values.delete(k);}}}});
  const {data,error}=await sb.auth.signInWithOAuth({provider:'google',options:{redirectTo:`${c.APP_ORIGIN}/api/v1/auth/google/callback`,skipBrowserRedirect:true,scopes:'openid email profile'}});
  ensure(!error && data.url,502,'GOOGLE_UNAVAILABLE');
  await db.rows(sql`insert into app.oauth_states values(${hash(state)},${encrypt(Object.fromEntries(values),c.SESSION_KEY)},now()+interval '10 minutes')`);
  res.cookie('noeul_oauth',state,{...options,maxAge:600000});res.redirect(data.url);
 });
 router.get('/auth/google/callback',async(req,res)=>{
  const state=req.cookies.noeul_oauth;ensure(typeof state==='string' && typeof req.query.code==='string',400,'INVALID_CALLBACK');
  const [record]=await db.rows(sql`delete from app.oauth_states where id_hash=${hash(state)} and expires_at>now() returning *`);
  ensure(record,400,'OAUTH_STATE_EXPIRED');const values=decrypt(record.verifier,c.SESSION_KEY);
  const sb=createClient(c.SUPABASE_URL,c.SUPABASE_PUBLISHABLE_KEY,{auth:{flowType:'pkce',persistSession:true,autoRefreshToken:false,detectSessionInUrl:false,storage:{getItem:k=>values[k]||null,setItem:(k,v)=>{values[k]=v;},removeItem:k=>{delete values[k];}}}});
  const {data,error}=await sb.auth.exchangeCodeForSession(req.query.code as string);
  ensure(!error && data.session && data.user?.email_confirmed_at && data.user.identities?.some(i=>i.provider==='google'),401,'GOOGLE_IDENTITY_REQUIRED');
  const id=random(),csrf=random();
  await db.transaction(async tx=>{
   await tx.rows(sql`insert into app.profiles(id,email,name) values(${data.user.id},${data.user.email!},${String(data.user.user_metadata.full_name||'').slice(0,200)}) on conflict(id) do update set email=excluded.email`);
   const [p]=await tx.rows(sql`select disabled from app.profiles where id=${data.user.id}`);ensure(!p.disabled,403,'ACCOUNT_DISABLED');
   await tx.rows(sql`insert into app.sessions(id_hash,user_id,encrypted_tokens,csrf,expires_at) values(${hash(id)},${data.user.id},${encrypt(data.session,c.SESSION_KEY)},${csrf},now()+interval '7 days')`);
  });
  res.clearCookie('noeul_oauth',options);res.cookie(cookie,id,{...options,maxAge:7*86400000});res.redirect('/account');
 });
 router.get(['/me','/auth/me'],authenticate,(req,res)=>{const s=res.locals.session;res.json({success:true,user:{id:s.user_id,uid:s.user_id,name:s.name,email:s.email,role:s.role||'customer'},csrf:s.csrf});});
 router.post(['/auth/logout','/auth/logout-all'],authenticate,async(req,res)=>{
  const s=res.locals.session,all=req.path.endsWith('logout-all');
  await db.rows(all?sql`delete from app.sessions where user_id=${s.user_id}`:sql`delete from app.sessions where id_hash=${s.id_hash}`);
  res.clearCookie(cookie,options);res.json({success:true});
 });
 return {router,authenticate,staff};
}
