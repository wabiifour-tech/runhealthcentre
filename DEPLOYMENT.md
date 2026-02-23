# RUHC Hospital Management System - Deployment Guide

## 🚀 Permanent Deployment Setup

This guide will help you set up **permanent, never-expiring deployment** for the RUHC Hospital Management System.

---

## Option 1: GitHub + Vercel (Recommended - Auto-Deploy)

### Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the **+** icon → **New repository**
3. Name it: `ruhc-hospital-management-system`
4. Make it **Private** (recommended for hospital data)
5. Click **Create repository**

### Step 2: Push Code to GitHub

Run these commands in your terminal:

```bash
cd /home/z/my-project

# Initialize git if not already done
git init

# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/ruhc-hospital-management-system.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Connect to Vercel

1. Go to [Vercel](https://vercel.com) and sign in
2. Click **Add New...** → **Project**
3. Click **Import Git Repository**
4. Select your `ruhc-hospital-management-system` repository
5. Click **Deploy**

### ✅ Done! 
Every time you push code to GitHub, Vercel will automatically deploy!

---

## Option 2: Vercel CLI with Token (Alternative)

### Step 1: Get Vercel Token

1. Go to [Vercel Account Settings](https://vercel.com/account/tokens)
2. Click **Create Token**
3. Name it: `RUHC-HMS-Token`
4. Set expiration: **No Expiration**
5. Copy the token

### Step 2: Deploy with Token

```bash
cd /home/z/my-project

# Deploy with token (replace YOUR_TOKEN)
npx vercel --prod --token YOUR_TOKEN
```

---

## 🔐 Default Login Credentials

After deployment, use these credentials to log in:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@run.edu.ng | admin123 |
| Admin | admin@run.edu.ng | admin123 |

⚠️ **Important**: Change these passwords after first login!

---

## 📋 Features Included

- ✅ Patient Registration & Management
- ✅ Vitals Recording with Timers
- ✅ Pharmacy Management
- ✅ Laboratory Management
- ✅ Billing & Invoicing
- ✅ Appointments Scheduling
- ✅ Electronic Prescriptions
- ✅ Queue Management
- ✅ Bed Management
- ✅ Staff Attendance
- ✅ Ambulance Tracking
- ✅ Blood Bank
- ✅ Telemedicine
- ✅ Patient Portal
- ✅ **Open Heavens Daily Devotional** (Live RSS Feed)
- ✅ And 25+ more features...

---

## 🛠️ Maintenance

### Updating the Application

1. Make changes to the code
2. Commit: `git add . && git commit -m "Your message"`
3. Push: `git push origin main`
4. Vercel will auto-deploy!

### Checking Deployment Status

- Vercel Dashboard: https://vercel.com/dashboard
- GitHub Repo: https://github.com/YOUR_USERNAME/ruhc-hospital-management-system

---

## 📞 Support

For issues or questions, contact the development team.

---

*Built for Redeemer's University Health Centre (RUHC), Nigeria*
