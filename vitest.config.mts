import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * Testes de lógica pura, em ambiente node.
 *
 * Sem jsdom e sem @testing-library de propósito: componente é verificado por
 * screenshot + asserção de valor computado (ver .agent/visual/ e a §8 do
 * AGENTS.md), e um render test aqui só duplicaria isso. O que quebra neste
 * projeto é contrato — checksum de documento, tradução de `fieldErrors`,
 * mapeamento de status da API, schema do formulário. É isso que mora aqui.
 *
 * Se um dia precisar renderizar componente, o caminho é
 * `pnpm add -D jsdom @testing-library/react @vitejs/plugin-react` e trocar
 * `environment` — não reescrever esta config.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
