import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/courses/management - Get courses by class/stream with management functions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const classLevel = searchParams.get('class_level');
    const stream = searchParams.get('stream');
    const term = searchParams.get('term');

    switch (action) {
      case 'by_class_stream':
        if (!classLevel) {
          return NextResponse.json(
            { error: 'Class level is required' },
            { status: 400 }
          );
        }
        return await getCoursesByClassStream(classLevel, stream, term);

      case 'curriculum_overview':
        return await getCurriculumOverview();

      case 'subject_types':
        return await getSubjectTypes();

      case 'class_levels':
        return await getClassLevels();

      case 'terms':
        return await getTerms();

      case 'categories':
        return await getCategories();

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: by_class_stream, curriculum_overview, subject_types, class_levels, terms, categories' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in courses management GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get courses by class level and stream
async function getCoursesByClassStream(classLevel: string, stream?: string | null, term?: string | null) {
  let query = supabase
    .from('courses')
    .select('*')
    .eq('class_level', classLevel);

  if (stream) {
    query = query.eq('stream', stream);
  } else {
    // For non-SS classes, stream should be null
    if (!['SS1', 'SS2', 'SS3'].includes(classLevel)) {
      query = query.is('stream', null);
    }
  }

  if (term) {
    query = query.eq('term', term);
  }

  query = query.order('term', { ascending: true });
  query = query.order('name', { ascending: true });

  const { data: courses, error } = await query;

  if (error) {
    throw error;
  }

  return NextResponse.json({
    class_level: classLevel,
    stream,
    term,
    courses,
    count: courses?.length || 0
  });
}

// Get curriculum overview with statistics
async function getCurriculumOverview() {
  const { data: courses, error } = await supabase
    .from('courses')
    .select('*');

  if (error) {
    throw error;
  }

  const overview = {
    total_courses: courses?.length || 0,
    by_class_level: {} as Record<string, number>,
    by_category: {} as Record<string, number>,
    by_subject_type: {} as Record<string, number>,
    by_stream: {} as Record<string, number>
  };

  courses?.forEach(course => {
    // Count by class level
    overview.by_class_level[course.class_level] = (overview.by_class_level[course.class_level] || 0) + 1;
    
    // Count by category
    overview.by_category[course.category] = (overview.by_category[course.category] || 0) + 1;
    
    // Count by subject type
    if (course.subject_type) {
      overview.by_subject_type[course.subject_type] = (overview.by_subject_type[course.subject_type] || 0) + 1;
    }
    
    // Count by stream
    if (course.stream) {
      overview.by_stream[course.stream] = (overview.by_stream[course.stream] || 0) + 1;
    }
  });

  return NextResponse.json(overview);
}

// Get all unique subject types
async function getSubjectTypes() {
  const { data, error } = await supabase
    .from('courses')
    .select('subject_type')
    .not('subject_type', 'is', null);

  if (error) {
    throw error;
  }

  const subjectTypes = [...new Set(data?.map(course => course.subject_type))].sort();
  return NextResponse.json(subjectTypes);
}

// Get all class levels
async function getClassLevels() {
  const { data, error } = await supabase
    .from('courses')
    .select('class_level');

  if (error) {
    throw error;
  }

  const classLevels = [...new Set(data?.map(course => course.class_level))].sort();
  return NextResponse.json(classLevels);
}

// Get all terms
async function getTerms() {
  const { data, error } = await supabase
    .from('courses')
    .select('term');

  if (error) {
    throw error;
  }

  const terms = [...new Set(data?.map(course => course.term))].sort();
  return NextResponse.json(terms);
}

// Get all categories
async function getCategories() {
  const { data, error } = await supabase
    .from('courses')
    .select('category');

  if (error) {
    throw error;
  }

  const categories = [...new Set(data?.map(course => course.category))].sort();
  return NextResponse.json(categories);
}

// POST /api/courses/management - Course management operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'regenerate_codes':
        return await regenerateCourseCodes(data);

      case 'assign_streams':
        return await assignStreams(data);

      case 'update_subject_types':
        return await updateSubjectTypes(data);

      case 'rename_courses':
        return await renameCourses(data);

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: regenerate_codes, assign_streams, update_subject_types, rename_courses' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in courses management POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Regenerate course codes based on new format
async function regenerateCourseCodes(format: string) {
  // This would implement logic to regenerate course codes
  // based on a new format specification
  return NextResponse.json({
    message: 'Course code regeneration not yet implemented',
    format
  });
}

// Assign streams to courses based on class level
async function assignStreams(assignmentRules: any) {
  // This would implement logic to assign streams to courses
  // based on class level and subject type
  return NextResponse.json({
    message: 'Stream assignment not yet implemented',
    rules: assignmentRules
  });
}

// Update subject types based on course names
async function updateSubjectTypes(updateRules: any) {
  // This would implement logic to update subject types
  // based on course names and categories
  return NextResponse.json({
    message: 'Subject type updates not yet implemented',
    rules: updateRules
  });
}

// Rename/replace course names across class levels/terms/streams
async function renameCourses(payload: any) {
  const { from, to, class_levels, terms, streams } = payload || {};

  if (!from || !to) {
    return NextResponse.json({ error: 'from and to are required' }, { status: 400 });
  }
  if (!Array.isArray(class_levels) || class_levels.length === 0) {
    return NextResponse.json({ error: 'class_levels must be a non-empty array' }, { status: 400 });
  }
  if (!Array.isArray(terms) || terms.length === 0) {
    return NextResponse.json({ error: 'terms must be a non-empty array' }, { status: 400 });
  }

  // Build base query
  let query = supabase
    .from('courses')
    .update({ name: to, updated_at: new Date().toISOString() })
    .in('class_level', class_levels as string[])
    .in('term', terms as string[])
    .eq('name', from);

  // Streams filter: if provided and includes null, handle both null and listed values
  if (Array.isArray(streams) && streams.length > 0) {
    const withNull = streams.includes(null) || streams.includes('null');
    if (withNull) {
      // supabase-js can't do OR easily; perform two updates
      const { data: updatedWithStream, error: err1 } = await supabase
        .from('courses')
        .update({ name: to, updated_at: new Date().toISOString() })
        .in('class_level', class_levels as string[])
        .in('term', terms as string[])
        .eq('name', from)
        .in('stream', (streams as any[]).filter((s) => s && s !== 'null'))
        .select('id');
      if (err1) {
        console.error('rename with stream error', err1);
        return NextResponse.json({ error: 'Failed to rename courses (streamed)' }, { status: 500 });
      }
      const { data: updatedNullStream, error: err2 } = await supabase
        .from('courses')
        .update({ name: to, updated_at: new Date().toISOString() })
        .in('class_level', class_levels as string[])
        .in('term', terms as string[])
        .eq('name', from)
        .is('stream', null)
        .select('id');
      if (err2) {
        console.error('rename null stream error', err2);
        return NextResponse.json({ error: 'Failed to rename courses (null stream)' }, { status: 500 });
      }
      const count = (updatedWithStream?.length || 0) + (updatedNullStream?.length || 0);
      return NextResponse.json({ message: `Renamed ${count} course(s)` });
    } else {
      query = query.in('stream', streams as string[]);
    }
  } else {
    // If no streams provided, do not filter by stream (affects both null and non-null)
  }

  const { data, error } = await query.select('id, name, class_level, term, stream');
  if (error) {
    console.error('rename courses error', error);
    return NextResponse.json({ error: 'Failed to rename courses' }, { status: 500 });
  }
  return NextResponse.json({ message: `Renamed ${data?.length || 0} course(s)` });
}




