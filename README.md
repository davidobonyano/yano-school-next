# School Portal with Supabase

A modern, responsive school portal built with Next.js, Tailwind CSS, and Supabase. Features role-based access control for students, teachers, and administrators.

## 🚀 Features

- **Role-based Access Control**: Separate dashboards for students, teachers, and admins
- **Modern UI/UX**: Beautiful interface with dark mode support
- **Real-time Authentication**: Secure user authentication with Supabase
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Course Management**: Create, manage, and enroll in courses
- **Student Progress Tracking**: Monitor course enrollments and progress
- **Teacher Dashboard**: Manage courses and view student enrollments
- **Admin Panel**: System overview and user management

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Icons**: FontAwesome
- **Deployment**: Vercel-ready

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

## ⚡ Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd school-portal
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Settings → API
3. Create `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Set Up Database

1. Go to your Supabase dashboard → SQL Editor
2. Copy and paste the SQL from `SUPABASE_SETUP.md`
3. Click "Run" to create tables and policies

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000/portal/register` to create your first account!

## 🎯 Portal Access

### Student Portal
- **URL**: `/portal`
- **Features**: 
  - View enrolled courses
  - Track progress
  - Access course materials
  - View grades

### Teacher Portal
- **URL**: `/portal`
- **Features**:
  - Create and manage courses
  - View student enrollments
  - Grade assignments
  - Course analytics

### Admin Portal
- **URL**: `/portal`
- **Features**:
  - System overview
  - User management
  - Course management
  - Analytics dashboard

## 🗄️ Database Schema

### Tables

1. **users** - User profiles and roles
2. **courses** - Course information
3. **enrollments** - Student-course relationships

### Row Level Security (RLS)

- Users can only access their own data
- Teachers can manage their courses
- Admins have full access
- Students can enroll/unenroll from courses

## 🎨 Customization

### Styling
The portal uses your existing Tailwind CSS setup with dark mode support. The styling is defined in `src/app/globals.css`.

### Colors and Design
- Primary: Blue (#3B82F6)
- Success: Green (#10B981)
- Warning: Yellow (#F59E0B)
- Error: Red (#EF4444)
- Dark mode: Custom dark theme

### Adding New Features
1. Create new components in `src/components/`
2. Add new pages in `src/app/portal/`
3. Update database schema if needed
4. Add RLS policies for security

## 🔧 Development

### Project Structure
```
src/
├── app/
│   ├── portal/          # Portal pages
│   └── globals.css      # Global styles
├── components/
│   ├── auth/            # Authentication components
│   └── portal/          # Portal components
├── lib/
│   └── supabase.ts      # Supabase client
└── types/               # TypeScript types
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository
2. Add environment variables
3. Deploy automatically

### Other Platforms
- Netlify
- Railway
- DigitalOcean App Platform

## 📊 Database Migration

### Merging Two Databases

See `SUPABASE_SETUP.md` for detailed migration instructions.

**Quick Steps:**
1. Export data from source database
2. Import to target database
3. Update environment variables
4. Test functionality

## 🔒 Security Features

- Row Level Security (RLS) policies
- Role-based access control
- Secure authentication with Supabase
- Input validation and sanitization
- CSRF protection

## 🐛 Troubleshooting

### Common Issues

1. **"Invalid API key" error**
   - Check your `.env.local` file
   - Ensure you're using the anon key

2. **"Table doesn't exist" error**
   - Run the SQL setup script again
   - Check Supabase dashboard for tables

3. **Authentication not working**
   - Check site URL settings in Supabase
   - Verify email confirmation settings

### Getting Help

- Check `SUPABASE_SETUP.md` for detailed setup
- Review Supabase documentation
- Check the project issues

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Supabase for the amazing backend platform
- Tailwind CSS for the utility-first styling
- Next.js team for the excellent framework
- Framer Motion for smooth animations

---

**Ready to build the future of education! 🎓**