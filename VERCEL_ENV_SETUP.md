# VERCEL ENVIRONMENT VARIABLES - COPY THESE EXACTLY

## Go to Vercel Dashboard > Your Project > Settings > Environment Variables

Delete any existing DATABASE_URL and DIRECT_DATABASE_URL variables, then add these:

---

### Variable 1: DATABASE_URL
**Name:** `DATABASE_URL`

**Value (copy this entire line):**
```
postgresql://postgres.udytiwrvryssiwbekzxj:%23Abolaji7977@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Note:** The `%23` is the URL-encoded version of `#` in your password.

---

### Variable 2: DIRECT_DATABASE_URL
**Name:** `DIRECT_DATABASE_URL`

**Value (copy this entire line):**
```
postgresql://postgres:%23Abolaji7977@db.udytiwrvryssiwbekzxj.supabase.co:5432/postgres
```

---

## After Setting Variables:

1. Click **Save**
2. Go to **Deployments** tab
3. Click on the most recent deployment
4. Click **Redeploy** button
5. Select **Redeploy** (not "Use existing Build Cache")

---

## IF THE ABOVE DOESN'T WORK:

Go to your Supabase Dashboard (https://supabase.com/dashboard):
1. Select project `udytiwrvryssiwbekzxj`
2. Click **Project Settings** → **Database**
3. Under **Connection Pooling**:
   - Mode: **Transaction**
   - Copy the URI shown
   - Replace `[YOUR-PASSWORD]` with `#Abolaji7977`
4. Under **Connection info**:
   - Copy the URI shown
   - Replace `[YOUR-PASSWORD]` with `#Abolaji7977`

---

## IMPORTANT: URL Encode Special Characters

If your password contains special characters, they must be URL-encoded:
- `#` → `%23`
- `@` → `%40`
- `&` → `%26`
- `/` → `%2F`

Your password `#Abolaji7977` becomes `%23Abolaji7977` in the connection URL.
