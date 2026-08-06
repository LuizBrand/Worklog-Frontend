# Design System — WorkLog

Documento de contexto para sessões de design/mockup. Cole no início da
conversa. Descreve a UI **como ela é hoje** no código, não um ideal.

- Produto: WorkLog — diário compartilhado do time de suporte. Gestão de
  tickets, clientes, sistemas e usuários.
- Idioma da interface: **pt-BR** (`lang="pt-BR"`). Todo label, botão,
  placeholder e mensagem em português.
- Stack: Next.js 16 (App Router) · React 19 · Tailwind CSS v4 ·
  shadcn/ui · lucide-react `^1.14.0` · next-themes.
- Tema padrão: **dark**. Light existe e é de primeira classe — todo
  mockup deve funcionar nos dois.
- Densidade: **alta**. É uma ferramenta interna de trabalho, não uma
  landing page. Fontes pequenas, alturas curtas, muita informação por
  tela.
- Fonte da verdade da marca no repo: `memory/brand.md`. Tokens:
  `src/app/globals.css`. Showcase vivo: rota `/design`.

---

## 1. Marca

### Símbolo

Quadrado indigo de cantos arredondados (`rx` = 0.25 do lado) com um
traço zigzag e um ponto no canto superior direito. Lê-se como um **W** —
isso é intencional e deve ser preservado.

```svg
<svg viewBox="0 0 88 88" width="28" height="28">
  <rect width="88" height="88" rx="22" fill="#6366f1" />
  <path d="M22 33 L34.5 67 L50.4 40 L58.4 57.5 L66 33"
        fill="none" stroke="#ffffff" stroke-width="7"
        stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="72" cy="27" r="2" fill="#ffffff" />
</svg>
```

- **Só existe a variante indigo** (fundo `#6366F1`, traço branco). A
  variante escura foi descartada — some contra o `--wl-bg`.
- Tamanho mínimo: 16px. Espaço de proteção: metade da largura do símbolo.
- Tamanho padrão na UI: 28px.

### Wordmark

Grafia **WorkLog**, com L maiúsculo. Space Grotesk 700,
`tracking: -0.02em`, `font-size` = 0.6 × tamanho do símbolo, cor
`var(--wl-text)`. Sempre à direita do símbolo com `gap: 8px`.

---

## 2. Cores

Sistema de duas camadas:

1. **`--wl-*`** — escala de superfície e texto do WorkLog, em hex cru.
2. **Tokens shadcn** (`--background`, `--card`, `--muted`, `--border`…)
   — apontam para os **mesmos hex** da escala `--wl-*` de propósito. São
   a mesma superfície; mantê-los separados fazia popovers e skeletons
   derivarem do resto da UI.

Só o accent fica em OKLCH, porque a rampa `chart-1..5` se beneficia da
interpolação perceptual.

### Accent — indigo

`#6366F1` / `#818CF8` são exatamente `indigo-500` / `indigo-400` do
Tailwind. Os valores OKLCH são os oficiais do Tailwind v4.

| Token | Light | Dark |
|---|---|---|
| `--primary` | `oklch(0.585 0.233 277.117)` · `#6366F1` | `oklch(0.673 0.182 276.935)` · `#818CF8` |
| `--primary-foreground` | `#FFFFFF` | `oklch(0.13 0.028 277.117)` (quase preto) |
| `--ring` | igual a `--primary` | igual a `--primary` |
| `--accent` (fundo sutil) | `oklch(0.951 0.026 277.117)` | `oklch(0.28 0.05 277.117)` |

O hue `277.117` propaga para `ring`, `accent`, `sidebar-*` e
`chart-1..5`.

### Superfícies e texto (`--wl-*`)

Base neutra **fria nos dois modos** — decisão deliberada para que os dois
temas sejam irmãos, não primos de temperaturas diferentes.

