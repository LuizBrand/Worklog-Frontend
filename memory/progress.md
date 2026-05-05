# Atomic Progress Log

Your temporal anchor. Tick atomic tasks as you complete them. Never mark a
task done unless `memory/verify.md` criteria are met.

The `state-enforcement.sh` hook blocks task completion if source files
changed but this file wasn't updated.

## In Progress

<!-- nothing in progress -->

- [x] 2026-05-04 — Slice 5 — Ticket detail panel:
  - `src/components/tickets/ticket-activity.tsx` — timeline de logs; renderiza STATUS (chips de/para), DESCRIPTION (diff verde/vermelho), SOLUTION/nota (texto), outros campos genéricos
  - `src/components/tickets/ticket-detail.tsx` — painel fixo direito (480px); header ID+StatusChip+título+X; meta grid 2-col; botões "Mudar status" (CANCELLED desabilitado); DESCRIÇÃO; TicketActivity; footer textarea+Salvar nota; backdrop fecha ao clicar; Esc fecha via keydown
  - `src/components/tickets/ticket-table.tsx` — adicionado `onRowClick` prop; `<Link>` removido das células; `<tr>` recebe `onClick`
  - `src/app/(app)/tickets/page.tsx` — lê param `?id=`; `openDetail`/`closeDetail` manipulam URL; passa `onRowClick` para TicketTable; renderiza `<TicketDetail>` quando `selectedId` presente; Esc handler para fechar
  - tsc ✓, visual evidence: slice-5-ticket-detail.{png,md}

- [x] 2026-05-03 — Slice 4 — Tickets list:
  - `src/app/(app)/tickets/page.tsx` — client component; header com search (shortcut "/"), selects de status e cliente, botão "+ Novo C"; URL params (`q`, `status`, `clientId`, `page`); `useFindAllTickets` + `useFindAllClients`; cast para `PageTicketSummary` (gotcha schema swap); paginação com ChevronLeft/Right
  - `src/components/tickets/ticket-table.tsx` — tabela 8 colunas; skeleton 8 linhas; empty state; link por linha; Prioridade exibe "—" (campo ausente no backend)
  - tsc ✓, visual evidence: slice-4-tickets-desktop.{png,md}

- [x] 2026-05-03 — TicketList scrollbar: `scroll-thin` → `scroll-hide` in `src/components/dashboard/ticket-list.tsx`. Barra de rolagem vertical removida; scroll por roda/toque mantido. tsc ✓.

- [x] 2026-05-02 — Dashboard polish (round 5 — right-column compaction + legend refinement):
  - StatusDonut: `gap-4` → `gap-3`, donut `160px` → `152px` / `strokeWidth 18` → `16`
  - Legend markers: circular `borderRadius:'50%'` → square `borderRadius:2` (7×7px)
  - Legend grid: `gap-x-4 gap-y-2` → `gap-x-3 gap-y-1.5` (tighter 2-col grid)
  - PriorityDistribution: outer `gap-4` → `gap-2.5`, inner bars `gap-3` → `gap-2`
  - QuickFilters: outer `gap-3` → `gap-2.5`, shortcuts list `gap-2` → `gap-1.5`
  - Dashboard page right column: `gap-4` → `gap-2` (ATALHOS bottom now aligns with TicketList bottom)
  - tsc ✓, visual evidence: slice-4e-dashboard-round5.png

- [x] 2026-05-02 — Dashboard polish (round 5):
  - Accent bar: `w-[2px] rounded-full my-2.5 ml-[3px]` — thin inset pill with spacing (was 3px flush bar)
  - Count badge: orange pill `--status-open` with tinted bg (was muted text)
  - TicketList: `lg:max-h-[660px]` + inner list `scroll-thin overflow-y-auto` — caps height to ~right-column height
  - Scrollbar: `.scroll-thin` utility in globals.css (`scrollbar-width: thin`, 4px webkit, `--wl-border-2` color)
  - Applied `.scroll-thin` to both TicketList inner list and RecentActivity horizontal scroll
  - tsc ✓, visual evidence blocked by auth (see slice-4d)

