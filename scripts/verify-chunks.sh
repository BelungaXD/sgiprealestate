#!/usr/bin/env bash
# Verify that the site returns JS for chunk URLs (not HTML).
# Run after deploy or when you see "SyntaxError: Unexpected token '<'".
# Usage: BASE_URL=https://sgipreal.com ./scripts/verify-chunks.sh

set -e
BASE_URL="${BASE_URL:-https://sgipreal.com}"

echo "Checking $BASE_URL ..."
echo ""

# Document should return HTML and no-store
DOC_CT=$(curl -sI "$BASE_URL/" | grep -i "^Content-Type:" | tr -d '\r' || true)
DOC_CC=$(curl -sI "$BASE_URL/" | grep -i "^Cache-Control:" | tr -d '\r' || true)
echo "GET $BASE_URL/"
echo "  $DOC_CT"
echo "  $DOC_CC"
if echo "$DOC_CT" | grep -qi "text/html"; then
  echo "  OK: document is HTML"
else
  echo "  WARN: expected text/html for document"
fi
echo ""

# Chunk URL: pass a real chunk path from the browser error (e.g. /_next/static/chunks/906.xxx.js) or we skip
CHUNK_PATH="${1:-}"
if [ -n "$CHUNK_PATH" ]; then
  CHUNK_URL="$BASE_URL$CHUNK_PATH"
  STATUS=$(curl -sI "$CHUNK_URL" | head -1 | tr -d '\r')
  CT=$(curl -sI "$CHUNK_URL" | grep -i "^Content-Type:" | tr -d '\r' || true)
  echo "GET $CHUNK_URL"
  echo "  $STATUS"
  echo "  $CT"
  if echo "$CT" | grep -qi "javascript"; then
    echo "  OK: chunk returns JavaScript"
  else
    echo "  FAIL: chunk must return application/javascript. If 404 or text/html: purge CDN (Cloudflare → Purge Everything) and ensure nginx proxies /_next/* to Next.js."
    exit 1
  fi
else
  echo "To verify a chunk, pass its path from the browser error, e.g.:"
  echo "  BASE_URL=https://sgipreal.com ./scripts/verify-chunks.sh '/_next/static/chunks/index-50ffc71760e52fd5.js'"
fi
echo ""
echo "If browser shows Unexpected token '<'': 1) Deploy latest code. 2) Purge CDN cache (Cloudflare → Caching → Purge Everything). 3) Hard refresh (Ctrl+Shift+R)."
