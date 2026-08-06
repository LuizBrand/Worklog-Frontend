# Atomic Progress Log

Your temporal anchor. Tick atomic tasks as you complete them. Never mark a
task done unless `memory/verify.md` criteria are met.

The `state-enforcement.sh` hook blocks task completion if source files
changed but this file wasn't updated.

## In Progress

### Expansão do cadastro de clientes — branch `feat/client-registration-expansion`

Plano completo: `docs/plans/expansao-cadastro-clientes.md`.
Contrato: `docs/api/CONTRATO-CLIENTES.md` (autoridade máxima).

- [x] 2026-07-29 — **Slice 1 — camada de API e contrato** (verde, 13/13 checks):
  - `openapi/worklog.json` ← `docs/api/openapi.json` + `pnpm api:gen`. A spec nova é
    superset limpo: 9 schemas novos, 3 alterados, zero removidos. Gerou
    `src/api/generated/filiais/filiais.ts` (5 hooks) e `lookupByCnpj`.
  - Confirmado que a inversão 200/401 do `GET /tickets` existe **idêntica nas duas
    specs** — a troca não regride tickets, o cast em `PageTicketSummary` continua valendo.
  - `src/api/clients-contract.ts` (novo) — o `docs/api/client-api.ts` sem
    `CLIENT_ENDPOINTS`/`ADMIN_ONLY`/`buildClientListQuery` (Orval + paramsSerializer já
    são donos de URL e query string) e sem o `ApiExceptionResponse` duplicado.
    Ganhou `matrizDoCliente`, `contatoPrincipal`, `filiaisSemMatriz`.
  - `src/lib/documento.ts` (novo) — checksum CPF/CNPJ incl. alfanumérico 2026,
    formatadores, `looksLikeDocumento`. **49 asserções rodadas** contra CNPJs reais e
    bases alfanuméricas com DV calculado de forma independente.
  - `src/lib/field-errors.ts` (novo) — `branches[0].contatos[1].valor` → path RHF;
    extração de documento de 409; detecção de conflito de nome vs documento.
  - `src/lib/api-errors.ts` — `hasFieldErrors`, `isDisplayableMessage`.
  - `src/api/invalidate.ts` — `invalidateBranches`; chave própria porque o prefix-match
    do React Query **não** faz `['/clients/{id}']` alcançar `['/clients/{id}/branches']`.
  - `src/components/clients/client-form.tsx` — ponte mínima para o create voltar a
    funcionar: toggle `tipo` + documento da matriz com validação de checksum,
    `systemsPublicIds` sem `min(1)`, mapeamento de `fieldErrors` no submit.
    **Substituído no Slice 4** pelo formulário completo (lookup, nomeFantasia,
    endereço, contatos, filiais).
  - Evidência: `.agent/visual/slice1-api-contrato-clientes.md` (5 PNGs, dark + light
    confirmados por asserção de `--wl-bg`, não por olho).
  - `tsc --noEmit` limpo. `eslint` de volta aos **5 warnings pré-existentes** (usei
    `useWatch` em vez de `watch()` para não adicionar um sexto).
  - ⚠️ **Lixo no banco de dev**: 3 clientes `Verificacao Slice1 <timestamp>` criados
    pelo script de verificação. Só há soft delete na API — limpar direto no banco se
    incomodar.

- [x] 2026-08-02 — **Slice 2 — listagem** (verde):
  - `src/components/worklog/tipo-badge.tsx` (novo) — pill PJ (`--primary`) / PF
    (`--status-open`); `dev-chip.tsx` (novo) — chip "Em desenvolvimento". Ambos
    exportados no `index.ts`.
  - `src/components/clients/client-table.tsx` (novo, desktop `md+`) — colunas CLIENTE
    (nome + tipo + documento da matriz) · CONTATO · TICKETS (em andamento /
    solicitados) · CONTRATO (`DevChip`) · RENOVAÇÃO (`—`) · chevron. **É a casa do
    tipo `ClientStats`**, que ganhou `pending`/`inProgress` além de
    `total`/`open`/`critical` — o grid e a página importam de lá.
  - `src/components/clients/client-grid.tsx` — virou a versão mobile (`<md`), com badge
    de tipo, contato principal e documento da matriz. **Morreu o hack
    `(c as { email?: string }).email`.**
  - `src/app/(app)/clientes/page.tsx` — filtros no servidor
    (`filtersParams: { name | documento, status, tipo }`), busca única decidindo por
    `looksLikeDocumento` + `useDebouncedValue(300)`, `FilterSelect` de tipo, contador
    "N clientes cadastrados", `keepPreviousData` para o skeleton não piscar a cada tecla.
  - **Re-slice deliberado:** o clique na linha continua abrindo o modal `?id=`. A rota
    `/clientes/[publicId]` só nasce no Slice 3, e trocar o destino agora deixaria 404
    entre os slices.
  - **Toggle ativar/inativar migrou de `DELETE` para `PATCH { enabled }`** nos dois
    sentidos (assunção 3 do plano; §8 do contrato recomenda um caminho só). Gate ADMIN
    mantido. `useSoftDeleteClient` não é mais chamado por ninguém.
  - Removidos `editId` + `ClientEditFetcher` da página — estado morto, nada chamava
    `setEditId`.
  - **Deviação do mockup registrada:** o contador "N clientes cadastrados" ficou inline
    ao lado do título, não em segunda linha — o header da página é uma barra de 52px
    alinhada com o sidebar (decisão de 2026-05-09).
  - Verificado contra o backend real: `?tipo=PJ`, `?documento=44555666000181` (máscara
    removida, 1 linha) e `?name=Verificacao` capturados na rede; CNPJ alfanumérico
    `12ABC34501DE35` acha o cliente pela filial não-matriz; `formatTelefone` e o
    fallback "primeiro contato" de `contatoPrincipal` exercitados por dado real.
  - Evidência: `.agent/visual/slice2-listagem-clientes.md` (6 PNGs; dark/light por
    asserção de `--wl-bg`; mobile confirma tabela oculta).
  - `tsc --noEmit` limpo. `eslint` nos **5 warnings pré-existentes**, zero novos.
  - ⚠️ O banco de dev tem clientes anteriores à expansão com `documento` null na
    matriz — a coluna mostra `—`. É filial de legado, previsto no contrato, não bug.
