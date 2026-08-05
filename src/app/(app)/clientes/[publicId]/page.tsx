'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useFindClientByPublicId, useUpdateClient } from '@/api/generated/clientes/clientes'
import { invalidateClient, invalidateClients } from '@/api/invalidate'
import { ClientDetailHeader } from '@/components/clients/client-detail-header'
import { ClientDataCard } from '@/components/clients/client-data-card'
import { ClientSystemsCard } from '@/components/clients/client-systems-card'
import { ClientContractPlaceholder } from '@/components/clients/client-contract-placeholder'
import { ClientTicketsCard } from '@/components/clients/client-tickets-card'
import { ClientEditDialog } from '@/components/clients/client-edit-dialog'
import { ConfirmDialog, EmptyState } from '@/components/worklog'
import { useAuthStore } from '@/state/auth'
import type { ClientResponse } from '@/api/clients-contract'

export default function ClienteDetalhePage({
  params,
}: {
  params: Promise<{ publicId: string }>
}) {
  const { publicId } = use(params)
  const router = useRouter()
  const qc = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)
  const isAdmin = currentUser?.roles?.some((r) => r.role === 'ADMIN') ?? false

  const [showEdit, setShowEdit] = useState(false)
  const [confirmToggle, setConfirmToggle] = useState(false)

  const clientQ = useFindClientByPublicId(publicId)
  // Fronteira do Orval: o gerado marca todo campo sem @NotNull como opcional.
  // `src/api/clients-contract.ts` é a obrigatoriedade real.
  const client = clientQ.data as unknown as ClientResponse | undefined

  const toggleMut = useUpdateClient({
    mutation: {
      onSuccess: () => {
        invalidateClient(qc, publicId)
        invalidateClients(qc)
        toast.success(client?.enabled ? 'Cliente desativado' : 'Cliente reativado')
        setConfirmToggle(false)
      },
      onError: () => setConfirmToggle(false),
    },
  })

  if (clientQ.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={20} className="animate-spin" style={{ color: 'var(--wl-text-muted)' }} />
      </div>
    )
  }

  if (clientQ.isError || !client) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          title="Cliente não encontrado"
          description="O cliente não existe ou foi removido."
          action={
            <Link
              href="/clientes"
              className="rounded-lg px-3 py-1.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-85"
              style={{ background: 'var(--primary)' }}
            >
              Voltar para clientes
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 px-4 py-5 md:px-6">
      <ClientDetailHeader
        client={client}
        canToggleActive={isAdmin}
        onToggleActive={() => setConfirmToggle(true)}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <ClientDataCard client={client} onEdit={() => setShowEdit(true)} />

        <div className="flex flex-col gap-5">
          <ClientContractPlaceholder />
          <ClientSystemsCard client={client} />
        </div>
      </div>

      <ClientTicketsCard
        clientPublicId={publicId}
        onTicketClick={(ticketId) => router.push(`/tickets?id=${ticketId}`)}
      />

      {showEdit && <ClientEditDialog client={client} onClose={() => setShowEdit(false)} />}

      {confirmToggle && (
        <ConfirmDialog
          title={client.enabled ? 'Desativar cliente?' : 'Reativar cliente?'}
          message={
            client.enabled
              ? `O cliente "${client.name}" será marcado como inativo.`
              : `O cliente "${client.name}" voltará a ser ativo.`
          }
          confirmLabel={client.enabled ? 'Desativar' : 'Reativar'}
          danger={client.enabled}
          loading={toggleMut.isPending}
          onCancel={() => setConfirmToggle(false)}
          onConfirm={() => toggleMut.mutate({ publicId, data: { enabled: !client.enabled } })}
        />
      )}
    </div>
  )
}
