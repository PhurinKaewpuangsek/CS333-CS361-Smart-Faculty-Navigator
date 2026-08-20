# 🤖 AI Assistant Context & Guidelines: Project TORCH

This document establishes the **workflow, code quality, directory boundaries, and infrastructure rules** for all AI coding assistants (Claude Code, Gemini CLI, Cursor, GitHub Copilot, Codex, …) operating on **Project TORCH (Smart Faculty Navigator)**.

> **Read this before touching anything.** If a request in the chat conflicts with a rule in this file, stop and ask the human teammate first.

---

## ⛔ 0. Non-Negotiables (read first)

| # | Rule | Why |
| :-- | :-- | :-- |
| 1 | **Never commit or push directly to `main`.** Always branch first. | `main` is the protected trunk. |
| 2 | **Every branch traces to a GitHub Issue.** No issue → no branch → no PR. | Traceability for course grading. |
| 3 | **Every change reaches `main` through a Pull Request** with green CI. | See §6. |
| 4 | **No AI tool may appear as a GitHub contributor.** No bot co-authors, no AI footers, ever. | See §7 — this is a hard requirement. |
| 5 | **Never commit secrets.** `.env` stays local; only `.env.example` is tracked. | See §8.2. |
| 6 | **Do not edit `.github/workflows/` unless the issue explicitly asks for it.** | See §6.4. |

---

## 📌 1. Project Overview & Architecture

- **Project Name:** Project TORCH — Smart Faculty Navigator (CS333 / CS361)
- **Product shape (V1):** an *Information Service* — search faculty rooms/facilities and render an interactive SVG floor plan. Turn-by-turn routing, timetable integration, beacon hardware, and an admin CRUD panel are **out of V1 scope**.
- **Repo Structure:** Monorepo (`frontend/`, `backend/`, `database/`)
- **Tech Stack:**
  - **Frontend:** React + Vite + TypeScript
  - **Backend:** Node.js + Express + TypeScript
  - **Database:** PostgreSQL 16 (Alpine Docker container: `cloud-postgres`)
  - **Runtime:** Node.js 24 (matches CI — see §6.1)
  - **CI/CD:** GitHub Actions (`.github/workflows/ci.yml`)
- **Default branch:** `main`

---

## 📁 2. Directory Boundaries

Keep dependencies, imports, and execution localized to their respective service boundaries:

```text
CS333-CS361-Smart-Faculty-Navigator/
├── .github/workflows/  <-- CI/CD Workflows (Do NOT edit unless instructed)
├── backend/            <-- Express API, route logic, DB queries (Node environment)
├── database/           <-- SQL migrations, graph dataset JSONs, seed scripts
├── frontend/           <-- React client application (Vite environment)
├── .env.example        <-- Blueprint for environment variables
├── AGENTS.md           <-- This file — rules for AI CLI tools
├── docker-compose.yml  <-- Local database container spec (`cloud-postgres`)
└── README.md           <-- Teammate onboarding guide
```

---

## 🌳 3. Branching Model: Trunk-Based Development

We use **Trunk-Based Development (TBD)**, not Git Flow. There is **no** `develop`, `release`, or long-lived integration branch. Do not create one.

### 3.1 The trunk

- `main` **is** the trunk and the single source of truth.
- `main` must be **releasable at every commit**. Never merge a branch that leaves `main` broken.
- `main` is protected: **no direct pushes, no force pushes, no history rewrites** — regardless of whether the server currently enforces it.

### 3.2 One Issue → one branch → one PR

The unit of work is a GitHub Issue.

```text
Issue #N ─► branch off latest main ─► small commits ─► PR ─► CI green ─► merge to main ─► delete branch
```

- **Before starting any code change, confirm an issue exists.** If the human asks for work with no issue, either point them at an existing issue number or propose creating one (`gh issue create`) — then use it.
- One branch solves **one** issue. Do not bundle unrelated fixes; open a separate issue instead.
- The issue is closed automatically by the PR (`Closes #N`), not by hand.

### 3.3 Branch naming

This team names issues **exactly like the branch that will implement them** (e.g. issue `feat/db-facility-schema` → branch `feat/db-facility-schema`). Follow that convention.

```text
<type>/<short-kebab-case-description>
```

| Type | Use for | Example |
| :-- | :-- | :-- |
| `feat/` | New user-facing capability | `feat/api-facility-search-endpoints` |
| `fix/` | Bug fix | `fix/search-empty-query-crash` |
| `docs/` | Documentation only | `docs/define-v1system-boundary` |
| `test/` | Tests only | `test/ci-api-integration-tests` |
| `chore/` | Tooling, deps, config | `chore/workflow-test` |
| `refactor/` | Behaviour-preserving cleanup | `refactor/extract-room-repository` |
| `ci/` | Pipeline changes | `ci/add-typecheck-job` |