- [x] 2026-08-02 — fix — `state-enforcement.sh` travado por `.idea/`:
  - O hook conta **untracked** como "fonte modificada". Como `.idea/` não estava no
    `.gitignore` e nunca seria commitado, ele bloqueava todo Stop com "6 source files
    modified" mesmo com o `progress.md` já commitado — sem saída possível a não ser
    commitar lixo de IDE.
  - `.gitignore` — adicionados `.idea/` e `.vscode/`.
  - `.claude/hooks/state-enforcement.sh` — a lista de exclusão passou a cobrir
    `.idea/`, `.vscode/`, `.fleet/`, `.zed/` e sufixos `.swp`/`.swo`/`~`, para que
    droppings de editor não voltem a travar o hook em outra máquina.
  - A força do guard não mudou: mudança de fonte real sem `progress.md` continua
    bloqueando (verificado — com o `.gitignore` alterado e não commitado, o hook
    acusou "1 source file").

- [x] 2026-08-04 — **Slice 3 — detalhe em `/clientes/[publicId]`** (verde, verificado
      contra o backend real):
  - `src/app/(app)/clientes/[publicId]/page.tsx` (novo) — Client Component com
    `use(params)`; no Next 16 `params` é **Promise** (confirmado em
    `node_modules/next/dist/docs/.../dynamic-routes.md`). Dono do estado de edição,
    do toggle `PATCH { enabled }` (gate ADMIN) e do 404 (`EmptyState` + voltar).
  - `client-detail-header.tsx` (novo) — `‹ Voltar para clientes`, nome, `TipoBadge`,
    `StatusPill`, documento da matriz e o botão Desativar/Reativar (admin-only).
  - `client-data-card.tsx` (novo) — "DADOS DA EMPRESA" (PJ) / "DADOS PESSOAIS" (PF).
    PF não mostra IE, regime nem o rodapé de filiais (§9 do contrato). Rodapé
    `Ver filiais (N)` / `+ Filiais` com N = `filiaisSemMatriz`, **desabilitado até o
    Slice 5** — sem handler, o botão fica disabled em vez de virar clique morto.
    **É a casa de `formatEndereco`** (mesmo padrão de `contatoLabel` em
    `client-table.tsx`), que o Slice 5 vai reusar na lista de filiais.
  - `client-systems-card.tsx`, `client-contract-placeholder.tsx` (novos) — sistemas
    em chips; contrato é placeholder puro, zero chamada de API.
  - `client-tickets-card.tsx` (novo) — `clientId` é filtro **de servidor**; as abas
    (Em andamento / Solicitados / Todos) separam status **em memória**, porque o
    endpoint aceita um `status` só e "em andamento" são dois
    (`AWAITING_CUSTOMER` + `AWAITING_DEVELOPMENT`). Clique → `/tickets?id={publicId}`.
  - `src/components/worklog/confirm-dialog.tsx` (novo, exportado no `index.ts`) —
    extraído antes de escrever a terceira cópia. `clientes/page.tsx` passou a usá-lo.
  - `clientes/page.tsx` — clique de linha/card agora é `router.push('/clientes/{id}')`.
    Saíram `selectedId`, `closeDetail`, o `setParam`/`useSearchParams` (só existiam
    para o `?id=`) e o handler de Escape do modal.
  - **`client-detail.tsx` deletado** (o modal aposentado), depois de `grep` confirmar
    zero referências.
  - **Desvio do mockup registrado:** o card de contrato não tem "+ Novo contrato"
    nem "+ Vincular serviço" — botão que não faz nada é pior que ausência declarada;
    o card diz "Módulo de contratos em desenvolvimento".
  - **Campo a mais do que o plano lista:** "Nome fantasia" aparece no card de PJ
    quando não é null. Existe na API, o lookup do Slice 4 preenche, e sem isso o dado
    ficaria invisível na UI.
  - 🐞 **Bug achado pela verificação runtime** (o `tsc` não pegava, o cast silenciava):
    `client-tickets-card.tsx` fazia `t.status as TicketStatus`. A API fala
    `PENDING`/`AWAITING_CUSTOMER`/`COMPLETED`; `STATUS_META` é indexado pelo
    vocabulário da UI (`OPEN`/`IN_PROGRESS`/`RESOLVED`). Dava
    `Cannot read properties of undefined (reading 'background')` no `StatusChip` e
    **derrubava a página inteira**. Corrigido com `apiToUiStatus` de
    `src/lib/ticket-status.ts` — o mapa que o resto do app já usa.
  - **Toggle `PATCH { enabled }` fechado com clique real** — a lacuna que vinha do
    Slice 2. `{"enabled":false}` e `{"enabled":true}` capturados na rede, header
    indo de ATIVO/Desativar para INATIVO/Reativar e voltando (estado do banco
    restaurado).
  - `tsc --noEmit` limpo. `eslint` nos **5 warnings pré-existentes**, zero novos.
  - Evidência: `.agent/visual/slice3-detalhe-cliente.md` (8 PNGs; PJ com e sem filial,
    PF, 404, confirmação do toggle, mobile 390px sem scroll horizontal; dark/light por
    asserção de `--wl-bg`).
  - ⚠️ **Não verificado**: lista de tickets com dado real — nenhum cliente do banco de
    dev tem ticket, as abas foram exercitadas vazias.
