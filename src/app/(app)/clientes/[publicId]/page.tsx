'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useFindClientByPublicId, useUpdateClient } from '@/api/generated/clientes/clientes'
import { activateBranch, deactivateBranch, updateBranch } from '@/api/generated/filiais/filiais'
import { invalidateBranches, invalidateClient, invalidateClients } from '@/api/invalidate'
import { BranchesDialog } from '@/components/clients/branches-dialog'
import { BranchEditDialog } from '@/components/clients/branch-edit-dialog'
import { apiErrorToMessage } from '@/lib/api-errors'
import { formatDocumento } from '@/lib/documento'
import { matrizDoCliente } from '@/api/clients-contract'
import type { BranchResponse } from '@/api/clients-contract'
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
  const [showBranches, setShowBranches] = useState(false)
  const [editBranch, setEditBranch] = useState<BranchResponse | null>(null)
  const [promoteBranch, setPromoteBranch] = useState<BranchResponse | null>(null)
  const [toggleBranch, setToggleBranch] = useState<BranchResponse | null>(null)

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

  // Promover mexe em duas linhas — a filial sobe e a matriz atual desce —, então
  // invalida a lista de filiais e o cliente (§9.4 do contrato).
  const promoteMut = useMutation({
    mutationFn: (branch: BranchResponse) =>
      updateBranch(publicId, branch.publicId, { isMatriz: true }),
    onSuccess: () => {
      invalidateBranches(qc, publicId)
      invalidateClient(qc, publicId)
      invalidateClients(qc)
      toast.success('Matriz transferida')
      setPromoteBranch(null)
    },
    onError: (err) => {
      toast.error(apiErrorToMessage(err, 'Não foi possível transferir a matriz'))
      setPromoteBranch(null)
    },
  })

  const branchEnabledMut = useMutation({
    mutationFn: (branch: BranchResponse) =>
      branch.enabled
        ? deactivateBranch(publicId, branch.publicId)
        : activateBranch(publicId, branch.publicId),
    onSuccess: (_data, branch) => {
      invalidateBranches(qc, publicId)
      invalidateClient(qc, publicId)
      invalidateClients(qc)
      toast.success(branch.enabled ? 'Filial inativada' : 'Filial reativada')
      setToggleBranch(null)
    },
    onError: (err) => {
      toast.error(apiErrorToMessage(err, 'Não foi possível alterar a filial'))
      setToggleBranch(null)
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
        <ClientDataCard
          client={client}
          onEdit={() => setShowEdit(true)}
          onVerFiliais={() => setShowBranches(true)}
        />

        <div className="flex flex-col gap-5">
          <ClientContractPlaceholder />
          <ClientSystemsCard client={client} onEdit={() => setShowEdit(true)} />
        </div>
      </div>

      <ClientTicketsCard
        clientPublicId={publicId}
        onTicketClick={(ticketId) => router.push(`/tickets?id=${ticketId}`)}
      />

      {showEdit && <ClientEditDialog client={client} onClose={() => setShowEdit(false)} />}

      {showBranches && (
        <BranchesDialog
          client={client}
          isAdmin={isAdmin}
          onClose={() => setShowBranches(false)}
          onEditBranch={setEditBranch}
          onPromote={setPromoteBranch}
          onToggleEnabled={setToggleBranch}
        />
      )}

      {editBranch && (
        <BranchEditDialog client={client} branch={editBranch} onClose={() => setEditBranch(null)} />
      )}

      {promoteBranch && (
        <ConfirmDialog
          title="Definir como matriz?"
          message={`A filial ${promoteBranch.apelido || formatDocumento(promoteBranch.documento)} passa a ser a matriz, e ${matrizDoCliente(client)?.apelido || formatDocumento(matrizDoCliente(client)?.documento)} deixa de ser.`}
          confirmLabel="Definir como matriz"
          loading={promoteMut.isPending}
          onCancel={() => setPromoteBranch(null)}
          onConfirm={() => promoteMut.mutate(promoteBranch)}
        />
      )}

      {toggleBranch && (
        <ConfirmDialog
          title={toggleBranch.enabled ? 'Inativar filial?' : 'Reativar filial?'}
          message={
            toggleBranch.enabled
              ? `A filial ${toggleBranch.apelido || formatDocumento(toggleBranch.documento)} será marcada como inativa.`
              : `A filial ${toggleBranch.apelido || formatDocumento(toggleBranch.documento)} voltará a ser ativa.`
          }
          confirmLabel={toggleBranch.enabled ? 'Inativar' : 'Reativar'}
          danger={toggleBranch.enabled}
          loading={branchEnabledMut.isPending}
          onCancel={() => setToggleBranch(null)}
          onConfirm={() => branchEnabledMut.mutate(toggleBranch)}
        />
      )}

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
