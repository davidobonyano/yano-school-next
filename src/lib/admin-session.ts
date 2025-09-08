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

function base64urlEncodeString(input: string): string {
	// Edge-safe: prefer btoa if available, fallback to Buffer in Node
	const utf8 = new TextEncoder().encode(input);
	let binary = '';
	for (let i = 0; i < utf8.length; i++) binary += String.fromCharCode(utf8[i]);
	// @ts-ignore
	const base64 = (typeof btoa !== 'undefined') ? btoa(binary) : Buffer.from(input, 'utf8').toString('base64');
	return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64urlEncodeBytes(bytes: Uint8Array): string {
	let binary = '';
	for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
	// @ts-ignore
	const base64 = (typeof btoa !== 'undefined') ? btoa(binary) : Buffer.from(bytes).toString('base64');
	return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64urlDecodeToString(b64url: string): string {
	const base64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
	// @ts-ignore
	const binary = (typeof atob !== 'undefined') ? atob(base64) : Buffer.from(base64, 'base64').toString('binary');
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return new TextDecoder().decode(bytes);
}

async function sign(data: string, secret: string): Promise<string> {
	const encoder = new TextEncoder();
	const keyData = encoder.encode(secret);
	const dataBuffer = encoder.encode(data);
	
	const cryptoKey = await crypto.subtle.importKey(
		'raw',
		keyData,
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	
	const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBuffer);
	return base64urlEncodeBytes(new Uint8Array(signature));
}

export async function createAdminSessionToken(payload: Omit<AdminSessionPayload, 'exp'>, ttlSeconds = DEFAULT_TTL_SECONDS): Promise<string> {
	const header = { alg: 'HS256', typ: 'JWT' };
	const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
	const fullPayload: AdminSessionPayload = { ...payload, exp };
	const secret = getSecret();
	const headerB64 = base64urlEncodeString(JSON.stringify(header));
	const payloadB64 = base64urlEncodeString(JSON.stringify(fullPayload));
	const signature = await sign(`${headerB64}.${payloadB64}`, secret);
	return `${headerB64}.${payloadB64}.${signature}`;
}

export async function verifyAdminSessionToken(token: string): Promise<AdminSessionPayload | null> {
	try {
		const [headerB64, payloadB64, signature] = token.split('.');
		if (!headerB64 || !payloadB64 || !signature) return null;
		const secret = getSecret();
		const expected = await sign(`${headerB64}.${payloadB64}`, secret);
		if (expected !== signature) return null;
		const json = JSON.parse(base64urlDecodeToString(payloadB64));
		if (!json?.exp || Date.now() / 1000 > json.exp) return null;
		return json as AdminSessionPayload;
	} catch {
		return null;
	}
}

export async function setAdminSessionCookie(token: string) {
	(await cookies()).set(SESSION_COOKIE_NAME, token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		path: '/',
		sameSite: 'lax',
		maxAge: DEFAULT_TTL_SECONDS,
	});
}

export async function clearAdminSessionCookie() {
	(await cookies()).set(SESSION_COOKIE_NAME, '', {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		path: '/',
		sameSite: 'lax',
		expires: new Date(0),
	});
}

export async function readAdminSession(): Promise<AdminSessionPayload | null> {
	const cookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
	if (!cookie) return null;
	return await verifyAdminSessionToken(cookie);
}
