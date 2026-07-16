# syntax=docker/dockerfile:1

# ---- Base with pnpm via corepack ----------------------------------------
FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# ---- Install dependencies (cached unless the lockfile changes) ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ---- Build --------------------------------------------------------------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* vars are inlined into the client bundle AT BUILD TIME.
# The browser calls the API directly, so this must be the PUBLIC api URL
# (e.g. https://api.seu-dominio.com), passed in as a build arg.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

# ---- Runtime (minimal standalone server) --------------------------------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as a non-root user.
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# The standalone output already bundles the trimmed node_modules + server.js.
# static/ and public/ are not copied by standalone, so we add them explicitly.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
