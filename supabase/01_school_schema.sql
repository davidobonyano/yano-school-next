-- Safe bootstrap for school portal tables in public schema
-- Run in Supabase SQL Editor

-- ============ GUARD: create tables if missing ============
create table if not exists public.teachers (
  id uuid primary key,
  full_name text not null,
  email text unique,
  school_name text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  is_active boolean default true not null
);

create table if not exists public.teacher_credentials (
  teacher_id uuid primary key references public.teachers(id) on delete cascade,
  password_hash text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Prefer school_students as the canonical table for the school portal
create table if not exists public.school_students (
  id uuid primary key,
  student_id text not null,
  full_name text not null,
  class_level text,
  school_name text,
  email text,
  phone text,
  parent_name text,
  parent_phone text,
  admission_date date,
  is_active boolean default true not null,
  created_by uuid,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Ensure uniqueness on student_id for FK usage
do $$
begin
  alter table public.school_students
    add constraint school_students_student_id_key unique (student_id);
exception
  when duplicate_object then null;
end $$;

create table if not exists public.student_credentials (
  student_id text primary key,
  password_hash text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Recreate FK to students(student_id) safely
do $$
begin
  alter table public.student_credentials
    drop constraint if exists student_credentials_student_id_fkey;
  alter table public.student_credentials
    add constraint student_credentials_student_id_fkey
      foreign key (student_id) references public.school_students(student_id) on delete cascade;
exception
  when undefined_object then null;
end $$;

-- ============ SEEDS (idempotent) ============
-- Teachers
insert into public.teachers (id, full_name, email, school_name, created_at, updated_at, is_active) values
('1fbd54f5-2d78-45ab-aa09-f0709056d67b','Test Teacher','teacher@test.com','Demo Secondary School','2025-07-31 21:52:43.27354+00','2025-07-31 21:52:43.27354+00',true)
on conflict (id) do update set full_name=excluded.full_name, email=excluded.email, school_name=excluded.school_name, updated_at=excluded.updated_at, is_active=excluded.is_active;

insert into public.teachers (id, full_name, email, school_name, created_at, updated_at, is_active) values
('33675fac-70f7-4883-bbd7-d4a4d02cf1a6','dave','godsentryan@gmail.com','yano','2025-08-01 08:03:05.820385+00','2025-08-01 08:03:05.820385+00',true)
on conflict (id) do update set full_name=excluded.full_name, email=excluded.email, school_name=excluded.school_name, updated_at=excluded.updated_at, is_active=excluded.is_active;

insert into public.teachers (id, full_name, email, school_name, created_at, updated_at, is_active) values
('5073f7c0-1150-4778-9158-96ffaea26e62','dave','davidobonyanoefe@gmail.com','yano','2025-08-01 08:00:30.326104+00','2025-08-01 08:00:30.326104+00',true)
on conflict (id) do update set full_name=excluded.full_name, email=excluded.email, school_name=excluded.school_name, updated_at=excluded.updated_at, is_active=excluded.is_active;

insert into public.teachers (id, full_name, email, school_name, created_at, updated_at, is_active) values
('dd5aab0c-6bca-467c-8bb1-2b17f6ec67bc','Jerry','oyedelejeremiah.ng@gmail.com','yano','2025-07-31 22:08:35.548924+00','2025-07-31 22:08:35.548924+00',true)
on conflict (id) do update set full_name=excluded.full_name, email=excluded.email, school_name=excluded.school_name, updated_at=excluded.updated_at, is_active=excluded.is_active;

-- Students
insert into public.school_students (id, student_id, full_name, class_level, school_name, email, phone, parent_name, parent_phone, admission_date, is_active, created_by, created_at, updated_at) values
('5ec568f5-b153-4b03-a09d-776a464e186c','YAN004','David Wilson','SS3','Demo Secondary School','david@demo.com','08045678901','Mrs. Wilson','08054321098','2025-08-23',true,'1fbd54f5-2d78-45ab-aa09-f0709056d67b','2025-08-23 07:08:06.709941+00','2025-08-23 07:08:06.709941+00')
on conflict (id) do update set full_name=excluded.full_name, class_level=excluded.class_level, school_name=excluded.school_name, email=excluded.email, phone=excluded.phone, parent_name=excluded.parent_name, parent_phone=excluded.parent_phone, admission_date=excluded.admission_date, updated_at=excluded.updated_at, is_active=excluded.is_active;

insert into public.school_students (id, student_id, full_name, class_level, school_name, email, phone, parent_name, parent_phone, admission_date, is_active, created_by, created_at, updated_at) values
('686b5be6-6b3c-4caa-893b-125f97cb16ad','YAN007','oyedele tope','SS1','yano',null,null,null,null,'2025-08-23',true,'33675fac-70f7-4883-bbd7-d4a4d02cf1a6','2025-08-23 08:50:34.797975+00','2025-08-23 08:50:34.797975+00')
on conflict (id) do update set full_name=excluded.full_name, class_level=excluded.class_level, school_name=excluded.school_name, email=excluded.email, phone=excluded.phone, parent_name=excluded.parent_name, parent_phone=excluded.parent_phone, admission_date=excluded.admission_date, updated_at=excluded.updated_at, is_active=excluded.is_active;

insert into public.school_students (id, student_id, full_name, class_level, school_name, email, phone, parent_name, parent_phone, admission_date, is_active, created_by, created_at, updated_at) values
('85316e3d-83d6-4961-9513-2718273d7434','YAN006','obonyano david','SS1','yano',null,null,null,null,'2025-08-23',true,'33675fac-70f7-4883-bbd7-d4a4d02cf1a6','2025-08-23 07:41:59.352493+00','2025-08-23 07:41:59.352493+00')
on conflict (id) do update set full_name=excluded.full_name, class_level=excluded.class_level, school_name=excluded.school_name, email=excluded.email, phone=excluded.phone, parent_name=excluded.parent_name, parent_phone=excluded.parent_phone, admission_date=excluded.admission_date, updated_at=excluded.updated_at, is_active=excluded.is_active;

insert into public.school_students (id, student_id, full_name, class_level, school_name, email, phone, parent_name, parent_phone, admission_date, is_active, created_by, created_at, updated_at) values
('c5b27a9f-89af-4ef9-8ed0-64bb17bf3131','YAN005','obonyano david','JSS1','yan','godsentryan@gmail.com','09035526146',null,null,'2025-08-23',true,'33675fac-70f7-4883-bbd7-d4a4d02cf1a6','2025-08-23 07:10:22.784988+00','2025-08-23 07:10:22.784988+00')
on conflict (id) do update set full_name=excluded.full_name, class_level=excluded.class_level, school_name=excluded.school_name, email=excluded.email, phone=excluded.phone, parent_name=excluded.parent_name, parent_phone=excluded.parent_phone, admission_date=excluded.admission_date, updated_at=excluded.updated_at, is_active=excluded.is_active;

insert into public.school_students (id, student_id, full_name, class_level, school_name, email, phone, parent_name, parent_phone, admission_date, is_active, created_by, created_at, updated_at) values
('cb4567de-e11e-4159-89a5-6f156dc56825','YAN003','Carol Brown','JSS2','Demo Secondary School','carol@demo.com','08034567890','Mr. Brown','08065432109','2025-08-23',true,'1fbd54f5-2d78-45ab-aa09-f0709056d67b','2025-08-23 07:08:06.709941+00','2025-08-23 07:08:06.709941+00')
on conflict (id) do update set full_name=excluded.full_name, class_level=excluded.class_level, school_name=excluded.school_name, email=excluded.email, phone=excluded.phone, parent_name=excluded.parent_name, parent_phone=excluded.parent_phone, admission_date=excluded.admission_date, updated_at=excluded.updated_at, is_active=excluded.is_active;

-- Note: teacher_credentials and student_credentials are not seeded here,
-- because we should hash passwords offline and insert securely.


