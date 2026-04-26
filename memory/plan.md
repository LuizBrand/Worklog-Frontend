# Macro Plan

The architectural design. Updated when direction changes. Vertical slices
only — build full-stack features end-to-end, not horizontal layers
(all DBs, then all APIs, then all UIs).

## Current Phase

Phase 1 — API client codegen via Orval against the WorkLog backend
OpenAPI 3.1 spec. Establishes the typed contract every UI slice will
build on (auth, tickets, clientes, sistemas, usuários).

## Vertical Slices

### Slice 1: Orval-generated API client + zod schemas

- **UI**: none directly; this is the foundation slice that subsequent
  feature slices import from.
- **API**: WorkLog backend at `NEXT_PUBLIC_API_URL` (default
  `http://localhost:8080`). Spec at `/v3/api-docs`.
- **Data**: snapshot the spec to `openapi/worklog.json` (committed) so
  CI / clean clones do not require the backend to be running. Generated
  code under `src/api/generated/` (committed) with one file per tag plus
  a `schemas/` dir; zod runtime validation under `src/api/generated/zod/`.
- **Tooling**:
  - `orval.config.ts` — defines two outputs (react-query hooks + zod).
  - `src/api/mutator.ts` — `customInstance` reusing `src/lib/api.ts`
    axios so baseURL, Bearer interceptor, and future interceptors stay
    centralized.
  - `package.json` scripts: `api:fetch` (refresh snapshot from live
    backend), `api:gen` (run orval against snapshot), `api:sync`
    (fetch + gen).
- **Tests**: typecheck must pass with generated code imported nowhere;
  lint must pass on the mutator. Generated files are exempt from lint
  via override if necessary.
- **Verify**:
  - `pnpm exec tsc --noEmit` clean.
  - `pnpm exec eslint .` clean (or generated dir excluded explicitly).
  - Generated tree contains files for all 5 tags (Autenticação,
    Sistemas, Usuários, Tickets, Clientes).
  - Mutator compiles without `any`.

<!--
One slice = one user-facing outcome, built top-to-bottom.
Add slices as you plan them. Execute one at a time.

### Slice 1: <user-facing outcome>
- **UI**: what the user sees/clicks
- **API**: routes/handlers needed
- **Data**: schema changes, migrations
- **Tests**: what proves it works
- **Verify**: how the human confirms (link to memory/verify.md criteria)
-->

## Deferred / Out of Scope

<!-- What we are explicitly NOT building right now. Prevents scope creep. -->

## Open Questions

<!-- Ambiguities that must be resolved with the human before implementation. -->
