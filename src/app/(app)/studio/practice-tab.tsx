"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchJson } from "@/lib/api/fetch-json";
import { LAUNCH_SOFTWARE } from "@/config/taxonomy";
import { ImageUploadField } from "./image-upload-field";
import { AdminDataTable, CsvBulkActions, EmptyState, MoreMenu, PageHeader, StatusBadge, type SavedView, type TableColumn } from "./studio-ui";

type FlashcardDeck = {
  id: string;
  title: string;
  software: string;
  topic: string;
  description: string;
  sort_order: number;
  published: boolean;
};
type Flashcard = {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  hint: string;
  sort_order: number;
};
type QuizQuestion = {
  id: string;
  software: string;
  topic: string;
  question_text: string;
  question_type: "mc" | "tf" | "short";
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty: string;
  tags: string[];
  published: boolean;
};
type Certificate = {
  id: string;
  title: string;
  software: string;
  description: string;
  passing_score: number;
  question_ids: string[];
  badge_image: string;
  published: boolean;
};

type PracticeSection = "flashcards" | "quiz" | "certificates";
type AiGenerateResponse = { fields: Record<string, unknown>; raw: string; model: string };

const SW_OPTIONS = ["", ...LAUNCH_SOFTWARE];
const DIFFICULTY_OPTIONS = ["beginner", "intermediate", "advanced"];
const PRACTICE_VIEWS: SavedView[] = [
  { id: "all", label: "All" },
  { id: "draft", label: "Drafts" },
  { id: "published", label: "Published" },
  { id: "attention", label: "Needs Attention" },
];

function useHeaders(accessToken: string) {
  return useMemo(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  }), [accessToken]);
}

