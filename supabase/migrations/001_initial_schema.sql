-- Table: profiles
CREATE TABLE profiles (
  id uuid references auth.users(id) primary key,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Table: shifts
CREATE TABLE shifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  clock_in timestamptz not null,
  clock_out timestamptz,
  duration_minutes integer,
  notes text,
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Policies for shifts
CREATE POLICY "users can view own shifts"
  ON shifts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users can insert own shifts"
  ON shifts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can update own shifts"
  ON shifts FOR UPDATE USING (auth.uid() = user_id);

-- Index for shifts
CREATE INDEX idx_shifts_user_id_clock_in ON shifts(user_id, clock_in DESC);

-- Trigger to automatically update 'updated_at' on profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
