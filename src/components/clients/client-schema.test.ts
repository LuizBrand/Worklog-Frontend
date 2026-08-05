import { describe, expect, it } from 'vitest'

import {
  clientFormSchema,
  emptyBranch,
  emptyClientForm,
  toClientRequest,
  type ClientFormValues,
} from './client-schema'

const CNPJ_A = '11222333000181'
const CNPJ_B = '44555666000181'
const CPF = '11144477735'

/** PJ válido com uma matriz — base dos casos negativos. */
function pjValido(): ClientFormValues {
  return {
    ...emptyClientForm('PJ'),
    name: 'Acme Industria LTDA',
    branches: [{ ...emptyBranch(), documento: CNPJ_A, isMatriz: true }],
  }
}

function erros(values: ClientFormValues): string[] {
  const r = clientFormSchema.safeParse(values)
  return r.success ? [] : r.error.issues.map((i) => i.path.join('.'))
}

describe('clientFormSchema', () => {
  it('aceita PJ com matriz', () => {
    expect(clientFormSchema.safeParse(pjValido()).success).toBe(true)
  })

  it('aceita PF com matriz de CPF', () => {
    const pf: ClientFormValues = {
      ...emptyClientForm('PF'),
      name: 'Joao da Silva',
      branches: [{ ...emptyBranch(), documento: CPF, isMatriz: true }],
    }
    expect(clientFormSchema.safeParse(pf).success).toBe(true)
  })

  it('exige nome', () => {
    expect(erros({ ...pjValido(), name: '' })).toContain('name')
    expect(erros({ ...pjValido(), name: '   ' })).toContain('name')
  })

  it('limita o nome a 100 caracteres', () => {
    expect(erros({ ...pjValido(), name: 'a'.repeat(101) })).toContain('name')
    expect(erros({ ...pjValido(), name: 'a'.repeat(100) })).not.toContain('name')
  })

  it('exige pelo menos uma filial', () => {
    expect(erros({ ...pjValido(), branches: [] })).toContain('branches')
  })

  it('exige exatamente uma matriz', () => {
    const semMatriz = {
      ...pjValido(),
      branches: [{ ...emptyBranch(), documento: CNPJ_A, isMatriz: false }],
    }
    expect(erros(semMatriz)).toContain('branches')

    const duasMatrizes = {
      ...pjValido(),
      branches: [
        { ...emptyBranch(), documento: CNPJ_A, isMatriz: true },
        { ...emptyBranch(), documento: CNPJ_B, isMatriz: true },
      ],
    }
    expect(erros(duasMatrizes)).toContain('branches')
  })

  it('valida o checksum conforme o tipo do cliente', () => {
    // CPF numa PJ e CNPJ numa PF são erro, mesmo com checksum bom.
    expect(erros({ ...pjValido(), branches: [{ ...emptyBranch(), documento: CPF, isMatriz: true }] }))
      .toContain('branches.0.documento')

    const pfComCnpj: ClientFormValues = {
      ...emptyClientForm('PF'),
      name: 'Joao',
      branches: [{ ...emptyBranch(), documento: CNPJ_A, isMatriz: true }],
    }
    expect(erros(pfComCnpj)).toContain('branches.0.documento')
  })

  it('aceita documento mascarado e alfanumérico', () => {
    const mascarado = {
      ...pjValido(),
      branches: [{ ...emptyBranch(), documento: '11.222.333/0001-81', isMatriz: true }],
    }
    expect(clientFormSchema.safeParse(mascarado).success).toBe(true)

    const alfa = {
      ...pjValido(),
      branches: [{ ...emptyBranch(), documento: '12ABC34501DE35', isMatriz: true }],
    }
    expect(clientFormSchema.safeParse(alfa).success).toBe(true)
  })

  // `documento` é único GLOBALMENTE no backend; mandar repetido no mesmo
  // payload garante 409 depois de já ter criado metade das filiais.
  it('rejeita documento repetido entre filiais, ignorando a máscara', () => {
    const repetido = {
      ...pjValido(),
      branches: [
        { ...emptyBranch(), documento: CNPJ_A, isMatriz: true },
        { ...emptyBranch(), documento: '11.222.333/0001-81', isMatriz: false },
      ],
    }
    expect(erros(repetido)).toContain('branches.1.documento')
  })

  it('aceita no máximo um contato principal por filial', () => {
    const doisPrincipais = {
      ...pjValido(),
      branches: [
        {
          ...emptyBranch(),
          documento: CNPJ_A,
          isMatriz: true,
          contatos: [
            { tipo: 'EMAIL' as const, valor: 'a@x.com', descricao: '', principal: true },
            { tipo: 'CELULAR' as const, valor: '11988887777', descricao: '', principal: true },
          ],
        },
      ],
    }
    expect(erros(doisPrincipais)).toContain('branches.0.contatos')
  })

  // Linha em branco é linha do repetidor que o usuário não preencheu: some no
  // payload em vez de bloquear o submit.
  it('deixa passar contato totalmente em branco', () => {
    const emBranco = {
      ...pjValido(),
      branches: [
        {
          ...emptyBranch(),
          documento: CNPJ_A,
          isMatriz: true,
          contatos: [{ tipo: 'EMAIL' as const, valor: '  ', descricao: '', principal: false }],
        },
      ],
    }
    expect(erros(emBranco)).toEqual([])
  })

  it('reclama de contato sem valor quando algo mais foi preenchido', () => {
    const comDescricao = {
      ...pjValido(),
      branches: [
        {
          ...emptyBranch(),
          documento: CNPJ_A,
          isMatriz: true,
          contatos: [{ tipo: 'EMAIL' as const, valor: '', descricao: 'Financeiro', principal: false }],
        },
      ],
    }
    expect(erros(comDescricao)).toContain('branches.0.contatos.0.valor')

    const marcadoPrincipal = {
      ...pjValido(),
      branches: [
        {
          ...emptyBranch(),
          documento: CNPJ_A,
          isMatriz: true,
          contatos: [{ tipo: 'EMAIL' as const, valor: '', descricao: '', principal: true }],
        },
      ],
    }
    expect(erros(marcadoPrincipal)).toContain('branches.0.contatos.0.valor')
  })

  it('aplica os limites de tamanho do backend', () => {
    const longo = {
      ...pjValido(),
      nomeFantasia: 'a'.repeat(101),
      branches: [
        {
          ...emptyBranch(),
          documento: CNPJ_A,
          isMatriz: true,
          inscricaoEstadual: 'a'.repeat(21),
          address: { ...emptyBranch().address, uf: 'SPX', cidade: 'a'.repeat(101) },
        },
      ],
    }
    const paths = erros(longo)
    expect(paths).toContain('nomeFantasia')
    expect(paths).toContain('branches.0.inscricaoEstadual')
    expect(paths).toContain('branches.0.address.uf')
    expect(paths).toContain('branches.0.address.cidade')
  })

  it('exige CEP com 8 dígitos quando preenchido', () => {
    const cepCurto = {
      ...pjValido(),
      branches: [
        {
          ...emptyBranch(),
          documento: CNPJ_A,
          isMatriz: true,
          address: { ...emptyBranch().address, cep: '0131010' },
        },
      ],
    }
    expect(erros(cepCurto)).toContain('branches.0.address.cep')
    // vazio é válido: endereço inteiro é opcional
    expect(clientFormSchema.safeParse(pjValido()).success).toBe(true)
  })

  // PF tem só a matriz (§9 do contrato) — a seção de filiais nem aparece.
  it('rejeita PF com mais de uma filial', () => {
    const pfComFilial: ClientFormValues = {
      ...emptyClientForm('PF'),
      name: 'Joao',
      branches: [
        { ...emptyBranch(), documento: CPF, isMatriz: true },
        { ...emptyBranch(), documento: '39053344705', isMatriz: false },
      ],
    }
    expect(erros(pfComFilial)).toContain('branches')
  })
})

