# Plano — Expansão do cadastro de clientes (filiais, contatos, endereço, lookup CNPJ)

**Data:** 2026-07-29
**Status:** plano aprovado na estrutura; nenhum código escrito
**Contrato:** `docs/api/CONTRATO-CLIENTES.md` (autoridade máxima) · `docs/api/client-api.ts` · `docs/api/openapi.json`
**Mockups:** `mockups/Client-expansion/` (22 imagens, dark + light)
**Backend:** branch `feat/client-registration-expasion`, fases 1–6

---

## 1. Diagnóstico

### 1.1 O que quebra hoje

| Onde | Por quê |
|---|---|
| `src/api/generated/schemas/clientRequest.ts` | Tipo plano (`name`, `systemsPublicIds`, `enabled`). O POST agora exige `tipo` + `branches[]`. |
| `src/api/generated/schemas/clientResponse.ts` | Sem `tipo`, `nomeFantasia`, `regimeTributario`, `branches[]`. |
| `src/components/clients/client-form.tsx` | Envia `{ name, systemsPublicIds }` → 400/422. Exige ≥1 sistema (agora opcional). Não tem `tipo`, documento nem filiais. O `PATCH` manda `ClientRequest` em vez de `ClientUpdateRequest`. |
| `src/components/clients/client-grid.tsx:58` | `(c as { email?: string }).email ?? '—'` — hack de campo inexistente. O dado real é `branches[matriz].contatos[principal].valor`. |
| `src/components/clients/client-detail.tsx` | Só mostra status/criado/sistemas. Nenhum documento, endereço, contato ou filial. `handleReactivate` remonta o objeto inteiro no PATCH, contra a semântica PATCH da §8. |
| `src/app/(app)/clientes/page.tsx` | Filtra 100% client-side (`name`/`status`); ignora `tipo`/`documento` do servidor. Deactivate via `DELETE` e reactivate via `PATCH` — dois caminhos, contra a recomendação da §8. |
| `src/api/generated/clientes/clientes.ts` | Não tem `lookupByCnpj`; falta o grupo `Filiais` inteiro (5 endpoints). |

**Não quebra:** o `POST /clients/` com barra final (§4.1) — o Orval já gera `url: '/clients/'`, porque a spec antiga também mapeava `/clients/`. E a serialização de `filtersParams` já funciona: o `paramsSerializer` de `src/lib/api.ts` achata objetos aninhados.

### 1.2 Sobre o `docs/api/client-api.ts`

Confrontado campo por campo com o `openapi.json` e com o markdown: **nenhum erro de tipo**. Limites de `MAX_LENGTH`, obrigatoriedades, `documento: string | null` em `BranchResponse`, `contatos` substituindo a lista inteira — tudo consistente. Os ajustes ao trazer o arquivo para o projeto são de duplicação, não de correção:

- **Remover** `CLIENT_ENDPOINTS`, `ADMIN_ONLY` e `buildClientListQuery`. O Orval é dono das URLs e o `paramsSerializer` é dono da query string; uma segunda tabela de rotas é convite a drift.
- **Remover** `ApiExceptionResponse` (já existe em `src/api/generated/schemas` e é o que `src/lib/api-errors.ts` consome). `hasFieldErrors` e `isDisplayableMessage` migram para `src/lib/api-errors.ts`, onde os helpers de erro já moram.
- **Manter** enums, labels, `MAX_LENGTH`, todas as interfaces de request/response (é o valor do arquivo: obrigatoriedade correta, que o gerado perde) e os helpers de estado (`canPromoteToMatriz` etc.).
- **Destino:** `src/api/clients-contract.ts`. Os tipos estritos são usados no módulo de clientes e sofrem cast na fronteira do Orval — mesmo padrão já registrado em `memory/gotchas.md` para `SystemRequest`.

`canDeactivateBranch`/`canActivateBranch` não olham role, e está correto: o gate ADMIN fica no componente (`isAdmin`), como já é hoje.

### 1.3 Sobre a spec

