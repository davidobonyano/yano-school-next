import { NextResponse, NextRequest } from 'next/server';
import { verifyAdminSessionToken } from './src/lib/admin-session';
import { verifyTeacherSessionToken } from './src/lib/teacher-session';

const ADMIN_PATH_PREFIX = '/dashboard/admin';
const TEACHER_PATH_PREFIX = '/dashboard/teacher';

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	
	// Handle admin routes
	if (pathname.startsWith(ADMIN_PATH_PREFIX)) {
		const cookie = request.cookies.get('admin_session')?.value;
		if (!cookie) {
			const url = request.nextUrl.clone();
			url.pathname = '/login/admin';
			url.searchParams.set('next', pathname);
			return NextResponse.redirect(url);
		}

		const session = await verifyAdminSessionToken(cookie);
		if (!session) {
			const url = request.nextUrl.clone();
			url.pathname = '/login/admin';
			url.searchParams.set('next', pathname);
			return NextResponse.redirect(url);
		}

		return NextResponse.next();
	}
	
	// Handle teacher routes
	if (pathname.startsWith(TEACHER_PATH_PREFIX)) {
		const cookie = request.cookies.get('teacher_session')?.value;
		if (!cookie) {
			const url = request.nextUrl.clone();
			url.pathname = '/login/teacher';
			url.searchParams.set('next', pathname);
			return NextResponse.redirect(url);
		}

		const session = await verifyTeacherSessionToken(cookie);
		if (!session) {
			const url = request.nextUrl.clone();
			url.pathname = '/login/teacher';
			url.searchParams.set('next', pathname);
			return NextResponse.redirect(url);
		}

		return NextResponse.next();
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/dashboard/admin/:path*', '/dashboard/teacher/:path*'],
};
