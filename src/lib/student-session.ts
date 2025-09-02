'use client';

export type StudentSession = {
  student_id: string;
  full_name: string;
  class_level?: string | null;
  stream?: string | null;
  is_active?: boolean | null;
};

const STORAGE_KEY = 'student_session';

export function setStudentSession(session: StudentSession) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {}
}

export function getStudentSession(): StudentSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StudentSession;
  } catch {
    return null;
  }
}

export function clearStudentSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}




