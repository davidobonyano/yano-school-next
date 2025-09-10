-- Run in Supabase SQL Editor

-- ============ GUARD: create tables if missing ============
-- Ensure pgcrypto for gen_random_uuid
do $$ begin
  perform 1 from pg_extension where extname = 'pgcrypto';
  if not found then
    create extension if not exists pgcrypto;
  end if;
end $$;
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
-- Class level enum (KG–SS3)
do $$
begin
  perform 1 from pg_type where typname = 'class_level';
  if not found then
    create type public.class_level as enum (
      'NUR1','NUR2',
      'KG1','KG2',
      'PRI1','PRI2','PRI3','PRI4','PRI5','PRI6',
      'JSS1','JSS2','JSS3',
      'SS1','SS2','SS3'
    );
  end if;
exception when duplicate_object then null;
end $$;

-- Ensure enum includes Nigerian classes even if type already existed
do $$
declare v_exists boolean; begin
  -- helper to add value if missing
  perform 1 from pg_type where typname = 'class_level';
  -- Add values idempotently
  begin
    alter type public.class_level add value if not exists 'NUR1';
  exception when duplicate_object then null; end;
  begin
    alter type public.class_level add value if not exists 'NUR2';
  exception when duplicate_object then null; end;
  begin
    alter type public.class_level add value if not exists 'KG1';
  exception when duplicate_object then null; end;
  begin
    alter type public.class_level add value if not exists 'KG2';
  exception when duplicate_object then null; end;
  begin
    alter type public.class_level add value if not exists 'PRI1';
  exception when duplicate_object then null; end;
  begin
    alter type public.class_level add value if not exists 'PRI2';
  exception when duplicate_object then null; end;
  begin
    alter type public.class_level add value if not exists 'PRI3';
  exception when duplicate_object then null; end;
  begin
    alter type public.class_level add value if not exists 'PRI4';
  exception when duplicate_object then null; end;
  begin
    alter type public.class_level add value if not exists 'PRI5';
  exception when duplicate_object then null; end;
  begin
    alter type public.class_level add value if not exists 'PRI6';
  exception when duplicate_object then null; end;
  begin
    alter type public.class_level add value if not exists 'JSS1';
  exception when duplicate_object then null; end;
  begin
    alter type public.class_level add value if not exists 'JSS2';
  exception when duplicate_object then null; end;
  begin
    alter type public.class_level add value if not exists 'JSS3';
  exception when duplicate_object then null; end;
  begin
    alter type public.class_level add value if not exists 'SS1';
  exception when duplicate_object then null; end;
  begin
    alter type public.class_level add value if not exists 'SS2';
  exception when duplicate_object then null; end;
  begin
    alter type public.class_level add value if not exists 'SS3';
  exception when duplicate_object then null; end;
end $$;

-- Students table (canonical)
create table if not exists public.school_students (
  id uuid primary key default gen_random_uuid(),
  student_id text not null unique,
  full_name text not null,
  class_level public.class_level not null,
  stream text, -- e.g. Science/Arts/Commercial for SS classes
  school_name text not null,
  email text,
  phone text,
  parent_name text,
  parent_phone text,
  admission_date date default current_date,
  is_active boolean default true not null,
  created_by uuid references public.teachers(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint uq_student_per_class unique(full_name, class_level)
);

-- Add profile_image_url column if missing
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'school_students'
      and column_name = 'profile_image_url'
  ) then
    alter table public.school_students add column profile_image_url text;
  end if;
end $$;

-- Add last_login column if missing (tracks last successful portal login)
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'school_students'
      and column_name = 'last_login'
  ) then
    alter table public.school_students add column last_login timestamptz;
  end if;
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

-- ================= YAN student id sequence and RPCs =================
-- Global sequence table
create table if not exists public.student_id_sequence (
  id serial primary key,
  next_number integer default 1,
  school_code text default 'YAN',
  updated_at timestamptz default now() not null
);

-- Seed one row if empty
insert into public.student_id_sequence (next_number, school_code)
select 1, 'YAN'
where not exists (select 1 from public.student_id_sequence);

-- ID generator
create or replace function public.generate_yan_student_id()
returns text as $$
declare
  v_rec public.student_id_sequence%rowtype;
  v_student_id text;
begin
  select * into v_rec from public.student_id_sequence order by id limit 1;
  v_student_id := coalesce(v_rec.school_code,'YAN') || lpad(v_rec.next_number::text, 3, '0');
  update public.student_id_sequence set next_number = v_rec.next_number + 1, updated_at = now() where id = v_rec.id;
  return v_student_id;
end;
$$ language plpgsql security definer;

-- Upsert helper to keep updated_at fresh
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_school_students_updated_at on public.school_students;
create trigger trg_school_students_updated_at
  before update on public.school_students
  for each row execute function public.handle_updated_at();

-- Add student RPC
create or replace function public.add_school_student(
  p_full_name text,
  p_class_level public.class_level,
  p_school_name text,
  p_teacher_id uuid,
  p_email text default null,
  p_phone text default null,
  p_parent_name text default null,
  p_parent_phone text default null,
  p_admission_date date default current_date,
  p_stream text default null
)
returns jsonb as $$
declare
  v_id text;
  v_row public.school_students%rowtype;
begin
  v_id := public.generate_yan_student_id();
  insert into public.school_students(
    student_id, full_name, class_level, school_name, email, phone,
    parent_name, parent_phone, admission_date, created_by, stream
  ) values (
    v_id, p_full_name, p_class_level, p_school_name, p_email, p_phone,
    p_parent_name, p_parent_phone, p_admission_date, p_teacher_id, p_stream
  ) returning * into v_row;
  return jsonb_build_object('success', true, 'student', to_jsonb(v_row), 'student_id', v_id);
exception when unique_violation then
  return jsonb_build_object('success', false, 'error', 'Student with this name already exists in this class');
when others then
  return jsonb_build_object('success', false, 'error', sqlerrm);
end;
$$ language plpgsql security definer;

-- Query helpers
create or replace function public.get_all_school_students(p_class_level public.class_level default null)
returns table (
  student_id text,
  full_name text,
  class_level public.class_level,
  stream text,
  school_name text,
  email text,
  phone text,
  parent_name text,
  parent_phone text,
  admission_date date,
  is_active boolean
) as $$
begin
  return query
  select ss.student_id, ss.full_name, ss.class_level, ss.stream, ss.school_name, ss.email, ss.phone,
         ss.parent_name, ss.parent_phone, ss.admission_date, ss.is_active
  from public.school_students ss
  where (p_class_level is null or ss.class_level = p_class_level)
  order by ss.student_id, ss.full_name;
