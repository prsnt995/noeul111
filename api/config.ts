import 'dotenv/config';
import { z } from 'zod';
const schema=z.object({
 NODE_ENV:z.enum(['development','test','production']).default('development'),
 PORT:z.coerce.number().int().min(1).max(65535).default(5001),
 APP_ORIGIN:z.string().url(), DATABASE_URL:z.string().min(1),
 SUPABASE_URL:z.string().url(), SUPABASE_PUBLISHABLE_KEY:z.string().min(10),
 SESSION_KEY:z.string().regex(/^[a-f0-9]{64}$/i),
 TOSS_SECRET_KEY:z.string().default(''), TOSS_CLIENT_KEY:z.string().default(''),
 PAYMENTS_ENABLED:z.enum(['true','false']).default('false'),
 SUPABASE_SECRET_KEY:z.string().default(''), MEDIA_BUCKET:z.string().default('product-media'),
});
export type Config=z.infer<typeof schema>;
export function config(env:NodeJS.ProcessEnv=process.env):Config {
 const result=schema.safeParse(env);
 if(!result.success) throw new Error(`Missing/invalid configuration: ${result.error.issues.map(i=>i.path.join('.')).join(', ')}`);
 const c=result.data;
 if(c.NODE_ENV==='production' && !c.APP_ORIGIN.startsWith('https://')) throw new Error('Production requires HTTPS');
 if(c.NODE_ENV!=='production' && c.TOSS_SECRET_KEY.startsWith('live_')) throw new Error('Live payment keys forbidden outside production');
 if(c.PAYMENTS_ENABLED==='true' && (!c.TOSS_SECRET_KEY || !c.TOSS_CLIENT_KEY)) throw new Error('Payment keys required');
 return c;
}
