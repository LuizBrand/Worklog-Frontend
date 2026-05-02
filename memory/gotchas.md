# Mistakes Log

After any correction from the human, log the pattern here. Review at
session start before starting new work. The goal is to drive the error
rate toward zero.

Format:
- **Date** — *mistake* → **rule**

---

<!--
Examples:

- **2026-04-15** — Assumed `USER_ID` env var was set; silently fell back
  to empty string. → **Rule**: No silent fallbacks on env vars. Hard-fail
  at startup if required vars are missing.

- **2026-04-18** — Renamed `getUserPrefs` via grep; missed a dynamic
  import in `src/lib/legacy.ts`. → **Rule**: On every rename, search
  separately for static calls, type references, string literals, dynamic
  imports, re-exports, test mocks.
-->

- **2026-05-01** — `GET /tickets` Orval-generated hook has return type
  `TicketSummary` instead of `PageTicketSummary` because the backend
  OpenAPI spec has the 200 and 401 response schemas swapped. → **Rule**:
  When consuming `useFindAllTickets` (and any paginated list hook), cast
  `q.data` to `PageTicketSummary` at the call site until the spec is
  corrected. Do not regen without first fixing the spec swap.

- **2026-04-26** — User shared the OpenAPI doc URL alongside a "pode
  commitar" and I jumped straight to committing the agent-md scaffold,
  skipping the implied next step (configure Orval to codegen the API
  client from the spec). → **Rule**: When the user hands over a spec
  URL, schema, or external contract, treat it as an instruction to wire
  it into the project, not just reference material. Confirm the
  expected next step before falling back to whatever was already
  pending.
