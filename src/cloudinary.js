// Cloudinary config — vul je eigen cloud_name en upload_preset in
const CLOUD_NAME = 'dljwsd5ue' // wordt via settings geladen
const UPLOAD_PRESET = 'artazest_unsigned' // maak deze aan in Cloudinary dashboard

export async function uploadToCloudinary(file, { getSetting } = {}) {
  let cloudName = CLOUD_NAME
  
  // Try to load from settings
  if (!cloudName && getSetting) {
    const config = await getSetting('cloudinary_config')
    cloudName = config?.cloud_name || ''
  }
  
  // Fallback: check localStorage
  if (!cloudName) {
    try { cloudName = JSON.parse(localStorage.getItem('artazest_cloudinary_config') || '{}').cloud_name || '' } catch {}
  }

  if (!cloudName) throw new Error('Cloudinary niet geconfigureerd. Ga naar Instellingen → Cloudinary.')

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', 'artazest')

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  })
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Upload failed: ${res.status}`)
  }
  
  const data = await res.json()
  return {
    url: data.secure_url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
    format: data.format,
    bytes: data.bytes,
    // Optimized URL (auto quality + format, max 800px breed)
    optimizedUrl: data.secure_url.replace('/upload/', '/upload/q_auto,f_auto,w_800/'),
    thumbnailUrl: data.secure_url.replace('/upload/', '/upload/q_auto,f_auto,w_300,h_200,c_fill/'),
  }
}
