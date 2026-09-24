import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import pg from 'pg';

export const schema=`
CREATE TABLE IF NOT EXISTS streamers (id TEXT PRIMARY KEY, name TEXT NOT NULL, verified INTEGER NOT NULL DEFAULT 0, credentials TEXT, created_at BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, streamer_id TEXT NOT NULL REFERENCES streamers(id), expires_at BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS oauth_states (id TEXT PRIMARY KEY, expires_at BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS games (id TEXT PRIMARY KEY, streamer_id TEXT NOT NULL REFERENCES streamers(id), case_id TEXT NOT NULL, status TEXT NOT NULL, created_at BIGINT NOT NULL, finished_at BIGINT, lock_until BIGINT NOT NULL DEFAULT 0, operation_id TEXT, final_answer TEXT, report TEXT, score INTEGER, grade TEXT, UNIQUE(streamer_id,case_id));
CREATE UNIQUE INDEX IF NOT EXISTS one_active_game ON games(streamer_id) WHERE status <> 'completed';
CREATE TABLE IF NOT EXISTS questions (id TEXT PRIMARY KEY, game_id TEXT NOT NULL REFERENCES games(id), request_id TEXT NOT NULL, question TEXT NOT NULL, verdict TEXT NOT NULL, created_at BIGINT NOT NULL, UNIQUE(game_id,request_id));
CREATE TABLE IF NOT EXISTS attempts (id TEXT PRIMARY KEY, game_id TEXT NOT NULL REFERENCES games(id), request_id TEXT NOT NULL, answer TEXT NOT NULL, correct INTEGER NOT NULL, report TEXT NOT NULL, created_at BIGINT NOT NULL, UNIQUE(game_id,request_id));
CREATE INDEX IF NOT EXISTS attempts_game ON attempts(game_id,created_at);
CREATE INDEX IF NOT EXISTS games_streamer ON games(streamer_id,created_at);
CREATE INDEX IF NOT EXISTS questions_game ON questions(game_id,created_at);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
`;

export async function openDatabase({url=process.env.DATABASE_URL,filename=process.env.SQLITE_PATH||'data/profiler.sqlite'}={}) {
  if(url){
    const pool=new pg.Pool({connectionString:url,max:10});
    const api=client=>({all:async(sql,p=[])=> (await client.query(sql,p)).rows,one:async(sql,p=[])=> (await client.query(sql,p)).rows[0],run:async(sql,p=[])=>({changes:(await client.query(sql,p)).rowCount})});
    await pool.query(schema);
    return {...api(pool),kind:'postgres',async transaction(fn){const c=await pool.connect();try{await c.query('BEGIN');const r=await fn(api(c));await c.query('COMMIT');return r}catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}},close:()=>pool.end()};
  }
  if(process.env.NODE_ENV==='production')throw new Error('DATABASE_URL is required in production');
  if(filename!==':memory:')fs.mkdirSync(path.dirname(filename),{recursive:true});
  const db=new DatabaseSync(filename);db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;');db.exec(schema);
  const prep=(sql,p)=>({stmt:db.prepare(sql.replace(/\$(\d+)/g,'?')),params:[...sql.matchAll(/\$(\d+)/g)].map(m=>p[Number(m[1])-1])});
  const raw={all:async(sql,p=[])=>{const x=prep(sql,p);return x.stmt.all(...x.params)},one:async(sql,p=[])=>{const x=prep(sql,p);return x.stmt.get(...x.params)},run:async(sql,p=[])=>{const x=prep(sql,p);return x.stmt.run(...x.params)}};
  // Queue all operations so unrelated requests cannot enter an async transaction.
  let queue=Promise.resolve();const serial=fn=>{const r=queue.then(fn);queue=r.catch(()=>{});return r};
  return {kind:'sqlite',all:(...a)=>serial(()=>raw.all(...a)),one:(...a)=>serial(()=>raw.one(...a)),run:(...a)=>serial(()=>raw.run(...a)),transaction:fn=>serial(async()=>{db.exec('BEGIN IMMEDIATE');try{const result=await fn(raw);db.exec('COMMIT');return result}catch(e){db.exec('ROLLBACK');throw e}}),close:()=>serial(()=>db.close())};
}
