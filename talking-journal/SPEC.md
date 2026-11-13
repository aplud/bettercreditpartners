# The Talking Journal — Build Spec for Claude Code

> **How to use this:** Make a new, empty project folder. Put this file in it, and put `index.html` (the working prototype) inside a subfolder called `reference`. Then tell Claude Code:
> *"Read SPEC.md and reference/index.html, then build The Talking Journal following the milestones. Ask me before creating any accounts or spending money."*

---

## 1. What we're building

The Talking Journal is a voice-first journaling app. You talk about your day while walking, and the app turns what you said into an organized, dated journal entry.

- **Phase 1 (now):** a personal app for one user (me). It's an installable web app (PWA) on my iPhone home screen.
- **Phase 2 (later):** a product I sell. It needs multi-user accounts, a subscription, and possibly an App Store wrapper. Build Phase 1 so it doesn't need a rewrite for Phase 2: use real auth, per-user data and server-side API keys from day one.

A working prototype is in `reference/index.html`. **Match its flow, wording and design exactly.** It's the source of truth for look and feel. The big thing it's missing is a **real microphone record button that works on iPhone**.

---

## 2. Core user flow (same as prototype)

1. **Home.** Greeting, a big "Start talking" button (mustard sunburst card), entry count, a day streak and a list of past entries (newest first). Show "Resume unfinished entry" if there's a saved draft.
2. **Mood check-in (step 1 of 2).** Eight mood chips (Happy, Calm, Grateful, Tired, Frustrated, Anxious, Sad, Overwhelmed), up to two selections, plus an optional "in your own words" field. The mood appears at the top of the entry.
3. **Talk (step 2 of 2).** The user gets words in any of three ways, and can mix them in one entry:
   - **Record button (NEW, the main feature).** Tap to start, tap to stop. Show a live timer and a simple level meter or waveform, plus a pause/resume button. When they stop, upload the audio, transcribe it and append the text to the text box.
   - **Keyboard dictation.** This works automatically because the text box is a normal textarea. Keep a small tip: "You can also use your keyboard's mic."
   - **Typing / editing.** The user can always edit the transcript before continuing.
   - The draft autosaves locally on every change, so nothing is ever lost.
4. **"What would you like?"** There are three options, and *Just note it* is the default:
   - 📝 **Just note it:** organize the entry and say nothing back.
   - 💛 **Reflect it back:** organize the entry, then add 2–4 warm sentences reflecting what was heard.
   - 💬 **Prompt me:** organize the entry, then ask ONE gentle question to go deeper.
   - Also show a link: "Wait, I want to keep talking."
   - **Never** reflect or prompt unless the user picks that option.
5. **Entry view.** Shows the date and time, title, mood tags, an italic summary, themed sections (bullet points), "✨ Good moments," the reflection (if chosen) and the question card (if chosen). It also has a collapsible "What I actually said" with the raw transcript and any follow-up Q&A. Actions: Copy entry, Add more, Delete (in-app confirm modal).
6. **Prompt loop.** "Answer it" opens the talk screen with the question as the heading, and the record button works there too. The answer is appended to the same entry as a follow-up. The app then goes back to step 4, the entry is regenerated with everything included, and it's saved under the same ID. "Not now" just saves.

---

## 3. Tech stack

| Piece | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | One codebase for UI and API routes; deploys to Vercel |
| Styling | Tailwind CSS with the design tokens below (or plain CSS modules, your call) | Match the prototype exactly |
| Hosting | **Vercel** | Free tier, HTTPS (required for the iPhone mic) |
| Auth + DB | **Supabase** (email magic-link login, Postgres, Row Level Security) | Multi-user ready for Phase 2 |
| Audio storage | Supabase Storage (private bucket), temporary | |
| Speech-to-text | **OpenAI `gpt-4o-transcribe`** (or `whisper-1`) via a server API route | Anthropic has no speech-to-text API |
| Entry writing | **Anthropic API, `claude-sonnet-5-5`**, via a server API route, using tool use / structured JSON output | |
| PWA | Web app manifest + icons + service worker (e.g. `@serwist/next`) | "Add to Home Screen" on iPhone, offline drafts |

