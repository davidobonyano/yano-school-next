import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/courses/registrations/reset - Bulk reset registrations for a term/session
export async function POST(request: NextRequest) {
	try {
		const body = await request.json().catch(() => ({}));
		const term = body.term as string | undefined;
		const session = body.session as string | undefined;
		const classLevel = body.class_level as string | undefined;
		const studentId = body.student_id as string | undefined;

		if (!term || !session) {
			return NextResponse.json(
				{ error: 'term and session are required' },
				{ status: 400 }
			);
		}

		// Build delete query with filters
		let query = supabase
			.from('student_course_registrations')
			.delete()
			.eq('term', term)
			.eq('session', session);

		if (classLevel) query = query.eq('class_level', classLevel);
		if (studentId) query = query.eq('student_id', studentId);

		const { error } = await query;
		if (error) {
			console.error('Error resetting registrations:', error);
			return NextResponse.json(
				{ error: 'Failed to reset registrations' },
				{ status: 500 }
			);
		}

		return NextResponse.json({ message: 'Registrations reset successfully' });
	} catch (error) {
		console.error('Error in registrations reset:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}