end;
$$ language plpgsql security definer;

create or replace function public.get_students_by_teacher(p_teacher_id uuid)
returns table (
  student_id text,
  full_name text,
  class_level public.class_level,
  stream text,
  school_name text,
  admission_date date,
  is_active boolean
) as $$
begin
  return query
  select ss.student_id, ss.full_name, ss.class_level, ss.stream, ss.school_name, ss.admission_date, ss.is_active
  from public.school_students ss
  where ss.created_by = p_teacher_id
  order by ss.student_id, ss.full_name;
end;
$$ language plpgsql security definer;

create or replace function public.get_school_class_statistics()
returns table (
  class_level public.class_level,
  total_students bigint,
  active_students bigint
) as $$
begin
  return query
  select ss.class_level,
         count(ss.id) as total_students,
         count(ss.id) filter (where ss.is_active = true) as active_students
  from public.school_students ss
  group by ss.class_level
  order by ss.class_level;
end;
$$ language plpgsql security definer;

create or replace function public.update_school_code(p_new_school_code text)
returns jsonb as $$
begin
  update public.student_id_sequence set school_code = p_new_school_code, updated_at = now();
  return jsonb_build_object('success', true, 'message', 'School code updated to ' || p_new_school_code);
end;
$$ language plpgsql security definer;

create or replace function public.get_next_student_number()
returns integer as $$
declare v_next integer; begin
  select next_number into v_next from public.student_id_sequence order by id limit 1;
  return v_next;
end; $$ language plpgsql security definer;

-- Indexes
create index if not exists idx_school_students_student_id on public.school_students(student_id);
create index if not exists idx_school_students_class_level on public.school_students(class_level);
create index if not exists idx_school_students_active on public.school_students(is_active);
create index if not exists idx_school_students_created_by on public.school_students(created_by);

-- RLS
alter table public.school_students enable row level security;
alter table public.student_id_sequence enable row level security;

drop policy if exists "Teachers can view all students" on public.school_students;
create policy "Teachers can view all students" on public.school_students
  for select using (auth.uid() in (select id from public.teachers where id = auth.uid()));

drop policy if exists "Teachers can manage students" on public.school_students;
create policy "Teachers can manage students" on public.school_students
  for all using (auth.uid() in (select id from public.teachers where id = auth.uid()));

drop policy if exists "Allow all access to sequence" on public.student_id_sequence;
create policy "Allow all access to sequence" on public.student_id_sequence for all using (true);

grant execute on function public.generate_yan_student_id to anon, authenticated;
grant execute on function public.add_school_student(
  text,
  public.class_level,
  text,
  uuid,
  text,
  text,
  text,
  text,
  date,
  text
) to anon, authenticated;
grant execute on function public.get_all_school_students to anon, authenticated;
grant execute on function public.get_students_by_teacher to anon, authenticated;
grant execute on function public.get_school_class_statistics to anon, authenticated;
grant execute on function public.update_school_code to anon, authenticated;
grant execute on function public.get_next_student_number to anon, authenticated;

