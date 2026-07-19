# Atomic Progress Log

Your temporal anchor. Tick atomic tasks as you complete them. Never mark a
task done unless `memory/verify.md` criteria are met.

The `state-enforcement.sh` hook blocks task completion if source files
changed but this file wasn't updated.

## In Progress

- [x] 2026-07-18 — Fix build Docker na VPS (`pnpm install --frozen-lockfile`
  exit 1): corepack usava pnpm default (9.x) no container, divergindo do
  lockfile 9.0 gerado por pnpm 10. Fixado a versão: `packageManager:
  "pnpm@10.33.2"` no `package.json` e `corepack prepare pnpm@10.33.2
  --activate` no `Dockerfile`. `--frozen-lockfile` revalidado local (OK).

- [x] 2026-07-15 — Infra de deploy (VPS, front + back, cookie HttpOnly):
  - Auth já estava migrada pro modelo de cookie (nada a mudar no código de auth):
    `withCredentials`, sem localStorage/Bearer/CSRF, login espera 204, guard via
    `/users/me`, interceptor renova no 403.
  - `next.config.ts` — `output: "standalone"` (imagem Docker enxuta). Build validado
    (`pnpm build` gera `.next/standalone/server.js`).
  - `Dockerfile` multi-stage (pnpm/corepack, runner non-root); `NEXT_PUBLIC_API_URL`
    entra como build ARG porque é congelado no build. `.dockerignore` adicionado.
  - `deploy/` — `docker-compose.yml` (Caddy auto-HTTPS + frontend + backend
    placeholder), `Caddyfile`, `.env.example` (APP_DOMAIN/API_DOMAIN, subdomínios
    same-site app./api.). `.gitignore` libera `deploy/.env.example`.
  - `DEPLOY.md` — passo a passo primeira-vez (DNS → Docker → compose up → verificar),
    centrado no contrato do cookie SameSite=Strict e no gotcha 403 vs 401.

- [x] 2026-07-15 — Remover auto-cadastro da tela de login:
  - Backend passou a expor `/auth/register` só para admin; admin padrão é criado no
    boot e cria usuários internamente via `/users`. Auto-cadastro público não se aplica.
  - `src/app/(auth)/login/page.tsx` — removidos aba "Criar conta", form/schema de
    registro e `useRegister`. Tela agora é só login (título + subtítulo orientando
    que credenciais vêm do admin).
  - `src/app/globals.css` — removidos keyframes `tab-in-from-*` e utilitários
    `.animate-tab-in-*` (usados só pelo switcher de abas do login).
  - Pendente (quando backend subir): regenerar client Orval e criar fluxo admin de
    "Criar usuário" na página `/usuarios` via novo `POST /users`.
  - Evidência: `.agent/visual/login-only-no-register.md`. tsc ✓, lint ✓.

- [x] 2026-07-15 — Bugfix auth: sessão expirada não jogava para /login + polish do CTA de login:
  - `src/lib/api.ts` — interceptor axios agora trata **401 e 403** como "tentar refresh"
    (backend Spring devolve 403, não 401, quando o access cookie sumiu/expirou).
    Só faz forceLogout quando o próprio `/auth/refresh` falha; 403 que sobrevive a um
    refresh bem-sucedido é negação de permissão real e não desloga. Ver [[auth-403-contract]].
  - `src/app/(app)/layout.tsx` — guarda `/users/me` redireciona para /login em 401 **ou** 403.
  - `src/app/(auth)/login/page.tsx` — botão submit (Entrar / Criar conta) para
    `h-10 w-full text-sm font-semibold tracking-tight` (largura casa com os inputs,
    fonte 14px semibold em vez do 12px do `size=lg`).
  - Verificado no navegador (3 cenários): sessão inválida → /login; access expirado +
    refresh válido → refresh transparente (403→204→200); login válido → dashboard.
  - Evidência visual: `.agent/visual/auth-403-and-login-cta.md`.
  - tsc ✓, lint ✓ (só warning pré-existente do `_` em page.tsx).

- [x] 2026-05-19 — Mobile UI redesign: tickets page + FAB + filter icon em todas as páginas:
  - `src/components/worklog/mobile-fab.tsx` (novo) — FAB fixo acima do BottomTabBar
  - `src/components/tickets/ticket-table.tsx` — adiciona `MobileTicketCards` para lista de cards em mobile
  - `src/app/(app)/tickets/page.tsx` — redesign mobile: header simplificado, barra de busca full-width, chips de status, lista de cards, filtro de cliente via ícone, FAB
  - `src/app/(app)/clientes/page.tsx` — FAB (oculta "+" no header em mobile) + ícone de filtro para status
  - `src/app/(app)/sistemas/page.tsx` — FAB (oculta "+" no header em mobile)
  - `src/app/(app)/dashboard/page.tsx` — adiciona MobileFab com href para /tickets?create=1
  - `src/components/dashboard/ticket-list.tsx` — simplifica layout do header do painel pendentes
  - TDD-exemption: componentes UI puros; sem test runner configurado.
  - tsc ✓, lint ✓

- [x] 2026-05-15 — Redesign V2 R0 — primitivos compartilhados:
  - `src/components/worklog/entity-card.tsx` (novo) — shell `rounded-xl` com `inactive`/`selected`/`onClick`/`children`
  - `src/components/worklog/stat-cell.tsx` (novo) — `valor / LABEL` em coluna com `tone: 'default' | 'warn' | 'danger'`
  - `src/components/worklog/status-pill.tsx` (novo) — variantes `text` (mockup card) e `badge` (substitui `InactiveBadge` inline em `ticket-detail.tsx` e `ticket-table.tsx`)
  - `src/lib/worklog-meta.ts` — adiciona `systemShortCode(i)` que retorna `s-{0-padded 3-digit}`
  - exports em `src/components/worklog/index.ts`
  - TDD-exemption: UI pura sem test runner; `systemShortCode` é função pura trivial.
  - tsc ✓, lint ✓

