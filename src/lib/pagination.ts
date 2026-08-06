/** Quantas páginas cabem antes de a barra precisar de reticências. */
const JANELA = 7

/**
 * Números de página a exibir, base 0. `null` é reticência.
 *
 * Sempre inclui a primeira e a última, mais a vizinhança da página atual, e
 * mantém a largura da barra estável — daí a janela deslizante em vez de
 * simplesmente `page-1..page+1`.
 */
export function paginasVisiveis(page: number, totalPages: number): (number | null)[] {
  if (totalPages <= 0) return []
  if (totalPages <= JANELA) return Array.from({ length: totalPages }, (_, i) => i)

  const out: (number | null)[] = [0]
  const inicio = Math.max(1, Math.min(page - 1, totalPages - 4))
  const fim = Math.min(totalPages - 2, Math.max(page + 1, 3))

  if (inicio > 1) out.push(null)
  for (let p = inicio; p <= fim; p++) out.push(p)
  if (fim < totalPages - 2) out.push(null)

  out.push(totalPages - 1)
  return out
}

/** Texto "1–12 de 137" do rodapé da tabela. */
export function intervaloDaPagina(page: number, size: number, numberOfElements: number) {
  const primeiro = page * size + 1
  return { primeiro, ultimo: page * size + numberOfElements }
}
