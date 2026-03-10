import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey)

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseKey)
  : null

if (!hasSupabaseConfig) {
  console.error(
    "Missing Supabase config. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in hostel-frontend/.env",
  )
}
