import { supabase } from './supabase'

// Table redirects disabled until SQL migration runs
const SETTINGS_TO_TABLE = {}
const _cache = {}
const CACHE_TTL = 30 * 60 * 1000 // 30 min aggressive cache

export const api = {
  async getAll(store) {
    const { data, error } = await supabase.from(store).select('*')
    if (error) { console.warn(`getAll(${store}):`, error.message); try { return JSON.parse(localStorage.getItem(`artazest_${store}`) || '[]') } catch { return [] } }
    return data || []
  },
  async save(store, item) {
    const id = item.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const saved = { ...item, id }
    const { error } = await supabase.from(store).upsert(saved, { onConflict: 'id' })
    if (error) { console.warn(`save(${store}):`, error.message); const items = JSON.parse(localStorage.getItem(`artazest_${store}`) || '[]'); const idx = items.findIndex(i => i.id === id); if (idx >= 0) items[idx] = saved; else items.push(saved); localStorage.setItem(`artazest_${store}`, JSON.stringify(items)) }
    return saved
  },
  async remove(store, id) {
    const { error } = await supabase.from(store).delete().eq('id', id)
    if (error) { const items = JSON.parse(localStorage.getItem(`artazest_${store}`) || '[]').filter(i => i.id !== id); localStorage.setItem(`artazest_${store}`, JSON.stringify(items)) }
  },
  async toggle(store, id, field) {
    const { data } = await supabase.from(store).select('*').eq('id', id).single()
    if (data) return this.save(store, { ...data, [field]: !data[field] })
  },
  async getSetting(key) {
    if (SETTINGS_TO_TABLE[key]) {
      const table = SETTINGS_TO_TABLE[key]
      const { data, error } = await supabase.from(table).select('*')
      if (error) { console.warn(`getSetting->${table}:`, error.message); try { return JSON.parse(localStorage.getItem(`artazest_${key}`) || '[]') } catch { return [] } }
      return data || []
    }
    const cached = _cache[key]
    if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.value
    const { data, error } = await supabase.from('settings').select('value').eq('key', key).single()
    if (error || !data) { try { const ls = localStorage.getItem(`artazest_${key}`); return ls ? JSON.parse(ls) : null } catch { return null } }
    _cache[key] = { value: data.value, ts: Date.now() }
    return data.value
  },
  async saveSetting(key, value) {
    if (SETTINGS_TO_TABLE[key]) {
      const table = SETTINGS_TO_TABLE[key]
      if (Array.isArray(value)) {
        for (const item of value) {
          const id = item.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
          await supabase.from(table).upsert({ ...item, id }, { onConflict: 'id' })
        }
        const { data: existing } = await supabase.from(table).select('id')
        if (existing) { const newIds = new Set(value.map(v => v.id)); const toDel = existing.filter(e => !newIds.has(e.id)).map(e => e.id); if (toDel.length) await supabase.from(table).delete().in('id', toDel) }
      }
      localStorage.setItem(`artazest_${key}`, JSON.stringify(value))
      return
    }
    localStorage.setItem(`artazest_${key}`, JSON.stringify(value))
    _cache[key] = { value, ts: Date.now() }
    await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' })
  },
  clearCache() { Object.keys(_cache).forEach(k => delete _cache[k]) },
  async seedIfEmpty(store, items) {
    const { count } = await supabase.from(store).select('*', { count: 'exact', head: true })
    if (count === 0) { await supabase.from(store).upsert(items, { onConflict: 'id' }) }
  }
}
