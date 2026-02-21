#!/bin/bash

# Quick Deploy Script for RUHC HMS
# This script helps you deploy to Vercel permanently

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     RUHC HOSPITAL MANAGEMENT SYSTEM - QUICK DEPLOY           ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check for Vercel token
if [ -z "$VERCEL_TOKEN" ]; then
    echo "❌ VERCEL_TOKEN not found in environment"
    echo ""
    echo "To get your Vercel token:"
    echo "1. Go to: https://vercel.com/account/tokens"
    echo "2. Click 'Create Token'"
    echo "3. Set expiration to 'No Expiration'"
    echo "4. Copy the token"
    echo ""
    echo "Then run this script with:"
    echo "  VERCEL_TOKEN=your_token_here ./quick-deploy.sh"
    echo ""
    echo "Or set it permanently:"
    echo "  export VERCEL_TOKEN=your_token_here"
    exit 1
fi

echo "✅ Vercel token found"
echo ""

# Deploy
echo "🚀 Deploying to Vercel..."
npx vercel --prod --token "$VERCEL_TOKEN" --yes

if [ $? -eq 0 ]; then
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║              ✅ DEPLOYMENT SUCCESSFUL!                       ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Your app is now live!"
else
    echo ""
    echo "❌ Deployment failed. Check the error messages above."
fi