- [x] 2026-05-02 — Dashboard polish (round 4):
  - StatsBar icons: each icon wrapped in 18×18 bordered box (1px solid <color>55, border-radius 4)
  - ⚠ icon color: `var(--status-open)` orange (was `--wl-text-muted`)
  - "+ Novo ticket" button: solid `var(--primary)` fill + white text (was ghost tint)
  - Client name color: `var(--primary)` font-medium (was muted)
  - System name color: `var(--wl-text-muted)` (was primary) — colors swapped vs before
  - Ticket row separator: `borderTop: 1px solid var(--wl-border)` between rows (idx > 0)
  - Status+date right-side alignment: status chip `w-[90px] justify-end`, date `w-[60px] text-right`
  - tsc ✓, lint ✓, visual evidence: slice-4d-dashboard-desktop.png (login page — dashboard blocked by auth)

- [x] 2026-05-02 — Dashboard polish (round 3):
  - StatsBar: mobile → 2×2 grid of individual chips; desktop → w-fit inline bar (not full-width)
  - Sidebar: bg-card (cool-neutral) → --wl-surface, borders → --wl-border, hover → --wl-surface-2 to match warm dark-mode tones
  - tsc ✓, lint ✓, visual evidence: slice-4c-dashboard-{desktop,mobile}.png

- [x] 2026-05-02 — Dashboard visual redesign (round 2):
  - StatsBar → compact single-line chip strip (count + label + icon, pipe-separated)
  - StatusDonut → larger donut (160px), "TOTAL" center label, 2-column legend grid, no %
  - QuickFilters → Atalhos (keyboard shortcuts panel: C, /, Esc with kbd keys)
  - TicketList → left accent border rows, system name in primary color, count badge in header, arrow on hover
  - Dashboard page → full-width (removed max-w-6xl), lg:grid-cols-[1fr_300px], passes totalCount
  - tsc ✓, lint ✓, visual evidence: slice-4b-dashboard-{desktop,mobile}.png

- [x] 2026-05-02 — Login split-screen + Dashboard two-column refactor:
  - `src/app/(auth)/layout.tsx` → split-screen (left form, right marketing panel w/ dot texture)
  - `src/app/(auth)/login/page.tsx` → tab switcher (login|register), logo top-left, register form
    with `useRegister` + zod/v3 validation + `toast.success` on success
  - `src/components/dashboard/stats-bar.tsx` (new) — 4 status-count chips replacing KPI cards
  - `src/components/dashboard/ticket-list.tsx` (new) — left-column ticket rows w/ skeleton
  - `src/components/dashboard/quick-filters.tsx` (new) — static filter pills
  - `src/components/dashboard/recent-activity.tsx` — rewritten to horizontal scrollable cards
  - `src/components/dashboard/priority-distribution.tsx` — title updated + surface fix
  - `src/components/dashboard/status-donut.tsx` — `var(--wl-surface-1)` → `var(--wl-surface)` fix
  - `src/app/(app)/dashboard/page.tsx` — new layout (StatsBar + grid + RecentActivity)
  - `src/components/dashboard/kpi-card.tsx` — deleted (replaced by StatsBar)
  - tsc ✓, lint ✓, visual evidence captured (login-desktop, register-tab, dashboard-desktop, dashboard-mobile)

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

## TDD-check exemptions (slice 5 — ticket detail panel)

- `src/components/tickets/ticket-activity.tsx` — pure UI component; renderiza `TicketLogResponse[]` sem lógica de negócio. Sem test runner configurado; validado por tsc + evidência visual.
- `src/components/tickets/ticket-detail.tsx` — client component que orquestra queries e mutation. Sem test runner; validado por tsc + smoke visual (login → clique em linha → painel aparece → campos corretos).
- `src/components/tickets/ticket-table.tsx` — refactor: `<Link>` → `onClick` + prop `onRowClick`. Comportamento verificado visualmente.

## TDD-check exemptions (slice 4 — tickets list)

- `src/components/tickets/ticket-table.tsx` — componente UI puro; renderiza `TicketSummary[]` sem lógica de negócio. Sem test runner configurado; validado por tsc + evidência visual.
- `src/app/(app)/tickets/page.tsx` — page client component; orquestra queries e filtros via URL params. Sem test runner; validado por tsc + smoke visual.

## TDD-check exemptions (login split-screen + dashboard refactor)

- `src/components/dashboard/stats-bar.tsx` — pure UI chip row, no business logic. No test runner;
  validated by tsc + visual evidence.
- `src/components/dashboard/ticket-list.tsx` — pure UI list, renders TicketSummary rows. No test
  runner; validated by tsc + visual evidence.
- `src/components/dashboard/quick-filters.tsx` — static link pills, no logic. Validated by tsc + visual.

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
