# Troubleshooting

• Error 403 from `/telnyx`: Confirm the `?token=` in Telnyx webhook URL matches WEBHOOK_TOKEN in Cloudflare.
• No SMS received: Verify `TELNYX_API_KEY`, `TELNYX_MESSAGING_PROFILE_ID`, and that the toll‑free number is verified and attached to the profile.
• Reminder did not send: Ensure your Telnyx account supports `send_at`; check message status in Telnyx logs. If the user finished early, we attempt to cancel the scheduled reminder.
• Media not saved: Confirm the R2 binding named PROOFS exists and the bucket is created. Check object list in R2.
• Admin 401: Ensure the `X-ADMIN-KEY` header is set by the admin UI (paste your ADMIN_KEY and click Save).
• Links not rotating: Confirm each link has `cap` set and `active = yes`; assigned_count must be < cap.
• Weekly reset: Use the Admin “Reset Counts” button. (Lazy Monday reset code is in store.js; use a cron Worker for strict resets if needed.)
• “Temporarily paused” at submit: FREEZE may be true or “Freeze” switch enabled in Admin.