- [x] 2026-05-15 — Redesign V2 R1 — Clientes (card grid):
  - `src/components/clients/client-table.tsx` → `client-grid.tsx` — grid `1/2/3/4/5` cols, avatar + e-mail placeholder (oculto até backend liberar) + StatusPill + 3 StatCells TICKETS/ABERTOS/CRÍTICOS + Ver tickets + Desativar/Ativar admin-only
  - `src/components/clients/client-detail.tsx` — usa `StatusPill variant="badge"` (substitui o antigo `ClientStatusBadge`)
  - `src/app/(app)/clientes/page.tsx` — agrega `statsByClient` via `useFindAllTickets({ size: 500 })` (sem aggregation endpoint); `Ver tickets` faz `router.push('/tickets?clientId=…')`; novo botão `+ Cliente`; confirm dialog suporta desativar (`useSoftDeleteClient`) e reativar (`useUpdateClient { enabled: true }`)
  - Pendência backend: `ClientResponse.email`
  - tsc ✓, lint ✓, evidência: `.agent/visual/r1-clientes-{desktop,mobile}.{png,md}`

- [x] 2026-05-15 — Redesign V2 R2 — Sistemas (card grid):
  - `src/components/systems/system-table.tsx` → `system-grid.tsx` — header com padrão `repeating-linear-gradient`, ID `s-XXX` via `systemShortCode`, avatar grande centrado, StatusPill, descrição placeholder (oculta até backend liberar), 2 StatCells TOTAL/ABERTOS, Desativar/Ativar admin-only
  - `src/app/(app)/sistemas/page.tsx` — `orderedSystems` por nome+publicId para shortcode estável; `statsBySystem` agrega abertos; toggle envia `{ enabled }` via `useUpdateSystem` cast em `SystemRequest` (gap de spec)
  - Pendências backend: `SystemResponse.description` ausente; `SystemRequest.enabled` ausente da spec (toggle usa cast)
  - tsc ✓, lint ✓, evidência: `.agent/visual/r2-sistemas-{desktop,mobile}.{png,md}`

- [x] 2026-05-15 — Redesign V2 R3 — Usuários (card grid):
  - `src/components/users/user-table.tsx` → `user-grid.tsx` — card centrado, ponto verde/cinza decorativo no canto, avatar 56px, nome+e-mail, role badge ADMIN/USER, rodapé Desativar/Reativar
  - `src/app/(app)/usuarios/page.tsx` — `confirmTarget` substitui `confirmId`; "Reativar" mostra toast.error (backend sem endpoint); removidas refs não usadas a `router`/`params`
  - Pendência backend: endpoint para reativar usuário inexistente — botão Reativar bloqueado com toast
  - tsc ✓, lint ✓, evidência: `.agent/visual/r3-usuarios-{desktop,mobile}.{png,md}`

- [x] 2026-05-15 — Redesign V2 R4 — polimento + memória:
  - `memory/plan.md` — Locked Decision §8 (V2 admin modules = card grid; admin-only toggles; pendências de backend listadas)
  - `memory/gotchas.md` — entry sobre divergência Request/Response na spec do backend (cast `{ enabled } as SystemRequest`)
  - `scripts/capture-redesign.mjs` (novo) — script Playwright autocontido para capturar as 6 telas (login + 3 rotas × 2 viewports)
  - 6 PNGs + 6 notas em `.agent/visual/r{1,2,3}-{desktop,mobile}.{png,md}`

- [x] 2026-05-15 — Refinamento R1 — Clientes (feedback do dono):
  - `src/components/clients/client-grid.tsx` — avatar agora `rounded-md size=40` (igual ao card de Sistemas, deixou de ser circular); placeholder `—` sempre visível embaixo do nome (slot reservado para o e-mail futuro); 2 separadores inset (`mx-4`) entre seções (header/stats e stats/footer), sem tocar as bordas; `Ver tickets` ganha `flex-1` (mais comprido); `Desativar` ganha padding `px-3 py-1.5` e cantos arredondados; stats viram `grid grid-cols-3` (distribuição igual entre TICKETS/ABERTOS/CRÍTICOS); skeleton atualizado
  - `src/components/worklog/status-pill.tsx` — variante `text` troca verde `#22c55e` por `#4ade80` (mais vibrante), mantém variante `badge` inalterada
  - Evidência atualizada: `.agent/visual/r1-clientes-desktop.{png,md}`
  - tsc ✓, lint ✓

- [x] 2026-05-15 — Refinamento R2 — Sistemas (feedback do dono):
  - `src/components/systems/system-grid.tsx` — header agora usa `radial-gradient` tintado com a cor do avatar (`withAlpha(color, '4d→26→10')`) sobreposto ao padrão de grid; avatar ganha `boxShadow` (glow na mesma cor) e `filter: brightness(1.18) saturate(1.1)` para aspecto brilhante; separador entre header e body fica borda-a-borda (`borderBottom` no header); separador entre body e footer é inset (`mx-4 border-t`); descrição mostra `—` placeholder; Desativar ganha padding `px-3 py-1.5` + cantos arredondados; skeleton atualizado
  - `src/components/worklog/avatar.tsx` — `WlAvatar` ganha prop opcional `style?: React.CSSProperties` para receber glow/filter quando usado em Sistemas (TDD-exemption: extensão de prop em UI puro existente)
  - `StatusPill` (variante `text`) já compartilha o verde brilhante `#4ade80` com Clientes
  - Evidência atualizada: `.agent/visual/r2-sistemas-desktop.{png,md}`
  - tsc ✓, lint ✓

