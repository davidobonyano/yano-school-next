import crypto from 'crypto';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'admin_session';
const DEFAULT_TTL_SECONDS = 60 * 60 * 8; // 8 hours

function getSecret(): string {
	const secret = process.env.ADMIN_SESSION_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
	if (!secret) {
		// eslint-disable-next-line no-console
		console.warn('ADMIN_SESSION_SECRET not set; falling back to anon key. Set ADMIN_SESSION_SECRET for stronger security.');
	}
	return secret;
}

export type AdminSessionPayload = {
	adminId: string;
	email: string;
	name?: string;
	exp: number; // epoch seconds
};

function base64url(input: Buffer | string): string {
	return Buffer.from(input)
		.toString('base64')
		.replace(/=/g, '')
		.replace(/\+/g, '-')
		.replace(/\//g, '_');
}

function sign(data: string, secret: string): string {
	return base64url(crypto.createHmac('sha256', secret).update(data).digest());
}

export function createAdminSessionToken(payload: Omit<AdminSessionPayload, 'exp'>, ttlSeconds = DEFAULT_TTL_SECONDS): string {
	const header = { alg: 'HS256', typ: 'JWT' };
	const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
	const fullPayload: AdminSessionPayload = { ...payload, exp };
	const secret = getSecret();
	const headerB64 = base64url(JSON.stringify(header));
	const payloadB64 = base64url(JSON.stringify(fullPayload));
	const signature = sign(`${headerB64}.${payloadB64}`, secret);
	return `${headerB64}.${payloadB64}.${signature}`;
}

export function verifyAdminSessionToken(token: string): AdminSessionPayload | null {
	try {
		const [headerB64, payloadB64, signature] = token.split('.');
		if (!headerB64 || !payloadB64 || !signature) return null;
		const secret = getSecret();
		const expected = sign(`${headerB64}.${payloadB64}`, secret);
		if (expected !== signature) return null;
		const json = JSON.parse(Buffer.from(payloadB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
		if (!json?.exp || Date.now() / 1000 > json.exp) return null;
		return json as AdminSessionPayload;
	} catch {
		return null;
	}
}

export function setAdminSessionCookie(token: string) {
	cookies().set(SESSION_COOKIE_NAME, token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		path: '/',
		sameSite: 'lax',
		maxAge: DEFAULT_TTL_SECONDS,
	});
}

export function clearAdminSessionCookie() {
	cookies().set(SESSION_COOKIE_NAME, '', {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		path: '/',
		sameSite: 'lax',
		expires: new Date(0),
	});
}

export function readAdminSession() : AdminSessionPayload | null {
	const cookie = cookies().get(SESSION_COOKIE_NAME)?.value;
	if (!cookie) return null;
	return verifyAdminSessionToken(cookie);
}
