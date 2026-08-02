/**
 * Contrato do módulo de Clientes, escrito à mão.
 *
 * Os tipos gerados pelo Orval marcam como opcional todo campo que não tem
 * `@NotNull` no backend — `name`, `branches` e `contatos[].valor` saem
 * opcionais lá, mas a API rejeita com 400 se vierem vazios. Use ESTE arquivo
 * no módulo de clientes e faça cast na fronteira do Orval.
 *
 * Regras de negócio, erros e fluxo de tela: docs/api/CONTRATO-CLIENTES.md.
 * URLs e query string são do Orval + do paramsSerializer de src/lib/api.ts —
 * este arquivo não duplica rota nenhuma.
 */

// ── Enums ─────────────────────────────────────────────────────────────────────

export const ClientType = {
  PJ: 'PJ',
  PF: 'PF',
} as const
export type ClientType = (typeof ClientType)[keyof typeof ClientType]

export const RegimeTributario = {
  SIMPLES_NACIONAL: 'SIMPLES_NACIONAL',
  LUCRO_PRESUMIDO: 'LUCRO_PRESUMIDO',
  LUCRO_REAL: 'LUCRO_REAL',
  MEI: 'MEI',
  IMUNE: 'IMUNE',
  ISENTO: 'ISENTO',
} as const
export type RegimeTributario = (typeof RegimeTributario)[keyof typeof RegimeTributario]

export const ContactType = {
  EMAIL: 'EMAIL',
  TELEFONE: 'TELEFONE',
  CELULAR: 'CELULAR',
  WHATSAPP: 'WHATSAPP',
} as const
export type ContactType = (typeof ContactType)[keyof typeof ContactType]

export const StatusFiltro = {
  ATIVO: 'ATIVO',
  INATIVO: 'INATIVO',
  TODOS: 'TODOS',
} as const
export type StatusFiltro = (typeof StatusFiltro)[keyof typeof StatusFiltro]

// ── Labels (o backend não envia label) ────────────────────────────────────────

export const CLIENT_TYPE_LABEL: Record<ClientType, string> = {
  PJ: 'Pessoa Jurídica',
  PF: 'Pessoa Física',
}

export const REGIME_TRIBUTARIO_LABEL: Record<RegimeTributario, string> = {
  SIMPLES_NACIONAL: 'Simples Nacional',
  LUCRO_PRESUMIDO: 'Lucro Presumido',
  LUCRO_REAL: 'Lucro Real',
  MEI: 'MEI',
  IMUNE: 'Imune',
  ISENTO: 'Isento',
}

export const CONTACT_TYPE_LABEL: Record<ContactType, string> = {
  EMAIL: 'E-mail',
  TELEFONE: 'Telefone',
  CELULAR: 'Celular',
  WHATSAPP: 'WhatsApp',
}

// ── Limites de tamanho (espelham as validações do backend) ────────────────────

export const MAX_LENGTH = {
  clientName: 100,
  nomeFantasia: 100,
  apelido: 100,
  inscricaoEstadual: 20,
  inscricaoMunicipal: 20,
  contatoValor: 150,
  contatoDescricao: 100,
  cep: 8,
  logradouro: 150,
  numero: 20,
  complemento: 100,
  bairro: 100,
  cidade: 100,
  uf: 2,
} as const

// ── Requests ──────────────────────────────────────────────────────────────────

/** Endereço da filial. Tudo opcional. O backend normaliza `cep` (só dígitos) e `uf` (maiúsculas). */
export interface AddressRequest {
  cep?: string | null
  logradouro?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  cidade?: string | null
  uf?: string | null
}

/** Contato da filial. No máximo UM com `principal: true` por filial. */
export interface ContactRequest {
  tipo: ContactType
  /** Obrigatório e não vazio. O backend não valida o formato por tipo. */
  valor: string
  descricao?: string | null
  /** Ausente/null equivale a false. */
  principal?: boolean | null
}

