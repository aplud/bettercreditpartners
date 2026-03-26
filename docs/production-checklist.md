# BCP Production Deployment Checklist

## Pre-Launch (Must Complete)

### 1. Database Setup
- [ ] Provision PostgreSQL on Replit (Replit > Tools > Database)
- [ ] Copy the `DATABASE_URL` connection string
- [ ] Run `npx drizzle-kit push` to create all tables
- [ ] Seed initial admin user: run `npm run seed` or manually insert via the app
- [ ] Seed default referral program ("Standard $50" - 5000 cents, 91 days, quarterly)
- [ ] Verify data persists across server restarts

### 2. Environment Variables (Replit Secrets)
| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `SESSION_SECRET` | Random 64+ char string for session encryption | Yes (app crashes without it in production) |
| `SIGNNOW_API_KEY` | SignNow API key for e-signatures | Yes (for agreement signing) |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Google service account credentials (JSON string) | Optional (for Sheets sync) |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | Target Google Sheet ID | Optional (for Sheets sync) |
| `NODE_ENV` | Set to `production` | Yes |
| `PORT` | Server port (Replit sets this automatically) | Auto |

### 3. Security Fixes (Already Applied in Code)
- [x] Role escalation removed from public registration endpoint
- [x] Session secret required in production (crashes if missing)
- [x] Rate limiting on login (10/15min), register (5/hr), partner register (5/hr)
- [x] sameSite: lax on session and referral cookies
- [x] secure: true on cookies in production
- [x] Error handler no longer re-throws (was crashing server)
- [x] Response bodies no longer logged (was leaking sensitive data)
- [x] Error messages sanitized in production (no stack traces)

### 4. Domain & SSL
- [ ] Verify custom domain is pointed to Replit deployment
- [ ] Confirm SSL certificate is active (Replit handles this automatically)
- [ ] Test all pages load over HTTPS
- [ ] Verify cookies work with the custom domain

### 5. SignNow Configuration
- [ ] Verify SIGNNOW_API_KEY is set and valid
- [ ] Verify the template ID for partner agreements is correct
- [ ] Test partner registration flow with signing
- [ ] Test CROA enrollment signing flow

### 6. Google Sheets Sync (Optional)
- [ ] Create a Google Cloud service account
- [ ] Share the target spreadsheet with the service account email
- [ ] Set GOOGLE_SERVICE_ACCOUNT_JSON and GOOGLE_SHEETS_SPREADSHEET_ID
- [ ] Test manual sync from admin panel
- [ ] Verify auto-sync runs (check server logs for sync messages)

## Post-Launch

### 7. Monitoring
- [ ] Set up UptimeRobot (free) to ping `/api/health` every 5 minutes
- [ ] Monitor Replit deployment logs for errors
- [ ] Set up error alerting (email or Slack webhook)

### 8. Email Notifications (Future Enhancement)
Recommended service: **Resend** (free tier: 3,000 emails/month)
- [ ] Sign up at resend.com, verify your domain
- [ ] Set `RESEND_API_KEY` environment variable
- [ ] Implement notification triggers:
  - New partner registered (notify admin)
  - Partner agreement signed (notify admin)
  - New lead submitted (notify admin + partner)
  - Lead converted (notify partner)
  - Commission eligible (notify partner)
  - Payout generated (notify all affected partners)

### 9. Backup Strategy
- [ ] Enable automatic PostgreSQL backups on Replit
- [ ] Set up Google Sheets sync as a live backup mirror
- [ ] Document manual backup procedure

### 10. Testing Before Going Live
- [ ] Create a test partner account and complete full flow:
  1. Register as partner
  2. Sign agreement (or skip)
  3. Submit a lead
  4. Admin converts lead
  5. Verify commission created
  6. Check all dashboard stats update
- [ ] Test referral link flow:
  1. Visit `/ref/CODE`
  2. Verify cookie set and redirect works
  3. Complete enrollment
  4. Verify lead attributed to partner
- [ ] Test admin account management:
  1. Create new admin
  2. Login as new admin
  3. Delete test admin
- [ ] Test CSV export (leads and payouts)
- [ ] Test on mobile device (all pages)
- [ ] Test with slow network (Chrome DevTools > Network > Slow 3G)

## Architecture Notes

- **MemStorage** is for development only. All production data MUST use PostgreSQL.
- Commission amounts are stored in **cents** (5000 = $50.00). Frontend divides by 100 for display.
- Commission state machine: `pending_retention` -> `eligible` (auto after retention days) -> `paid` (quarterly payout)
- Retention check cron runs every 6 hours (only when DATABASE_URL is set)
- Google Sheets sync batches changes every 60 seconds via dirty flags
