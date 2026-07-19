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
   now matches (CANCELLED added 2026-05-10). `src/lib/ticket-status.ts`
   maps both ways. CANCELLED is writable in the **edit dialog and
   detail panel** (constant `UI_STATUS_EDITABLE`) but **not** in the
   create dialog (`UI_STATUS_WRITABLE`, 4 items) — you don't open a
   ticket already cancelled.
2. **Data table — `@tanstack/react-table`.** One typed `<DataTable<T>>`
   in `src/components/worklog/data-table.tsx`, reused by tickets /
   clientes / sistemas / usuarios.
3. **Foundation commit (Slice 0).** Land the in-flight design system
   (31 files) + SSR guard + status mapper + `@tanstack/react-table`
   install as one foundation commit before feature slices.
4. **Auth via cookie HttpOnly (2026-05-10).** Backend emite
   `worklog_access` + `worklog_refresh` (HttpOnly, SameSite=Strict).
   Frontend não persiste tokens em JS; `withCredentials: true` no
   axios; `useAuthStore` guarda apenas `user`; gate de rota via
   `GET /users/me`.
5. **Refresh strategy.** Axios response interceptor com single-flight
   refresh em 401: `POST /auth/refresh` sem body (cookie carrega o
   refresh token); falha → clear store, redirect `/login`.
6. **Route groups.** `(auth)/login` (no shell, no guard) and
   `(app)/...` (auth-gated, framed by `<AppShell>`).
7. **Locale.** pt-BR.
8. **V2 admin modules — card grid (2026-05-15).** Clientes, Sistemas e
   Usuários renderizam grid responsivo de cards (mockups
   `mockups/V2-*.png`); não usam mais `<DataTable>`. Mobile em escopo
   (coluna única). Ativar/desativar é ADMIN-only (`useAuthStore.isAdmin`).
   Primitivos compartilhados: `EntityCard`, `StatCell`, `StatusPill` em
   `src/components/worklog/` + `systemShortCode` em `worklog-meta.ts`.
   Pendências de backend que renderizam `—` até o backend liberar:
   `ClientResponse.email`, `SystemResponse.description`,
   `enabled` em `SystemRequest`, endpoint de reativar usuário,
   `enabled` em `UserResponse` (sem isso o dot decorativo e o botão
   Desativar/Ativar não conseguem refletir o estado real após
   desativação).

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

## Slice R — Rebranding (indigo / base fria / Space Grotesk)

Especificação completa da marca em `memory/brand.md`. Atravessa toda a
UI, por isso é sequenciada como fatia própria e não misturada com
feature work (AGENTS.md §5).

Ordem deliberada: os tokens vêm primeiro porque a maioria dos
componentes já os consome — a fatia R1 sozinha migra a maior parte da UI
sem tocar em componente nenhum. As fatias seguintes só limpam o que
escapou dos tokens.

### R1 — Tokens (`src/app/globals.css`)

Um arquivo. Troca a escala `--wl-*` para a base fria e o hue OKLCH de
255.8 → 277.117 em `primary`/`ring`/`accent`/`sidebar-*`/`chart-1..5`.
Adiciona `--wl-danger` e `--wl-success` (+ mapeamento em `@theme inline`).
`--radius` não muda.

Ponto de decisão: revisar `/design` aqui. É a mudança de maior impacto
visual e reverter custa um arquivo. Não seguir sem aprovação.

### R2 — Fontes e metadata (`src/app/layout.tsx`)

Adiciona Space Grotesk 600/700 via `next/font/google`, liga
`--font-heading` a ela em `globals.css` (hoje é alias inerte de
`--font-sans`). Inter e JetBrains Mono ficam.

Favicons: copiar os 6 PNGs de `nova-branding/favicon/` para o repo
(`src/app/icon.png` + `apple-icon.png`, convenção do Next 16) e remover
`src/app/favicon.ico`. **Estes assets precisam sair do gitignore** —
`nova-branding/` é ignorado e o build quebra se o ícone morar lá.

### R3 — Logo (`src/components/worklog/logo.tsx`)

Substitui o "W" desenhado em CSS pelo símbolo SVG (geometria em
`memory/brand.md`), versão escura canônica. Wordmark em Space Grotesk,
grafia "WorkLog".

Consumidores a verificar: `shell/sidebar.tsx`, `shell/top-bar.tsx`,
`(auth)/login/page.tsx`. A prop `withWordmark` e o contrato `size` devem
sobreviver para não quebrar as três chamadas.

### R4 — Status e prioridade (`src/lib/worklog-meta.ts`)

`STATUS_META` e `PRIORITY_META` com as cores novas. Reavaliar
`AVATAR_COLORS` (hoje são tons terrosos quentes — vão destoar da base
fria).

### R5 — Varredura dos hex hardcoded

~30 ocorrências em `client-grid`, `client-detail`, `system-grid`,
`system-detail`, `user-grid`, `ticket-detail`, `ticket-form`,
`ticket-table`, `ticket-activity`, `status-pill`, `worklog/tag`,
`usuarios/page`, `sistemas/page`, `clientes/page`, `perfil/page`.
Trocar por `var(--wl-danger)` / `var(--wl-success)` / `var(--primary)`.

Maior que o limite de ~5 arquivos do AGENTS.md §5, mas é substituição
mecânica de valor por token. Quebrar em 3 levas por diretório
(`clients`+`systems`, `users`+`tickets`, páginas) se ficar pesado.

### Verificação por fatia

`agent-md.toml` declara `typecheck` e `lint`, e `[visual] required =
true` torna a evidência visual **bloqueante** para qualquer `.tsx`/`.css`
tocado. Cada fatia precisa de:

1. `pnpm exec tsc --noEmit` e `pnpm exec eslint .`
2. Screenshot Playwright + nota estruturada em `.agent/visual/` com os 5
   campos (Changed files, Route or URL, Viewport, Artifact, Observed
   result), fresca em até 3600s
3. `/design` nos dois temas (claro e escuro) — é o showcase que renderiza
   todos os componentes de uma vez

Rotas para conferir além do `/design`: `/login` (logo grande),
`/dashboard` (donut e barras usam `chart-*`), `/tickets` (densidade de
status), `/clientes` (ações destrutivas).

Credenciais de dev em `memory/agents.md`.

### Riscos

- A base fria abandona o bege/marrom que é a assinatura atual do app.
  Vai parecer produto diferente, não evolução. R1 é o ponto de não
  retorno barato — decidir ali.
- Contraste: `--wl-text-muted #8A8794` sobre `--wl-surface #1C1D26` fica
  em ~4.6:1. Passa AA para texto normal, mas é apertado. Conferir os
  usos em `text-[11px]`, que são muitos.
- `AWAITING_DEV` e `MEDIUM` compartilham `#8A8794`, e `CANCELLED` e `LOW`
  compartilham `#55535E`. Contextos diferentes, mas conferir se nunca
  aparecem lado a lado.

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