-- ============ SEEDS (idempotent) ============
-- Password reset tokens for students
create table if not exists public.student_password_resets (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references public.school_students(student_id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz default now() not null
);

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
insert into public.school_students (id, student_id, full_name, class_level, stream, school_name, email, phone, parent_name, parent_phone, admission_date, is_active, created_by, created_at, updated_at) values
('5ec568f5-b153-4b03-a09d-776a464e186c','YAN004','David Wilson','SS3','Science','Demo Secondary School','david@demo.com','08045678901','Mrs. Wilson','08054321098','2025-08-23',true,'1fbd54f5-2d78-45ab-aa09-f0709056d67b','2025-08-23 07:08:06.709941+00','2025-08-23 07:08:06.709941+00')
on conflict (id) do update set full_name=excluded.full_name, class_level=excluded.class_level, school_name=excluded.school_name, email=excluded.email, phone=excluded.phone, parent_name=excluded.parent_name, parent_phone=excluded.parent_phone, admission_date=excluded.admission_date, updated_at=excluded.updated_at, is_active=excluded.is_active;

insert into public.school_students (id, student_id, full_name, class_level, stream, school_name, email, phone, parent_name, parent_phone, admission_date, is_active, created_by, created_at, updated_at) values
('686b5be6-6b3c-4caa-893b-125f97cb16ad','YAN007','oyedele tope','SS1','Science','yano',null,null,null,null,'2025-08-23',true,'33675fac-70f7-4883-bbd7-d4a4d02cf1a6','2025-08-23 08:50:34.797975+00','2025-08-23 08:50:34.797975+00')
on conflict (id) do update set full_name=excluded.full_name, class_level=excluded.class_level, school_name=excluded.school_name, email=excluded.email, phone=excluded.phone, parent_name=excluded.parent_name, parent_phone=excluded.parent_phone, admission_date=excluded.admission_date, updated_at=excluded.updated_at, is_active=excluded.is_active;

insert into public.school_students (id, student_id, full_name, class_level, stream, school_name, email, phone, parent_name, parent_phone, admission_date, is_active, created_by, created_at, updated_at) values
('85316e3d-83d6-4961-9513-2718273d7434','YAN006','obonyano david','SS1','Science','yano',null,null,null,null,'2025-08-23',true,'33675fac-70f7-4883-bbd7-d4a4d02cf1a6','2025-08-23 07:41:59.352493+00','2025-08-23 07:41:59.352493+00')
on conflict (id) do update set full_name=excluded.full_name, class_level=excluded.class_level, school_name=excluded.school_name, email=excluded.email, phone=excluded.phone, parent_name=excluded.parent_name, parent_phone=excluded.parent_phone, admission_date=excluded.admission_date, updated_at=excluded.updated_at, is_active=excluded.is_active;

insert into public.school_students (id, student_id, full_name, class_level, stream, school_name, email, phone, parent_name, parent_phone, admission_date, is_active, created_by, created_at, updated_at) values
('c5b27a9f-89af-4ef9-8ed0-64bb17bf3131','YAN005','obonyano david','JSS1',null,'yan','godsentryan@gmail.com','09035526146',null,null,'2025-08-23',true,'33675fac-70f7-4883-bbd7-d4a4d02cf1a6','2025-08-23 07:10:22.784988+00','2025-08-23 07:10:22.784988+00')
on conflict (id) do update set full_name=excluded.full_name, class_level=excluded.class_level, school_name=excluded.school_name, email=excluded.email, phone=excluded.phone, parent_name=excluded.parent_name, parent_phone=excluded.parent_phone, admission_date=excluded.admission_date, updated_at=excluded.updated_at, is_active=excluded.is_active;

insert into public.school_students (id, student_id, full_name, class_level, stream, school_name, email, phone, parent_name, parent_phone, admission_date, is_active, created_by, created_at, updated_at) values
('cb4567de-e11e-4159-89a5-6f156dc56825','YAN003','Carol Brown','JSS2',null,'Demo Secondary School','carol@demo.com','08034567890','Mr. Brown','08065432109','2025-08-23',true,'1fbd54f5-2d78-45ab-aa09-f0709056d67b','2025-08-23 07:08:06.709941+00','2025-08-23 07:08:06.709941+00')
on conflict (id) do update set full_name=excluded.full_name, class_level=excluded.class_level, school_name=excluded.school_name, email=excluded.email, phone=excluded.phone, parent_name=excluded.parent_name, parent_phone=excluded.parent_phone, admission_date=excluded.admission_date, updated_at=excluded.updated_at, is_active=excluded.is_active;

-- Note: teacher_credentials and student_credentials are not seeded here,
-- because we should hash passwords offline and insert securely.



-- ================= FEES & PAYMENTS =================
-- Fee structures allow per class/term/session breakdown
create table if not exists public.fee_structures (
  id uuid primary key default gen_random_uuid(),
  class_level_text text not null, -- e.g., 'JSS 2', 'Primary 6', 'SS1'
  class_level_code public.class_level null, -- optional canonical enum link
  term text not null, -- e.g., 'First Term'
  session text not null, -- e.g., '2024/2025'
  tuition_fee numeric(12,2) not null default 0,
  development_levy numeric(12,2) not null default 0,
  examination_fee numeric(12,2) not null default 0,
  sports_fee numeric(12,2) not null default 0,
  pta_fee numeric(12,2) not null default 0,
  total_fee numeric(12,2) not null default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

drop trigger if exists trg_fee_structures_updated_at on public.fee_structures;
create trigger trg_fee_structures_updated_at
  before update on public.fee_structures
  for each row execute function public.handle_updated_at();

create index if not exists idx_fee_structures_term_session on public.fee_structures(term, session);
create index if not exists idx_fee_structures_class_text on public.fee_structures(class_level_text);

-- Sample fee structures for current term/session
insert into public.fee_structures (class_level_text, class_level_code, term, session, tuition_fee, development_levy, examination_fee, sports_fee, pta_fee, total_fee) values
('Nursery 1', 'NUR1', 'First Term', '2024/2025', 30000, 5000, 5000, 3000, 2000, 45000),
('Nursery 2', 'NUR2', 'First Term', '2024/2025', 32000, 5000, 5000, 3000, 2000, 47000),
('JSS 1', 'JSS1', 'First Term', '2024/2025', 50000, 10000, 15000, 5000, 3000, 83000),
('JSS 2', 'JSS2', 'First Term', '2024/2025', 55000, 10000, 15000, 5000, 3000, 88000),
('SS1', 'SS1', 'First Term', '2024/2025', 60000, 12000, 18000, 5000, 3000, 98000),
('SS3', 'SS3', 'First Term', '2024/2025', 70000, 15000, 20000, 5000, 3000, 110000)
on conflict (class_level_text, term, session) do update set
  tuition_fee = excluded.tuition_fee,
  development_levy = excluded.development_levy,
  examination_fee = excluded.examination_fee,
  sports_fee = excluded.sports_fee,
  pta_fee = excluded.pta_fee,
  total_fee = excluded.total_fee,
  updated_at = now();

-- Payments per student per term/session
do $$
begin
  create type public.payment_status as enum ('Paid','Pending','Overdue');
exception when duplicate_object then null;
end $$;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references public.school_students(student_id) on delete cascade,
  amount numeric(12,2) not null,
  description text not null,
  date date not null default current_date,
  status public.payment_status not null default 'Pending',
  term text not null,
  session text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

drop trigger if exists trg_payments_updated_at on public.payments;
create trigger trg_payments_updated_at
  before update on public.payments
  for each row execute function public.handle_updated_at();

create index if not exists idx_payments_student_term_session on public.payments(student_id, term, session);
create index if not exists idx_payments_status on public.payments(status);

-- ================= COURSES =================
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  description text,
  class_level public.class_level not null,
  is_active boolean default true not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Add credit_units if missing (default 1)
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'courses' and column_name = 'credit_units'
  ) then
    alter table public.courses add column credit_units integer default 1;
  end if;
end $$;

drop trigger if exists trg_courses_updated_at on public.courses;
create trigger trg_courses_updated_at
  before update on public.courses
  for each row execute function public.handle_updated_at();

create index if not exists idx_courses_class_level on public.courses(class_level);

create index if not exists idx_courses_active on public.courses(is_active);

-- ================= STUDENT COURSE REGISTRATIONS =================
create table if not exists public.student_course_registrations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.school_students(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  class_level public.class_level not null,
  stream text, -- for SS classes
  term text not null,
  session text not null, -- e.g., "2025/2026"
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  approved_by uuid references public.teachers(id),
  approved_at timestamptz,
  rejection_reason text, -- if status is rejected
  registered_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  
  -- Ensure unique registration per student per course per term/session
  unique(student_id, course_id, term, session)
);

-- Indexes for performance
create index if not exists idx_registrations_student on public.student_course_registrations(student_id);
create index if not exists idx_registrations_course on public.student_course_registrations(course_id);
create index if not exists idx_registrations_status on public.student_course_registrations(status);
create index if not exists idx_registrations_class_level on public.student_course_registrations(class_level);
create index if not exists idx_registrations_term_session on public.student_course_registrations(term, session);

-- Trigger for updated_at
drop trigger if exists trg_registrations_updated_at on public.student_course_registrations;
create trigger trg_registrations_updated_at
  before update on public.student_course_registrations
  for each row execute function public.handle_updated_at();

-- RLS for registrations
alter table public.student_course_registrations enable row level security;

-- Students can view their own registrations
drop policy if exists "Students can view own registrations" on public.student_course_registrations;
create policy "Students can view own registrations" on public.student_course_registrations
  for select using (auth.uid()::text = student_id::text);

-- Students can create registrations
drop policy if exists "Students can create registrations" on public.student_course_registrations;
create policy "Students can create registrations" on public.student_course_registrations
  for insert with check (auth.uid()::text = student_id::text);

-- Teachers can view all registrations for their class levels
drop policy if exists "Teachers can view registrations" on public.student_course_registrations;
create policy "Teachers can view registrations" on public.student_course_registrations
  for select using (true);

-- Teachers can update registrations (approve/reject)
drop policy if exists "Teachers can update registrations" on public.student_course_registrations;
create policy "Teachers can update registrations" on public.student_course_registrations
  for update using (true);

-- Admins have full access
drop policy if exists "Admins have full access to registrations" on public.student_course_registrations;
create policy "Admins have full access to registrations" on public.student_course_registrations
  for all using (true);

-- Sample courses
insert into public.courses (name, code, description, class_level) values
('Mathematics', 'MATH101', 'Core mathematics for JSS students', 'JSS1'),
('English Language', 'ENG101', 'English language and literature', 'JSS1'),
('Basic Science', 'SCI101', 'Introduction to basic sciences', 'JSS1'),
('Mathematics', 'MATH201', 'Advanced mathematics for JSS2', 'JSS2'),
('Physics', 'PHY301', 'Physics for senior secondary', 'SS1'),
('Chemistry', 'CHEM301', 'Chemistry for senior secondary', 'SS1'),
('Biology', 'BIO301', 'Biology for senior secondary', 'SS1'),
('Advanced Mathematics', 'MATH401', 'Advanced mathematics for SS3', 'SS3')
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  class_level = excluded.class_level,
  updated_at = now();

-- RLS for courses
alter table public.courses enable row level security;
drop policy if exists "Allow read all courses" on public.courses;
create policy "Allow read all courses" on public.courses for select using (true);
drop policy if exists "Allow manage courses" on public.courses;
create policy "Allow manage courses" on public.courses for all using (true);

-- Helper function to get courses by class and stream
create or replace function public.get_courses_by_class_stream(
  p_class_level public.class_level,
  p_stream public.academic_stream default null
)
returns table (
  id uuid,
  name text,
  code text,
  description text,
  class_level public.class_level,
  term public.course_term,
  category public.course_category,
  stream public.academic_stream,
  is_active boolean
) as $$
begin
  return query
  select c.id, c.name, c.code, c.description, c.class_level, c.term, c.category, c.stream, c.is_active
  from public.courses c
  where c.class_level = p_class_level
    and c.is_active = true
    and (p_stream is null or c.stream = p_stream or c.stream = 'General')
  order by c.term, c.name;
end;
$$ language plpgsql security definer;

-- Helper function to get all courses for a term
create or replace function public.get_courses_by_term(p_term public.course_term)
returns table (
  id uuid,
  name text,
  code text,
  description text,
  class_level public.class_level,
  term public.course_term,
  category public.course_category,
  stream public.academic_stream,
  is_active boolean
) as $$
begin
  return query
  select c.id, c.name, c.code, c.description, c.class_level, c.term, c.category, c.stream, c.is_active
  from public.courses c
  where c.term = p_term and c.is_active = true
  order by c.class_level, c.name;
end;
$$ language plpgsql security definer;

-- Helper function to search courses
create or replace function public.search_courses(
  p_search text,
  p_class_level public.class_level default null,
  p_term public.course_term default null,
  p_category public.course_category default null
)
returns table (
  id uuid,
  name text,
  code text,
  description text,
  class_level public.class_level,
  term public.course_term,
  category public.course_category,
  stream public.academic_stream,
  is_active boolean
) as $$
begin
  return query
  select c.id, c.name, c.code, c.description, c.class_level, c.term, c.category, c.stream, c.is_active
  from public.courses c
  where c.is_active = true
    and (
      c.name ilike '%' || p_search || '%' or
      c.code ilike '%' || p_search || '%' or
      c.description ilike '%' || p_search || '%'
    )
    and (p_class_level is null or c.class_level = p_class_level)
    and (p_term is null or c.term = p_term)
    and (p_category is null or c.category = p_category)
  order by c.class_level, c.term, c.name;
end;
$$ language plpgsql security definer;

-- Grant execute permissions
grant execute on function public.get_courses_by_class_stream to anon, authenticated;
grant execute on function public.get_courses_by_term to anon, authenticated;
grant execute on function public.search_courses to anon, authenticated;

-- App settings for global term/session
create table if not exists public.app_settings (
  id int primary key default 1,
  current_term text not null default 'First Term',
  current_session text not null default '2024/2025',
  updated_at timestamptz default now() not null
);

insert into public.app_settings (id, current_term, current_session)
select 1, 'First Term', '2024/2025'
where not exists (select 1 from public.app_settings where id = 1);

create or replace function public.set_app_period(p_term text, p_session text)
returns jsonb as $$
begin
  update public.app_settings set current_term = p_term, current_session = p_session, updated_at = now() where id = 1;
  return jsonb_build_object('success', true);
end; $$ language plpgsql security definer;

create or replace function public.get_app_period()
returns table (current_term text, current_session text) as $$
begin
  return query select current_term, current_session from public.app_settings where id = 1;
end; $$ language plpgsql security definer;

-- Financial summary for a student in a term/session
create or replace function public.get_student_financial_summary(p_student_id text, p_term text, p_session text)
returns table (
  student_id text,
  billed_total numeric,
  paid_total numeric,
  pending_total numeric,
  overdue_total numeric,
  outstanding_total numeric
) as $$
declare
  v_class_text text;
  v_billed numeric := 0;
begin
  -- Derive a human class text from student's class_level and stream
  select
    case
      when ss.class_level in ('NUR1','NUR2') then replace(ss.class_level, 'NUR', 'Nursery ')
      when ss.class_level in ('PRI1','PRI2','PRI3','PRI4','PRI5','PRI6') then 'Primary ' || substring(ss.class_level from 4)
      when ss.class_level like 'JSS%' then replace(ss.class_level, 'JSS', 'JSS ')
      when ss.class_level like 'SS%' then replace(ss.class_level, 'SS', 'SS') || substring(ss.class_level from 3)
      else ss.class_level::text
    end as class_text
  into v_class_text
  from public.school_students ss
  where ss.student_id = p_student_id;

  -- Fallback to enum code if no mapping
  if v_class_text is null then
    select ss.class_level::text into v_class_text from public.school_students ss where ss.student_id = p_student_id;
  end if;

  -- Get billed amount from fee_structures by class text, term, session
  select coalesce(total_fee,0) into v_billed
  from public.fee_structures
  where term = p_term and session = p_session
    and (class_level_text = v_class_text or class_level_text = replace(v_class_text,'SS','SS '))
  order by updated_at desc
  limit 1;

  return query
  with agg as (
    select 
      sum(case when status = 'Paid' then amount else 0 end) as paid_total,
      sum(case when status = 'Pending' then amount else 0 end) as pending_total,
      sum(case when status = 'Overdue' then amount else 0 end) as overdue_total
    from public.payments
    where student_id = p_student_id and term = p_term and session = p_session
  )
  select p_student_id,
         coalesce(v_billed,0) as billed_total,
         coalesce(agg.paid_total,0) as paid_total,
         coalesce(agg.pending_total,0) as pending_total,
         coalesce(agg.overdue_total,0) as overdue_total,
         greatest(coalesce(v_billed,0) - coalesce(agg.paid_total,0), 0) as outstanding_total
  from agg;
end; $$ language plpgsql security definer;

-- RLS: keep open for now (can tighten later)
alter table public.fee_structures enable row level security;
alter table public.payments enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "Allow read all fees" on public.fee_structures;
create policy "Allow read all fees" on public.fee_structures for select using (true);
drop policy if exists "Allow manage fees" on public.fee_structures;
create policy "Allow manage fees" on public.fee_structures for all using (true);

drop policy if exists "Allow read payments" on public.payments;
create policy "Allow read payments" on public.payments for select using (true);
drop policy if exists "Allow manage payments" on public.payments;
create policy "Allow manage payments" on public.payments for all using (true);

drop policy if exists "Allow read settings" on public.app_settings;
create policy "Allow read settings" on public.app_settings for select using (true);
drop policy if exists "Allow manage settings" on public.app_settings;
create policy "Allow manage settings" on public.app_settings for all using (true);

grant execute on function public.get_student_financial_summary to anon, authenticated;
grant execute on function public.set_app_period to anon, authenticated;
grant execute on function public.get_app_period to anon, authenticated;

-- Seed pending payments for all active students for a term/session based on fee_structures
create or replace function public.seed_pending_payments(p_term text, p_session text)
returns jsonb as $$
declare
  v_inserted int := 0;
begin
  -- For each active student, compute billed from fee_structures and insert a pending payment if not exists for this term/session
  insert into public.payments (student_id, amount, description, date, status, term, session)
  select
    ss.student_id,
    fs.total_fee,
    concat('School Fees - ', p_term),
    current_date,
    'Pending'::public.payment_status,
    p_term,
    p_session
  from public.school_students ss
  join public.fee_structures fs
    on fs.term = p_term and fs.session = p_session
   and (
     -- map enum to human class text
     (ss.class_level in ('NUR1','NUR2') and fs.class_level_text = replace(ss.class_level, 'NUR', 'Nursery '))
     or (ss.class_level in ('PRI1','PRI2','PRI3','PRI4','PRI5','PRI6') and fs.class_level_text = concat('Primary ', substring(ss.class_level, 4)))
     or (ss.class_level like 'JSS%' and fs.class_level_text = replace(ss.class_level, 'JSS', 'JSS '))
     or (ss.class_level like 'SS%' and (fs.class_level_text = ss.class_level or fs.class_level_text = replace(ss.class_level, 'SS', 'SS ')))
   )
  where ss.is_active = true
    and not exists (
      select 1 from public.payments p
      where p.student_id = ss.student_id and p.term = p_term and p.session = p_session and p.description like 'School Fees - %'
    )
  returning 1;

  get diagnostics v_inserted = row_count;
  return jsonb_build_object('success', true, 'inserted', v_inserted);
end; $$ language plpgsql security definer;

grant execute on function public.seed_pending_payments to anon, authenticated;

-- ================= ADMIN/ACADEMIC CORE EXTENSIONS =================

-- Academic session and term enums
do $$ begin
  perform 1 from pg_type where typname = 'term_name';
  if not found then
    create type public.term_name as enum ('First', 'Second', 'Third');
  end if;
exception when duplicate_object then null; end $$;

create table if not exists public.academic_sessions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique, -- e.g., 2024/2025
  starts_on date,
  ends_on date,
  is_active boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.academic_terms (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.academic_sessions(id) on delete cascade,
  term public.term_name not null,
  starts_on date,
  ends_on date,
  is_active boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint uq_term_per_session unique(session_id, term)
);

-- lifecycle status for students
do $$ begin
  perform 1 from pg_type where typname = 'student_lifecycle';
  if not found then
    create type public.student_lifecycle as enum (
      'Processing', -- awaiting approval & ID
      'Active',     -- enrolled
      'Promoted',   -- promoted this session
      'Demoted',    -- repeating
      'Graduated'   -- moved to alumni
    );
  end if;
exception when duplicate_object then null; end $$;

-- Add lifecycle columns to students if missing
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='school_students' and column_name='lifecycle_status'
  ) then
    alter table public.school_students add column lifecycle_status public.student_lifecycle default 'Processing' not null;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='school_students' and column_name='current_session_id'
  ) then
    alter table public.school_students add column current_session_id uuid references public.academic_sessions(id);
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='school_students' and column_name='current_term_id'
  ) then
    alter table public.school_students add column current_term_id uuid references public.academic_terms(id);
  end if;
