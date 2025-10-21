(()=>{
  const el=(t,p={},...k)=>{const e=document.createElement(t);Object.assign(e,p);k.flat().forEach(x=>e.append(x?.nodeType?x:document.createTextNode(x)));return e;}
  const $ = s=>document.querySelector(s);
  const form = $("#form");
  const toast = (t)=>{let n=$(".toast"); if(!n){n=el('div',{className:'toast'}); document.body.append(n)} n.textContent=t; n.classList.add('show'); setTimeout(()=>n.classList.remove('show'),2200);};
  const E164 = s=>{const d=(s||'').replace(/\D/g,''); if(d.length===10) return '+1'+d; if(d.length>10 && s.startsWith('+')) return s; if(d.length===11&&d[0]==='1') return '+'+d; return null;}
  const mask=(s)=>{const d=(s||'').replace(/\D/g,''); if(!d) return ''; if(d.length<=3) return `(${d}`; if(d.length<=6) return `(${d.slice(0,3)}) ${d.slice(3)}`; return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6,10)}`;};

  const state={ step:1, phone:'', consent:false, status:'', payout:'', handle:'', zelleSame:'yes', zelleAlt:'', hp:'' };

  const progress = ()=> ((state.step-1)/4*100)|0;
  const setProgress = ()=> { const p=$('.progress>div'); if(p) p.style.width=progress()+'%'; };

  const Step1=()=>{
    const ph = el('input',{className:'input',placeholder:'(555) 555‑5555',value:state.phone,inputMode:'tel',type:'tel',autocomplete:'tel',oninput:e=>{ e.target.value=mask(e.target.value); state.phone=e.target.value; msg.textContent=''; ph.classList.remove('err'); }});
    const msg = el('div',{className:'errmsg'});
    return el('div',{className:'step group'},
      el('div',{className:'header'}, el('div',{className:'logo'}), el('h1',{className:'h1'},'Easy Forty — $40 for new Acorns users')),
      el('p',{className:'sub'},'We text you a unique link, you complete a $5 deposit, send a screenshot, and we pay you via Venmo or Zelle.'),
      el('div',{className:'progress'}, el('div')),
      el('span',{className:'badge'},'Step 1 of 4'),
      el('label',{}, 'Your mobile number', el('span',{className:'cap'},'US numbers only.')), ph, msg,
      el('div',{className:'row'},
        el('button',{className:'btn ghost',onclick:()=>{window.location.href='/faq.html'}},'FAQ'),
        el('button',{className:'btn primary',onclick:()=>{
          const e164=E164(state.phone);
          if(!e164){ msg.textContent='Enter a valid US mobile number.'; ph.classList.add('err'); return; }
          state.step=2; render();
        }},'Continue')
      )
    );
  };

  const Step2=()=>{
    const msg = el('div',{className:'errmsg'});
    const seg = el('div',{className:'seg'},
      el('button',{className: state.consent?'active':'', onclick:()=>{state.consent=true; [...seg.children].forEach((b,i)=>b.classList.toggle('active',i===0)); msg.textContent='';}},'Yes, you can text me'),
      el('button',{className: !state.consent?'active':'', onclick:()=>{state.consent=false; [...seg.children].forEach((b,i)=>b.classList.toggle('active',i===1));}},'No')
    );
    return el('div',{className:'step group'},
      el('div',{className:'header'}, el('div',{className:'logo'}), el('h1',{className:'h1'},'Can we text you instructions?')),
      el('p',{className:'sub'},'You’ll receive a few messages to guide you. Reply STOP to opt out, HELP for help.'),
      el('div',{className:'progress'}, el('div')),
      el('span',{className:'badge'},'Step 2 of 4'),
      seg, msg,
      el('small',{},'By continuing you agree to receive SMS related to this referral. Msg&data rates may apply. Recurring msgs.'),
      el('div',{className:'row'},
        el('button',{className:'btn ghost',onclick:()=>{state.step=1; render();}},'Back'),
        el('button',{className:'btn primary',onclick:()=>{
          if(!state.consent){ msg.textContent='You need to consent to receive SMS to continue.'; return; }
          state.step=3; render();
        }},'Continue')
      )
    );
  };

  const Step3=()=>{
    const makeBtn=(v,txt)=> el('button',{className:'btn '+(state.status===v?'primary':'ghost'),onclick:()=>{state.status=v; render();}},txt);
    const msg = el('div',{className:'errmsg'});
    return el('div',{className:'step group'},
      el('div',{className:'header'}, el('div',{className:'logo'}), el('h1',{className:'h1'},'Have you ever created an Acorns account?')),
      el('p',{className:'sub'},'Eligibility requires being a new Acorns user.'),
      el('div',{className:'progress'}, el('div')),
      el('span',{className:'badge'},'Step 3 of 4'),
      el('div',{className:'row'}, makeBtn('no','No'), makeBtn('unsure','Not sure'), makeBtn('yes','Yes')),
      state.status==='yes' ? el('div',{className:'hint'},'Thanks! This offer is for new users only—you can still share the link.') : null,
      msg,
      el('div',{className:'row'},
        el('button',{className:'btn ghost',onclick:()=>{state.step=2;render();}},'Back'),
        el('button',{className:'btn primary',onclick:()=>{
          if(!state.status){ msg.textContent='Please choose an option.'; return; }
          if(state.status==='yes'){ msg.textContent='This offer is for new users only.'; return; }
          state.step=4; render();
        }},'Continue')
      )
    );
  };

  const Step4=()=>{
    const msg = el('div',{className:'errmsg'});
    const setP = (p)=>{state.payout=p; render();}
    const seg = el('div',{className:'seg'},
      el('button',{className: state.payout==='venmo'?'active':'', onclick:()=>setP('venmo')},'Venmo'),
      el('button',{className: state.payout==='zelle'?'active':'', onclick:()=>setP('zelle')},'Zelle')
    );
    const ven = el('input',{className:'input',placeholder:'@yourhandle',value:state.handle,oninput:e=>{state.handle=e.target.value; msg.textContent='';}});
    const zSame = el('div',{className:'seg'},
      el('button',{className: state.zelleSame==='yes'?'active':'', onclick:()=>{state.zelleSame='yes'; render();}},'Zelle = my phone'),
      el('button',{className: state.zelleSame==='no'?'active':'', onclick:()=>{state.zelleSame='no'; render();}},'Use different email/phone')
    );
    const zAlt = el('input',{className:'input',placeholder:'email or phone',value:state.zelleAlt,oninput:e=>{state.zelleAlt=e.target.value}});
    return el('div',{className:'step group'},
      el('div',{className:'header'}, el('div',{className:'logo'}), el('h1',{className:'h1'},'How should we pay you?')),
      el('div',{className:'progress'}, el('div')),
      el('span',{className:'badge'},'Step 4 of 4'),
      seg,
      state.payout==='venmo' ? el('label',{}, 'Your Venmo @handle', el('span',{className:'cap'},'Example: @janedoe'), ven) : null,
      state.payout==='zelle' ? el('div',{}, zSame, state.zelleSame==='no'? el('label',{}, 'Zelle email/phone', zAlt): null) : null,
      msg,
      el('div',{className:'row'},
        el('button',{className:'btn ghost',onclick:()=>{state.step=3; render();}},'Back'),
        el('button',{className:'btn primary',onclick:async()=>{
          const e164=E164(state.phone);
          if(!e164) return toast('Phone missing or invalid.');
          if(!state.payout) return toast('Choose Venmo or Zelle.');
          if(state.payout==='venmo' && !/^@?\w{3,30}$/.test(state.handle||'')) return toast('Enter a valid Venmo handle.');
          if(state.payout==='zelle' && state.zelleSame==='no' && !state.zelleAlt) return toast('Enter your Zelle email/phone.');
          const payload={
            phone:e164, status:state.status, payout:state.payout,
            handle: state.payout==='venmo' ? (state.handle.startsWith('@')?state.handle:`@${state.handle}`):null,
            zelle: state.payout==='zelle' ? (state.zelleSame==='yes'?'same':state.zelleAlt):null,
            consent: !!state.consent, honeypot: state.hp||''
          };
          try{
            const r = await fetch('/api/intake',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
            const j = await r.json().catch(()=>({}));
            if(!r.ok) throw new Error(j.error||'Something went wrong.');
            window.location.href='/thanks.html';
          }catch(e){ toast(e.message); }
        }},'Submit')
      )
    );
  };

  function render(){
    form.innerHTML='';
    form.append(
      el('div',{className:'progress'}, el('div')),
      [Step1,Step2,Step3,Step4][state.step-1]()
    );
    setProgress();
  }
  render();
})();