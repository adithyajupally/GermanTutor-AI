# German Tutor AI — Frozen MVP Specification

**Version:** 1.1.1 (frozen)  
**Purpose:** Personal self-study. Not production/SaaS.  
**Stack:** React, Vite, TypeScript, Tailwind CSS, OpenAI API (Claude optional via provider setting).

---

## Canonical primary user flow (MVP)

This is the **only** mandatory path. Practice (`/`) is the default landing screen for this flow.

```
Select Level → Generate Random English Sentence → Translate to German → AI Evaluation → Detailed Feedback
```

| # | Step | MVP requirement |
|---|------|-----------------|
| 1 | **Select Level** | CEFR: A1, A2, B1, B2, C1 (required before generate) |
| 2 | **Generate Random English Sentence** | User clicks **Generate Sentence**; app produces one random English prompt for that level |
| 3 | **Translate to German** | User types German translation in textarea |
| 4 | **AI Evaluation** | User clicks **Check Translation**; AI evaluates (teacher mode, structured JSON) |
| 5 | **Detailed Feedback** | Result screen: scores, mistakes, why-not-my-version, alternatives, vocabulary, explanations |

**Optional refinements** (same screen, do not replace steps above): difficulty (Easy/Medium/Hard), category, strictness, focus tag, similar sentences after feedback.

**Not part of primary flow:** Error Notebook, History, Settings — accessed via secondary navigation only.

---

## 1. Product summary

**Core purpose:** English → German translation practice with AI tutor feedback.

The app exists for the canonical flow above. Notebook, history, and weak-area chips **support** practice; they are not the home experience.

Data stays in the browser (`localStorage`). API key in `.env` or Settings.

---

## 2. Primary workflow (default landing experience)

**Route:** `/` or **Practice** tab — this is what users see on first load. No dashboard gate, no login screen.

| Step | User action | System behavior |
|------|-------------|-----------------|
| 1 | Select **CEFR level:** A1, A2, B1, B2, C1 | Persist in session + settings default |
| 2 | Optionally select **difficulty** within level: Easy, Medium, Hard (default: **Medium**) | See §2.2 |
| 3 | Optionally select **category** | See §2.3 |
| 4 | Click **Generate Sentence** | AI returns random English sentence + 2 reference German translations |
| 5 | Type **German translation** | Local only until submit |
| 6 | Click **Check Translation** | AI evaluates + bundled explanations |
| 7 | Read **result screen** (§6) | Scores, mistakes, why-not-my-version, alternatives, vocabulary |
| 8 | Optional follow-up | Try Again · Next Sentence · Similar sentences · Save to Notebook |

**Strictness** (Relaxed | Normal | Exam) and **Focus practice** (grammar tag or Auto) live on the Practice screen as secondary controls — they do not replace steps 1–7.

---

### 2.1 CEFR level

Controls vocabulary range, sentence complexity, and evaluation rubric. User’s level selection also drives default **explanation tier** display (can still toggle A1/A2/B1 on results).

---

### 2.2 Difficulty within level (NEW)

**Control:** Segmented selector — **Easy** | **Medium** | **Hard** — shown directly under level. Default: **Medium**.

Difficulty refines the *same* CEFR band (e.g. three flavors of B1). It does **not** change CEFR label shown to the user.

| Difficulty | Generation intent | Evaluation expectation |
|------------|-------------------|------------------------|
| **Easy** | Shorter sentences; common words; one main clause; familiar grammar for that level | Slightly more lenient naturalness; fewer idioms |
| **Medium** | Typical length and complexity for the level | Standard rubric for that level |
| **Hard** | Longer or structurally richer sentences; subordinate clauses, richer vocab *within* level; exam-style phrasing allowed for Exam Prep category | Stricter naturalness and word-order expectations; still not above stated CEFR |

**Examples (B1):**

| Difficulty | Example English prompt (illustrative) |
|------------|----------------------------------------|
| Easy B1 | “I have lived in Berlin since 2020.” |
| Medium B1 | “Although the weather was bad, we still went for a walk.” |
| Hard B1 | “She told me that she had already submitted the application before the deadline.” |

**AI `generate` prompt must receive:** `level`, `difficulty`, `category?`, `focusTag?`, `memoryContext?`.

**Stored in session:** `level`, `difficulty`, `category`, `english`, `referenceTranslations[]`.

---

### 2.3 Category (optional)

Daily Life · Work · Travel · School · Relationships · Technology · Emotions · German Exam Prep · **Any** (default).

Biases topic vocabulary only; must not break level + difficulty constraints.

---

### 2.4 Secondary flows

#### Error Notebook (tab)

- Auto-save **major/blocking** issues from evaluation.
- Manual **Save to Notebook** on any result.
- Filter: Cases · Word Order · Prepositions · Verb Placement · Separable Verbs · Tenses.

#### History (tab)

- Last **20** attempts: English, scores, overall label, level, **difficulty**, primary `grammarTag`.

#### Weak-area chips (Practice header)

- Top **2** tags by count (last 7 days) → opens Notebook pre-filtered.

---

## 3. Information architecture

```
Practice (/)     ← DEFAULT LANDING — primary workflow
Notebook
History
Settings
```

**Practice screen states:**

1. `setup` — level, difficulty, category, generate, strictness, focus (collapsed “Options” on mobile)
2. `translating` — English shown, German textarea, Check Translation
3. `loading` — evaluate (+ optional similar)
4. `result` — full feedback (§6)

