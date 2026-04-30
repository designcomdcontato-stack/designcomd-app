-- SOCIALFLOW SUPABASE MIGRATIONS

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: Agency Settings
CREATE TABLE IF NOT EXISTS agency_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo TEXT,
  contact_email TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  tertiary_color TEXT,
  preferred_client_id UUID,
  preferred_client_name TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: Clients
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo TEXT,
  primary_color TEXT,
  social_media TEXT[] DEFAULT '{}',
  responsible TEXT,
  observations TEXT,
  bio TEXT,
  brand_voice_manual TEXT,
  editorial_line JSONB DEFAULT '[]',
  follower_history JSONB DEFAULT '[]',
  brand_palette JSONB DEFAULT '[]',
  brand_voice JSONB DEFAULT '{}',
  assets JSONB DEFAULT '[]',
  folders JSONB DEFAULT '[]',
  fixed_info JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: Team Members
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar TEXT,
  email TEXT UNIQUE,
  status TEXT DEFAULT 'Ativo',
  permission TEXT DEFAULT 'Colaborador',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: Posts
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL,
  channels TEXT[] DEFAULT '{}',
  format TEXT NOT NULL,
  editorial_item_id TEXT,
  image TEXT,
  description TEXT,
  responsible TEXT,
  responsible_id UUID,
  published_by TEXT,
  checklist JSONB DEFAULT '[]',
  comments JSONB DEFAULT '[]',
  metrics JSONB DEFAULT '{"reach": 0, "plays": 0, "likes": 0, "comments": 0, "shares": 0, "saves": 0}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  requester TEXT,
  delivery_date DATE,
  status TEXT NOT NULL,
  responsible TEXT,
  responsible_id UUID,
  description TEXT,
  checklist JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: Commemorative Dates
CREATE TABLE IF NOT EXISTS commemorative_dates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: Financial Reports
CREATE TABLE IF NOT EXISTS financial_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  title TEXT NOT NULL,
  due_date DATE NOT NULL,
  items JSONB DEFAULT '[]',
  status TEXT NOT NULL,
  payment_info JSONB DEFAULT '{}',
  total NUMERIC DEFAULT 0,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: Authorized Users
CREATE TABLE IF NOT EXISTS authorized_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: Editorial Lines
CREATE TABLE IF NOT EXISTS editorial_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  category TEXT,
  subcategory TEXT,
  funnel_type TEXT,
  objective TEXT,
  content_type TEXT,
  frequency TEXT,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pre-populate with admin email
INSERT INTO authorized_users (email)
VALUES ('designcomd.contato@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE agency_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE commemorative_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorized_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE editorial_lines ENABLE ROW LEVEL SECURITY;

-- Policies: Anonymous read access
DROP POLICY IF EXISTS "Allow anonymous read" ON agency_settings;
CREATE POLICY "Allow anonymous read" ON agency_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anonymous read" ON clients;
CREATE POLICY "Allow anonymous read" ON clients FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anonymous read" ON team_members;
CREATE POLICY "Allow anonymous read" ON team_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anonymous read" ON posts;
CREATE POLICY "Allow anonymous read" ON posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anonymous read" ON tasks;
CREATE POLICY "Allow anonymous read" ON tasks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anonymous read" ON commemorative_dates;
CREATE POLICY "Allow anonymous read" ON commemorative_dates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anonymous read" ON financial_reports;
CREATE POLICY "Allow anonymous read" ON financial_reports FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anonymous read" ON authorized_users;
CREATE POLICY "Allow anonymous read" ON authorized_users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anonymous read" ON editorial_lines;
CREATE POLICY "Allow anonymous read" ON editorial_lines FOR SELECT USING (true);

-- Policies: Authenticated full access
DROP POLICY IF EXISTS "Allow authenticated full access" ON agency_settings;
CREATE POLICY "Allow authenticated full access" ON agency_settings FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated full access" ON clients;
CREATE POLICY "Allow authenticated full access" ON clients FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated full access" ON team_members;
CREATE POLICY "Allow authenticated full access" ON team_members FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated full access" ON posts;
CREATE POLICY "Allow authenticated full access" ON posts FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated full access" ON tasks;
CREATE POLICY "Allow authenticated full access" ON tasks FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated full access" ON commemorative_dates;
CREATE POLICY "Allow authenticated full access" ON commemorative_dates FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated full access" ON financial_reports;
CREATE POLICY "Allow authenticated full access" ON financial_reports FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated full access" ON editorial_lines;
CREATE POLICY "Allow authenticated full access" ON editorial_lines FOR ALL USING (auth.role() = 'authenticated');

-- Table: Diary Entries
CREATE TABLE IF NOT EXISTS diary_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  entry_date DATE,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, entry_date, category)
);

ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anonymous read" ON diary_entries;
CREATE POLICY "Allow anonymous read" ON diary_entries FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow authenticated full access" ON diary_entries;
CREATE POLICY "Allow authenticated full access" ON diary_entries FOR ALL USING (auth.role() = 'authenticated');

-- Table: Post Metrics
CREATE TABLE IF NOT EXISTS post_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE UNIQUE,
  reach INTEGER DEFAULT 0,
  plays INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE post_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anonymous read" ON post_metrics;
CREATE POLICY "Allow anonymous read" ON post_metrics FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow authenticated full access" ON post_metrics;
CREATE POLICY "Allow authenticated full access" ON post_metrics FOR ALL USING (auth.role() = 'authenticated');

-- Table: Files
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT,
  size INTEGER,
  folder_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anonymous read" ON files;
CREATE POLICY "Allow anonymous read" ON files FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow authenticated full access" ON files;
CREATE POLICY "Allow authenticated full access" ON files FOR ALL USING (auth.role() = 'authenticated');
