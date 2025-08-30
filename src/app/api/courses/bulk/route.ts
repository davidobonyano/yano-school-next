import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/courses/bulk - Bulk create/update courses
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courses, operation = 'create' } = body;

    if (!courses || !Array.isArray(courses) || courses.length === 0) {
      return NextResponse.json(
        { error: 'Courses array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (operation === 'create') {
      // Bulk create courses
      const { data, error } = await supabase
        .from('courses')
        .insert(courses)
        .select();

      if (error) {
        console.error('Error bulk creating courses:', error);
        return NextResponse.json(
          { error: 'Failed to create courses' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: `${data.length} courses created successfully`,
        courses: data
      }, { status: 201 });

    } else if (operation === 'update') {
      // Bulk update courses
      const results = [];
      const errors = [];

      for (const course of courses) {
        if (!course.id) {
          errors.push({ course, error: 'Course ID is required for updates' });
          continue;
        }

        const { data, error } = await supabase
          .from('courses')
          .update({
            name: course.name,
            code: course.code,
            description: course.description,
            class_level: course.class_level,
            term: course.term,
            category: course.category,
            stream: course.stream,
            subject_type: course.subject_type,
            updated_at: new Date().toISOString()
          })
          .eq('id', course.id)
          .select()
          .single();

        if (error) {
          errors.push({ course, error: error.message });
        } else {
          results.push(data);
        }
      }

      return NextResponse.json({
        message: `${results.length} courses updated successfully`,
        updated: results,
        errors: errors.length > 0 ? errors : undefined
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid operation. Use "create" or "update"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error in courses bulk POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/bulk - Bulk delete courses
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseIds } = body;

    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json(
        { error: 'Course IDs array is required and must not be empty' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('courses')
      .delete()
      .in('id', courseIds);

    if (error) {
      console.error('Error bulk deleting courses:', error);
      return NextResponse.json(
        { error: 'Failed to delete courses' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `${courseIds.length} courses deleted successfully`
    });

  } catch (error) {
    console.error('Error in courses bulk DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}




