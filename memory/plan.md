# Macro Plan

The architectural design. Updated when direction changes. Vertical slices
only — build full-stack features end-to-end, not horizontal layers
(all DBs, then all APIs, then all UIs).

## Current Phase

Phase 2 — implement the WorkLog frontend feature surface on top of the
foundation that Phase 1 (Orval codegen, theme, providers) already
delivered. Mockups in `mockups/` (gitignored) define screens; backend
contract is `openapi/worklog.json` (5 tags). Each slice routes a real
URL, calls a real endpoint, renders with the existing primitives, and
lands behind the agent-md gate (typecheck + lint + fresh
`.agent/visual/<slice>.{png,md}` evidence, freshness 3600s).

Approved long-form plan with full rationale lives at
`/home/luizzz/.claude/plans/create-a-plan-to-floofy-goose.md`.

## Locked Decisions

1. **Status taxonomy — translation layer.** UI keeps the 5 mockup states
   (`OPEN | IN_PROGRESS | AWAITING_DEV | RESOLVED | CANCELLED`); API
   stays at its 4 (`PENDING | AWAITING_CUSTOMER | AWAITING_DEVELOPMENT |
   COMPLETED`). New `src/lib/ticket-status.ts` maps both ways.
   `CANCELLED` is **write-blocked** — typed as `Exclude<TicketStatus,
   'CANCELLED'>` on the request side, disabled in the UI dropdown with
   a tooltip until the backend supports it.
2. **Data table — `@tanstack/react-table`.** One typed `<DataTable<T>>`
   in `src/components/worklog/data-table.tsx`, reused by tickets /
   clientes / sistemas / usuarios.
3. **Foundation commit (Slice 0).** Land the in-flight design system
   (31 files) + SSR guard + status mapper + `@tanstack/react-table`
   install as one foundation commit before feature slices.
4. **Token field name.** Consume API's `acessToken` (typo) as-is;
   document in `memory/gotchas.md`. Adapter would drift on regen.
5. **Refresh strategy.** Axios response interceptor with single-flight
   refresh on 401; on refresh failure → clear store, redirect to
   `/login`.
6. **Route groups.** `(auth)/login` (no shell, no guard) and
   `(app)/...` (auth-gated, framed by `<AppShell>`).
7. **Locale.** pt-BR.

## Vertical Slices

### Slice 0 — Pre-flight (foundation)

- SSR-guard `src/lib/api.ts` (`typeof window !== 'undefined'`).
- New `src/lib/ticket-status.ts` (`apiToUiStatus`, `uiToApiStatus`,
  `UI_STATUS_WRITABLE`).
- `git config core.hooksPath .githooks`.
- `pnpm add @tanstack/react-table`.
- Capture `.agent/visual/design-showcase.{png,md}` for `design`
  (renamed from `_design` — Next.js `_folder` is opt-out of routing).
- Commit foundation (in-flight design system + new files).
- **Verify**: tsc, lint, evidence captured.

### Slice 1 — Auth (login + session)

- Routes: `(auth)/layout.tsx`, `(auth)/login/page.tsx`,
  `(app)/layout.tsx` (auth guard), `(app)/dashboard/page.tsx` (stub).
- `src/state/auth.ts` zustand store with persist.
- Rewire `src/lib/api.ts` to read token from store.
- Single-flight 401 → refresh → retry interceptor.
- Hooks: `useLogin`, `useGetMe`.
- Evidence: `slice-1-login`, `slice-1-dashboard-stub`.

### Slice 2 — App shell (topbar / bottom tab bar / theme toggle / user menu)

- Mounted in `(app)/layout.tsx`.
- `src/components/shell/{app-shell,top-bar,bottom-tab-bar,user-menu}.tsx`.
- Adaptive via `useIsDesktop()`; safe-area padding (54 top / 24 bottom)
  on mobile.
- Evidence: `slice-2-shell-{desktop,mobile}`.

### Slice 3 — Dashboard

- DonutChart by status, PriorityBar distribution, KPI cards, Timeline
  recent activity (top 5 tickets, N+1 deferred).