| Token | Dark | Light | Uso |
|---|---|---|---|
| `--wl-bg` | `#0B0B10` (tinta) | `#F2F2F4` | fundo da página |
| `--wl-surface` | `#1C1D26` (grafite) | `#FFFFFF` | cards, sidebar, popovers |
| `--wl-surface-2` | `#262835` | `#E8E8EC` | hover, chips neutros, trilhos |
| `--wl-border` | `#2A2C38` | `#DEDEE3` | borda padrão, divisórias |
| `--wl-border-2` | `#383A48` | `#C9C9D1` | borda enfática, scrollbar |
| `--wl-text` | `#E8E9ED` | `#0B0B10` | texto primário |
| `--wl-text-muted` | `#8A8794` | `#6B6875` | secundário, labels |
| `--wl-text-dim` | `#55535E` | `#A3A0AC` | terciário, placeholders apagados |

### Status de ticket

Cinco status. Os tokens colorem o **texto** do chip, não só o
preenchimento — por isso o tema claro usa tons escuros e **saturados**
(83–98%), não o tom de marca escurecido (escurecer multiplicando RGB
dessatura e produz marrom sujo).

| Status | Label pt-BR | Ícone | Dark (texto) | Dark (fundo) | Light (texto) | Light (fundo) |
|---|---|---|---|---|---|---|
| `OPEN` | Aberto | `AlertCircle` | `#E8A33D` âmbar | `#2E2210` | `#B45309` | `#FEF3C7` |
| `IN_PROGRESS` | Em andamento | `Play` | `#818CF8` | `#1B1D3A` | `#4F46E5` | `#E0E7FF` |
| `AWAITING_DEV` | Aguard. dev | `Clock` | `#38BDF8` | `#072A3D` | `#0369A1` | `#E0F2FE` |
| `RESOLVED` | Resolvido | `CheckCircle2` | `#2FAE7C` jade | `#0C2A1F` | `#047857` | `#D1FAE5` |
| `CANCELLED` | Cancelado | `XCircle` | `#84818D` | `#1A1A20` | `#5A5860` | `#F1F0F3` |

Ordem canônica: `OPEN → IN_PROGRESS → AWAITING_DEV → RESOLVED → CANCELLED`.

`AWAITING_DEV` é azul (hue ~200) por decisão do usuário — cinza ficava
apagado demais, e 200 está longe o bastante dos 243/277 do indigo para
não colidir com `IN_PROGRESS`.

### Prioridade

Escala de **hierarquia**: crítico grita, baixo sussurra.

| Prioridade | Label | Dark | Light |
|---|---|---|---|
| `CRITICAL` | Crítico | `#E2564E` | `#DC2626` |
| `HIGH` | Alto | `#E8A33D` | `#B45309` |
| `MEDIUM` | Médio | `#8A8794` | `#787581` |
| `LOW` | Baixo | `#7A7784` | `#55535E` |

`LOW` no escuro fica em ~3.8:1 de propósito, abaixo de AA. Todos os
outros pares token/fundo passam AA (4.5:1).

### Semânticos

| Token | Dark | Light |
|---|---|---|
| `--wl-danger` / `--destructive` | `#E2564E` | `#D6453D` |
| `--wl-danger-bg` | `#2C1414` | `#FDECEA` |
| `--wl-success` | `#2FAE7C` | `#2FAE7C` |
| `--wl-success-bg` | `#0C2A1F` | `#E6F7F0` |

Não existe token de "warning" separado: use `--status-open` (âmbar).

### Charts

Rampa monocromática indigo, `--chart-1` a `--chart-5`, do mais claro ao
mais escuro dentro do hue 277. Em gráficos por status, **use as cores de
status**, não a rampa — o donut do dashboard faz isso.

### Avatares

Cinco hues bem separados, saturados o bastante para carregar texto
branco nos dois temas. Escolhidos por `charCode` das iniciais:

`#4F46E5` · `#0369A1` · `#047857` · `#B45309` · `#BE3455`