function splitCsv(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function Notice({ ok, err, onClose }: { ok: string; err: string; onClose: () => void }) {
  if (ok) return <div className="st-notice st-notice--ok">{ok}</div>;
  if (err) return <div className="st-notice st-notice--err">{err} <button type="button" onClick={onClose}>x</button></div>;
  return null;
}

function FlashcardsSection({ accessToken }: { accessToken: string }) {
  const headers = useHeaders(accessToken);
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [selected, setSelected] = useState<FlashcardDeck | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [softwareFilter, setSoftwareFilter] = useState("All");
  const [activeView, setActiveView] = useState("all");
  const [newTitle, setNewTitle] = useState("");
  const [cardFront, setCardFront] = useState("");
  const [cardBack, setCardBack] = useState("");
  const [cardHint, setCardHint] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  useEffect(() => {
    fetchJson<{ decks: FlashcardDeck[] }>("/api/v1/admin/practice/flashcard-decks", { headers })
      .then(({ decks: data }) => setDecks(data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Decks failed to load."));
  }, [headers]);

  useEffect(() => {
    if (!selected) {
      return;
    }
    fetchJson<{ cards: Flashcard[] }>(`/api/v1/admin/practice/flashcards?deck_id=${selected.id}`, { headers })
      .then(({ cards: data }) => setCards(data))
      .catch(() => setCards([]));
  }, [headers, selected]);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2500);
  }

  async function createDeck() {
    const title = newTitle.trim() || "Untitled Practice Task";
    const created = await fetchJson<FlashcardDeck>("/api/v1/admin/practice/flashcard-decks", {
      method: "POST",
      headers,
      body: JSON.stringify({ title }),
    });
    setDecks((current) => [created, ...current]);
    setSelected(created);
    setNewTitle("");
    flash("Deck created.");
  }

  async function saveDeck(deck = selected) {
    if (!deck) return;
    const updated = await fetchJson<FlashcardDeck>(`/api/v1/admin/practice/flashcard-decks/${deck.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(deck),
    });
    setDecks((current) => current.map((item) => item.id === updated.id ? updated : item));
    setSelected(updated);
    flash("Deck saved.");
  }

  async function deleteDeck(deck: FlashcardDeck) {
    if (!window.confirm("Delete this deck and its cards?")) return;
    await fetchJson(`/api/v1/admin/practice/flashcard-decks/${deck.id}`, { method: "DELETE", headers });
    setDecks((current) => current.filter((item) => item.id !== deck.id));
    if (selected?.id === deck.id) setSelected(null);
    flash("Deck deleted.");
  }

  async function addCard() {
    if (!selected || !cardFront.trim() || !cardBack.trim()) return;
    const created = await fetchJson<Flashcard>("/api/v1/admin/practice/flashcards", {
      method: "POST",
      headers,
      body: JSON.stringify({ deck_id: selected.id, front: cardFront.trim(), back: cardBack.trim(), hint: cardHint.trim(), sort_order: cards.length }),
    });
    setCards((current) => [...current, created]);
    setCardFront("");
    setCardBack("");
    setCardHint("");
  }

  async function generateDeck() {
    setAiBusy(true);
    setError("");
    try {
      const result = await fetchJson<AiGenerateResponse>("/api/v1/admin/ai/generate", {
        method: "POST",
        headers,
        timeoutMs: 45_000,
        body: JSON.stringify({
          task: "flashcard-deck",
          context: {
            title: selected?.title || newTitle || "New practice deck",
            software: selected?.software || (softwareFilter !== "All" ? softwareFilter : ""),
            topic: selected?.topic || "",
            description: selected?.description || "",
            existingCards: cards.map((card) => ({ front: card.front, back: card.back })),
          },
        }),
      });
      const fields = result.fields;
      const cardsPayload = Array.isArray(fields.cards) ? fields.cards : [];
      const deck = selected ?? await fetchJson<FlashcardDeck>("/api/v1/admin/practice/flashcard-decks", {
        method: "POST",
        headers,
        body: JSON.stringify({ title: asString(fields.title) || newTitle || "AI practice deck" }),
      });
      const nextDeck = {
        ...deck,
        title: asString(fields.title) || deck.title,
        software: asString(fields.software) || deck.software,
        topic: asString(fields.topic) || deck.topic,
        description: asString(fields.description) || deck.description,
      };
      const savedDeck = await fetchJson<FlashcardDeck>(`/api/v1/admin/practice/flashcard-decks/${deck.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(nextDeck),
      });
      const createdCards = await Promise.all(cardsPayload.map((item, index) => {
        const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
        return fetchJson<Flashcard>("/api/v1/admin/practice/flashcards", {
          method: "POST",
          headers,
          body: JSON.stringify({
            deck_id: savedDeck.id,
            front: asString(record.front) || `Question ${index + 1}`,
            back: asString(record.back) || "Draft answer",
            hint: asString(record.hint),
            sort_order: cards.length + index,
          }),
        });
      }));
      setDecks((current) => current.some((item) => item.id === savedDeck.id)
        ? current.map((item) => item.id === savedDeck.id ? savedDeck : item)
        : [savedDeck, ...current]);
      setSelected(savedDeck);
      setCards((current) => [...current, ...createdCards]);
      flash(`AI generated ${createdCards.length} cards.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI deck generation failed.");
    } finally {
      setAiBusy(false);
    }
  }

  async function deleteCard(card: Flashcard) {
    await fetchJson(`/api/v1/admin/practice/flashcards/${card.id}`, { method: "DELETE", headers });
    setCards((current) => current.filter((item) => item.id !== card.id));
  }

  function patch(patchBody: Partial<FlashcardDeck>) {
    if (!selected) return;
    const updated = { ...selected, ...patchBody };
    setSelected(updated);
    setDecks((current) => current.map((item) => item.id === updated.id ? updated : item));
  }

  const filtered = decks.filter((deck) => {
    const haystack = `${deck.title} ${deck.software} ${deck.topic} ${deck.description}`.toLowerCase();
    if (query && !haystack.includes(query.toLowerCase())) return false;
    if (softwareFilter !== "All" && deck.software !== softwareFilter) return false;
    if (activeView === "published" && !deck.published) return false;
    if (activeView === "draft" && deck.published) return false;
    if (activeView === "attention" && deck.title && deck.software && deck.topic) return false;
    return true;
  });

  const columns: TableColumn<FlashcardDeck>[] = [
    { id: "title", label: "Task Title", sortValue: (deck) => deck.title, render: (deck) => <span className="aa-table-title"><strong>{deck.title}</strong><span>{deck.description || deck.topic || "No description"}</span></span> },
    { id: "software", label: "Software", sortValue: (deck) => deck.software, render: (deck) => deck.software || <span className="aa-table-muted">General</span> },
    { id: "level", label: "Level", render: () => <span className="aa-table-muted">Reusable</span> },
    { id: "time", label: "Estimated Time", render: () => <span className="aa-table-muted">Self-paced</span> },
    { id: "lessons", label: "Linked Lessons", render: () => <span className="aa-table-muted">Not tracked</span> },
    { id: "commands", label: "Linked Commands", render: () => <span className="aa-table-muted">Not tracked</span> },
    { id: "status", label: "Status", sortValue: (deck) => deck.published ? "Published" : "Draft", render: (deck) => <StatusBadge status={deck.published ? "Published" : "Draft"} /> },
    { id: "health", label: "Health", render: (deck) => deck.title && deck.software && deck.topic ? <span className="aa-health-pill good">Ready</span> : <span className="aa-health-pill warn">Missing metadata</span> },
    { id: "updated", label: "Updated", render: () => <span className="aa-table-muted">Not tracked</span> },
    { id: "actions", label: "Actions", render: (deck) => <span onClick={(event) => event.stopPropagation()}><MoreMenu><button type="button" onClick={() => setSelected(deck)}>Edit</button><button type="button" className="danger" onClick={() => void deleteDeck(deck)}>Delete</button></MoreMenu></span> },
  ];

  return (
    <div className="aa-library-page">
      <PageHeader eyebrow="Library" title="Practice Tasks" description="Reusable learner practice, flashcards, quiz questions and certificate checks." action={<div className="aa-action-cluster"><button className="aa-primary-button" type="button" onClick={() => void createDeck()}>Manual Deck</button><button className="aa-secondary-button" type="button" disabled={aiBusy} onClick={() => void generateDeck()}>{aiBusy ? "Generating..." : "AI deck"}</button></div>} />
      <section className="aa-curriculum-import-panel">
        <div>
          <span className="aa-eyebrow">CSV-first practice tasks</span>
          <h2>Import decks first, then import cards into those decks</h2>
          <p>Use the deck CSV for the practice structure, then the cards CSV for front, back, hint and order. Manual editing stays available for polishing individual tasks.</p>
        </div>
        <div className="aa-curriculum-import-actions">
          <CsvBulkActions entity="practice-decks" accessToken={accessToken} templateLabel="Download Decks CSV" importLabel="Import Decks CSV" />
          <CsvBulkActions entity="flashcards" accessToken={accessToken} templateLabel="Download Cards CSV" importLabel="Import Cards CSV" />
        </div>
      </section>
      <Notice ok={notice} err={error} onClose={() => setError("")} />
      <div className="aa-course-filter-bar">
        <label className="aa-compact-search"><span>Search</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search practice tasks..." /></label>
        <label><span>Software</span><select value={softwareFilter} onChange={(event) => setSoftwareFilter(event.target.value)}><option>All</option>{SW_OPTIONS.filter(Boolean).map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>New deck</span><input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void createDeck(); }} placeholder="New deck title..." /></label>
      </div>
      <AdminDataTable rows={filtered} columns={columns} savedViews={PRACTICE_VIEWS} activeView={activeView} onViewChange={setActiveView} selectedIds={selectedIds} onSelectedIdsChange={setSelectedIds} onRowClick={setSelected} getRowLabel={(deck) => deck.title} empty={<EmptyState title="No practice tasks yet" description="Create a flashcard deck, then add cards inside the editor." />} />
      {selected && (
        <div className="aa-drawer-backdrop" role="presentation">
          <aside className="aa-editor-drawer" aria-label="Practice task editor">
            <main className="aa-detail-panel">
              <header className="aa-editor-header"><div><h2>{selected.title}</h2><p>{cards.length} cards / {selected.software || "General"}</p></div><div className="aa-editor-actions"><button className="aa-secondary-button" type="button" onClick={() => setSelected(null)}>Close</button><button className="aa-primary-button" type="button" onClick={() => void saveDeck()}>Save</button></div></header>
              <section className="aa-panel aa-editor-body">
                <div className="aa-form-grid">
                  <label><span>Title</span><input value={selected.title} onChange={(event) => patch({ title: event.target.value })} /></label>
                  <label><span>Software</span><select value={selected.software} onChange={(event) => patch({ software: event.target.value })}>{SW_OPTIONS.map((item) => <option key={item} value={item}>{item || "General"}</option>)}</select></label>
                  <label><span>Topic</span><input value={selected.topic} onChange={(event) => patch({ topic: event.target.value })} /></label>
                  <label><span>Status</span><select value={selected.published ? "Published" : "Draft"} onChange={(event) => patch({ published: event.target.value === "Published" })}><option>Draft</option><option>Published</option></select></label>
                  <label className="span-2"><span>Description</span><textarea rows={3} value={selected.description} onChange={(event) => patch({ description: event.target.value })} /></label>
                </div>
              </section>
              <section className="aa-panel aa-editor-body">
                <div className="aa-panel-heading">
                  <div><h3>Cards</h3><p>Add reusable question and answer cards for this practice task.</p></div>
                  <div className="aa-action-cluster"><span>{cards.length} cards</span><button className="aa-secondary-button" type="button" disabled={aiBusy} onClick={() => void generateDeck()}>{aiBusy ? "Generating..." : "AI cards"}</button><CsvBulkActions entity="flashcards" accessToken={accessToken} /></div>
                </div>
                <div className="aa-form-grid">
                  <label><span>Front</span><textarea rows={2} value={cardFront} onChange={(event) => setCardFront(event.target.value)} /></label>
                  <label><span>Back</span><textarea rows={2} value={cardBack} onChange={(event) => setCardBack(event.target.value)} /></label>
                  <label className="span-2"><span>Hint</span><input value={cardHint} onChange={(event) => setCardHint(event.target.value)} /></label>
                  <button type="button" className="aa-primary-button" onClick={() => void addCard()}>Add Card</button>
                </div>
                <div className="aa-picker-list">
                  {cards.map((card) => (
                    <div key={card.id} className="aa-picker-row">
                      <div><strong>{card.front}</strong><p>{card.back}</p></div>
                      <button type="button" onClick={() => void deleteCard(card)}>Delete</button>
                    </div>
                  ))}
                </div>
              </section>
            </main>
          </aside>
        </div>
      )}
    </div>
  );
}

function QuizSection({ accessToken }: { accessToken: string }) {
  const headers = useHeaders(accessToken);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selected, setSelected] = useState<QuizQuestion | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [softwareFilter, setSoftwareFilter] = useState("All");
  const [activeView, setActiveView] = useState("all");
  const [newText, setNewText] = useState("");
  const [newOption, setNewOption] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  useEffect(() => {
    fetchJson<{ questions: QuizQuestion[] }>("/api/v1/admin/practice/quiz-questions", { headers })
      .then(({ questions: data }) => setQuestions(data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Questions failed to load."));
  }, [headers]);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2500);
  }

  async function createQuestion() {
    const question = newText.trim() || "Untitled quiz question";
    const created = await fetchJson<QuizQuestion>("/api/v1/admin/practice/quiz-questions", { method: "POST", headers, body: JSON.stringify({ question_text: question, question_type: "mc" }) });
    setQuestions((current) => [created, ...current]);
    setSelected(created);
    setNewText("");
    flash("Question created.");
  }

  async function saveQuestion(question = selected) {
    if (!question) return;
    const updated = await fetchJson<QuizQuestion>(`/api/v1/admin/practice/quiz-questions/${question.id}`, { method: "PATCH", headers, body: JSON.stringify(question) });
    setQuestions((current) => current.map((item) => item.id === updated.id ? updated : item));
    setSelected(updated);
    flash("Question saved.");
  }

  async function deleteQuestion(question: QuizQuestion) {
    if (!window.confirm("Delete this question?")) return;
    await fetchJson(`/api/v1/admin/practice/quiz-questions/${question.id}`, { method: "DELETE", headers });
    setQuestions((current) => current.filter((item) => item.id !== question.id));
    if (selected?.id === question.id) setSelected(null);
    flash("Question deleted.");
  }

  function patch(patchBody: Partial<QuizQuestion>) {
    if (!selected) return;
    const updated = { ...selected, ...patchBody };
    setSelected(updated);
    setQuestions((current) => current.map((item) => item.id === updated.id ? updated : item));
  }

  function addOption() {
    if (!selected || !newOption.trim()) return;
    patch({ options: [...selected.options, newOption.trim()] });
    setNewOption("");
  }

  async function generateQuestion() {
    setAiBusy(true);
    setError("");
    try {
      const result = await fetchJson<AiGenerateResponse>("/api/v1/admin/ai/generate", {
        method: "POST",
        headers,
        timeoutMs: 45_000,
        body: JSON.stringify({
          task: "quiz-question",
          context: {
            question: selected?.question_text || newText,
            software: selected?.software || (softwareFilter !== "All" ? softwareFilter : ""),
            topic: selected?.topic || "",
            difficulty: selected?.difficulty || "beginner",
          },
        }),
      });
      const fields = result.fields;
      const payload = {
        software: asString(fields.software),
        topic: asString(fields.topic),
        question_text: asString(fields.question_text) || newText || "AI generated quiz question",
        question_type: asString(fields.question_type) || "mc",
        options: asStringArray(fields.options),
        correct_answer: asString(fields.correct_answer),
        explanation: asString(fields.explanation),
        difficulty: asString(fields.difficulty) || "beginner",
        tags: asStringArray(fields.tags),
        published: false,
      };
      const saved = selected
        ? await fetchJson<QuizQuestion>(`/api/v1/admin/practice/quiz-questions/${selected.id}`, { method: "PATCH", headers, body: JSON.stringify({ ...selected, ...payload }) })
        : await fetchJson<QuizQuestion>("/api/v1/admin/practice/quiz-questions", { method: "POST", headers, body: JSON.stringify(payload) });
      setQuestions((current) => current.some((item) => item.id === saved.id) ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current]);
      setSelected(saved);
      setNewText("");
      flash("AI quiz question generated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI quiz generation failed.");
    } finally {
      setAiBusy(false);
    }
  }

  const filtered = questions.filter((question) => {
    const haystack = `${question.question_text} ${question.software} ${question.topic} ${question.tags.join(" ")}`.toLowerCase();
    if (query && !haystack.includes(query.toLowerCase())) return false;
    if (softwareFilter !== "All" && question.software !== softwareFilter) return false;
    if (activeView === "published" && !question.published) return false;
    if (activeView === "draft" && question.published) return false;
    if (activeView === "attention" && question.correct_answer && question.explanation) return false;
    return true;
  });

  const columns: TableColumn<QuizQuestion>[] = [
    { id: "title", label: "Task Title", sortValue: (row) => row.question_text, render: (row) => <span className="aa-table-title"><strong>{row.question_text}</strong><span>{row.topic || row.explanation || "No topic"}</span></span> },
    { id: "software", label: "Software", sortValue: (row) => row.software, render: (row) => row.software || <span className="aa-table-muted">General</span> },
    { id: "level", label: "Level", sortValue: (row) => row.difficulty, render: (row) => row.difficulty },
    { id: "time", label: "Estimated Time", render: () => <span className="aa-table-muted">2 min</span> },
    { id: "lessons", label: "Linked Lessons", render: () => <span className="aa-table-muted">Not tracked</span> },
    { id: "commands", label: "Linked Commands", render: (row) => row.tags.length },
    { id: "status", label: "Status", sortValue: (row) => row.published ? "Published" : "Draft", render: (row) => <StatusBadge status={row.published ? "Published" : "Draft"} /> },
    { id: "health", label: "Health", render: (row) => row.correct_answer && row.explanation ? <span className="aa-health-pill good">Ready</span> : <span className="aa-health-pill warn">Missing answer</span> },
    { id: "updated", label: "Updated", render: () => <span className="aa-table-muted">Not tracked</span> },
    { id: "actions", label: "Actions", render: (row) => <span onClick={(event) => event.stopPropagation()}><MoreMenu><button type="button" onClick={() => setSelected(row)}>Edit</button><button type="button" className="danger" onClick={() => void deleteQuestion(row)}>Delete</button></MoreMenu></span> },
  ];

  return (
    <div className="aa-library-page">
      <PageHeader eyebrow="Library" title="Quiz Bank" description="Reusable quiz questions for practice and certification." action={<div className="aa-action-cluster"><button className="aa-primary-button" type="button" onClick={() => void createQuestion()}>Manual Question</button><button className="aa-secondary-button" type="button" disabled={aiBusy} onClick={() => void generateQuestion()}>{aiBusy ? "Generating..." : "AI question"}</button></div>} />
      <section className="aa-curriculum-import-panel">
        <div>
          <span className="aa-eyebrow">CSV-first quiz bank</span>
          <h2>Import reusable quiz questions before editing manually</h2>
          <p>Use one sheet for question text, type, answer, explanation, software, topic, difficulty, options, tags and published state.</p>
        </div>
        <div className="aa-curriculum-import-actions">
          <CsvBulkActions entity="quiz-questions" accessToken={accessToken} templateLabel="Download Quiz CSV" importLabel="Import Quiz CSV" />
        </div>
      </section>
      <Notice ok={notice} err={error} onClose={() => setError("")} />
      <div className="aa-course-filter-bar">
        <label className="aa-compact-search"><span>Search</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search questions..." /></label>
        <label><span>Software</span><select value={softwareFilter} onChange={(event) => setSoftwareFilter(event.target.value)}><option>All</option>{SW_OPTIONS.filter(Boolean).map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>New question</span><input value={newText} onChange={(event) => setNewText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void createQuestion(); }} placeholder="Question text..." /></label>
      </div>
      <AdminDataTable rows={filtered} columns={columns} savedViews={PRACTICE_VIEWS} activeView={activeView} onViewChange={setActiveView} selectedIds={selectedIds} onSelectedIdsChange={setSelectedIds} onRowClick={setSelected} getRowLabel={(row) => row.question_text} empty={<EmptyState title="No quiz questions yet" description="Create reusable questions for practice and certificates." />} />
      {selected && (
        <div className="aa-drawer-backdrop" role="presentation">
          <aside className="aa-editor-drawer" aria-label="Quiz editor">
            <main className="aa-detail-panel">
              <header className="aa-editor-header"><div><h2>{selected.question_text}</h2><p>{selected.question_type.toUpperCase()} / {selected.software || "General"}</p></div><div className="aa-editor-actions"><button className="aa-secondary-button" type="button" onClick={() => setSelected(null)}>Close</button><button className="aa-primary-button" type="button" onClick={() => void saveQuestion()}>Save</button></div></header>
              <section className="aa-panel aa-editor-body">
                <div className="aa-form-grid">
                  <label className="span-2"><span>Question</span><textarea rows={3} value={selected.question_text} onChange={(event) => patch({ question_text: event.target.value })} /></label>
                  <label><span>Type</span><select value={selected.question_type} onChange={(event) => patch({ question_type: event.target.value as QuizQuestion["question_type"] })}><option value="mc">Multiple choice</option><option value="tf">True / False</option><option value="short">Short answer</option></select></label>
                  <label><span>Difficulty</span><select value={selected.difficulty} onChange={(event) => patch({ difficulty: event.target.value })}>{DIFFICULTY_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label><span>Software</span><select value={selected.software} onChange={(event) => patch({ software: event.target.value })}>{SW_OPTIONS.map((item) => <option key={item} value={item}>{item || "General"}</option>)}</select></label>
                  <label><span>Status</span><select value={selected.published ? "Published" : "Draft"} onChange={(event) => patch({ published: event.target.value === "Published" })}><option>Draft</option><option>Published</option></select></label>
                  <label><span>Correct answer</span><input value={selected.correct_answer} onChange={(event) => patch({ correct_answer: event.target.value })} /></label>
                  <label><span>Topic</span><input value={selected.topic} onChange={(event) => patch({ topic: event.target.value })} /></label>
                  <label className="span-2"><span>Explanation</span><textarea rows={4} value={selected.explanation} onChange={(event) => patch({ explanation: event.target.value })} /></label>
                  <label className="span-2"><span>Tags</span><input value={selected.tags.join(", ")} onChange={(event) => patch({ tags: splitCsv(event.target.value) })} /></label>
                </div>
              </section>
              {selected.question_type === "mc" && (
                <section className="aa-panel aa-editor-body">
                  <div className="aa-panel-heading"><div><h3>Options</h3><p>Set the correct answer above to match an option.</p></div></div>
                  <div className="aa-picker-list">
                    {selected.options.map((option, index) => (
                      <div key={`${option}-${index}`} className="aa-picker-row">
                        <input value={option} onChange={(event) => {
                          const next = [...selected.options];
                          next[index] = event.target.value;
                          patch({ options: next });
                        }} />
                        <button type="button" onClick={() => patch({ options: selected.options.filter((_, idx) => idx !== index) })}>Remove</button>
                      </div>
                    ))}
                  </div>
                  <div className="aa-inline-create"><input value={newOption} onChange={(event) => setNewOption(event.target.value)} placeholder="Add option..." /><button type="button" onClick={addOption}>Add</button></div>
                </section>
              )}
            </main>
          </aside>
        </div>
      )}
    </div>
  );
}

function CertificatesSection({ accessToken }: { accessToken: string }) {
  const headers = useHeaders(accessToken);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selected, setSelected] = useState<Certificate | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchJson<{ certificates: Certificate[] }>("/api/v1/admin/practice/certificates", { headers }),
      fetchJson<{ questions: QuizQuestion[] }>("/api/v1/admin/practice/quiz-questions", { headers }),
    ]).then(([certData, questionData]) => {
      setCerts(certData.certificates);
      setQuestions(questionData.questions.filter((item) => item.published));
    }).catch((err: unknown) => setError(err instanceof Error ? err.message : "Certificates failed to load."));
  }, [headers]);

  function flash(message: string) { setNotice(message); window.setTimeout(() => setNotice(""), 2500); }

  async function createCert() {
    const title = newTitle.trim() || "Untitled Certificate";
    const created = await fetchJson<Certificate>("/api/v1/admin/practice/certificates", { method: "POST", headers, body: JSON.stringify({ title }) });
    setCerts((current) => [created, ...current]);
    setSelected(created);
    setNewTitle("");
    flash("Certificate created.");
  }

  async function saveCert(cert = selected) {
    if (!cert) return;
    const updated = await fetchJson<Certificate>(`/api/v1/admin/practice/certificates/${cert.id}`, { method: "PATCH", headers, body: JSON.stringify(cert) });
    setCerts((current) => current.map((item) => item.id === updated.id ? updated : item));
    setSelected(updated);
    flash("Certificate saved.");
  }

  async function deleteCert(cert: Certificate) {
    if (!window.confirm("Delete this certificate?")) return;
    await fetchJson(`/api/v1/admin/practice/certificates/${cert.id}`, { method: "DELETE", headers });
    setCerts((current) => current.filter((item) => item.id !== cert.id));
    if (selected?.id === cert.id) setSelected(null);
    flash("Certificate deleted.");
  }

  function patch(patchBody: Partial<Certificate>) {
    if (!selected) return;
    const updated = { ...selected, ...patchBody };
    setSelected(updated);
    setCerts((current) => current.map((item) => item.id === updated.id ? updated : item));
  }

  async function generateCertificate() {
    setAiBusy(true);
    setError("");
    try {
      const result = await fetchJson<AiGenerateResponse>("/api/v1/admin/ai/generate", {
        method: "POST",
        headers,
        timeoutMs: 45_000,
        body: JSON.stringify({
          task: "certificate",
          context: {
            title: selected?.title || newTitle,
            software: selected?.software || "",
            description: selected?.description || "",
            availableQuestions: questions.slice(0, 20).map((question) => question.question_text),
          },
        }),
      });
      const fields = result.fields;
      const payload = {
        title: asString(fields.title) || newTitle || "AI generated certificate",
        software: asString(fields.software),
        description: asString(fields.description),
        passing_score: asNumber(fields.passing_score, selected?.passing_score ?? 80),
        question_ids: selected?.question_ids ?? [],
        badge_image: selected?.badge_image ?? "",
        published: selected?.published ?? false,
      };
      const saved = selected
        ? await fetchJson<Certificate>(`/api/v1/admin/practice/certificates/${selected.id}`, { method: "PATCH", headers, body: JSON.stringify({ ...selected, ...payload }) })
        : await fetchJson<Certificate>("/api/v1/admin/practice/certificates", { method: "POST", headers, body: JSON.stringify(payload) });
      setCerts((current) => current.some((item) => item.id === saved.id) ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current]);
      setSelected(saved);
      setNewTitle("");
      flash("AI certificate generated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI certificate generation failed.");
    } finally {
      setAiBusy(false);
    }
  }

  const filtered = certs.filter((cert) => `${cert.title} ${cert.software} ${cert.description}`.toLowerCase().includes(query.toLowerCase()));
  const columns: TableColumn<Certificate>[] = [
    { id: "title", label: "Task Title", sortValue: (row) => row.title, render: (row) => <span className="aa-table-title"><strong>{row.title}</strong><span>{row.description || `${row.question_ids.length} questions`}</span></span> },
    { id: "software", label: "Software", sortValue: (row) => row.software, render: (row) => row.software || <span className="aa-table-muted">General</span> },
    { id: "level", label: "Level", render: () => <span className="aa-table-muted">Assessment</span> },
    { id: "time", label: "Estimated Time", render: () => <span className="aa-table-muted">Variable</span> },
    { id: "lessons", label: "Linked Lessons", render: () => <span className="aa-table-muted">Course setting</span> },
    { id: "commands", label: "Linked Commands", render: (row) => row.question_ids.length },
    { id: "status", label: "Status", sortValue: (row) => row.published ? "Published" : "Draft", render: (row) => <StatusBadge status={row.published ? "Published" : "Draft"} /> },
    { id: "health", label: "Health", render: (row) => row.question_ids.length > 0 && row.badge_image ? <span className="aa-health-pill good">Ready</span> : <span className="aa-health-pill warn">Missing setup</span> },
    { id: "updated", label: "Updated", render: () => <span className="aa-table-muted">Not tracked</span> },
    { id: "actions", label: "Actions", render: (row) => <span onClick={(event) => event.stopPropagation()}><MoreMenu><button type="button" onClick={() => setSelected(row)}>Edit</button><button type="button" className="danger" onClick={() => void deleteCert(row)}>Delete</button></MoreMenu></span> },
  ];

  return (
    <div className="aa-library-page">
      <PageHeader eyebrow="People" title="Certificates" description="Certificate templates, question sets and eligibility checks." action={<div className="aa-action-cluster"><button className="aa-primary-button" type="button" onClick={() => void createCert()}>+ New Certificate</button><button className="aa-secondary-button" type="button" disabled={aiBusy} onClick={() => void generateCertificate()}>{aiBusy ? "Generating..." : "AI certificate"}</button><CsvBulkActions entity="certificates" accessToken={accessToken} /></div>} />
      <Notice ok={notice} err={error} onClose={() => setError("")} />
      <div className="aa-course-filter-bar"><label className="aa-compact-search"><span>Search</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search certificates..." /></label><label><span>New certificate</span><input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void createCert(); }} placeholder="New certificate..." /></label></div>
      <AdminDataTable rows={filtered} columns={columns} savedViews={PRACTICE_VIEWS} activeView="all" onViewChange={() => {}} selectedIds={selectedIds} onSelectedIdsChange={setSelectedIds} onRowClick={setSelected} getRowLabel={(row) => row.title} empty={<EmptyState title="No certificates yet" description="Create certificates and connect published quiz questions." />} />
      {selected && (
        <div className="aa-drawer-backdrop" role="presentation">
          <aside className="aa-editor-drawer" aria-label="Certificate editor">
            <main className="aa-detail-panel">
              <header className="aa-editor-header"><div><h2>{selected.title}</h2><p>{selected.question_ids.length} questions / {selected.passing_score}% pass</p></div><div className="aa-editor-actions"><button className="aa-secondary-button" type="button" onClick={() => setSelected(null)}>Close</button><button className="aa-primary-button" type="button" onClick={() => void saveCert()}>Save</button></div></header>
              <section className="aa-panel aa-editor-body">
                <div className="aa-form-grid">
                  <label><span>Title</span><input value={selected.title} onChange={(event) => patch({ title: event.target.value })} /></label>
                  <label><span>Software</span><select value={selected.software} onChange={(event) => patch({ software: event.target.value })}>{SW_OPTIONS.map((item) => <option key={item} value={item}>{item || "General"}</option>)}</select></label>
                  <label><span>Passing score</span><input type="number" value={selected.passing_score} onChange={(event) => patch({ passing_score: Number(event.target.value) })} /></label>
                  <label><span>Status</span><select value={selected.published ? "Published" : "Draft"} onChange={(event) => patch({ published: event.target.value === "Published" })}><option>Draft</option><option>Published</option></select></label>
                  <label className="span-2"><span>Description</span><textarea rows={3} value={selected.description} onChange={(event) => patch({ description: event.target.value })} /></label>
                  <div className="span-2"><ImageUploadField accessToken={accessToken} label="Badge image" folder="certificate-badges" value={selected.badge_image} onChange={(value) => patch({ badge_image: value })} /></div>
                </div>
              </section>
              <section className="aa-panel aa-editor-body">
                <div className="aa-panel-heading"><div><h3>Questions</h3><p>Select published quiz questions used for this certificate.</p></div></div>
                <div className="aa-picker-list">
                  {questions.map((question) => {
                    const checked = selected.question_ids.includes(question.id);
                    return (
                      <label key={question.id} className={`aa-picker-row${checked ? " active" : ""}`}>
                        <input type="checkbox" checked={checked} onChange={() => patch({ question_ids: checked ? selected.question_ids.filter((id) => id !== question.id) : [...selected.question_ids, question.id] })} />
                        <div><strong>{question.question_text}</strong><p>{question.software || "General"} / {question.difficulty}</p></div>
                      </label>
                    );
                  })}
                </div>
              </section>
            </main>
          </aside>
        </div>
      )}
    </div>
  );
}

export function PracticeTab({ accessToken, initialSection = "flashcards" }: { accessToken: string; initialSection?: PracticeSection }) {
  const [section, setSection] = useState<PracticeSection>(initialSection);
  const sections: { id: PracticeSection; label: string }[] = [
    { id: "flashcards", label: "Flashcard Tasks" },
    { id: "quiz", label: "Quiz Bank" },
    { id: "certificates", label: "Certificates" },
  ];

  return (
    <div className="aa-library-page">
      <div className="st-practice-subtabs">
        {sections.map((item) => (
          <button key={item.id} type="button" className={`st-practice-subtab${section === item.id ? " active" : ""}`} onClick={() => setSection(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
      {section === "flashcards" && <FlashcardsSection accessToken={accessToken} />}
      {section === "quiz" && <QuizSection accessToken={accessToken} />}
      {section === "certificates" && <CertificatesSection accessToken={accessToken} />}
    </div>
  );
}
