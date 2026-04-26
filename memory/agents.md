# Sub-Agents & Tooling Registry

Update this file when sub-agents, MCPs, or core dependencies change.
Read at every session start.

## Active Sub-Agents

<!-- None configured yet. Add as the orchestrator gains delegation targets. -->

## MCPs / External Services

<!-- None configured yet. -->

## Tech Stack

- **Runtime**: Node 20+
- **Package manager**: pnpm (lockfile: `pnpm-lock.yaml`) — never use `npm` or `yarn`
- **Language**: TypeScript ^5 (strict)
- **Framework**: Next.js `16.2.4` (App Router) — breaking changes vs. training data, see `AGENTS.md` Project note
- **UI runtime**: React `19.2.4` / React DOM `19.2.4`
- **Styling**: Tailwind CSS `^4` (`@tailwindcss/postcss ^4`), `tw-animate-css ^1.4.0`
- **Components**: `shadcn ^4.4.0`, `radix-ui ^1.4.3`, `class-variance-authority ^0.7.1`, `clsx ^2.1.1`, `tailwind-merge ^3.5.0`
- **Icons**: `@hugeicons/react ^1.1.6`, `@hugeicons/core-free-icons ^4.1.1`
- **Data fetching**: `@tanstack/react-query ^5.100.1`, `axios ^1.15.2`
- **Client state**: `zustand ^5.0.12`
- **Forms**: `react-hook-form ^7.73.1` + `zod ^4.3.6` + `@hookform/resolvers ^5.2.2`
- **Lint**: ESLint `^9` + `eslint-config-next 16.2.4`
- **Type-check**: `tsc --noEmit`
- **Tests**: not configured yet — `package.json` has no `test` script, so `stop-verify.sh` skips this check

### Path aliases

`@/*` → `src/*` (see `tsconfig.json`).

### API base URL

`src/lib/api.ts` reads `NEXT_PUBLIC_API_URL` (default `http://localhost:8080`).
Auth token is read from `localStorage` and attached as `Bearer`.

### Backend OpenAPI spec

- Spec (JSON): `http://localhost:8080/v3/api-docs`
- Use as the source of truth for endpoints, DTOs, and error shapes when
  wiring API clients, types, or react-query hooks.
- Springdoc emits `securitySchemes.bearerAuth.name` (invalid in OpenAPI
  3.1 for `type: http`). `scripts/sanitize-openapi.mjs` strips it; it
  runs automatically as part of `pnpm api:fetch`. If you ever fetch the
  spec by other means, re-run the script before `pnpm api:gen`.

## Forbidden Patterns

- No `npm` / `yarn` commands — always `pnpm`.
- No assumptions about Next.js APIs from training data — Next 16 has breaking changes; verify in `node_modules/next/dist/docs/`.
- No `any` unless justified inline. Prefer `unknown` + narrowing.
- No silent catches. Errors hard-crash or are explicitly re-thrown.