Notebook / History never replace Practice as home.

---

## 4. AI calls (max 3 per cycle)

| Call | When | Inputs include |
|------|------|----------------|
| `generate` | Generate Sentence | `level`, **`difficulty`**, `category?`, `focusTag?`, `memoryContext?` |
| `evaluate` | Check Translation | `level`, **`difficulty`**, `strictness`, English, user German, references[], notebook memory |
| `similar` | After evaluate (skippable) | `level`, **`difficulty`**, `grammarTag`, `conceptId`, example pair |

**AI Memory (lite):** Up to **2** notebook entries (matching tag) in `generate` + `evaluate`.

**Explain tiers:** Bundled in `evaluate` — `explanations.a1 | a2 | b1` for top 1–2 issues. Global toggle on result screen.

---

## 5. Generation rules (`generate`)

- Random English sentence appropriate for **`level` + `difficulty`**.
- Return JSON:
  - `english: string`
  - `referenceTranslations: string[]` (min 2, valid German)
  - `targetGrammarTag?: GrammarTag` (for focus / similar sentences)
  - `generationNotes?: string` (internal hint, optional display: “Practicing: Dativ”)

**Difficulty constraints (prompt-level):**

- **Easy:** max ~12 words; prefer simple tense; avoid nested clauses above A2.
- **Medium:** default textbook-style for level.
- **Hard:** push upper bound of level; allow subordination, passive, Perfekt/Präteritum mix at B1+, double verbs at B2+, etc.

---

## 6. Result screen (required sections)

1. **Verdict** — overall label + encouragement (teacher tone).
2. **Context line** — e.g. `B1 · Medium · Work`
3. **Scores** — Meaning, Grammar, Word Order, Naturalness (0–10), app-computed.
4. **Overall label:** Excellent · Good · Understandable but Unnatural · Needs Improvement.
5. **Valid answer banner** if `isUserAnswerValid`.
6. **Mistakes** — MEANING → GRAMMAR → WORD_ORDER → NATURALNESS; MINOR collapsed.
7. **Why Not My Version?** — suboptimal/wrong only (not valid alternatives).
8. **Alternative translations** — Natural, Formal, Casual, Other.
9. **Vocabulary** — key words, separable verbs, collocations, patterns.
10. **Similar Sentences** — 3 English prompts (`similar` call).
11. **Explain level toggle** — A1 / A2 / B1.
12. **Actions:** Try Again · Save to Notebook · Next Sentence.

**Deferred (V2):** Grammar Deep Dive, full dashboard, auto smart generator, per-issue explain on every row.

---

## 7. Evaluation JSON contract

```ts
type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1'
type Difficulty = 'easy' | 'medium' | 'hard'
type GrammarTag = 'cases' | 'word_order' | 'prepositions' | 'verb_placement' | 'separable_verbs' | 'tenses'
type IssueType = 'MEANING' | 'GRAMMAR' | 'WORD_ORDER' | 'NATURALNESS' | 'ALTERNATIVE' | 'MINOR'
type Severity = 'blocking' | 'major' | 'minor'
```

**Evaluator persona:** Teacher, not examiner.

**Priority:** Meaning → Grammar → Word Order → Naturalness.

**Multiple valid translations:** `isUserAnswerValid` + `ALTERNATIVE` issues do not reduce scores.

**Minors** (spelling, umlauts, commas, capitalization): per strictness (§7.1).

**Evaluate prompt must receive:** `level`, **`difficulty`**, `strictness`, `english`, `userGerman`, `referenceTranslations[]`.

### 7.1 Strictness

| Mode | Minors affect Grammar score |
|------|----------------------------|
| Relaxed | No |
| Normal | No (display only) |
| Exam | Yes |

---

## 8. Scoring (app-side)

- Four dimension scores derived from `issues[]` + strictness (not free-form LLM scores).
- Overall label from weighted floors (`scoring.ts` when implemented).

---

## 9. Data (localStorage)

| Key | Contents |
|-----|----------|
| `gta_settings` | apiKey, provider, model, strictness, defaultLevel, **defaultDifficulty**, skipSimilar |
| `gta_notebook` | ErrorNotebookEntry[] |
| `gta_history` | AttemptSummary[] (max 20), includes **difficulty** |
| `gta_session` | english, references, level, **difficulty**, category, focusTag |

---

## 10. UI principles

- **Practice = home:** translation UI visible immediately; Notebook/History via bottom nav or header tabs.
- Duolingo-meets-ChatGPT: clean, dark default, mobile-first, light motion.
- **Level** and **difficulty** are prominent; category optional chip row.
- **Generate Sentence** is primary CTA (disabled without API key).

---

## 11. Out of scope (MVP)

Auth, payments, database, backend, speech, reverse translation, SRS deck, Grammar Deep Dive, auto-weighted smart generator, full progress dashboard, cloud sync.

---

## 12. Environment

- `VITE_OPENAI_API_KEY` — optional if set in Settings.
- `VITE_OPENAI_MODEL` — default `gpt-4o-mini`.

---

## 13. Version history

| Version | Change |
|---------|--------|
| 1.0 | Initial freeze |
| 1.1 | Primary workflow explicit as default landing; **Easy / Medium / Hard** within each CEFR level |
| 1.1.1 | **Canonical primary user flow** section added (5-step chain as product definition) |
