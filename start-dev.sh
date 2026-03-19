#!/bin/bash
# RUHC HMS Development Server Startup Script
# Ensures correct environment variables are set

cd /home/z/my-project

# Load environment variables from .env file
set -a
source .env
set +a

echo "========================================"
echo "RUHC HMS Development Server"
echo "========================================"
echo "Database: $(echo $DATABASE_URL | cut -d'@' -f2 | cut -d'/' -f1)"
echo "========================================"

# Start the development server
npm run dev
