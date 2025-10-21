(()=>{
  const $=s=>document.querySelector(s);
  const tbody = $("#tbody");
  const toast = (t,ok)=>{ const n=$("#toast"); n.textContent=t; n.classList.add('show'); setTimeout(()=>n.classList.remove('show'),1800); };
  const key = ()=> localStorage.getItem('ak') || $("#adminkey").value.trim();
  const hdrs = ()=>({'Content-Type':'application/json','X-ADMIN-KEY': key()});
  const S=[]; // state list of links

  function num(n){ return Number(n||0) }
  const fmt = n => new Intl.NumberFormat().format(n||0);

  function row(r,i){
    const tr=document.createElement('tr');
    tr.className='drag'; tr.draggable=true; tr.dataset.id=r.id; tr.dataset.idx=i;
    tr.innerHTML = `
      <td class="handle">⋮⋮</td>
      <td class="mono">${i+1}</td>
      <td><input class="input url" value="${r.url||''}" placeholder="https://..."></td>
      <td><input class="input weekly" type="number" min="0" step="1" value="${r.weekly_target??0}" style="width:110px"></td>
      <td><input class="input cap" type="number" min="1" step="1" value="${r.cap??50}" style="width:90px"></td>
      <td><input class="input valid" type="date" value="${(r.valid_until||'').slice(0,10)}" style="width:160px"></td>
      <td><input class="input note" value="${r.note||''}" placeholder="optional"></td>
      <td class="mono" style="text-align:center">${fmt(r.assigned_count||0)}</td>
      <td class="mono" style="text-align:center">${fmt(r.completed_count||0)}</td>
      <td style="text-align:center"><input class="switch active" type="checkbox" ${r.active? 'checked':''}></td>
      <td><button class="btn ghost del">Delete</button></td>
    `;
    return tr;
  }

  function renderTotals(){
    const used = S.reduce((a,b)=>a+num(b.assigned_count||0),0);
    const quota= S.reduce((a,b)=>a+num(b.weekly_target||0),0);
    $("#totals").innerHTML = `<div class="kv">
      <div>Total assigned: <span class="mono">${fmt(used)}</span></div>
      <div>Total weekly target: <span class="mono">${fmt(quota)}</span></div>
    </div>`;
  }

  function render(){
    tbody.innerHTML='';
    S.forEach((r,i)=>tbody.appendChild(row(r,i)));
    renderTotals();
  }

  function idxOfId(id){ return S.findIndex(x=> String(x.id)===String(id)); }

  // Drag & drop reorder (client side; send order with Apply order)
  let dragId=null;
  tbody.addEventListener('dragstart', e=>{ const tr=e.target.closest('tr'); if(!tr) return; dragId=tr.dataset.id; });
  tbody.addEventListener('dragover', e=>e.preventDefault());
  tbody.addEventListener('drop', e=>{
    e.preventDefault();
    const tr=e.target.closest('tr'); if(!tr||!dragId) return;
    const dropId=tr.dataset.id;
    const a=idxOfId(dragId), b=idxOfId(dropId);
    if(a<0||b<0||a===b) return;
    const [m]=S.splice(a,1); S.splice(b,0,m); render();
  });

  tbody.addEventListener('input', async (e)=>{
    const tr=e.target.closest('tr'); if(!tr) return;
    const id=tr.dataset.id;
    const i=idxOfId(id); const r=S[i];
    if(e.target.classList.contains('url')) r.url=e.target.value.trim();
    if(e.target.classList.contains('weekly')) r.weekly_target=num(e.target.value);
    if(e.target.classList.contains('cap')) r.cap=num(e.target.value);
    if(e.target.classList.contains('valid')) r.valid_until=e.target.value||null;
    if(e.target.classList.contains('note')) r.note=e.target.value;
  });

  tbody.addEventListener('change', async (e)=>{
    const tr=e.target.closest('tr'); if(!tr) return;
    const id=tr.dataset.id; const i=idxOfId(id); const r=S[i];
    if(e.target.classList.contains('active')){
      r.active = e.target.checked?1:0;
      const res = await fetch('/api/admin/links/'+id,{method:'PUT',headers:hdrs(),body:JSON.stringify({active:!!r.active})});
      if(!res.ok) toast('Failed to toggle active');
    }
  });

  tbody.addEventListener('click', async (e)=>{
    if(e.target.classList.contains('del')){
      const tr=e.target.closest('tr'); const id=tr.dataset.id;
      if(!confirm('Delete this link?')) return;
      const res = await fetch('/api/admin/links/'+id,{method:'DELETE',headers:hdrs()});
      if(!res.ok){ toast('Delete failed'); return; }
      const i=idxOfId(id); S.splice(i,1); render(); toast('Deleted',true);
    }
  });

  // Controls
  $("#saveKey").onclick = ()=>{ localStorage.setItem('ak',$("#adminkey").value.trim()); toast('Saved'); };
  $("#reload").onclick = load;
  $("#exportCSV").onclick = async ()=>{
    const res = await fetch('/api/admin/export',{headers:hdrs()});
    if(!res.ok){ toast('Export failed'); return; }
    const text = await res.text();
    const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type:'text/csv'})); a.download='easyforty.csv'; a.click();
  };
  $("#freeze").onclick = async ()=>{ const r=await fetch('/api/admin/freeze',{method:'POST',headers:hdrs()}); toast(r.ok?'Toggled freeze':'Freeze failed', r.ok); };

  $("#addRow").onclick = async ()=>{
    const res = await fetch('/api/admin/links',{method:'POST',headers:hdrs(),body:JSON.stringify({url:'',cap:50,weekly_target:0})});
    if(!res.ok){ toast('Add failed'); return; }
    await load();
  };

  $("#bulkWeekly").onclick = async ()=>{
    const v = prompt('Set weekly target for all links to:');
    if(v===null) return;
    const n = Number(v);
    if(!(n>=0)){ toast('Enter a valid number'); return; }
    const res = await fetch('/api/admin/bulk-weekly',{method:'POST',headers:hdrs(),body:JSON.stringify({weekly_target:n})});
    toast(res.ok?'Saved':'Failed', res.ok);
    if(res.ok) await load();
  };

  $("#applyOrder").onclick = async ()=>{
    const ids = S.map(x=>x.id);
    const res = await fetch('/api/admin/reorder',{method:'POST',headers:hdrs(),body:JSON.stringify({ids})});
    toast(res.ok?'Order saved':'Order failed', res.ok);
  };

  $("#resetCounts").onclick = async ()=>{
    const r = await fetch('/api/admin/reset',{method:'POST',headers:hdrs()});
    toast(r.ok?'Counts reset':'Reset failed', r.ok);
    if(r.ok) await load();
  };

  async function load(){
    const res = await fetch('/api/admin/links',{headers:hdrs()});
    if(!res.ok){ toast('Auth failed'); return; }
    const j = await res.json();
    S.length=0;
    (j.links||[]).forEach(x=> S.push(x));
    render();
  }
  // Auto-load if key present
  const ak=localStorage.getItem('ak'); if(ak) $("#adminkey").value=ak;
  load();
})();