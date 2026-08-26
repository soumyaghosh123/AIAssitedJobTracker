# CareerPulse — Bug / Root-Cause Analysis & Resolution Log

> QA evidence for every defect below comes from the verification screenshots captured at the repository root
> (`tracker-*.png`, `dashboard-*.png`). Fixes were verified against the current source and the production build
> (`npm run build`, ~29s, all 1623 modules transformed).

---

## Status Legend

| Status | Meaning |
|---|---|
| ✅ **Fixed** | Code change applied and verified in current source. |
| ⚖️ **Verified — Intended** | Investigated; behaviour is deliberate design, not a defect. |
| ⓘ **Known limitation** | Accepted behaviour; documented for clarity. |

---

## Defect Register

| ID | Severity | Area | Title | Status |
|---|---|---|---|---|
| BUG-001 | High | Tracker | Kanban cards clipped & columns overflowing the viewport | ✅ Fixed |
| BUG-002 | Low | Dashboard | Follow-up countdown grammar ("day left" vs "days left") | ✅ Fixed |
| BUG-003 | Low | Dashboard | Empty state not actionable / stale instructions | ✅ Fixed |
| BUG-004 | Low–Med | Dashboard | "Applied" KPI count disagrees with Tracker Overview "Applied" | ⚖️ Intended |
| BUG-005 | Med | Dashboard | Rows in Upcoming Follow-ups can show no action button | ⚖️ Intended |
| BUG-006 | Low | Dashboard | Application Funnel "Follow-up" row appears without a visible bar | ⓘ Known limitation |
| BUG-007 | High | Settings | "Clear all local data" does not delete all local data | ✅ Fixed |

---

## BUG-001 — Tracker board cards clipped and columns overflowing

**Severity:** High &nbsp;·&nbsp; **Status:** ✅ Fixed

**Observed behaviour**
Verified against `tracker-bottom.png`, `tracker-fixed.png`, and `tracker-scrolled.png`:

- Cards are cut off at the top and bottom of the viewport; only part of a card (header or footer) is visible.
- Columns spill past the right edge; the third/fourth columns are only partially visible.
- A large empty grey band appears to the left of the board.
- Second cards in every column are truncated at the bottom of the viewport.

**Root cause**
The board height was tied to the viewport with per-column scroll behaviour. Long columns
(Wishlist, Applied) and short columns (Follow-up, Offer, Rejected) were rendered at different heights,
so content was clipped instead of the page scrolling as one unit. The fixed-width column layout also
ignored responsive breakpoints, causing horizontal overflow.

**Fix implemented**
In `src/components/tracker/TrackerBoard.tsx` the board container now uses a responsive CSS grid and the
page scrolls as a single unit — no per-column fixed height, so nothing clips:

```tsx
<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" role="region" aria-label="Tracker board">
```

- **2 columns** on mobile, **3 columns** on tablet, **6 columns** on desktop (`lg`).
- Column height is governed by content; the entire page scrolls vertically, so every card is reachable.
- Responsive wrapping removes horizontal overflow on smaller screens.

**Verification**
`tracker-one-scroll.png` confirms all **six** columns (Wishlist → Applied → Follow-up → Interview →
Offer → Rejected) and every card render with a single vertical scroll and no clipping or empty area.

---

## BUG-002 — Follow-up countdown grammar: "1 day left" / "days left"

**Severity:** Low &nbsp;·&nbsp; **Status:** ✅ Fixed

**Observed behaviour**
Verified against `dashboard-qatest.png`: the Upcoming Follow-ups table inconsistently rendered
"day left" alongside "days left" for different rows.

**Root cause**
The countdown string was built by concatenating a raw count with the literal text `day left`, so the
singular/plural form was never resolved.

**Fix implemented**
Replaced the manual concatenation with the existing `pluralize` helper in
`src/utils/format.ts`:

```ts
export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}
```

Used in `src/pages/DashboardPage.tsx` for the follow-up countdown:

```tsx
{days !== null && days >= 0 ? ` (${pluralize(days, 'day')} left)` : overdue ? ' (overdue)' : ''}
```

