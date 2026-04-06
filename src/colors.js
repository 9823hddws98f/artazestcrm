// Artazest officiële kleurnamen
export const ARTAZEST_COLORS = [
  { key: 'Black', brand: 'Midnight Black', hex: '#1C1917' },
  { key: 'White', brand: 'Snow White', hex: '#F5F5F4' },
  { key: 'Blue', brand: 'Ocean Blue', hex: '#4A6FA5' },
  { key: 'Green', brand: 'Forest Green', hex: '#6B8E6B' },
  { key: 'Grey', brand: 'Stone Grey', hex: '#9CA3AF' },
  { key: 'Light tan', brand: 'Sahara Beige', hex: '#E8DCCC' },
  { key: 'Beige', brand: 'Ivory White', hex: '#D4C5A9' },
]

export const COLOR_MAP = Object.fromEntries(ARTAZEST_COLORS.map(c => [c.key, c]))
export const brandName = key => COLOR_MAP[key]?.brand || key
export const colorHex = key => COLOR_MAP[key]?.hex || '#9CA3AF'
export const colorLabel = key => { const c = COLOR_MAP[key]; return c ? `${c.brand}` : key }
export const colorKeys = ARTAZEST_COLORS.map(c => c.key)
