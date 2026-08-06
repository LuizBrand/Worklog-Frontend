import { describe, expect, it } from 'vitest'

import { intervaloDaPagina, paginasVisiveis } from '@/lib/pagination'

describe('paginasVisiveis', () => {
  it('mostra tudo quando cabe na janela', () => {
    expect(paginasVisiveis(0, 1)).toEqual([0])
    expect(paginasVisiveis(0, 2)).toEqual([0, 1])
    expect(paginasVisiveis(3, 7)).toEqual([0, 1, 2, 3, 4, 5, 6])
  })

  it('devolve vazio sem páginas', () => {
    expect(paginasVisiveis(0, 0)).toEqual([])
  })

  it('sempre inclui primeira e última', () => {
    for (const page of [0, 5, 9, 19]) {
      const v = paginasVisiveis(page, 20)
      expect(v[0], `page ${page}`).toBe(0)
      expect(v[v.length - 1], `page ${page}`).toBe(19)
    }
  })

  it('inclui a página atual em qualquer posição', () => {
    for (let page = 0; page < 20; page++) {
      expect(paginasVisiveis(page, 20), `page ${page}`).toContain(page)
    }
  })

  it('não repete número nem põe reticência na ponta', () => {
    for (let page = 0; page < 20; page++) {
      const v = paginasVisiveis(page, 20)
      const nums = v.filter((p): p is number => p !== null)
      expect(new Set(nums).size, `page ${page}`).toBe(nums.length)
      expect(v[0]).not.toBeNull()
      expect(v[v.length - 1]).not.toBeNull()
      // Reticência só faz sentido cobrindo um salto maior que 1.
      v.forEach((p, i) => {
        if (p !== null) return
        const antes = v[i - 1] as number
        const depois = v[i + 1] as number
        expect(depois - antes, `page ${page}, gap em ${i}`).toBeGreaterThan(1)
      })
    }
  })

  it('mantém a largura estável no meio da lista', () => {
    const larguras = new Set([5, 10, 14].map((p) => paginasVisiveis(p, 20).length))
    expect(larguras.size).toBe(1)
  })

  it('cresce direto de números na primeira e na última página', () => {
    expect(paginasVisiveis(0, 20).slice(0, 4)).toEqual([0, 1, 2, 3])
    expect(paginasVisiveis(19, 20).slice(-4)).toEqual([16, 17, 18, 19])
  })
})

describe('intervaloDaPagina', () => {
  it('conta a partir de 1 para exibição', () => {
    expect(intervaloDaPagina(0, 12, 12)).toEqual({ primeiro: 1, ultimo: 12 })
    expect(intervaloDaPagina(1, 12, 12)).toEqual({ primeiro: 13, ultimo: 24 })
  })

  it('usa numberOfElements na última página', () => {
    expect(intervaloDaPagina(1, 10, 1)).toEqual({ primeiro: 11, ultimo: 11 })
  })
})