describe('toClientRequest', () => {
  it('normaliza documento e omite os campos vazios', () => {
    const values: ClientFormValues = {
      ...pjValido(),
      nomeFantasia: '',
      regimeTributario: '',
      branches: [
        {
          ...emptyBranch(),
          documento: '11.222.333/0001-81',
          isMatriz: true,
          apelido: '  ',
        },
      ],
    }

    const payload = toClientRequest(values)

    expect(payload.tipo).toBe('PJ')
    expect(payload.branches[0].documento).toBe('11222333000181')
    expect(payload.branches[0].isMatriz).toBe(true)
    // Campo vazio vira ausência, não string vazia: o backend valida @Size e
    // trataria "" como valor informado.
    expect(payload.nomeFantasia).toBeUndefined()
    expect(payload.regimeTributario).toBeUndefined()
    expect(payload.branches[0].apelido).toBeUndefined()
    expect(payload.branches[0].address).toBeUndefined()
    expect(payload.branches[0].contatos).toBeUndefined()
  })

  it('não manda `enabled`: o backend ignora no create e o cliente nasce ativo', () => {
    expect('enabled' in toClientRequest(pjValido())).toBe(false)
  })

  it('leva endereço e contatos quando preenchidos', () => {
    const values: ClientFormValues = {
      ...pjValido(),
      branches: [
        {
          ...emptyBranch(),
          documento: CNPJ_A,
          isMatriz: true,
          address: {
            cep: '01310-100',
            logradouro: 'Av. Paulista',
            numero: '1200',
            complemento: '',
            bairro: 'Bela Vista',
            cidade: 'São Paulo',
            uf: 'sp',
          },
          contatos: [{ tipo: 'EMAIL', valor: ' ana@acme.com ', descricao: '', principal: true }],
        },
      ],
    }

    const branch = toClientRequest(values).branches[0]

    expect(branch.address).toEqual({
      cep: '01310100',
      logradouro: 'Av. Paulista',
      numero: '1200',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      uf: 'SP',
    })
    expect(branch.contatos).toEqual([
      { tipo: 'EMAIL', valor: 'ana@acme.com', principal: true },
    ])
  })

  it('descarta contato sem valor em vez de mandar lixo para a API', () => {
    const values: ClientFormValues = {
      ...pjValido(),
      branches: [
        {
          ...emptyBranch(),
          documento: CNPJ_A,
          isMatriz: true,
          contatos: [
            { tipo: 'EMAIL', valor: '', descricao: '', principal: false },
            { tipo: 'CELULAR', valor: '11988887777', descricao: 'Comercial', principal: false },
          ],
        },
      ],
    }

    // `principal` sai do payload quando é false — ausente equivale a false.
    expect(toClientRequest(values).branches[0].contatos).toEqual([
      { tipo: 'CELULAR', valor: '11988887777', descricao: 'Comercial' },
    ])
  })
})