Avatar = círculo sólido, iniciais em branco, `font-weight: 600`,
`font-size` = 0.38 × diâmetro, `letter-spacing: 0.02em`. Tamanhos em uso:
18px (timeline), 28px (padrão), 32–40px (perfil).

---

## 3. Tipografia

| Papel | Família | Pesos | Variável CSS | Classe |
|---|---|---|---|---|
| Interface (corpo) | **Inter** | 300–800 | `--font-sans` | `font-sans` |
| Títulos e marca | **Space Grotesk** | 600, 700 | `--font-display` | `font-heading` |
| Código, IDs, timestamps | **JetBrains Mono** | 400–600 | `--font-mono` | `font-mono` |

**Space Grotesk tem personalidade demais para uso amplo numa UI densa de
tickets.** Aplicar apenas em: wordmark, títulos de página e números
grandes de stat. Nunca em corpo de texto ou labels de campo.

### Escala em uso

A UI é densa; a escala vive entre 10 e 18px.

| px | Uso |
|---|---|
| 10 | labels maiúsculos de stat, meta de usuário na sidebar, tabs mobile |
| 11 | timestamps, tags, prioridade, texto terciário, `MonoSpan` |
| 12 | chips de status, texto de apoio, `text-xs` do shadcn |
| 13 | corpo padrão da UI custom — itens de nav, linhas de lista, botões de ação |
| 14 | títulos de card (`CardTitle`), textos de destaque em painéis |
| 18 | título de página (`h1`), valor de `StatCell` |

Tracking: negativo em títulos grandes (`-0.01` a `-0.02em`), positivo em
rótulos maiúsculos pequenos (`+0.08` a `+0.12em`, na prática
`tracking-wide`).

Números sempre `tabular-nums` quando aparecem em colunas ou contadores.

---

## 4. Raio, borda e elevação

`--radius: 0.5rem` (8px). Escala derivada por multiplicação:

| Token | Valor | Classe | Uso |
|---|---|---|---|
| `--radius-sm` | 4.8px | `rounded-sm` | botões `xs`, chips minúsculos |
| `--radius-md` | 6.4px | `rounded-md` | **botões, inputs, itens de nav** |
| `--radius-lg` | 8px | `rounded-lg` | `Card` do shadcn, dropdowns, botões de ação custom |
| `--radius-xl` | 11.2px | `rounded-xl` | **cards do WorkLog**, painéis, barras de stat, dialogs |
| `--radius-2xl` | 14.4px | `rounded-2xl` | contêineres grandes, ícone de empty state |

Chips de status usam `border-radius: 5px` cru; tags usam `3px`.

**Elevação vem de borda, não de sombra.** No estado de repouso:

- Card WorkLog: `background: var(--wl-surface)` + `1px solid var(--wl-border)`.
- Card shadcn: `bg-card` + `ring-1 ring-foreground/10`.
- Sombra só em coisas que flutuam: dropdown `shadow-xl`, dialog/painel
  `shadow-2xl`, FAB `shadow-xl`.

Chips coloridos usam borda derivada da própria cor:
`border: 1px solid ${cor}22` (status) ou
`color-mix(in oklab, ${cor} 16%, transparent)` (tag).

---

## 5. Ícones

- Biblioteca: **lucide-react** `^1.14.0`. Nunca misturar outra família.
- `strokeWidth` **1.5** para ícones de navegação e ação; **2** para
  ícones dentro de chips, badges, toasts e itens de nav ativos.
- Sem `fill` — sempre traço.
- Tamanhos: 10–12px dentro de chips · 14px inline com texto · 16px
  (`size-4`) em botões · 18px na nav lateral · 20px (`size-5`) nas tabs
  mobile · 24px no FAB.

### Já usados no app

