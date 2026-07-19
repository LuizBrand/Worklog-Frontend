# Identidade Visual — WorkLog

Fonte da verdade da marca. Assets originais em `nova-branding/`
(gitignored). Este arquivo existe para que a identidade sobreviva sem
depender daquela pasta.

Adotada em 2026-07-19, substituindo o tema "Mira + Sky" (base quente
bege/marrom + accent sky `#0ea5e9`, hue OKLCH 255.8).

---

## Conceito

Símbolo: quadrado com cantos arredondados (`rx` = 0.25 do lado) contendo
um traço zigzag fechado por um ponto no canto superior direito. O guide
original descreve como "linha de atividade / log em forma de gráfico",
mas a leitura visual é um **W** inequívoco — e isso é intencional que se
preserve, pois dá continuidade com a marca anterior, que era literalmente
a letra "W".

Grafia do nome: **WorkLog**, com L maiúsculo. Alinhada com o `title` da
API do backend. Os SVGs entregues em `nova-branding/logo/` escrevem
"Worklog" no wordmark e precisam de ajuste.

## Símbolo — geometria

Do `nova-branding/logo/worklog-symbol.svg`, viewBox `0 0 88 88`:

```
rect  width=88 height=88 rx=22            (rx/lado = 0.25)
path  M22 33 L34.5 67 L50.4 40 L58.4 57.5 L66 33
      fill=none stroke-width=7
      stroke-linecap=round stroke-linejoin=round
circle cx=72 cy=27 r=2
```

**A variante indigo é a única em uso** — fundo `#6366F1`, traço branco.
É o `worklog-symbol.svg` entregue, sem modificação, tanto na interface
quanto nos favicons.

A variante escura (`#14161A` + traço `#818CF8`) dos PNGs em
`nova-branding/favicon/` foi descartada em 2026-07-19: na interface o
quadrado sumia contra o `--wl-bg` `#0B0B10`, e como favicon o usuário
achou o fundo preto ruim. Não usar.

Os favicons são **gerados**, não copiados: `scripts/generate-icons.mjs`
renderiza o símbolo no Chromium via Playwright — o mesmo motor que
desenha `logo.tsx` — e emite `src/app/icon.png` (192, cantos
arredondados, RGBA) e `src/app/apple-icon.png` (180, quadrado cheio sem
alpha, porque o iOS aplica a própria máscara e um PNG já arredondado
ficaria com cantos duplos).

Ao mudar o símbolo, editar `logo.tsx` **e** rodar o script — as duas
cópias da geometria precisam andar juntas.

Tamanho mínimo: 16px (o favicon de 16px lê bem). O `BRAND_GUIDE.md`
original diz 24px, o que contradiz a própria entrega.

Espaço de proteção: metade da largura do símbolo em volta.

## Paleta

Accent indigo. `#6366F1` e `#818CF8` são exatamente `indigo-500` e
`indigo-400` do Tailwind, então os valores OKLCH abaixo são os oficiais
do Tailwind v4 — sem conversão manual.

```
primary  light   oklch(0.585 0.233 277.117)   #6366F1
primary  dark    oklch(0.673 0.182 276.935)   #818CF8
```

O hue `277.117` propaga para `ring`, `accent`, `sidebar-*` e
`chart-1..5`, seguindo o padrão que o tema anterior já usava com 255.8.

### Superfícies (`--wl-*`, hex cru)

Base neutra **fria nos dois modos**. Decisão deliberada de não seguir o
nude `#EDEBE6` do guide, que deixaria o tema claro quente e o escuro
frio — irmãos com temperaturas diferentes.

| Token | Dark | Light |
|---|---|---|
| `--wl-bg` | `#0B0B10` (tinta) | `#F2F2F4` |
| `--wl-surface` | `#1C1D26` (grafite) | `#FFFFFF` |
| `--wl-surface-2` | `#262835` | `#E8E8EC` |
| `--wl-border` | `#2A2C38` | `#DEDEE3` |
| `--wl-border-2` | `#383A48` | `#C9C9D1` |
| `--wl-text` | `#E8E9ED` | `#0B0B10` |
| `--wl-text-muted` | `#8A8794` | `#6B6875` |
| `--wl-text-dim` | `#55535E` | `#A3A0AC` |

### Status

Os tokens de status colorem o **texto** dos chips, não só o
preenchimento. Âmbar e jade são de luminância média: ótimos como fill
sobre fundo escuro, ilegíveis como texto sobre tinta clara. Por isso o
tema claro usa variantes escurecidas no mesmo hue, e o escuro fica com
os hex de marca.

