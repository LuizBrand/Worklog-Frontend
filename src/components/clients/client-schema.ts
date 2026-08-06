/**
 * Schema e payload do formulário de cliente.
 *
 * Lógica pura, fora do componente, porque é aqui que mora a regra que o backend
 * cobra e o `tsc` não vê: checksum por tipo, exatamente uma matriz, documento
 * único, no máximo um contato principal. Testado em `client-schema.test.ts`.
 *
 * Regras e limites: docs/api/CONTRATO-CLIENTES.md · src/api/clients-contract.ts.
 */
import { z } from 'zod/v3'

import { ClientType, MAX_LENGTH } from '@/api/clients-contract'
import type {
  AddressRequest,
  BranchRequest,
  ClientRequest,
  ContactRequest,
  ContactType,
  RegimeTributario,
} from '@/api/clients-contract'
import { isValidDocumento, stripDigits, stripDocumento } from '@/lib/documento'

// ── Schema ────────────────────────────────────────────────────────────────────

const addressSchema = z.object({
  // Só dígitos contam: o usuário digita com máscara.
  cep: z
    .string()
    .refine((v) => v === '' || stripDigits(v).length === MAX_LENGTH.cep, 'CEP deve ter 8 dígitos'),
  logradouro: z.string().max(MAX_LENGTH.logradouro),
  numero: z.string().max(MAX_LENGTH.numero),
  complemento: z.string().max(MAX_LENGTH.complemento),
  bairro: z.string().max(MAX_LENGTH.bairro),
  cidade: z.string().max(MAX_LENGTH.cidade),
  uf: z.string().max(MAX_LENGTH.uf, 'UF tem 2 letras'),
})

const contatoSchema = z.object({
  tipo: z.enum(['EMAIL', 'TELEFONE', 'CELULAR', 'WHATSAPP']),
  valor: z.string().max(MAX_LENGTH.contatoValor),
  descricao: z.string().max(MAX_LENGTH.contatoDescricao),
  principal: z.boolean(),
})

const branchSchema = z.object({
  /** `publicId` só existe em filial que já veio da API — é o que decide PATCH vs POST. */
  publicId: z.string().optional(),
  documento: z.string().min(1, 'Documento obrigatório'),
  isMatriz: z.boolean(),
  apelido: z.string().max(MAX_LENGTH.apelido),
  inscricaoEstadual: z.string().max(MAX_LENGTH.inscricaoEstadual),
  inscricaoMunicipal: z.string().max(MAX_LENGTH.inscricaoMunicipal),
  address: addressSchema,
  contatos: z.array(contatoSchema),
})

export const clientFormSchema = z
  .object({
    tipo: z.enum([ClientType.PJ, ClientType.PF], { required_error: 'Tipo obrigatório' }),
    name: z.string().trim().min(1, 'Nome obrigatório').max(MAX_LENGTH.clientName),
    nomeFantasia: z.string().max(MAX_LENGTH.nomeFantasia),
    regimeTributario: z.union([
      z.enum(['SIMPLES_NACIONAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL', 'MEI', 'IMUNE', 'ISENTO']),
      z.literal(''),
    ]),
    systemsPublicIds: z.array(z.string()),
    branches: z.array(branchSchema).min(1, 'Informe ao menos a matriz'),
  })
  .superRefine((values, ctx) => {
    const matrizes = values.branches.filter((b) => b.isMatriz).length
    if (matrizes !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['branches'],
        message: matrizes === 0 ? 'Uma filial precisa ser a matriz' : 'Só pode haver uma matriz',
      })
    }

    // PF não tem filial: o cadastro é a própria pessoa (§9 do contrato).
    if (values.tipo === ClientType.PF && values.branches.length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['branches'],
        message: 'Pessoa física não tem filiais',
      })
    }

    const vistos = new Map<string, number>()
    values.branches.forEach((branch, i) => {
      const doc = stripDocumento(branch.documento)

      if (doc && !isValidDocumento(doc, values.tipo)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['branches', i, 'documento'],
          message: values.tipo === ClientType.PJ ? 'CNPJ inválido' : 'CPF inválido',
        })
      }

      // O backend garante unicidade global do documento; repetir no mesmo
      // payload só descobre isso depois de metade das filiais já ter sido criada.
      if (doc) {
        const primeiro = vistos.get(doc)
        if (primeiro === undefined) vistos.set(doc, i)
        else {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['branches', i, 'documento'],
            message: 'Documento repetido neste cadastro',
          })
        }
      }

      const preenchidos = branch.contatos.filter((c) => c.valor.trim())
      if (preenchidos.filter((c) => c.principal).length > 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['branches', i, 'contatos'],
          message: 'Marque só um contato principal',
        })
      }

      branch.contatos.forEach((contato, j) => {
        // Contato em branco é linha não preenchida do repetidor e some no
        // payload; só reclama quando o usuário marcou algo além do valor.
        const vazio = !contato.valor.trim()
        if (vazio && (contato.descricao.trim() || contato.principal)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['branches', i, 'contatos', j, 'valor'],
            message: 'Informe o contato ou limpe a linha',
          })
        }
      })
    })
  })

