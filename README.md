# Yano School Management System

A comprehensive school management system built with Next.js, Supabase, and modern UI components. This system provides authentication, student and teacher dashboards, exam management, and administrative controls.

## Features

### 🔐 Authentication System
- **Email-based authentication** with Supabase Auth
- **Password recovery** via email
- **Role-based access control** (Student, Teacher, Admin)
- **Secure session management**

### 👨‍🎓 Student Features
- **Modern dashboard** with exam access
- **Grade tracking** and performance analytics
- **Schedule management** and announcements
- **Exam participation** with real-time results

### 👨‍🏫 Teacher Features
- **Exam creation and management**
- **Student progress tracking**
- **Grade management** and analytics
- **Class schedule management**
- **Announcement system**

### 👨‍💼 Admin Features
- **System overview** and statistics
- **User management** (students, teachers, admins)
- **System health monitoring**
- **Activity logs** and security
- **Global announcements**

### 🎨 Modern UI/UX
- **Framer Motion** animations
- **shadcn/ui** components
- **Responsive design** for all devices
- **Dark mode support** (ready for implementation)
- **High school-focused design patterns**

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Animations**: Framer Motion
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd yano-school-next
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Get your project URL and anon key
   - Create the following tables in your Supabase database:

   ```sql
   -- Users table
   CREATE TABLE users (
     id UUID REFERENCES auth.users(id) PRIMARY KEY,
     email TEXT UNIQUE NOT NULL,
     role TEXT CHECK (role IN ('STUDENT', 'TEACHER', 'ADMIN')) DEFAULT 'STUDENT',
     first_name TEXT,
     last_name TEXT,
     phone TEXT,
     student_id TEXT UNIQUE,
     grade TEXT,
     section TEXT,
     date_of_birth DATE,
     parent_name TEXT,
     parent_phone TEXT,
     address TEXT,
     teacher_id TEXT UNIQUE,
     department TEXT,
     subjects TEXT[],
     qualification TEXT,
     experience INTEGER,
     is_admin BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Exams table
   CREATE TABLE exams (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     title TEXT NOT NULL,
     description TEXT,
     subject TEXT NOT NULL,
     duration INTEGER NOT NULL,
     total_marks INTEGER NOT NULL,
     start_time TIMESTAMP WITH TIME ZONE NOT NULL,
     end_time TIMESTAMP WITH TIME ZONE NOT NULL,
     is_active BOOLEAN DEFAULT TRUE,
     created_by UUID REFERENCES users(id),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Exam results table
   CREATE TABLE exam_results (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     exam_id UUID REFERENCES exams(id),
     student_id UUID REFERENCES users(id),
     score DECIMAL NOT NULL,
     max_score INTEGER NOT NULL,
     time_taken INTEGER,
     submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Password reset tokens
   CREATE TABLE password_resets (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     email TEXT NOT NULL,
     token TEXT UNIQUE NOT NULL,
     expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

4. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password_here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Schema

### Users Table
- **id**: UUID (references Supabase Auth)
- **email**: User's email address
- **role**: STUDENT, TEACHER, or ADMIN
- **first_name, last_name**: User's name
- **student_id**: Unique student identifier (for existing students)
- **grade, section**: Student's class information
- **department, subjects**: Teacher's department and subjects
- **is_admin**: Admin flag

### Exams Table
- **id**: Unique exam identifier
- **title, description**: Exam details
- **subject**: Subject being tested
- **duration**: Time limit in minutes
- **total_marks**: Maximum possible score
- **start_time, end_time**: Exam availability window
- **is_active**: Whether exam is currently available
- **created_by**: Teacher who created the exam

### Exam Results Table
- **id**: Unique result identifier
- **exam_id**: Reference to exam
- **student_id**: Reference to student
- **score**: Student's score
- **max_score**: Maximum possible score
- **time_taken**: Time spent on exam
- **submitted_at**: When exam was submitted

## Authentication Flow

### Student Registration
1. Student fills out registration form
2. Can optionally provide existing student ID
3. System checks if student ID already exists
4. Creates account with email verification
5. Redirects to student dashboard

### Teacher Registration
1. Teacher fills out registration form
2. System creates account with email verification
3. Redirects to teacher dashboard

### Login
1. User enters email and password
2. System authenticates with Supabase
3. Fetches user profile to determine role
4. Redirects to appropriate dashboard

### Password Recovery
1. User requests password reset
2. System sends email with reset link
3. User clicks link and sets new password
4. System updates password and clears reset token

## Dashboard Features

### Student Dashboard
- **Upcoming Exams**: View and take exams
- **Recent Grades**: Track academic performance
- **Quick Stats**: Attendance, completed exams, etc.
- **Announcements**: School-wide notifications
- **Today's Schedule**: Class schedule

### Teacher Dashboard
- **Quick Actions**: Create exams, manage students
- **Recent Exams**: View and edit created exams
- **Exam Results**: Track student performance
- **My Students**: View assigned students
- **Today's Classes**: Teaching schedule

### Admin Dashboard
- **System Overview**: Total users, exams, uptime
- **Quick Actions**: User management, system settings
- **Recent Users**: Monitor new registrations
- **System Logs**: Track system activity
- **System Health**: Monitor performance metrics

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms
- **Netlify**: Similar to Vercel setup
- **Railway**: Add environment variables and deploy
- **Self-hosted**: Build and serve static files

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@yanoschool.com or create an issue in the repository.

## Roadmap

- [ ] Dark mode implementation
- [ ] Mobile app development
- [ ] Advanced analytics
- [ ] Video conferencing integration
- [ ] Parent portal
- [ ] Attendance tracking
- [ ] Fee management
- [ ] Library management