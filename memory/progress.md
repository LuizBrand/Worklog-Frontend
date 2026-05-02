# Atomic Progress Log

Your temporal anchor. Tick atomic tasks as you complete them. Never mark a
task done unless `memory/verify.md` criteria are met.

The `state-enforcement.sh` hook blocks task completion if source files
changed but this file wasn't updated.

## In Progress

### PLAN APPROVED — NOT YET STARTED: Login split-screen + Dashboard two-column refactor
Plan file: `/home/luizzz/.claude/plans/zippy-churning-wilkinson.md`
Handoff note: `handoff-2026-05-02.md` (project root)

**What to do (in order):**

1. Fix existing dashboard components — `var(--wl-surface-1)` is a typo that doesn't exist in
   globals.css. Change all usages to `var(--wl-surface)` in:
   - `src/components/dashboard/status-donut.tsx`
   - `src/components/dashboard/recent-activity.tsx`
   - `src/components/dashboard/priority-distribution.tsx`
   (kpi-card.tsx will be deleted, so skip it)

2. **Auth layout** — `src/app/(auth)/layout.tsx`: split-screen two-panel.
   Left `flex-1` with `var(--wl-surface)` bg = form area.
   Right `hidden lg:flex w-1/2` with `var(--wl-bg)` bg + dot pattern = marketing panel
   (label "REGISTRO DE ATENDIMENTOS", headline, subtext, 4 pill tags).
   Use `var(--primary)` for blue accent text/tags on the right panel.

3. **Login page** — `src/app/(auth)/login/page.tsx`: add `tab: 'login'|'register'` state.
   Logo + "WorkLog" rendered top-left (not centered). Two-pill switcher.
   Register form uses `useRegister` from `@/api/generated/autenticação/autenticação`.
   `RegisterRequest` fields: name (min 2), email, password (min 8, uppercase+lowercase+digit).
   On success: `toast.success(...)` + switch to `'login'` tab.

4. **New** `src/components/dashboard/stats-bar.tsx` — 4 compact status-counter chips.
   Replaces KPI cards. Props: `statusCounts: StatusCount[], loading?: boolean`.

5. **New** `src/components/dashboard/ticket-list.tsx` — left-column ticket rows.
   Header: "Pendentes & em andamento" + "Novo ticket" button (href="/tickets" placeholder).
   Each row: StatusChip (sm) + title (truncated) + WlAvatar + client + system + relative date.
   Max-height + overflow-y-auto. Skeleton rows on loading.

6. **New** `src/components/dashboard/quick-filters.tsx` — static "FILTROS" section.
   3 pill buttons: "Crítico" (red, href="/tickets?priority=CRITICAL"),
   "Baixo" (green, href="/tickets?priority=LOW"), "Novo ticket" (blue, href="/tickets").

7. **Rewrite** `src/components/dashboard/recent-activity.tsx` — horizontal scrollable cards.
   `flex gap-3 overflow-x-auto`. Each card: fixed ~260px width, status chip, title, client,
   system, date. Uses `var(--wl-surface)` bg.

8. **Edit** `src/components/dashboard/priority-distribution.tsx` — title → "POR PRIORIDADE (ABERTOS)".

9. **Rewrite** `src/app/(app)/dashboard/page.tsx` — new layout:
   - `<StatsBar>` (full width)
   - `grid grid-cols-1 lg:grid-cols-[1fr_280px]` with `<TicketList>` left, `<StatusDonut>` +
     `<PriorityDistribution>` + `<QuickFilters>` right
   - `<RecentActivity>` full-width bottom strip
   - Queries: keep 4 status-count (size=1), change recentQ to size=8 (feeds both list + cards).

10. **Delete** `src/components/dashboard/kpi-card.tsx` (no longer used).

11. Update `memory/progress.md` TDD exemptions for new components.
12. Capture visual evidence for login (desktop), dashboard (desktop + mobile).
13. Commit.

- [x] 2026-05-01 — Slice 3 Dashboard: `kpi-card.tsx`, `status-donut.tsx`,
  `recent-activity.tsx`, `priority-distribution.tsx` (placeholder — no
  priority field in `TicketSummary`), dashboard `page.tsx` with 4 parallel
  status-count queries + recent-activity query. Discovered backend OpenAPI
  spec has 200/401 schemas swapped on `GET /tickets`; cast workaround in
  page + gotcha documented. tsc ✓, lint ✓, visual evidence
  slice-3-dashboard-{desktop,mobile}.png captured.