/**
 * Filial no create do cliente e no POST do sub-recurso.
 *
 * `documento`: CPF se o cliente é PF, CNPJ se é PJ, com checksum válido. Pode
 * ir com máscara — o backend remove e aplica maiúsculas (CNPJ alfanumérico).
 */
export interface BranchRequest {
  documento: string
  /**
   * Só no POST /clients/ (exatamente uma filial com true). No
   * POST /clients/{id}/branches, enviar `true` volta 422 — promover é PATCH.
   */
  isMatriz?: boolean | null
  apelido?: string | null
  inscricaoEstadual?: string | null
  inscricaoMunicipal?: string | null
  address?: AddressRequest | null
  contatos?: ContactRequest[] | null
}

/**
 * POST /clients/ — atenção à barra final.
 *
 * `enabled` não existe aqui: o backend ignora o campo no create e o cliente
 * sempre nasce ativo.
 */
export interface ClientRequest {
  tipo: ClientType
  /** Obrigatório, não vazio, até 100. Nome repetido volta 409. */
  name: string
  nomeFantasia?: string | null
  regimeTributario?: RegimeTributario | null
  /** Opcional. Omitido ou `[]` cria cliente sem sistema associado. */
  systemsPublicIds?: string[] | null
  /** Obrigatório, não vazio, com EXATAMENTE uma filial `isMatriz: true`. */
  branches: BranchRequest[]
}

/**
 * PATCH /clients/{publicId} — só os campos presentes e não nulos são aplicados.
 *
 * Filiais NÃO se editam por aqui; use o sub-recurso.
 * `systemsPublicIds` presente substitui a lista inteira (`[]` remove todas).
 */
export interface ClientUpdateRequest {
  tipo?: ClientType
  name?: string
  nomeFantasia?: string
  regimeTributario?: RegimeTributario
  systemsPublicIds?: string[]
  /** Diferente do create: aqui `enabled` é aplicado. */
  enabled?: boolean
}

/**
 * PATCH /clients/{publicId}/branches/{branchId} — só os campos presentes e não
 * nulos são aplicados.
 *
 * `contatos` presente SUBSTITUI a lista inteira: para editar um contato, envie
 * todos os que devem permanecer. Os contatos são recriados, então o `publicId`
 * deles muda — não guarde essas referências entre operações. O mesmo vale para
 * `address`, que é objeto embutido e vai completo.
 *
 * Não há `enabled`: ativar/inativar tem endpoint próprio.
 */
export interface BranchUpdateRequest {
  documento?: string
  /** `true` promove esta filial e rebaixa a matriz atual. `false` na matriz → 422. */
  isMatriz?: boolean
  apelido?: string
  inscricaoEstadual?: string
  inscricaoMunicipal?: string
  address?: AddressRequest
  contatos?: ContactRequest[]
}

/** Query params de GET /clients. Todos opcionais e combináveis (AND). */
export interface ClientFiltersParams {
  /** LIKE case-insensitive, parcial. */
  name?: string
  /** Omitido = todos. */
  status?: StatusFiltro
  tipo?: ClientType
  /** Aceita com máscara. Igualdade exata contra qualquer filial do cliente. */
  documento?: string
  systems?: string[]
}

// ── Responses ─────────────────────────────────────────────────────────────────

export interface AddressResponse {
  cep: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  uf: string | null
}

export interface ContactResponse {
  publicId: string
  tipo: ContactType
  valor: string
  descricao: string | null
  principal: boolean
}

export interface BranchResponse {
  publicId: string
  /** Null apenas em filiais de legado, criadas antes da fase 1. */
  documento: string | null
  isMatriz: boolean
  apelido: string | null
  inscricaoEstadual: string | null
  inscricaoMunicipal: string | null
  address: AddressResponse | null
  contatos: ContactResponse[]
  enabled: boolean
}

