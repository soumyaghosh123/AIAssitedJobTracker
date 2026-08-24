# CareerPulse

> **Track every opportunity. Measure every move.**

CareerPulse is a professional, local-first career and job application management web application focused on **QA and software engineering** opportunities. It lets you discover and manage job opportunities, track applications through a Kanban workflow, manage your professional profile and documents, and measure your job search with analytics — all stored locally in your browser.

![Status](https://img.shields.io/badge/status-production--ready-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6)
![Vite](https://img.shields.io/badge/Vite-6-646cff)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8)

---

## 🌐 Live Demo

The application is deployed and publicly accessible at:

**https://aienablejobtracker.vercel.app**

Anyone with the URL can open it from any device or browser — no login required. All data remains local to each visitor's browser (IndexedDB); nothing is stored on the server.

---

## ✨ Features

### Navigation
- **Dashboard** — QA/Testing analytics: KPI cards, application funnel, tracker overview, recent applied jobs, and upcoming follow-ups
- **Tracker** — Six-stage Kanban board: `Wishlist → Applied → Follow-up → Interview → Offer / Rejected`
- **Jobs** — Searchable, filterable, sortable job repository with tabs (All / Wishlist / Saved / Ignored)
- **Profile** — Personal info, skills, preferred roles, and job preferences
- **Docs** — Local document library (resumes, cover letters, certifications) with upload/download/rename/delete
- **Settings** — Appearance, general preferences, data backup/import, and danger zone

### Tracker Workflow
| Stage | Action | Moves to |
|---|---|---|
| Wishlist | **Apply →** | Applied |
| Applied | **Follow-up →** | Follow-up (auto-stamps a follow-up date) |
| Follow-up | **Interview Scheduled →** | Interview |
| Interview | **Offer ✓ / Rejected ✕** | Offer / Rejected |

- Drag-and-drop between columns is supported (`@dnd-kit`), including keyboard-accessible dragging.
- Every status change persists immediately to IndexedDB — no page reload.

### Data & Persistence
- 100% local-first: **no backend, no API, no external database, no auth**.
- IndexedDB database `career-pulse-db` (versioned schema) with four object stores: `jobs`, `profile`, `documents`, `settings`.
- Data survives browser refresh (created/edited/deleted jobs, status changes, drag-and-drop, profile, settings).
- **Export**: Tracker to Excel (`.xlsx`) or CSV (`.csv`) — generated entirely client-side.
- **Backup**: Export all data as JSON; import with strict validation (malformed JSON / invalid records rejected) and **Replace** or **Merge** modes.
- Sample seed data loads automatically on first run (25 demo records, clearly marked as sample data).

### Design & UX
- Professional blue-and-white enterprise SaaS design, light/dark/system appearance with a header theme toggle.
- Live date/time stamp and system country in the header.
- Responsive: desktop (6 columns side-by-side), tablet (wraps to 3 columns), mobile (status selector list + drawer navigation).
- Touch-friendly controls (44px targets), keyboard navigation, visible focus states, accessible modals, 0 axe violations.
- Loading, empty, and error states on every major screen.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| UI | React 18, TypeScript, Tailwind CSS |
| Build | Vite 6 |
| Persistence | `idb` (IndexedDB wrapper) |
| Drag & drop | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |
| Excel export | SheetJS (`xlsx`) |
| Icons | Lucide React |
| Testing | Vitest, Testing Library |
| Linting | ESLint (flat config) + typescript-eslint |

---

## 📁 Project Structure

```
src/
├── components/
│   ├── common/          # Modal, ConfirmDialog, EmptyState, Fields, Spinner, StatusBadge, Toast…
│   ├── navigation/      # Header, MobileNav, ThemeToggle, DateTimeBadge
│   ├── tracker/         # TrackerBoard, TrackerColumn, JobCard
│   └── jobs/            # JobFormModal, JobDetailsModal
├── features/
│   └── jobs/            # jobRepository, jobService, jobValidation, jobTransitions,
│                        # jobQuery, jobExport, jobImport, seedJobs
├── db/                  # database.ts (versioned IndexedDB schema), migrations.ts
├── hooks/               # useJobs, useSettings, useProfile, useDocuments, useBackup, useExportJobs
├── pages/               # DashboardPage, TrackerPage, JobsPage, ProfilePage, DocsPage, SettingsPage
├── constants/           # statuses, labels, colors
├── types/               # shared TypeScript types
├── utils/               # formatting, date helpers, CSV helpers
├── test/                # unit + component tests
├── App.tsx              # app shell + hash routing
├── main.tsx             # entry point
└── styles.css           # Tailwind directives + custom styles
```

**Architecture layering** (UI never touches IndexedDB directly):

```
React UI → Hooks → Services → Repository → IndexedDB
```

This makes it possible to swap IndexedDB for a REST/API repository later without rewriting the UI.

---

## 🚀 Installation

### Prerequisites

- **Node.js 18+** (developed on Node 24) — [nodejs.org](https://nodejs.org)
- **npm 9+** (bundled with Node) or your preferred package manager

### Install & run

```bash
# 1. Clone or copy the project, then open the project folder
cd AIEnableJobTracker

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open **http://localhost:5173** (Vite prints the exact URL; it may use a different port if 5173 is busy).

> **Note:** If the app builds/runs with dependencies missing, ensure `npm install` completed fully. The project includes a project-level `.npmrc` that pins `omit=dev`/`production` settings so dev tooling installs correctly even when the machine's global npm config omits dev dependencies.

### Production build & preview

```bash
npm run build      # typechecks, then builds to dist/
npm run preview    # serves the production build locally
```

### Useful scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run the Vitest test suite once |
| `npm run test:watch` | Run tests in watch mode |

---

## 🧪 Testing

```bash
npm test
```

The suite covers:

- **Job validation** — required fields, URL/email format, length limits
- **Status transitions** — Wishlist → Applied → Follow-up → Interview → Offer/Rejected rules
- **Search, filtering, sorting** — combinable filters, salary buckets, date sorting
- **Date calculations** — days since/until, formatting, CSV escaping
- **Import validation** — malformed JSON, invalid records, duplicate-ID handling, merge logic
- **Export transformation** — CSV and XLSX generation with the required column set
- **QA role matching** — QA/Quality/Test title keyword filter used by the Dashboard
- **Component tests** — JobCard workflow actions, TrackerColumn rendering
- **Dashboard calculations** — KPI and funnel math

Current status: **78 tests across 9 files, all passing.**

---

## 📊 Dashboard Scope

The Dashboard is a dedicated **QA & testing analytics** view. Metrics (KPIs, funnel, tracker overview, tables) include only jobs whose title contains:

- `QA` or `Quality` (substring), or
- `test` / `testing` / `tester` as whole words

Other roles still appear on the Tracker and Jobs pages but are excluded from the Dashboard (a notice shows how many were excluded).

---

## 🌍 Browser Support

| Platform | Browsers |
|---|---|
| Desktop | Chrome, Edge, Firefox, Safari (Windows/macOS) |
| Mobile | Android Chrome, iOS Safari |
| Tablet | iPad / Android tablet browsers |

No OS-specific logic; all important interactions work with mouse, keyboard, and touch.

---

## 🔒 Privacy & Security

- All data stays in your browser's IndexedDB — nothing is transmitted externally.
- Documents are stored locally as data URLs; never uploaded to any server.
- Imported files are treated as untrusted input: validated before writing, and invalid records are skipped (imported HTML/JS is never executed).
- Destructive actions (delete, clear data, replace on import) require explicit confirmation.

---

## 🧰 Troubleshooting

| Issue | Fix |
|---|---|
| `npm install` skips dev dependencies | The included `.npmrc` handles this; verify `node_modules` has `vite`, `tailwindcss`, `typescript`, `vitest` |
| Port 5173 already in use | Vite auto-selects the next port; use the URL it prints |
| Dashboard shows only your own jobs | Dashboard is QA-filtered by design; see **Dashboard Scope** |
| Old sample data from earlier sessions | **Settings → Load sample data** replaces jobs with the 25 demo records |
| Data doesn't appear after refresh | IndexedDB is per-browser/profile; use **Settings → Export all data (JSON)** for a portable backup |

---

## 📝 License

MIT
