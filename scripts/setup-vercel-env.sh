#!/bin/bash
# RUHC HMS - Vercel Environment Variables Setup
# Run this script to add all environment variables to Vercel

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Login to Vercel (if not already logged in)
echo "Please login to Vercel if prompted..."
vercel login

# Link project (if not already linked)
echo "Linking project to Vercel..."
vercel link --yes

# Add environment variables
echo "Adding environment variables to Vercel..."

# Database URLs
vercel env add DATABASE_URL production <<< "postgresql://neondb_owner:npg_PeIowL8jSu2A@ep-empty-dream-alrd8nqa-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require"
vercel env add DIRECT_DATABASE_URL production <<< "postgresql://neondb_owner:npg_PeIowL8jSu2A@ep-empty-dream-alrd8nqa-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require"

# Supabase
vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< "https://udytiwrvryssiwbekzxj.supabase.co"
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkeXRpd3J2cnlzc2l3YmVrenhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDE2NjcsImV4cCI6MjA4NjgxNzY2N30.DBF9jff1WEW4YSSK7Yz3uDWIguL28FVJXxU1y2FQnGg"
vercel env add SUPABASE_SERVICE_ROLE_KEY production <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkeXRpd3J2cnlzc2l3YmVrenhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTI0MTY2NywiZXhwIjoyMDg2ODE3NjY3fQ.-0rNL8L-B5h1WXLaqhsJQf38map_WUPRO75l2QWnxNk"

# Redis
vercel env add UPSTASH_REDIS_REST_URL production <<< "https://growing-seahorse-45588.upstash.io"
vercel env add UPSTASH_REDIS_REST_TOKEN production <<< "AbIUAAIncDFmNTgyYTA4YWY4OTE0NTg0ODYxZjcyMzdkYzYyY2YyYXAxNDU1ODg"

# Firebase
vercel env add FIREBASE_PROJECT_ID production <<< "run-health-centre"
vercel env add FIREBASE_CLIENT_EMAIL production <<< "firebase-adminsdk-fbsvc@run-health-centre.iam.gserviceaccount.com"

# Resend
vercel env add RESEND_API_KEY production <<< "re_Qc3Zk16e_NMHtm8CDhAY7nkeCq35d8TbU"

# App Settings
vercel env add NEXT_PUBLIC_BASE_URL production <<< "https://runhealthcentre.vercel.app"
vercel env add EMAIL_FROM production <<< "onboarding@resend.dev"
vercel env add EMAIL_SENDER_NAME production <<< "Redeemer's University Health Centre (RUHC)"

echo ""
echo "✅ Environment variables added!"
echo ""
echo "⚠️  IMPORTANT: Add FIREBASE_PRIVATE_KEY manually in Vercel Dashboard:"
echo "   1. Go to: https://vercel.com/dashboard"
echo "   2. Select your project → Settings → Environment Variables"
echo "   3. Add FIREBASE_PRIVATE_KEY with your private key (it's too long for CLI)"
echo ""
echo "🚀 Triggering new deployment..."
vercel --prod
