-- Uniforms content managed by Admin

create table if not exists public.uniforms (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  alt text default '',
  title text not null,
  description text default '',
  text_color text default 'text-gray-800',
  display_order int not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists uniforms_display_order_idx on public.uniforms(display_order);

-- Updated at trigger reuse
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_uniforms_updated_at on public.uniforms;
create trigger set_uniforms_updated_at
before update on public.uniforms
for each row execute function public.set_updated_at();

alter table public.uniforms enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'uniforms' and policyname = 'Allow read for all'
  ) then
    create policy "Allow read for all" on public.uniforms for select using (true);
  end if;
end $$;