Navegação — `Home`, `Ticket`, `Building2`, `Layers`, `UserCog`,
`CircleUser`.
Status — `AlertCircle`, `Play`, `Clock`, `CheckCircle2`, `XCircle`.
Ação — `Plus`, `Pencil`, `Trash2`, `Eye`, `EyeOff`, `Search`, `Filter`,
`RefreshCw`, `RotateCcw`, `MoreHorizontal`, `LogOut`, `KeyRound`, `Ban`.
Sistema/estado — `Loader2` (spin), `Check`, `X`, `Info`,
`AlertTriangle`, `ShieldCheck`, `ShieldOff`, `Sun`, `Moon`, `User`,
`Flag`, `Circle`, `Type`, `AlignLeft`, `MessageSquare`.
Direcionais — `ChevronRight/Left/Up/Down`, `ChevronsUpDown`,
`ArrowLeftToLine`, `ArrowRightToLine`.

Ao precisar de um ícone novo, prefira um destes antes de introduzir mais
um conceito visual.

---

## 6. Layout e shell

Breakpoint que separa os dois shells: **768px** (`md`).

### Desktop (≥768px)

```
┌──────────┬──────────────────────────────────────┐
│ Sidebar  │ Header da página  (52px, border-b)   │
│ 200px    ├──────────────────────────────────────┤
│ (52px    │ Conteúdo (scroll próprio)            │
│ colapsada│ padding 16px, 24px em md+            │
│ )        │                                      │
└──────────┴──────────────────────────────────────┘
```

- Sidebar: `background: var(--wl-surface)`, `border-r`, largura 200px
  (colapsada 52px, transição `width 200ms`). Topo com logo + wordmark em
  faixa de 52px com `border-b`. Rodapé com toggle de tema e menu do
  usuário.
- Item de nav: `rounded-md`, `px-2.5 py-2`, 13px, `font-medium`, ícone
  18px. Ativo: `bg-primary/10 text-primary` e `strokeWidth 2`. Inativo:
  `text-muted-foreground`, hover `bg-[var(--wl-surface-2)]`.
- Header de página: 52px de altura, `px-6`, `border-bottom: 1px solid
  var(--wl-border)`. Contém `h1` 18px semibold → espaçador → busca →
  filtros → botão primário de criação.
- Grid do dashboard: `1fr` + coluna lateral de 280px (`lg`) / 300px
  (`xl`), `gap: 16px`.
- Painel de detalhe: overlay centralizado, `max-width: 600px`,
  `rounded-xl`, `shadow-2xl`, animação `modal-in`. Fecha com `Escape`.

### Mobile (<768px)

```
┌──────────────────────────────┐
│ TopBar 54px (logo, tema, user)│
├──────────────────────────────┤
│ Conteúdo, padding 16px        │
│                    ╭────╮     │
│                    │FAB │     │
├──────────────────────────────┤
│ BottomTabBar 82px (5 tabs)    │
└──────────────────────────────┘
```

- TopBar: 54px, `bg-card`, `border-b`.
- BottomTabBar: 82px, `bg-card`, `border-t`, `pb-safe`. Tab = ícone 20px
  + label 10px, ativo em `text-primary` com `strokeWidth 2`.
- FAB: 56px (`h-14 w-14`), círculo `background: var(--primary)`, ícone
  branco 24px, `shadow-xl`, `bottom: calc(82px + 16px)`, `right: 16px`,
  `active:scale-95`. Só aparece em `md:hidden`.
- Cards viram lista de uma coluna; barra de stats vira grid 2×2.

### Espaçamento

Múltiplos de 4. Padrões mais frequentes: `gap-1` (4) entre ícone e
número · `gap-2` (8) dentro de chips e grupos de botões · `gap-3` (12)
em linhas de lista · `gap-4` (16) entre blocos e cards · `p-4` no
conteúdo mobile, `p-6` no desktop.

---

## 7. Componentes

### Primitivos shadcn instalados

`avatar` `badge` `button` `card` `command` `dialog` `dropdown-menu`
`form` `input` `input-group` `label` `popover` `scroll-area` `select`
`separator` `sheet` `skeleton` `sonner` `table` `tabs` `textarea`
`tooltip`.

