-- Create tables to cache SGT API data

-- Members table
CREATE TABLE public.sgt_members (
  user_id INTEGER PRIMARY KEY,
  user_name TEXT NOT NULL,
  user_email TEXT,
  user_active INTEGER DEFAULT 1,
  user_country_code TEXT,
  user_has_avatar TEXT,
  user_game_id TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tours table
CREATE TABLE public.sgt_tours (
  tour_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  team_tour INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tour standings table
CREATE TABLE public.sgt_tour_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id INTEGER NOT NULL REFERENCES public.sgt_tours(tour_id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  country_code TEXT,
  user_has_avatar TEXT,
  hcp NUMERIC,
  events INTEGER DEFAULT 0,
  first INTEGER DEFAULT 0,
  top5 INTEGER DEFAULT 0,
  top10 INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  position INTEGER,
  gross_or_net TEXT DEFAULT 'gross',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tour_id, user_name, gross_or_net)
);

-- Tour members table (members registered for each tour)
CREATE TABLE public.sgt_tour_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id INTEGER NOT NULL REFERENCES public.sgt_tours(tour_id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL,
  user_name TEXT NOT NULL,
  hcp_index NUMERIC,
  custom_hcp NUMERIC,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tour_id, user_id)
);

-- Tournaments table
CREATE TABLE public.sgt_tournaments (
  tournament_id INTEGER PRIMARY KEY,
  tour_id INTEGER NOT NULL REFERENCES public.sgt_tours(tour_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  course_name TEXT,
  status TEXT,
  start_date TEXT,
  end_date TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Scorecards table
CREATE TABLE public.sgt_scorecards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id INTEGER NOT NULL REFERENCES public.sgt_tournaments(tournament_id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL,
  player_name TEXT,
  hcp_index NUMERIC,
  round INTEGER,
  course_name TEXT,
  teetype TEXT,
  rating NUMERIC,
  slope INTEGER,
  total_gross INTEGER,
  total_net INTEGER,
  to_par_gross INTEGER,
  to_par_net INTEGER,
  in_gross INTEGER,
  out_gross INTEGER,
  in_net INTEGER,
  out_net INTEGER,
  hole_data JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tournament_id, player_id, round)
);

-- Sync log to track when data was last synced
CREATE TABLE public.sgt_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'running',
  records_synced INTEGER DEFAULT 0,
  error_message TEXT
);

-- Create indexes for common queries
CREATE INDEX idx_sgt_tour_standings_tour ON public.sgt_tour_standings(tour_id);
CREATE INDEX idx_sgt_tour_members_tour ON public.sgt_tour_members(tour_id);
CREATE INDEX idx_sgt_tour_members_user ON public.sgt_tour_members(user_id);
CREATE INDEX idx_sgt_tournaments_tour ON public.sgt_tournaments(tour_id);
CREATE INDEX idx_sgt_scorecards_tournament ON public.sgt_scorecards(tournament_id);
CREATE INDEX idx_sgt_scorecards_player ON public.sgt_scorecards(player_id);
CREATE INDEX idx_sgt_members_email ON public.sgt_members(user_email);

-- Enable RLS but allow public read (this is public golf data)
ALTER TABLE public.sgt_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sgt_tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sgt_tour_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sgt_tour_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sgt_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sgt_scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sgt_sync_log ENABLE ROW LEVEL SECURITY;

-- Public read access (golf stats are public)
CREATE POLICY "Public read access" ON public.sgt_members FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.sgt_tours FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.sgt_tour_standings FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.sgt_tour_members FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.sgt_tournaments FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.sgt_scorecards FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.sgt_sync_log FOR SELECT USING (true);

-- Enable pg_cron and pg_net for scheduled syncing
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;