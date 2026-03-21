/**
 * Supabase Database Types for Space-Time
 *
 * Run this SQL in Supabase SQL Editor to create the tables:
 *
 * ```sql
 * -- Enable UUID extension
 * CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
 *
 * -- Artists table
 * CREATE TABLE artists (
 *   id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
 *   email TEXT UNIQUE NOT NULL,
 *   name TEXT NOT NULL,
 *   bio TEXT,
 *   avatar_url TEXT,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 *   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 *
 * -- Tracks table
 * CREATE TABLE tracks (
 *   id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
 *   artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
 *   name TEXT NOT NULL,
 *   story TEXT,
 *   audio_url TEXT NOT NULL,
 *   audio_duration FLOAT,
 *
 *   -- Space conditions (JSON)
 *   space_type TEXT DEFAULT 'anywhere',
 *   space_city TEXT,
 *   space_country TEXT,
 *   space_latitude FLOAT,
 *   space_longitude FLOAT,
 *   space_radius_km FLOAT DEFAULT 25,
 *
 *   -- Time conditions
 *   time_type TEXT DEFAULT 'anytime',
 *   time_moon_phase TEXT,
 *   time_start_hour INTEGER,
 *   time_end_hour INTEGER,
 *   time_season TEXT,
 *   time_day_of_week INTEGER[],
 *   time_month INTEGER,
 *   time_day INTEGER,
 *   time_start_date DATE,
 *   time_end_date DATE,
 *
 *   -- Visual settings (JSON)
 *   visual_accent_color TEXT DEFAULT '#7C5CFF',
 *   visual_symbol_locked TEXT DEFAULT '◇',
 *   visual_symbol_unlocked TEXT DEFAULT '◆',
 *   visual_locked_message TEXT DEFAULT 'This experience is not yet available',
 *   visual_unlocked_message TEXT DEFAULT 'Welcome',
 *   visual_background_url TEXT,
 *
 *   -- Stats
 *   play_count INTEGER DEFAULT 0,
 *   unlock_count INTEGER DEFAULT 0,
 *
 *   -- Timestamps
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 *   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 *   published_at TIMESTAMP WITH TIME ZONE
 * );
 *
 * -- Play logs (for analytics)
 * CREATE TABLE play_logs (
 *   id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
 *   track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
 *   listener_location JSONB,
 *   was_unlocked BOOLEAN,
 *   played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 *
 * -- Storage bucket for audio files
 * -- Run in Supabase Dashboard > Storage > Create bucket
 * -- Name: audio
 * -- Public: true
 *
 * -- RLS Policies
 * ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE play_logs ENABLE ROW LEVEL SECURITY;
 *
 * -- Artists can read/write their own data
 * CREATE POLICY "Artists can read own data" ON artists
 *   FOR SELECT USING (auth.uid() = id);
 * CREATE POLICY "Artists can update own data" ON artists
 *   FOR UPDATE USING (auth.uid() = id);
 *
 * -- Anyone can read published tracks
 * CREATE POLICY "Anyone can read published tracks" ON tracks
 *   FOR SELECT USING (published_at IS NOT NULL);
 * -- Artists can manage their own tracks
 * CREATE POLICY "Artists can manage own tracks" ON tracks
 *   FOR ALL USING (auth.uid() = artist_id);
 *
 * -- Anyone can write play logs
 * CREATE POLICY "Anyone can write play logs" ON play_logs
 *   FOR INSERT WITH CHECK (true);
 * ```
 */

export interface Database {
  public: {
    Tables: {
      artists: {
        Row: {
          id: string;
          email: string;
          name: string;
          bio: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          bio?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          bio?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      tracks: {
        Row: {
          id: string;
          artist_id: string | null;
          name: string;
          story: string | null;
          audio_url: string;
          audio_duration: number | null;
          space_type: string;
          space_city: string | null;
          space_country: string | null;
          space_latitude: number | null;
          space_longitude: number | null;
          space_radius_km: number;
          time_type: string;
          time_moon_phase: string | null;
          time_start_hour: number | null;
          time_end_hour: number | null;
          time_season: string | null;
          time_day_of_week: number[] | null;
          time_month: number | null;
          time_day: number | null;
          time_start_date: string | null;
          time_end_date: string | null;
          visual_accent_color: string;
          visual_symbol_locked: string;
          visual_symbol_unlocked: string;
          visual_locked_message: string;
          visual_unlocked_message: string;
          visual_background_url: string | null;
          play_count: number;
          unlock_count: number;
          created_at: string;
          updated_at: string;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          artist_id?: string | null;
          name: string;
          story?: string | null;
          audio_url?: string;
          audio_duration?: number | null;
          space_type?: string;
          space_city?: string | null;
          space_country?: string | null;
          space_latitude?: number | null;
          space_longitude?: number | null;
          space_radius_km?: number;
          time_type?: string;
          time_moon_phase?: string | null;
          time_start_hour?: number | null;
          time_end_hour?: number | null;
          time_season?: string | null;
          time_day_of_week?: number[] | null;
          time_month?: number | null;
          time_day?: number | null;
          time_start_date?: string | null;
          time_end_date?: string | null;
          visual_accent_color?: string;
          visual_symbol_locked?: string;
          visual_symbol_unlocked?: string;
          visual_locked_message?: string;
          visual_unlocked_message?: string;
          visual_background_url?: string | null;
          play_count?: number;
          unlock_count?: number;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
        Update: {
          name?: string;
          story?: string | null;
          audio_url?: string;
          audio_duration?: number | null;
          space_type?: string;
          space_city?: string | null;
          space_country?: string | null;
          space_latitude?: number | null;
          space_longitude?: number | null;
          space_radius_km?: number;
          time_type?: string;
          time_moon_phase?: string | null;
          time_start_hour?: number | null;
          time_end_hour?: number | null;
          time_season?: string | null;
          time_day_of_week?: number[] | null;
          time_month?: number | null;
          time_day?: number | null;
          time_start_date?: string | null;
          time_end_date?: string | null;
          visual_accent_color?: string;
          visual_symbol_locked?: string;
          visual_symbol_unlocked?: string;
          visual_locked_message?: string;
          visual_unlocked_message?: string;
          visual_background_url?: string | null;
          play_count?: number;
          unlock_count?: number;
          updated_at?: string;
          published_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tracks_artist_id_fkey';
            columns: ['artist_id'];
            referencedRelation: 'artists';
            referencedColumns: ['id'];
          }
        ];
      };
      play_logs: {
        Row: {
          id: string;
          track_id: string | null;
          listener_location: Record<string, unknown> | null;
          was_unlocked: boolean | null;
          played_at: string;
        };
        Insert: {
          id?: string;
          track_id?: string | null;
          listener_location?: Record<string, unknown> | null;
          was_unlocked?: boolean | null;
          played_at?: string;
        };
        Update: {
          track_id?: string | null;
          listener_location?: Record<string, unknown> | null;
          was_unlocked?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: 'play_logs_track_id_fkey';
            columns: ['track_id'];
            referencedRelation: 'tracks';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_play_count: {
        Args: { track_id: string };
        Returns: void;
      };
      increment_unlock_count: {
        Args: { track_id: string };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Helper types
export type Artist = Database['public']['Tables']['artists']['Row'];
export type Track = Database['public']['Tables']['tracks']['Row'];
export type PlayLog = Database['public']['Tables']['play_logs']['Row'];

export type TrackInsert = Database['public']['Tables']['tracks']['Insert'];
export type TrackUpdate = Database['public']['Tables']['tracks']['Update'];
