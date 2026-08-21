import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url'
  ? process.env.NEXT_PUBLIC_SUPABASE_URL
  : 'https://xyzxyzxyzxyz.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

if (
  process.env.NODE_ENV !== 'production' &&
  (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_project_url')
) {
  console.warn(
    '⚠️  indirimGO Panel: .env.local dosyasına Supabase URL ve Anon Key ekleyin!\n' +
    '   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co\n' +
    '   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...'
  )
}

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