- [x] 2026-08-04 — **Runner de teste (vitest)** — pergunta em aberto 2 do handoff,
      fechada pelo usuário antes do Slice 4:
  - **Uma dependência só** (`vitest`), ambiente node, `src/**/*.test.ts`. O guia do
    Next instala 6 pacotes (`jsdom`, `@testing-library/*`, `@vitejs/plugin-react`)
    para testar componente — aqui isso duplicaria a verificação visual, que é o que
    já cobre UI. Escopo e porquê registrados em `memory/verify.md`.
  - `vitest.config.mts` (`.mts`, não `.ts`: com `.ts` o loader nativo do Vite avisa
    sobre ESM em arquivo tratado como CJS). Alias `@` resolvido à mão, sem
    `vite-tsconfig-paths`.
  - `package.json` — scripts `test` (`vitest run`) e `test:watch`.
  - `agent-md.toml [verify] test = "pnpm test"` — o Stop hook e o `pre-commit`
    passam a rodar a suíte automaticamente.
  - **36 testes, 4 arquivos, ~0,5 s**: `ticket-status.test.ts` (regressão do bug do
    Slice 3), `documento.test.ts` (checksums com CNPJ alfanumérico, formatadores,
    `looksLikeDocumento`), `field-errors.test.ts`, `endereco.test.ts`.
  - `formatEndereco` saiu de `client-data-card.tsx` para `src/lib/endereco.ts` —
    deixá-la num `.tsx` obrigaria a puxar React para um teste de string. O
    argumento de precedência (`contatoLabel` em `client-table.tsx`) perde para
    testabilidade.
  - 🐞 **Achado ao escrever o teste:** `getApiErrorBody`/`getApiErrorStatus` usam
    `err instanceof AxiosError`. Objeto com o mesmo formato é ignorado **em
    silêncio** — meu primeiro mock caiu nisso. Tem teste explícito registrando a
    armadilha para o próximo mock.

- [x] 2026-08-04 — **Slice 4 — criar/editar cliente** (verde, verificado contra o
      backend real):
  - **Primeiro slice feito em TDD de verdade**: `client-schema.test.ts` e
    `client-save.test.ts` escritos antes, vermelho confirmado, depois a
    implementação. 39 testes novos (75 no total).
  - `client-schema.ts` (novo) — zod v3 com as regras que o backend cobra e o `tsc`
    não vê: checksum por tipo, **exatamente uma** matriz, documento não repetido no
    payload, ≤1 contato principal por filial, limites de `MAX_LENGTH`, PF sem filial.
    Mais os construtores de payload (`toClientRequest`, `toBranchRequest`).
  - `client-save.ts` (novo) — carga (`clientToFormValues`) e diff
    (`toClientUpdateRequest`, `toBranchUpdateRequest`, `filiaisNovas`). `contatos` e
    `address` vão **completos** quando qualquer parte muda (§9.3); `isMatriz` nunca
    sai do PATCH nem do POST.
  - `client-form-shell.tsx`, `client-form-fields.tsx`, `branch-fields.tsx`,
    `client-create-dialog.tsx`, `client-edit-dialog.tsx` (novos).
    **`client-form.tsx` deletado.**
  - Salvar na edição é sequência não-atômica (cliente → matriz → filiais novas).
    `SaveParcialError` carrega o que já passou, e o toast de erro diz exatamente
    isso. O rodapé do formulário avisa que não é transação.
  - **Duas decisões de escopo:** contatos e endereço ficam em "Mais detalhes"
    (compacto por padrão, como o mockup); filiais adicionais **não** entram no
    formulário — `filiaisNovas` existe e tem teste, mas a UI que a alimenta é do
    Slice 5, para o erro parcial não virar algo impossível de explicar.
  - 🐞 **Dois bugs achados pela verificação runtime:**
    1. **Consulta duplicada à Receita.** O clique na lupa dispara o `blur` do input
       antes do clique, então o mesmo CNPJ ia 2× a um endpoint de **5 consultas/min
       por IP compartilhadas pela equipe**. Dedupe por documento consultado
       (`useRef`), liberado no erro para permitir retry.
    2. **Input do contato com 26px.** `w-full` do `inputCls` vence `w-28` na mesma
       string de classes — mesma especificidade, ordem do CSS decide. Cada controle
       ganhou wrapper com largura própria; a linha empilha abaixo de `sm`. Medido
       antes (235/26/235) e depois (112/231/128 desktop, 274 empilhado no mobile).
  - Evidência: `.agent/visual/slice4-form-cliente.md` (5 PNGs; payloads de POST e da
    sequência de PATCH capturados na rede; lookup real devolveu "BANCO DO BRASIL SA").
  - `tsc` limpo, `eslint` nos 5 warnings pré-existentes, **75 testes passando**.
  - ⚠️ **Lixo no banco de dev**: 2 clientes de teste — `Slice4 Teste …`
    (38092010001068) e um nomeado `BANCO DO BRASIL SA` (89231429000101), que ficou
    com esse nome porque o lookup stubado preencheu a razão social por cima. Só há
    soft delete na API.
  - ⚠️ **Não verificado**: erro parcial da sequência de salvamento (exigiria forçar
    falha na 2ª chamada) e troca PJ→PF com 2+ filiais ativas (o banco não tem o caso).

