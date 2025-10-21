import { json } from './validation.js';

export async function getSetting(DB,key, def=''){
  const r = await DB.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first();
  return r?.value ?? def;
}
export async function setSetting(DB,key,value){
  await DB.prepare('INSERT OR REPLACE INTO settings(key,value) VALUES (?,?)').bind(key,String(value)).run();
}

export async function getLinks(DB){
  const { results } = await DB.prepare('SELECT * FROM links ORDER BY position ASC, id ASC').all();
  return results || [];
}

export async function pickActiveLink(DB){
  const { results } = await DB.prepare('SELECT * FROM links WHERE active=1 AND assigned_count < cap ORDER BY position ASC, id ASC LIMIT 1').all();
  return results?.[0] || null;
}

export async function assignLink(DB, userId, linkId){
  await DB.prepare('UPDATE links SET assigned_count = assigned_count + 1 WHERE id=?').bind(linkId).run();
  const info = await DB.prepare('INSERT INTO assignments(user_id,link_id,status) VALUES (?,?,?)').bind(userId, linkId, 'assigned').run();
  return info.lastRowId;
}

export async function completeAssignment(DB, assignmentId){
  await DB.prepare('UPDATE assignments SET status="completed", completed_at = datetime("now") WHERE id=?').bind(assignmentId).run();
  await DB.prepare('UPDATE links SET completed_count = completed_count + 1 WHERE id = (SELECT link_id FROM assignments WHERE id=?)').bind(assignmentId).run();
}

export async function setAssignmentStatus(DB, assignmentId, status){
  await DB.prepare('UPDATE assignments SET status=? WHERE id=?').bind(status, assignmentId).run();
}

export async function setReminderId(DB, assignmentId, msgId){
  await DB.prepare('UPDATE assignments SET scheduled_msg_id=? WHERE id=?').bind(msgId, assignmentId).run();
}

export async function setLinkSent(DB, assignmentId){
  await DB.prepare('UPDATE assignments SET link_sent_at = datetime("now"), status="link_sent" WHERE id=?').bind(assignmentId).run();
}

export async function getUserByPhone(DB, phone){
  return await DB.prepare('SELECT * FROM users WHERE phone=?').bind(phone).first();
}

export async function getAssignmentByUser(DB, userId){
  return await DB.prepare('SELECT * FROM assignments WHERE user_id=? ORDER BY id DESC LIMIT 1').bind(userId).first();
}

export async function createUser(DB, {phone,status,payout,handle,zelle,consent}){
  const info = await DB.prepare('INSERT OR IGNORE INTO users(phone,status,payout,handle,zelle,consent) VALUES (?,?,?,?,?,?)')
    .bind(phone,status,payout,handle,zelle,consent?1:0).run();
  // If exists, fetch id
  const u = await DB.prepare('SELECT * FROM users WHERE phone=?').bind(phone).first();
  return u;
}

export async function saveEvent(DB, userId, type, data){
  await DB.prepare('INSERT INTO events(user_id,type,data) VALUES (?,?,?)').bind(userId||null, type, JSON.stringify(data||{})).run();
}

export async function storeProof(DB, assignmentId, r2key){
  await DB.prepare('INSERT INTO proofs(assignment_id,r2_key) VALUES (?,?)').bind(assignmentId, r2key).run();
}

export async function weeklyResetIfNeeded(DB){
  const last = await getSetting(DB,'last_reset','1970-01-01');
  const lastD = new Date(last+'Z');
  const now = new Date();
  // If it's Monday and last reset earlier than today
  const isMonday = now.getUTCDay()===1;
  const lastDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (isMonday && lastD < lastDay) {
    await DB.prepare('UPDATE links SET assigned_count=0, completed_count=0').run();
    await setSetting(DB,'last_reset', now.toISOString());
    return true;
  }
  return false;
}