end $$;

-- constrain stream values for SS classes
do $$ begin
  perform 1 from pg_constraint where conname = 'chk_ss_streams_valid';
  if not found then
    alter table public.school_students
      add constraint chk_ss_streams_valid
      check (
        (
          class_level in ('SS1'::public.class_level,'SS2'::public.class_level,'SS3'::public.class_level)
          and (stream is null or stream in ('Science','Commercial','Art'))
        )
        or (
          class_level not in ('SS1'::public.class_level,'SS2'::public.class_level,'SS3'::public.class_level)
          and stream is null
        )
      );
  end if;
exception when duplicate_object then null; end $$;

create index if not exists idx_terms_active on public.academic_terms(is_active);
create index if not exists idx_sessions_active on public.academic_sessions(is_active);
create index if not exists idx_students_lifecycle on public.school_students(lifecycle_status);

-- Updated-at triggers
drop trigger if exists trg_sessions_updated_at on public.academic_sessions;
create trigger trg_sessions_updated_at before update on public.academic_sessions
for each row execute function public.handle_updated_at();

drop trigger if exists trg_terms_updated_at on public.academic_terms;
create trigger trg_terms_updated_at before update on public.academic_terms
for each row execute function public.handle_updated_at();

-- Active session/term RPCs
create or replace function public.set_active_session(p_session_id uuid)
returns jsonb as $$
begin
  update public.academic_sessions set is_active=false;
  update public.academic_sessions set is_active=true, updated_at=now() where id=p_session_id;
  return jsonb_build_object('success', true);
