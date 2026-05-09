#!/bin/bash
set -e

# Load secrets from .env.local (never hardcoded here)
if [ ! -f "$(dirname "$0")/.env.local" ]; then
  echo "Error: .env.local not found. Copy .env.local.example and fill in your values."
  exit 1
fi
source "$(dirname "$0")/.env.local"

echo "==> Logging into Vercel (a browser window will open)..."
npx vercel login

echo "==> Deploying to Vercel..."
npx vercel --prod --yes

echo "==> Setting environment variables..."
echo "$NEXT_PUBLIC_SUPABASE_URL"    | npx vercel env add NEXT_PUBLIC_SUPABASE_URL    production --force
echo "$SUPABASE_SERVICE_ROLE_KEY"   | npx vercel env add SUPABASE_SERVICE_ROLE_KEY   production --force
echo "$ANTHROPIC_API_KEY"           | npx vercel env add ANTHROPIC_API_KEY           production --force
echo "$OPENWEATHER_API_KEY"         | npx vercel env add OPENWEATHER_API_KEY         production --force

echo "==> Redeploying with environment variables applied..."
DEPLOY_URL=$(npx vercel --prod --yes 2>&1 | grep -o 'https://[^ ]*\.vercel\.app' | tail -1)

echo ""
echo "✅ Done! Your app is live at: $DEPLOY_URL"
echo "Paste that URL back into Claude to finish setup."
