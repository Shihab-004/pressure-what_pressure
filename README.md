# ⚡ Pressure? What Pressure!
> **Personal Productivity OS** — *Remember everything. Decide less. Do what matters. Eliminate overwhelm.*

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-orange?style=flat-square&logo=firebase)](https://firebase.google.com/)

---

## 🎯 The Problem This Solves (That Generic Apps Can’t)

Most productivity apps (Todoist, Notion, Trello, Google Tasks, Apple Reminders) are **passive dumping grounds**. They store your tasks, but leave all cognitive strain on you:

| ❌ Generic Productivity Apps | ✅ Pressure? What Pressure! (This System) |
| :--- | :--- |
| **Overwhelming Task Graveyard**: Displays 50+ to-dos, causing decision paralysis. | **"What Should I Do Now?" Engine**: 1-click deterministic recommendation of your single best next action. |
| **Stress & Guilt**: Blinks 20 red "overdue" warnings when life gets busy. | **"I'M OVERWHELMED" Sanctuary Mode**: Instantly hides 90% of clutter, locking focus on 2–3 vital tasks to unfreeze you. |
| **Ignorant of Dependencies**: Tells you to do Task B even if prerequisite Task A isn't finished. | **Dependency Graph**: Blocked downstream tasks are automatically suppressed until prerequisites are checked off. |
| **Zero Capacity Awareness**: Lets you schedule 16 hours of tasks into a 5-hour day without warning. | **Workload Capacity & Auto-Balancer**: Detects daily burnout limits and rebalances flexible tasks across the week. |
| **Friction-Heavy Entry**: Requires clicking dropdowns for project, priority, tag, and date. | **Bilingual Quick Brain Dump**: Paste raw messy thoughts (English or Bangla); the parser auto-structures them. |
| **Blind Time Tracking**: Assumes human estimates are accurate (they rarely are). | **Estimation Intelligence**: Compares planned vs. actual duration over time to highlight estimation blind spots. |

---

## 🧠 How the System Works

```
 📥 Fast Capture       ⚡ Smart Engine         🧘 Deep Execution
 ┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
 │  Brain Dump  │ ──> │ "What Should     │ ──> │   Focus Timer    │
 │ (Bilingual)  │     │  I Do Now?"      │     │  (Interruption   │
 └──────────────┘     └──────────────────┘     │     Logger)      │
        │                       │              └──────────────────┘
        ▼                       ▼                       ▲
 ┌──────────────┐     ┌──────────────────┐              │
 │ Auto-Balance │     │ "I'M OVERWHELMED"│ ─────────────┘
 │ & Capacity   │     │ (Sanctuary Mode) │
 └──────────────┘     └──────────────────┘
```

1. **Capture Without Thinking (Brain Dump)**: Dump multi-line unstructured notes (supports mixed English & Bengali). The parser extracts task names, deadlines, priorities, and estimated minutes with an instant live preview.
2. **Instant Decision ("What Should I Do Now?")**: Eliminates choice fatigue. Evaluates deadline proximity, priority weight, your current time availability, and unfulfilled prerequisites to highlight **one executable task**.
3. **Capacity Protection (Auto-Balance)**: Sets realistic daily working hour budgets. Overloaded days are automatically detected, and flexible tasks are auto-rescheduled while hard deadlines remain locked.
4. **Emergency De-stress ("I'M OVERWHELMED")**: When panic strikes, one toggle quiets the entire system, hiding backlogs and giving you a calm 2–3 item checklist to regain momentum.
5. **Distraction-Free Focus**: Built-in fullscreen deep-work timer with interruption logging that automatically syncs actual duration into analytics.
6. **Real-Life Academic & Learning Hubs**:
   - **University Mode**: Track courses (e.g. MTE 3101), lab reports, assignments, and exam countdowns.
   - **Learning OS**: Topic skill trees with strict "Active vs. Backlog" WIP limits to kill tutorial hell.
   - **Goal Hierarchy**: Roll up daily tasks into Weekly, Monthly, Yearly, and Vision milestones.

---

## ⚡ Quick Start

### 1. Prerequisites
- Node.js 18+ installed
- MongoDB instance (Atlas or local `mongodb://localhost:27017`)
- Firebase project (or use the built-in **Demo Mode**)

### 2. Installation
```bash
git clone git@github.com:Shihab-004/pressure-what_pressure.git
cd pressure-what_pressure
npm install
```

### 3. Setup Environment Variables
Create your local `.env.local` file from `.env.example`:
```bash
cp .env.example .env.local
```
> 🔒 **Security Notice:** `.env.local` contains private keys and is strictly gitignored. Never commit it to version control.

*Zero-setup local preview:* Keep `NEXT_PUBLIC_ENABLE_DEMO_MODE=true` in `.env.local` to explore the complete app instantly with mock credentials.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⌨️ Power Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + K` / `⌘ + K` | Global Command Palette |
| `N` | Quick Create Task |
| `B` | Open Brain Dump Modal |
| `F` | Run "What Should I Do Now?" Engine |
| `T` | Go to Today's Dashboard |
| `P` | Open Weekly Planner |

---

## 🛡️ Architecture & Security Standards

- **Server-Side Token Verification**: Every API route validates requests against Firebase Admin SDK bearer tokens.
- **Strict Tenant Isolation**: All database operations query `{ userId: authenticatedUserId }`.
- **Zero Secrets in Repo**: All API keys, database strings, and service accounts are isolated in environment variables.
- **Deterministic Offline-Ready Core**: Recommendation and priority calculations run purely client/server-side with zero mandatory third-party AI dependencies.

---

## 📄 License
Private Personal Project © Shihab-004. All rights reserved.