## Completed (2026-05-01 session 2)

- [x] 2026-05-01 — Fixed Bug 1: `useAuthStore.persist?.hasHydrated()` and
  `useAuthStore.persist?.onFinishHydration()` now use optional chaining in
  `src/app/(app)/layout.tsx` to prevent SSR crash when `persist` middleware
  is undefined during server pre-render. tsc ✓, lint ✓.
- [x] 2026-05-01 — Confirmed Bug 2 (next-themes script tag / React 19) already
  addressed: `suppressHydrationWarning` present on `<html>` in `src/app/layout.tsx`.

## TDD-check exemptions (slice 3)

- `src/components/dashboard/kpi-card.tsx` — pure UI card, no business
  logic. No test runner configured; validated by tsc + visual evidence.
- `src/components/dashboard/status-donut.tsx` — pure UI, composes
  existing `DonutChart`. No test runner; validated by tsc + visual.
- `src/components/dashboard/recent-activity.tsx` — pure UI list.
  No test runner; validated by tsc + visual.
- `src/components/dashboard/priority-distribution.tsx` — placeholder UI,
  zero logic (priority field absent from API). Validated by tsc + visual.

## TDD-check exemptions (slice 2)

- `src/hooks/use-is-desktop.ts` — thin `useSyncExternalStore` wrapper over
  `window.matchMedia`. No business logic; no test runner configured yet.
  Behavior is exercised visually at every breakpoint resize in slices 2+.
- `src/components/shell/nav-config.ts` — static route/icon config array.
  No logic to test; changes are validated by tsc + visual render.
- `src/components/shell/user-menu.tsx` — UI component (dropdown + logout
  side-effect). No test runner; behavior validated by manual smoke and
  visual evidence.
- `src/components/shell/sidebar.tsx` — pure UI, desktop nav. Validated by
  tsc + visual evidence.
- `src/components/shell/top-bar.tsx` — pure UI, mobile header. Validated
  by tsc + visual evidence.
- `src/components/shell/bottom-tab-bar.tsx` — pure UI, mobile tabs.
  Validated by tsc + visual evidence.
- `src/components/shell/app-shell.tsx` — layout orchestrator. Validated
  by tsc + visual evidence (desktop + mobile screenshots).

## Completed (this session continued)

- [x] 2026-05-01 — Slice 2 app shell: `useIsDesktop` hook (useSyncExternalStore
  over matchMedia), `nav-config.ts`, `sidebar.tsx` (collapsible, 200/52px),
  `top-bar.tsx` (54px mobile header), `bottom-tab-bar.tsx` (82px, 5 tabs),
  `user-menu.tsx` (dropdown + logout), `app-shell.tsx` (orchestrator +
  useGetMe hydration). Fixed zustand-persist hydration race in `(app)/layout.tsx`
  (lazy useState + onFinishHydration). tsc ✓, lint ✓, visual evidence
  slice-2-shell-desktop.png + slice-2-shell-mobile.png captured.
  Note: `UserResponse.roles` is an array of `{role}` objects (not a string) —
  admin check uses `.some(r => r.role === 'ADMIN')`.

- [x] 2026-05-01 — Slice 1B routes: `(auth)/login/page.tsx` (login form,
  react-hook-form + zod/v3, useLogin), `(auth)/layout.tsx` (centered
  auth shell), `(app)/layout.tsx` (client-side auth guard → redirect to
  /login), `(app)/dashboard/page.tsx` (stub), root `page.tsx` →
  redirect('/dashboard'). tsc ✓, lint ✓, visual evidence captured
  (slice-1-login.png, slice-1-dashboard-stub.png).
  Note: uses `zod/v3` in form schemas — @hookform/resolvers v5.2.2 rejects
  zod v4.3.x due to a minor-version literal type guard.
- [x] 2026-05-01 — Fixed missing `(auth)/layout.tsx` from prior commit
  (was untracked); added playwright enabledPlugins to `.claude/settings.json`.


- [x] 2026-04-27 — Renamed `src/app/_design/` → `src/app/design/`
  (Next.js `_folder` is private and opts out of routing — `/design` now
  serves at 200). Updated `memory/plan.md` Slice 0 directive.
