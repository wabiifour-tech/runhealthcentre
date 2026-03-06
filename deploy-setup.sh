#!/bin/bash

# RUHC Hospital Management System - Deployment Setup Script
# Run this script to set up permanent deployment

echo "=========================================="
echo "RUHC HMS Deployment Setup"
echo "=========================================="
echo ""

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI not installed."
    echo ""
    echo "Please install GitHub CLI first:"
    echo "  Windows: winget install GitHub.cli"
    echo "  Mac: brew install gh"
    echo "  Linux: sudo apt install gh"
    echo ""
    echo "Then run: gh auth login"
    exit 1
fi

# Check if authenticated with GitHub
echo "Checking GitHub authentication..."
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub."
    echo "Please run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI authenticated"
echo ""

# Get GitHub username
GITHUB_USER=$(gh api user --jq '.login')
echo "GitHub username: $GITHUB_USER"
echo ""

# Create repository if it doesn't exist
REPO_NAME="ruhc-hospital-management-system"
echo "Creating GitHub repository: $REPO_NAME..."

if gh repo view $REPO_NAME &> /dev/null; then
    echo "Repository already exists."
else
    gh repo create $REPO_NAME --public --source=. --description "Redeemer's University Health Centre (RUHC) Hospital Management System"
    echo "✅ Repository created"
fi

# Add remote if not exists
if ! git remote | grep -q "origin"; then
    git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"
    echo "✅ Remote 'origin' added"
else
    echo "Remote 'origin' already exists"
fi

# Push to GitHub
echo ""
echo "Pushing code to GitHub..."
git branch -M main
git push -u origin main --force
echo "✅ Code pushed to GitHub"
echo ""

echo "=========================================="
echo "✅ GITHUB SETUP COMPLETE!"
echo "=========================================="
echo ""
echo "Repository URL: https://github.com/$GITHUB_USER/$REPO_NAME"
echo ""
echo "NEXT STEPS TO CONNECT TO VERCEL:"
echo "1. Go to https://vercel.com"
echo "2. Click 'Add New...' → 'Project'"
echo "3. Import your GitHub repository: $REPO_NAME"
echo "4. Click 'Deploy'"
echo ""
echo "After this, every push to GitHub will auto-deploy to Vercel!"
echo "=========================================="
