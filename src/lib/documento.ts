/**
 * CPF e CNPJ: validação de checksum, máscara para exibição e normalização
 * para envio.
 *
 * O backend normaliza `documento` (remove máscara, aplica maiúsculas) e valida
 * o checksum. Validar aqui evita round-trip e, no caso do lookup de CNPJ,
 * economiza cota do provedor público (5 consultas/min por IP).
 *
 * CNPJ aceita o formato alfanumérico vigente desde 2026: os 12 primeiros
 * caracteres podem ser dígitos ou letras A–Z, e o checksum usa o valor
 * ASCII − 48 de cada caractere. Os 2 dígitos verificadores são sempre dígitos.
 */

const CNPJ_D1_WEIGHTS = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
const CNPJ_D2_WEIGHTS = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

/** Remove máscara e espaços, e aplica maiúsculas — o formato que a API recebe. */
export function stripDocumento(value: string): string {
  return value.replace(/[^0-9A-Za-z]/g, '').toUpperCase()
}

/** Só dígitos. Para CEP e telefone, que não têm letras. */
export function stripDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export function isValidCpf(value: string): boolean {
  const cpf = stripDigits(value)
  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false

  const digits = cpf.split('').map(Number)

  let sum = 0
  for (let i = 0; i < 9; i++) sum += digits[i] * (10 - i)
  const d1 = ((sum * 10) % 11) % 10
  if (d1 !== digits[9]) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += digits[i] * (11 - i)
  const d2 = ((sum * 10) % 11) % 10
  return d2 === digits[10]
}

export function isValidCnpj(value: string): boolean {
  const cnpj = stripDocumento(value)
  if (cnpj.length !== 14) return false
  if (!/^[0-9A-Z]{12}\d{2}$/.test(cnpj)) return false
  if (/^(.)\1{13}$/.test(cnpj)) return false

  // Peso de cada caractere: ASCII − 48. Para dígitos isso é o próprio valor;
  // para letras, 'A' vale 17.
  const values = cnpj.split('').map((c) => c.charCodeAt(0) - 48)

  const checkDigit = (weights: number[]) => {
    let sum = 0
    for (let i = 0; i < weights.length; i++) sum += values[i] * weights[i]
    const rest = sum % 11
    return rest < 2 ? 0 : 11 - rest
  }

  if (checkDigit(CNPJ_D1_WEIGHTS) !== values[12]) return false
  return checkDigit(CNPJ_D2_WEIGHTS) === values[13]
}

/** Valida o documento conforme o tipo do cliente: PF → CPF, PJ → CNPJ. */
export function isValidDocumento(value: string, tipo: 'PJ' | 'PF'): boolean {
  return tipo === 'PF' ? isValidCpf(value) : isValidCnpj(value)
}

/** `12345678000190` → `12.345.678/0001-90`. Aceita alfanumérico. */
export function formatCnpj(value: string): string {
  const cnpj = stripDocumento(value)
  if (cnpj.length !== 14) return value
  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`
}

/** `12345678901` → `123.456.789-01`. */
export function formatCpf(value: string): string {
  const cpf = stripDigits(value)
  if (cpf.length !== 11) return value
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`
}

/**
 * Formata para exibição inferindo pelo tamanho, porque `BranchResponse.documento`
 * é `string | null` e filiais de legado podem vir sem documento.
 */
export function formatDocumento(value: string | null | undefined): string {
  if (!value) return '—'
  const doc = stripDocumento(value)
  if (doc.length === 11) return formatCpf(doc)
  if (doc.length === 14) return formatCnpj(doc)
  return value
}

/** `01001000` → `01001-000`. */
export function formatCep(value: string | null | undefined): string {
  if (!value) return ''
  const cep = stripDigits(value)
  if (cep.length !== 8) return value
  return `${cep.slice(0, 5)}-${cep.slice(5)}`
}

/** `11999998888` → `(11) 99999-8888`; 10 dígitos → `(11) 9999-8888`. */
export function formatTelefone(value: string | null | undefined): string {
  if (!value) return ''
  const tel = stripDigits(value)
  if (tel.length === 11) return `(${tel.slice(0, 2)}) ${tel.slice(2, 7)}-${tel.slice(7)}`
  if (tel.length === 10) return `(${tel.slice(0, 2)}) ${tel.slice(2, 6)}-${tel.slice(6)}`
  return value
}

/**
 * A busca da listagem é um campo só ("nome, CNPJ ou CPF"). Quando o texto
 * parece documento, vai no filtro `documento`, que casa por igualdade exata
 * contra qualquer filial; senão vai em `name`, que é LIKE parcial.
 */
export function looksLikeDocumento(value: string): boolean {
  const doc = stripDocumento(value)
  if (doc.length !== 11 && doc.length !== 14) return false
  return /^[0-9A-Z]+$/.test(doc) && /\d/.test(doc)
}
