/**
 * Carga e diff do formulário de edição de cliente.
 *
 * O `PATCH /clients/{id}` **ignora `branches`** (§4.4 do contrato), mas o dialog
 * edita a matriz junto com o cliente. Por isso salvar é orquestração, não uma
 * chamada: PATCH do cliente → PATCH da matriz → POST de cada filial nova.
 * Não é atômico e não tem como ser — a UI diz isso em vez de fingir transação.
 *
 * Aqui mora só a parte pura: o que carregar, o que mudou e qual payload sai.
 * Testado em `client-save.test.ts`.
 */
import {
  ClientType,
  matrizDoCliente,
  type BranchResponse,
  type BranchUpdateRequest,
  type ClientResponse,
  type ClientUpdateRequest,
  type RegimeTributario,
} from '@/api/clients-contract'
import { formatDocumento, stripDocumento } from '@/lib/documento'
import {
  emptyBranch,
  toAddressRequest,
  toBranchRequest,
  toContactRequests,
  type BranchFormValues,
  type ClientFormValues,
} from './client-schema'

// ── Carga ─────────────────────────────────────────────────────────────────────

export function branchToFormValues(branch: BranchResponse): BranchFormValues {
  const vazio = emptyBranch()
  return {
    publicId: branch.publicId,
    // Mascarado para exibição; `toBranchRequest` normaliza de volta no envio.
    documento: formatDocumento(branch.documento) === '—' ? '' : formatDocumento(branch.documento),
    isMatriz: branch.isMatriz,
    apelido: branch.apelido ?? '',
    inscricaoEstadual: branch.inscricaoEstadual ?? '',
    inscricaoMunicipal: branch.inscricaoMunicipal ?? '',
    address: branch.address
      ? {
          cep: branch.address.cep ?? '',
          logradouro: branch.address.logradouro ?? '',
          numero: branch.address.numero ?? '',
          complemento: branch.address.complemento ?? '',
          bairro: branch.address.bairro ?? '',
          cidade: branch.address.cidade ?? '',
          uf: branch.address.uf ?? '',
        }
      : vazio.address,
    contatos: branch.contatos.map((c) => ({
      tipo: c.tipo,
      valor: c.valor,
      descricao: c.descricao ?? '',
      principal: c.principal,
    })),
  }
}

export function clientToFormValues(client: ClientResponse): ClientFormValues {
  const matriz = matrizDoCliente(client)
  const outras = client.branches.filter((b) => b.publicId !== matriz?.publicId)
  const ordenadas = matriz ? [matriz, ...outras] : outras

  return {
    tipo: client.tipo,
    name: client.name,
    nomeFantasia: client.nomeFantasia ?? '',
    regimeTributario: client.regimeTributario ?? '',
    systemsPublicIds: client.systems.map((s) => s.publicId),
    branches: ordenadas.map(branchToFormValues),
  }
}

// ── Diff ──────────────────────────────────────────────────────────────────────

/** Só o que mudou. `null` quando não há nada para mandar. */
export function toClientUpdateRequest(
  original: ClientResponse,
  values: ClientFormValues,
): ClientUpdateRequest | null {
  const patch: ClientUpdateRequest = {}

  if (values.tipo !== original.tipo) patch.tipo = values.tipo as ClientType
  if (values.name.trim() !== original.name) patch.name = values.name.trim()
  if (values.nomeFantasia.trim() !== (original.nomeFantasia ?? '')) {
    patch.nomeFantasia = values.nomeFantasia.trim()
  }
  if (values.regimeTributario !== (original.regimeTributario ?? '')) {
    patch.regimeTributario = values.regimeTributario as RegimeTributario
  }

  // `systemsPublicIds` presente substitui a lista inteira, então só entra se o
  // conjunto mudou de fato — ordem não conta.
  const antes = original.systems.map((s) => s.publicId).slice().sort()
  const depois = values.systemsPublicIds.slice().sort()
  if (antes.length !== depois.length || antes.some((id, i) => id !== depois[i])) {
    patch.systemsPublicIds = values.systemsPublicIds
  }

  return Object.keys(patch).length > 0 ? patch : null
}

/**
 * Só o que mudou na filial. `null` quando não há nada para mandar.
 *
 * `isMatriz` nunca sai daqui: promover filial é `PATCH { isMatriz: true }`
 * disparado pela tela de filiais, com confirmação própria (§9.4).
 */
export function toBranchUpdateRequest(
  original: BranchResponse,
  values: BranchFormValues,
): BranchUpdateRequest | null {
  const patch: BranchUpdateRequest = {}

  const doc = stripDocumento(values.documento)
  if (doc !== (original.documento ?? '')) patch.documento = doc

  if (values.apelido.trim() !== (original.apelido ?? '')) patch.apelido = values.apelido.trim()
  if (values.inscricaoEstadual.trim() !== (original.inscricaoEstadual ?? '')) {
    patch.inscricaoEstadual = values.inscricaoEstadual.trim()
  }
  if (values.inscricaoMunicipal.trim() !== (original.inscricaoMunicipal ?? '')) {
    patch.inscricaoMunicipal = values.inscricaoMunicipal.trim()
  }

  // `address` é objeto embutido: vai completo ou não vai.
  const addressAtual = toAddressRequest(values.address) ?? {}
  const addressOriginal = original.address
    ? toAddressRequest(branchToFormValues(original).address) ?? {}
    : {}
  if (JSON.stringify(addressAtual) !== JSON.stringify(addressOriginal)) {
    patch.address = addressAtual
  }

  // §9.3: `contatos` presente SUBSTITUI a lista inteira e recria os contatos —
  // por isso vai completo, sempre, quando qualquer um mudou.
  const contatosAtuais = toContactRequests(values.contatos) ?? []
  const contatosOriginais = toContactRequests(branchToFormValues(original).contatos) ?? []
  if (JSON.stringify(contatosAtuais) !== JSON.stringify(contatosOriginais)) {
    patch.contatos = contatosAtuais
  }

  return Object.keys(patch).length > 0 ? patch : null
}

/**
 * Filiais que ainda não existem na API — as que o repetidor criou.
 *
 * `isMatriz` sai do payload: enviar `true` no POST volta 422 (§9.2).
 */
export function filiaisNovas(values: ClientFormValues) {
  return values.branches
    .filter((b) => !b.publicId)
    .map((b) => {
      const request = toBranchRequest({ ...b, isMatriz: false })
      return request
    })
}
