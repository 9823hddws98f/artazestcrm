import { createClient } from '@supabase/supabase-js'

/**
 * Supabase-client.
 *
 * URL en anon-key komen uit environment-variabelen in plaats van hardcoded in
 * de broncode. De anon-key is publiek van ontwerp — hij komt hoe dan ook in de
 * JS-bundle terecht — maar door hem uit de omgeving te lezen kun je van project
 * wisselen zonder de code aan te passen, en staat er geen dood project meer in
 * de repo. De bescherming van de data komt van RLS, niet van deze sleutel.
 *
 * Lokaal: zet ze in `.env` (zie .env.example).
 * Vercel: Project Settings > Environment Variables.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Zonder deze melding valt de app stilletjes terug op localStorage en lijkt
  // alles te werken, terwijl er niets wordt opgeslagen. Dat is precies wat er
  // eerder gebeurde toen het oude project verdween.
  console.error(
    'VITE_SUPABASE_URL of VITE_SUPABASE_ANON_KEY ontbreekt. ' +
    'De app draait nu zonder database en slaat alles alleen lokaal op.'
  )
}

export const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '')

/** Of er überhaupt een database geconfigureerd is. */
export const hasDatabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

/** Upload een base64-afbeelding naar de `artworks`-bucket, geeft de publieke URL terug. */
export const uploadImage = async (base64, filename) => {
  try {
    const res = await fetch(base64)
    const blob = await res.blob()
    const path = `catalog/${filename}`

    const { error } = await supabase.storage
      .from('artworks')
      .upload(path, blob, { upsert: true, contentType: blob.type })

    if (error) {
      console.warn('Storage upload error:', error.message)
      return null
    }

    const { data: urlData } = supabase.storage.from('artworks').getPublicUrl(path)
    return urlData?.publicUrl || null
  } catch (err) {
    console.warn('Upload failed:', err)
    return null
  }
}
