import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/courses - Get all courses with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classLevel = searchParams.get('class_level');
    const term = searchParams.get('term');
    const sessionId = searchParams.get('session_id');
    const termId = searchParams.get('term_id');
    const category = searchParams.get('category');
    const stream = searchParams.get('stream');
    const subjectType = searchParams.get('subject_type');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Debug logging
    console.log('Course API called with params:', {
      classLevel,
      term,
      stream,
      category,
      search
    });

    const buildQuery = () => {
      let q = supabase
        .from('courses')
        .select('*', { count: 'exact' });
      
      // Apply filters - handle both old and new table structures
      if (classLevel) {
        console.log('Filtering by class_level:', classLevel);
        q = q.eq('class_level', classLevel);
      }
      if (term) q = q.eq('term', term);
      if (sessionId) q = q.eq('session_id', sessionId);
      if (termId) q = q.eq('term_id', termId);
      if (category) q = q.eq('category', category);
      if (stream) q = q.eq('stream', stream);
      if (subjectType) q = q.eq('subject_type', subjectType);
      if (search) q = q.or(`name.ilike.%${search}%,code.ilike.%${search}%,description.ilike.%${search}%`);
      
      q = q.range(offset, offset + limit - 1);
      q = q.order('class_level', { ascending: true });
      q = q.order('term', { ascending: true });
      q = q.order('name', { ascending: true });
      return q;
    };

    // Try to filter by is_active if the column exists, otherwise fetch all courses
    let { data: courses, error, count } = await buildQuery();
    
    // Check if is_active column exists by trying to filter by it
    try {
      const testQuery = supabase.from('courses').select('id').eq('is_active', true).limit(1);
      const { error: testError } = await testQuery;
      if (!testError) {
        // is_active column exists, so apply the filter
        ({ data: courses, error, count } = await buildQuery().eq('is_active', true));
      }
    } catch (e) {
      // is_active column doesn't exist, use the query without the filter
      console.warn('is_active column not found, fetching all courses');
    }

    if (error) {
      console.error('Error fetching courses:', error);
      return NextResponse.json(
        { error: 'Failed to fetch courses' },
        { status: 500 }
      );
    }

    // Debug logging for returned courses
    console.log(`Returning ${courses?.length || 0} courses. Class levels found:`, 
      courses?.map(c => c.class_level).filter((v, i, a) => a.indexOf(v) === i) || []
    );

    return NextResponse.json({
      courses,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error in courses GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/courses - Create new course
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, description, class_level, term, category, stream, subject_type } = body;

    // Validation
    if (!name || !code || !class_level || !term || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: name, code, class_level, term, category' },
        { status: 400 }
      );
    }

    // Check if course code already exists
    const { data: existingCourse } = await supabase
      .from('courses')
      .select('id')
      .eq('code', code)
      .single();

    if (existingCourse) {
      return NextResponse.json(
        { error: 'Course code already exists' },
        { status: 409 }
      );
    }

    // Create new course
    const { data: course, error } = await supabase
      .from('courses')
      .insert({
        name,
        code,
        description,
        class_level,
        term,
        category,
        stream,
        subject_type
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating course:', error);
      return NextResponse.json(
        { error: 'Failed to create course' },
        { status: 500 }
      );
    }

    return NextResponse.json(course, { status: 201 });

  } catch (error) {
    console.error('Error in courses POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/courses - Update course
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, code, description, class_level, term, category, stream, subject_type } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Check if course exists
    const { data: existingCourse } = await supabase
      .from('courses')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if new code conflicts with existing course (excluding current course)
    if (code) {
      const { data: codeConflict } = await supabase
        .from('courses')
        .select('id')
        .eq('code', code)
        .neq('id', id)
        .single();

      if (codeConflict) {
        return NextResponse.json(
          { error: 'Course code already exists' },
          { status: 409 }
        );
      }
    }

    // Update course
    const { data: course, error } = await supabase
      .from('courses')
      .update({
        name,
        code,
        description,
        class_level,
        term,
        category,
        stream,
        subject_type,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating course:', error);
      return NextResponse.json(
        { error: 'Failed to update course' },
        { status: 500 }
      );
    }

    return NextResponse.json(course);

  } catch (error) {
    console.error('Error in courses PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/courses - Delete course
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Check if course exists
    const { data: existingCourse } = await supabase
      .from('courses')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Delete course
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting course:', error);
      return NextResponse.json(
        { error: 'Failed to delete course' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Course deleted successfully' });

  } catch (error) {
    console.error('Error in courses DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}




