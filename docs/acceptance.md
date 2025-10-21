# Acceptance Test Checklist

Public Flow
- [ ] Landing loads fast on mobile and desktop; form steps behave.
- [ ] E.164 validation blocks invalid numbers.
- [ ] Opt‑in checkbox required and not pre‑checked.
- [ ] If user selects “Yes” to prior Acorns account, flow blocks appropriately.

SMS
- [ ] Intro SMS sent immediately after intake.
- [ ] Reply READY → system returns unique referral link.
- [ ] Reply DONE → system prompts for MMS screenshot.
- [ ] Send MMS screenshot → app stores to R2, marks completed, sends confirmation.
- [ ] 24h reminder is scheduled on intake (verify `send_at` in Telnyx logs).

Compliance
- [ ] HELP/STOP responses function (STOP should also be auto‑processed by Telnyx).
- [ ] Privacy & Terms pages accessible; footer disclosures present on landing.
- [ ] Toll‑free verification request includes opt‑in description and sample messages.

Admin
- [ ] Admin key required for all API calls.
- [ ] Add/Deactivate/Reorder links works; caps honored by rotator.
- [ ] Export CSV returns recent assignments with statuses.
- [ ] Freeze toggle blocks new intakes.

Data
- [ ] D1 contains expected rows in `users`, `links`, `assignments`, `proofs`.
- [ ] R2 contains stored MMS proof objects.
- [ ] PII not logged in plaintext in events (spot check).

Performance and Cost
- [ ] No excessive function calls; only necessary Telnyx API requests.
- [ ] App works on Cloudflare free tier; Telnyx metered charges observed within budget.
