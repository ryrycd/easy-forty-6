import { json } from '../../../lib/validation.js';
import { requireAdmin } from './_common.js';
import { getLinks } from '../../../lib/store.js';

export async function onRequestGet({ request, env }){
  try{
    requireAdmin(request, env);
    const links = await getLinks(env.DB);
    return json({ links });
  }catch(e){ return json({ error:e.message }, 401); }
}
export { onRequestOptions } from './_common.js';