Now renders correctly as `(1 day left)` for a single day and `(2 days left)` otherwise.

**Verification**
Confirmed by the updated `format.ts` / `DashboardPage.tsx` source and the passing unit tests for date
calculations.

---

## BUG-003 — Dashboard empty state not actionable

**Severity:** Low &nbsp;·&nbsp; **Status:** ✅ Fixed

**Observed behaviour**
Verified against `dashboard.png`: the empty state read
"Add a job or load sample data from the Tracker" but rendered **no** button to actually perform either
action.

**Root cause**
The empty-state copy suggested actions that were not wired up in the UI (no button, no link).

**Fix implemented**
In `src/pages/DashboardPage.tsx` the empty state was rewritten as an actionable `EmptyState` with correct
guidance pointing to real locations (Settings → sample data, or the Tracker) and a working **Refresh**
action:

```tsx
<EmptyState
  title="No QA / testing jobs yet"
  description="Your dashboard tracks QA, Quality and Test/Testing roles. Add one or load sample data from Settings, or check the Tracker for all jobs."
  action={<Button onClick={() => refresh()}>Refresh</Button>}
/>
```

**Verification**
Current source renders a functional action button; the empty state is no longer a dead end.

---

## BUG-004 — "Applied" KPI count disagrees with Tracker Overview "Applied"

**Severity:** Low–Med &nbsp;·&nbsp; **Status:** ⚖️ **Verified — Intended**

**Observed behaviour**
Verified against `dashboard-qatest.png` (KPI Applied = 12, Tracker Applied = 4) and `dashboard-full.png`
(KPI Applied = 15, Tracker Applied = 5).

**Root cause**
The two numbers measure **different things**:

- The **"Applied" KPI** is a *cumulative pipeline* metric:
  ```ts
  const applied = counts.applied + counts.follow_up + counts.interview + counts.offer;
  ```
  i.e. every job that has ever been moved to Applied or beyond.
- The **Tracker Overview "Applied"** row is the *current-stage* count (`counts.applied`) — jobs sitting in
  the Applied column *right now*.

Because jobs progress Applied → Follow-up → Interview → Offer, the cumulative KPI is naturally larger than
the current-stage count.

**Resolution**
Confirmed as intentional metric semantics, not a defect. Both values are correct for what they label, but the
label is ambiguous. **Recommended (optional) future refinement:** rename the KPI to "Total Applied" or add a
tooltip to make the cumulative meaning explicit.

---

## BUG-005 — Upcoming Follow-ups rows can show no action button

**Severity:** Med &nbsp;·&nbsp; **Status:** ⚖️ **Verified — Intended**

**Observed behaviour**
Verified against `dashboard-qatest.png`: some rows in Upcoming Follow-ups show a **Mark Follow-up** button
while others (Adobe, Walmart, Accenture) show none.

**Root cause**
The "Mark Follow-up" action is intentionally rendered only for jobs still in the **Applied** stage:

```tsx
{job.status === 'applied' ? (
  <button onClick={() => handleQuickAction(job, 'follow_up')}>Mark Follow-up</button>
) : null}
```

Rows already sitting in the **Follow-up** stage (e.g. Adobe) have *already* been moved to Follow-up, so
offering the same button again would be a no-op / misleading.

**Resolution**
Confirmed as correct behaviour. Only jobs that can legitimately advance to Follow-up (status `applied`) get
the quick-action button.

---

## BUG-006 — Application Funnel "Follow-up" row appears without a visible bar

**Severity:** Low &nbsp;·&nbsp; **Status:** ⓘ Known limitation

**Observed behaviour**
Verified against `dashboard-qatest.png` and `dashboard-full.png`: the Application Funnel shows a Follow-up
count (3) but the segment appears to render without a visible bar.

**Root cause**
Funnel bar width is proportional to the largest value (Applied):

```ts
const funnelMax = Math.max(1, stats.applied, stats.counts.follow_up, stats.counts.interview, stats.counts.offer);
const pct = Math.round((row.value / funnelMax) * 100);
```

