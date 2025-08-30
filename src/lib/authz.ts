export type RequestRole = 'admin' | 'student' | 'teacher' | 'anonymous';

export function getRequestRole(request: Request): RequestRole {
  const role = (request.headers.get('x-role') || '').toLowerCase();
  if (role === 'admin') return 'admin';
  if (role === 'student') return 'student';
  if (role === 'teacher') return 'teacher';
  return 'anonymous';
}

export function requireAdmin(request: Request): { ok: boolean; error?: Response } {
  // Accept either explicit header x-role: admin or a valid admin session cookie
  const role = getRequestRole(request);
  if (role === 'admin') return { ok: true };
  try {
    // Lazy import to avoid circular deps in edge
    const { readAdminSession } = require('./admin-session');
    const session = readAdminSession?.();
    if (session?.adminId) return { ok: true };
  } catch {}
  return { ok: false, error: new Response(JSON.stringify({ error: 'Forbidden: admin only' }), { status: 403 }) };
}

export function getRequesterStudentId(request: Request): string | null {
  const val = request.headers.get('x-student-id');
  return val ? val : null;
}








