# RUHC Android App Build Instructions

This folder contains everything needed to build an Android APK that works **offline from first install**.

## Prerequisites

1. Install Node.js (v18+)
2. Install Java JDK 17+
3. Install Android SDK (or Android Studio)
4. Install Bubblewrap CLI:
   ```bash
   npm install -g @anthropic/bubblewrap
   ```

## Quick Build

1. Initialize the project:
   ```bash
   bubblewrap init --manifest="https://runhealthcentre.vercel.app/manifest.json"
   ```

2. Build the APK:
   ```bash
   bubblewrap build
   ```

3. The APK will be in `./app-release.apk`

## Distribute the APK

- Share via WhatsApp, Email, or direct download
- Users install once and it works offline forever
- Updates automatically when online

## Alternative: Use PWABuilder

1. Go to https://pwabuilder.com
2. Enter URL: https://runhealthcentre.vercel.app
3. Click "Generate APK"
4. Download and distribute

## Important Notes

- The APK will contain all web assets
- First launch requires internet to verify
- After first launch, works completely offline
- All offline data syncs when back online
