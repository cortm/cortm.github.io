#!/usr/bin/env bash
# Usage: ./scripts/enable-cloud-sync.sh <SUPABASE_URL> <ANON_KEY> [HOUSEHOLD_ID]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

URL="${1:?Usage: $0 <SUPABASE_URL> <ANON_KEY> [HOUSEHOLD_ID]}"
KEY="${2:?Usage: $0 <SUPABASE_URL> <ANON_KEY> [HOUSEHOLD_ID]}"
HOUSEHOLD="${3:-kuleana}"

cat > .env.local <<EOF
VITE_SUPABASE_URL=${URL}
VITE_SUPABASE_ANON_KEY=${KEY}
VITE_HOUSEHOLD_ID=${HOUSEHOLD}
EOF

echo "Wrote .env.local"
npm run build

if command -v gh >/dev/null 2>&1; then
  echo "Setting GitHub repo secrets for future CI builds..."
  gh secret set VITE_SUPABASE_URL --body "$URL" -R cortm/cortm.github.io
  gh secret set VITE_SUPABASE_ANON_KEY --body "$KEY" -R cortm/cortm.github.io
  gh secret set VITE_HOUSEHOLD_ID --body "$HOUSEHOLD" -R cortm/cortm.github.io
  echo "GitHub secrets updated."
fi

echo ""
echo "Done. Next: commit dist/ and push, or run: gh workflow run Build\\ Kuleana -R cortm/cortm.github.io"
echo "Verify in the app: Settings → Data sync should say synced."