**All API keys stay server-side** in environment variables. They never reach the browser.

Env vars: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

---

## 4. The record button — details that matter on iPhone

- Use the browser `MediaRecorder` API with `getUserMedia({audio:true})`, started from a user tap (iOS requires a user gesture and HTTPS).
- Safari records `audio/mp4` (AAC), and Chrome records `audio/webm`. Detect the format with `MediaRecorder.isTypeSupported` and send the correct MIME type and file extension to the transcription API.
- Show a timer, a level meter (Web Audio `AnalyserNode`) and pause/resume. The button pulses while recording (see `.mic.live` in the prototype).
- **Long walks:** support at least 30 minutes. Record in chunks: restart the recorder every ~5 minutes, or use `timeslice`, then upload and transcribe each chunk in order and append the text. That keeps each upload under the transcription API's file-size limit and means a crash loses at most one chunk.
- **Screen lock:** iOS may stop recording when the screen locks or the app goes to the background. Detect `visibilitychange`, stop cleanly, transcribe what was captured, and show a friendly note: "Recording paused when your screen locked — tap to continue." Request a Screen Wake Lock (`navigator.wakeLock`) while recording, where supported.
- **Offline / bad signal:** keep recorded chunks in IndexedDB until they upload successfully, then retry automatically.
- **Mic permission denied:** hide the record button and show the keyboard-mic tip. Don't nag.
- **Privacy default:** delete the audio file right after transcription succeeds. Add a setting, off by default, to keep the audio so it can be replayed in the entry.

---

## 5. AI: writing the entry

Make one server route, `POST /api/entries/:id/organize`, with `{ mode: "note" | "reflect" | "prompt" }`. It loads the entry (moods, raw transcript, follow-ups), calls Claude, validates the JSON (use zod), saves it and returns it.

Force this output shape (tool use / JSON schema):

```json
{
  "title": "3-7 word title",
  "summary": "1-2 sentence first-person summary of the day",
  "sections": [{ "heading": "What happened", "points": ["..."] }],
  "highlights": ["..."],
  "reflection": null,
  "question": null
}
```

