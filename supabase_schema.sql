-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique,
  avatar_url text,
  grade_level text check (grade_level in ('CP', 'CE1', 'CE2', 'CM1', 'CM2', '6ème')),
  stars integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create progress table
create table progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  subject text not null,
  score integer not null,
  activity_type text not null, -- 'quiz', 'math', 'assistant'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;
alter table progress enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

create policy "Users can view own progress." on progress
  for select using (auth.uid() = user_id);

create policy "Users can insert own progress." on progress
  for insert with check (auth.uid() = user_id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, grade_level, stars)
  values (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'grade_level', 0);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
