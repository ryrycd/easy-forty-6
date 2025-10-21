(()=>{
  const keyEl = document.getElementById('adminkey');
  const msg = (t)=>{const m=document.getElementById('msg');m.textContent=t; setTimeout(()=>m.textContent='',2000)};
  const err = (t)=>{const m=document.getElementById('err');m.textContent=t; setTimeout(()=>m.textContent='',3000)};
  const hdrs = ()=>({'Content-Type':'application/json','X-ADMIN-KEY':localStorage.getItem('ak')||''});
  const $links = document.getElementById('links');
  const render = async ()=>{
    keyEl.value = localStorage.getItem('ak')||'';
    try{
      const r = await fetch('/api/admin/links', {headers: hdrs()});
      if(!r.ok) throw new Error('auth?');
      const j = await r.json();
      $links.innerHTML = '';
      j.links.sort((a,b)=>a.position-b.position).forEach(row=>{
        const wrap = document.createElement('div'); wrap.className='notice';
        wrap.innerHTML = `<div><strong>${row.url}</strong><br/><span class="small">cap ${row.cap} • assigned ${row.assigned_count} • completed ${row.completed_count} • active ${row.active?'yes':'no'}</span></div>`;
        const rowBtns = document.createElement('div'); rowBtns.className='row';
        const mk = (txt,cls,fn)=>{const b=document.createElement('button'); b.className='btn '+(cls||'secondary'); b.textContent=txt; b.onclick=fn; return b;}
        rowBtns.append(
          mk('Up','secondary',()=>update(row.id,{move:'up'})),
          mk('Down','secondary',()=>update(row.id,{move:'down'})),
          mk(row.active?'Deactivate':'Activate','secondary',()=>update(row.id,{active:!row.active})),
          mk('Reset Uses','secondary',()=>update(row.id,{reset:true})),
          mk('Delete','secondary',()=>del(row.id))
        );
        wrap.append(rowBtns);
        $links.append(wrap);
      });
    }catch(e){ err(e.message); }
  };
  async function update(id, body){
    const r = await fetch('/api/admin/links/'+id,{method:'PUT',headers:hdrs(),body:JSON.stringify(body)});
    if(!r.ok) return err('update failed');
    msg('updated'); render();
  }
  async function del(id){
    const r = await fetch('/api/admin/links/'+id,{method:'DELETE',headers:hdrs()});
    if(!r.ok) return err('delete failed');
    msg('deleted'); render();
  }
  document.getElementById('save').onclick=()=>{localStorage.setItem('ak', keyEl.value||''); msg('saved'); render();}
  document.getElementById('freeze').onclick=async()=>{const r=await fetch('/api/admin/freeze',{method:'POST',headers:hdrs()}); if(!r.ok) return err('freeze failed'); msg('toggled');}
  document.getElementById('export').onclick=async()=>{const r=await fetch('/api/admin/export',{headers:hdrs()}); if(!r.ok){err('export failed');return} const csv=await r.text(); const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='easyforty-export.csv'; a.click();}
  document.getElementById('reset').onclick=async()=>{const r=await fetch('/api/admin/reset',{method:'POST',headers:hdrs()}); if(!r.ok) return err('reset failed'); msg('reset'); render();}
  document.getElementById('add').onclick=async()=>{
    const url = document.getElementById('newurl').value.trim();
    const cap = parseInt(document.getElementById('newcap').value,10)||50;
    const r = await fetch('/api/admin/links',{method:'POST',headers:hdrs(),body:JSON.stringify({url,cap})});
    if(!r.ok) return err('add failed');
    msg('added'); document.getElementById('newurl').value=''; render();
  };

  render();
})();