import { json } from './validation.js';

export async function getSetting(DB,key,def=''){ const r = await DB.prepare('SELECT value FROM settings WHERE key=?').bind(key).first(); return r?.value ?? def; }
export async function setSetting(DB,key,value){ await DB.prepare('INSERT OR REPLACE INTO settings(key,value) VALUES (?,?)').bind(key,String(value)).run(); }

export async function migrate(DB){
  // Attempt to add new columns if missing
  const cols = (await DB.prepare("PRAGMA table_info(links)").all()).results?.map(r=>r.name)||[];
  async function add(col,def){ try{ await DB.prepare(`ALTER TABLE links ADD COLUMN ${col} ${def}`).run(); }catch(e){} }
  if(!cols.includes('weekly_target')) await add('weekly_target','INTEGER NOT NULL DEFAULT 0');
  if(!cols.includes('valid_until')) await add('valid_until','TEXT');
  if(!cols.includes('note')) await add('note','TEXT');
}

export async function getLinks(DB){
  await migrate(DB);
  const { results } = await DB.prepare('SELECT * FROM links ORDER BY position ASC, id ASC').all();
  return results||[];
}
export async function pickActiveLink(DB){
  await migrate(DB);
  const { results } = await DB.prepare('SELECT * FROM links WHERE active=1 AND assigned_count < cap ORDER BY position ASC, id ASC LIMIT 1').all();
  return results?.[0]||null;
}
export async function assignLink(DB, userId, linkId){
  await DB.prepare('UPDATE links SET assigned_count=assigned_count+1 WHERE id=?').bind(linkId).run();
  const info = await DB.prepare('INSERT INTO assignments(user_id,link_id,status) VALUES (?,?,?)').bind(userId,linkId,'assigned').run();
  return info.lastRowId;
}
export async function completeAssignment(DB, assignmentId){
  await DB.prepare('UPDATE assignments SET status="completed", completed_at=datetime("now") WHERE id=?').bind(assignmentId).run();
  await DB.prepare('UPDATE links SET completed_count=completed_count+1 WHERE id=(SELECT link_id FROM assignments WHERE id=?)').bind(assignmentId).run();
}
export async function setLinkSent(DB, assignmentId){
  await DB.prepare('UPDATE assignments SET link_sent_at=datetime("now"), status="link_sent" WHERE id=?').bind(assignmentId).run();
}
export async function setReminderId(DB, assignmentId, msgId){
  await DB.prepare('UPDATE assignments SET scheduled_msg_id=? WHERE id=?').bind(msgId, assignmentId).run();
}
export async function getUserByPhone(DB, phone){ return await DB.prepare('SELECT * FROM users WHERE phone=?').bind(phone).first(); }
export async function getAssignmentByUser(DB, userId){ return await DB.prepare('SELECT * FROM assignments WHERE user_id=? ORDER BY id DESC LIMIT 1').bind(userId).first(); }
export async function createUser(DB, obj){
  await DB.prepare('INSERT OR IGNORE INTO users(phone,status,payout,handle,zelle,consent) VALUES (?,?,?,?,?,?)')
    .bind(obj.phone,obj.status||'',obj.payout||'',obj.handle||'',obj.zelle||'',obj.consent?1:0).run();
  return await DB.prepare('SELECT * FROM users WHERE phone=?').bind(obj.phone).first();
}
export async function saveEvent(DB, userId, type, data){
  await DB.prepare('INSERT INTO events(user_id,type,data) VALUES (?,?,?)').bind(userId||null, type, JSON.stringify(data||{})).run();
}
export async function storeProof(DB, assignmentId, r2key){
  await DB.prepare('INSERT INTO proofs(assignment_id,r2_key) VALUES (?,?)').bind(assignmentId, r2key).run();
}
