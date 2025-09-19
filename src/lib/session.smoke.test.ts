import { describe, it, expect } from 'vitest';
import { createAdminSessionToken, verifyAdminSessionToken } from './admin-session';
import { createTeacherSessionToken, verifyTeacherSessionToken } from './teacher-session';

describe('session token roundtrip', () => {
	it('admin token create/verify works', async () => {
		if (!(globalThis as any).crypto || !(globalThis as any).crypto.subtle) {
			// Skip if WebCrypto is unavailable in the environment
			return;
		}
		process.env.ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'test-admin-secret';
		const token = await createAdminSessionToken({ adminId: 'a1', email: 'admin@example.com', name: 'Admin' }, 60);
		const verified = await verifyAdminSessionToken(token);
		expect(verified?.email).toBe('admin@example.com');
	});

	it('teacher token create/verify works', async () => {
		if (!(globalThis as any).crypto || !(globalThis as any).crypto.subtle) {
			// Skip if WebCrypto is unavailable in the environment
			return;
		}
		process.env.TEACHER_SESSION_SECRET = process.env.TEACHER_SESSION_SECRET || 'test-teacher-secret';
		const token = await createTeacherSessionToken({ teacherId: 't1', email: 'teacher@example.com', name: 'Teacher' }, 60);
		const verified = await verifyTeacherSessionToken(token);
		expect(verified?.email).toBe('teacher@example.com');
	});
});


