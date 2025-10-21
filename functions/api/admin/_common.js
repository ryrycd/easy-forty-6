import { json, CORS } from '../../../lib/validation.js';
export function requireAdmin(request, env){
  const k=request.headers.get('X-ADMIN-KEY')||request.headers.get('x-admin-key')||'';
  if(!k || k!==env.ADMIN_KEY) throw new Error('unauthorized');
}
export async function onRequestOptions(){ return new Response(null,{status:204,headers:CORS}); }