`docs/api/openapi.json` é **superset limpo** de `openapi/worklog.json`: 9 schemas novos (`AddressRequest/Response`, `BranchRequest/UpdateRequest/Response`, `ContactRequest/Response`, `ClientUpdateRequest`, `CnpjLookupResponse`), 3 alterados (`ClientFiltersParams`, `ClientRequest`, `ClientResponse`), zero removidos.

A inversão 200/401 do `GET /tickets` (gotcha registrado em `memory/gotchas.md`) **existe idêntica nas duas specs** — trocar a spec não regride o módulo de tickets, e o cast em `PageTicketSummary` continua valendo.

---

## 2. Decisões fechadas com o usuário

| Tema | Decisão |
|---|---|
| Detalhe do cliente | Rota nova `/clientes/[publicId]` (página inteira, conforme mockup). O modal `ClientDetail` é aposentado. |
| Listagem | Tabela no desktop (`md+`), cards no mobile (`<md`). |
| Endereço e contatos | Compacto como o mockup por padrão, com "Mais detalhes" expansível abrindo os campos estruturados da API e o repetidor de contatos. |
| Sistemas | Mantido no formulário de criar/editar, agora **opcional** (sem `min(1)`). Card próprio no detalhe, separado do card de Contrato. |
| Contratos / Serviços contratados | Placeholder **"Em desenvolvimento"**. Nenhuma chamada de API, nenhum arquivo/Ver/Baixar. |

### Assunções registradas

1. **Paginação da listagem fica fora desta fase** — o endpoint não pagina e a lista é pequena. Item deferido.
2. **Mapeamento da coluna TICKETS:** "solicitados" = `PENDING`; "em andamento" = `AWAITING_CUSTOMER` + `AWAITING_DEVELOPMENT`.
3. **Toggle de status do cliente:** migra de `DELETE` para `PATCH { enabled }` (recomendação da §8, um caminho só), mas o botão **continua visível apenas para ADMIN**, como hoje. O contrato diz que o PATCH é USER — se a regra de produto mudar, é só remover o gate.
4. **Contador de "Ver filiais (N)":** conta as filiais **não-matriz**, como no mockup ("(2)" com 2 filiais além da matriz).
5. **`nomeFantasia` entra no formulário** (PJ) mesmo sem estar no mockup: existe na API e o lookup o preenche.
6. **"Regime tributário" por filial sai** do formulário de filial: o mockup o põe lá, mas regime é campo do cliente.

---

## 3. Slices

Cada slice é uma fatia vertical verificável. Limite de ~5 arquivos tocados por passe (AGENTS.md §5).

### Slice 1 — Camada de API e contrato (sem UI)

1. `openapi/worklog.json` ← `docs/api/openapi.json`, depois `pnpm api:gen`. Gera `src/api/generated/filiais/filiais.ts` (5 hooks: `findBranchesByClient`, `createBranch`, `updateBranch`, `activateBranch`, `deactivateBranch`), `lookupByCnpj` em `clientes.ts`, e os 9 schemas novos. `updateClient` passa a tipar `ClientUpdateRequest`.
2. `src/api/clients-contract.ts` (novo) — o `client-api.ts` com os cortes da §1.2.
3. `src/lib/documento.ts` (novo) — checksum de CPF e de CNPJ, **incluindo o formato alfanumérico de 2026** (dígito calculado sobre `char − 48`); `formatDocumento` para exibição com máscara; `stripDocumento` para envio. Consumido por: validação pré-lookup (§7.2.7), coluna da listagem, header do detalhe, filtro `documento`.
4. `src/lib/field-errors.ts` (novo) — traduz `fieldErrors["branches[0].contatos[1].valor"]` → path RHF `branches.0.contatos.1.valor` e aplica via `setError`. Cobre também a assimetria 400-com-`fieldErrors` vs 422-com-mensagem-solta descrita na §7.3.
5. `src/lib/api-errors.ts` — recebe `hasFieldErrors` e `isDisplayableMessage`.
6. `src/api/invalidate.ts` — `invalidateBranches(qc, clientPublicId)`. Necessário porque `['/clients/abc']` **não** casa com `['/clients/abc/branches']` no prefix-match do React Query.

