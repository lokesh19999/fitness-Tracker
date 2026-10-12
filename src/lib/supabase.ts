import { createClient } from '@supabase/supabase-js'

import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * True when the build has been configured with real Supabase credentials.
 * When false the app renders a friendly setup screen instead of crashing.
 */
export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project'),
)

/**
 * Browser client using only the publishable/anon key.
 * The service-role key must NEVER be used in frontend code.
 */
export const supabase = createClient<Database>(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)

export const PHOTO_BUCKET = 'progress-photos'