**TDD-check exemptions (slice 4 — formulário):** `client-form-shell.tsx`,
`client-form-fields.tsx`, `branch-fields.tsx`, `client-create-dialog.tsx` e
`client-edit-dialog.tsx` são UI. Toda a lógica que valia teste saiu para
`client-schema.ts` e `client-save.ts`, que **têm** teste e foram escritos primeiro.
- [x] 2026-08-04 — **Slice 5 — filiais** (verde, verificado contra o backend real):
  - `branches-dialog.tsx` (novo) — lista com matriz primeiro e badge MATRIZ, filial
    inativa esmaecida, ações por filial gatilhadas pelos helpers de
    `clients-contract.ts` (`canPromoteToMatriz`, `canDeactivateBranch`,
    `canActivateBranch`, `canCreateBranch`) + gate `isAdmin` para ativar/inativar.
  - **Reuso do Slice 4 em vez de formulário novo:** os rascunhos entram no mesmo
    array `branches` do `clientFormSchema`, sem `publicId` — que é exatamente como
    `filiaisNovas` os reconhece. De brinde vem a validação de documento repetido
    contra as filiais que já existem.
  - `CriarFilialError` carrega o que já foi criado quando a sequência de POSTs falha
    no meio; o erro fica **inline no rascunho que falhou** (o POST de filial devolve
    422 com mensagem solta, sem `fieldErrors`, então `setError` não serve) e os
    rascunhos não salvos permanecem no formulário.
  - `branch-edit-dialog.tsx` (novo) — um `PATCH` só. Carrega o cliente inteiro no
    formulário mesmo editando uma filial: é o que mantém "exatamente uma matriz" e
    "documento não repetido" válidos enquanto só um índice é renderizado. Sem
    "Regime tributário" (assunção 6 do plano).
  - `[publicId]/page.tsx` — dona das mutations de promover (`PATCH { isMatriz: true }`)
    e ativar/inativar (endpoints próprios), com `ConfirmDialog` em cada uma. Promover
    invalida filiais **e** cliente, porque duas linhas mudam (§9.4).
  - `client-data-card.tsx` — "Ver filiais (N)" deixou de ser botão desabilitado.
  - Evidência: `.agent/visual/slice5-filiais.md` (7 PNGs; POST sem `isMatriz`, PATCH
    de promoção, `/deactivate`, `/activate` e PATCH de edição capturados na rede).
  - `tsc` limpo, `eslint` nos 5 warnings pré-existentes, 75 testes passando.
  - ⚠️ **Estado do banco de dev**: `Verificacao Slice1 75840302` (c56f3ce3) ficou com
    várias filiais `Filial Verificacao` e **a matriz trocada** — a restauração do
    script promoveu a primeira filial da lista, não a matriz original.
    `Verificacao Slice1 75756293` (d0fd195b) ganhou uma filial de uma execução
    interrompida.
  - ⚠️ **Não verificado**: erro parcial no cadastro de várias filiais de uma vez.

**TDD-check exemptions (slice 5 — filiais):** `branches-dialog.tsx` e
`branch-edit-dialog.tsx` são UI. A lógica que valia teste (`filiaisNovas`,
`toBranchUpdateRequest`, regras do schema) já está coberta em `client-save.test.ts` e
`client-schema.test.ts`, escritos no Slice 4.

- [x] 2026-08-04 — **Listagem paginada** (contrato atualizado no mesmo dia; sai dos
      deferidos):
  - `openapi/worklog.json` ← `docs/api/openapi.json` + `pnpm api:gen`. O diff é só o
    `GET /clients`: ganhou `pageable` (obrigatório), `page` e `size`. Zero schema novo.
  - **A paginação é opt-in e muda o formato da resposta** (§6): sem `page`/`size` volta
    `ClientResponse[]`; com qualquer um dos dois volta `Page<ClientResponse>`. As
    outras 4 telas que consultam `/clients` receberam `pageable: {}` e continuam no
    array cru — nenhuma foi refatorada.
  - **`pageable` do tipo gerado não vira chave na URL.** O `paramsSerializer` de
    `src/lib/api.ts` achata objetos aninhados, então
    `pageable: { page, size, sort: ['name,asc'] }` sai como
    `?page=0&size=12&sort=name,asc` — soltos, como o backend lê. Verificado por
    asserção sobre as URLs capturadas.
  - `clients-contract.ts` — `Page<T>`, `page`/`size`/`sort` em `ClientFiltersParams`,
    `CLIENT_PAGE_SIZE` (12) e `CLIENT_SORT_PADRAO` (`name,asc`).
  - `src/lib/pagination.ts` + **9 testes** — `paginasVisiveis` (janela com reticências)
    validada por invariantes em varredura, não por casos soltos.
  - `components/worklog/pagination.tsx` — barra `‹ 1 2 ›` + "1–12 de 15", como o mockup.
  - `client-table.tsx` — tabela dentro de card com borda e cantos arredondados, linhas
    mais altas: o formato do mockup.
  - **Reset de página no setter do filtro, não em `useEffect`** — a regra
    `react-hooks/set-state-in-effect` barra `setState` síncrono em efeito, e com razão:
    causaria render em cascata.
  - `dev-chip.tsx` — de `--wl-text-dim` para `--wl-text-muted`: dentro do card da
    tabela o chip ficava ilegível.
  - Evidência: `.agent/visual/listagem-paginada.md` (4 PNGs; query string, envelope e
    contagem de linhas capturados na rede).
  - ⚠️ **Não verificado**: ordenação por outra coluna (a UI só usa o padrão) e a
    armadilha de `sort` sem `page`, já que o código sempre manda `page`.
  - **Header e altura de linha ajustados a pedido do usuário** (mesmo dia):
    - O header da listagem virou o bloco de duas linhas do mockup ("Clientes" 22px
      com o contador abaixo). **Isso reverte a decisão de 2026-05-09** de alinhar
      todo header à barra de 52px do sidebar — foi pedido explicitamente. As outras
      telas continuam com a barra de 52px.
    - Linhas da tabela de `py-4` para `py-3`: 76,5px → **68,5px**, medido.
    - `CLIENT_PAGE_SIZE` de 12 para **11**, a pedido. É escolha da UI, não o
      padrão do backend (12) — o comentário da constante diz isso.
    - ⚠️ **Medido e não corrigido**: com 11 linhas a barra de paginação fica
      **abaixo da dobra** em viewport de 900px (tabela termina em y=877, a seta
      de próxima página em y=926, o texto "1–11 de 15" por volta de y=950). A
      lista parece completa e o controle só aparece rolando. Faltam ~50px:
      ou linha em `py-2.5` (~64px), ou 10 por página. Ambas são escolha do
      usuário, então ficou aguardando decisão.
    - Evidência: `.agent/visual/header-listagem-mockup.md` (3 PNGs; posição do
      contador e alinhamento da busca verificados por `boundingBox`).