**Atenção:** o registry usado é a variante densa. `Button` padrão tem
`h-7` (28px) e `text-xs`; `Input` tem `h-7`. Não são as alturas de 36–40px
do shadcn default.

`Button` — variantes `default` (bg-primary), `outline`, `secondary`,
`ghost`, `destructive` (fundo `destructive/10` + texto destructive, não
fundo sólido vermelho), `link`. Tamanhos `xs` (20px) · `sm` (24px) ·
`default` (28px) · `lg` (32px) e os equivalentes `icon-*` quadrados.
Interação: `active:translate-y-px`, foco em `ring-2 ring-ring/30`.

`Badge` — pílula de 20px, `rounded-full`, texto 10px, ícone 10px.

`Card` — `rounded-lg`, `bg-card`, `ring-1 ring-foreground/10`, padding
vertical 16px e horizontal 16px (12px no `size="sm"`). `CardTitle` usa
`font-heading` 14px `font-medium`.

`Dialog` — centralizado, `max-w-sm` em `sm+`, `rounded-xl`, `p-4`,
`bg-popover`, `ring-1`.

`Toaster` (sonner) — `richColors`, posição `top-right`, ícones lucide
com `strokeWidth 2`.

### Componentes próprios (`src/components/worklog/`)

| Componente | O que é |
|---|---|
| `Logo` | símbolo + wordmark opcional |
| `StatusChip` | pílula de status: ícone + label, fundo `--status-*-bg`, texto e borda na cor do status, `border-radius 5px`, padding `3px 9px`, 12px (`sm`: `2px 7px`, 11px). Variante `iconOnly` = quadrado 22px |
| `PriorityDot` | bolinha de 6px + label, 11px `font-weight 600`, tudo na cor da prioridade |
| `PriorityBar` | label + contagem + trilho de 6px `rounded-full` sobre `--wl-surface-2`, preenchido na cor da prioridade, anima largura em 0.6s |
| `StatusPill` | Ativo/Inativo — texto em `--wl-success`/`--wl-danger`, ou badge com fundo `color-mix(… 14%)` |
| `Tag` | rótulo genérico 11px, `rounded-[3px]`, fundo 10% e borda 16% da cor passada (default: primary) |
| `MonoSpan` | JetBrains Mono 11px `tracking-tight` em `--wl-text-muted` — IDs, timestamps |
| `StatCell` | número 18px semibold `tabular-nums` + label 10px maiúsculo `tracking-wide` em muted. Tons `default` / `warn` (âmbar) / `danger` |
| `EntityCard` | card de entidade `rounded-xl`, `--wl-surface` + borda; selecionado troca a borda por `--primary`; inativo cai para `opacity 0.55` |
| `EmptyState` | ícone 48px em quadrado `rounded-xl` `--wl-surface-2` + título 14px semibold + descrição 12px muted + ação |
| `Timeline` | lista vertical com linha de 1px, marcador circular de 20px, autor + avatar 18px + ação + timestamp; corpo muda por tipo (chips para status, bloco com borda esquerda indigo para nota, diff verde/vermelho para texto) |
| `DonutChart` | SVG puro, `size` 140 e `strokeWidth` 14 por padrão, trilho `--wl-surface-2`, animação na montagem |
| `FilterSelect` | select custom de 34px, `rounded-lg`, `--wl-surface-2` + borda, chevron 13px que rotaciona; dropdown em portal com `shadow-xl` e check indigo no item ativo |
| `ClientCombobox` | busca de cliente com filtragem |
| `WlAvatar` | círculo com iniciais |
| `MobileFab` | botão flutuante de criação |

### Padrão de botão primário de ação (não-shadcn)

As ações principais das páginas (`+ Cliente`, `+ Novo ticket`) usam um
botão custom, mais alto que o `Button` denso:

