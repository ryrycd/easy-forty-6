(() => {
  const el = (t, props={}, ...kids) => {
    const e = document.createElement(t);
    Object.assign(e, props);
    kids.flat().forEach(k => e.append(k?.nodeType ? k : document.createTextNode(k)));
    return e;
  };
  const $app = document.getElementById('app');

  const state = {
    step: 1, phone: '', consent: false,
    status: '', payout: '', handle: '', zelleSame: 'yes', zelleAlt: ''
  };
  const steps = 5;
  const bar = () => ((state.step-1)/(steps-1)*100)|0;

  const e164 = (s)=>{
    const d = String(s||'').replace(/\D/g,'');
    if (d.length===10) return '+1'+d;
    if (d.length===11 && d.startsWith('1')) return '+'+d;
    if (/^\+\d{10,15}$/.test(s||'')) return s;
    return null;
  };

  const Seg = (opts, value, onPick) => {
    const wrap = el('div',{className:'segment fade-enter'});
    opts.forEach(o=> {
      const b = el('button',{className: (value===o.value?'active':''), onclick:()=>{ onPick(o.value) }} , o.label);
      wrap.append(b);
    });
    return wrap;
  };

  const Err = (id='err') => el('div',{id,className:'error',hidden:true});
  const showErr = (node,msg)=>{ node.textContent = msg; node.hidden=false; node.scrollIntoView({behavior:'smooth',block:'center'}); };
  const clearErr = (node)=>{ node.textContent=''; node.hidden=true; };

  const render = () => {
    $app.innerHTML='';
    const card = el('div',{className:'card'});
    card.append(
      el('div',{className:'badge'}, `Step ${state.step} of ${steps}`),
      el('h1',{className:'h'}, 'Easy Forty — $40 for new Acorns users'),
      el('p',{className:'p'}, 'Answer a few quick questions. We’ll text your unique link, you complete a $5 deposit, send a screenshot here, and we pay via Venmo or Zelle.'),
      el('div',{className:'progress'}, el('div',{style:`width:${bar()}%`}))
    );

    if (state.step === 1) {
      const err = Err();
      card.append(
        el('label',{}, 'Your mobile number'),
        el('input',{
          className:'input', placeholder:'(555) 555‑5555',
          type:'tel', inputMode:'numeric', autoComplete:'tel',
          value:state.phone,
          oninput:e=> state.phone = e.target.value
        }),
        el('div',{className:'helper'}, 'US numbers only at this time.'),
        err,
        el('div',{className:'row'},
          el('button',{className:'btn',onclick:()=>{
            const ok = e164(state.phone);
            if (!ok) return showErr(err,'Enter a valid US phone number.');
            state.step=2; render();
          }}, 'Continue')
        )
      );
    }

    if (state.step === 2) {
      const err = Err();
      card.append(
        el('h2',{className:'h'}, 'Can we text you about this referral?'),
        el('p',{className:'p'}, 'We’ll send a few messages to guide you. You can reply STOP to opt out anytime.'),
        Seg([
          {label:'Yes, I agree', value:'yes'},
          {label:'No', value:'no'}
        ], state.consent?'yes':'', (v)=>{ state.consent = (v==='yes'); render(); }),
        err,
        el('div',{className:'row'},
          el('button',{className:'btn secondary',onclick:()=>{state.step=1;render();}}, 'Back'),
          el('button',{className:'btn',onclick:()=>{
            if (!state.consent) return showErr(err,'You need to agree to SMS to continue.');
            state.step=3; render();
          }}, 'Continue')
        )
      );
    }

    if (state.step === 3) {
      const err = Err();
      card.append(
        el('label',{}, 'Have you ever created an Acorns account?'),
        Seg([
          {label:'No', value:'no'},
          {label:'Not sure', value:'unsure'},
          {label:'Yes', value:'yes'}
        ], state.status, (v)=>{ state.status = v; render(); }),
        el('div',{className:'helper'},
          state.status==='yes' ? 'Thanks! This offer is for new users only.' :
          state.status==='unsure' ? 'Eligibility depends on being truly new to Acorns.' : ''
        ),
        err,
        el('div',{className:'row'},
          el('button',{className:'btn secondary',onclick:()=>{state.step=2;render();}}, 'Back'),
          el('button',{className:'btn',onclick:()=>{
            if (!state.status) return showErr(err,'Please select an option.');
            if (state.status==='yes') return showErr(err,'This offer is for new users only.');
            state.step=4; render();
          }}, 'Continue')
        )
      );
    }

    if (state.step === 4) {
      const err = Err();
      card.append(
        el('label',{}, 'How should we pay you?'),
        Seg([
          {label:'Venmo', value:'venmo'},
          {label:'Zelle', value:'zelle'}
        ], state.payout, (v)=>{ state.payout = v; render(); }),
      );
      if (state.payout==='venmo') {
        card.append(
          el('label',{}, 'Your Venmo @handle'),
          el('input',{className:'input',placeholder:'@yourhandle',value:state.handle,oninput:e=>state.handle=e.target.value})
        );
      }
      if (state.payout==='zelle') {
        card.append(
          el('label',{}, 'Is your Zelle the same as your phone number?'),
          Seg([
            {label:'Yes', value:'yes'},
            {label:'No', value:'no'}
          ], state.zelleSame, (v)=>{ state.zelleSame=v; render(); }),
        );
        if (state.zelleSame==='no') {
          card.append(
            el('label',{}, 'Zelle email or phone'),
            el('input',{className:'input',placeholder:'email or phone',value:state.zelleAlt,oninput:e=>state.zelleAlt=e.target.value})
          );
        }
      }
      card.append(
        el('div',{className:'notice fade-enter'},
          el('ul',{className:'clean'},
            el('li',{},'Reply READY to get your unique link.'),
            el('li',{},'Sign up NEW and deposit $5.'),
            el('li',{},'Reply DONE and send a screenshot here.')
          )
        ),
        err,
        el('div',{className:'row'},
          el('button',{className:'btn secondary',onclick:()=>{state.step=3;render();}}, 'Back'),
          el('button',{className:'btn',onclick:()=>{
            if (!state.payout) return showErr(err,'Pick Venmo or Zelle.');
            if (state.payout==='venmo' && !/^@?\w{3,30}$/.test(state.handle||'')) return showErr(err,'Enter a valid Venmo handle.');
            if (state.payout==='zelle' && state.zelleSame==='no' && !state.zelleAlt) return showErr(err,'Enter your Zelle email/phone.');
            state.step=5; render();
          }}, 'Continue')
        )
      );
    }

    if (state.step === 5) {
      const err = Err();
      const payload = () => ({
        phone: e164(state.phone),
        status: state.status,
        payout: state.payout,
        handle: state.payout==='venmo' ? (state.handle.startsWith('@')?state.handle:`@${state.handle}`) : null,
        zelle: state.payout==='zelle' ? (state.zelleSame==='yes' ? 'same' : state.zelleAlt) : null,
        consent: state.consent === true,
        honeypot: ""
      });
      card.append(
        el('h2',{className:'h'}, 'All set—watch your phone'),
        el('p',{className:'p'}, 'We’ll text you with next steps. Reply READY for your link.'),
        err,
        el('div',{className:'row'},
          el('button',{className:'btn secondary',onclick:()=>{state.step=4;render();}}, 'Back'),
          el('button',{className:'btn',onclick:async()=>{
            try{
              const res = await fetch('/api/intake',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload())});
              const j = await res.json();
              if(!res.ok) throw new Error(j.error||'Something went wrong.');
              window.location.href='/thanks.html';
            }catch(e){ showErr(err,e.message); }
          }}, 'Submit')
        )
      );
    }

    $app.append(card);
  };
  render();
})();