**Prompt (use this, it's tested in the prototype):**

> You are the writing engine inside "The Talking Journal", a voice journaling app. The person talked out loud about their day (voice-to-text, so expect run-on sentences, filler words, swearing and transcription mistakes). Turn everything they said into one organized, dated journal entry.
>
> Rules for the entry:
> - Write in their voice, first person ("I"), keeping their meaning, feelings and tone. Don't sanitize or soften what they felt, but you may tidy profanity-heavy phrasing lightly.
> - Organize thoughts by theme, not by the order they rambled in. Use 2-5 sections with short plain headings that fit the content (for example: "What happened", "How I felt", "People on my mind", "Wins", "Still sitting with").
> - Each point is one clean sentence. Keep real details (names, places, what was said). Don't invent anything.
> - No advice, no lessons, no therapy language inside the entry itself.
> - "highlights": 0-3 genuinely good or sweet moments they mentioned, in their voice. Empty array if none.
>
> Reply mode chosen by the person: "{mode}".
> - "note": reflection = null, question = null. Just the organized entry.
> - "reflect": reflection = 2-4 warm, grounded sentences speaking to them ("you"), reflecting back what you heard and naming the feelings underneath. No advice, no fixing, no clichés. question = null.
> - "prompt": question = ONE short, gentle, open question that helps them go deeper on whatever seems most alive or unresolved. reflection = null.
>
> Date: {date} · Mood: {moods} (in their words: "{moodWord}")
> What they said: """{raw}"""
> {follow-up questions and answers, if any}

Transcription: pass a short `prompt` hint to the transcription API with the user's common names (for example, family names) to improve spelling. Make the hint a per-user setting.

---

## 6. Data model (Supabase / Postgres)

```sql
create table entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  moods text[] not null default '{}',
  mood_word text,
  raw text not null default '',
  followups jsonb not null default '[]',   -- [{q, a}]
  mode text check (mode in ('note','reflect','prompt')),
  entry jsonb,                              -- AI output shape above
  status text not null default 'draft'      -- 'draft' | 'done'
);
alter table entries enable row level security;
create policy "own entries" on entries for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  transcription_hint text,          -- names/words to spell right
  keep_audio boolean not null default false,
  created_at timestamptz default now()
);
```

Create the entry row as a `draft` as soon as the user starts talking, and autosave `raw` (debounced, plus localStorage as a backup). Streak = consecutive days (in the user's local time zone) that have at least one entry.

---

## 7. Design system: retro comfy (copy from the prototype's CSS)

- **Colors:** background `#F3E6CF` with a subtle paper-grain noise; card `#FCF5E6`; ink/brown `#3B2A1E`; muted `#86705C`; burnt orange (primary) `#D9622B`; mustard `#E8A93B`; olive `#7C8B4A`; rust `#A8432A`; soft olive `#E6E3C4`; peach `#F7D9B8`.
- **Type:** Headings use **Fraunces** with `font-variation-settings: "SOFT" 100, "WONK" 1`, weight 700. Body uses **DM Sans**. Small uppercase rust "eyebrow" labels with 0.14em letter spacing.
- **Shapes:** 2.5px dark-brown borders, 22px radius cards, pill buttons, and a **hard offset shadow `4px 4px 0 #3B2A1E`**. Buttons "press in" on tap (translate 3px and shrink the shadow).
- **Motifs:** a four-color retro stripe stack in the header (rust, orange, mustard, olive). A mustard "Start talking" card with a conic-gradient sunburst. Notebook ruled lines in the textarea. Selected chips and options turn mustard and press in.
- **Mobile first,** max width 560px, sticky bottom action button, safe-area padding for the iPhone notch.
- App icon: a burnt-orange mic on mustard with a brown outline, plus the stripe motif. Generate 192/512 PNGs and an Apple touch icon.

---

## 8. Milestones (build in this order, and check in with me after each)

1. **Skeleton:** Next.js + Tailwind + design tokens. Port all prototype screens with local-only storage. Deploy to Vercel so I can open it on my phone.
2. **Record button:** MediaRecorder, timer, level meter, chunking, the `/api/transcribe` route, iPhone screen-lock handling, IndexedDB retry. **Test on a real iPhone in Safari and as a home-screen app.**
3. **AI entries:** the `/api/entries/:id/organize` route with Claude, the three modes, and the prompt loop.
4. **Accounts + sync:** Supabase magic-link login, the tables plus RLS, and moving storage from local to the database (import any local entries on first login).
5. **PWA polish:** manifest, icons, offline drafts, "Add to Home Screen" instructions screen, settings (name hints, keep audio, export all entries as Markdown or PDF).
6. **(Phase 2, later; don't build yet):** Stripe subscription with a free trial, landing page, usage limits per plan, and optionally a Capacitor wrapper for the App Store with native background recording.

---

## 9. Done means

- [ ] On my iPhone, from the home-screen icon, I can tap the record button, talk for 10+ minutes while walking, tap stop, and see my words in the box.
- [ ] Keyboard dictation and typing still work, and I can mix all three in one entry.
- [ ] Mood is asked first and shows at the top of the entry.
- [ ] After talking, I'm asked Note / Reflect / Prompt. "Note" gives an organized entry with no reflection or question.
- [ ] Prompt mode lets me answer by voice, and the answer is folded into the same dated entry.
- [ ] Entries sync between my phone and laptop after I log in. Nobody else can see them.
- [ ] Closing the app mid-entry never loses what I said.
- [ ] It looks like the prototype: retro, comfy, warm.
- [ ] No API keys in the browser bundle.

---

## 10. Accounts I'll need to create (tell me when, and walk me through each)

- **GitHub** (for the code)
- **Vercel** (hosting; free tier)
- **Supabase** (login and database; free tier)
- **Anthropic API key**: console.anthropic.com (pay as you go; roughly a cent or two per entry)
- **OpenAI API key**: platform.openai.com (for transcription; under a cent per minute of audio)