**Método importa:** escurecer o tom de marca multiplicando o RGB
*dessatura* e produz cores sujas (a âmbar caiu para 47% de saturação e
virou marrom). O tema claro usa tons escuros e **saturados** (83–98%),
que são vivos e passam AA.

| Status | Dark (marca) | Light (saturado) |
|---|---|---|
| `OPEN` | `#E8A33D` âmbar | `#B45309` |
| `IN_PROGRESS` | `#818CF8` indigo-400 | `#4F46E5` |
| `AWAITING_DEV` | `#38BDF8` azul | `#0369A1` |
| `RESOLVED` | `#2FAE7C` jade | `#047857` |
| `CANCELLED` | `#84818D` | `#5A5860` |

`AWAITING_DEV` é azul por decisão do usuário (2026-07-19) — o cinza
ficava apagado demais. Hue ~200, distante o bastante dos ~243/277 do
indigo para não colidir com `IN_PROGRESS`.

Fundos dos chips (light): `#FEF3C7` open, `#E0E7FF` progress,
`#E0F2FE` awaiting, `#D1FAE5` resolved, `#F1F0F3` cancelled.

### Prioridade

| | Dark | Light |
|---|---|---|
| `CRITICAL` | `#E2564E` | `#D3443C` |
| `HIGH` | `#E8A33D` | `#9B6D29` |
| `MEDIUM` | `#8A8794` | `#787581` |
| `LOW` | `#7A7784` | `#55535E` |

A escala de prioridade é uma **hierarquia** — crítico grita, baixo
sussurra. `LOW` no escuro fica em 3.83:1 de propósito, abaixo de AA.
Todos os outros 20 pares token/fundo passam AA (4.5:1).

### Semânticos

`--wl-danger: #D6453D` · `--wl-success: #2FAE7C`

Tokens novos, criados para absorver os ~30 hex hardcoded espalhados em
componentes.

### Neutros do shadcn

`--background`, `--card`, `--popover`, `--muted`, `--secondary`,
`--border` e `--input` apontam para os **mesmos hex** da escala
`--wl-*`. São a mesma superfície; mantê-los como valores independentes
(como era antes) fazia `--background` e `--wl-bg` divergirem — branco
puro contra bege. A UI tem ~69 usos de `bg-muted` / `bg-popover` /
`text-muted-foreground`, então a deriva aparecia em popovers, dropdowns
e skeletons.

Só o accent permanece em OKLCH, porque a rampa `chart-1..5` se beneficia
da interpolação perceptual.

### Desvios deliberados do BRAND_GUIDE.md

O guide define só âmbar e jade como cores de estado e proíbe indigo
decorativo. Isso não cobre um app com 5 status, 4 prioridades e ações
destrutivas. Dois desvios aprovados:

1. **`#D6453D` adicionado** como danger. O guide não tem vermelho, e o
   app tem excluir cliente / desativar sistema / desativar usuário.
2. **Indigo-claro liberado para `IN_PROGRESS`.** É o estado mais
   frequente do app e semanticamente "a atividade acontecendo" — a cor
   da marca cabe. Sem isso, 3 dos 5 status virariam cinza.

## Tipografia

- **Space Grotesk** 600–700 — títulos e marca. Via `next/font/google`,
  ligada a `--font-heading` (que já existia em `globals.css` como alias
  inerte de `--font-sans`).
- **Inter** 400–600 — texto de interface. Mantida do tema anterior.
- **JetBrains Mono** — mono, mantida.

Space Grotesk tem personalidade demais para uso amplo numa UI densa de
tickets. Aplicar **apenas** em: wordmark, títulos de página e números
grandes de stat. Não em headings de card.

Tracking: negativo em títulos grandes (-0.01 a -0.02em), positivo em
rótulos maiúsculos pequenos (+0.08 a +0.12em).

## Raio

`--radius: 0.5rem` mantido, com a escala derivada por multiplicação que
já existe. O símbolo usa 0.25 e o logo anterior usava 0.27 — a geometria
não conflita.

## Onde a marca vive no código

- `src/app/globals.css` — todos os tokens
- `src/app/layout.tsx` — fontes, `metadata`, favicons
- `src/components/worklog/logo.tsx` — símbolo + wordmark
- `src/lib/worklog-meta.ts` — `STATUS_META`, `PRIORITY_META`,
  `AVATAR_COLORS`
- `src/app/design/page.tsx` — showcase vivo, usar para verificação visual
