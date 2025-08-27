import { NextResponse, NextRequest } from 'next/server';
import { verifyAdminSessionToken } from './src/lib/admin-session';

const ADMIN_PATH_PREFIX = '/dashboard/admin';

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	if (!pathname.startsWith(ADMIN_PATH_PREFIX)) {
		return NextResponse.next();
	}

	const cookie = request.cookies.get('admin_session')?.value;
	if (!cookie) {
		const url = request.nextUrl.clone();
		url.pathname = '/login/admin';
		url.searchParams.set('next', pathname);
		return NextResponse.redirect(url);
	}

	const session = verifyAdminSessionToken(cookie);
	if (!session) {
		const url = request.nextUrl.clone();
		url.pathname = '/login/admin';
		url.searchParams.set('next', pathname);
		return NextResponse.redirect(url);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/dashboard/admin/:path*'],
};