export interface ClientSystemResponse {
  publicId: string
  name: string
  enabled: boolean
}

export interface ClientResponse {
  publicId: string
  tipo: ClientType
  name: string
  nomeFantasia: string | null
  regimeTributario: RegimeTributario | null
  enabled: boolean
  /** ISO-8601 com offset UTC: "2026-07-29T13:45:12.123456Z" */
  createdAt: string
  systems: ClientSystemResponse[]
  /** Sempre array, lista vazia em vez de null. O documento do cliente está aqui. */
  branches: BranchResponse[]
}

/**
 * GET /clients/lookup — dados da Receita já no formato do formulário. Nada é
 * persistido.
 *
 * Campos que voltam SEMPRE em branco com o provedor público:
 * `branches[].inscricaoEstadual`, `branches[].inscricaoMunicipal` e
 * `branches[].contatos[].principal`. `regimeTributario` só vem quando o
 * provedor afirma MEI ou Simples Nacional.
 */
export interface CnpjLookupResponse {
  tipo: 'PJ'
  /** Razão social. */
  name: string | null
  /** Só preenchido quando o CNPJ consultado é matriz. */
  nomeFantasia: string | null
  regimeTributario: RegimeTributario | null
  /** Texto da situação na Receita: "Ativa", "Suspensa", "Baixada"... */
  situacaoCadastral: string | null
  /** false = CNPJ não ativo. É AVISO, não bloqueio: o cadastro pode seguir. */
  situacaoAtiva: boolean
  /** Sempre um item, correspondente ao CNPJ consultado. */
  branches: BranchRequest[]
}

// ── Regras de estado (habilitar/desabilitar ações na UI) ──────────────────────
//
// Nenhuma delas olha role: o gate ADMIN de inativar/reativar fica no
// componente, junto do `isAdmin` da sessão.

/** Filial pode ser promovida a matriz: precisa estar ativa e não ser a matriz. */
export function canPromoteToMatriz(branch: BranchResponse, client: ClientResponse): boolean {
  return client.enabled && branch.enabled && !branch.isMatriz
}

/** A matriz nunca pode ser inativada: promova outra filial antes. */
export function canDeactivateBranch(branch: BranchResponse, client: ClientResponse): boolean {
  return client.enabled && branch.enabled && !branch.isMatriz
}

/** PF tem apenas a matriz: só reativa se não houver outra filial ativa. */
export function canActivateBranch(
  branch: BranchResponse,
  client: ClientResponse,
  allBranches: BranchResponse[],
): boolean {
  if (!client.enabled || branch.enabled) return false
  if (client.tipo === ClientType.PF) {
    return !allBranches.some((b) => b.enabled)
  }
  return true
}

/** Criar filial: só cliente PJ ativo. */
export function canCreateBranch(client: ClientResponse): boolean {
  return client.enabled && client.tipo === ClientType.PJ
}

/** Editar dados da filial exige apenas cliente ativo — filial inativa é editável. */
export function canEditBranch(client: ClientResponse): boolean {
  return client.enabled
}

/** A matriz do cliente. Todo cliente tem exatamente uma. */
export function matrizDoCliente(client: ClientResponse): BranchResponse | null {
  return client.branches.find((b) => b.isMatriz) ?? null
}

/** O documento "do cliente" é o da matriz. */
export function documentoDoCliente(client: ClientResponse): string | null {
  return matrizDoCliente(client)?.documento ?? null
}

/** Contato a exibir para uma filial: o principal, senão o primeiro. */
export function contatoPrincipal(branch: BranchResponse | null): ContactResponse | null {
  if (!branch) return null
  return branch.contatos.find((c) => c.principal) ?? branch.contatos[0] ?? null
}

/** Filiais que contam como "filial" na UI: todas menos a matriz. */
export function filiaisSemMatriz(client: ClientResponse): BranchResponse[] {
  return client.branches.filter((b) => !b.isMatriz)
}
