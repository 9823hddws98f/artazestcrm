import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://umtvatbzlsltaxcujcot.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtdHZhdGJ6bHNsdGF4Y3VqY290Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MjgwNjUsImV4cCI6MjA5MTAwNDA2NX0.rhg8QcUpfJ44nMoyqYzYgU95JvAJRqip1O1IfBu-tts'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Storage helper — upload base64 image, return public URL
export const uploadImage = async (base64, filename) => {
  try {
    // Convert base64 to blob
    const res = await fetch(base64)
    const blob = await res.blob()
    const path = `catalog/${filename}`
    
    // Upload to storage
    const { data, error } = await supabase.storage
      .from('artworks')
      .upload(path, blob, { upsert: true, contentType: blob.type })
    
    if (error) {
      console.warn('Storage upload error:', error.message)
      return null
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage.from('artworks').getPublicUrl(path)
    return urlData?.publicUrl || null
  } catch (err) {
    console.warn('Upload failed:', err)
    return null
  }
}
