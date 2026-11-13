"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MicIcon } from "./icons";
import { MOODS, moodEmoji, moodEmojis } from "@/lib/moods";
import { entryAsText, fmtDate, fmtTime, greeting, newId, streak } from "@/lib/format";
import { store } from "@/lib/storage";
import { organize } from "@/lib/organize";
import type { Entry, Mode } from "@/lib/types";

type View = "home" | "mood" | "talk" | "answer" | "choose" | "loading" | "entry";

interface ModalState { title: string; body: string; onYes: () => void }

export default function JournalApp() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<View>("home");
  const [draft, setDraft] = useState<Entry | null>(null);
  const [savedDraft, setSavedDraft] = useState<Entry | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const [modal, setModal] = useState<ModalState | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    store.list().then((list) => { setEntries(list); setLoaded(true); });
    setSavedDraft(store.getDraft());
  }, []);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastOn(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastOn(false), 2200);
  }, []);

  const go = useCallback((v: View) => {
    if (v === "home") setSavedDraft(store.getDraft());
    setView(v);
    window.scrollTo(0, 0);
  }, []);

  /** Update the in-progress draft and back it up locally on every change. */
  const updateDraft = useCallback((next: Entry) => {
    setDraft(next);
    store.setDraft(next);
  }, []);

  async function run(mode: Mode) {
    if (!draft) return;
    go("loading");
    try {
      const result = await organize(draft, mode);
      const done: Entry = { ...draft, mode, entry: result, status: "done", updatedAt: new Date().toISOString() };
      const list = await store.save(done);
      store.clearDraft();
      setEntries(list);
      setDraft(done);
      setOpenId(done.id);
      go("entry");
    } catch (err) {
      console.error(err);
      go("choose");
      toast("Something went wrong writing your entry. Your words are saved, so try again.");
    }
  }

  let screen: React.ReactNode = null;
  if (view === "home") {
    screen = (
      <Home
        entries={entries}
        loaded={loaded}
        savedDraft={savedDraft}
        onStart={() => {
          const d: Entry = { id: newId(), createdAt: new Date().toISOString(), moods: [], moodWord: "", raw: "", followups: [], mode: null, entry: null, status: "draft" };
          setDraft(d);
          go("mood");
        }}
        onResume={() => { if (!savedDraft) return; setDraft(savedDraft); go(savedDraft.entry ? "choose" : "talk"); }}
        onOpen={(id) => { setOpenId(id); setDraft(null); go("entry"); }}
      />
    );
  } else if (view === "mood" && draft) {
    screen = <Mood draft={draft} onChange={setDraft} onBack={() => go("home")} onNext={() => go("talk")} />;
  } else if ((view === "talk" || view === "answer") && draft) {
    const isAnswer = view === "answer";
    screen = (
      <Talk
        key={view + (pendingQuestion || "")}
        isAnswer={isAnswer}
        question={pendingQuestion}
        initial={isAnswer ? "" : draft.raw}
        onChange={(text) => { if (!isAnswer) updateDraft({ ...draft, raw: text }); }}
        onBack={() => go(isAnswer ? "entry" : "mood")}
        onDone={(text) => {
          if (isAnswer) {
            updateDraft({ ...draft, followups: [...draft.followups, { q: pendingQuestion || "", a: text }] });
            setPendingQuestion(null);
          } else {
            updateDraft({ ...draft, raw: text });
          }
          go("choose");
        }}
      />
    );
  } else if (view === "choose" && draft) {
    screen = (
      <Choose
        onMore={() => {
          if (draft.followups.length) { setPendingQuestion("Anything else on your mind?"); go("answer"); }
          else go("talk");
        }}
        onGo={run}
      />
    );
  } else if (view === "loading") {
    screen = (
      <div className="loading">
        <div className="dots"><i /><i /><i /></div>
        <h2>Writing your entry…</h2>
        <p className="muted" style={{ marginTop: 6 }}>Sorting your thoughts into something you&apos;ll want to reread.</p>
      </div>
    );
  } else if (view === "entry") {
    const e = draft && draft.id === openId ? draft : entries.find((x) => x.id === openId);
    if (e) {
      const isFresh = !!draft && draft.id === e.id;
      screen = (
        <EntryView
          e={e}
          question={isFresh ? e.entry?.question ?? null : null}
          onBack={() => { setDraft(null); go("home"); }}
          onAnswer={(q) => { setPendingQuestion(q); go("answer"); }}
          onSkip={() => { setDraft(null); toast("Saved to your journal"); }}
          onAddMore={() => { setDraft(JSON.parse(JSON.stringify(e))); setPendingQuestion("What else do you want to add?"); go("answer"); }}
          onCopy={async () => {
            try { await navigator.clipboard.writeText(entryAsText(e)); toast("Copied"); }
            catch { toast("Couldn't copy on this device"); }
          }}
          onDelete={() => setModal({
            title: "Delete this entry?",
            body: "This can't be undone.",
            onYes: async () => {
              const list = await store.remove(e.id);
              setEntries(list);
              setDraft(null);
              toast("Entry deleted");
              go("home");
            },
          })}
        />
      );
    }
  }

  // Any view whose required state is missing falls back to home.
  useEffect(() => {
    if (screen === null) setView("home");
  });

  return (
    <>
      <div className="wrap">{screen}</div>
      <div className={"toast" + (toastOn ? " show" : "")} role="status" aria-live="polite">{toastMsg}</div>
      {modal && (
        <div className="modal" onClick={(ev) => { if (ev.target === ev.currentTarget) setModal(null); }}>
          <div className="card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <h3 id="modal-title">{modal.title}</h3>
            <p className="muted small" style={{ margin: "6px 0 16px" }}>{modal.body}</p>
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { const m = modal; setModal(null); m.onYes(); }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------------- Screens ---------------- */

function Home(props: { entries: Entry[]; loaded: boolean; savedDraft: Entry | null; onStart: () => void; onResume: () => void; onOpen: (id: string) => void }) {
  const { entries, loaded, savedDraft } = props;
  // Greeting depends on the device clock, so compute it after mount to avoid a hydration mismatch.
  const [hello, setHello] = useState("Hello");
  useEffect(() => setHello(greeting()), []);
  return (
    <>
      <div className="hero">
        <div className="stripes"><i /><i /><i /><i /></div>
        <div className="eyebrow">The Talking Journal</div>
        <h1>{hello}.</h1>
        <p className="muted">Just talk. I&apos;ll turn it into your journal.</p>
      </div>
      {loaded && store.mode === "local" && (
        <div className="notice">Saving on this device only for now. Sign-in and sync across devices are coming soon.</div>
      )}
      {savedDraft && savedDraft.raw && (
        <div className="card row between" style={{ marginBottom: 14 }}>
          <div>
            <b>Unfinished entry</b>
            <div className="small muted">From {fmtTime(savedDraft.createdAt)}</div>
          </div>
          <button className="btn btn-soft" onClick={props.onResume}>Resume</button>
        </div>
      )}
      <button className="card start btn-block" onClick={props.onStart}>
        <div className="mic-big"><MicIcon /></div>
        <h2>Start talking</h2>
        <div className="muted small">Check in with your mood, then say whatever&apos;s on your mind.</div>
      </button>
      <div className="stats">
        <div className="stat"><b>{loaded ? entries.length : "–"}</b><span className="small muted">entries</span></div>
        <div className="stat"><b>{loaded ? streak(entries) : "–"}</b><span className="small muted">day streak</span></div>
      </div>
      <h3 className="list-h">Your entries</h3>
      <div id="list">
        {!loaded ? (
          <div className="empty">Loading your journal…</div>
        ) : entries.length === 0 ? (
          <div className="empty">No entries yet. Your first one is a tap away.</div>
        ) : (
          entries.map((e) => (
            <button key={e.id} className="card entry-card" onClick={() => props.onOpen(e.id)}>
              <div className="row between">
                <span className="date">{fmtDate(e.createdAt, { weekday: "short", month: "short", day: "numeric" })} · {fmtTime(e.createdAt)}</span>
                <span className="moods">{moodEmojis(e.moods)}</span>
              </div>
              <h3>{e.entry?.title || "Untitled"}</h3>
              <p>{e.entry?.summary || ""}</p>
            </button>
          ))
        )}
      </div>
    </>
  );
}

function Mood({ draft, onChange, onBack, onNext }: { draft: Entry; onChange: (d: Entry) => void; onBack: () => void; onNext: () => void }) {
  const toggle = (m: string) => {
    let moods = draft.moods.includes(m) ? draft.moods.filter((x) => x !== m) : [...draft.moods, m];
    if (moods.length > 2) moods = moods.slice(1);
    onChange({ ...draft, moods });
  };
  return (
    <>
      <button className="back" onClick={onBack}>← Back</button>
      <div className="eyebrow">Step 1 of 2</div>
      <h1>How are you feeling?</h1>
      <p className="muted" style={{ marginTop: 6 }}>Pick up to two. It goes at the top of today&apos;s entry.</p>
      <div className="chips">
        {MOODS.map(([emoji, name]) => (
          <button key={name} className={"chip" + (draft.moods.includes(name) ? " on" : "")} aria-pressed={draft.moods.includes(name)} onClick={() => toggle(name)}>
            <span>{emoji}</span>{name}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 18 }}>
        <label className="small muted" htmlFor="mw">Or in your own words (optional)</label>
        <input className="text" id="mw" placeholder="e.g. drained but proud" value={draft.moodWord} style={{ marginTop: 6 }}
          onChange={(ev) => onChange({ ...draft, moodWord: ev.target.value })} />
      </div>
      <div className="sticky-foot"><div className="inner">
        <button className="btn btn-primary btn-block" onClick={onNext}>Continue</button>
      </div></div>
    </>
  );
}

function Talk(props: { isAnswer: boolean; question: string | null; initial: string; onChange: (t: string) => void; onBack: () => void; onDone: (t: string) => void }) {
  const { isAnswer, question } = props;
  const [text, setText] = useState(props.initial);
  const ta = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { const t = setTimeout(() => ta.current?.focus(), 50); return () => clearTimeout(t); }, []);
  return (
    <>
      <button className="back" onClick={props.onBack}>← Back</button>
      <div className="eyebrow">{isAnswer ? "Going deeper" : "Step 2 of 2"}</div>
      <h1>{isAnswer ? question : "What's on your mind?"}</h1>
      <p className="muted" style={{ marginTop: 6 }}>
        {isAnswer ? "Answer however you want. It gets folded into today's entry." : "The good stuff and the not-so-good stuff. Ramble. Nothing needs to make sense yet."}
      </p>
      {/* Milestone 2 adds the record button here. */}
      <div className="tip" style={{ margin: "16px 0 4px" }}>🎙 Tap the microphone on your keyboard to talk instead of typing.</div>
      <div className="talk-box" style={{ marginTop: 12 }}>
        <textarea
          ref={ta}
          value={text}
          placeholder={isAnswer ? "Talk it through…" : "So today…"}
          onChange={(ev) => { setText(ev.target.value); props.onChange(ev.target.value); }}
        />
        <div className="partial" />
      </div>
      <div className="sticky-foot"><div className="inner">
        <button className="btn btn-primary btn-block" disabled={!text.trim()} onClick={() => { const t = text.trim(); if (t) props.onDone(t); }}>
          {isAnswer ? "Add to my entry" : "I'm done talking"}
        </button>
      </div></div>
    </>
  );
}

const OPTS: [Mode, string, string, string][] = [
  ["note", "📝", "Just note it", "Organize it into today's entry. Nothing back from me."],
  ["reflect", "💛", "Reflect it back", "Organize it, plus a few lines on what I heard."],
  ["prompt", "💬", "Prompt me", "Organize it, then ask one question to help me go deeper."],
];

function Choose({ onMore, onGo }: { onMore: () => void; onGo: (m: Mode) => void }) {
  const [pick, setPick] = useState<Mode>("note");
  return (
    <>
      <div className="eyebrow">Got it</div>
      <h1>What would you like?</h1>
      <p className="muted" style={{ marginTop: 6 }}>Either way, this becomes a dated, organized journal entry.</p>
      <div style={{ marginTop: 20 }}>
        {OPTS.map(([k, ic, t, d]) => (
          <button key={k} className={"card opt" + (k === pick ? " on" : "")} aria-pressed={k === pick} onClick={() => setPick(k)}>
            <div className="ic">{ic}</div>
            <div><b>{t}</b><span className="small muted">{d}</span></div>
          </button>
        ))}
      </div>
      <button className="btn btn-ghost btn-block" style={{ marginTop: 10 }} onClick={onMore}>Wait, I want to keep talking</button>
      <div className="sticky-foot"><div className="inner">
        <button className="btn btn-primary btn-block" onClick={() => onGo(pick)}>Make my entry</button>
      </div></div>
    </>
  );
}

function EntryView(props: {
  e: Entry; question: string | null;
  onBack: () => void; onAnswer: (q: string) => void; onSkip: () => void;
  onAddMore: () => void; onCopy: () => void; onDelete: () => void;
}) {
  const { e, question: q } = props;
  const en = e.entry;
  return (
    <>
      <button className="back" onClick={props.onBack}>← All entries</button>
      <div className="entry-head">
        <div className="date">{fmtDate(e.createdAt)} · {fmtTime(e.createdAt)}</div>
        <h1>{en?.title || "Untitled"}</h1>
        {(e.moods?.length > 0 || e.moodWord) && (
          <div className="mood-tags">
            {e.moods.map((m) => <span key={m} className="tag">{moodEmoji(m)} {m}</span>)}
            {e.moodWord && <span className="tag">“{e.moodWord}”</span>}
          </div>
        )}
      </div>
      {en?.summary && <p className="summary">{en.summary}</p>}
      <div className="stack" style={{ marginTop: 18 }}>
        {(en?.sections || []).map((s, i) => (
          <div key={i} className="card section">
            <h3>{s.heading}</h3>
            <ul>{(s.points || []).map((p, j) => <li key={j}>{p}</li>)}</ul>
          </div>
        ))}
        {(en?.highlights || []).length > 0 && (
          <div className="card highlights section">
            <h3>✨ Good moments</h3>
            <ul>{en!.highlights.map((h, j) => <li key={j}>{h}</li>)}</ul>
          </div>
        )}
        {en?.reflection && (
          <div className="card reflection">
            <div className="eyebrow" style={{ marginBottom: 6 }}>What I heard</div>
            <p>{en.reflection}</p>
          </div>
        )}
        {q && (
          <div className="card question">
            <div className="eyebrow">A question for you</div>
            <p className="q">{q}</p>
            <div className="row">
              <button className="btn btn-primary" onClick={() => props.onAnswer(q)}>Answer it</button>
              <button className="btn btn-ghost" onClick={props.onSkip}>Not now</button>
            </div>
          </div>
        )}
        <div className="card">
          <details>
            <summary>What I actually said</summary>
            <div className="raw">{e.raw}</div>
            {(e.followups || []).filter((f) => f.a).map((f, i) => (
              <div key={i} className="follow"><b>{f.q}</b><div className="raw">{f.a}</div></div>
            ))}
          </details>
        </div>
      </div>
      <div className="actions">
        <button className="btn btn-soft" onClick={props.onCopy}>Copy entry</button>
        <button className="btn btn-soft" onClick={props.onAddMore}>Add more</button>
        <button className="btn btn-ghost" onClick={props.onDelete}>Delete</button>
      </div>
    </>
  );
}