- [x] 2026-08-04 — **Formulário de cliente redesenhado para o mockup** (criar e editar):
  - `client-form-fields.tsx` reescrito: passou a ser o formulário inteiro, na ordem do
    mockup (tipo → identificação → contato → endereço → sistemas → filiais), **dois
    campos por linha**. A caixa "MATRIZ" separada sumiu — os campos da matriz *são* os
    campos do formulário. `BranchFields` continua existindo, mas só para os dialogs de
    filial.
  - `components/worklog/multi-select.tsx` (novo) — campo que abre a lista de opções,
    no lugar da grade de checkboxes. Portal, como o `ClientCombobox`, para a lista não
    ser cortada pelo `overflow` do dialog; e `Escape` fecha só a lista, não o dialog.
  - `client-form-shell.tsx` — header com ícone, título e subtítulo; **sem as linhas
    divisórias** que eu tinha posto (o mockup separa por espaço); `IconInput` com ícone
    dentro do campo; label em caixa normal; dialog de `max-w-2xl` para **540px**.
  - **Filiais entram no create** (como no mockup): lá tudo vai num `POST` atômico. Na
    edição continuam no dialog de filiais, onde cada uma é uma chamada própria.
  - 🐞 **Risco de perda de dado, coberto por teste ANTES da UI:** "Contato" e "Telefone"
    são dois slots fixos sobre uma lista livre, e `contatos` no PATCH **substitui a
    lista inteira**. `client-contatos.ts` + **7 testes** garantem que os contatos extras
    continuam no array depois dos dois slots — sem isso, o terceiro contato de uma
    filial seria apagado no primeiro salvamento.
  - **Desvio registrado:** o campo compacto "Endereço" grava em `logradouro`. O mockup
    tem uma linha só; a API tem endereço estruturado. Quem quiser os campos separados
    abre "Mais detalhes". Preenchendo só a linha, cidade e UF ficam dentro de
    `logradouro`.
  - Evidência: `.agent/visual/form-cliente-mockup.md` (7 PNGs; cada item pedido
    verificado por medição — 0 checkboxes, dialog de 540px, campos na mesma linha por
    diferença de topo < 4px, `padding-left: 36px` dos ícones, bordas 0px no card).
  - `tsc` limpo, `eslint` nos 5 warnings pré-existentes, **91 testes**.
  - **Ajustes seguintes, no mesmo dia:**
    - Toggle PJ/PF virou um `radiogroup` de bloco único com pastilha que desliza
      (`transform` + `0.2s`, desligada por `motion-reduce`).
    - **Endereço saiu de "Mais detalhes"**: rua, número, cidade e UF são campos
      próprios no corpo do formulário. Isso **corrige o desvio anterior** de gravar o
      endereço inteiro dentro de `logradouro`. Em "Mais detalhes" sobraram CEP,
      bairro, complemento e inscrição municipal.
    - Card de filial completo (nome, CNPJ, IE, e-mail, telefone, rua, número, cidade,
      UF), como o print do usuário.
    - **Não implementados, de propósito:** lupa de Receita no CNPJ da filial (mexe em
      quota e não foi pedido) e "Regime tributário" por filial (não existe na API —
      seria campo que não salva).
    - Evidência: `.agent/visual/form-filial-toggle-endereco.md` (5 PNGs; deslize da
      pastilha medido por `transform`, campos por `aria-label`, payload conferido).
    - **Campos sem preenchimento próprio, em todo o projeto** (pedido do usuário): o
      campo herda o fundo do container e o contraste vem da borda — `--wl-border` em
      repouso, `--primary` no foco. A borda saiu do `style` inline para classe, senão
      o `focus:` nunca venceria (inline ganha de classe). `inputStyle` **não existe
      mais em lugar nenhum**: tickets, usuários, sistemas, perfil e login tinham
      cópias locais, todas substituídas.
      - `<select>` é exceção: mantém fundo explícito, senão a lista de opções nativa
        fica ilegível em parte dos navegadores.
      - 🐞 A primeira versão do `selectCls` era `` `${inputCls} bg-…` `` e saiu
        transparente — **a mesma armadilha de classes concorrentes** que colapsou o
        campo de contato para 26px (já no `gotchas.md`). Reescrito por extenso.
      - `eslint` caiu de 5 para **4 warnings**: um dos antigos era um `selectCls`
        morto no `ticket-form.tsx`.
      - Evidência: `.agent/visual/campos-fundo-borda.md` (3 PNGs; fundo e borda por
        `getComputedStyle`, em dark e light, nos quatro formulários).

