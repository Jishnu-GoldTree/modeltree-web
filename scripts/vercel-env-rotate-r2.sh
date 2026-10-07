#!/usr/bin/env bash
# Rotate R2 credentials in Vercel: remove existing R2_ACCESS_KEY_ID and
# R2_SECRET_ACCESS_KEY from preview + production, then re-add from
# .env.local. Assumes you've already:
#   1. Deleted the old token in the Cloudflare R2 dashboard
#   2. Created a new one and pasted the values into .env.local
#
# R2_ACCOUNT_ID and R2_BUCKET are left alone — those don't change on rotation.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env.local ]; then
  echo "❌ .env.local not found" >&2; exit 1
fi

read_env() {
  grep -E "^$1=" .env.local | head -1 | cut -d= -f2-
}

for name in R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY; do
  value="$(read_env "$name")"
  if [ -z "$value" ]; then
    echo "❌ $name is empty in .env.local — paste the new value before running" >&2
    exit 1
  fi
  for env in preview production; do
    echo "→ removing $name from $env"
    vercel env rm "$name" "$env" -y >/dev/null 2>&1 || echo "   (not present, skipping rm)"
    echo "→ adding fresh $name to $env"
    printf '%s' "$value" | vercel env add "$name" "$env"
  done
done

echo
echo "✅ Rotated. Verify with: vercel env ls"
echo "Redeploy so running instances pick up the new secret: vercel --prod=false (preview)"