export type ClientFormValues = z.infer<typeof clientFormSchema>
export type BranchFormValues = ClientFormValues['branches'][number]
export type ContactFormValues = BranchFormValues['contatos'][number]

// ── Valores iniciais ──────────────────────────────────────────────────────────

export function emptyContato(): ContactFormValues {
  return { tipo: 'EMAIL', valor: '', descricao: '', principal: false }
}

export function emptyBranch(): BranchFormValues {
  return {
    documento: '',
    isMatriz: false,
    apelido: '',
    inscricaoEstadual: '',
    inscricaoMunicipal: '',
    address: {
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: '',
    },
    // Dois slots fixos, "Contato" e "Telefone", que o formulário compacto
    // renderiza. Vazios somem do payload — ver `toContactRequests`.
    contatos: [emptyContato(), { ...emptyContato(), tipo: 'CELULAR' }],
  }
}

export function emptyClientForm(tipo: ClientType): ClientFormValues {
  return {
    tipo,
    name: '',
    nomeFantasia: '',
    regimeTributario: '',
    systemsPublicIds: [],
    branches: [{ ...emptyBranch(), isMatriz: true }],
  }
}

// ── Payload ───────────────────────────────────────────────────────────────────

/** String vazia é ausência de valor, não valor vazio — o backend valida `@Size`. */
function limpo(value: string | null | undefined): string | undefined {
  const v = value?.trim()
  return v ? v : undefined
}

export function toAddressRequest(address: BranchFormValues['address']): AddressRequest | undefined {
  const out: AddressRequest = {}
  const cep = stripDigits(address.cep)
  if (cep) out.cep = cep
  if (limpo(address.logradouro)) out.logradouro = address.logradouro.trim()
  if (limpo(address.numero)) out.numero = address.numero.trim()
  if (limpo(address.complemento)) out.complemento = address.complemento.trim()
  if (limpo(address.bairro)) out.bairro = address.bairro.trim()
  if (limpo(address.cidade)) out.cidade = address.cidade.trim()
  if (limpo(address.uf)) out.uf = address.uf.trim().toUpperCase()
  return Object.keys(out).length > 0 ? out : undefined
}

export function toContactRequests(
  contatos: ContactFormValues[],
): ContactRequest[] | undefined {
  const out = contatos
    .filter((c) => c.valor.trim())
    .map((c) => {
      const contato: ContactRequest = {
        tipo: c.tipo as ContactType,
        valor: c.valor.trim(),
      }
      if (limpo(c.descricao)) contato.descricao = c.descricao.trim()
      // `principal` ausente equivale a false no contrato — não mandar ruído.
      if (c.principal) contato.principal = true
      return contato
    })
  return out.length > 0 ? out : undefined
}

export function toBranchRequest(branch: BranchFormValues): BranchRequest {
  const out: BranchRequest = { documento: stripDocumento(branch.documento) }
  if (branch.isMatriz) out.isMatriz = true
  if (limpo(branch.apelido)) out.apelido = branch.apelido.trim()
  if (limpo(branch.inscricaoEstadual)) out.inscricaoEstadual = branch.inscricaoEstadual.trim()
  if (limpo(branch.inscricaoMunicipal)) out.inscricaoMunicipal = branch.inscricaoMunicipal.trim()

  const address = toAddressRequest(branch.address)
  if (address) out.address = address

  const contatos = toContactRequests(branch.contatos)
  if (contatos) out.contatos = contatos

  return out
}

/**
 * Payload do `POST /clients/`.
 *
 * Sem `enabled`: o backend ignora o campo no create e o cliente sempre nasce
 * ativo.
 */
export function toClientRequest(values: ClientFormValues): ClientRequest {
  const payload: ClientRequest = {
    tipo: values.tipo,
    name: values.name.trim(),
    branches: values.branches.map(toBranchRequest),
  }
  if (limpo(values.nomeFantasia)) payload.nomeFantasia = values.nomeFantasia.trim()
  if (values.regimeTributario) payload.regimeTributario = values.regimeTributario as RegimeTributario
  if (values.systemsPublicIds.length > 0) payload.systemsPublicIds = values.systemsPublicIds
  return payload
}
