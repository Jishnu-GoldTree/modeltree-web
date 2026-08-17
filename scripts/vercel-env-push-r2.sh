#!/usr/bin/env bash
# Push R2 credentials to Vercel preview + production for this project.
# Reads values from .env.local so we never hand-copy secrets. Idempotent-ish:
# `vercel env add` errors if a var already exists in that environment, in
# which case remove + re-add is the intended flow.
#
# One-time prep:
#   vercel login          # authenticate as the account that owns the project
#   vercel link           # link this dir to the modeltree project
# Then:
#   bash scripts/vercel-env-push-r2.sh
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env.local ]; then
  echo "❌ .env.local not found in $(pwd)" >&2
  exit 1
fi

read_env() {
  grep -E "^$1=" .env.local | head -1 | cut -d= -f2-
}

VARS=(R2_ACCOUNT_ID R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_BUCKET)
ENVS=(preview production)

for name in "${VARS[@]}"; do
  value="$(read_env "$name")"
  if [ -z "$value" ]; then
    echo "⚠ $name is empty in .env.local — skipping" >&2
    continue
  fi
  for env in "${ENVS[@]}"; do
    echo "→ $name → $env"
    # If it already exists Vercel prints an error and returns non-zero; we
    # swallow it so re-runs after a partial push don't abort the loop.
    printf '%s' "$value" | vercel env add "$name" "$env" || \
      echo "   (skipped: $name already set in $env — remove + re-add to rotate)"
  done
done

echo
echo "✅ Push complete. Verify with: vercel env ls"
