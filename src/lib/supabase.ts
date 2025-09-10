import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
	// eslint-disable-next-line no-console
	console.warn('Supabase env vars are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export type TeacherRow = {
	id: string;
	full_name: string;
	email: string | null;
	school_name: string | null;
	created_at: string;
	updated_at: string;
	is_active: boolean;
};

export type StudentRow = {
	id: string;
	student_id: string;
	full_name: string;
	class_level: string | null;
	stream?: string | null;
	school_name: string | null;
	email: string | null;
	phone: string | null;
	parent_name: string | null;
	parent_phone: string | null;
	admission_date: string | null;
	is_active: boolean;
	created_by: string | null;
	created_at: string;
	updated_at: string;
  	profile_image_url?: string | null;
};

export type StudentCredentialRow = {
	student_id: string; // matches StudentRow.student_id
	password_hash: string;
	created_at: string;
	updated_at: string;
};

export type AdminRow = {
	id: string;
	name: string;
	email: string;
	password: string; // hashed
	is_active: boolean | null;
	created_at: string | null;
	updated_at: string | null;
};