- [x] 2026-04-27 — Installed `playwright@1.59.1` as devDep + chromium
  headless shell to make `.agent-md/bin/playwright-capture.sh`
  executable.
- [x] 2026-04-27 — Captured visual evidence for Slice 0 design showcase.
  Artifacts: `.agent/visual/slice-0-design-showcase.png` (121 KB,
  1280×800 full-page, dark) + `.md` note with Changed files / Route /
  Viewport / Artifact / Observed result. Showcase still needs
  independent visual review before Slice 0 commit (no self-grading).
- [x] 2026-04-27 — Slice 0 foundation commit `9494c2e` (41 files, design
  system primitives, worklog components, /design showcase, MCP, deps).
- [x] 2026-04-27 — Slice 0 finishers:
  - `742c4fd` SSR-guard `src/lib/api.ts` (`typeof window !== 'undefined'`).
  - `bfbf8cd` `src/lib/ticket-status.ts` mapper + `UI_STATUS_WRITABLE`.
  - `b3ea3d6` `@tanstack/react-table@8.21.3` installed.
  - `git config core.hooksPath .githooks` set locally (no commit —
    local repo config). `.githooks/pre-commit` now active.

## Completed (this session)

- [x] 2026-04-26 — Wired shadcn MCP server via
  `pnpm dlx shadcn@latest mcp init --client claude`. Adds `.mcp.json`,
  bumps deps in `package.json` / `pnpm-lock.yaml`. Tooling-only; no
  source or UI changes. Restart Claude Code to pick up the server.
  Also gitignored `mockups/` (reference HTML, not project source).
- [x] 2026-04-26 — Scaffolded agent-md framework (memory/, .claude/
  hooks, .githooks/pre-commit, agent-md.toml) — committed as `fb6f774`.
- [x] 2026-04-26 — Slice 1: Orval codegen wired end-to-end. Snapshot at
  `openapi/worklog.json`, react-query hooks under
  `src/api/generated/<tag>/`, zod schemas under
  `src/api/generated/zod/<tag>/`, mutator `src/api/mutator.ts` reusing
  `src/lib/api.ts`. Springdoc emits an invalid `name` field on
  `securitySchemes.bearerAuth` (http scheme); `scripts/sanitize-openapi.mjs`
  strips it and is chained into `pnpm api:fetch`. Removed orval v8-invalid
  `prettier: true` from both outputs in `orval.config.ts`. Verified:
  `pnpm api:gen` ✓, `pnpm exec tsc --noEmit` ✓, `pnpm lint` ✓, all 5
  tags present (autenticação, sistemas, usuários, tickets, clientes).

## TDD-check exemptions (this slice)

- `src/api/mutator.ts` — thin axios wrapper providing `customInstance`
  for orval-generated clients. No business behavior; project has no
  test runner configured yet (`memory/agents.md` notes the missing
  `test` script). Behavior will be exercised indirectly by every
  generated endpoint hook and validated by typecheck + manual API
  smoke when slices land.
- `src/lib/ticket-status.ts` — pure mapper between API (4 states) and
  UI (5 states) taxonomies, locked in `memory/plan.md` decisions §1.
  Project has no test runner; behavior will be exercised by every
  ticket read/write path landing in slices 4–6 and validated by
  typecheck + manual smoke. Add unit tests when a runner is wired
  (`vitest` planned).
- `src/state/auth.ts`, `src/lib/api.ts` (Slice 1) — auth store and
  axios interceptor with single-flight refresh. Behavior is end-to-end
  (login → store → next request → token expires → refresh → retry) and
  needs a backend running; manual smoke covers it for now. Concurrent-
   401 lock and rotation handling are the highest-risk parts; revisit
  with unit tests when the runner lands.

## Backlog (next up)

- [ ] Wire react-query `QueryClient` defaults (staleTime, retries,
  error mapping from `ApiExceptionResponse`).
- [ ] Auth slice: login screen → store JWT → refresh token rotation.
- [ ] `src/lib/api.ts` reads `localStorage` in the request interceptor
  unconditionally — breaks under Next.js SSR. Guard with
  `typeof window !== 'undefined'` (or move token to a client-only
  store) before the auth slice ships.
- [ ] Configure `core.hooksPath = .githooks` so the pre-commit
  verification stack runs locally (currently inactive).

## Blocked

<!--
- [ ] <task> — waiting on: <reason or person>
-->
