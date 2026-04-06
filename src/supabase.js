import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://umtvatbzlsltaxcujcot.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtdHZhdGJ6bHNsdGF4Y3VqY290Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MjgwNjUsImV4cCI6MjA5MTAwNDA2NX0.rhg8QcUpfJ44nMoyqYzYgU95JvAJRqip1O1IfBu-tts'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
