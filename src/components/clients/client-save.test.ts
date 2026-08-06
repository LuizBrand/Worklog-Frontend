import { describe, expect, it } from 'vitest'

import {
  branchToFormValues,
  clientToFormValues,
  filiaisNovas,
  toBranchUpdateRequest,
  toClientUpdateRequest,
} from './client-save'
import { emptyBranch } from './client-schema'
import type { BranchResponse, ClientResponse } from '@/api/clients-contract'

const matriz: BranchResponse = {
  publicId: 'b-matriz',
  documento: '11222333000181',
  isMatriz: true,
  apelido: 'Matriz',
  inscricaoEstadual: '123456789110',
  inscricaoMunicipal: null,
  address: {
    cep: '01310100',
    logradouro: 'Av. Paulista',
    numero: '1200',
    complemento: null,
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    uf: 'SP',
  },
  contatos: [
    { publicId: 'c1', tipo: 'EMAIL', valor: 'ana@acme.com', descricao: null, principal: true },
    { publicId: 'c2', tipo: 'CELULAR', valor: '11988887777', descricao: 'Comercial', principal: false },
  ],
  enabled: true,
}

const cliente: ClientResponse = {
  publicId: 'cli-1',
  tipo: 'PJ',
  name: 'Acme Industria LTDA',
  nomeFantasia: 'Acme',
  regimeTributario: 'LUCRO_PRESUMIDO',
  enabled: true,
  createdAt: '2026-03-14T12:00:00Z',
  systems: [{ publicId: 's1', name: 'Nephos', enabled: true }],
  branches: [matriz],
}

describe('clientToFormValues', () => {
  it('carrega o cliente no formato do formulário', () => {
    const values = clientToFormValues(cliente)

    expect(values.tipo).toBe('PJ')
    expect(values.name).toBe('Acme Industria LTDA')
    expect(values.nomeFantasia).toBe('Acme')
    expect(values.regimeTributario).toBe('LUCRO_PRESUMIDO')
    expect(values.systemsPublicIds).toEqual(['s1'])
    expect(values.branches).toHaveLength(1)
    expect(values.branches[0].publicId).toBe('b-matriz')
    expect(values.branches[0].isMatriz).toBe(true)
  })

  // Null da API vira string vazia: input controlado do RHF não aceita null.
  it('troca null por string vazia', () => {
    const semNada: ClientResponse = {
      ...cliente,
      nomeFantasia: null,
      regimeTributario: null,
      branches: [{ ...matriz, apelido: null, inscricaoEstadual: null, address: null, contatos: [] }],
    }
    const values = clientToFormValues(semNada)

    expect(values.nomeFantasia).toBe('')
    expect(values.regimeTributario).toBe('')
    expect(values.branches[0].apelido).toBe('')
    expect(values.branches[0].inscricaoEstadual).toBe('')
    expect(values.branches[0].address).toEqual(emptyBranch().address)
    // Dois slots vazios ("Contato" e "Telefone") em vez de lista vazia: é o que
    // o formulário compacto renderiza. Vazios não vão para o payload.
    expect(values.branches[0].contatos).toEqual(emptyBranch().contatos)
  })

  it('põe a matriz primeiro', () => {
    const filial: BranchResponse = { ...matriz, publicId: 'b-filial', documento: '44555666000181', isMatriz: false }
    const values = clientToFormValues({ ...cliente, branches: [filial, matriz] })

    expect(values.branches.map((b) => b.publicId)).toEqual(['b-matriz', 'b-filial'])
  })

  it('mascara o documento para exibição', () => {
    expect(clientToFormValues(cliente).branches[0].documento).toBe('11.222.333/0001-81')
  })
})