### Slice 2 — Listagem (`/clientes`)

- `src/components/clients/client-table.tsx` (novo, desktop `md+`): colunas CLIENTE (nome + badge PJ/PF + documento da matriz mascarado) · CONTATO (contato `principal` da matriz, senão o primeiro) · TICKETS · CONTRATO (chip "Em desenvolvimento") · RENOVAÇÃO (`—`) · chevron. Linha clicável → `/clientes/{publicId}`.
- `src/components/clients/client-grid.tsx`: passa a ser a versão mobile (`<md`). Ganha badge de tipo, documento da matriz e contato principal; morre o hack do `email`.
- `src/app/(app)/clientes/page.tsx`: filtros vão para o servidor — `filtersParams: { name, status, tipo, documento }`. Busca única "Buscar por nome, CNPJ ou CPF": se o texto normalizado parece documento, vai em `documento`; senão em `name`, com `useDebouncedValue` (já existe). Novo `FilterSelect` de tipo. Saem o `ClientDetail` modal e o `ClientEditFetcher`. Subtítulo "N clientes cadastrados". Atalhos `/` e `c` preservados.
- `src/components/worklog/tipo-badge.tsx` e `src/components/worklog/dev-chip.tsx` (novos, exportados no `index.ts`) — reusados no detalhe.

### Slice 3 — Detalhe (`/clientes/[publicId]`, rota nova)

- `src/app/(app)/clientes/[publicId]/page.tsx` (novo). **Ler o guia de rotas em `node_modules/next/dist/docs/` antes de escrever** — a assinatura de `params` mudou no Next 16.
- `client-detail-header.tsx`: `‹ Voltar para clientes`, nome, badge de tipo, documento da matriz, `StatusPill`, e o toggle ativar/inativar (admin-only, via `PATCH { enabled }`).
- `client-data-card.tsx`: "DADOS DA EMPRESA" (PJ) / "DADOS PESSOAIS" (PF). Razão social/Nome, CNPJ/CPF, Inscrição Estadual e Regime tributário (PJ), Contato principal, Endereço formatado. Lápis → dialog de edição. Rodapé: `Ver filiais (N)` ou `+ Filiais` quando N = 0 — **oculto para PF** (§9).
- `client-systems-card.tsx`: chips dos sistemas associados.
- `client-contract-placeholder.tsx`: card "CONTRATO VIGENTE / SERVIÇOS CONTRATADOS" com estado vazio **"Em desenvolvimento"**.
- `client-tickets-card.tsx`: "Tickets do cliente" com abas Em andamento / Solicitados / Todos, via `useFindAllTickets({ filters: { clientId } })` — o filtro existe na spec, então é server-side.
- `client-detail.tsx` (modal) é **removido**. O `ConfirmDialog` que vive nele — hoje duplicado também em `clientes/page.tsx` — sai para `src/components/worklog/confirm-dialog.tsx`.

### Slice 4 — Criar e editar cliente

`client-form.tsx` (346 linhas, monolítico) se divide em `client-create-dialog.tsx`, `client-edit-dialog.tsx`, `client-form-fields.tsx` e `branch-fields.tsx`.

