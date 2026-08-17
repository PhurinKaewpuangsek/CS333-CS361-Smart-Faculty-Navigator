# 🤖 AI Assistant Context & Guidelines: Project TORCH

This document establishes code quality, directory boundaries, and infrastructure rules for all AI coding assistants (e.g., Gemini CLI, Cursor, Claude Code, GitHub Copilot) operating on **Project TORCH (Smart Faculty Navigator)**.

---

## 📌 1. Project Overview & Architecture

- **Project Name:** Project TORCH — Smart Faculty Navigator (CS333 / CS361)
- **Repo Structure:** Monorepo (`frontend/`, `backend/`, `database/`)
- **Tech Stack:**
  - **Frontend:** React + Vite + TypeScript
  - **Backend:** Node.js + Express + TypeScript
  - **Database:** PostgreSQL 16 (Alpine Docker container: `cloud-postgres`)
  - **CI/CD:** GitHub Actions (`.github/workflows/ci.yml`)

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
├── docker-compose.yml  <-- Local database container spec (`cloud-postgres`)
└── README.md           <-- Teammate onboarding guide
```

---

## 🛠️ 3. Core AI Guidelines & Constraints

When generating code, refactoring, or suggesting CLI commands, **always obey the following rules**:

### Rule 1: TypeScript & Code Quality
* Always write strict, explicit TypeScript definitions (interfaces/types) for API contracts, database queries, and component props.
* Do **NOT** use `any` types unless explicitly requested.
* Keep functions modular, clean, and self-documented.

### Rule 2: Environment Parity & Security
* Never hardcode database credentials, port numbers, or secret keys in source files.
* Backend must use `process.env.<VAR>` (loaded via `dotenv`).
* Frontend must use Vite's `import.meta.env.VITE_<VAR>` convention.
* Always assume the local database is running inside the Docker container named **`cloud-postgres`** mapped to port `5432`.

### Rule 3: Monorepo Isolation
* Do **NOT** introduce relative cross-directory imports between `/frontend` and `/backend` (e.g., `import x from '../../backend/...'` is strictly forbidden).
* Maintain separate `package.json` files for `frontend/` and `backend/`.

### Rule 4: Git Workflow Safety
* Direct pushes to `main` are disabled on this repository.
* When suggesting terminal commands to team members, **always recommend feature branch operations**:
  ```bash
  git checkout -b feature/<feature-name>
  ```
* Do not suggest forcing pushes (`git push --force`) to `main`.

### Rule 5: Future-Proofing & Extensibility
* The project involves real-time faculty navigation and spatial data processing. Keep API endpoints and graph algorithms modular so real-time updates (WebSockets, SSE, Caching) can be added without rewriting database interfaces.