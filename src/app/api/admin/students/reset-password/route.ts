import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/authz';

export async function POST(request: Request) {
  try {
    const gate = requireAdmin(request);
    if (!gate.ok) return gate.error as Response;

    const { studentId } = await request.json();

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Generate a new random password
    const newPassword = generateRandomPassword();

    // Get student details
    const { data: student, error: studentError } = await supabaseService
      .from('school_students')
      .select('id, first_name, last_name, email')
      .eq('student_id', studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Check if user exists in auth.users
    const { data: authUser, error: authError } = await supabaseService.auth.admin.getUserByEmail(
      student.email || `${student.student_id}@school.local`
    );

    if (authError && authError.message !== 'User not found') {
      console.error('Error checking auth user:', authError);
      return NextResponse.json({ error: 'Error checking user authentication' }, { status: 500 });
    }

    let userId: string;

    if (authUser?.user) {
      // Update existing user's password
      const { error: updateError } = await supabaseService.auth.admin.updateUserById(
        authUser.user.id,
        { password: newPassword }
      );

      if (updateError) {
        console.error('Error updating password:', updateError);
        return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
      }

      userId = authUser.user.id;
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseService.auth.admin.createUser({
        email: student.email || `${student.student_id}@school.local`,
        password: newPassword,
        email_confirm: true,
        user_metadata: {
          student_id: student.student_id,
          full_name: `${student.first_name} ${student.last_name}`,
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
    console.log(`Password reset for student ${student.student_id} (${student.first_name} ${student.last_name})`);

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
      newPassword,
      student: {
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
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


