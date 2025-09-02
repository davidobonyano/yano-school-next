# Course Registration System

## Overview

The course registration system allows students to register for courses and teachers to approve/reject these registrations. This system operates independently of direct teacher-course assignments.

## How It Works

### 1. Student Course Registration
- Students can view available courses for their class level and stream
- Students can register for courses by selecting:
  - Course
  - Term (1st, 2nd, 3rd)
  - Session (e.g., "2025/2026")
- Registrations start with "pending" status
- Students can cancel pending registrations

### 2. Teacher Approval Process
- Teachers have access to all class levels and courses
- Teachers can view all pending registrations
- Teachers can approve or reject registrations
- When rejecting, teachers must provide a reason
- Teachers can see all registrations (pending, approved, rejected)

### 3. Admin Oversight
- Admins have full access to all registrations
- Admins can view, approve, reject, and delete registrations
- Admins can see comprehensive statistics

## Database Schema

### `student_course_registrations` Table
```sql
CREATE TABLE student_course_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES school_students(id),
  course_id uuid REFERENCES courses(id),
  class_level text NOT NULL,
  stream text, -- for SS classes
  term text NOT NULL,
  session text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by uuid REFERENCES teachers(id),
  approved_at timestamptz,
  rejection_reason text,
  registered_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Unique constraint per student per course per term/session
  UNIQUE(student_id, course_id, term, session)
);
```

## API Endpoints

### `/api/courses/registrations`
- **GET**: Fetch registrations with filtering
- **POST**: Create new registration
- **PUT**: Update registration (approve/reject)
- **DELETE**: Delete registration

### Query Parameters
- `student_id`: Filter by specific student
- `course_id`: Filter by specific course
- `class_level`: Filter by class level
- `stream`: Filter by stream
- `term`: Filter by term
- `session`: Filter by session
- `status`: Filter by status (pending/approved/rejected)

## User Roles & Permissions

### Students
- ✅ View available courses for their class level
- ✅ Register for courses
- ✅ View their own registrations
- ✅ Cancel pending registrations
- ❌ Cannot see other students' registrations

### Teachers
- ✅ View all courses and registrations
- ✅ Approve/reject student registrations
- ✅ View registration statistics
- ❌ Cannot create/edit courses
- ❌ Cannot delete registrations

### Admins
- ✅ Full access to all registrations
- ✅ Approve/reject registrations
- ✅ Delete registrations
- ✅ View comprehensive statistics
- ✅ Manage courses (CRUD operations)

## Frontend Components

### `CourseRegistrationManager`
- Main component for managing registrations
- Role-based interface (student/teacher/admin)
- Registration forms and approval workflows

### Integration Points
- **Student Dashboard**: Course viewing + registration
- **Teacher Dashboard**: Course viewing + registration management
- **Admin Dashboard**: Course management + registration oversight

## Key Features

1. **Role-Based Access Control**: Different interfaces for different user types
2. **Registration Validation**: Prevents duplicate registrations
3. **Approval Workflow**: Teachers can approve/reject with reasons
4. **Status Tracking**: Clear status indicators (pending/approved/rejected)
5. **Audit Trail**: Tracks who approved/rejected and when
6. **Flexible Filtering**: Multiple filter options for different views

## Future Enhancements

1. **Course Materials**: Add support for course materials (PDFs, links)
2. **Session Management**: Better session/year management
3. **Bulk Operations**: Bulk approve/reject registrations
4. **Notifications**: Email/SMS notifications for status changes
5. **Reporting**: Advanced analytics and reporting
6. **Integration**: Connect with timetable and grading systems

## Usage Examples

### Student Registration Flow
1. Student navigates to Courses page
2. Views available courses for their class level
3. Clicks "Register for Course"
4. Selects course, term, and session
5. Submits registration (status: pending)
6. Waits for teacher approval

### Teacher Approval Flow
1. Teacher navigates to Courses page
2. Views pending registrations
3. Reviews student's course selection
4. Clicks "Approve" or "Reject"
5. If rejecting, provides reason
6. Registration status updates accordingly

### Admin Management
1. Admin navigates to Courses page
2. Views all registrations and statistics
3. Can approve/reject any registration
4. Can delete registrations if needed
5. Has full oversight of the system

## Security Considerations

- Row Level Security (RLS) enabled on registrations table
- Students can only see their own registrations
- Teachers can see all registrations but cannot modify courses
- Admins have full access to everything
- All operations are logged and auditable











