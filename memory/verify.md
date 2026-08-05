# Definition of Done

Every task's verification criteria must pass before it is marked complete
in `progress.md`. No exceptions.

## Text Verification (always required)

- [ ] Type-check passes in strict mode (project's type-checker)
- [ ] Lint passes (all configured linters, zero warnings)
- [ ] Tests pass (existing + new tests for new code)

## Tactile Verification (when code executes)

- [ ] Code was actually run — not just written. Script ran, endpoint
  responded, CLI output observed.
- [ ] Logs checked — no unexpected errors, warnings, or deprecations.
- [ ] At least one happy path and one edge case exercised manually.

## Visual Verification (UI changes only)

- [ ] Screenshot captured via Playwright (`.agent-md/bin/playwright-capture.sh`)
- [ ] VLM or human review confirms visual intent matches the spec
- [ ] No self-grading ("the code looks right") — independent verification

## Independent Verification

- [ ] Not self-graded. One of: sub-agent review, test suite, or the human
  confirmed.

## Escopo do runner de teste (decidido em 2026-08-04)

`pnpm test` = **vitest, ambiente node, só lógica pura** (`src/**/*.test.ts`).
Config em `vitest.config.mts`, declarado em `agent-md.toml [verify] test`.

- **Mora aqui:** checksum de documento, tradução de `fieldErrors`, mapeamento de
  status API↔UI, formatação de endereço, schemas zod de formulário — o que o
  `tsc` não pega porque um cast silencia.
- **Não mora aqui:** render de componente. Sem `jsdom` e sem
  `@testing-library` de propósito: componente é verificado por screenshot +
  asserção de valor computado (§ Visual Verification acima), e render test só
  duplicaria isso. Se um dia precisar, o caminho é
  `pnpm add -D jsdom @testing-library/react @vitejs/plugin-react` e trocar
  `environment` — não reescrever a config.
- **Mock de erro de API precisa ser `new AxiosError(...)` de verdade**:
  `getApiErrorBody`/`getApiErrorStatus` usam `instanceof`, e objeto com o mesmo
  formato é ignorado em silêncio.

## Task-Specific Criteria

<!--
Per-slice criteria beyond the universal checks. Add as your plan.md grows.

### Slice 1: <outcome>
- [ ] <specific criterion>
-->