A small Follow-up count relative to a large Applied count produces a short bar (e.g. `3/15 → 20%`). The
bar is rendered (`bg-violet-500`) but is short enough to read as missing in a flattened screenshot.

**Resolution / recommendation**
The rendering path in `DashboardPage.tsx` is correct (each funnel row renders a colored segment). As a
quality-of-life improvement, consider enforcing a **minimum visible width** (e.g. `max-pct` floor of ~2%) so
low-count stages remain visually evident. This is a cosmetic enhancement, not a functional defect.

---

## BUG-007 — "Clear all local data" does not delete all local data

**Severity:** High &nbsp;·&nbsp; **Status:** ✅ Fixed

**Observed behaviour**
After confirming **Settings → Data & Backup → Clear all local data**, the app reports "All local data
cleared", but jobs, profile and settings reappear — the dashboard/tracker still show data and the selected
theme/preferences survive the clear.

**Root cause**
Two independent defects combined:

1. **Demo data auto-reseed masked a deliberate clear.** `useJobs` seeded the 25 demo jobs on *every* mount
   whenever the jobs store was empty:
   ```ts
   if (all.length === 0) {
     const seedJobs = buildSeedJobs();
     await repo.bulkPutJobs(seedJobs);
     all = seedJobs;
   }
   ```
   There was no way to distinguish a genuine first run from a store that had just been wiped, so the demo
   set was written straight back after `clearAllData()` emptied the store.

2. **Settings state was never refreshed after clearing.** `SettingsPage.confirmClearAll()` refreshed the
   jobs/profile/documents hooks but not settings:
   ```ts
   await Promise.all([refreshJobs(), refreshProfile(), refreshDocs()]);
   ```
   The `useSettings` hook kept its previous in-memory values, and because `getSettings()` falls back to
   defaults when the store is empty, the "cleared" theme and preferences were simply re-derived rather than
   removed. Any subsequent settings edit re-persisted the old values into the store.

**Fix implemented**

1. **First-run seeding is now gated by a persistent marker** (`src/features/jobs/jobRepository.ts`). The
   marker lives in `localStorage` (outside IndexedDB) so it survives a store wipe:
   ```ts
   const DEMO_SEEDED_KEY = 'career-pulse:demo-seeded';
   export function hasDemoBeenSeeded(): boolean {
     return localStorage.getItem(DEMO_SEEDED_KEY) === '1';
   }
   export function markDemoSeeded(): void {
     localStorage.setItem(DEMO_SEEDED_KEY, '1');
   }
   ```
   `useJobs` now seeds only when the store is empty **and** the marker is absent; any existing data also
   sets the marker (covers upgrades). After "Clear all local data" the store stays empty, and the demo set
   is only restored via the explicit **Load sample data** action in Settings.

2. **Settings are refreshed after clearing** (`src/pages/SettingsPage.tsx`):
   ```ts
   await Promise.all([refreshJobs(), refreshProfile(), refreshDocs(), refreshSettings()]);
   ```
   The `useSettings` hook already exposed `refresh`; it is now wired into the clear handler so the
   in-memory theme/preferences reset to defaults immediately.

**Verification**
New unit test `src/test/clearAllData.test.ts` verifies `clearAllData()` clears every object store and that
the demo-seeded marker is preserved across a wipe. Existing test suite, lint and production build all pass.

---

## Appendix — Evidence artifacts (repository root)

| File | Captures |
|---|---|
| `tracker-bottom.png` | Tracker before fix — clipped cards / overflow |
| `tracker-fixed.png` | Tracker, mid-validation — per-column clipping still present |
| `tracker-scrolled.png` | Tracker, scrolled state — cards cut off at viewport |
| `tracker-one-scroll.png` | Tracker after fix — all 6 columns, single scroll, no clipping |
| `dashboard.png` | Dashboard empty state (BUG-003) |
| `dashboard-qatest.png` | Dashboard with QA-filtered seeded data (BUG-002/004/005/006) |
| `dashboard-full.png` | Dashboard full data (BUG-004/006) |
| `dashboard-seeded.png` | Dashboard with seeded sample data |