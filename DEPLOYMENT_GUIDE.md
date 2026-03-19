# Deployment Guide for runhealthcentre.name.ng

## Quick Start (5-10 minutes)

### Step 1: Set Up Neon PostgreSQL Database (FREE)

1. Go to [Neon](https://neon.tech) and sign up (use GitHub for faster login)
2. Click **"Create a project"**
   - **Project name**: `ruhc-production`
   - **Region**: Choose closest to Nigeria (`aws-eu-west-2` Ireland or `aws-eu-central-1` Frankfurt)
3. After creation, click **"Connection Details"** 
4. Copy your connection string (looks like):
   ```
   postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```

---

### Step 2: Push to GitHub

Run these commands:

```bash
cd /home/z/my-project

# Initialize git if needed
git init

# Add all files
git add .

# Commit
git commit -m "Prepare for production deployment"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/ruhc-health-system.git

# Push to GitHub
git branch -M master
git push -u origin master
```

---

### Step 3: Deploy to Vercel (FREE)

1. Go to [Vercel](https://vercel.com) and sign up with GitHub
2. Click **"Add New..."** → **"Project"**
3. Import your `ruhc-health-system` repository
4. Configure:
   - **Framework**: Next.js (auto-detected)
   - **Build Command**: `bunx prisma generate && bun run next build`
   - **Output Directory**: `.next`

5. **Add Environment Variables** (IMPORTANT!):

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Neon connection string |
| `DIRECT_DATABASE_URL` | Same as DATABASE_URL |
| `NEXTAUTH_SECRET` | Run: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://runhealthcentre.name.ng` |
| `NODE_ENV` | `production` |

6. Click **"Deploy"** and wait for build (2-3 minutes)

---

### Step 4: Configure Custom Domain

**In Vercel:**
1. Go to your project → **Settings** → **Domains**
2. Add: `runhealthcentre.name.ng`
3. Add: `www.runhealthcentre.name.ng` (optional)
4. Note the DNS records shown

**In DomainKing:**
1. Log into your DomainKing account
2. Go to **Domain Management** → `runhealthcentre.name.ng`
3. Go to **DNS Management**
4. Add these records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 76.76.21.21 | 3600 |
| CNAME | www | cname.vercel-dns.com | 3600 |

5. Wait for DNS propagation (5 minutes - 2 hours)

---

### Step 5: Initialize Database

After deployment succeeds:

1. Go to Vercel → Your Project → **Storage** → **Neon**
2. Or run locally with your production DATABASE_URL:
   ```bash
   DATABASE_URL="your-neon-connection-string" bunx prisma db push
   ```

3. Create superadmin account:
   - Visit: `https://runhealthcentre.name.ng/api/auth/seed`
   - This creates default superadmin account

---

### Step 6: First Login

1. Go to `https://runhealthcentre.name.ng/hms`
2. Login with:
   - **Email**: `superadmin@runhealthcentre.name.ng`
   - **Password**: `SuperAdmin@2024!`
3. **IMPORTANT**: Change password immediately after first login!

---

## Troubleshooting

### Build Fails
- Ensure all environment variables are set correctly
- Check Vercel build logs for specific errors
- Verify DATABASE_URL is valid PostgreSQL connection string

### Database Connection Errors
- Ensure Neon project is active (free tier sleeps after inactivity)
- Check DATABASE_URL and DIRECT_DATABASE_URL are both set
- Verify Neon allows connections from Vercel (usually automatic)

### Domain Not Working
- Wait for DNS propagation (up to 24 hours)
- Check DNS records match Vercel requirements
- Ensure domain is verified in Vercel dashboard

### PWA Not Installing
- Clear browser cache
- Ensure `/runlogo.jpg` is accessible
- Check manifest.json is being served

---

## Cost Estimate (FREE Tier)

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| Vercel | Hobby | FREE |
| Neon | Free Tier | FREE |
| Domain | Annual | One-time |
| **Total** | | **FREE** |

---

## Environment Variables Summary

```env
# Required
DATABASE_URL="postgresql://..."
DIRECT_DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="random-32-char-string"
NEXTAUTH_URL="https://runhealthcentre.name.ng"
NODE_ENV="production"

# Optional
# UPSTASH_REDIS_REST_URL="..."
# UPSTASH_REDIS_REST_TOKEN="..."
# RESEND_API_KEY="..."
```

---

## Security Checklist

- [ ] Change superadmin password after first login
- [ ] Enable 2FA for admin accounts
- [ ] Review user permissions
- [ ] Set up database backups in Neon
- [ ] Configure rate limiting (built-in)
- [ ] Review audit logs regularly

---

## Support

For issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify all environment variables
4. Check Neon database is active

**Your RUHC Health Management System will be live at: runhealthcentre.name.ng**