- `src/components/dashboard/{kpi-card,status-donut,priority-distribution,recent-activity}.tsx`.
- Evidence: `slice-3-dashboard`.

### Slice 4 — Tickets list (filters + pagination)

- Generic `src/components/worklog/data-table.tsx`.
- URL-state via `useSearchParams` (hand-rolled).
- shadcn adds: `pagination`, `checkbox`, `breadcrumb`.
- All status reads → `apiToUiStatus`; filter writes → `uiToApiStatus`
  minus `CANCELLED`.
- Mobile: filter sheet + card list.
- Evidence: `slice-4-tickets-list-{desktop,mobile}`.

### Slice 5 — Ticket detail + activity timeline

- `(app)/tickets/[id]/page.tsx`. Verify Next.js 16 intercepting routes
  before relying on them; fall back to plain route + `<Sheet>` if
  fiddly.
- `src/components/tickets/{ticket-detail,ticket-meta,ticket-activity}.tsx`.
- Hooks: `useGetTicketByPublicId`, `useGetTicketLogs`.
- shadcn adds: `accordion` (optional), `alert-dialog`.
- Evidence: `slice-5-ticket-detail-{desktop,mobile}`.

### Slice 6 — Ticket create / edit / status / delete

- `src/components/tickets/ticket-form.tsx` (`react-hook-form` + zod).
- Combobox = `command` + `popover`.
- Centralized `src/api/invalidate.ts` (verify orval key shapes).
- Status dropdown built from `UI_STATUS_WRITABLE`; `CANCELLED` disabled.
- Evidence: `slice-6-ticket-{create,edit}`.

### Slice 7 — Clientes (list + detail + create / edit)

- `(app)/clientes/page.tsx`, `(app)/clientes/[id]/page.tsx`.
- Reuse `<DataTable>`, `Form`, `Dialog`.
- Hooks: `useFindAllClients`, `useFindClientByPublicId`,
  `useSaveClient`, `useUpdateClient`.
- Evidence: `slice-7-clientes-{list,detail}`.

### Slice 8 — Sistemas (list + create / edit)

- `(app)/sistemas/page.tsx`. No detail page.
- Hooks: `useFindAllSystems`, `useSaveSystem`, `useUpdateSystem`,
  `useFindSystemByPublicId`.
- Evidence: `slice-8-sistemas`.

### Slice 9 — Perfil + change password

- `(app)/perfil/page.tsx`. `ChangePasswordForm` + logout.
- Hooks: `useGetMe`, `useChangeMyPassword`.
- Evidence: `slice-9-perfil`.

### Slice 10 — Usuarios (admin)

- `(app)/usuarios/page.tsx`, `(app)/usuarios/[id]/page.tsx`.
- `<RoleGate role="ADMIN">` in `src/components/shell/role-gate.tsx`.
- Hooks: `useFindAllUsers`, `useFindUserByPublicId`,
  `useDeactiveUserByPublicId`.
- Evidence: `slice-10-usuarios`.

## Slice Order

```
0 → 1 → 2 → { 3, 4, 9, 10 (any time after 2) }
                4 → 5 → 6 → 7 → 8
```

## Deferred / Out of Scope

- Password reset / forgot-password.
- Settings beyond `/perfil`.
- Bulk actions, sorting beyond `updatedAt desc`, full-text search.
- CSV / PDF export, admin user-invite UI, notifications, comments,
  attachments.
- i18n beyond pt-BR.
- Storybook / Chromatic.
- Test runner (revisit after slices land).
- Visibility filter on tickets.
- PWA / Service Worker.
- Pre-emptive token refresh beyond the 401 interceptor.

## Open Questions

- Role hierarchy USER / SUPPORT / ADMIN — Slice 10 assumes ADMIN-only;
  SUPPORT vs USER differences on tickets need product confirmation.
- `TicketSummary` has no `priority` field — confirm whether priority
  is delivered elsewhere or is a backend gap.
- Refresh-token rotation — does backend rotate `refreshToken` on each
  refresh? Affects single-flight lock semantics.
