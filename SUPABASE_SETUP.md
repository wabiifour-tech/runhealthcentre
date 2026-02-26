# Supabase Database Setup for RUN Health Centre HMS

## Step 1: Get Connection Strings from Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `udytiwrvryssiwbekzxj`
3. Go to **Project Settings** → **Database**

### DATABASE_URL (Pooler Connection)
1. Scroll to **Connection Pooling** section
2. Select **Transaction** mode
3. Copy the connection string
4. It should look like:
   ```
   postgresql://postgres.udytiwrvryssiwbekzxj:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with your database password: `#Abolaji7977`

### DIRECT_DATABASE_URL (Direct Connection)
1. Scroll to **Connection info** section
2. Copy the connection string
3. It should look like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.udytiwrvryssiwbekzxj.supabase.co:5432/postgres
   ```
4. Replace `[YOUR-PASSWORD]` with your database password: `#Abolaji7977`

## Step 2: Set Environment Variables in Vercel

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add/Update these variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Pooler connection string (port 6543) |
| `DIRECT_DATABASE_URL` | Direct connection string (port 5432) |

### Example Values:

**DATABASE_URL:**
```
postgresql://postgres.udytiwrvryssiwbekzxj:#Abolaji7977@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**DIRECT_DATABASE_URL:**
```
postgresql://postgres:#Abolaji7977@db.udytiwrvryssiwbekzxj.supabase.co:5432/postgres
```

## Step 3: Trigger Redeployment

After updating environment variables:
1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **Redeploy**

## Important Notes

1. **Password in URL**: If your password contains special characters, they need to be URL-encoded:
   - `#` becomes `%23`
   - `@` becomes `%40`
   - So `#Abolaji7977` should be `%23Abolaji7977` in the URL

2. **Region**: The pooler URL contains your Supabase region (e.g., `aws-0-us-east-1`). Check your Supabase dashboard for the correct region.

3. **SSL**: Supabase requires SSL connections. The code handles this automatically.

## Troubleshooting

### "Can't reach database server"
- Check that your Supabase project is not paused (free tier projects pause after inactivity)
- Verify the connection string is correct
- Make sure SSL is enabled (code handles this)

### "Tenant or user not found"
- Check the pooler URL format
- Verify the project reference is correct
- Make sure you're using the right pooler mode (Transaction)

### "Password authentication failed"
- URL-encode special characters in your password
- Verify the password is correct

## Database Tables

The following tables should already be created from the SQL script you ran:
- users
- patients
- appointments
- consultations
- vital_records
- lab_tests
- lab_orders
- lab_order_items
- medicines
- prescriptions
- prescription_items
- invoices
- payments
- wards
- beds
- admissions
- inventory_items
- settings