- [x] 2026-08-06 — **Três correções de alinhamento no formulário de cliente** (pedidas
      pelo usuário na sessão anterior, especificadas no `handoff-2026-08-05.md` §5.1).
      Só `client-form-fields.tsx`:
  - **Número e UF da matriz alinhados.** As duas linhas usavam templates diferentes
    (`grid-cols-[1fr_100px]` no endereço, `[1fr_80px]` na cidade), o que punha 20px de
    diferença na borda **esquerda** — terminavam alinhadas, e era isso que enganava.
    Agora as duas são `[1fr_110px]`: `numero.x === uf.x === 859`, ambas 110px.
  - **UF da filial desceu para a linha da Cidade.** Era `[1fr_80px_80px]` (rua ‖ nº ‖ UF)
    com a cidade sozinha embaixo; virou duas linhas de `[1fr_80px]`.
  - **Lixeira da filial vermelha e fora do bloco.** Saiu de dentro do card (onde dividia
    a linha com "Nome da filial", em `--wl-text-muted`) para fora da borda, em
    `--wl-danger`. O card virou `flex` com o botão irmão; "Nome da filial" ficou em
    largura total (432px). `mt-3` no botão compensa o `p-3` do card — dy final de 1px.
  - Verificado por medição, não por olho: `numero.x === uf.x` nos dois temas, dy=0 nas
    linhas da filial, `lixeira.x=937` contra o card terminando em `929`, e a cor do
    botão igual a `--wl-danger` resolvido em runtime (dark `rgb(226,86,78)`, light
    `rgb(214,69,61)`).
  - Evidência: `.agent/visual/form-ajustes-alinhamento-lixeira.md` (5 PNGs).
  - `tsc` limpo, `eslint` nos 4 warnings de baseline, 91 testes passando.
  - ⚠️ Achado de passagem, **não corrigido**: `DialogCard` não tem `role="dialog"` — o
    script de verificação teve que usar seletores de nível de página. Lacuna de
    acessibilidade pré-existente, fora do escopo do ajuste.

- [x] 2026-08-06 — **`CLIENT_PAGE_SIZE` de 11 para 10** — fecha o item que estava
      aguardando decisão desde 2026-08-04. O usuário escolheu tirar uma linha em vez de
      encolher a linha para `py-2.5`; a altura de 68,5px fica como está.
  - Medido **sem rolar** (`scrollY=0` asseverado): a seta "Próxima página" termina em
    **857** e a contagem "1–10 de 20" em **881**, ambas dentro dos 900px da dobra. Com
    11 linhas a seta ficava em 926 e o texto por volta de 950.
  - Rede: `/clients?page=0&size=10&sort=name%2Casc`; nenhuma chave `pageable` na URL.
  - Evidência: `.agent/visual/paginacao-10-por-pagina.md` (2 PNGs, dark e light).
  - Mudança de constante, sem comportamento novo a testar — os 9 testes de
    `paginasVisiveis` não dependem do tamanho de página. O `tdd-check.sh` avisou por ser
    export em arquivo sem teste vizinho; registrado aqui como refactor-only.

- [x] 2026-08-06 — **Lupa da Receita no CNPJ da filial** — sai das perguntas em aberto
      do handoff (o print do usuário mostrava, e a sessão anterior não implementou por
      causa da quota compartilhada). Pedido explicitamente agora.
  - O lookup do `client-form-fields.tsx` era exclusivo da matriz. Generalizado por
    índice: a dedupe virou `Map<index, documento>`, a mutation carrega o índice e o
    spinner gira só no campo clicado (`alvo`). **Não é uma terceira cópia da lógica** —
    `branch-fields.tsx` (dialogs de filial) já tinha a sua com `preencheCliente`.
  - **A filial não escreve campos do cliente.** Razão social, nome fantasia e regime são
    do cliente; consultar uma filial reescreveria o cabeçalho do cadastro. Da filial vêm
    endereço e contatos.
  - **Apelido não é preenchido de propósito:** o contrato diz que `nomeFantasia` só vem
    quando o CNPJ consultado é matriz, então usá-lo como apelido de filial seria
    enganoso. Cheguei a escrever e removi.
  - `getValues` entrou como prop (e nos dois dialogs) em vez de `useWatch` por filial:
    assinar cada documento re-renderizaria o formulário a cada tecla digitada em
    qualquer CNPJ.
  - 🐞 `react-hooks/static-components` barrou `LupaReceita`/`AvisoSituacao` declarados
    dentro do render — componente criado em render perde estado a cada ciclo. Viraram
    funções que devolvem markup (`lupaReceita(i)`, `avisoSituacao(i)`).
  - O aviso de situação cadastral deixou de ser global e ficou preso à filial
    consultada (`{ index, texto }`).
  - Verificado com a rota **stubada** (quota de 5/min compartilhada): uma única chamada
    apesar de blur + clique, filial preenchida, campos do cliente intactos, matriz não
    sobrescreve a filial, reconsulta do mesmo CNPJ não gasta chamada.
  - Evidência: `.agent/visual/lupa-cnpj-filial.md` (2 PNGs).
  - `tsc` limpo, `eslint` nos 4 warnings de baseline, 91 testes.
  - ⚠️ **Não verificado**: consulta real à Receita a partir do campo da filial e erro
    429/rede na filial (deveria liberar a reconsulta daquele índice).

