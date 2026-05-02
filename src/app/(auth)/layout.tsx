export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left — form panel */}
      <div
        className="flex flex-1 flex-col items-center justify-center px-6 py-12"
        style={{ background: 'var(--wl-surface)' }}
      >
        {children}
      </div>

      {/* Right — marketing panel (desktop only) */}
      <div
        className="hidden lg:flex w-1/2 flex-col items-center justify-center px-12 py-16"
        style={{
          background: 'var(--wl-bg)',
          backgroundImage:
            'radial-gradient(var(--wl-border) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        <div className="max-w-sm space-y-6">
          <p
            className="text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: 'var(--primary)' }}
          >
            Registro de Atendimentos
          </p>
          <h2
            className="text-3xl font-bold leading-snug"
            style={{ color: 'var(--wl-text)' }}
          >
            Gerencie seus tickets de suporte com eficiência
          </h2>
          <p className="text-[15px]" style={{ color: 'var(--wl-text-muted)' }}>
            Centralize atendimentos, acompanhe status em tempo real e colabore
            com sua equipe em um só lugar.
          </p>
          <div className="flex flex-wrap gap-2">
            {['Tickets', 'Clientes', 'Sistemas', 'Equipes'].map((tag) => (
              <span
                key={tag}
                className="rounded-full px-3 py-1 text-[12px] font-medium"
                style={{
                  color: 'var(--primary)',
                  border:
                    '1px solid color-mix(in oklch, var(--primary) 30%, transparent)',
                  background:
                    'color-mix(in oklch, var(--primary) 10%, transparent)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