end; $$ language plpgsql security definer;

create or replace function public.set_active_term(p_term_id uuid)
returns jsonb as $$
declare v_session uuid; begin
  select session_id into v_session from public.academic_terms where id=p_term_id;
  if v_session is null then
    return jsonb_build_object('success', false, 'error', 'Term not found');
  end if;
  update public.academic_terms set is_active=false where session_id=v_session;
  update public.academic_terms set is_active=true, updated_at=now() where id=p_term_id;
  return jsonb_build_object('success', true);
end; $$ language plpgsql security definer;

-- Utility to get active session/term
create or replace function public.get_active_session_term()
returns table(session_id uuid, session_name text, term_id uuid, term public.term_name) as $$
begin
  return query
  select s.id, s.name, t.id, t.term
  from public.academic_sessions s
  left join public.academic_terms t on t.session_id = s.id and t.is_active = true
  where s.is_active = true
  limit 1;
end; $$ language plpgsql security definer;

grant execute on function public.set_active_session to anon, authenticated;
grant execute on function public.set_active_term to anon, authenticated;
grant execute on function public.get_active_session_term to anon, authenticated;

-- RLS for sessions/terms (view for all authenticated; full for teachers)
alter table public.academic_sessions enable row level security;
alter table public.academic_terms enable row level security;

