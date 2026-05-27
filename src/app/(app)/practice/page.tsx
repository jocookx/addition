"use client";

import Image from "next/image";
import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { AppFrame } from "@/components/legacy/AppFrame";
import { useToast } from "@/components/toast/ToastContext";
import type { CommandListItem } from "@/domain/command";
import { getCommands } from "@/lib/api/commands";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";

type PracticeFocus = "random" | "mostused" | "menu" | "due" | "weakest";
type QuestionType = "desc_to_name" | "name_to_desc" | "gif_to_name" | "name_to_shortcut";

type PracticeConfig = {
  software: string;
  focus: PracticeFocus;
  menuFilter: string | null;
  sessionSize: number;
};

type PracticeProgressEntry = {
  ease: number;
  due: string;
  reps: number;
};

type PracticeStore = {
  practiceData: Record<string, PracticeProgressEntry>;
  xp: number;
  streak: {
    count: number;
    lastDate: string | null;
  };
};

type PracticeCard = CommandListItem & {
  questionType: QuestionType;
  correctAnswer: string;
  options: string[];
};

type PracticeSession = {
  cards: PracticeCard[];
  index: number;
  correct: number;
  incorrect: number;
  xpEarned: number;
  lives: number;
  missedCards: Array<{ name: string; software: string; correctAnswer: string }>;
};

const PRACTICE_STORAGE_KEY = "addition.practice-state";

const defaultConfig: PracticeConfig = {
  software: "All",
  focus: "random",
  menuFilter: null,
  sessionSize: 10,
};

