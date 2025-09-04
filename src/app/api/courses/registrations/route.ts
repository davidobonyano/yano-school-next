import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/courses/registrations - Get course registrations with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentIdParam = searchParams.get('student_id');
    const courseId = searchParams.get('course_id');
    const classLevel = searchParams.get('class_level');
    const stream = searchParams.get('stream');
    const term = searchParams.get('term');
    const session = searchParams.get('session');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Resolve student_id param (accepts either UUID or human student_id like YAN001)
    let resolvedStudentUuid: string | null = null;
    if (studentIdParam) {
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      if (uuidRegex.test(studentIdParam)) {
        resolvedStudentUuid = studentIdParam;
      } else {
        const { data: studentLookup, error: lookupError } = await supabase
          .from('school_students')
          .select('id')
          .eq('student_id', studentIdParam)
          .single();
        if (!lookupError && studentLookup?.id) {
          resolvedStudentUuid = studentLookup.id as string;
        }
      }
    }

    let query = supabase
      .from('student_course_registrations')
      .select(`
        *,
        school_students!inner(full_name),
        courses!inner(name, code)
      `, { count: 'exact' });

    // Apply filters
    if (resolvedStudentUuid) {
      query = query.eq('student_id', resolvedStudentUuid);
    }
    if (courseId) {
      query = query.eq('course_id', courseId);
    }
    if (classLevel) {
      query = query.eq('class_level', classLevel);
    }
    if (stream) {
      query = query.eq('stream', stream);
    }
    if (term) {
      query = query.eq('term', term);
    }
    if (session) {
      query = query.eq('session', session);
    }
    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);
    query = query.order('registered_at', { ascending: false });

    const { data: registrations, error, count } = await query;

    if (error) {
      console.error('Error fetching registrations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch registrations' },
        { status: 500 }
      );
    }

    // Transform data to include joined fields
    const transformedRegistrations = registrations?.map(reg => ({
      ...reg,
      student_name: reg.school_students?.full_name,
      course_name: reg.courses?.name,
      course_code: reg.courses?.code
    })) || [];

    return NextResponse.json({
      registrations: transformedRegistrations,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error in registrations GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/courses/registrations - Create new course registration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { course_id, class_level, stream, term, session } = body;

    // Validation
    if (!course_id || !class_level || !term || !session) {
      return NextResponse.json(
        { error: 'Missing required fields: course_id, class_level, term, session' },
        { status: 400 }
      );
    }

    // Get student ID from auth context (in real app, this would come from JWT)
    // For now, we'll require it in the request body
    const studentIdInput = body.student_id;
    if (!studentIdInput) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Resolve to UUID if a human-readable ID was provided
    let studentId: string = studentIdInput;
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(studentIdInput)) {
      const { data: studentLookup, error: lookupError } = await supabase
        .from('school_students')
        .select('id')
        .eq('student_id', studentIdInput)
        .single();
      if (lookupError || !studentLookup?.id) {
        return NextResponse.json(
          { error: 'Student not found' },
          { status: 404 }
        );
      }
      studentId = studentLookup.id as string;
    }

    // Check if course exists and is active. If the is_active column is missing or causes an error,
    // retry without the is_active filter (for backward compatibility with older schemas).
    let { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, class_level, stream')
      .eq('id', course_id)
      .eq('is_active', true)
      .single();

    if (courseError) {
      // Retry without is_active filter
      const retry = await supabase
        .from('courses')
        .select('id, class_level, stream')
        .eq('id', course_id)
        .single();
      course = retry.data as any;
      courseError = retry.error as any;
    }

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Course not found or inactive' },
        { status: 404 }
      );
    }

    // Check if student exists
    const { data: student, error: studentError } = await supabase
      .from('school_students')
      .select('id, class_level, stream')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Check if registration already exists
    const { data: existingRegistration } = await supabase
      .from('student_course_registrations')
      .select('id')
      .eq('student_id', studentId)
      .eq('course_id', course_id)
      .eq('term', term)
      .eq('session', session)
      .single();

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'Registration already exists for this course, term, and session' },
        { status: 409 }
      );
    }

    // Create new registration
    const { data: registration, error } = await supabase
      .from('student_course_registrations')
      .insert({
        student_id: studentId,
        course_id,
        class_level,
        stream,
        term,
        session,
        status: 'pending'
      })
      .select(`
        *,
        school_students!inner(full_name),
        courses!inner(name, code)
      `)
      .single();

    if (error) {
      console.error('Error creating registration:', error);
      return NextResponse.json(
        { error: 'Failed to create registration' },
        { status: 500 }
      );
    }

    // Transform response
    const transformedRegistration = {
      ...registration,
      student_name: registration.school_students?.full_name,
      course_name: registration.courses?.name,
      course_code: registration.courses?.code
    };

    return NextResponse.json(transformedRegistration, { status: 201 });

  } catch (error) {
    console.error('Error in registrations POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/courses/registrations - Update registration (approve/reject)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, rejection_reason } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Registration ID and status are required' },
        { status: 400 }
      );
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be either "approved" or "rejected"' },
        { status: 400 }
      );
    }

    // Check if registration exists
    const { data: existingRegistration } = await supabase
      .from('student_course_registrations')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existingRegistration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    if (existingRegistration.status !== 'pending') {
      return NextResponse.json(
        { error: 'Registration has already been processed' },
        { status: 400 }
      );
    }

    // Update registration
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'approved') {
      updateData.approved_by = body.teacher_id; // In real app, get from auth context
      updateData.approved_at = new Date().toISOString();
    } else if (status === 'rejected') {
      updateData.rejection_reason = rejection_reason;
    }

    const { data: registration, error } = await supabase
      .from('student_course_registrations')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        school_students!inner(full_name),
        courses!inner(name, code)
      `)
      .single();

    if (error) {
      console.error('Error updating registration:', error);
      return NextResponse.json(
        { error: 'Failed to update registration' },
        { status: 500 }
      );
    }

    // Transform response
    const transformedRegistration = {
      ...registration,
      student_name: registration.school_students?.full_name,
      course_name: registration.courses?.name,
      course_code: registration.courses?.code
    };

    return NextResponse.json(transformedRegistration);

  } catch (error) {
    console.error('Error in registrations PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/registrations - Delete registration
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Registration ID is required' },
        { status: 400 }
      );
    }

    // Check if registration exists
    const { data: existingRegistration } = await supabase
      .from('student_course_registrations')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existingRegistration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    // Only allow deletion of pending registrations
    if (existingRegistration.status !== 'pending') {
      return NextResponse.json(
        { error: 'Cannot delete processed registrations' },
        { status: 400 }
      );
    }

    // Delete registration
    const { error } = await supabase
      .from('student_course_registrations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting registration:', error);
      return NextResponse.json(
        { error: 'Failed to delete registration' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Registration deleted successfully' });

  } catch (error) {
    console.error('Error in registrations DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


