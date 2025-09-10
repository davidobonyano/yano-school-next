-- Registration history & filtering helpers

-- 1) Student registration history (for summary card)
create or replace function public.get_student_registration_history(
  p_student_uuid uuid,
  p_session text default null,
  p_term text default null
)
returns table (
  registration_id uuid,
  course_id uuid,
  course_code text,
  course_name text,
  class_level public.class_level,
  stream text,
  term text,
  session text,
  status text,
  approved_by uuid,
  approved_at timestamptz,
  registered_at timestamptz
) as $$
begin
  return query
  select
    r.id,
    r.course_id,
    c.code,
    c.name,
    r.class_level,
    r.stream,
    r.term,
    r.session,
    r.status,
    r.approved_by,
    r.approved_at,
    r.registered_at
  from public.student_course_registrations r
  join public.courses c on c.id = r.course_id
  where r.student_id = p_student_uuid
    and (p_session is null or r.session = p_session)
    and (p_term is null or r.term = p_term)
  order by r.session desc, r.term desc, c.name;
end;
$$ language plpgsql security definer;

grant execute on function public.get_student_registration_history(uuid, text, text) to anon, authenticated;

-- 2) Admin/teacher listing of registrations by filters
create or replace function public.list_course_registrations(
  p_session text default null,
  p_term text default null,
  p_class_level public.class_level default null,
  p_stream text default null,
  p_status text default null
)
returns table (
  registration_id uuid,
  student_uuid uuid,
  student_id text,
  student_name text,
  class_level public.class_level,
  stream text,
  course_id uuid,
  course_code text,
  course_name text,
  term text,
  session text,
  status text,
  approved_by uuid,
  approved_at timestamptz,
  registered_at timestamptz
) as $$
begin
  return query
  select
    r.id,
    r.student_id,
    ss.student_id,
    ss.full_name,
    r.class_level,
    r.stream,
    r.course_id,
    c.code,
    c.name,
    r.term,
    r.session,
    r.status,
    r.approved_by,
    r.approved_at,
    r.registered_at
  from public.student_course_registrations r
  join public.courses c on c.id = r.course_id
  join public.school_students ss on ss.id = r.student_id
  where (p_session is null or r.session = p_session)
    and (p_term is null or r.term = p_term)
    and (p_class_level is null or r.class_level = p_class_level)
    and (p_stream is null or r.stream = p_stream)
    and (p_status is null or r.status = p_status)
  order by r.session desc, r.term desc, ss.full_name, c.name;
end;
$$ language plpgsql security definer;

grant execute on function public.list_course_registrations(text, text, public.class_level, text, text) to anon, authenticated;

-- 3) Results filtering for teachers (by session/term/class/stream/course/teacher)
create or replace function public.get_results_filtered(
  p_session_id uuid default null,
  p_term_id uuid default null,
  p_class_level public.class_level default null,
  p_stream text default null,
  p_course_id uuid default null,
  p_teacher_id uuid default null
)
returns table (
  result_id uuid,
  student_id text,
  student_name text,
  class_level public.class_level,
  stream text,
  course_id uuid,
  course_code text,
  course_name text,
  session_id uuid,
  term_id uuid,
  ca_score numeric,
  midterm_score numeric,
  exam_score numeric,
  total_score numeric,
  grade text,
  uploaded_by uuid,
  uploaded_at timestamptz
) as $$
begin
  return query
  select
    r.id,
    r.student_id,
    ss.full_name,
    ss.class_level,
    ss.stream,
    r.course_id,
    c.code,
    c.name,
    r.session_id,
    r.term_id,
    r.ca_score,
    r.midterm_score,
    r.exam_score,
    r.total_score,
    r.grade,
    r.uploaded_by,
    ru.uploaded_at
  from public.student_results r
  join public.school_students ss on ss.student_id = r.student_id
  join public.courses c on c.id = r.course_id
  left join public.result_uploads ru on ru.id = r.upload_id
  where (p_session_id is null or r.session_id = p_session_id)
    and (p_term_id is null or r.term_id = p_term_id)
    and (p_class_level is null or ss.class_level = p_class_level)
    and (p_stream is null or ss.stream = p_stream)
    and (p_course_id is null or r.course_id = p_course_id)
    and (p_teacher_id is null or r.uploaded_by = p_teacher_id)
  order by ru.uploaded_at desc nulls last, ss.full_name, c.name;
end;
$$ language plpgsql security definer;

grant execute on function public.get_results_filtered(uuid, uuid, public.class_level, text, uuid, uuid) to anon, authenticated;


