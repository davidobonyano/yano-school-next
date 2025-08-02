# Supabase Portal Setup Guide

This guide will walk you through setting up the Supabase database and configuring the portal system.

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `school-portal` (or your preferred name)
   - Database Password: Create a strong password
   - Region: Choose closest to your users
5. Click "Create new project"
6. Wait for the project to be created (usually 1-2 minutes)

## Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to Settings → API
2. Copy the following values:
   - Project URL (starts with `https://`)
   - Anon public key (starts with `eyJ`)

## Step 3: Configure Environment Variables

1. Create a `.env.local` file in your project root
2. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 4: Set Up Database Tables

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase dashboard → SQL Editor
2. Copy and paste the following SQL:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create users table
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT CHECK (role IN ('student', 'teacher', 'admin')) DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create courses table
CREATE TABLE public.courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    teacher_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enrollments table
CREATE TABLE public.enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_courses_teacher_id ON public.courses(teacher_id);
CREATE INDEX idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX idx_enrollments_course_id ON public.enrollments(course_id);

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create RLS policies for courses table
CREATE POLICY "Anyone can view courses" ON public.courses
    FOR SELECT USING (true);

CREATE POLICY "Teachers can create courses" ON public.courses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('teacher', 'admin')
        )
    );

CREATE POLICY "Teachers can update their own courses" ON public.courses
    FOR UPDATE USING (
        teacher_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Teachers can delete their own courses" ON public.courses
    FOR DELETE USING (
        teacher_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create RLS policies for enrollments table
CREATE POLICY "Students can view their own enrollments" ON public.enrollments
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Teachers can view enrollments for their courses" ON public.enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.courses 
            WHERE id = course_id AND teacher_id = auth.uid()
        )
    );

CREATE POLICY "Students can enroll in courses" ON public.enrollments
    FOR INSERT WITH CHECK (
        student_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'student'
        )
    );

CREATE POLICY "Students can unenroll from courses" ON public.enrollments
    FOR DELETE USING (student_id = auth.uid());

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

3. Click "Run" to execute the SQL

### Option B: Using Supabase CLI

If you prefer using the CLI:

1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Initialize: `supabase init`
4. Copy the SQL above into `supabase/migrations/001_initial_schema.sql`
5. Run: `supabase db push`

## Step 5: Configure Authentication

1. In your Supabase dashboard, go to Authentication → Settings
2. Configure the following:

### Site URL
- Add your development URL: `http://localhost:3000`
- Add your production URL when ready

### Email Templates
- Customize the email templates if needed
- Default templates work fine for testing

### Auth Providers
- Email auth is enabled by default
- You can add Google, GitHub, etc. later if needed

## Step 6: Test the Setup

1. Start your development server:
```bash
npm run dev
```

2. Visit `http://localhost:3000/portal/register`
3. Create a test account
4. Try logging in at `http://localhost:3000/portal/login`

## Step 7: Create Test Data (Optional)

You can add some test data to see the portal in action:

```sql
-- Insert test users (replace with your actual user IDs from auth.users)
INSERT INTO public.users (id, email, full_name, role) VALUES
('your-user-id-1', 'teacher@example.com', 'Dr. Smith', 'teacher'),
('your-user-id-2', 'student@example.com', 'John Doe', 'student'),
('your-user-id-3', 'admin@example.com', 'Admin User', 'admin');

-- Insert test courses
INSERT INTO public.courses (title, description, teacher_id) VALUES
('Mathematics 101', 'Introduction to basic mathematics concepts', 'your-teacher-user-id'),
('Physics 101', 'Fundamental physics principles', 'your-teacher-user-id'),
('Computer Science', 'Programming and algorithms', 'your-teacher-user-id');

-- Insert test enrollments
INSERT INTO public.enrollments (student_id, course_id) VALUES
('your-student-user-id', 'course-id-1'),
('your-student-user-id', 'course-id-2');
```

## Step 8: Database Migration Guide

### Merging Two Databases

If you need to merge two Supabase databases:

1. **Export Data from Source Database:**
   ```bash
   # Using Supabase CLI
   supabase db dump --db-url "your-source-db-url" > source_dump.sql
   ```

2. **Import to Target Database:**
   ```bash
   # Using Supabase CLI
   supabase db reset --db-url "your-target-db-url"
   psql "your-target-db-url" < source_dump.sql
   ```

3. **Alternative: Using Supabase Dashboard**
   - Go to SQL Editor in source database
   - Export data using `SELECT` statements
   - Import data using `INSERT` statements in target database

### Manual Migration Steps:

1. **Export Users:**
   ```sql
   SELECT id, email, full_name, role, created_at, updated_at 
   FROM public.users;
   ```

2. **Export Courses:**
   ```sql
   SELECT id, title, description, teacher_id, created_at, updated_at 
   FROM public.courses;
   ```

3. **Export Enrollments:**
   ```sql
   SELECT id, student_id, course_id, enrolled_at 
   FROM public.enrollments;
   ```

4. **Import in Target Database:**
   ```sql
   -- Insert users (adjust IDs if needed)
   INSERT INTO public.users (id, email, full_name, role, created_at, updated_at) 
   VALUES (...);

   -- Insert courses
   INSERT INTO public.courses (id, title, description, teacher_id, created_at, updated_at) 
   VALUES (...);

   -- Insert enrollments
   INSERT INTO public.enrollments (id, student_id, course_id, enrolled_at) 
   VALUES (...);
   ```

## Troubleshooting

### Common Issues:

1. **"Invalid API key" error:**
   - Check your environment variables
   - Ensure you're using the anon key, not the service role key

2. **"Table doesn't exist" error:**
   - Run the SQL setup script again
   - Check if tables were created in the Supabase dashboard

3. **Authentication not working:**
   - Check your site URL settings in Supabase
   - Ensure email confirmation is configured properly

4. **RLS policies blocking access:**
   - Check the policies in the SQL setup
   - Verify user roles are set correctly

### Getting Help:

- Check Supabase documentation: https://supabase.com/docs
- Join the Supabase Discord: https://discord.supabase.com
- Check the project issues on GitHub

## Next Steps

1. Customize the portal design and branding
2. Add more features like assignments, grades, etc.
3. Set up email notifications
4. Configure production deployment
5. Add analytics and monitoring

Your portal is now ready to use! 🎉