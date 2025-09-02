# Admin Dashboard Troubleshooting Guide

## Issue: "Failed to fetch dashboard statistics"

### Step 1: Run the Database Fix (CRITICAL)

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Copy and paste the entire content** of `supabase/fix_dates_and_functions.sql`
4. **Click Run** to execute the script

**This is the most important step!** The admin dashboard error occurs because the database function `get_admin_dashboard_stats` doesn't exist in your database yet.

### Step 2: Test the Database Function

After running the SQL script, test if the function works:

1. **In Supabase SQL Editor**, run:
   ```sql
   SELECT * FROM public.get_admin_dashboard_stats();
   ```

2. **You should see results** like:
   ```
   total_students | total_teachers | active_courses | total_revenue | completed_payments | active_students | active_courses_count
   0              | 0              | 0              | 0             | 0                  | 0               | 0
   ```

### Step 3: Test the API Endpoint

1. **Start your Next.js app** (`npm run dev`)
2. **Navigate to** `http://localhost:3000/api/admin/dashboard/test`
3. **Check the response** - it should show:
   ```json
   {
     "success": true,
     "function_exists": true,
     "stats": { ... }
   }
   ```

### Step 4: Check Browser Console

1. **Open your admin dashboard** in the browser
2. **Open Developer Tools** (F12)
3. **Go to Console tab**
4. **Look for error messages** when the dashboard loads
5. **Go to Network tab** and check the request to `/api/admin/dashboard/stats`

### Step 5: Common Issues and Solutions

#### Issue 1: Function doesn't exist
**Error**: `function "get_admin_dashboard_stats" does not exist`
**Solution**: Run the SQL script in Supabase

#### Issue 2: Authorization failed
**Error**: `Forbidden: admin only`
**Solution**: Make sure you're logged in as admin

#### Issue 3: Database connection failed
**Error**: `Database connection failed`
**Solution**: Check your environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

#### Issue 4: Permission denied
**Error**: `permission denied for function get_admin_dashboard_stats`
**Solution**: The SQL script includes `GRANT EXECUTE` statements - make sure they ran

### Step 6: Environment Variables Check

Make sure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 7: Alternative Solution

If the function still doesn't work, you can temporarily use a simpler approach:

1. **Edit** `src/app/api/admin/dashboard/stats/route.ts`
2. **Replace the RPC call** with direct queries:

```typescript
// Instead of: const { data, error } = await supabaseService.rpc('get_admin_dashboard_stats');

// Use direct queries:
const [studentsResult, teachersResult, coursesResult, paymentsResult] = await Promise.all([
  supabaseService.from('school_students').select('*', { count: 'exact', head: true }),
  supabaseService.from('teachers').select('*', { count: 'exact', head: true }).eq('is_active', true),
  supabaseService.from('courses').select('*', { count: 'exact', head: true }).eq('is_active', true),
  supabaseService.from('payment_transactions').select('amount')
]);

const stats = {
  total_students: studentsResult.count || 0,
  total_teachers: teachersResult.count || 0,
  active_courses: coursesResult.count || 0,
  total_revenue: paymentsResult.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
  completed_payments: paymentsResult.data?.length || 0,
  active_students: studentsResult.count || 0,
  active_courses_count: coursesResult.count || 0
};
```

### Step 8: Verify Success

After fixing, your admin dashboard should show:
- ✅ Real numbers instead of 0s
- ✅ No "Failed to fetch dashboard statistics" error
- ✅ Statistics cards populated with data

### Still Having Issues?

1. **Check Supabase logs** for any SQL errors
2. **Verify the SQL script ran completely** without errors
3. **Restart your Next.js app** after running the SQL
4. **Clear browser cache** and try again
5. **Check if you're logged in as admin**

The most common cause is simply that the database function hasn't been created yet. Running the SQL script should fix this immediately.


