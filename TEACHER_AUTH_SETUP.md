# Teacher Authentication Setup Guide

## Problem: 401 Unauthorized Error

You're getting a 401 Unauthorized error because the teacher login system needs to be configured to use your existing Supabase setup.

## Solution: Use Existing Supabase Configuration

**Great news!** Your setup is much simpler now. The system automatically uses your existing Supabase configuration (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`) that you already have configured.

### How It Works

1. **Automatic Integration**: Teachers can use the same email/password they use in your exam portal
2. **No Additional Configuration**: Uses your existing `.env.local` file
3. **Seamless Authentication**: Same Supabase instance, same user accounts

### What You Need

Make sure your `.env.local` file contains:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anonymous_key_here
```

### Testing Authentication

1. **Restart your development server** (if you made any changes)
2. **Try logging in** with a teacher account using their exam portal credentials
3. **Check server logs** for authentication details

## Alternative: Set Local Passwords

If you have teachers who don't have Supabase accounts yet, you can set local passwords:

### Option 1: Use the Admin Dashboard
1. Go to `/dashboard/admin/passwords`
2. Find the teacher you want to set a password for
3. Click "Set Password"
4. Enter the new password
5. Click the checkmark to save

### Option 2: Use the API Directly
Make a POST request to `/api/teachers/set-password`:

```bash
curl -X POST http://localhost:3000/api/teachers/set-password \
  -H "Content-Type: application/json" \
  -d '{"email": "teacher@example.com", "password": "newpassword123"}'
```

## Quick Setup

Run the setup script to get started:

```bash
npm run setup-auth
```

This will guide you through testing authentication and setting up local passwords if needed.

## Current Teacher Accounts

Based on your database schema, these teachers exist:

1. **Test Teacher** - `teacher@test.com` (Demo Secondary School)
2. **dave** - `godsentryan@gmail.com` (yano)
3. **dave** - `davidobonyanoefe@gmail.com` (yano)
4. **Jerry** - `oyedelejeremiah.ng@gmail.com` (yano)

## Troubleshooting

### Still Getting 401 Error?

1. **Check Console Logs**: Look at your browser's developer console and server logs for detailed error messages.

2. **Verify Supabase Configuration**: Make sure your `.env.local` file has the correct Supabase URL and key.

3. **Check User Accounts**: Ensure the teacher exists in your Supabase auth users (same as your exam portal).

4. **Test API Endpoints**: Try the set-password endpoint to create local credentials.

### Common Issues

- **Environment variables not loaded**: Restart your development server after making changes
- **Wrong Supabase credentials**: Double-check the URL and key from your Supabase dashboard
- **Missing user accounts**: Ensure teachers exist in your Supabase auth users
- **Database connection issues**: Check your Supabase connection in `src/lib/supabase.ts`

## Security Notes

- The set-password endpoint is currently unprotected and should be secured in production
- Consider implementing proper authentication for admin functions
- Use strong passwords and consider implementing password policies
- Log all authentication attempts for security monitoring

## Next Steps

1. **Test existing authentication** with teacher exam portal credentials
2. **Set local passwords** for teachers without Supabase accounts (if needed)
3. **Secure admin endpoints** for production use
4. **Consider implementing** password reset functionality

## Need Help?

If you're still having issues:
1. Check the server logs for detailed error messages
2. Verify your Supabase configuration
3. Test the API endpoints directly
4. Ensure your database schema matches the expected structure

## Summary

✅ **No additional environment variables needed**  
✅ **Uses your existing Supabase setup**  
✅ **Teachers use same credentials as exam portal**  
✅ **Automatic authentication integration**