const focusModes: Array<{ value: PracticeFocus; label: string; icon: string }> = [
  { value: "random", label: "Random", icon: "R" },
  { value: "mostused", label: "Most Used", icon: "MU" },
  { value: "menu", label: "By Menu", icon: "M" },
  { value: "due", label: "Due Today", icon: "D" },
  { value: "weakest", label: "Weakest", icon: "W" },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function tomorrowIso() {
  return new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
}

function shuffle<T>(items: T[]) {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function readPracticeStore(): PracticeStore {
  if (typeof window === "undefined") {
    return { practiceData: {}, xp: 0, streak: { count: 0, lastDate: null } };
  }
  try {
    const raw = window.localStorage.getItem(PRACTICE_STORAGE_KEY);
    if (!raw) return { practiceData: {}, xp: 0, streak: { count: 0, lastDate: null } };
    const parsed = JSON.parse(raw) as Partial<PracticeStore>;
    return {
      practiceData: parsed.practiceData || {},
      xp: parsed.xp || 0,
      streak: parsed.streak || { count: 0, lastDate: null },
    };
  } catch {
    return { practiceData: {}, xp: 0, streak: { count: 0, lastDate: null } };
  }
}

function practiceKey(command: CommandListItem) {
  return `${command.software}::${command.name}`;
}

function updateSm2(entry: PracticeProgressEntry | undefined, correct: boolean): PracticeProgressEntry {
  const current = entry || { ease: 2.5, due: todayIso(), reps: 0 };
  if (correct) {
    return {
      ease: Math.min(3, Number((current.ease + 0.1).toFixed(2))),
      reps: current.reps + 1,
      due: tomorrowIso(),
    };
  }
  return {
    ease: Math.max(1.3, Number((current.ease - 0.2).toFixed(2))),
    reps: 0,
    due: todayIso(),
  };
}

export default function PracticePage() {
  const toast = useToast();
  const [commands, setCommands] = useState<CommandListItem[]>([]);
  const [status, setStatus] = useState("Loading quiz data...");
  const [config, setConfig] = useState<PracticeConfig>(defaultConfig);
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [view, setView] = useState<"setup" | "session" | "summary">("setup");
  const [store, setStore] = useState<PracticeStore>(() => readPracticeStore());
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setAccessToken(data.session?.access_token ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setAccessToken(session?.access_token ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!accessToken || !commands.length) return;
    let canceled = false;
    fetch("/api/v1/learning/progress", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((res) => res.ok ? res.json() as Promise<{ commands: Array<{ commandId: string; attemptedCount: number; confidence: number; masteryState: string; lastPracticedAt: string }> }> : null)
      .then((payload) => {
        if (canceled || !payload) return;
        const byId = new Map(commands.map((command) => [command.id, command]));
        const practiceData: Record<string, PracticeProgressEntry> = {};
        payload.commands.forEach((item) => {
          const command = byId.get(item.commandId);
          if (!command) return;
          practiceData[practiceKey(command)] = {
            ease: Math.max(1.3, Math.min(3, 1.3 + item.confidence / 60)),
            due: todayIso(),
            reps: item.attemptedCount,
          };
        });
        setStore((current) => ({ ...current, practiceData: { ...current.practiceData, ...practiceData } }));
      })
      .catch(() => {});
    return () => { canceled = true; };
  }, [accessToken, commands]);

  useEffect(() => {
    let canceled = false;
    async function load() {
      try {
        const data = await getCommands();
        if (canceled) return;
        setCommands(data.filter((item) => item.name && item.description));
        setStatus(`${data.length} commands ready.`);
      } catch (error) {
        if (canceled) return;
        setStatus(error instanceof Error ? error.message : "Failed to load quiz data.");
      }
    }
    void load();
    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(store));
  }, [store]);

  const softwareOptions = useMemo(() => {
    const values = new Set(commands.map((item) => item.software).filter(Boolean));
    return ["All", ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [commands]);

  const menuOptions = useMemo(() => {
    const filtered = config.software === "All" ? commands : commands.filter((item) => item.software === config.software);
    return Array.from(new Set(filtered.map((item) => item.menu).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, [commands, config.software]);

  const dueCount = useMemo(
    () =>
      commands.filter((command) => {
        const entry = store.practiceData[practiceKey(command)];
        return !entry || entry.due <= todayIso();
      }).length,
    [commands, store.practiceData],
  );

  const weakCount = useMemo(
    () =>
      commands.filter((command) => {
        const entry = store.practiceData[practiceKey(command)];
        return (entry?.ease || 2.5) < 2;
      }).length,
    [commands, store.practiceData],
  );

  function pickDistractors(card: CommandListItem, field: keyof CommandListItem, count: number) {
    const sameSoftware = commands.filter((item) => item.id !== card.id && item.software === card.software && item[field]);
    const otherSoftware = commands.filter((item) => item.id !== card.id && item.software !== card.software && item[field]);
    const seen = new Set<string>([String(card[field] || "")]);
    const values: string[] = [];

    for (const item of [...sameSoftware, ...otherSoftware]) {
      const value = String(item[field] || "").trim();
      if (!value || seen.has(value)) continue;
      seen.add(value);
      values.push(value);
      if (values.length >= count) break;
    }

    while (values.length < count) values.push("-");
    return values;
  }

  function startSession() {
    let pool = commands.filter((item) => item.name && item.description);
    if (config.software !== "All") pool = pool.filter((item) => item.software === config.software);

    if (config.focus === "menu" && config.menuFilter) {
      pool = pool.filter((item) => item.menu === config.menuFilter);
    } else if (config.focus === "due") {
      const due = pool.filter((item) => {
        const entry = store.practiceData[practiceKey(item)];
        return !entry || entry.due <= todayIso();
      });
      pool = due.length ? due : pool;
    } else if (config.focus === "weakest") {
      const weak = pool.filter((item) => (store.practiceData[practiceKey(item)]?.ease || 2.5) < 2.2);
      pool = weak.length
        ? weak.sort((a, b) => (store.practiceData[practiceKey(a)]?.ease || 2.5) - (store.practiceData[practiceKey(b)]?.ease || 2.5))
        : pool;
    }

    if (config.focus === "random" || config.focus === "due" || config.focus === "menu" || config.focus === "mostused") {
      pool = shuffle(pool);
    }

    const cards = pool.slice(0, config.sessionSize).map((command) => {
      const availableTypes: QuestionType[] = ["desc_to_name"];
      if (command.menu) availableTypes.push("name_to_desc");
      if (command.gif) availableTypes.push("gif_to_name");
      if (command.shortcut) availableTypes.push("name_to_shortcut");
      const questionType = availableTypes[Math.floor(Math.random() * availableTypes.length)];

      if (questionType === "name_to_shortcut") {
        const correctAnswer = command.shortcut || "-";
        return {
          ...command,
          questionType,
          correctAnswer,
          options: shuffle([correctAnswer, ...pickDistractors(command, "shortcut", 3)]),
        };
      }

      if (questionType === "name_to_desc") {
        return {
          ...command,
          questionType,
          correctAnswer: command.description,
          options: shuffle([command.description, ...pickDistractors(command, "description", 3)]),
        };
      }

      return {
        ...command,
        questionType,
        correctAnswer: command.name,
        options: shuffle([command.name, ...pickDistractors(command, "name", 3)]),
      };
    });

    if (!cards.length) {
      setStatus("No commands found for this selection. Try a different filter.");
      return;
    }

    setSession({
      cards,
      index: 0,
      correct: 0,
      incorrect: 0,
      xpEarned: 0,
      lives: 3,
      missedCards: [],
    });
    setSelectedAnswer(null);
    setView("session");
  }

  function submitAnswer() {
    if (!session || selectedAnswer === null) return;
    const card = session.cards[session.index];
    const correct = card.options[selectedAnswer] === card.correctAnswer;
    const key = practiceKey(card);
    const xpGain = correct ? 10 : 2;
    if (accessToken && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(card.id)) {
      void fetch("/api/v1/learning/progress", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          commands: [{
            commandId: card.id,
            attemptedDelta: 1,
            correctDelta: correct ? 1 : 0,
            incorrectDelta: correct ? 0 : 1,
          }],
        }),
      }).catch(() => {});
    }

    setStore((current) => {
      const updatedData = {
        ...current.practiceData,
        [key]: updateSm2(current.practiceData[key], correct),
      };
      return {
        ...current,
        practiceData: updatedData,
        xp: current.xp + xpGain,
      };
    });

    const nextSession: PracticeSession = {
      ...session,
      correct: session.correct + (correct ? 1 : 0),
      incorrect: session.incorrect + (correct ? 0 : 1),
      xpEarned: session.xpEarned + xpGain,
      lives: correct ? session.lives : Math.max(0, session.lives - 1),
      missedCards: correct
        ? session.missedCards
        : [...session.missedCards, { name: card.name, software: card.software, correctAnswer: card.correctAnswer }],
      index: session.index + 1,
    };

    if (nextSession.index >= nextSession.cards.length) {
      setStore((current) => {
        const today = todayIso();
        const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
        const streak = { ...current.streak };
        if (streak.lastDate === today) {
          return {
            ...current,
            xp: current.xp + (nextSession.incorrect === 0 ? 50 : 0),
          };
        }
        streak.count = streak.lastDate === yesterday ? streak.count + 1 : 1;
        streak.lastDate = today;
        return {
          ...current,
          streak,
          xp: current.xp + (nextSession.incorrect === 0 ? 50 : 0),
        };
      });

      if (nextSession.incorrect === 0) nextSession.xpEarned += 50;
      setSession(nextSession);
      setView("summary");
      setSelectedAnswer(null);
      // Fire end-of-session toast
      const acc = Math.round((nextSession.correct / Math.max(1, nextSession.correct + nextSession.incorrect)) * 100);
      if (acc === 100) {
        toast({ type: "streak", title: `Perfect! +${nextSession.xpEarned} XP 🎉`, body: "Flawless session — nothing missed.", duration: 5000 });
      } else {
        toast({ type: "success", title: `+${nextSession.xpEarned} XP earned`, body: `${acc}% accuracy · ${nextSession.correct} correct` });
      }
      return;
    }

    setSession(nextSession);
    setSelectedAnswer(null);
  }

  const submitAnswerFromKeyboard = useEffectEvent(() => {
    submitAnswer();
  });

  useEffect(() => {
    if (view !== "session" || !session) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setView("setup");
        setSession(null);
        setSelectedAnswer(null);
        return;
      }

      if (selectedAnswer === null && /^[1-4]$/.test(event.key)) {
        const idx = Number.parseInt(event.key, 10) - 1;
        const currentCard = session?.cards[session.index];
        if (currentCard?.options[idx]) setSelectedAnswer(idx);
        return;
      }

      if (event.key === "Enter" && selectedAnswer !== null) {
        submitAnswerFromKeyboard();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedAnswer, session, view]);

  const activeCard = session && view === "session" ? session.cards[session.index] : null;
  const answered = activeCard && selectedAnswer !== null;
  const activeCorrect = answered ? activeCard.options[selectedAnswer] === activeCard.correctAnswer : false;
  const accuracy = session ? Math.round((session.correct / Math.max(1, session.correct + session.incorrect)) * 100) : 0;

  return (
    <AppFrame
      title="Quiz"
      subtitle="Spaced-repetition flashcards to build lasting recall of commands and workflows."
      topTabs={[]}
    >
      {view === "setup" ? (
        <div className="practice-setup">
          <div className="psetup-hero">
            <div className="psetup-hero-text">
              <h1 className="psetup-title">Flashcards</h1>
              <p className="psetup-sub">Rapid recall on commands and workflows.</p>
              <div className="psetup-select-wrap">
                <select
                  className="psetup-select"
                  value={config.software}
                  onChange={(event) => setConfig((current) => ({ ...current, software: event.target.value, menuFilter: null }))}
                >
                  {softwareOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <span className="psetup-select-chevron">v</span>
              </div>
            </div>

            <div className="psetup-hero-stats">
              <div className="psetup-stat">
                <div className="psetup-stat-icon">XP</div>
                <div>
                  <div className="psetup-stat-val">{store.xp.toLocaleString()}</div>
                  <div className="psetup-stat-label">Total XP</div>
                </div>
              </div>
              <div className="psetup-stat-divider" />
              <div className="psetup-stat">
                <div className="psetup-stat-icon psetup-stat-icon--streak">S</div>
                <div>
                  <div className="psetup-stat-val">{store.streak.count}</div>
                  <div className="psetup-stat-label">Day streak</div>
                </div>
              </div>
              <div className="psetup-stat-divider" />
              <div className="psetup-stat">
                <div className="psetup-stat-icon psetup-stat-icon--due">D</div>
                <div>
                  <div className="psetup-stat-val">{dueCount}</div>
                  <div className="psetup-stat-label">Due today</div>
                </div>
              </div>
            </div>
          </div>

          <div className="psetup-body">
            <div className="psetup-section">
              <div className="psetup-label">Mode</div>
              <div className="psetup-mode-grid">
                {focusModes.map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    className={`psetup-mode-btn${config.focus === mode.value ? " active" : ""}`}
                    onClick={() =>
                      setConfig((current) => ({
                        ...current,
                        focus: mode.value,
                        menuFilter: mode.value === "menu" ? current.menuFilter : null,
                      }))
                    }
                  >
                    <span className="psetup-mode-icon">{mode.icon}</span>
                    <span className="psetup-mode-text">
                      <span className="psetup-mode-label">{mode.label}</span>
                      <span className="psetup-mode-desc">
                        {mode.value === "due" ? `${dueCount} waiting` : mode.value === "weakest" ? `${weakCount} to strengthen` : mode.value === "menu" ? "One category" : mode.value === "mostused" ? "Mixed selection" : "Full shuffle"}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {config.focus === "menu" && menuOptions.length ? (
              <div className="psetup-section">
                <div className="psetup-label">Category</div>
                <div className="psetup-pill-row">
                  {menuOptions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`psetup-pill${config.menuFilter === item ? " active" : ""}`}
                      onClick={() => setConfig((current) => ({ ...current, menuFilter: item }))}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="psetup-section">
              <div className="psetup-label">Session length</div>
              <div className="psetup-size-row">
                {[
                  { value: 10, label: "Quick", time: "~3 min" },
                  { value: 25, label: "Standard", time: "~8 min" },
                  { value: 50, label: "Deep dive", time: "~15 min" },
                ].map((size) => (
                  <button
                    key={size.value}
                    type="button"
                    className={`psetup-size-btn${config.sessionSize === size.value ? " active" : ""}`}
                    onClick={() => setConfig((current) => ({ ...current, sessionSize: size.value }))}
                  >
                    <span className="psetup-size-n">{size.value}</span>
                    <span className="psetup-size-label">{size.label}</span>
                    <span className="psetup-size-time">{size.time}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="psetup-cta-row">
              <button type="button" className="psetup-start-btn" onClick={startSession}>
                Start session
              </button>
            </div>
            <p className="meta">{status}</p>
          </div>
        </div>
      ) : null}

      {view === "session" && session && activeCard ? (
        <div className="psession-wrap">
          <div className="psession-topbar">
            <button
              type="button"
              className="psession-exit-btn"
              onClick={() => {
                setView("setup");
                setSession(null);
                setSelectedAnswer(null);
              }}
              aria-label="Exit practice"
            >
              X
            </button>
            <div className="psession-progress-wrap">
              <div className="psession-progress-bar" style={{ width: `${Math.round((session.index / session.cards.length) * 100)}%` }} />
            </div>
            <div className="psession-lives">
              {Array.from({ length: 3 }, (_, index) => (
                <span key={index}>{index < session.lives ? "HP" : "--"}</span>
              ))}
            </div>
          </div>

          <div className="psession-content">
            <div className="psession-counter">
              {session.index + 1} <span>/ {session.cards.length}</span>
            </div>
            <div className="psession-question">
              <p className="psession-context">
                {activeCard.questionType === "gif_to_name"
                  ? "Which command is shown?"
                  : activeCard.questionType === "name_to_desc"
                    ? "What does this command do?"
                    : activeCard.questionType === "name_to_shortcut"
                      ? "What is the keyboard shortcut?"
                      : "Which command does this describe?"}
              </p>

              {activeCard.questionType === "gif_to_name" && activeCard.gif ? (
                <div className="psession-gif-wrap">
                  <Image src={activeCard.gif} alt="" className="psession-gif" width={1200} height={720} unoptimized />
                </div>
              ) : null}

              {(activeCard.questionType === "name_to_desc" || activeCard.questionType === "name_to_shortcut") && activeCard.menu ? (
                <div className="psession-breadcrumb">{`${activeCard.software} > ${activeCard.menu}`}</div>
              ) : null}

              {activeCard.questionType === "name_to_desc" || activeCard.questionType === "name_to_shortcut" ? (
                <div className="psession-command-name">{activeCard.name}</div>
              ) : null}

              {activeCard.questionType === "desc_to_name" ? <p className="psession-description">{activeCard.description}</p> : null}

              <div className="psession-options">
                {activeCard.options.map((option, index) => {
                  let stateClass = "";
                  if (answered) {
                    if (option === activeCard.correctAnswer) stateClass = " correct";
                    else if (selectedAnswer === index) stateClass = " wrong";
                    else stateClass = " dimmed";
                  }

                  return (
                    <button
                      key={`${activeCard.id}-${option}-${index}`}
                      type="button"
                      className={`psession-option${stateClass}`}
                      onClick={() => {
                        if (answered) return;
                        setSelectedAnswer(index);
                      }}
                    >
                      <span className={`psession-option-letter${answered && option === activeCard.correctAnswer ? " correct" : answered && selectedAnswer === index ? " wrong" : ""}`}>
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="psession-option-text">{option}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {answered ? (
            <div className={`psession-feedback ${activeCorrect ? "feedback-correct" : "feedback-wrong"}`}>
              <div className="psession-feedback-inner">
                <div className="psession-feedback-left">
                  <div>
                    <strong>{activeCorrect ? "Correct!" : "Not quite"}</strong>
                    <span>{activeCorrect ? "Press Enter or click continue." : activeCard.correctAnswer}</span>
                  </div>
                </div>
                <button type="button" className="psession-continue-btn" onClick={submitAnswer}>
                  Continue
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {view === "summary" && session ? (
        <div className="psum-wrap">
          <div className="psum-left">
            <h2 className="psum-title">
              {session.incorrect === 0 ? "Perfect session!" : accuracy >= 80 ? "Great work!" : accuracy >= 60 ? "Solid effort" : "Keep at it"}
            </h2>
            <div className="psum-score">
              {accuracy}
              <span>%</span>
            </div>
            <div className="psum-accuracy-bar-wrap">
              <div className="psum-accuracy-bar" style={{ width: `${accuracy}%` }} />
            </div>
            <div className="psum-detail">
              {session.correct} correct - {session.incorrect} missed
            </div>

            <div className="psum-stats">
              <div className="psum-stat">
                <div className="psum-stat-val psum-stat-xp">+{session.xpEarned}</div>
                <div className="psum-stat-label">XP earned</div>
              </div>
              <div className="psum-stat-divider" />
              <div className="psum-stat">
                <div className="psum-stat-val">{store.streak.count}</div>
                <div className="psum-stat-label">Day streak</div>
              </div>
              <div className="psum-stat-divider" />
              <div className="psum-stat">
                <div className="psum-stat-val">{store.xp.toLocaleString()}</div>
                <div className="psum-stat-label">Total XP</div>
              </div>
            </div>

            {session.incorrect === 0 ? <div className="psum-bonus">+50 XP perfect bonus</div> : null}

            <div className="psum-actions">
              <button type="button" className="psetup-start-btn" onClick={startSession}>
                Quiz again
              </button>
              <button
                type="button"
                className="psum-back-btn"
                onClick={() => {
                  setView("setup");
                  setSession(null);
                }}
              >
                Change quiz
              </button>
            </div>
          </div>

          <div className="psum-right">
            {session.missedCards.length ? (
              <div className="psum-missed">
                <div className="psum-missed-head">Review these</div>
                <div className="psum-missed-list">
                  {session.missedCards.map((item, index) => (
                    <div key={`${item.name}-${index}`} className="psum-missed-item">
                      <span className="psum-missed-name">{item.name}</span>
                      <span className="psum-missed-sw">{item.software}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="psum-clean">
                <p>No mistakes. Excellent recall.</p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </AppFrame>
  );
}
