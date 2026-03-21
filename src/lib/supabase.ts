import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Lazy-initialized client to avoid build-time errors
let _supabase: SupabaseClient<Database> | null = null;

// Client-side Supabase client (lazy init)
export const getSupabase = (): SupabaseClient<Database> => {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase environment variables not set');
    }

    _supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
};

// For backwards compatibility
export const supabase = typeof window !== 'undefined' ? getSupabase() : null as unknown as SupabaseClient<Database>;

// Server-side client with service role (for API routes)
export const createServerClient = (): SupabaseClient<Database> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  }
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey);
};
