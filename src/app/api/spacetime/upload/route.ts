/**
 * AUDIO UPLOAD API ROUTE
 *
 * Handles audio file uploads to Supabase Storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const trackId = formData.get('trackId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!trackId) {
      return NextResponse.json({ error: 'No track ID provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/flac', 'audio/aac'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Allowed: WAV, MP3, OGG, FLAC, AAC' }, { status: 400 });
    }

    // Max file size: 100MB
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Max size: 100MB' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Get file extension
    const fileExt = file.name.split('.').pop() || 'mp3';
    const fileName = `${trackId}.${fileExt}`;
    const filePath = `tracks/${fileName}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('audio')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('[API] Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('audio').getPublicUrl(filePath);

    // Update track with audio URL
    const { error: updateError } = await supabase
      .from('tracks')
      .update({
        audio_url: urlData.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', trackId);

    if (updateError) {
      console.error('[API] Update error:', updateError);
      // Don't fail - file was uploaded, just track update failed
    }

    return NextResponse.json({
      url: urlData.publicUrl,
      fileName,
      size: file.size,
    });
  } catch (error) {
    console.error('[API] Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
