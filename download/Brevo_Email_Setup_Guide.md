# Email Setup Guide - Brevo (Recommended)

Since Resend doesn't allow free domains like `vercel.app`, use **Brevo** instead.

## Why Brevo?
- ✅ **Free 300 emails/day** 
- ✅ **No domain verification required** for basic use
- ✅ **Easy setup** - just get an API key
- ✅ **Works immediately**

---

## Quick Setup (5 minutes)

### Step 1: Create Brevo Account

1. Go to [brevo.com](https://www.brevo.com)
2. Click **"Sign Up Free"**
3. Enter your details and verify your email
4. Skip any onboarding steps

### Step 2: Get Your API Key

1. Once logged in, click your name (top right) → **SMTP & API**
2. Or go directly to: [app.brevo.com/settings/keys/api](https://app.brevo.com/settings/keys/api)
3. Click **"Create a new API key"**
4. Name it: `RUN Health Centre`
5. Copy the API key (starts with `xkeysib-`)

### Step 3: Add to Vercel

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your project: `runhealthcentre`
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

| Name | Value |
|------|-------|
| `BREVO_API_KEY` | `xkeysib-your-api-key-here` |
| `EMAIL_FROM` | `runhealthcentre@brevo.com` *(or any email you want to appear as sender)* |

5. Click **Save**

### Step 4: Redeploy

1. In Vercel, go to **Deployments**
2. Click the **three dots (⋯)** on the latest deployment
3. Select **"Redeploy"**

---

## That's it! 

Now when users sign up, they'll receive verification emails.

---

## Test the Setup

1. Visit: `https://runhealthcentre.vercel.app/api/auth/send-verification`
2. You should see:
   ```json
   {
     "configured": true,
     "provider": "Brevo",
     "message": "Email service configured via Brevo"
   }
   ```

3. Go to your app and try signing up with a real email address

---

## Troubleshooting

### "API key invalid"
- Make sure you copied the entire key (starts with `xkeysib-`)
- Check for extra spaces

### Emails going to spam
- Brevo sender reputation improves over time
- For better deliverability, verify your own domain later

### Daily limit reached
- Free tier: 300 emails/day
- Upgrade if needed (very affordable)

---

## Alternative: Keep Using Resend

If you already have a custom domain (e.g., `yourdomain.com`), you can still use Resend:

1. Verify your custom domain in Resend
2. Set `EMAIL_FROM` to: `noreply@yourdomain.com`
3. The system will automatically use Resend if `BREVO_API_KEY` is not set

---

## Environment Variables Summary

| Variable | Required | Description |
|----------|----------|-------------|
| `BREVO_API_KEY` | Yes | Your Brevo API key |
| `EMAIL_FROM` | Optional | Sender email (default: noreply@brevo.com) |
| `EMAIL_SENDER_NAME` | Optional | Sender name (default: RUN Health Centre) |
