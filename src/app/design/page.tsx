'use client'

import { useTheme } from 'next-themes'

import {
  DonutChart,
  EmptyState,
  Logo,
  MonoSpan,
  PriorityBar,
  PriorityDot,
  StatusChip,
  Tag,
  Timeline,
  type TimelineEntryData,
  WlAvatar,
} from '@/components/worklog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  STATUS_META,
  STATUS_ORDER,
  PRIORITY_ORDER,
} from '@/lib/worklog-meta'

export default function DesignPage() {
  const { theme, setTheme } = useTheme()

  return (
    <div
      className="min-h-screen w-full p-8"
      style={{ background: 'var(--wl-bg)', color: 'var(--wl-text)' }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={32} withWordmark />
            <Badge variant="secondary">design system</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--wl-text-muted)' }}>
              tema: {theme}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              alternar
            </Button>
          </div>
        </header>

        <Section title="StatusChip">
          <div className="flex flex-wrap items-center gap-3">
            {STATUS_ORDER.map((s) => (
              <StatusChip key={s} status={s} />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {STATUS_ORDER.map((s) => (
              <StatusChip key={s} status={s} size="sm" />
            ))}
          </div>
        </Section>

        <Section title="PriorityDot">
          <div className="flex flex-wrap items-center gap-4">
            {PRIORITY_ORDER.map((p) => (
              <PriorityDot key={p} priority={p} />
            ))}
          </div>
        </Section>

        <Section title="Tag">
          <div className="flex flex-wrap items-center gap-3">
            <Tag>ERP Financeiro</Tag>
            <Tag color="#a78bfa">CRM</Tag>
            <Tag color="#f97316">Logística</Tag>
            <Tag color="#34d399">Portal</Tag>
          </div>
        </Section>

        <Section title="Avatar">
          <div className="flex flex-wrap items-center gap-3">
            <WlAvatar name="Lucas Ferreira" />
            <WlAvatar name="Mariana Aguiar" size={36} />
            <WlAvatar name="João Pedro" size={44} />
            <WlAvatar name="Tatiana Rocha" size={56} />
          </div>
        </Section>

        <Section title="MonoSpan + IDs/timestamps">
          <div className="flex flex-col gap-1">
            <MonoSpan>t-001</MonoSpan>
            <MonoSpan>23 abr · 15:11</MonoSpan>
            <MonoSpan>c-014</MonoSpan>
          </div>
        </Section>

        <Section title="Botões">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primário</Button>
            <Button variant="secondary">Secundário</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destrutivo</Button>
            <Button size="sm">Pequeno</Button>
            <Button size="lg">Grande</Button>
          </div>
        </Section>

        <Section title="Inputs">
          <div className="grid max-w-md gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="demo-title">Título</Label>
              <Input id="demo-title" placeholder="Erro ao emitir boleto…" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="demo-desc">Descrição</Label>
              <Textarea
                id="demo-desc"
                placeholder="Descreva o problema, passos para reproduzir…"
                rows={4}
              />
            </div>
          </div>
        </Section>

        <Section title="Donut + PriorityBars">
          <div className="flex flex-wrap items-start gap-8">
            <DonutChart
              data={STATUS_ORDER.map((s, i) => ({
                label: STATUS_META[s].label,
                value: [12, 8, 5, 21, 3][i] ?? 0,
                color: STATUS_META[s].color,
              }))}
              size={160}
            />
            <div className="flex w-64 flex-col gap-3">
              {PRIORITY_ORDER.map((p, i) => (
                <PriorityBar
                  key={p}
                  priority={p}
                  value={[3, 7, 12, 4][i] ?? 0}
                  total={26}
                />
              ))}
            </div>
          </div>
        </Section>

        <Section title="Timeline">
          <div className="max-w-xl">
            <Timeline entries={DEMO_LOGS} />
          </div>
        </Section>

        <Section title="EmptyState">
          <div
            className="rounded-lg border"
            style={{
              borderColor: 'var(--wl-border)',
              background: 'var(--wl-surface)',
            }}
          >
            <EmptyState
              icon="∅"
              title="Nenhum ticket encontrado"
              description="Tente limpar os filtros ou criar um novo registro."
              action={<Button size="sm">+ Novo ticket</Button>}
            />
          </div>
        </Section>
      </div>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2
        className="text-[11px] font-semibold uppercase tracking-[0.08em]"
        style={{ color: 'var(--wl-text-muted)' }}
      >
        {title}
      </h2>
      <div
        className="rounded-lg border p-5"
        style={{
          background: 'var(--wl-surface)',
          borderColor: 'var(--wl-border)',
        }}
      >
        {children}
      </div>
    </section>
  )
}

const DEMO_LOGS: TimelineEntryData[] = [
  {
    id: 'l1',
    field: 'STATUS',
    from: 'OPEN',
    to: 'IN_PROGRESS',
    authorName: 'Lucas Ferreira',
    ts: '2026-04-23T14:30:00Z',
  },
  {
    id: 'l2',
    field: 'NOTE',
    from: null,
    to: 'Encaminhado para a equipe de dev. PR em análise.',
    authorName: 'Lucas Ferreira',
    ts: '2026-04-23T15:10:00Z',
  },
  {
    id: 'l3',
    field: 'DESCRIPTION',
    from: 'Cliente relata erro ao gerar boleto.',
    to: 'Cliente relata erro ao gerar boleto. Confirmado na versão 3.2.1.',
    authorName: 'Mariana Aguiar',
    ts: '2026-04-23T16:02:00Z',
  },
  {
    id: 'l4',
    field: 'STATUS',
    from: 'IN_PROGRESS',
    to: 'AWAITING_DEV',
    authorName: 'Mariana Aguiar',
    ts: '2026-04-23T16:18:00Z',
  },
]
