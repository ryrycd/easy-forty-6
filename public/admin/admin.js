(()=>{
  const H = () => ({ 'Content-Type':'application/json', 'X-ADMIN-KEY': (document.getElementById('adminkey').value||'').trim() || localStorage.getItem('ak') || '' , 'X-Admin-Key': (document.getElementById('adminkey').value||'').trim() || localStorage.getItem('ak') || ''});
  const $tbody = document.getElementById('tbody');
  const $msg = document.getElementById('msg');
  const $err = document.getElementById('err');
  const rows = [];

  function status(msg, good=true){
    if(good){ $err.hidden=true; $msg.textContent=msg||''; }
    else { $msg.textContent=''; $err.textContent=msg||'Error'; $err.hidden=false; }
  }

  function fmt(n){ return new Intl.NumberFormat().format(n||0); }
  function calcTotals(){
    const used = rows.reduce((a,b)=>a+(+b.assigned_count||0),0);
    const weekly = rows.reduce((a,b)=>a+(+b.weekly_target||0),0);
    document.getElementById('totUsed').textContent = fmt(used);
    document.getElementById('totWeekly').textContent = fmt(weekly);
  }

  function tr(r, i){
    const tr = document.createElement('tr'); tr.draggable = true; tr.dataset.id = r.id;
    tr.innerHTML = `
      <td class="handle">⋮⋮</td>
      <td>${i+1}</td>
      <td><input class="url input" value="${r.url||''}" /></td>
      <td><input class="weekly input" type="number" min="0" value="${r.weekly_target||0}" /></td>
      <td><input class="valid input" type="date" value="${(r.valid_until||'').slice(0,10)}" /></td>
      <td><input class="note input" value="${r.note||''}" /></td>
      <td style="text-align:center">${fmt(r.assigned_count||0)}</td>
      <td style="text-align:center">${fmt(r.completed_count||0)}</td>
      <td><button class="btn secondary toggle">${r.active? 'Active' : 'Inactive'}</button></td>
      <td><button class="btn secondary del">Delete</button></td>
    `;
    return tr;
  }

  function render(){
    $tbody.innerHTML='';
    rows.forEach((r,i)=> $tbody.appendChild(tr(r,i)));
    calcTotals();
  }

  // Drag-and-drop reorder
  let dragId=null;
  $tbody.addEventListener('dragstart', e=> {
    const tr = e.target.closest('tr'); if(!tr) return;
    dragId = tr.dataset.id;
    e.dataTransfer.effectAllowed='move';
  });
  $tbody.addEventListener('dragover', e=> e.preventDefault());
  $tbody.addEventListener('drop', async e=> {
    e.preventDefault();
    const target = e.target.closest('tr'); if(!target || !dragId) return;
    const dropId = target.dataset.id;
    if(dropId===dragId) return;
    const from = rows.findIndex(x=> String(x.id)===String(dragId));
    const to = rows.findIndex(x=> String(x.id)===String(dropId));
    const [moved] = rows.splice(from,1);
    rows.splice(to,0,moved);
    render();
    // Persist order
    await fetch('/api/admin/reorder', { method:'POST', headers:H(), body: JSON.stringify({ ids: rows.map(x=>x.id) }) });
    status('Order saved.');
  });

  $tbody.addEventListener('click', async (e)=>{
    const trEl = e.target.closest('tr'); if(!trEl) return;
    const id = Number(trEl.dataset.id);
    const row = rows.find(x=> x.id===id);
    if(e.target.classList.contains('toggle')){
      const now = !row.active;
      const r = await fetch('/api/admin/links/'+id,{ method:'PUT', headers:H(), body: JSON.stringify({ active: now }) });
      if(!r.ok) return status('Toggle failed',false);
      row.active = now; render();
    }
    if(e.target.classList.contains('del')){
      if(!confirm('Delete this link?')) return;
      const r = await fetch('/api/admin/links/'+id,{ method:'DELETE', headers:H() });
      if(!r.ok) return status('Delete failed',false);
      const idx = rows.findIndex(x=>x.id===id); rows.splice(idx,1); render();
    }
  });

  $tbody.addEventListener('input', async (e)=>{
    const trEl = e.target.closest('tr'); if(!trEl) return;
    const id = Number(trEl.dataset.id);
    const row = rows.find(x=> x.id===id);
    if(e.target.classList.contains('url')) row.url = e.target.value.trim();
    if(e.target.classList.contains('weekly')) row.weekly_target = Number(e.target.value||0);
    if(e.target.classList.contains('valid')) row.valid_until = e.target.value || null;
    if(e.target.classList.contains('note')) row.note = e.target.value;
    // Debounced save
    clearTimeout(row._t);
    row._t = setTimeout(async ()=>{
      const r = await fetch('/api/admin/links/'+id,{ method:'PUT', headers:H(), body: JSON.stringify({ url: row.url, weekly_target: row.weekly_target, valid_until: row.valid_until, note: row.note }) });
      status(r.ok? 'Saved.' : 'Save failed', r.ok);
    }, 500);
  });

  async function load(){
    status('Loading...');
    const r = await fetch('/api/admin/stats',{ headers: H() });
    if(!r.ok){ const t=await r.text(); return status(t||'Auth failed', false); }
    const j = await r.json();
    localStorage.setItem('ak', (document.getElementById('adminkey').value||'').trim());
    rows.length=0;
    (j.links||[]).forEach(x=> rows.push(x));
    render();
    status('Loaded.', true);
  }

  document.getElementById('load').onclick = load;
  document.getElementById('exportCSV').onclick = async ()=>{
    const r = await fetch('/api/admin/export',{ headers:H() });
    if(!r.ok) return status('Export failed',false);
    const csv = await r.text();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}));
    a.download = 'easyforty-export.csv';
    a.click();
  };
  document.getElementById('reset').onclick = async ()=>{
    const r = await fetch('/api/admin/config?action=resetNow',{ method:'POST', headers:H() });
    status(r.ok? 'Counts reset.' : 'Reset failed', r.ok);
    if(r.ok) load();
  };
  document.getElementById('freeze').onclick = async ()=>{
    const r = await fetch('/api/admin/freeze',{ method:'POST', headers:H() });
    status(r.ok? 'Freeze toggled.' : 'Freeze failed', r.ok);
  };
  document.getElementById('migrate').onclick = async ()=>{
    const r = await fetch('/api/admin/migrate',{ method:'POST', headers:H() });
    status(await r.text(), r.ok);
  };
  document.getElementById('bulkWeekly').onclick = async ()=>{
    const v = prompt('Set weekly target for ALL links to:');
    if(v===null) return;
    const n = Number(v);
    if(!(n>=0)) return status('Invalid number', false);
    const r = await fetch('/api/admin/bulk-target',{ method:'POST', headers:H(), body: JSON.stringify({ weekly_target: n }) });
    status(r.ok? 'Weekly targets updated.' : 'Bulk update failed', r.ok);
    if(r.ok) load();
  };
  document.getElementById('append').onclick = async ()=>{
    const url = prompt('Paste links separated by newlines. Optional: add |weekly|validYYYY-MM-DD');
    if(url===null) return;
    const arr = url.split(/\n+/).map(s=>{
      const [u,w,vd] = s.split('|').map(x=> (x||'').trim());
      return { url:u, weekly: Number(w||0), valid: vd||null };
    }).filter(x=>x.url);
    const r = await fetch('/api/admin/seed?mode=append',{ method:'POST', headers:H(), body: JSON.stringify(arr) });
    status(await r.text(), r.ok);
    if(r.ok) load();
  };
  document.getElementById('replace').onclick = async ()=>{
    if(!confirm('Replace ALL links with a new list?')) return;
    const url = prompt('Paste links separated by newlines. Optional: add |weekly|validYYYY-MM-DD');
    if(url===null) return;
    const arr = url.split(/\n+/).map(s=>{
      const [u,w,vd] = s.split('|').map(x=> (x||'').trim());
      return { url:u, weekly: Number(w||0), valid: vd||null };
    }).filter(x=>x.url);
    const r = await fetch('/api/admin/seed?mode=replace',{ method:'POST', headers:H(), body: JSON.stringify(arr) });
    status(await r.text(), r.ok);
    if(r.ok) load();
  };
  document.getElementById('add').onclick = async ()=>{
    const body = {
      url: document.getElementById('newurl').value.trim(),
      cap: Number(document.getElementById('newcap').value||50),
      weekly_target: Number(document.getElementById('newweekly').value||0),
      valid_until: document.getElementById('newvalid').value || null
    };
    if(!body.url) return status('Enter a URL', false);
    const r = await fetch('/api/admin/links',{ method:'POST', headers:H(), body: JSON.stringify(body) });
    if(!r.ok){ const t = await r.text(); return status(t||'Add failed', false); }
    status('Added!', true);
    document.getElementById('newurl').value='';
    load();
  };

  const saved = localStorage.getItem('ak'); if(saved){ document.getElementById('adminkey').value = saved; load(); }
})();

/* Save key on blur and auto-load */
document.getElementById('adminkey').addEventListener('blur', ()=>{
  const k = (document.getElementById('adminkey').value||'').trim();
  if(k){ localStorage.setItem('ak', k); }
});
