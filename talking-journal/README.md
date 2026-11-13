# The Talking Journal

Voice-first journaling PWA. See `SPEC.md` for the full build spec and `reference/index.html` for the design prototype.

## Status

- [x] **Milestone 1: Skeleton.** Next.js + design tokens, every prototype screen ported, local-only storage, draft autosave/resume. Entries are organized by a simple placeholder (`lib/organize.ts`) until Milestone 3 wires in Claude.
- [ ] Milestone 2: Record button + `/api/transcribe`
- [ ] Milestone 3: AI entries (`/api/entries/:id/organize`)
- [ ] Milestone 4: Supabase accounts + sync
- [ ] Milestone 5: PWA polish

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
```

## Deploy (Vercel)

This app lives in the `talking-journal/` subfolder of the repo. When importing the repo in Vercel, set **Root Directory** to `talking-journal`. No env vars are needed yet (see `.env.example` for later milestones).
