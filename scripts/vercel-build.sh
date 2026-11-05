#!/usr/bin/env bash
# Vercel build: bundle for Vercel, and on production also migrate the database.
# Preview builds skip migrations, so they must not tell the runtime to skip its
# own schema probes (AGENT_NATIVE_RELEASE_MIGRATIONS is baked in at build time).
set -euo pipefail

export NITRO_PRESET=vercel
# Vercel Hobby rejects cron jobs that run more than once a day, and this app
# has no scheduled automations, so a daily sweep is plenty on every plan.
export AGENT_NATIVE_VERCEL_CRON_SCHEDULE="${AGENT_NATIVE_VERCEL_CRON_SCHEDULE:-0 9 * * *}"

if [ "${VERCEL_ENV:-}" = "production" ]; then
  export AGENT_NATIVE_RELEASE_MIGRATIONS=1
  pnpm build
  pnpm migrate:production
else
  pnpm build
fi
