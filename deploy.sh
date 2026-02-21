#!/bin/bash

# RUHC HMS Quick Deploy Script
# This script commits all changes and pushes to GitHub
# Vercel will auto-deploy from GitHub

echo "🚀 RUHC HMS Quick Deploy"
echo "========================"

# Check if there are changes
if git diff --quiet && git diff --staged --quiet; then
    echo "✅ No changes to deploy!"
    exit 0
fi

# Get commit message
if [ -z "$1" ]; then
    TIMESTAMP=$(date +"%Y-%m-%d %H:%M")
    MESSAGE="Update: $TIMESTAMP"
else
    MESSAGE="$1"
fi

echo "📝 Commit message: $MESSAGE"

# Add all changes
echo "➕ Adding changes..."
git add -A

# Commit
echo "💾 Committing..."
git commit -m "$MESSAGE"

# Push
echo "🚀 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Deployed!"
echo "🌐 Vercel will auto-deploy in 1-2 minutes"
echo "🔗 Check: https://vercel.com/dashboard"
