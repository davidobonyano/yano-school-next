# Test Global Session Switching

## Step 1: Add Future Sessions
1. Go to your Supabase SQL Editor
2. Copy and paste the contents of `add_future_sessions.sql`
3. Run the script to add future academic sessions

## Step 2: Verify Sessions Are Added
After running the script, you should see:
- **Sessions loaded:** 7 (instead of just 2)
- **Available:** 2030/2031, 2029/2030, 2028/2029, 2027/2028, 2026/2027, 2025/2026, 2024/2025

## Step 3: Test Global Session Switching

### Test 1: Change Session in Admin Dashboard
1. Go to Admin Dashboard
2. Select a different session (e.g., "2026/2027") from the dropdown
3. Click "Change Session"
4. Verify success message appears

### Test 2: Verify Global Change
1. **Student Dashboard**: Check if the session context has changed
2. **Teacher Dashboard**: Check if the session context has changed  
3. **Payment Pages**: Check if the session context has changed
4. **Course Pages**: Check if the session context has changed

### Test 3: Test Term Switching
1. Select a different term (e.g., "2nd Term") from the term dropdown
2. Click "Change Term"
3. Verify the change affects all dashboards globally

## Expected Behavior
- ✅ **Session dropdown** shows all 7 sessions (2024/2025 to 2030/2031)
- ✅ **Term dropdown** shows 3 terms for the selected session
- ✅ **Session switching** affects ALL dashboard pages globally
- ✅ **Term switching** affects ALL dashboard pages globally
- ✅ **Debug info** shows correct counts and available options

## Troubleshooting
If sessions still don't appear:
1. Check browser console for errors
2. Verify the SQL script ran successfully
3. Check if the API endpoints are returning data
4. Refresh the page after adding sessions

## Test Different Scenarios
- Switch from 2025/2026 to 2026/2027
- Switch from 2026/2027 to 2029/2030
- Switch back to 2025/2026
- Test with different terms in each session

This will verify that the global academic context switching works correctly across the entire system!



