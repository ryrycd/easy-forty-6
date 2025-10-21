import { json, CORS } from '../../../lib/validation.js';

function requireAdmin(request, env){
  const k = request.headers.get('X-ADMIN-KEY') || '';
  if (!k || k !== env.ADMIN_KEY) throw new Error('unauthorized');
}

export async function onRequestOptions() { return new Response(null, { status: 204, headers: CORS }); }

export async function onRequestPost(context){
  try{
    requireAdmin(context.request, context.env);
    const body = await context.request.json();
    const cap = Math.max(1, Number(body.cap||50));
    await context.env.DB.prepare('INSERT INTO links(url,cap,position) VALUES (?,?, (SELECT COALESCE(MAX(position),0)+1 FROM links))').bind(body.url, cap).run();
    return json({ ok:true });
  }catch(e){ return json({ error: e.message }, 401); }
}