Rules: lowercase, kebab-case, no spaces, no Thai characters, no personal names (`somchai-branch` ❌).

### 3.4 Branch lifetime

TBD lives or dies on **short-lived branches**:

- Target lifetime: **≤ 1–2 days**. A branch older than ~3 days is a smell — split the issue.
- Target size: **under ~400 changed lines** per PR. Big refactors get split into a stack of small issues.
- **Delete the branch immediately after merge** (`gh pr merge --delete-branch`). Stale branches are not kept around.
- If work is incomplete but must land, hide it behind a config flag rather than holding the branch open for a week.

### 3.5 Staying in sync with the trunk

Pull from the trunk **at least once a day** while a branch is open:

```bash
git fetch origin
git rebase origin/main
```

- Prefer **rebase** on your own feature branch — it keeps trunk history linear.
- After a rebase, push with `git push --force-with-lease` — **never** plain `--force`, and **never** any force push targeting `main`.
- If a rebase conflict is non-trivial, stop and hand it to the human teammate. Do not guess at resolving someone else's code.

---

## 📝 4. Commit Convention

**Conventional Commits**, imperative mood, English, referencing the issue:

```text
<type>(<optional-scope>): <what changed, imperative> (#<issue>)
```

Types: `feat`, `fix`, `docs`, `test`, `chore`, `refactor`, `ci`, `perf`, `style`.

```bash
git commit -m "feat(api): add /facilities search endpoint with category filter (#9)"
git commit -m "fix(db): correct floor_id foreign key in rooms migration (#7)"
git commit -m "docs: define V1 system boundary (#14)"
```

Commit rules for agents:

- Commit **only when the human asks you to commit.** Editing files is not permission to commit.
- Keep commits atomic — one logical change each. Do not squash unrelated work into one commit.
- Never use `git add -A` blindly from the repo root; stage the files you actually touched.
- Never amend or rebase commits that are already pushed and visible to teammates.
- **No AI attribution in the message body or trailers** — see §7.

---

## 🔀 5. Pull Request Rules

Every PR must have:

1. **Title** — same Conventional Commit format as the commit: `feat(api): add facility search endpoints`
2. **Body** — what changed, why, how it was verified, and a closing keyword:

   ```markdown
   ## What
   Adds GET /facilities with `q` and `category` filters.

   ## Why
   Frontend search box needs a backing endpoint.

   ## How to verify
   `npm run dev` in backend/, then `curl "localhost:3000/facilities?q=lab"`.

   Closes #9
   ```

3. **Base branch `main`.** Never target another feature branch.
4. **Green CI.** A red pipeline is never merged, and never "merged anyway to fix later".
5. **At least one teammate review**, with all review threads resolved.

Merge strategy: **squash merge** into `main` — it keeps the trunk history linear at one commit per issue — then delete the branch.

Agents **must not** merge a PR on their own. Opening the PR is the last step an agent takes; a human presses merge.

---

## ⚙️ 6. GitHub Actions CI/CD

### 6.1 The pipeline as it exists today

`.github/workflows/ci.yml` — job **`baseline-check`**:

| Aspect | Value |
| :-- | :-- |
| Triggers | `pull_request` → `main`, and `push` → **every** branch (`'**'`) |
| Runner | `ubuntu-latest` |
| Steps | `actions/checkout@v5` → `actions/setup-node@v5` (Node **24**) → validation echo |

Because `push` fires on every branch, **your feature branch is checked from its very first push** — you find out about breakage before opening the PR. That is the intended TBD feedback loop.

### 6.2 Planned checks (not yet implemented)

Do **not** claim these run today. Add them only through a dedicated `ci/` issue:

- `npm ci` + `npm run lint` (backend, frontend)
- `tsc --noEmit` type check (backend, frontend)
- `npm test` unit + API integration tests (tracked by issue `test/ci-api-integration-tests`)
- `npm run build` for the Vite frontend
- A Postgres service container for DB-backed tests

### 6.3 Definition of Done

A change is done when: CI is green **on the branch**, the PR is approved, `Closes #N` is present, the branch merges cleanly into `main`, and the branch is deleted.

### 6.4 Rules for touching workflows

- Only modify files under `.github/workflows/` when the issue explicitly asks for it (a `ci/` branch).
- Pin actions to a major version tag (`actions/checkout@v5`) — no floating `@main`.
- Keep the Node version in CI **identical** to local (`24`). If one moves, both move in the same PR.
- **Never** paste a secret into a workflow file. Use `${{ secrets.NAME }}` and ask a human to add the secret in repo settings — an agent never handles credential values.
- Never add a workflow that auto-merges, auto-pushes to `main`, or force-pushes.
- Never disable, skip, or `continue-on-error` a failing check to make a PR go green. Fix the code.

---

## 🚫 7. Attribution Policy — No AI Contributors (HARD RULE)

