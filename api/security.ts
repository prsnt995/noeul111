import { createCipheriv,createDecipheriv,createHash,randomBytes,timingSafeEqual } from 'node:crypto';
export const random=()=>randomBytes(32).toString('base64url');
export const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
export function encrypt(value:unknown,key:string) {
 const iv=randomBytes(12),c=createCipheriv('aes-256-gcm',Buffer.from(key,'hex'),iv);
 const body=Buffer.concat([c.update(JSON.stringify(value),'utf8'),c.final()]);
 return ['v1',iv.toString('base64url'),c.getAuthTag().toString('base64url'),body.toString('base64url')].join('.');
}
export function decrypt(value:string,key:string):any {
 const [version,iv,tag,body]=value.split('.'); if(version!=='v1') throw new Error('Unknown encryption version');
 const c=createDecipheriv('aes-256-gcm',Buffer.from(key,'hex'),Buffer.from(iv,'base64url'));
 c.setAuthTag(Buffer.from(tag,'base64url'));
 return JSON.parse(Buffer.concat([c.update(Buffer.from(body,'base64url')),c.final()]).toString());
}
export function equal(a:string,b:string){ const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length && timingSafeEqual(x,y); }
export class HttpError extends Error { constructor(public status:number,public code:string){super(code);} }
export function ensure(condition:unknown,status:number,code:string):asserts condition {if(!condition)throw new HttpError(status,code);}