drop policy if exists "View sessions" on public.academic_sessions;
create policy "View sessions" on public.academic_sessions for select using (true);

drop policy if exists "Manage sessions as teacher" on public.academic_sessions;
create policy "Manage sessions as teacher" on public.academic_sessions for all using (
  auth.uid() in (select id from public.teachers where id = auth.uid())
);

drop policy if exists "View terms" on public.academic_terms;
create policy "View terms" on public.academic_terms for select using (true);

drop policy if exists "Manage terms as teacher" on public.academic_terms;
create policy "Manage terms as teacher" on public.academic_terms for all using (
  auth.uid() in (select id from public.teachers where id = auth.uid())
);

-- ================= PAYMENTS =================
create table if not exists public.fee_payments (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references public.school_students(student_id) on delete cascade,
  session_id uuid references public.academic_sessions(id),
  term_id uuid references public.academic_terms(id),
  amount_total numeric(12,2) not null check (amount_total >= 0),
  amount_paid numeric(12,2) not null check (amount_paid >= 0),
  balance numeric(12,2) generated always as (amount_total - amount_paid) stored,
  description text,
  recorded_by uuid references public.teachers(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.fee_payment_items (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.fee_payments(id) on delete cascade,
  item_name text not null,
  amount numeric(12,2) not null check (amount >= 0)
);

-- Receipt sequence and table
create table if not exists public.receipt_sequence (
  id serial primary key,
  next_number integer default 1,
  updated_at timestamptz default now() not null
);
insert into public.receipt_sequence (next_number)
select 1 where not exists (select 1 from public.receipt_sequence);

create table if not exists public.fee_receipts (
  id uuid primary key default gen_random_uuid(),
  receipt_no text not null unique,
  payment_id uuid not null references public.fee_payments(id) on delete cascade,
  generated_by uuid references public.teachers(id) on delete set null,
  generated_at timestamptz default now() not null
);

create or replace function public.generate_receipt_no()
returns text as $$
declare v_rec public.receipt_sequence%rowtype; v_no text; begin
  select * into v_rec from public.receipt_sequence order by id limit 1;
  v_no := 'RCT' || lpad(v_rec.next_number::text, 6, '0');
  update public.receipt_sequence set next_number = v_rec.next_number + 1, updated_at = now() where id = v_rec.id;
  return v_no;
end; $$ language plpgsql security definer;

-- Simple RPC to add a payment with items and auto receipt
create or replace function public.add_fee_payment(
  p_student_id text,
  p_session_id uuid,
  p_term_id uuid,
  p_amount_total numeric,
  p_amount_paid numeric,
  p_description text,
  p_items jsonb,
  p_recorded_by uuid
) returns jsonb as $$
declare v_payment_id uuid; v_receipt_no text; begin
  insert into public.fee_payments(student_id, session_id, term_id, amount_total, amount_paid, description, recorded_by)
  values (p_student_id, p_session_id, p_term_id, p_amount_total, p_amount_paid, p_description, p_recorded_by)
  returning id into v_payment_id;

  -- items: [{item_name, amount}]
  insert into public.fee_payment_items(payment_id, item_name, amount)
  select v_payment_id, (i->>'item_name')::text, (i->>'amount')::numeric
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) as i;

  v_receipt_no := public.generate_receipt_no();
  insert into public.fee_receipts(receipt_no, payment_id, generated_by) values (v_receipt_no, v_payment_id, p_recorded_by);
  return jsonb_build_object('success', true, 'payment_id', v_payment_id, 'receipt_no', v_receipt_no);
exception when others then
  return jsonb_build_object('success', false, 'error', sqlerrm);
end; $$ language plpgsql security definer;

-- indexes
create index if not exists idx_fee_payments_student on public.fee_payments(student_id);
create index if not exists idx_fee_payments_session_term on public.fee_payments(session_id, term_id);

-- triggers
drop trigger if exists trg_fee_payments_updated_at on public.fee_payments;
create trigger trg_fee_payments_updated_at before update on public.fee_payments
for each row execute function public.handle_updated_at();

-- RLS
alter table public.fee_payments enable row level security;
alter table public.fee_payment_items enable row level security;
alter table public.fee_receipts enable row level security;
alter table public.receipt_sequence enable row level security;

drop policy if exists "View payments" on public.fee_payments;
create policy "View payments" on public.fee_payments for select using (true);
drop policy if exists "Manage payments as teacher" on public.fee_payments;
create policy "Manage payments as teacher" on public.fee_payments for all using (
  auth.uid() in (select id from public.teachers where id = auth.uid())
);

drop policy if exists "View payment items" on public.fee_payment_items;
create policy "View payment items" on public.fee_payment_items for select using (true);
drop policy if exists "Manage payment items as teacher" on public.fee_payment_items;
create policy "Manage payment items as teacher" on public.fee_payment_items for all using (
  auth.uid() in (select id from public.teachers where id = auth.uid())
);

drop policy if exists "View receipts" on public.fee_receipts;
create policy "View receipts" on public.fee_receipts for select using (true);
drop policy if exists "Manage receipts as teacher" on public.fee_receipts;
create policy "Manage receipts as teacher" on public.fee_receipts for all using (
  auth.uid() in (select id from public.teachers where id = auth.uid())
);

drop policy if exists "Allow all access to receipt sequence" on public.receipt_sequence;
create policy "Allow all access to receipt sequence" on public.receipt_sequence for all using (true);

grant execute on function public.generate_receipt_no to anon, authenticated;
grant execute on function public.add_fee_payment to anon, authenticated;

-- ================= SUBJECTS & RESULTS =================
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  level public.class_level not null,
  stream text, -- optional, applies to SS streams
  is_optional boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

drop trigger if exists trg_subjects_updated_at on public.subjects;
create trigger trg_subjects_updated_at before update on public.subjects
for each row execute function public.handle_updated_at();

-- Unique index to enforce uniqueness on (name, level, coalesce(stream,''))
create unique index if not exists uq_subject_idx
  on public.subjects (name, level, coalesce(stream,''));

create table if not exists public.result_uploads (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.teachers(id) on delete set null,
  session_id uuid references public.academic_sessions(id),
  term_id uuid references public.academic_terms(id),
  class_level public.class_level not null,
  stream text,
  uploaded_at timestamptz default now() not null,
  status text default 'Completed'
);

create table if not exists public.student_results (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references public.school_students(student_id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  session_id uuid not null references public.academic_sessions(id),
  term_id uuid not null references public.academic_terms(id),
  ca_score numeric(5,2) default 0 check (ca_score >= 0),
  midterm_score numeric(5,2) default 0 check (midterm_score >= 0),
  exam_score numeric(5,2) default 0 check (exam_score >= 0),
  total_score numeric(5,2) generated always as (coalesce(ca_score,0)+coalesce(midterm_score,0)+coalesce(exam_score,0)) stored,
  grade text,
  remark text,
  uploaded_by uuid references public.teachers(id) on delete set null,
  upload_id uuid references public.result_uploads(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint uq_result unique(student_id, course_id, session_id, term_id)
);

drop trigger if exists trg_student_results_updated_at on public.student_results;
create trigger trg_student_results_updated_at before update on public.student_results
for each row execute function public.handle_updated_at();

-- helper: compute grade
create or replace function public.compute_grade(p_total numeric)
returns text as $$ begin
  if p_total >= 75 then return 'A1';
  elsif p_total >= 70 then return 'B2';
  elsif p_total >= 65 then return 'B3';
  elsif p_total >= 60 then return 'C4';
  elsif p_total >= 55 then return 'C5';
  elsif p_total >= 50 then return 'C6';
  elsif p_total >= 45 then return 'D7';
  elsif p_total >= 40 then return 'E8';
  else return 'F9'; end if;
end; $$ language plpgsql immutable;

-- RPC: upsert a single result
create or replace function public.upsert_student_result(
  p_student_id text,
  p_course_id uuid,
  p_session_id uuid,
  p_term_id uuid,
  p_ca numeric,
  p_midterm numeric,
  p_exam numeric,
  p_uploaded_by uuid,
  p_upload_id uuid default null
) returns jsonb as $$
declare v_id uuid; v_total numeric; v_grade text; begin
  v_total := coalesce(p_ca,0)+coalesce(p_midterm,0)+coalesce(p_exam,0);
  v_grade := public.compute_grade(v_total);
  insert into public.student_results(student_id, course_id, session_id, term_id, ca_score, midterm_score, exam_score, grade, uploaded_by, upload_id)
  values(p_student_id, p_course_id, p_session_id, p_term_id, p_ca, p_midterm, p_exam, v_grade, p_uploaded_by, p_upload_id)
  on conflict (student_id, course_id, session_id, term_id)
  do update set ca_score=excluded.ca_score, midterm_score=excluded.midterm_score, exam_score=excluded.exam_score, grade=excluded.grade, uploaded_by=excluded.uploaded_by, upload_id=excluded.upload_id, updated_at=now()
  returning id into v_id;
  return jsonb_build_object('success', true, 'id', v_id, 'grade', v_grade);
exception when others then
  return jsonb_build_object('success', false, 'error', sqlerrm);
end; $$ language plpgsql security definer;

-- indexes and RLS
create index if not exists idx_results_student on public.student_results(student_id);
create index if not exists idx_results_session_term on public.student_results(session_id, term_id);

alter table public.subjects enable row level security;
alter table public.result_uploads enable row level security;
alter table public.student_results enable row level security;

drop policy if exists "View subjects" on public.subjects;
create policy "View subjects" on public.subjects for select using (true);
drop policy if exists "Manage subjects as teacher" on public.subjects;
create policy "Manage subjects as teacher" on public.subjects for all using (
  auth.uid() in (select id from public.teachers where id = auth.uid())
);

drop policy if exists "View uploads" on public.result_uploads;
create policy "View uploads" on public.result_uploads for select using (true);
drop policy if exists "Manage uploads as teacher" on public.result_uploads;
create policy "Manage uploads as teacher" on public.result_uploads for all using (
  auth.uid() in (select id from public.teachers where id = auth.uid())
);

drop policy if exists "View results" on public.student_results;
create policy "View results" on public.student_results for select using (true);
drop policy if exists "Manage results as teacher" on public.student_results;
create policy "Manage results as teacher" on public.student_results for all using (
  auth.uid() in (select id from public.teachers where id = auth.uid())
);

grant execute on function public.upsert_student_result to anon, authenticated;

-- ================= ANNOUNCEMENTS =================
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  audience text not null check (audience in ('students','teachers','admins','all')),
  created_by uuid references public.teachers(id) on delete set null,
  created_at timestamptz default now() not null,
  expires_at timestamptz
);

alter table public.announcements enable row level security;
drop policy if exists "View announcements" on public.announcements;
create policy "View announcements" on public.announcements for select using (true);
drop policy if exists "Manage announcements as teacher" on public.announcements;
create policy "Manage announcements as teacher" on public.announcements for all using (
  auth.uid() in (select id from public.teachers where id = auth.uid())
);

-- ================= BULK IMPORT STAGING =================
create table if not exists public.bulk_students (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null,
  data jsonb not null,
  status text default 'Pending',
  error text,
  uploaded_by uuid references public.teachers(id) on delete set null,
  uploaded_at timestamptz default now() not null
);

create table if not exists public.bulk_results (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null,
  data jsonb not null,
  status text default 'Pending',
  error text,
  uploaded_by uuid references public.teachers(id) on delete set null,
  uploaded_at timestamptz default now() not null
);

create table if not exists public.bulk_payments (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null,
  data jsonb not null,
  status text default 'Pending',
  error text,
  uploaded_by uuid references public.teachers(id) on delete set null,
  uploaded_at timestamptz default now() not null
);

alter table public.bulk_students enable row level security;
alter table public.bulk_results enable row level security;
alter table public.bulk_payments enable row level security;

drop policy if exists "View bulk" on public.bulk_students;
create policy "View bulk" on public.bulk_students for select using (true);
drop policy if exists "Manage bulk students" on public.bulk_students;
create policy "Manage bulk students" on public.bulk_students for all using (
  auth.uid() in (select id from public.teachers where id = auth.uid())
);

drop policy if exists "View bulk results" on public.bulk_results;
create policy "View bulk results" on public.bulk_results for select using (true);
drop policy if exists "Manage bulk results" on public.bulk_results;
create policy "Manage bulk results" on public.bulk_results for all using (
  auth.uid() in (select id from public.teachers where id = auth.uid())
);

drop policy if exists "View bulk payments" on public.bulk_payments;
create policy "View bulk payments" on public.bulk_payments for select using (true);
drop policy if exists "Manage bulk payments" on public.bulk_payments;
create policy "Manage bulk payments" on public.bulk_payments for all using (
  auth.uid() in (select id from public.teachers where id = auth.uid())
);

-- ================= AUDIT & TRANSITIONS =================
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid, -- teacher/admin id
  action text not null, -- e.g., UPDATE_STUDENT, ADD_PAYMENT
  table_name text not null,
  record_id text not null, -- uuid/text id of the record
  changes jsonb, -- diff snapshot
  created_at timestamptz default now() not null
);

create table if not exists public.student_transitions (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references public.school_students(student_id) on delete cascade,
  from_class public.class_level,
  to_class public.class_level,
  from_stream text,
  to_stream text,
  action text not null check (action in ('Promote','Demote','Graduate','Activate','Process')),
  session_id uuid references public.academic_sessions(id),
  term_id uuid references public.academic_terms(id),
  performed_by uuid references public.teachers(id) on delete set null,
  performed_at timestamptz default now() not null
);

alter table public.audit_logs enable row level security;
alter table public.student_transitions enable row level security;

drop policy if exists "View audit" on public.audit_logs;
create policy "View audit" on public.audit_logs for select using (true);
drop policy if exists "Write audit as teacher" on public.audit_logs;
create policy "Write audit as teacher" on public.audit_logs for insert using (
  auth.uid() in (select id from public.teachers where id = auth.uid())
);

drop policy if exists "View transitions" on public.student_transitions;
create policy "View transitions" on public.student_transitions for select using (true);
drop policy if exists "Manage transitions as teacher" on public.student_transitions;
create policy "Manage transitions as teacher" on public.student_transitions for all using (
  auth.uid() in (select id from public.teachers where id = auth.uid())
);

-- Promotion/Demotion RPCs (individual and bulk)
create or replace function public.promote_student(
  p_student_id text,
  p_to_class public.class_level,
  p_to_stream text default null,
  p_session_id uuid,
  p_term_id uuid,
  p_actor uuid
) returns jsonb as $$
declare v_from_class public.class_level; v_from_stream text; begin
  select class_level, stream into v_from_class, v_from_stream from public.school_students where student_id=p_student_id;
  if not found then return jsonb_build_object('success', false, 'error', 'Student not found'); end if;
  update public.school_students set class_level=p_to_class, stream=p_to_stream,
    lifecycle_status = case when p_to_class='SS3' then 'Graduated' else 'Promoted' end::public.student_lifecycle,
    updated_at=now() where student_id=p_student_id;
  insert into public.student_transitions(student_id, from_class, to_class, from_stream, to_stream, action, session_id, term_id, performed_by)
  values(p_student_id, v_from_class, p_to_class, v_from_stream, p_to_stream,
    case when p_to_class='SS3' then 'Graduate' else 'Promote' end, p_session_id, p_term_id, p_actor);
  return jsonb_build_object('success', true);
end; $$ language plpgsql security definer;

create or replace function public.demote_student(
  p_student_id text,
  p_to_class public.class_level,
  p_to_stream text default null,
  p_session_id uuid,
  p_term_id uuid,
  p_actor uuid
) returns jsonb as $$
declare v_from_class public.class_level; v_from_stream text; begin
  select class_level, stream into v_from_class, v_from_stream from public.school_students where student_id=p_student_id;
  if not found then return jsonb_build_object('success', false, 'error', 'Student not found'); end if;
  update public.school_students set class_level=p_to_class, stream=p_to_stream, lifecycle_status='Demoted', updated_at=now()
  where student_id=p_student_id;
  insert into public.student_transitions(student_id, from_class, to_class, from_stream, to_stream, action, session_id, term_id, performed_by)
  values(p_student_id, v_from_class, p_to_class, v_from_stream, p_to_stream, 'Demote', p_session_id, p_term_id, p_actor);
  return jsonb_build_object('success', true);
end; $$ language plpgsql security definer;

-- Bulk promotion by class/stream
create or replace function public.bulk_promote(
  p_from_class public.class_level,
  p_from_stream text default null,
  p_to_class public.class_level,
  p_to_stream text default null,
  p_session_id uuid,
  p_term_id uuid,
  p_actor uuid
) returns jsonb as $$
declare v_count integer; begin
  update public.school_students set class_level=p_to_class, stream=p_to_stream,
    lifecycle_status = case when p_to_class='SS3' then 'Graduated' else 'Promoted' end::public.student_lifecycle,
    updated_at=now()
  where class_level=p_from_class and (p_from_stream is null or stream = p_from_stream);

  insert into public.student_transitions(student_id, from_class, to_class, from_stream, to_stream, action, session_id, term_id, performed_by)
  select student_id, p_from_class, p_to_class, stream, p_to_stream,
    case when p_to_class='SS3' then 'Graduate' else 'Promote' end,
    p_session_id, p_term_id, p_actor
  from public.school_students
  where class_level=p_to_class and (p_to_stream is null or stream = p_to_stream);

  get diagnostics v_count = row_count;
  return jsonb_build_object('success', true, 'affected', v_count);
end; $$ language plpgsql security definer;

grant execute on function public.promote_student to anon, authenticated;
grant execute on function public.demote_student to anon, authenticated;
grant execute on function public.bulk_promote to anon, authenticated;

-- Final grants for key RPCs already added above
grant execute on function public.add_school_student(
  text,
  public.class_level,
  text,
  uuid,
  text,
  text,
  text,
  text,
  date,
  text
) to anon, authenticated;
grant execute on function public.get_all_school_students to anon, authenticated;
grant execute on function public.get_students_by_teacher to anon, authenticated;
grant execute on function public.get_school_class_statistics to anon, authenticated;
grant execute on function public.update_school_code to anon, authenticated;
grant execute on function public.get_next_student_number to anon, authenticated;