```
rounded-lg · px-3 py-1.5 · 13px · font-semibold
background: var(--primary) · color: #fff
hover: opacity 0.85
```

Quando existe atalho de teclado, um `<kbd>` de 16px com
`background: rgba(255,255,255,0.25)` fica dentro do botão.

### Campo de busca de header

```
rounded-lg · px-3 py-1.5 · min-width 220px
background: var(--wl-surface-2) · border 1px var(--wl-border)
ícone Search 14px muted + input transparente 13px
placeholder: "Buscar... ( / )"
```

---

## 8. Movimento

Curto e discreto. Nada acima de ~300ms.

| Animação | Duração | Easing |
|---|---|---|
| `modal-in` (scale 0.96→1 + fade) | 200ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `modal-out` | 180ms | `ease-in` |
| `slide-in-right` (painel) | 280ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| `slide-out-right` | 240ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| backdrop fade | 200ms | `ease` |
| colapso da sidebar | 200ms | default |
| barras e donut na montagem | 600ms | `ease` |

Hover em superfícies: troca de cor para `--wl-surface-2`. Hover em
botões coloridos: `opacity 0.85`. Loading: `Loader2` girando ou
`Skeleton` com `animate-pulse`.

---

## 9. Regras para mockups

1. **Dark é o padrão.** Mostre o dark primeiro; se entregar os dois,
   ambos precisam usar a mesma base fria — nunca aqueça o light.
2. **Nunca hardcode um hex** que já exista como token. Use
   `var(--wl-surface)`, `var(--status-open)` etc. Cores de status e
   prioridade sempre vêm do token, jamais de um valor aproximado.
3. **Densidade acima de respiro.** Se o mockup parece confortável demais
   para uma tela de 1440px, ele está errado. Linha de lista ≈ 56px,
   header de página 52px, input 28–34px.
4. **Elevação por borda.** Não espalhe `shadow` em cards. Sombra só em
   overlay.
5. **Indigo é acento, não preenchimento.** Botão primário, item de nav
   ativo, foco, `IN_PROGRESS` e a rampa de chart. Nada de blocos grandes
   de indigo.
6. **Space Grotesk só em wordmark, `h1` e números de stat.** Todo o
   resto é Inter.
7. **Ícones lucide, traço 1.5** (2 dentro de chips). Sem fill, sem
   emoji como ícone de UI.
8. **Todo texto em pt-BR**, usando os labels canônicos da tabela de
   status/prioridade.
9. **Responsivo é dois shells distintos**, não um só encolhido: sidebar
   no desktop, top bar + tab bar + FAB no mobile.
10. **Números em `tabular-nums`.**
11. Estados vazios, carregando e de erro fazem parte do mockup — não são
    detalhe posterior.
12. Acessibilidade: alvo mínimo de 24px em desktop e 44px em mobile;
    contraste AA (4.5:1) para texto, exceto `LOW` no dark, que é
    deliberadamente sussurrado.

---

## 10. Domínio (para preencher mockups com dados plausíveis)

Entidades: **Ticket** (título, descrição, status, prioridade, cliente,
sistema, responsável, notas, histórico) · **Cliente** (nome, ativo/
inativo, tickets agregados) · **Sistema** (pertence a um cliente, código
curto `s-001`) · **Usuário** (nome, e-mail, papéis `ADMIN`/`USER`, ativo).

Rotas: `/dashboard` · `/tickets` · `/clientes` · `/sistemas` ·
`/usuarios` (admin) · `/perfil` · `/login`.

Sem auto-cadastro público: usuários são criados por um admin. `/login` é
só login.

Formatos de data (pt-BR):
`28 jul · 14:32` (data+hora) · `28 jul 2026` (data) ·
`agora`, `12m atrás`, `3h atrás`, `5d atrás` (relativo, cai para data
absoluta acima de 7 dias) · `—` para vazio.

Atalhos de teclado já convencionados: `/` foca a busca · `c` abre o
diálogo de criação · `Escape` fecha painel/diálogo.