- [x] 2026-08-06 — **`<select>` nativo trocado pelo select do app** (o usuário apontou
      que as opções de regime tributário abriam fora do padrão):
  - A lista de opções de um `<select>` nativo é desenhada pelo sistema operacional, não
    pela página — **nenhum CSS alcança**. O `selectCls` controlava só a caixa fechada.
  - Restavam **dois**: regime tributário (`client-form-fields.tsx`) e tipo de contato da
    filial (`branch-fields.tsx`). Ambos trocados por `FilterSelect`.
  - **`FilterSelect` ganhou `variant="field"`** em vez de nascer um terceiro dropdown no
    projeto (já havia `FilterSelect` e `MultiSelect`). Nesse variante o gatilho herda o
    fundo do container e marca o foco na borda, como os `input`.
  - **Escape passou a fechar só a lista**, com `stopPropagation` — sem isso a tecla
    chegava ao `DialogCard` e fechava o formulário inteiro. Vale para todos os usos do
    componente, não só os novos.
  - `selectCls` **não existe mais**: ninguém o usava depois da troca.
  - Como o campo virou controlado, entrou `useWatch` para `regimeTributario` e para a
    lista `contatos` (uma assinatura só — hook não pode ser chamado dentro do `map`).
  - 🐞 **Achado pela medição:** a primeira versão usava `h-[38px]` e ficava meio pixel
    mais alta que o input ao lado (38 vs 37,5). Trocado por `py-2`, o mesmo do
    `inputCls`.
  - Verificado: **zero `<select>` nativo** em `/clientes`, `/tickets`, `/sistemas`,
    `/usuarios`, `/perfil` e no formulário de filial; fundo e borda da lista iguais a
    `--wl-surface`/`--wl-border` nos dois temas; Escape fecha a lista e não o dialog.
  - Evidência: `.agent/visual/select-fora-do-padrao.md` (3 PNGs).
  - `tsc` limpo, `eslint` nos 4 warnings de baseline, 91 testes.
  - ⚠️ **Não resolvido:** navegação por teclado dentro da lista (setas). O `<select>`
    nativo tinha, o substituto não — e o `FilterSelect` já não tinha nas barras de
    filtro. A troca não regrediu, mas o gap agora atinge formulário.

- [x] 2026-08-06 — **Detalhe do cliente: coluna da direita alinhada e sistemas no
      formato do mockup** (o usuário apontou que o bloco não fechava embaixo e que o
      card de sistemas estava "simples demais"):
  - Referência: `mockups/Client-expansion/Tela Detalhes cliente - Dark Mode.png`, onde
    "Serviços contratados" são **linhas** de largura cheia com marcador e fundo tintado.
  - `client-systems-card.tsx` ganhou `flex-1` e absorve a altura que sobra na coluna: a
    base da direita passou a encontrar a base do card de dados (**593 nos dois temas**).
  - Chips viraram linhas: marcador, `Sistema · <nome>` em `--primary`, estado na segunda
    linha. Sistema inativo em tom neutro. Contador no cabeçalho (`1`, ou `2/3` com
    inativo).
  - Rodapé **"Editar sistemas"** preso com `mt-auto`, no mesmo lugar onde o card de dados
    põe "Ver filiais" — é o que fecha a altura ganha ao esticar. Abre o dialog de edição
    que já existia; não é botão morto.
  - Linha reduzida de 50px para **44px** a pedido.
  - 🐞 **Achado pela medição:** cortar só o padding (`py-2.5` → `py-1.5`) tirou **2px**,
    não 8 — a altura vinha do `line-height` padrão (1,5) dos dois parágrafos, não do
    respiro da caixa. Resolvido com `leading-tight`.
  - **Decisão registrada:** o mockup mostra "Ativo desde 14 Mar 2024" nos serviços, mas
    `ClientSystemResponse` só traz `publicId`, `name` e `enabled`. A segunda linha diz
    só o estado — data de vigência seria dado inventado.
  - Evidência: `.agent/visual/detalhe-sistemas.md` (3 PNGs; mobile 390px sem scroll
    horizontal).
  - `tsc` limpo, `eslint` nos 4 warnings de baseline, 91 testes.
  - ⚠️ **Não verificado**: card com vários sistemas e com sistema inativo — o banco de
    dev não tem o caso. O caminho do inativo (tom neutro, contador `n/total`) só passou
    por inspeção.

- [x] 2026-08-06 — **Muitos sistemas: linhas em duas colunas** (o usuário viu um cliente
      com 6 sistemas e o layout esticou):
  - **O `flex-1` do ajuste anterior resolveu 1 sistema e inverteu o defeito com 6:** a
    coluna da direita passou a mandar na altura, o card de dados esticou junto e
    "+ Filiais" ficou boiando no meio, com ~200px de vazio embaixo.
  - **A partir de 4 sistemas as linhas se dividem em duas colunas** (`sm:grid-cols-2`).
    Crescer para o lado usa a largura ociosa do card; crescer para baixo esticava a
    página. O card caiu de ~660px para **288px** com 6 sistemas. Abaixo de `sm` volta a
    empilhar.
  - **Rodapé preso na base nos dois cards:** `client-data-card.tsx` trocou `mt-4` por
    `mt-auto` no bloco de filiais, espelhando o card de sistemas. Quando um lado estica,
    o rodapé vai para a base em vez de ficar no meio.
  - `title` no nome do sistema — em duas colunas a linha é estreita e o nome trunca.
  - Medido: bases em **629/629** com 6 sistemas e **577/577** com 1; 6 linhas em 2
    colunas (x=882 e 1148) e 3 fileiras; rodapés dos dois cards terminando em 608 de 629;
    mobile 390px empilhando em uma coluna, sem scroll horizontal.
  - Evidência: `.agent/visual/sistemas-muitos.md` (3 PNGs).
  - `tsc` limpo, `eslint` nos 4 warnings de baseline, 91 testes.
  - ⚠️ **Limite conhecido:** duas colunas adiam o problema, não o eliminam — com ~20
    sistemas a coluna volta a crescer (10 fileiras). O próximo passo seria travar a lista
    numa altura máxima com rolagem interna; descartado agora porque esconderia parte da
    lista sem necessidade.

