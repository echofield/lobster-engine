/**
 * SPACE-TIME API ROUTES
 *
 * Handles track operations with server-side verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { verifyConditionsServer, trackToClientFormat } from '@/lib/spacetime-service';

// GET /api/spacetime - Get published tracks or single track by ID
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const trackId = searchParams.get('id');
  const artistId = searchParams.get('artistId');

  try {
    const supabase = createServerClient();

    if (trackId) {
      // Get single track with verification
      const { data: track, error } = await supabase
        .from('tracks')
        .select('*')
        .eq('id', trackId)
        .single();

      if (error || !track) {
        return NextResponse.json({ error: 'Track not found' }, { status: 404 });
      }

      // Get listener location from headers (set by middleware or client)
      const latitude = parseFloat(request.headers.get('x-listener-latitude') || '');
      const longitude = parseFloat(request.headers.get('x-listener-longitude') || '');
      const location = !isNaN(latitude) && !isNaN(longitude) ? { latitude, longitude } : null;

      // Server-side verification
      const verification = verifyConditionsServer(track, location);

      return NextResponse.json({
        track: trackToClientFormat(track),
        verification,
      });
    }

    if (artistId) {
      // Get tracks by artist
      const { data: tracks, error } = await supabase
        .from('tracks')
        .select('*')
        .eq('artist_id', artistId)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ error: 'Failed to fetch tracks' }, { status: 500 });
      }

      return NextResponse.json({
        tracks: (tracks || []).map(trackToClientFormat),
      });
    }

    // Get all published tracks
    const { data: tracks, error } = await supabase
      .from('tracks')
      .select('*')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch tracks' }, { status: 500 });
    }

    return NextResponse.json({
      tracks: (tracks || []).map(trackToClientFormat),
    });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/spacetime - Create new track
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createServerClient();

    const { data: track, error } = await supabase
      .from('tracks')
      .insert({
        name: body.name,
        artist_id: body.artistId,
        story: body.story,
        audio_url: body.audioUrl,
        audio_duration: body.audioDuration,
        space_type: body.space?.type || 'anywhere',
        space_city: body.space?.city,
        space_country: body.space?.country,
        space_latitude: body.space?.latitude,
        space_longitude: body.space?.longitude,
        space_radius_km: body.space?.radiusKm || 25,
        time_type: body.time?.type || 'anytime',
        time_moon_phase: body.time?.moonPhase,
        time_start_hour: body.time?.startHour,
        time_end_hour: body.time?.endHour,
        time_season: body.time?.season,
        time_day_of_week: body.time?.dayOfWeek,
        time_month: body.time?.month,
        time_day: body.time?.day,
        time_start_date: body.time?.startDate,
        time_end_date: body.time?.endDate,
        visual_accent_color: body.visual?.accentColor || '#7C5CFF',
        visual_symbol_locked: body.visual?.symbolLocked || '◇',
        visual_symbol_unlocked: body.visual?.symbolUnlocked || '◆',
        visual_locked_message: body.visual?.lockedMessage || 'This experience is not yet available',
        visual_unlocked_message: body.visual?.unlockedMessage || 'Welcome',
        visual_background_url: body.visual?.backgroundUrl,
      })
      .select()
      .single();

    if (error) {
      console.error('[API] Create track error:', error);
      return NextResponse.json({ error: 'Failed to create track' }, { status: 500 });
    }

    return NextResponse.json({ track: trackToClientFormat(track) }, { status: 201 });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/spacetime - Update track
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Track ID required' }, { status: 400 });
    }

    const supabase = createServerClient();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Map client format to database format
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.story !== undefined) updateData.story = updates.story;
    if (updates.audioUrl !== undefined) updateData.audio_url = updates.audioUrl;
    if (updates.audioDuration !== undefined) updateData.audio_duration = updates.audioDuration;

    if (updates.space) {
      if (updates.space.type !== undefined) updateData.space_type = updates.space.type;
      if (updates.space.city !== undefined) updateData.space_city = updates.space.city;
      if (updates.space.country !== undefined) updateData.space_country = updates.space.country;
      if (updates.space.latitude !== undefined) updateData.space_latitude = updates.space.latitude;
      if (updates.space.longitude !== undefined) updateData.space_longitude = updates.space.longitude;
      if (updates.space.radiusKm !== undefined) updateData.space_radius_km = updates.space.radiusKm;
    }

    if (updates.time) {
      if (updates.time.type !== undefined) updateData.time_type = updates.time.type;
      if (updates.time.moonPhase !== undefined) updateData.time_moon_phase = updates.time.moonPhase;
      if (updates.time.startHour !== undefined) updateData.time_start_hour = updates.time.startHour;
      if (updates.time.endHour !== undefined) updateData.time_end_hour = updates.time.endHour;
      if (updates.time.season !== undefined) updateData.time_season = updates.time.season;
      if (updates.time.dayOfWeek !== undefined) updateData.time_day_of_week = updates.time.dayOfWeek;
      if (updates.time.month !== undefined) updateData.time_month = updates.time.month;
      if (updates.time.day !== undefined) updateData.time_day = updates.time.day;
      if (updates.time.startDate !== undefined) updateData.time_start_date = updates.time.startDate;
      if (updates.time.endDate !== undefined) updateData.time_end_date = updates.time.endDate;
    }

    if (updates.visual) {
      if (updates.visual.accentColor !== undefined) updateData.visual_accent_color = updates.visual.accentColor;
      if (updates.visual.symbolLocked !== undefined) updateData.visual_symbol_locked = updates.visual.symbolLocked;
      if (updates.visual.symbolUnlocked !== undefined) updateData.visual_symbol_unlocked = updates.visual.symbolUnlocked;
      if (updates.visual.lockedMessage !== undefined) updateData.visual_locked_message = updates.visual.lockedMessage;
      if (updates.visual.unlockedMessage !== undefined) updateData.visual_unlocked_message = updates.visual.unlockedMessage;
      if (updates.visual.backgroundUrl !== undefined) updateData.visual_background_url = updates.visual.backgroundUrl;
    }

    if (updates.publish) {
      updateData.published_at = new Date().toISOString();
    } else if (updates.unpublish) {
      updateData.published_at = null;
    }

    const { data: track, error } = await supabase
      .from('tracks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[API] Update track error:', error);
      return NextResponse.json({ error: 'Failed to update track' }, { status: 500 });
    }

    return NextResponse.json({ track: trackToClientFormat(track) });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/spacetime - Delete track
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Track ID required' }, { status: 400 });
  }

  try {
    const supabase = createServerClient();

    const { error } = await supabase.from('tracks').delete().eq('id', id);

    if (error) {
      console.error('[API] Delete track error:', error);
      return NextResponse.json({ error: 'Failed to delete track' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
