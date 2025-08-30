import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { CourseRegistrationUpdate } from '@/types/courses';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ registrationId: string }> }
) {
  try {
    const { registrationId } = await params;
    const body: CourseRegistrationUpdate = await request.json();

    // Validate required fields
    if (!body.status || !['pending', 'approved', 'rejected'].includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be pending, approved, or rejected.' },
        { status: 400 }
      );
    }

    // Update the registration
    const { data, error } = await supabase
      .from('student_course_registrations')
      .update({
        status: body.status,
        approved_by: body.approved_by,
        approved_at: body.approved_at,
        rejection_reason: body.rejection_reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', registrationId)
      .select(`
        *,
        school_students!inner(name),
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

    if (!data) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    // Transform the data to match the expected format
    const transformedData = {
      ...data,
      student_name: data.school_students?.name,
      course_name: data.courses?.name,
      course_code: data.courses?.code
    };

    return NextResponse.json({
      message: 'Registration updated successfully',
      registration: transformedData
    });

  } catch (error) {
    console.error('Error in PUT /api/courses/registrations/[registrationId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ registrationId: string }> }
) {
  try {
    const { registrationId } = await params;

    // Delete the registration
    const { error } = await supabase
      .from('student_course_registrations')
      .delete()
      .eq('id', registrationId);

    if (error) {
      console.error('Error deleting registration:', error);
      return NextResponse.json(
        { error: 'Failed to delete registration' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Registration deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/courses/registrations/[registrationId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
