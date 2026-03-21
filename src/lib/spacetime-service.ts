/**
 * SPACE-TIME SERVICE
 *
 * Handles all Supabase operations for Space-Time:
 * - Audio upload to Storage
 * - Track CRUD operations
 * - Play logging and analytics
 * - Server-side condition verification
 */

import { getSupabase } from './supabase';
import { SpaceTimeEngine, SpaceTimeConditions } from './spacetime-engine';
import type { Track, TrackInsert, TrackUpdate } from '@/types/supabase';

// Lazy getter for supabase client
const supabase = () => getSupabase();

// ============ AUDIO UPLOAD ============

export async function uploadAudio(file: File, trackId: string): Promise<string | null> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${trackId}.${fileExt}`;
  const filePath = `tracks/${fileName}`;

  const { error } = await supabase().storage
    .from('audio')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('[SpaceTime] Upload error:', error);
    return null;
  }

  // Get public URL
  const { data } = supabase().storage.from('audio').getPublicUrl(filePath);
  return data.publicUrl;
}

export async function deleteAudio(trackId: string, fileExt: string): Promise<boolean> {
  const filePath = `tracks/${trackId}.${fileExt}`;

  const { error } = await supabase().storage.from('audio').remove([filePath]);

  if (error) {
    console.error('[SpaceTime] Delete error:', error);
    return false;
  }

  return true;
}

// ============ TRACKS ============

export async function createTrack(track: TrackInsert): Promise<Track | null> {
  const { data, error } = await supabase()
    .from('tracks')
    .insert(track)
    .select()
    .single();

  if (error) {
    console.error('[SpaceTime] Create track error:', error);
    return null;
  }

  return data;
}

export async function updateTrack(id: string, updates: TrackUpdate): Promise<Track | null> {
  const { data, error } = await supabase()
    .from('tracks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[SpaceTime] Update track error:', error);
    return null;
  }

  return data;
}

export async function deleteTrack(id: string): Promise<boolean> {
  const { error } = await supabase().from('tracks').delete().eq('id', id);

  if (error) {
    console.error('[SpaceTime] Delete track error:', error);
    return false;
  }

  return true;
}

export async function getTrack(id: string): Promise<Track | null> {
  const { data, error } = await supabase()
    .from('tracks')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[SpaceTime] Get track error:', error);
    return null;
  }

  return data;
}

export async function getTracksByArtist(artistId: string): Promise<Track[]> {
  const { data, error } = await supabase()
    .from('tracks')
    .select('*')
    .eq('artist_id', artistId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[SpaceTime] Get tracks error:', error);
    return [];
  }

  return data || [];
}

export async function getPublishedTracks(): Promise<Track[]> {
  const { data, error } = await supabase()
    .from('tracks')
    .select('*')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false });

  if (error) {
    console.error('[SpaceTime] Get published tracks error:', error);
    return [];
  }

  return data || [];
}

export async function publishTrack(id: string): Promise<Track | null> {
  return updateTrack(id, { published_at: new Date().toISOString() });
}

export async function unpublishTrack(id: string): Promise<Track | null> {
  return updateTrack(id, { published_at: null });
}

// ============ PLAY LOGGING ============

export async function logPlay(
  trackId: string,
  location: { latitude?: number; longitude?: number; city?: string } | null,
  wasUnlocked: boolean
): Promise<void> {
  const { error } = await supabase().from('play_logs').insert({
    track_id: trackId,
    listener_location: location,
    was_unlocked: wasUnlocked,
  });

  if (error) {
    console.error('[SpaceTime] Log play error:', error);
  }

  // Increment play/unlock count
  if (wasUnlocked) {
    await supabase().rpc('increment_play_count', { track_id: trackId });
    await supabase().rpc('increment_unlock_count', { track_id: trackId });
  }
}

// ============ CONDITION VERIFICATION ============

/**
 * Convert database track to SpaceTimeConditions
 */
export function trackToConditions(track: Track): SpaceTimeConditions {
  return {
    id: track.id,
    name: track.name,
    description: track.story || undefined,
    space: {
      type: track.space_type as 'anywhere' | 'city' | 'coordinates' | 'country',
      city: track.space_city || undefined,
      country: track.space_country || undefined,
      latitude: track.space_latitude || undefined,
      longitude: track.space_longitude || undefined,
      radiusKm: track.space_radius_km,
    },
    time: {
      type: track.time_type as 'anytime' | 'moon_phase' | 'time_range' | 'season' | 'day_of_week' | 'specific_date' | 'date_range',
      moonPhase: track.time_moon_phase as 'new' | 'waxing_crescent' | 'first_quarter' | 'waxing_gibbous' | 'full' | 'waning_gibbous' | 'last_quarter' | 'waning_crescent' | undefined,
      startHour: track.time_start_hour || undefined,
      endHour: track.time_end_hour || undefined,
      season: track.time_season as 'spring' | 'summer' | 'autumn' | 'winter' | undefined,
      dayOfWeek: track.time_day_of_week || undefined,
      month: track.time_month || undefined,
      day: track.time_day || undefined,
      startDate: track.time_start_date || undefined,
      endDate: track.time_end_date || undefined,
    },
    createdAt: track.created_at,
    createdBy: track.artist_id || undefined,
  };
}

/**
 * Server-side condition verification
 * Call this from an API route to verify conditions cannot be bypassed
 */
export function verifyConditionsServer(
  track: Track,
  listenerLocation: { latitude: number; longitude: number } | null
): { allowed: boolean; reason?: string } {
  const engine = new SpaceTimeEngine();
  const conditions = trackToConditions(track);

  // Create a mock location for server-side check
  const location = listenerLocation ? {
    latitude: listenerLocation.latitude,
    longitude: listenerLocation.longitude,
  } : null;

  const result = engine.evaluate(conditions, location || undefined);

  return {
    allowed: result.allowed,
    reason: result.reason,
  };
}

// ============ HELPERS ============

/**
 * Generate a shareable URL for a track
 */
export function getShareableUrl(trackId: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return `${baseUrl}/instruments/spacetime/${trackId}`;
}

/**
 * Convert Track to simplified format for client
 */
export function trackToClientFormat(track: Track) {
  return {
    id: track.id,
    name: track.name,
    artistId: track.artist_id,
    story: track.story,
    audioUrl: track.audio_url,
    audioDuration: track.audio_duration,
    conditions: trackToConditions(track),
    visual: {
      accentColor: track.visual_accent_color,
      symbolLocked: track.visual_symbol_locked,
      symbolUnlocked: track.visual_symbol_unlocked,
      lockedMessage: track.visual_locked_message,
      unlockedMessage: track.visual_unlocked_message,
      backgroundUrl: track.visual_background_url,
    },
    stats: {
      playCount: track.play_count,
      unlockCount: track.unlock_count,
    },
    publishedAt: track.published_at,
    createdAt: track.created_at,
  };
}
