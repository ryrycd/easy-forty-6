import { json, CORS } from '../../../lib/validation.js';
import { setSetting } from '../../../lib/store.js';

function requireAdmin(request, env){
  const k = request.headers.get('X-ADMIN-KEY') || '';
  if (!k || k !== env.ADMIN_KEY) throw new Error('unauthorized');
}

export async function onRequestOptions() { return new Response(null, { status: 204, headers: CORS }); }

export async function onRequestPost(context){
  try{
    requireAdmin(context.request, context.env);
    await context.env.DB.prepare('UPDATE links SET assigned_count=0, completed_count=0').run();
    await setSetting(context.env.DB,'last_reset', new Date().toISOString());
    return json({ ok:true });
  }catch(e){ return json({ error: e.message }, 401); }
}
