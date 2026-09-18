import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql, type SQL } from 'drizzle-orm';
export { sql };
export interface Database {
 rows<T=Record<string,any>>(query:SQL):Promise<T[]>;
 transaction<T>(fn:(db:Database)=>Promise<T>):Promise<T>;
}
export function database(url:string) {
 const client=postgres(url,{max:8,prepare:false,idle_timeout:20,connect_timeout:10,
  connection:{statement_timeout:15000,lock_timeout:5000,idle_in_transaction_session_timeout:20000}});
 const orm=drizzle(client);
 const wrap=(db:any):Database=>({ rows:async<T>(q:SQL)=>Array.from(await db.execute(q)) as T[],
  transaction:fn=>db.transaction((tx:any)=>fn(wrap(tx))) });
 return {db:wrap(orm),close:()=>client.end({timeout:5})};
}