describe('toClientUpdateRequest', () => {
  it('devolve null quando nada mudou', () => {
    expect(toClientUpdateRequest(cliente, clientToFormValues(cliente))).toBeNull()
  })

  it('manda só o campo alterado', () => {
    const values = { ...clientToFormValues(cliente), name: 'Acme Industria S.A.' }
    expect(toClientUpdateRequest(cliente, values)).toEqual({ name: 'Acme Industria S.A.' })
  })

  it('permite limpar nomeFantasia', () => {
    const values = { ...clientToFormValues(cliente), nomeFantasia: '' }
    expect(toClientUpdateRequest(cliente, values)).toEqual({ nomeFantasia: '' })
  })

  it('trata a lista de sistemas como substituição, e ignora a ordem', () => {
    const base = clientToFormValues(cliente)

    expect(toClientUpdateRequest(cliente, { ...base, systemsPublicIds: [] })).toEqual({
      systemsPublicIds: [],
    })
    expect(
      toClientUpdateRequest({ ...cliente, systems: [
        { publicId: 's1', name: 'Nephos', enabled: true },
        { publicId: 's2', name: 'Outro', enabled: true },
      ] }, { ...base, systemsPublicIds: ['s2', 's1'] }),
    ).toBeNull()
  })

  it('nunca manda branches: o PATCH de cliente as ignora', () => {
    const values = { ...clientToFormValues(cliente), name: 'Outro nome' }
    expect('branches' in (toClientUpdateRequest(cliente, values) ?? {})).toBe(false)
  })
})

describe('toBranchUpdateRequest', () => {
  const form = () => branchToFormValues(matriz)

  it('devolve null quando nada mudou', () => {
    expect(toBranchUpdateRequest(matriz, form())).toBeNull()
  })

  it('manda o documento normalizado quando muda', () => {
    expect(toBranchUpdateRequest(matriz, { ...form(), documento: '44.555.666/0001-81' })).toEqual({
      documento: '44555666000181',
    })
  })

  it('ignora mudança só de máscara no documento', () => {
    expect(toBranchUpdateRequest(matriz, { ...form(), documento: '11222333000181' })).toBeNull()
  })

  // §9.3 do contrato: `contatos` presente SUBSTITUI a lista inteira.
  it('manda a lista de contatos completa quando um contato muda', () => {
    const values = form()
    values.contatos[1].valor = '11977776666'

    const patch = toBranchUpdateRequest(matriz, values)

    expect(patch?.contatos).toHaveLength(2)
    expect(patch?.contatos?.[0]).toEqual({ tipo: 'EMAIL', valor: 'ana@acme.com', principal: true })
    expect(patch?.contatos?.[1].valor).toBe('11977776666')
  })

  it('remover contato manda a lista restante, não uma remoção', () => {
    const values = form()
    values.contatos = [values.contatos[0]]

    expect(toBranchUpdateRequest(matriz, values)?.contatos).toHaveLength(1)
  })

  it('esvaziar os contatos manda lista vazia', () => {
    const values = form()
    values.contatos = []

    expect(toBranchUpdateRequest(matriz, values)?.contatos).toEqual([])
  })

  it('address vai completo quando qualquer parte muda', () => {
    const values = form()
    values.address.numero = '1500'

    const patch = toBranchUpdateRequest(matriz, values)

    expect(patch?.address).toEqual({
      cep: '01310100',
      logradouro: 'Av. Paulista',
      numero: '1500',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      uf: 'SP',
    })
  })

  it('nunca manda isMatriz: promover é operação própria', () => {
    const values = { ...form(), isMatriz: false, apelido: 'Outro' }
    expect('isMatriz' in (toBranchUpdateRequest(matriz, values) ?? {})).toBe(false)
  })
})

describe('filiaisNovas', () => {
  it('devolve só as filiais sem publicId', () => {
    const values = clientToFormValues(cliente)
    const nova = { ...emptyBranch(), documento: '44555666000181' }
    values.branches.push(nova)

    const novas = filiaisNovas(values)

    expect(novas).toHaveLength(1)
    expect(novas[0].documento).toBe('44555666000181')
  })

  it('não manda isMatriz no POST — enviar true volta 422 (§9.2)', () => {
    const values = clientToFormValues(cliente)
    values.branches.push({ ...emptyBranch(), documento: '44555666000181', isMatriz: true })

    expect('isMatriz' in filiaisNovas(values)[0]).toBe(false)
  })

  it('devolve vazio quando não há filial nova', () => {
    expect(filiaisNovas(clientToFormValues(cliente))).toEqual([])
  })
})
