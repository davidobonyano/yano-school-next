-- Student Gallery managed by Admin

create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  alt text default '',
  title text not null,
  category text not null check (category in ('prefects','students','events','school')),
  description text default '',
  display_order int not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists gallery_images_display_order_idx on public.gallery_images(display_order);
create index if not exists gallery_images_category_idx on public.gallery_images(category);

-- Updated at trigger reuse
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_gallery_images_updated_at on public.gallery_images;
create trigger set_gallery_images_updated_at
before update on public.gallery_images
for each row execute function public.set_updated_at();

alter table public.gallery_images enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'gallery_images' and policyname = 'Allow read for all'
  ) then
    create policy "Allow read for all" on public.gallery_images for select using (true);
  end if;
end $$;






