-- Office Quest - Database Schema (PostgreSQL)

-- 1. Users Table
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  username text,
  points integer default 0 not null,
  current_multiplier double precision default 1.0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Users
alter table public.users enable row level security;

create policy "Profiles are viewable by everyone" on public.users
  for select using (true);

create policy "Users can update their own profile" on public.users
  for update using (auth.uid() = id);

-- 2. Quests Table (Görev Şablonları)
create table public.quests (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  category text not null, -- Mutfak, Stok, Gün Başı, Gün Sonu
  points integer not null,
  max_daily_limit integer default 1 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Quests
alter table public.quests enable row level security;

create policy "Quests are viewable by everyone" on public.quests
  for select using (true);

create policy "Quests can only be modified by admins" on public.quests
  for all using (false);

-- 3. User Quests Table (Feed / Yapılan Görevler)
create table public.user_quests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  quest_name text not null,
  category text not null,
  points_earned integer not null,
  photo_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for User Quests
alter table public.user_quests enable row level security;

create policy "User quests are viewable by everyone" on public.user_quests
  for select using (true);

create policy "Users can insert their own completed quests" on public.user_quests
  for insert with check (auth.uid() = user_id);

-- 4. User Badges Table (Rozetler ve İlerleme)
create table public.user_badges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  badge_name text not null,
  progress integer default 0 not null,
  is_unlocked boolean default false not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, badge_name)
);

-- Enable RLS for User Badges
alter table public.user_badges enable row level security;

create policy "User badges are viewable by everyone" on public.user_badges
  for select using (true);

create policy "Users can update their own badge progress" on public.user_badges
  for update using (auth.uid() = user_id);

create policy "Users can insert their own badge records" on public.user_badges
  for insert with check (auth.uid() = user_id);

-- 5. Triggers for Auth Integration
-- Automatically create a public user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, username, points, current_multiplier)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'username', substring(new.email from '^[^@]+')), 
    0, 
    1.0
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger definition
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Initial Quests Seeds
insert into public.quests (name, category, points, max_daily_limit) values
  ('Kahve makinesi temizliği', 'Mutfak', 25, 2),
  ('Filtre kahve hazırla / temizle', 'Mutfak', 15, 3),
  ('Çay düzeni kontrolü', 'Mutfak', 15, 2),
  ('Plastik bardak kontrolü', 'Stok', 10, 1),
  ('Çatal-kaşık kontrolü', 'Stok', 10, 1),
  ('Şeker/süt vb. kontrolü', 'Stok', 10, 1),
  ('Gün başı kontrol listesi', 'Gün Başı', 20, 1),
  ('Gün sonu temizlik kontrolü', 'Gün Sonu', 25, 1)
  on conflict (name) do nothing;
