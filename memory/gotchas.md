# Mistakes Log

After any correction from the human, log the pattern here. Review at
session start before starting new work. The goal is to drive the error
rate toward zero.

Format:
- **Date** — *mistake* → **rule**

---

<!--
Examples:

- **2026-04-15** — Assumed `USER_ID` env var was set; silently fell back
  to empty string. → **Rule**: No silent fallbacks on env vars. Hard-fail
  at startup if required vars are missing.

- **2026-04-18** — Renamed `getUserPrefs` via grep; missed a dynamic
  import in `src/lib/legacy.ts`. → **Rule**: On every rename, search
  separately for static calls, type references, string literals, dynamic
  imports, re-exports, test mocks.
-->

- **2026-05-02** — Dashboard components written with `var(--wl-surface-1)` which doesn't exist
  in `globals.css`. Available surface variables: `--wl-surface` (card bg), `--wl-surface-2`
  (darker variant), `--wl-bg` (page bg). → **Rule**: Check `globals.css` for available CSS
  custom properties before using `var(--wl-*)` in new components.

- **2026-05-01** — `GET /tickets` Orval-generated hook has return type
  `TicketSummary` instead of `PageTicketSummary` because the backend
  OpenAPI spec has the 200 and 401 response schemas swapped. → **Rule**:
  When consuming `useFindAllTickets` (and any paginated list hook), cast
  `q.data` to `PageTicketSummary` at the call site until the spec is
  corrected. Do not regen without first fixing the spec swap.

- **2026-04-26** — User shared the OpenAPI doc URL alongside a "pode
  commitar" and I jumped straight to committing the agent-md scaffold,
  skipping the implied next step (configure Orval to codegen the API
  client from the spec). → **Rule**: When the user hands over a spec
  URL, schema, or external contract, treat it as an instruction to wire
  it into the project, not just reference material. Confirm the
  expected next step before falling back to whatever was already
  pending.

- **2026-05-15** — `SystemRequest` na spec OpenAPI só expõe `name`, mas
  `SystemResponse` carrega `enabled`. PATCH `/systems/{id}` aceita o
  campo na prática, então o frontend faz cast `{ enabled } as
  SystemRequest` para alternar ativação até a spec ser corrigida.
  → **Rule**: Quando a spec mostra divergência entre Request e Response
  para um campo claramente de domínio (enabled/active/etc.), cast no
  call-site é aceitável temporariamente; documentar como pendência em
  `memory/plan.md` e abrir gap no backend.

## Orval nested params vs Spring Boot flat params

Orval gera `FindAllTicketsParams = {filters: {...}, pageable: {...}}`.
Axios serializa isso como `filters[title]=x&pageable[page]=0`.
Spring Boot espera params flat: `title=x&page=0`.

**Fix**: `paramsSerializer` customizado em `src/lib/api.ts` que achata objetos aninhados
recursivamente e repete arrays como params múltiplos.

## Hook de evidência visual exige dois-pontos nos campos

`visual_evidence_ok` em `.claude/hooks/_lib.sh` valida a nota de
evidência com `grep -Eiq 'changed files?:'`, `'(route|url):'`,
`'viewport:'` e `'(observed|result):'` — **todos com dois-pontos**.

Escrever os campos como títulos markdown (`**Changed files**` em linha
própria, sem `:`) faz o Stop hook rejeitar a nota mesmo com todo o
conteúdo correto, e a mensagem de erro não diz que o problema é a
pontuação.

**Fix**: usar `**Changed files:** valor` na mesma linha. A nota também
precisa citar o *basename* de uma imagem fresca (< `freshness_seconds`,
3600s) que exista no mesmo diretório.

**Conferir antes de encerrar**:
```bash
source .claude/hooks/_lib.sh && visual_evidence_ok ".agent/visual" 3600 \
  && echo PASS || echo FAIL
```

## Screenshot dos dois temas: storageKey é `wl-theme`

`next-themes` está configurado com `storageKey="wl-theme"` e
`defaultTheme="dark"` em `src/app/providers.tsx` — não a chave `theme`
padrão. Um script Playwright que faça `localStorage.setItem('theme', ...)`
captura dark nas duas passadas, silenciosamente, sem erro.

Além disso, `playwright` está em `devDependencies` do projeto mas o
canal `chrome` do MCP não está instalado (só `chromium` em
`~/.cache/ms-playwright`). Scripts de captura precisam rodar a partir da
raiz do projeto para resolver `require('playwright')`.

## `cd` relativo em Bash persiste entre chamadas

