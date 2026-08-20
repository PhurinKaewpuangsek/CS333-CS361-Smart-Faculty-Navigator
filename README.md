# 🔥 CS333 / CS361: Smart Faculty Navigator (Project TORCH)

Welcome to the **Smart Faculty Navigator** monorepo! This repository contains the full-stack web application (React frontend + Express backend + PostgreSQL database).

---

## ⚙️ One-Time Prerequisites

Before running the application locally, make sure you have the following installed on your machine:

1. **Node.js** (v20 or higher) — [Download Node.js](https://nodejs.org/)
2. **Docker Desktop** — [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
   * *Note:* After installation, launch Docker Desktop to ensure the background service is running before executing any terminal commands.

---

## Quickstart Guide

1. Clone the repository and switch to Node 24:
   ```bash
   nvm use 24
   npm install

2. Configure environment variables:
   ```bash
   cp .env.example .env

3. Spin up the local database:
   ```bash
   npm run db:up

## 🚀 Initial Repository Setup

Run these commands in your terminal once to clone the repository and configure your environment:

```bash
# 1. Clone the repository and navigate into the root directory
git clone https://github.com/PhurinKaewpuangsek/CS333-CS361-Smart-Faculty-Navigator.git
cd CS333-CS361-Smart-Faculty-Navigator

# 2. Create your local environment file from the template
cp .env.example .env
```

> **Note:** The `.env` file holds database passwords and local port settings. It is ignored by Git to keep credentials secure. Modify it only if you need custom local configurations.

---

## 💻 Daily Development Workflow

Follow this workflow every time you work on the project. You can run all commands directly inside VS Code's Integrated Terminal (`Ctrl + ~` on Windows / `Cmd + ~` on Mac).

### Step 1: Start the Local Database (Docker Container)
In your primary terminal window at the root of the project:

```bash
docker compose up -d
```
*(The `-d` flag runs the PostgreSQL container silently in the background. Omit `-d` if you wish to monitor database logs in real time).*

### Step 2: Run the Backend Service
Open a **new terminal tab** in VS Code (click the `+` icon in the terminal panel):

```bash
cd backend
npm install   # Run once after pulling fresh code
npm run dev   # Starts backend development server
```

### Step 3: Run the Frontend Service
Open **another terminal tab** in VS Code:

```bash
cd frontend
npm install   # Run once after pulling fresh code
npm run dev   # Starts React development server
```

### Step 4: Shut Down Environment
When you finish your work session, shut down the database container from your main terminal tab:

```bash
docker compose down
```

---

## 🔄 Quick Reference Summary

| Frequency | Task | Command / Location |
| :--- | :--- | :--- |
| **One-Time** | Install Software | Install Node.js & Docker Desktop |
| **One-Time** | Clone & Config | `git clone <url>` & `cp .env.example .env` |
| **Every Session** | Start Database | `docker compose up -d` (Root directory) |
| **Every Session** | Start Backend | Terminal Tab 2: `cd backend && npm run dev` |
| **Every Session** | Start Frontend | Terminal Tab 3: `cd frontend && npm run dev` |
| **Every Session** | Stop Database | `docker compose down` (Root directory) |

---

## 📁 Repository Structure

```text
CS333-CS361-Smart-Faculty-Navigator/
├── .github/workflows/  # Automated CI pipeline checks
├── backend/            # Express Node.js REST API & business logic
├── database/           # SQL migration scripts & spatial dataset files
├── frontend/           # React + Vite TypeScript user interface
├── .env.example        # Environment variable blueprint
├── AGENTS.md           # for any AI CLI tool using
├── docker-compose.yml  # PostgreSQL container configuration
└── README.md           # Onboarding & project documentation
```

---

## 🛠️ Git & Branching Rules

Direct pushes to `main` are restricted. All contributions must use feature branches and Pull Requests (PRs):

1. **Create a branch for your work:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```
2. **Commit your changes using standard prefixes (`feat:`, `fix:`, `docs:`):**
   ```bash
   git commit -m "feat: add interactive building map component"
   ```
3. **Push your branch and open a PR on GitHub:**
   ```bash
   git push origin feature/your-feature-name
   ```
4. **Merge requirements:** Automated CI checks must pass, and all review comments must be resolved before merging into `main`.

<!-- dummy workflow test editted this line for issues workflow-test -->