- [x] 2026-05-15 — Refinamento R3 — Usuários (feedback do dono):
  - `src/components/users/user-grid.tsx` — bolinha decorativa agora muda de `#22c55e` (verde escuro) para `#4ade80` (verde brilhante com glow `boxShadow`) quando ativa; quando inativa, passa para `var(--wl-border-2)` (dim, "apagada"); botão muda de `Reativar` para `Ativar` (texto mais curto)
  - `src/app/(app)/usuarios/page.tsx` — toast de Ativar atualizado para refletir o nome novo do botão
  - `memory/plan.md` §8 — pendência de backend adicional: `UserResponse` não inclui `enabled`. Sem isso, o dot e o botão não conseguem refletir o estado real após desativação — a UI logic está correta para quando o backend liberar o campo.
  - Evidência atualizada: `.agent/visual/r3-usuarios-desktop.{png,md}`
  - tsc ✓, lint ✓

- [x] 2026-05-11 — Committed pending work from 2026-05-10 session:
  - `448f228` refactor(auth): migrate to HttpOnly cookie session (cookie-auth + openapi regen + handoff doc)
  - `876992b` feat: close backend gaps and surface priority across UI (A/B/C)
  - Next: refactor(errors): centralize API error → user-message helper

- [x] 2026-05-10 — Slices A/B/C — backend gaps fechados (gaps #1–#6 do backend-gaps.md):
  - **A.1** `src/lib/ticket-status.ts` — `UiWritableStatus = TicketStatus` (sem Exclude); novo `UI_STATUS_EDITABLE = [...UI_STATUS_WRITABLE, 'CANCELLED']`; `UI_TO_API` ganha CANCELLED
  - **A.2** `src/components/tickets/ticket-detail.tsx` — switcher de status passa a usar `UI_STATUS_EDITABLE`; CANCELLED agora clicável; comentário "backend gap" removido
  - **A.3** `src/components/tickets/ticket-form.tsx` `TicketEditDialog` — campos `status` (UI_STATUS_EDITABLE), `priority` (PRIORITY_OPTIONS) e `userId` (ADMIN-only via `useFindAllUsers`)
  - **A.4** `src/components/tickets/ticket-table.tsx` — coluna PRIORIDADE renderiza badge `PRIORITY_META` via `PriorityPill` interno (substitui o "—" hardcoded)
  - **A.5** `src/app/(app)/dashboard/page.tsx` — agrega `priorityCounts` por prioridade dos arrays pending/awaiting-customer/awaiting-dev; `src/components/dashboard/priority-distribution.tsx` reescrito para consumir `data` prop (fallback "Prioridade não disponível na API atual" removido); cast `as UiWritableStatus` em `statusCounts` retirado
  - **B.1** `src/components/tickets/ticket-form.tsx` `TicketCreateDialog` — filtra `systemsQ.data.filter(s => s.enabled !== false)` antes do map (mesmo padrão de clients)
  - **C.1** `src/components/clients/client-form.tsx` — `clientSchema.enabled: z.boolean().optional()`; `ClientEditDialog` ganha checkbox "Cliente ativo"; payload do `useUpdateClient` inclui `enabled`
  - **C.2** `src/components/clients/client-detail.tsx` — header ganha botão Desativar (Ban) ou Reativar (RotateCcw), ADMIN-only; `useSoftDeleteClient` para desativar, `useUpdateClient` com `enabled:true` para reativar; ConfirmDialog interno reutilizável
  - **C.3** `src/components/clients/client-table.tsx` — `onDeactivate` callback; menu "..." ganha item "Desativar" (danger, só com callback presente e `c.enabled !== false`); `src/app/(app)/clientes/page.tsx` provê callback ADMIN-only e confirm dialog inline com `useSoftDeleteClient`
  - **Hook TDD**: todos os edits acima são extensão de exports existentes (ticket-status, priority-distribution, client-table) ou alteração de props/payload — sem comportamento novo isolável em teste unitário. Cobertura via verificação ponta-a-ponta no slice de verify.
  - **Cleanup**: `backend-gaps.md` zerado; `memory/plan.md` Locked Decision §1 (CANCELLED writable scope) e §4–§5 (auth via cookie) atualizadas
  - tsc ✓, lint 0 errors / 8 warnings pré-existentes (selectCls, watch() do RHF, _ destructure)

- [~] 2026-05-10 — refactor — Migração para cookie-auth (backend agora emite cookies HttpOnly `worklog_access`/`worklog_refresh`):
  - `openapi/worklog.json` — spec substituída pelo usuário (gaps de backend + cookieAuth securityScheme)
  - `pnpm api:gen` — client regerado: `login`/`logout`/`refreshToken` agora retornam 204 sem body; logout/refresh sem args
  - `src/state/auth.ts` — store reduzido a `user`/`setUser`/`clear`; **removido**: persist+localStorage, `acessToken`, `refreshToken`, `setTokens`
  - `src/lib/api.ts` — `withCredentials: true` no axios.create; **removido** interceptor request Authorization Bearer; interceptor 401 agora chama `POST /auth/refresh` sem body (cookies HttpOnly carregam o refresh token); single-flight lock mantido
  - `src/app/(app)/layout.tsx` — gate de auth migrado de `acessToken` em localStorage para `useGetMe` (200 = autenticado; 401 → redirect /login). `setUser` agora vive aqui em vez de no AppShell
  - `src/components/shell/app-shell.tsx` — removida chamada `useGetMe` + `setUser` (movidas para layout); só decide desktop/mobile
  - `src/app/(auth)/login/page.tsx` — onSuccess: `queryClient.invalidateQueries(getGetMeQueryKey())` + redirect; **removido** `setTokens(data.acessToken, data.refreshToken)`
  - `src/components/shell/user-menu.tsx` — `logoutMutate()` sem body; **removido** `refreshToken` do store
  - `src/app/(app)/perfil/page.tsx` — `changePassword` payload sem `refreshToken`
  - Hook TDD: refactor-only (não há comportamento novo a testar; useAuthStore, api, refreshSession são plumbing existente já exercitada por fluxos de login/logout)
  - **Pendente decisão do usuário (spec drift, fora do escopo do refactor):**
    - `TicketRequest.priority` agora obrigatório → `src/components/tickets/ticket-form.tsx` precisa de campo priority (default? select?)
    - `TicketResponseStatus.CANCELLED` agora existe no backend → `src/lib/ticket-status.ts` `UiWritableStatus` excluía CANCELLED; mapping precisa ser estendido
  - Spec drift resolvido: priority obrigatório → select com default MEDIUM em `ticket-form.tsx`; CANCELLED → `API_TO_UI` aceita (read-only), `apiToUiStatus` retorna `TicketStatus`; cast `as UiWritableStatus` no dashboard (API_STATUSES omite CANCELLED em runtime)
  - tsc ✓, lint 0 errors / 5 warnings pré-existentes
  - Validação ponta-a-ponta com backend em :8080: login (`luiz.brand@exemplo.com`) → cookies `worklog_access` + `worklog_refresh` (HttpOnly, SameSite=Strict) → dashboard rende → `/tickets?create=1` mostra campo Prioridade
  - Visual evidence: `.agent/visual/cookie-auth-migration.md` + 3 PNGs (login/dashboard/ticket-create)

- [x] 2026-05-10 — fix — Mobile UI: header do TicketList responsivo + seta oculta no mobile:
  - `src/components/dashboard/ticket-list.tsx` — header: `flex items-center justify-between` → `flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between`; botão recebe `w-fit self-end sm:self-auto` (direita alinhado quando empilhado, lado a lado em sm+)
  - `src/components/dashboard/ticket-list.tsx` — seta `→` recebe `hidden sm:inline` (não visível em touch, não consumia mais ~20px no mobile)
  - tsc ✓

- [x] 2026-05-09 — fix — Mobile UI: sem scroll horizontal + gaps no dashboard:
  - `src/components/shell/app-shell.tsx` — `overflow-x-hidden` adicionado ao `<main>` mobile; impede que o carrossel `RecentActivity` vaze scroll horizontal para a página
  - `src/app/(app)/dashboard/page.tsx` — coluna direita: `flex h-full flex-col justify-between` → `flex flex-col gap-4 lg:h-full lg:justify-between`; `h-full`/`justify-between` só aplicam em `lg:`; `gap-4` garante espaçamento entre StatusDonut / PriorityDistribution / QuickFilters no mobile
  - tsc ✓ (visual evidence pendente — Playwright não instalado no ambiente)

- [x] 2026-05-09 — fix — Auth/login: segurança — onError + confirmPassword — tsc ✓, lint ✓, visual: login-security-fix.md:
  - `src/app/(auth)/login/page.tsx` — onError no login (toast "E-mail ou senha inválidos")
  - `src/app/(auth)/login/page.tsx` — onError no registro (409 = e-mail duplicado; genérico para outros)
  - `src/app/(auth)/login/page.tsx` — campo confirmPassword adicionado com refine de igualdade; excluído do payload da API

- [x] 2026-05-09 — fix — Auth/login: inputs não digitavam + animação de troca de aba — tsc ✓, lint ✓:
  - `src/app/(auth)/login/page.tsx` — reescrito usando register() direto (sem Slot/FormControl); corrige inputs bloqueados no React 19 + RHF 7.73
  - `src/app/(auth)/login/page.tsx` — animação direcional slide+fade ao trocar entre Entrar ↔ Criar conta
  - `src/app/globals.css` — keyframes tab-in-from-right / tab-in-from-left

- [x] 2026-05-09 — fix — Nav icons: substituídos ícones similares de pessoa:
  - `src/components/shell/nav-config.ts` — Clientes: Users→Building2; Usuários: Users2→UserCog; Perfil: User→CircleUser
  - tsc ✓, lint ✓

- [x] 2026-05-09 — feat — Dashboard interativo:
  - `src/components/dashboard/ticket-list.tsx` — link corrigido para `/tickets?id=<publicId>`; botão "+ Novo" navega para `/tickets?create=1`
  - `src/components/dashboard/recent-activity.tsx` — link corrigido para `/tickets?id=<publicId>`
  - `src/components/dashboard/stats-bar.tsx` — chips viram Link navegando para `/tickets?status=<apiStatus>`
  - `src/app/(app)/tickets/page.tsx` — lê `?create=1` na montagem e abre dialog automaticamente; remove o param da URL

- [x] 2026-05-09 — fix — Sidebar TooltipProvider + alinhamento do separador:
  - `src/components/shell/sidebar.tsx` — TooltipProvider adicionado (erro runtime ao colapsar)
  - `src/app/(app)/tickets/page.tsx` — page header: py-3 → h-[52px] para alinhar com sidebar

- [x] 2026-05-09 — Slice 9 — Usuários + Perfil:
  - `src/api/invalidate.ts` — `invalidateUsers`
  - `src/components/users/user-table.tsx` — `UserTable`, `UserRoleBadge`
  - `src/app/(app)/usuarios/page.tsx` — lista ADMIN-only + desativar com confirm
  - `src/app/(app)/perfil/page.tsx` — card de perfil + form alterar senha (zod/v3 + refreshToken do auth store)
  - tsc ✓, visual evidence: slice-9-usuarios-perfil.md

- [x] 2026-05-09 — refactor — FilterSelect customizado substituindo `<select>` nativo: `src/components/worklog/filter-select.tsx`, tickets/page.tsx, clientes/page.tsx — tsc ✓, lint ✓, visual evidence: slice-filter-select-open.md

- [x] 2026-05-09 — Slice 7 — Módulo de Clientes (lista + detalhe + criar/editar):
  - `src/api/invalidate.ts` — `invalidateClients`, `invalidateClient` helpers
  - `src/components/clients/client-table.tsx` — tabela com STATUS badge, SISTEMAS, CRIADO, menu ações (Ver/Editar)
  - `src/components/clients/client-form.tsx` — `ClientCreateDialog`, `ClientEditDialog`, `ClientEditFetcher`; sistemas via checkboxes; zod/v3
  - `src/components/clients/client-detail.tsx` — painel lateral 560px com animações slide-in/out; META: STATUS+CRIADO; SISTEMAS como pills; edit inline
  - `src/app/(app)/clientes/page.tsx` — busca client-side; filtro status TODOS/ATIVO/INATIVO; atalhos C/`/`/Esc
  - `backend-gaps.md` — gaps #5 (sem disable API) e #6 (sem DELETE)
  - tsc ✓, lint ✓

- [x] 2026-05-09 — fix — Filtrar clientes inativos (client-side) no create dialog:
  - `src/components/tickets/ticket-form.tsx` — removido ClientFiltersParamsStatus.ATIVO (causava 403); filtro client-side via `c.enabled !== false`
  - tsc ✓

- [x] 2026-05-09 — fix (revertido) — Filtrar clientes inativos no create dialog:
  - `src/components/tickets/ticket-form.tsx` — `useFindAllClients` usa `ClientFiltersParamsStatus.ATIVO` no create dialog
  - `backend-gaps.md` — gap #4: `SystemResponse` sem campo de status ativo/inativo
  - tsc ✓

- [x] 2026-05-09 — btw — Renomear todos os labels "Autor/AUTOR" → "Responsável/RESPONSÁVEL":
  - `src/components/tickets/ticket-table.tsx` — comentário AUTOR → RESPONSÁVEL
  - `src/components/tickets/ticket-form.tsx` — label "Autor" → "Responsável"
  - `src/components/tickets/ticket-detail.tsx` — MetaItem label "AUTOR" → "RESPONSÁVEL"
  - tsc ✓

- [x] 2026-05-09 — Slice 6q — Animação slide-out do painel de detalhe:
  - `src/app/globals.css` — keyframes slide-out-to-right + fade-out-backdrop; classes animate-slide-out-to-right / animate-fade-out-backdrop
  - `src/components/tickets/ticket-detail.tsx` — isClosing state; handleClose() com setTimeout 230ms; painel/backdrop alternam classes entrada↔saída
  - tsc ✓, lint ✓, visual evidence: slice-6q-panel-slide-out.md

- [x] 2026-05-09 — Slice 6p — Animação slide-in do painel de detalhe:
  - `src/app/globals.css` — keyframes slide-in-from-right + fade-in-backdrop; classes .animate-slide-in-right / .animate-fade-in-backdrop
  - `src/components/tickets/ticket-detail.tsx` — painel e backdrop recebem as classes de animação
  - tsc ✓, visual evidence: slice-6p-panel-slide-in.md

- [x] 2026-05-09 — Slice 6o — Hover dos botões de status como pill de fundo:
  - `src/components/tickets/ticket-detail.tsx` — hover:opacity-70 → hover:bg-white/10 + rounded + px/py padding (pill sutil)
  - tsc ✓, lint ✓, visual evidence: slice-6o-status-hover-pill.{png,md}

- [x] 2026-05-09 — Slice 6n — cursor-pointer em todos os elementos interativos:
  - `ticket-form.tsx`, `ticket-detail.tsx`, `ticket-table.tsx`, `tickets/page.tsx`, `recent-activity.tsx` — cursor-pointer adicionado a todos os botões e selects
  - tsc ✓, lint ✓

- [x] 2026-05-09 — Slice 6m — Painel mais largo + fonte de status equalizada:
  - `src/components/tickets/ticket-detail.tsx` — largura 480→560px; botões de status text-[13px]→text-[12px]
  - tsc ✓, visual evidence: slice-6m-panel-wider-status-font.{png,md}

- [x] 2026-05-09 — Slice 6l — Destaque visual para notas no histórico:
  - `src/components/tickets/ticket-activity.tsx` — entradas `solution` renderizadas como card destacado (tint azul, borda esquerda 3px, header NOTA com ícone)
  - tsc ✓, lint ✓, visual evidence: slice-6l-note-highlight.{png,md}

- [x] 2026-05-09 — Slice 6k — Status filter dinâmico, separadores full-width, ícones neutros na timeline:
  - `src/components/tickets/ticket-detail.tsx` — `Divider` helper com `-mx-5`; status atual filtrado de `SWITCHABLE_STATUSES`; CANCELLED removido; AWAITING_DEV incluído via UI_STATUS_WRITABLE
  - `src/components/tickets/ticket-activity.tsx` — badge de ícone com cor neutra (wl-surface-2/wl-border/wl-text-muted)
  - tsc ✓, lint ✓, visual evidence: slice-6k-status-filter-dividers.{png,md}

- [x] 2026-05-09 — Slice 6j — Detail panel: separadores + status texto colorido + ícones de atividade:
  - `src/components/tickets/ticket-detail.tsx` — `divide-y` entre seções; status change como texto colorido (status color, bold+underline quando ativo, sem chip de fundo)
  - `src/components/tickets/ticket-activity.tsx` — ícones tipados por campo (RefreshCw/status, AlignLeft/descrição, MessageSquare/nota, Type/título, User/usuário); badge circular colorido; nota com left-border block
  - tsc ✓, lint ✓, visual evidence: slice-6j-detail-separators-activity.{png,md}

- [x] 2026-05-09 — Slice 6i — SISTEMA sem azul; CLIENTE discretamente destacado:
  - `src/components/tickets/ticket-table.tsx` — SISTEMA: `var(--primary)` → `var(--wl-text-muted)`; CLIENTE: `font-medium` para leve destaque
  - tsc ✓, lint ✓, visual evidence: slice-6i-sistema-muted-cliente-bold.{png,md}

- [x] 2026-05-09 — btw — Renomear coluna AUTOR → RESPONSÁVEL:
  - `src/components/tickets/ticket-table.tsx` — `COLS` array: `'AUTOR'` → `'RESPONSÁVEL'`
  - tsc ✓, lint ✓, visual evidence: slice-6h-responsavel-col.{png,md}

- [x] 2026-05-09 — Slice 6h — ID curto + botão ··· sempre visível:
  - `src/components/tickets/ticket-table.tsx` — `fmtId` → `slice(0,6)`; botão ··· sempre visível (sem opacity-0/group-hover) + cursor-pointer
  - tsc ✓, lint ✓, visual evidence: slice-6h-id-dots.{png,md}

- [x] 2026-05-09 — Slice 6g — Menu de ações por linha (···):
  - `src/components/tickets/ticket-table.tsx` — coluna de ações com dropdown (Ver detalhes / Editar / Excluir); props `onEdit` e `onDelete`; TDD-check exemption: refactor de componente UI puro
  - `src/components/tickets/ticket-form.tsx` — `TicketEditFetcher` + `TicketDeleteDialog` standalone; TDD-check exemption: UI components sem test runner configurado
  - `src/app/(app)/tickets/page.tsx` — estados `editId`/`deleteId`; wiring dos novos dialogs
  - tsc ✓, lint ✓, visual evidence: slice-6g-row-action-menu.{png×2,md}

- [x] 2026-05-09 — Slice 6f — Botão excluir vermelho:
  - `src/components/tickets/ticket-detail.tsx` — ícone lixo e botão confirm trocados de `--status-open` (laranja) para `#e53e3e` (vermelho)
  - tsc ✓, lint ✓, visual evidence: slice-6f-delete-red.{png,md}

- [x] 2026-05-09 — Slice 6e — Ícone de status sem texto no header do painel:
  - `src/components/worklog/status-chip.tsx` — prop `iconOnly` (bool): renderiza quadrado 22×22 com ícone colorido + tooltip; refactor de UI puro (TDD-check exemption)
  - `src/components/tickets/ticket-detail.tsx` — usa `<StatusChip iconOnly />`; ícone atualiza automaticamente ao mudar status
  - tsc ✓, lint ✓, visual evidence: slice-6e-icon-only-status.{png×2,md}

- [x] 2026-05-09 — Slice 6d — Remover ID do header do painel de detalhe:
  - `src/components/tickets/ticket-detail.tsx` — shortId span + separador • removidos; função shortId deletada; header: StatusChip → título → ações
  - tsc ✓, lint ✓, visual evidence: slice-6d-header-no-id.{png,md}

- [x] 2026-05-09 — Slice 6c — Histórico de alterações atualiza após editar via edit dialog:
  - `src/components/tickets/ticket-form.tsx` — `TicketEditDialog.onSuccess` agora chama `invalidateTicketLogs(qc, ticket.publicId)`; histórico recarrega automaticamente após salvar título/descrição/solução
  - tsc ✓, lint ✓, visual evidence: slice-6c-edit-logs-refresh.{png,md}

- [x] 2026-05-09 — Slice 6b — Create form + status live update fixes:
  - `src/components/tickets/ticket-detail.tsx` — `updateMut.onSuccess` agora chama `invalidateTickets(qc)`: tabela atualiza automaticamente ao mudar status no painel
  - `src/components/tickets/ticket-form.tsx` — `createSchema` + `userId`/`status`; `TicketCreateDialog` com select de status (padrão PENDING/Aberto) e select de autor visível apenas para ADMIN (pré-selecionado com usuário logado; não-admin não vê o campo, userId do store enviado silenciosamente)
  - tsc ✓, lint ✓, visual evidence: slice-6b-create-edit-fixes.{png×2,md}

- [x] 2026-05-09 — Slice 6 — Ticket create / edit / delete:
  - `src/api/invalidate.ts` (new) — `invalidateTickets`, `invalidateTicket`, `invalidateTicketLogs` helpers using partial query-key matching
  - `src/components/tickets/ticket-form.tsx` (new) — `TicketCreateDialog` (title, description, clientId, systemId selects; status=PENDING on submit) + `TicketEditDialog` (pre-fills title/description/solution); both use react-hook-form + zod/v3; Escape closes; toasts on success/error
  - `src/components/tickets/ticket-detail.tsx` — added Pencil (edit) + Trash (delete) icon buttons in panel header; inline delete confirm overlay (z-60/70 above backdrop); `useDeleteTicket` mutation with invalidation; imports `TicketEditDialog`
  - `src/app/(app)/tickets/page.tsx` — `showCreate` state; "+ Novo" button enabled + onClick; "C"/"c" keyboard shortcut opens create dialog; `<TicketCreateDialog>` rendered when showCreate
  - tsc ✓, lint ✓, visual evidence: slice-6-ticket-create-edit.{png×5,md}

- [x] 2026-05-04 — Slice 5 — Ticket detail panel:
  - `src/components/tickets/ticket-activity.tsx` — timeline de logs; renderiza STATUS (chips de/para), DESCRIPTION (diff verde/vermelho), SOLUTION/nota (texto), outros campos genéricos
  - `src/components/tickets/ticket-detail.tsx` — painel fixo direito (480px); header ID+StatusChip+título+X; meta grid 2-col; botões "Mudar status" (CANCELLED desabilitado); DESCRIÇÃO; TicketActivity; footer textarea+Salvar nota; backdrop fecha ao clicar; Esc fecha via keydown
  - `src/components/tickets/ticket-table.tsx` — adicionado `onRowClick` prop; `<Link>` removido das células; `<tr>` recebe `onClick`
  - `src/app/(app)/tickets/page.tsx` — lê param `?id=`; `openDetail`/`closeDetail` manipulam URL; passa `onRowClick` para TicketTable; renderiza `<TicketDetail>` quando `selectedId` presente; Esc handler para fechar
  - tsc ✓, visual evidence: slice-5-ticket-detail.{png,md}
  - unused import `UI_STATUS_WRITABLE` removido de `ticket-detail.tsx` (lint fix)

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

- [x] 2026-05-09 — Slice 8 — Módulo de Sistemas (lista + detalhe + criar/editar):
  - `src/api/invalidate.ts` — `invalidateSystems`, `invalidateSystem` helpers
  - `src/components/systems/system-table.tsx` — tabela NOME + menu Ver/Editar
  - `src/components/systems/system-form.tsx` — `SystemCreateDialog`, `SystemEditDialog`, `SystemEditFetcher`; só campo nome; zod/v3
  - `src/components/systems/system-detail.tsx` — modal centralizado animate-modal-in/out; mostra clientes que usam o sistema (useFindAllClients + filtro client-side)
  - `src/app/(app)/sistemas/page.tsx` — busca client-side, atalhos C/`/`/Esc
  - tsc ✓, lint ✓, visual evidence: slice-8-sistemas.md

## TDD-check exemptions (slice 8 — sistemas)

- `src/api/invalidate.ts` (novos helpers) — pure wrappers, sem lógica de negócio.
- `src/components/systems/system-table.tsx` — UI puro, sem test runner.
- `src/components/systems/system-form.tsx` — UI form, validado por tsc + visual.
- `src/components/systems/system-detail.tsx` — client component, validado por tsc + visual.

## TDD-check exemptions (slice 7 — clientes)

- `src/api/invalidate.ts` (new helpers) — pure wrappers em torno de `qc.invalidateQueries`; sem lógica de negócio. Mesmo padrão dos helpers de tickets já isentos.
- `src/components/clients/client-table.tsx` — componente UI puro; sem test runner configurado; validado por tsc + lint + evidência visual.
- `src/components/clients/client-form.tsx` — UI form components; validado por tsc + lint + visual.
- `src/components/clients/client-detail.tsx` — client component que orquestra query; validado por tsc + lint + visual.

## TDD-check exemptions (slice 6 — ticket create / edit / delete)

- `src/api/invalidate.ts` — pure wrappers around `qc.invalidateQueries`; no business logic. No test runner configured; behaviour is exercised indirectly by every mutation that calls these helpers.
- `src/components/tickets/ticket-form.tsx` — UI form components; validated by tsc + visual evidence (create dialog, edit dialog pre-fill, toasts).

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

## Slice R — Rebranding (indigo / base fria / Space Grotesk)

Spec da marca: `memory/brand.md`. Plano: `memory/plan.md` § Slice R.
Assets do designer em `nova-branding/` (gitignored).

- [x] R1 — tokens em `globals.css`. Base fria nos dois temas, hue OKLCH
  255.8 → 277.117, tokens `--wl-danger` / `--wl-success` novos.
  Evidência: `.agent/visual/r1-tokens-rebranding.md`.

  Dois desvios documentados em `memory/brand.md`:
  1. Neutros do shadcn apontam para os mesmos hex da escala `--wl-*`.
     Eram independentes e nunca bateram (branco puro vs. bege), e a UI
     tem ~69 usos de `bg-muted`/`bg-popover`.
  2. Tema claro usa tons escuros **saturados** (83–98%), não os hex de
     marca escurecidos por multiplicação de RGB — isso dessatura e suja
     (a âmbar caía para 47% de saturação).
- [x] R2 — Space Grotesk carregada, `--font-heading` ligada a ela,
  favicons instalados
- [x] R3 — `logo.tsx` com o símbolo SVG, props `size`/`withWordmark`
  preservadas (3 consumidores). Evidências:
  `.agent/visual/r2-brand-logo-fonte-cores.md` e
  `.agent/visual/r6-favicon-indigo.md`.

  Favicons são **gerados**, não copiados: `scripts/generate-icons.mjs`
  renderiza o símbolo no Chromium via Playwright. A geometria vive em
  dois lugares — ao mudar o símbolo, editar `logo.tsx` **e** rodar o
  script, senão logo e favicon divergem em silêncio.
- [x] R4 — `AVATAR_COLORS` na paleta fria: 5 hues separados, todos
  >= 5:1 com texto branco. `STATUS_META`/`PRIORITY_META` não precisaram
  mudar — já liam os tokens de `globals.css`.
- [x] R5 — varredura dos hex hardcoded → tokens, 17 arquivos.
  Varredura final não encontra hex de marca restante em `src/` (exceto
  `logo.tsx`, onde o hex é a spec do símbolo).
  Evidência: `.agent/visual/r5-tokens-hardcoded.md` — 10 capturas
  autenticadas (`/login`, `/dashboard`, `/tickets`, `/clientes`,
  `/usuarios`) nos dois temas, sem erro de página.

  `Tag` mudou de implementação, não só de valor: concatenava sufixo
  alpha no hex (`${color}18`), incompatível com `var(--token)`. Passou
  a `color-mix(in oklab, ...)`. Prop `color` segue opcional,
  call-sites inalterados. **Refactor-only, sem teste novo** (projeto
  sem runner).

  Mantidos de propósito: `rgba(0,0,0,...)` de scrim, `#fff` sobre botão
  primário, trama decorativa do `system-grid`, e `rgba(99,102,241,0.14)`
  em `perfil`/`user-grid`, que já é exatamente o indigo novo.

- [x] Ajuste pós-entrega — diff de descrição em `ticket-activity.tsx`
  saiu de `font-mono` 12px para a sans da interface a 13px. Descrição
  é prosa, não código; o monospace destoava do painel. Evidência:
  `.agent/visual/r7-fonte-diff-descricao.md`. Os `font-mono` restantes
  (IDs em `ticket-table.tsx`, short codes em `system-grid.tsx`) são
  corretos e ficaram.

- [x] Fix — texto longo sem espaços cortava no painel de detalhe.
  Nenhum ponto que renderiza texto do usuário tinha regra de quebra: a
  busca por `break-words`/`wrap-anywhere`/`overflowWrap` no codebase
  não retornava nada. Adicionado `wrap-anywhere` em 7 pontos
  (`ticket-activity`, `ticket-detail`, `timeline`) + `whitespace-pre-wrap`
  na descrição e no corpo da nota, que preserva quebras digitadas.
  Usado `wrap-anywhere` e não `break-words` porque dentro de flex só o
  `anywhere` afeta o tamanho intrínseco.
  Evidência: `.agent/visual/r8-quebra-texto-longo.md` — bug reproduzido
  com nota de 144 chars e overflow medido via `scrollWidth`.

- [x] 2026-07-19 — Criação de usuários (ADMIN) + troca de senha revoga sessão:
  - `pnpm api:sync` — spec ressincronizada. Mudança de contrato:
    `ChangePasswordRequest` perdeu `refreshToken` (o backend agora
    identifica o usuário pela sessão). A tela já não o enviava, então
    não quebrou.

- [x] 2026-07-19 — Criação de usuário pelo admin + troca de senha
  revoga sessão:
  - `src/components/users/user-form.tsx` (novo) — `UserCreateDialog`
    via `useRegister` (POST /worklog/auth/register). Zod espelha as
    regras do backend (nome 2–100, e-mail válido, senha 8+ com
    maiúscula/minúscula/número). Erros por campo: 409 → e-mail em uso,
    400 → mensagem do backend, 403 → toast e fecha. Usa
    `meta: { silent: true }` para o handler global não empilhar um toast
    genérico sobre o tratamento local.
  - `src/app/(app)/usuarios/page.tsx` — botão "+ Usuário" (atalho `U`),
    `MobileFab`, dialog. A página inteira já era admin-only.
  - `src/app/(app)/perfil/page.tsx` — troca de senha agora desloga e
    volta ao login, porque o backend revoga TODAS as sessões.
    422 → erro no campo "senha atual"; 400 → erro no campo "nova senha".
  - **Dois bugs próprios pegos na verificação**, ambos só visíveis
    porque o teste afirmava a *mensagem* e não só o redirect:
    `window.location.href` destruía o toast (trocado por
    `router.replace`), e `qc.clear()` fazia o guard de `(app)/layout`
    refazer `/users/me` com sessão revogada, disparando o `forceLogout`
    do interceptor.
  - Evidência: `.agent/visual/r9-criar-usuario-e-troca-senha.md` —
    9 checks de ponta a ponta, todos passando. O teste não toca na senha
    do admin: cria usuário descartável e troca a senha dele.
  - **TDD-exemption**: UI sem test runner no projeto; verificado por
    script Playwright de ponta a ponta.
  - tsc ✓, lint ✓

- [ ] (aberto) `forceLogout` em `src/lib/api.ts:91` chama `notifySessionExpired()`
  e logo depois `window.location.href` — o reload destrói o toast antes
  de ser visto, então o aviso de sessão expirada provavelmente nunca
  aparece. Descoberto ao depurar a troca de senha. Pré-existente, não
  corrigido aqui.

- [ ] Usuários de teste `qa.teste.*@exemplo.com` criados pelo script de
  verificação seguem no banco de dev. Desativar se o banco for
  compartilhado.

- [ ] `isAdmin` está duplicado em 6 arquivos
  (`usuarios`, `sistemas`, `clientes`, `perfil`, `sidebar`,
  `client-detail`). Candidato a um `useIsAdmin()`.

## Slice R — concluída

R1–R6 entregues. Marca migrada de "Mira + Sky" para indigo com base
neutra fria, Space Grotesk em títulos, logo e favicon novos.

Possíveis próximos passos (não iniciados):

- [ ] Erro de hidratação pré-existente em `/design`: o label
  `tema: {theme}` diverge entre SSR e cliente. Anterior ao rebranding.
- [ ] `nova-branding/BRAND_GUIDE.md` diverge do implementado em três
  pontos já decididos (vermelho adicionado, indigo em `IN_PROGRESS`,
  `AWAITING_DEV` azul). `memory/brand.md` registra tudo.
- [ ] Extrair a geometria do símbolo para um módulo compartilhado entre
  `logo.tsx` e `scripts/generate-icons.mjs` — hoje está duplicada.
- [ ] Revisar contraste em telas de densidade alta com dados reais
  (a tabela de tickets tem muito `text-[11px]`).

Cada fatia: `tsc --noEmit` + `eslint .` + evidência visual em
`.agent/visual/` (bloqueante, `agent-md.toml [visual] required = true`).

## Blocked

<!--
- [ ] <task> — waiting on: <reason or person>
-->