- **Tipo primeiro** (toggle PJ/PF): decide máscara CPF/CNPJ, visibilidade de IE/regime, e a existência da seção FILIAIS.
- **Lookup CNPJ:** lupa dentro do campo + `onBlur`, **nunca por tecla**. Checksum local antes de chamar. Preenche nome/nomeFantasia/regime/`branches[0]` (endereço e contatos) e **força `isMatriz: true`** na única filial (§7.2.2). `situacaoAtiva: false` → alerta amarelo com o texto de `situacaoCadastral`, **sem bloquear** o cadastro. 429/503 → toast, formulário segue editável. IE, IM e "contato principal" sinalizados como preenchimento manual.
- **Endereço/contatos:** compacto por padrão (e-mail + telefone + linha de endereço), com "Mais detalhes" abrindo CEP/logradouro/nº/complemento/bairro/cidade/UF e o repetidor de contatos (tipo, valor, descrição, **radio** de principal).
- **Sistemas:** checkboxes atuais, sem o `min(1)`.
- **Zod** (`zod/v3`, como o resto do projeto): `tipo` obrigatório; `name` 1..100; ≥1 filial com **exatamente uma** `isMatriz`; checksum por tipo; sem documento repetido no payload; ≤1 contato principal por filial; limites de `MAX_LENGTH`.
- **Salvar (criar):** `POST /clients/` aninhado, sem `enabled`.
- **Salvar (editar)** — orquestração necessária, porque `PATCH /clients` **ignora filiais** (§4.4) mas o mockup edita a matriz dentro do dialog de cliente:
  1. `PATCH /clients/{id}` só com os campos de cliente que mudaram;
  2. `PATCH /clients/{id}/branches/{matrizId}` com os campos da matriz que mudaram — `contatos` **sempre completo** (§9.3);
  3. `POST /clients/{id}/branches` para cada filial nova da seção FILIAIS, **nunca** mandando `isMatriz` (§9.2).

  Sequencial, para no primeiro erro, e o toast diz exatamente o que passou e o que falhou. **Não é atômico e não tem como ser** — isso fica explícito na UI em vez de fingir transação.
- **PF:** seção FILIAIS oculta. Trocar PJ→PF com 2+ filiais ativas → 422 com link para o modal de filiais (§8).

### Slice 5 — Filiais

- `branches-dialog.tsx`: `GET /clients/{id}/branches`, matriz primeiro com badge "Matriz".
- `branch-edit-dialog.tsx`: `PATCH` da filial. Sem o campo "Regime tributário" (ver assunção 6).
- **Nova filial:** repetidor de rascunhos + `POST` sequencial; erro inline no rascunho que falhou, e os rascunhos não salvos permanecem no formulário. Lupa de CNPJ disponível aqui também.
- **Definir como matriz:** `PATCH { isMatriz: true }`, com confirmação "A filial X passa a ser a matriz, e Y deixa de ser" e **refetch da lista** — duas linhas mudam (§9.4).
- **Inativar/reativar** (ADMIN): `POST .../deactivate|activate`, 204 sem corpo → refetch. O diálogo de inativar explica que o documento **continua reservado** (§9.5).
- Botões habilitados pela matriz da §10, via os helpers de `clients-contract.ts` + `isAdmin`. **Nada exposto que devolva 422 na certa.**

### Ripple (verificar, provavelmente sem mudança)

`sistemas/page.tsx`, `systems/system-detail.tsx`, `tickets/page.tsx`, `tickets/ticket-form.tsx` chamam `useFindAllClients({ filtersParams: {} })` e leem só `name`/`publicId` — compilam sem mudança. `ClientCombobox` recebe `FilterOption[]`, também intacto. Enriquecer o label do combobox com o documento fica deferido.

---

## 4. Verificação

Por slice:

- `pnpm exec tsc --noEmit` e `pnpm exec eslint .` (comandos de `agent-md.toml [verify]`).
- Runtime contra o backend em `:8080`.
- Screenshots Playwright em **dark e light** das 8 telas (listagem, detalhe PJ, detalhe PF, criar PJ, criar PF, editar, filiais, adicionar filial). `storageKey` é **`wl-theme`**, não `theme` (gotcha registrado).
- Nota de evidência em `.agent/visual/` com os 5 campos **seguidos de dois-pontos** — `**Changed files:** …`, `**Route or URL:** …`, `**Viewport:** …`, `**Artifact:** …`, `**Observed result:** …` (o hook rejeita título markdown sem `:`).

Definition of done da fase: o **checklist de aceite da §12 do contrato**, testado na tela e não no código.

---

## 5. Itens deferidos

- Paginação client-side da listagem (mockup mostra; endpoint não pagina).
- `ClientCombobox` exibindo documento/tipo nas opções.
- Gap do backend (§8): `PATCH /clients` não valida nome duplicado e `clients.name` não tem `UNIQUE`. Se a UI não puder conviver com homônimos, validar no front (`GET /clients?name=`) e reportar ao backend.
- Módulo de Contratos / Serviços contratados — placeholder "Em desenvolvimento" nesta fase.
