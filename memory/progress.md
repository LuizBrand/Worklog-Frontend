# Atomic Progress Log

Your temporal anchor. Tick atomic tasks as you complete them. Never mark a
task done unless `memory/verify.md` criteria are met.

The `state-enforcement.sh` hook blocks task completion if source files
changed but this file wasn't updated.

## In Progress

<!-- none — slice 2 complete, slice 3 next -->

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
