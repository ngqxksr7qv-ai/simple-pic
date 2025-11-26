# Supabase Setup Guide

## 🚀 Quick Setup (15 minutes)

Follow these steps to get your app connected to Supabase with multi-tenant organization support.

---

## Step 1: Create Supabase Project (5 minutes)

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"New Project"**
3. Sign up or log in
4. Click **"New project"**
5. Fill in:
   - **Name**: `inventory-app` (or your choice)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free tier is perfect
6. Click **"Create new project"**
7. Wait 2-3 minutes for setup to complete

---

## Step 2: Get API Credentials (2 minutes)

1. In your Supabase project dashboard, click **"Settings"** (gear icon in sidebar)
2. Click **"API"** in the left menu
3. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (under "Project API keys" section)

---

## Step 3: Run SQL Migrations (5 minutes)

1. In Supabase dashboard, click **"SQL Editor"** in the sidebar
2. Click **"New query"**
3. Run each SQL file **IN ORDER**:

### Migration 1: Organizations
```sql
-- Copy and paste from: supabase/migrations/01_organizations.sql
-- Then click "Run" or press Ctrl+Enter
```

### Migration 2: Profiles
```sql
-- Copy and paste from: supabase/migrations/02_profiles.sql
-- Then click "Run"
```

### Migration 3: Products
```sql
-- Copy and paste from: supabase/migrations/03_products.sql
-- Then click "Run"
```

### Migration 4: Count Records
```sql
-- Copy and paste from: supabase/migrations/04_count_records.sql
-- Then click "Run"
```

### Migration 5: Security Policies (RLS)
```sql
-- Copy and paste from: supabase/migrations/05_rls_policies.sql
-- Then click "Run"
```

**Verify:** Click **"Table Editor"** in sidebar. You should see 4 tables: `organizations`, `profiles`, `products`, `count_records`.

---

## Step 4: Configure App (2 minutes)

1. In your project folder, create `.env.local` file (copy from `.env.example`)
2. Paste your credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key-here
```

3. Save the file

---

## Step 5: Enable Email Auth (1 minute)

1. In Supabase dashboard, go to **"Authentication"** → **"Providers"**
2. Make sure **"Email"** is enabled
3. Turn off **"Confirm email"** for testing (optional, recommended for development)
   - Go to **"Authentication"** → **"Providers"** → **"Email"**
   - Toggle off "Confirm email"

---

## Step 6: Run the App (1 minute)

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🎉 First Login

1. Click **"Sign up"** (or navigate to `/signup`)
2. Enter email and password
3. You'll be redirected to **"Set up your organization"**
4. Enter your store/business name (e.g., "Joe's Hardware")
5. Click **"Create Organization"**
6. You're in! Start adding products

---

## 🧪 Testing Multi-Tenancy

To test that organizations are properly isolated:

1. **Create First User:**
   - Sign up with `user1@example.com`
   - Create organization "Store A"
   - Add some products

2. **Create Second User:**
   - Open incognito/private window
   - Sign up with `user2@example.com`
   - Create organization "Store B"
   - Add different products

3. **Verify Isolation:**
   - User 1 should NOT see User 2's products
   - Each user only sees their own organization's data
   - Try logging out and back in - data persists!

---

## 🔧 Troubleshooting

### "Missing Supabase environment variables"
- Make sure `.env.local` exists in project root
- Check that variable names are exactly: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart dev server after creating `.env.local`

### "No such table" or "relation does not exist"
- Make sure you ran ALL 5 SQL migrations in order
- Check SQL Editor for error messages
- Verify tables exist in Table Editor

### Login fails / "Invalid credentials"
- Make sure Email auth is enabled
- Check if email confirmation is required (turn it off for dev)
- Try resetting password in Supabase dashboard

### Products not loading
- Check browser console for errors
- Verify RLS policies were created (migration 05)
- Make sure user has an organization assigned

---

## 📊 Database Schema Overview

```
organizations
  ├─ id (UUID, primary key)
  ├─ name (string)
  └─ timestamps

profiles (linked to auth.users)
  ├─ id (UUID, references auth.users)
  ├─ email
  ├─ organization_id (UUID, references organizations)
  ├─ role (owner/admin/member)
  └─ timestamps

products
  ├─ id (UUID, primary key)
  ├─ organization_id (UUID) ← isolates data
  ├─ sku, name, categories (1-3), price, expected_stock
  └─ timestamps

count_records
  ├─ id (UUID, primary key)
  ├─ organization_id (UUID) ← isolates data
  ├─ product_id, quantity, timestamp
  ├─ counted_by (UUID, references auth.users)
  └─ timestamp
```

---

## 🚀 What's Next?

**Optional Improvements:**
- [ ] Add team member invitations
- [ ] Email notifications
- [ ] Real-time collaboration (Supabase Realtime)
- [ ] Export organization logo upload
- [ ] Advanced role permissions
- [ ] Audit logs

**Deploy to Production:**
- Deploy frontend to Vercel/Netlify
- Add production environment variables
- Enable email confirmation
- Set up custom domain
- Configure SMTP for emails

---

## 📝 Notes

- **Free Tier Limits:** 500 MB database, 50k monthly users (more than enough for most use cases)
- **Data Migration:** Existing LocalStorage data won't auto-migrate. Export to CSV and re-import via the UI.
- **Security:** Row Level Security (RLS) ensures users can ONLY access their organization's data
- **Backup:** Supabase automatically backs up your database daily (on paid plans, point-in-time recovery available)

Need help? Check Supabase docs: [https://supabase.com/docs](https://supabase.com/docs)
