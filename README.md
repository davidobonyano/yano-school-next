# Yano School Portal

A comprehensive school management system with role-based authentication for students, teachers, and administrators.

## 🚀 Features

### Authentication System
- **Multi-role Login**: Support for Students, Teachers, and Administrators
- **Secure Authentication**: Built with Supabase for production, with mock authentication for development
- **Password Reset**: Forgot password functionality with email reset links
- **Session Management**: Automatic session handling and logout functionality

### Role-Based Dashboards

#### Student Dashboard
- Course overview and progress tracking
- Assignment management and submission
- Grade viewing and academic performance
- Attendance tracking
- Recent activities and notifications

#### Teacher Dashboard
- Class management and student overview
- Assignment creation and grading
- Student performance tracking
- Attendance management
- Teaching schedule and timetable

#### Admin Dashboard
- User management (students, teachers, admins)
- System health monitoring
- Course and curriculum management
- Reports and analytics
- System settings and configuration

### Technical Features
- **Modern UI**: Built with Tailwind CSS and responsive design
- **TypeScript**: Full type safety and better development experience
- **Next.js 15**: Latest React framework with App Router
- **FontAwesome Icons**: Comprehensive icon library
- **Production Ready**: Optimized build with static generation

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Step-by-Step Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd yano-school-next
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

   **For Development (Mock Authentication):**
   - You can use the placeholder values for development
   - The system will use mock authentication when Supabase is not properly configured

   **For Production (Supabase):**
   - Set up a Supabase project at https://supabase.com
   - Create the following tables in your Supabase database:
     - `students` (id, user_id, student_id, name, email, etc.)
     - `teachers` (id, user_id, teacher_id, name, email, etc.)
     - `admins` (id, user_id, admin_id, name, email, etc.)
   - Add your Supabase URL and anon key to the environment variables

4. **Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser

5. **Production Build**
   ```bash
   npm run build
   npm start
   ```

## 🔐 Authentication

### Development Mode (Mock Users)
When Supabase is not configured, you can use these mock credentials:

**Student Login:**
- ID: `student123`
- Password: `any password`
- Role: `Student`

**Teacher Login:**
- ID: `teacher123`
- Password: `any password`
- Role: `Teacher`

**Admin Login:**
- ID: `admin123`
- Password: `any password`
- Role: `Admin`

### Production Mode (Supabase)
1. Set up user accounts in your Supabase Auth
2. Create corresponding records in the students/teachers/admins tables
3. Users can log in with their ID and password

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Role-based dashboards
│   │   ├── admin/        # Admin dashboard
│   │   ├── student/      # Student dashboard
│   │   └── teacher/      # Teacher dashboard
│   ├── login/            # Authentication pages
│   └── forgot-password/  # Password reset
├── components/           # Reusable components
│   ├── DashboardLayout.tsx
│   └── ClientLayout.tsx
├── lib/                 # Utilities and services
│   ├── auth-service.ts  # Authentication logic
│   └── fontawesome.ts   # Icon configuration
└── types/              # TypeScript type definitions
```

## 🎨 Design System

The application uses a consistent design system with:
- **Color Scheme**: Blue primary colors with gray accents
- **Typography**: Clean, readable fonts
- **Components**: Reusable UI components with consistent styling
- **Responsive Design**: Mobile-first approach with responsive breakpoints
- **Icons**: FontAwesome icons throughout the interface

## 🔧 Customization

### Adding New Features
1. Create new pages in the appropriate dashboard directory
2. Add navigation items to `DashboardLayout.tsx`
3. Implement role-based permissions in `auth-service.ts`

### Styling
- All styles use Tailwind CSS classes
- Custom CSS can be added to `app/globals.css`
- Component-specific styles are co-located with components

### Database Schema
For production, ensure your Supabase tables have the following structure:

```sql
-- Students table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  student_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Teachers table
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  teacher_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Admins table
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  admin_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
- **Netlify**: Use `npm run build` and `npm start`
- **Railway**: Configure environment variables and deploy
- **Docker**: Create Dockerfile for containerized deployment

## 📝 Development Notes

### Best Practices Implemented
- **Type Safety**: Full TypeScript implementation
- **Error Handling**: Comprehensive error handling throughout
- **Performance**: Optimized builds with static generation
- **Security**: Role-based access control and secure authentication
- **Accessibility**: ARIA labels and keyboard navigation support

### Code Quality
- ESLint configuration for code quality
- TypeScript strict mode enabled
- Consistent code formatting
- Component reusability

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the documentation above
2. Review the code comments
3. Create an issue in the repository

---

**Built with ❤️ using Next.js, TypeScript, and Tailwind CSS**
