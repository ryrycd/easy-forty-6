import { json, CORS } from '../../../lib/validation.js';
import { getLinks } from '../../../lib/store.js';

function requireAdmin(request, env){
  const k = request.headers.get('X-ADMIN-KEY') || '';
  if (!k || k !== env.ADMIN_KEY) throw new Error('unauthorized');
}

export async function onRequestOptions() { return new Response(null, { status: 204, headers: CORS }); }

export async function onRequestGet(context){
  try{
    requireAdmin(context.request, context.env);
    const links = await getLinks(context.env.DB);
    return json({ links });
  }catch(e){ return json({ error: e.message }, 401); }
}
