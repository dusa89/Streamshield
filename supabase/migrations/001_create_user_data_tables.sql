-- Create tables for StreamShield user data sync
-- This ensures users never lose their data, even after uninstall/reinstall

-- Enable Row Level Security

-- Create user_profiles table to store user metadata
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spotify_user_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_history table to store listening history
CREATE TABLE IF NOT EXISTS user_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  track_id TEXT NOT NULL,
  track_name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  artist_id TEXT,
  album_name TEXT NOT NULL,
  album_id TEXT,
  album_art_url TEXT,
  duration_ms INTEGER,
  played_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_profile_id, track_id, played_at)
);

-- Create user_blacklist table to store blacklisted items
CREATE TABLE IF NOT EXISTS user_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('track', 'artist', 'genre')),
  artist_name TEXT, -- For tracks only
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_profile_id, item_id, item_type)
);

-- Create user_shield_sessions table to store shield activation history
CREATE TABLE IF NOT EXISTS user_shield_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  session_start TIMESTAMP WITH TIME ZONE NOT NULL,
  session_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_history_user_profile_id ON user_history(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_user_history_played_at ON user_history(played_at);
CREATE INDEX IF NOT EXISTS idx_user_blacklist_user_profile_id ON user_blacklist(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_user_blacklist_item_type ON user_blacklist(item_type);
CREATE INDEX IF NOT EXISTS idx_user_shield_sessions_user_profile_id ON user_shield_sessions(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_user_shield_sessions_start ON user_shield_sessions(session_start);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_shield_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Note: In a real app, you'd use JWT tokens for authentication
-- For now, we'll use a simple policy that allows all operations
-- You should replace this with proper JWT-based authentication

-- User profiles policy
CREATE POLICY "Users can manage their own profile" ON user_profiles
  FOR ALL USING (true);

-- History policy  
CREATE POLICY "Users can manage their own history" ON user_history
  FOR ALL USING (true);

-- Blacklist policy
CREATE POLICY "Users can manage their own blacklist" ON user_blacklist
  FOR ALL USING (true);

-- Shield sessions policy
CREATE POLICY "Users can manage their own shield sessions" ON user_shield_sessions
  FOR ALL USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_profiles
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 