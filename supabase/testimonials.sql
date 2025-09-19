-- Testimonials managed by Admin

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text not null,
  message text not null,
  image_url text,
  display_order int not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists testimonials_display_order_idx on public.testimonials(display_order);

-- Updated at trigger reuse
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_testimonials_updated_at on public.testimonials;
create trigger set_testimonials_updated_at
before update on public.testimonials
for each row execute function public.set_updated_at();

alter table public.testimonials enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'testimonials' and policyname = 'Allow read for all'
  ) then
    create policy "Allow read for all" on public.testimonials for select using (true);
  end if;
end $$;






