# Easy Forty — Architecture Overview

**Date:** 2025-10-21T03:56:10Z

## Goals
- Cloudflare Pages static frontend + Pages Functions for API (intake, admin, webhook).
- D1 for relational data (users, links, assignments, proofs/events).
- R2 for MMS screenshot storage.
- Telnyx for SMS/MMS. Scheduled reminder via `send_at` 24h after intake; cancel on completion.
- Admin panel to manage links and freeze signups.
- Compliance: explicit SMS opt-in, STOP/HELP, ToS/Privacy, minimal PII.

## Components
- **Public site** (`/public`): Minimal multi-step flow with phone, eligibility, payout details.
- **Functions** (`/functions`):
  - `api/intake`: validates, creates user, assigns link, sends intro SMS, schedules 24h reminder.
  - `telnyx/index`: webhook with `?token=` check; handles READY/DONE/MMS, STOP/HELP, saves proof to R2.
  - `api/admin/*`: authenticated with `X-ADMIN-KEY`; manage links, freeze, export, reset.
- **Database (D1)**:
  - `links`: URL, cap, position, counters.
  - `users`: phone, payout metadata.
  - `assignments`: link per user, status, timestamps, scheduled reminder id.
  - `proofs`: R2 key per assignment.
  - `events`, `settings` (freeze, last_reset).
- **Storage (R2)**: `proofs/*` object keys for MMS uploads.
- **Security**: WEBHOOK_TOKEN on Telnyx endpoint, ADMIN_KEY header, basic CORS, input validation, honeypot, masked logs.
- **Resets**: Weekly reset on demand from admin; lazy Monday reset hook exists in code if invoked by endpoints.

## Flows
1. **Landing ➜ Intake**: Frontend posts to `/api/intake`. On success, show thanks page; intro SMS sent.
2. **SMS**: READY ➜ send link & set `link_sent_at`. DONE ➜ prompt for MMS proof. MMS ➜ store to R2, mark completed, cancel scheduled reminder, final confirmation.
3. **Admin**: Manage links, freeze, export CSV, manual reset. Counts reflect `assigned_count`/`completed_count`.

## Notes
- **24h reminder** uses Telnyx scheduling (`send_at`). If user completes earlier, we attempt to cancel.
- **STOP/HELP** handled per-toll-free expectations (Telnyx also auto-processes STOP).
- **Under $5/mo**: Pages free tier + D1 (free), R2 minimal storage, Telnyx pay‑as‑you‑go.
