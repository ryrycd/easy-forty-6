# Deployment Guide (Cloudflare 2025 UI)

This guide assumes you have a Cloudflare account, a GitHub repo, and a Telnyx account with a toll‑free number.

1) Create a new GitHub repository and upload the contents of this zip. The project root must contain the `public/`, `functions/`, `lib/`, and `db/` folders.

2) In Cloudflare Dashboard → Workers & Pages → Pages → Create project → Connect to Git → select your repo.
   • Framework preset: None
   • Build command: (leave empty)
   • Build output directory: public
   • Add the project.

3) After the first deploy, open your Pages project → Settings → Functions.
   • Turn **Functions** ON.
   • Set **Compatibility date** to the latest.
   • Routes: default (file‑based routing).

4) Still under Settings → **Functions → Bindings**. Add the following:
   • D1 Database (Variable name: DB) → Create or select a D1 database.
   • R2 Bucket (Variable name: PROOFS) → Create/select a bucket for MMS proofs.
   • Environment variables (Text):
     - TELNYX_API_KEY
     - TELNYX_MESSAGING_PROFILE_ID
     - TOLLFREE_NUMBER_E164 (e.g., +18885551234)
     - WEBHOOK_TOKEN (random string)
     - ADMIN_KEY (you choose a strong value)
     - FREEZE (set to false)

5) Initialize the D1 schema:
   • In the Pages project → Resources → D1 → Open the DB → Query editor.
   • Paste the SQL from `db/schema.sql` and run. This creates tables and default settings.

6) Seed referral links:
   • From Project → Pages → Functions → **Add custom route** for `/api/admin/links` (optional).
   • Open the **Quick edit** for Functions is not needed. Use Admin UI instead:
     - Visit `https://<your-domain>/admin/`.
     - Paste your ADMIN_KEY.
     - Add links with caps using the form.
   • Alternatively, POST `seed.links.json` to a `seed` endpoint if you add one; otherwise use the UI.

7) Telnyx configuration:
   • In Telnyx Mission Control → Messaging Profiles → Create/Select profile.
   • Assign your toll‑free number to this profile.
   • Set **Inbound Webhook URL** to: `https://<your-domain>/telnyx?token=YOUR_WEBHOOK_TOKEN`.
   • In the same profile, note your **Messaging Profile ID** and set it in Cloudflare env vars.
   • Ensure the toll‑free number is **Verified** or submit verification.

8) Domain:
   • In Pages → Custom domains → Add `easyforty.com` and any subdomains. Follow DNS prompts.

9) Admin access:
   • Go to `/admin/` and paste your ADMIN_KEY. Add/activate links, set caps, test freeze switch.

10) Test end‑to‑end using the Acceptance Checklist included in this zip (`docs/acceptance.md`).

## Minimal `.env` reference (for your notes only)
TELNYX_API_KEY=... 
TELNYX_MESSAGING_PROFILE_ID=... 
TOLLFREE_NUMBER_E164=+18885551234 
WEBHOOK_TOKEN=... 
ADMIN_KEY=... 
FREEZE=false