O diretório de trabalho do tool Bash **persiste entre invocações**. Uma
sequência de `cd src/components/worklog && ...` seguida de
`cd src/components/tickets && ...` falha na segunda: o segundo caminho é
resolvido a partir de `src/components/worklog`.

Pior: se a verificação estiver na mesma cadeia (`grep ... || echo
"limpo"`), ela roda no diretório errado e reporta sucesso falso. Foi o
que aconteceu na fatia R5 do rebranding — um lote inteiro de edições não
foi aplicado e o grep confirmou "limpo".

**Regra**: usar caminhos absolutos em edições em lote, e rodar a
varredura de verificação a partir da raiz do projeto, imprimindo `pwd`
junto do resultado.

## `t.status as TicketStatus` é cast falso (2026-08-04, Slice 3)

A API fala `PENDING` / `AWAITING_CUSTOMER` / `AWAITING_DEVELOPMENT` / `COMPLETED` /
`CANCELLED`. A UI fala `OPEN` / `IN_PROGRESS` / `AWAITING_DEV` / `RESOLVED` /
`CANCELLED`, e é por esse vocabulário que `STATUS_META` é indexado. Castar o status da
API para `TicketStatus` compila e explode em runtime com
`Cannot read properties of undefined (reading 'background')` dentro do `StatusChip`,
derrubando a página inteira. **Sempre passar por `apiToUiStatus` de
`src/lib/ticket-status.ts`.** O `tsc` não protege: o cast silencia justamente a
checagem que pegaria isso.

## Mock de erro de API tem que ser `AxiosError` de verdade (2026-08-04)

`getApiErrorBody` e `getApiErrorStatus` (`src/lib/api-errors.ts`) checam
`err instanceof AxiosError`. Um objeto `{ response: { status, data } }` com o formato
certo é ignorado **em silêncio** — o teste falha dizendo `expected false to be true`, sem
pista de que o problema é o mock. Em teste, montar com `new AxiosError(...)` e atribuir
`err.response`. Há um caso em `src/lib/field-errors.test.ts` que trava essa armadilha.

## `w-full` do `inputCls` vence largura na mesma string (2026-08-04, Slice 4)

`className={`${inputCls} w-28`}` **não** deixa o campo com 112px: as duas classes têm a
mesma especificidade e quem ganha é a ordem no CSS gerado, que é o `w-full`. Num flex
row isso esmaga o irmão `flex-1` — o input do valor do contato ficou com **26px** e a
descrição o sobrepôs. Corrigir com wrapper de largura própria (`<div className="sm:w-28
sm:shrink-0">`) e deixar o input com `w-full` dentro. Medir com `boundingBox()` em vez
de julgar por screenshot.

## Clique em botão dentro de campo dispara o `blur` do campo (2026-08-04, Slice 4)

A lupa de consulta de CNPJ vive dentro do input. O `mousedown` do botão tira o foco do
input **antes** do clique, então `onBlur` + `onClick` disparam os dois e a mesma consulta
sai duas vezes. Em endpoint com rate limit (o lookup é 5/min por IP, compartilhado pela
equipe) isso é quota queimada. Guardar o último valor consultado num `useRef` e sair
cedo; limpar no erro para o retry continuar possível.

## Paginação de `GET /clients` é opt-in e troca o tipo da resposta (2026-08-04)

Sem `page` e sem `size`, o endpoint devolve `ClientResponse[]`. Com qualquer um dos
dois, devolve `Page<ClientResponse>`. O springdoc não expressa retorno duplo, então o
Orval tipa **sempre** array — o cast fica na fronteira. Consequência prática: adicionar
paginação numa tela **não** exige mexer nas outras que consultam o mesmo endpoint.

Duas armadilhas do gerado:
- `pageable` aparece como **obrigatório**. Não é um objeto que deva ir para o servidor:
  o `paramsSerializer` de `src/lib/api.ts` achata objetos aninhados, então
  `pageable: { page, size, sort: ['name,asc'] }` vira `?page=0&size=12&sort=name,asc`.
  Nenhuma chave `pageable` chega ao backend — verificado na rede.
- `sort` sozinho é **ignorado**: `?sort=name,desc` sem `page`/`size` cai no caminho do
  array e não ordena.

## `setState` dentro de `useEffect` é erro de lint, não warning (2026-08-04)

Resetar a página ao trocar de filtro com `useEffect(() => setPage(0), [filtro])` é
barrado por `react-hooks/set-state-in-effect` — e a regra está certa, isso dispara
render em cascata. Fazer no próprio handler que muda o filtro.