**The contributor graph, commit authors, and PR authors of this repository must show human team members only.** Project TORCH is graded coursework; AI tooling must leave no authorship footprint.

Agents **must never**:

- Add a bot or AI co-author trailer of any kind — for example `Co-Authored-By: Claude <noreply@anthropic.com>`, or the equivalent for Copilot, Gemini, Cursor, or any other tool.
- Append AI tool footers or banners to commit messages, PR titles, PR bodies, issue bodies, or review comments — for example "🤖 Generated with ...", "Co-created with an AI assistant", or any "sent from <tool>" line.
- Change `git config user.name` / `user.email` to a bot, app, or AI identity. The committer is always the human teammate whose machine is running the tool.
- Authenticate or act as a GitHub App / bot account when pushing, opening PRs, or commenting.
- Add "AI-generated" markers into source code comments.

**Verify before every push:**

```bash
git log origin/main..HEAD --pretty=fuller
```

The output must contain **zero** references to Claude, Anthropic, Gemini, Copilot, Cursor, ChatGPT, OpenAI, or any bot address, in either the author/committer fields or the message body. If one slipped into an unpushed commit, fix it before pushing:

```bash
git commit --amend --no-edit
```

---

## 🛠️ 8. Code Quality & Architecture Constraints

### 8.1 TypeScript & code quality

- Write strict, explicit TypeScript types/interfaces for API contracts, DB query results, and component props.
- Do **NOT** use `any` unless explicitly requested.
- Keep functions modular, clean, and self-documenting. Comment *why*, not *what*.
- Match the surrounding file's existing style; do not reformat untouched code in the same PR.

### 8.2 Environment parity & security

- Never hardcode DB credentials, ports, or secret keys in source files.
- Backend reads `process.env.<VAR>` (loaded via `dotenv`); frontend reads `import.meta.env.VITE_<VAR>`.
- Any new variable must be added to `.env.example` with a **placeholder**, never a real value, in the same PR.
- `.env` is git-ignored and stays that way. If you ever see `.env` staged, unstage it and tell the human.
- The local DB is the Docker container **`cloud-postgres`** on port `5432` (`npm run db:up` / `db:down` / `db:reset` from the repo root).

### 8.3 Monorepo isolation

- No relative cross-directory imports between `/frontend` and `/backend` (`import x from '../../backend/...'` is forbidden).
- `frontend/` and `backend/` keep separate `package.json` files. Install dependencies **inside** the service that needs them, never at the root.
- The root `package.json` holds only repo-wide Docker/DB scripts.

### 8.4 Database changes

- Schema changes are **additive, versioned SQL files** under `database/`. Never edit an already-merged migration — add a new one.
- Never run a destructive statement (`DROP`, `TRUNCATE`, unbounded `DELETE`) against anything but a local throwaway container.

### 8.5 Future-proofing

- Keep API endpoints and graph/spatial algorithms modular so real-time updates (WebSockets, SSE, caching) can be added later without rewriting the database interfaces.

---

## 💻 9. The Standard Agent Playbook (copy-paste)

```bash
# 0. Know your issue number first:  gh issue list

# 1. Start from a fresh trunk
git switch main
git pull --ff-only origin main

# 2. Branch named after the issue
git switch -c feat/api-facility-search-endpoints

# 3. Work in small commits
git add backend/src/routes/facilities.ts
git commit -m "feat(api): add /facilities search endpoint with category filter (#9)"

# 4. Stay in sync with the trunk (daily, and before pushing)
git fetch origin
git rebase origin/main

# 5. Sanity-check authorship — must show humans only (see section 7)
git log origin/main..HEAD --pretty=fuller

# 6. Push the branch (CI runs on push to any branch)
git push -u origin feat/api-facility-search-endpoints

# 7. Open the PR into main
gh pr create --base main --title "feat(api): add facility search endpoints" --body "Closes #9"

# 8. Watch CI. Fix red before asking for review.
gh pr checks --watch

# 9. STOP. A human reviews and merges.
```

---

## ❌ 10. Forbidden Actions Checklist

An agent must **never** do any of the following without an explicit, specific instruction from a human teammate:

- [ ] `git push` to `main`, or any `git push --force` (use `--force-with-lease`, on feature branches only)
- [ ] `git reset --hard`, `git clean -fd`, or discarding uncommitted work belonging to someone else
- [ ] Merge or close a PR, or close an issue by hand
- [ ] Create a long-lived `develop` / `release` branch
- [ ] Commit `.env`, credentials, tokens, API keys, or real database passwords
- [ ] Edit files under `.github/workflows/` outside a `ci/` issue
- [ ] Skip, disable, or weaken a CI check to turn a PR green
- [ ] Add any AI or bot attribution to commits, PRs, issues, or comments (section 7)
- [ ] Install dependencies at the repo root instead of inside `frontend/` or `backend/`
- [ ] Rewrite history that has already been pushed and shared
