# Resend Email Setup Guide for RUN Health Centre

This guide explains how to set up email verification for production use with your domain `runhealthcentre.vercel.app`.

## Current Status

You have added the Resend API key (`re_Qc3Zk16e_NMHtm8CDhAY7nkeCq35d8TbU`) to Vercel, but emails are not being sent because:

**The default `onboarding@resend.dev` sender only works for testing and can only send emails to the email address registered with your Resend account.**

## Solution: Verify Your Domain in Resend

### Step 1: Log into Resend Dashboard

1. Go to [resend.com](https://resend.com)
2. Log in to your account
3. Navigate to **Domains** in the sidebar

### Step 2: Add Your Domain

1. Click **"Add Domain"**
2. Enter: `runhealthcentre.vercel.app`
3. Click **"Add"**

### Step 3: Add DNS Records

Resend will provide you with DNS records to add. You'll need to add these to your domain's DNS settings.

**For Vercel domains, you can add DNS records in Vercel:**

1. Go to your Vercel project: [vercel.com dashboard](https://vercel.com)
2. Select your project: `runhealthcentre`
3. Go to **Settings** → **Domains**
4. Scroll down to find DNS records section
5. Add the records provided by Resend (typically MX, TXT records)

**Typical records needed:**

| Type | Name | Value |
|------|------|-------|
| MX | @ | feedback-smtp.us-east-1.amazonses.com |
| TXT | resend-verification | [verification code from Resend] |
| TXT | @ | v=spf1 include:amazonses.com ~all |

### Step 4: Verify Domain

1. Go back to Resend dashboard
2. Click **"Verify DNS Records"**
3. Wait for verification (can take up to 48 hours, usually faster)

### Step 5: Set Environment Variables in Vercel

Once your domain is verified, add this environment variable in Vercel:

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add a new variable:
   - **Name**: `EMAIL_FROM`
   - **Value**: `RUN Health Centre <noreply@runhealthcentre.vercel.app>`
   
   Or use a subdomain:
   - **Value**: `RUN Health Centre <noreply@mail.runhealthcentre.vercel.app>`

3. Click **Save**
4. **Redeploy** your application for changes to take effect

## Alternative: Use a Custom Domain

If you have a custom domain (e.g., `runhealthcentre.com`), use that instead:

1. Verify `runhealthcentre.com` in Resend
2. Set `EMAIL_FROM` to: `RUN Health Centre <noreply@runhealthcentre.com>`

## Testing Your Setup

### 1. Check Configuration

Visit this URL in your browser:
```
https://runhealthcentre.vercel.app/api/auth/send-verification
```

You should see:
```json
{
  "configured": true,
  "emailFrom": "RUN Health Centre <noreply@runhealthcentre.vercel.app>",
  "message": "Email service is configured. Make sure your domain is verified in Resend."
}
```

### 2. Test Email Sending

1. Go to your app: `https://runhealthcentre.vercel.app/hms`
2. Click "Sign Up"
3. Enter an email address
4. Check if you receive the verification code

### 3. Check Vercel Logs

If emails still don't send:
1. Go to Vercel Dashboard → Your Project → **Deployments**
2. Click on the latest deployment
3. Go to **Functions** or **Runtime Logs**
4. Look for `[Email]` prefixed logs

## Troubleshooting

### "Domain not verified" error
- Wait for DNS propagation (can take up to 48 hours)
- Verify all DNS records are correctly added
- Check Resend dashboard for verification status

### "Invalid API key" error
- Verify your API key in Vercel environment variables
- Make sure there are no extra spaces or line breaks
- The key should start with `re_`

### "Sender not allowed" error
- Make sure `EMAIL_FROM` uses your verified domain
- The format should be: `Display Name <email@yourdomain.com>`

### Emails going to spam
- Add SPF record: `v=spf1 include:amazonses.com ~all`
- Consider adding DKIM record (provided by Resend)

## Current Environment Variables

Make sure these are set in Vercel:

| Variable | Value |
|----------|-------|
| `RESEND_API_KEY` | `re_Qc3Zk16e_NMHtm8CDhAY7nkeCq35d8TbU` |
| `EMAIL_FROM` | `RUN Health Centre <noreply@runhealthcentre.vercel.app>` |
| `DATABASE_URL` | Your Supabase PostgreSQL connection string |
| `DIRECT_URL` | Your Supabase direct connection string |

## Quick Commands

### Redeploy after adding environment variables:
```bash
# Trigger a new deployment by making a small change
git commit --allow-empty -m "Trigger redeploy"
git push
```

Or use Vercel CLI:
```bash
vercel --prod
```

---

**Need help?** Check the Resend documentation: https://resend.com/docs