**TDD-check exemption:** `filter-select.tsx`, `client-form-fields.tsx`,
`client-systems-card.tsx` e `client-data-card.tsx` são UI. A lógica
testável do módulo
(schema, diff de salvamento, contatos) já tem teste; o que mudou aqui é fiação de
formulário, verificada por runtime com a rota stubada.

**Deferidos** (do plano §5): ~~paginação client-side da listagem~~ (feita, server-side); documento no
`ClientCombobox`; gap do backend de nome duplicado no PATCH.

**TDD-check exemptions (slice 2 — listagem):** `tipo-badge.tsx`, `dev-chip.tsx` e
`client-table.tsx` são UI pura sem lógica de negócio (a lógica de verdade —
`contatoPrincipal`, `matrizDoCliente`, `looksLikeDocumento`, `formatDocumento` — vive em
`clients-contract.ts` e `documento.ts`, do Slice 1). Sem test runner configurado;
validados por tsc + eslint + verificação runtime com asserção de query string.

**TDD-check exemptions (slice 3 — detalhe):** `client-detail-header.tsx`,
`client-data-card.tsx`, `client-systems-card.tsx`, `client-contract-placeholder.tsx`,
`client-tickets-card.tsx` e `confirm-dialog.tsx` são UI pura. A única função com lógica
é `formatEndereco` (montagem de string a partir de `AddressResponse`) — candidata a
teste unitário assim que o runner do Slice 4 existir (pergunta em aberto 2 do handoff).

**Nota sobre TDD:** o hook `tdd-check.sh` avisou em cada arquivo novo deste slice. O
projeto não tem runner de teste (`agent-md.toml` deixa `test` intencionalmente vazio).
`documento.ts` — o único código de lógica pura e de risco real — foi verificado por
script executado (49 asserções). Vale propor um runner (`vitest`) antes do Slice 4,
onde entram as regras de validação do formulário.

---

- [x] 2026-07-22 — fix — Bugs de navegação: logo/nome do sidebar sem link + sem botão "criar ticket" na tela inicial (desktop):
  - Branch: `fix/sidebar-logo-link-e-botao-criar-ticket-home`.
  - `src/components/shell/sidebar.tsx` — bloco da logo (linhas ~48–51) envolvido em
    `<Link href="/dashboard">` (ambos os casos, `collapsed` e expandido); antes não
    tinha `onClick` nem `Link`.
  - `src/app/(app)/dashboard/page.tsx` — import `Link` de `next/link`; `StatsBar` agora
    dentro de `<div className="flex flex-wrap items-center justify-between gap-3">`
    junto de um novo botão `+ Novo ticket` (`hidden md:flex`, mesmo estilo do "+ Novo"
    de `tickets/page.tsx`) que navega para `/tickets?create=1` (rota já tratada por
    `tickets/page.tsx` para abrir o dialog de criação automaticamente). Mobile já tinha
    cobertura via `<MobileFab href="/tickets?create=1" />` (`md:hidden`) — não duplicado.
  - `tsc --noEmit` ✓ (sem erros). `pnpm lint` ✓ (só 5 warnings pré-existentes, nenhum
    novo — 2 deles inclusive no próprio `dashboard/page.tsx`, já existiam antes do diff).
  - `.claude/launch.json` (novo, untracked) — configuração `worklog-dev` (`pnpm dev`,
    porta 3000) para o preview do Browser tool.
  - **Verificado ponta-a-ponta com backend em :8080** (login `admin.teste@worklog.com`,
    ADMIN): (1) `/tickets` → sidebar expandido → clique na logo → `href="/dashboard"`
    confirmado e navegação real observada (conteúdo virou dashboard); (2) sidebar
    colapsado (`Expandir menu` confirma o estado) → clique na logo colapsada →
    mesmo redirect para `/dashboard`; (3) dashboard desktop → clique em "+ Novo ticket"
    → navegou para `/tickets?create=1` → dialog "Novo ticket" abriu com o form completo
    (Título/Descrição/Cliente/Sistema/Status/Prioridade/Responsável). Sem erros no
    console em nenhum passo.
  - **Sem PNG de evidência**: o screenshot do Browser tool falhou (“Browser pane is not
    displayed”) neste ambiente; verificação foi feita via accessibility tree
    (`read_page`) + `get_page_text` + `read_console_messages`, que confirmam
    `href`/estado/navegação real, não uma captura de imagem. Reflete o gap real do
    AGENTS.md §8 (evidência visual estruturada exige PNG fresco) — registrar aqui em
    vez de fabricar artefato.
  - Nada commitado ainda (mudanças só no working tree da branch) — aguardando ok do
    usuário para commit.

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

## Documentação

- [x] `design-system.md` (raiz) — spec de design para colar em sessões
  de mockup do Claude Design. Extraído do código, não do `brand.md`:
  tokens de `globals.css`, primitivos shadcn (registry denso: `Button`
  `h-7`, `Input` `h-7`), os 16 componentes de `components/worklog/`,
  medidas do shell (sidebar 200/52, header 52, tab bar 82, FAB 56),
  inventário dos 45 ícones lucide em uso, durações de animação, e 12
  regras para mockup. Só documentação — nenhum código tocado, sem
  verificação de build necessária.

- [ ] `memory/brand.md` diverge de `globals.css` na prioridade do tema
  claro: `CRITICAL` `#D3443C` vs `#DC2626` implementado, `HIGH`
  `#9B6D29` vs `#B45309`. O `design-system.md` documenta os valores do
  CSS, que são os que renderizam. Reconciliar o `brand.md`.

## Blocked

<!--
- [ ] <task> — waiting on: <reason or person>
-->
