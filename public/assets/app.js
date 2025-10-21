(() => {
  const el = (t, props={}, ...kids) => {
    const e = document.createElement(t);
    Object.assign(e, props);
    kids.flat().forEach(k => e.append(k.nodeType ? k : document.createTextNode(k)));
    return e;
  };

  const state = {
    step: 1,
    phone: "",
    status: "",
    payout: "",
    handle: "",
    zelleSame: "yes",
    zelleAlt: "",
    consent: false,
    age: false,
    honeypot: ""
  };

  const progress = () => ((state.step-1)/4*100)|0;
  const e164 = (s) => {
    const d = (s||"").replace(/\D/g,"");
    if (d.length === 10) return "+1"+d;
    if (d.length >= 11 && d[0] === "1") return "+"+d;
    if (d.startsWith("+") && d.length>1) return d;
    return null;
  }

  const $app = document.getElementById("app");

  const render = () => {
    $app.innerHTML = "";
    const card = el("div",{className:"card"});
    const bar = el("div",{className:"progress"}, el("div",{style:`width:${progress()}%`}));
    card.append(
      el("div",{className:"step-badge"},`Step ${state.step} of 4`),
      el("h1",{className:"h"},"Easy Forty — $40 for new Acorns users"),
      el("p",{className:"p"},"Answer a few questions. We’ll text you a unique link and simple steps. Finish the $5 deposit, send a screenshot, and we’ll pay you via Venmo or Zelle."),
      bar
    );

    const error = el("div",{id:"err",className:"error hidden"});
    const showErr = (msg) => { error.textContent = msg; error.classList.remove("hidden"); };
    const clearErr = () => { error.textContent = ""; error.classList.add("hidden"); };

    if (state.step === 1) {
      card.append(
        el("label",{}, "Your mobile number",
          el("span",{},"US only right now. We’ll text instructions. Reply STOP to opt out, HELP for help.")
        ),
        el("input",{className:"input",placeholder:"(555) 555-5555",value:state.phone,oninput:e=>state.phone=e.target.value}),
        el("div",{className:"row"},
          el("label",{className:"small",style:"flex:1"}, el("input",{type:"checkbox",checked:state.age,onchange:e=>state.age=e.target.checked}), " I am 18+"),
          el("label",{className:"small",style:"flex:2"}, el("input",{type:"checkbox",checked:state.consent,onchange:e=>state.consent=e.target.checked}), " I agree to receive SMS about this referral. Msg&data rates may apply. Recurring msgs. Reply STOP to opt out, HELP for help.")
        ),
        el("input",{type:"text",className:"hidden",autocomplete:"off",tabindex:"-1", "aria-hidden":"true", oninput:e=>state.honeypot=e.target.value, value:state.honeypot}),
        error,
        el("div",{className:"row"},
          el("button",{className:"btn",onclick:()=>{ 
            clearErr();
            if (!state.age) return showErr("You must be 18+ to participate.");
            if (!state.consent) return showErr("Please accept SMS consent to continue.");
            const e = e164(state.phone);
            if (!e) return showErr("Enter a valid US phone number.");
            state.step = 2; render();
          }},"Continue")
        )
      );
    }

    if (state.step === 2) {
      card.append(
        el("label",{}, "Have you ever created an Acorns account?"),
        el("select",{onchange:e=>state.status=e.target.value},
          el("option",{value:""},"Select..."),
          el("option",{value:"no"},"No"),
          el("option",{value:"unsure"},"Not sure"),
          el("option",{value:"yes"},"Yes")
        ),
        el("div",{className:"p small"},
          state.status === "yes" ? "Thanks! This offer is for new users only. You can still help by sharing the link." :
          state.status === "unsure" ? "Eligibility depends on being truly new. If you’ve ever had Acorns, it likely won’t qualify." :
          ""
        ),
        error,
        el("div",{className:"row"},
          el("button",{className:"btn secondary",onclick:()=>{state.step=1;render();}},"Back"),
          el("button",{className:"btn",onclick:()=>{ 
            if (!state.status) return showErr("Please select an option.");
            if (state.status==="yes") return showErr("This offer is for new users only.");
            state.step = 3; render();
          }},"Continue")
        )
      );
    }

    if (state.step === 3) {
      card.append(
        el("label",{},"How should we pay you?"),
        el("select",{onchange:e=>{state.payout=e.target.value; render();}},
          el("option",{value:""},"Select..."),
          el("option",{value:"venmo"},"Venmo"),
          el("option",{value:"zelle"},"Zelle")
        ),
      );

      if (state.payout === "venmo") {
        card.append(
          el("label",{},"Your Venmo @handle", el("span",{},"Example: @janedoe")),
          el("input",{className:"input",placeholder:"@yourhandle",value:state.handle,oninput:e=>state.handle=e.target.value})
        );
      } else if (state.payout === "zelle") {
        card.append(
          el("label",{},"Is your Zelle the same as your phone number?"),
          el("div",{className:"row"},
            el("button",{className:`btn ${state.zelleSame==='yes'?'':'secondary'}`,onclick:()=>{state.zelleSame='yes';render();}},"Yes"),
            el("button",{className:`btn ${state.zelleSame==='no'?'':'secondary'}`,onclick:()=>{state.zelleSame='no';render();}},"No")
          )
        );
        if (state.zelleSame === 'no') {
          card.append(
            el("label",{},"Zelle email or phone"),
            el("input",{className:"input",placeholder:"email or phone",value:state.zelleAlt,oninput:e=>state.zelleAlt=e.target.value})
          );
        }
      }

      card.append(
        el("div",{className:"notice"},"On the next step we’ll text you instructions. Reply READY to get your link, DONE when you finish, then send a screenshot of your $5 deposit."),
        error,
        el("div",{className:"row"},
          el("button",{className:"btn secondary",onclick:()=>{state.step=2;render();}},"Back"),
          el("button",{className:"btn",onclick:async()=>{
            if (!state.payout) return showErr("Pick Venmo or Zelle.");
            if (state.payout==='venmo' && !/^@?\w{3,30}$/.test(state.handle||"")) return showErr("Enter a valid Venmo handle.");
            if (state.payout==='zelle' && state.zelleSame==='no' && !state.zelleAlt) return showErr("Enter your Zelle email/phone.");
            state.step = 4; render();
          }},"Continue")
        )
      );
    }

    if (state.step === 4) {
      const payload = () => ({
        phone: e164(state.phone),
        status: state.status,
        payout: state.payout,
        handle: state.payout==='venmo'? (state.handle.startsWith('@')?state.handle:`@${state.handle}`) : null,
        zelle: state.payout==='zelle' ? (state.zelleSame==='yes' ? 'same' : state.zelleAlt) : null,
        consent: state.consent === true,
        honeypot: state.honeypot || ""
      });
      card.append(
        el("h2",{className:"h"},"All set—watch your phone"),
        el("p",{className:"p"},"We’ve sent a text with next steps. Reply READY to receive your link. Then reply DONE when you’ve finished the deposit and send a screenshot."),
        el("div",{className:"row"},
          el("button",{className:"btn secondary",onclick:()=>{state.step=3;render();}},"Edit"),
          el("button",{className:"btn",onclick:async()=>{
            try {
              const res = await fetch('/api/intake',{
                method:'POST',headers:{'Content-Type':'application/json'},
                body: JSON.stringify(payload())
              });
              const j = await res.json();
              if (!res.ok) throw new Error(j.error || 'Something went wrong.');
              window.location.href = '/thanks.html';
            } catch (e) {
              showErr(e.message);
            }
          }},"Submit")
        )
      );
    }

    $app.append(card);
  };

  render();
})();