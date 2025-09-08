import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/authz';

export async function POST(request: Request) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) return gate.error as Response;

    // Basic runtime checks to avoid opaque 500s
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Supabase service credentials are not configured on the server.' }, { status: 500 });
    }

    const { studentId } = await request.json();

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Generate a new random password
    const newPassword = generateRandomPassword();

    // Get student details
    const { data: student, error: studentError } = await supabaseService
      .from('school_students')
      .select('id, full_name, student_id, email')
      .eq('student_id', studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Ensure user exists in auth.users (list and match by email)
    const fallbackDomain = process.env.SCHOOL_EMAIL_DOMAIN || 'school.local';
    const targetEmail = (student.email && String(student.email).trim()) || `${student.student_id}@${fallbackDomain}`;
    const { data: listData, error: listErr } = await supabaseService.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (listErr) return NextResponse.json({ error: 'Error listing auth users' }, { status: 500 });
    const existing = listData.users.find(u => (u.email || '').toLowerCase() === targetEmail.toLowerCase());

    let userId: string;

    if (existing) {
      // Update existing user's password
      const { error: updateError } = await supabaseService.auth.admin.updateUserById(
        existing.id,
        { password: newPassword }
      );

      if (updateError) {
        console.error('Error updating password:', updateError);
        return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
      }

      userId = existing.id;
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseService.auth.admin.createUser({
        email: targetEmail,
        password: newPassword,
        email_confirm: true,
        user_metadata: {
          student_id: student.student_id,
          full_name: student.full_name,
          role: 'student'
        }
      });

      if (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
      }

      userId = newUser.user.id;
    }

    // Log the password reset
    console.log(`Password reset for student ${student.student_id} (${student.full_name})`);

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
      newPassword,
      student: {
        id: student.id,
        name: student.full_name,
        student_id: student.student_id
      }
    });

  } catch (error) {
    console.error('Error in reset password API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Generate a random password
function generateRandomPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  
  // Ensure at least one uppercase, one lowercase, and one number
  password += chars.charAt(Math.floor(Math.random() * 26)); // Uppercase
  password += chars.charAt(26 + Math.floor(Math.random() * 26)); // Lowercase
  password += chars.charAt(52 + Math.floor(Math.random() * 10)); // Number
  
  // Fill the rest randomly
  for (let i = 3; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}


