import { supabase } from './supabase'

export const api = {
  async getAll(store) {
    const { data, error } = await supabase.from(store).select('*')
    if (error) {
      console.warn(`Supabase getAll(${store}):`, error.message)
      try { return JSON.parse(localStorage.getItem(`artazest_${store}`) || '[]') } catch { return [] }
    }
    return data || []
  },

  async save(store, item) {
    const id = item.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const saved = { ...item, id }
    const { error } = await supabase.from(store).upsert(saved, { onConflict: 'id' })
    if (error) {
      console.warn(`Supabase save(${store}):`, error.message)
      const items = JSON.parse(localStorage.getItem(`artazest_${store}`) || '[]')
      const idx = items.findIndex(i => i.id === id)
      if (idx >= 0) items[idx] = saved; else items.push(saved)
      localStorage.setItem(`artazest_${store}`, JSON.stringify(items))
    }
    return saved
  },

  async remove(store, id) {
    const { error } = await supabase.from(store).delete().eq('id', id)
    if (error) {
      const items = JSON.parse(localStorage.getItem(`artazest_${store}`) || '[]').filter(i => i.id !== id)
      localStorage.setItem(`artazest_${store}`, JSON.stringify(items))
    }
  },

  async toggle(store, id, field) {
    const { data } = await supabase.from(store).select('*').eq('id', id).single()
    if (data) return this.save(store, { ...data, [field]: !data[field] })
  },

  // ── Settings key/value helpers ──
  async getSetting(key) {
    const { data, error } = await supabase.from('settings').select('*').eq('key', key).single()
    if (error || !data) {
      try { const ls = localStorage.getItem(`artazest_${key}`); return ls ? JSON.parse(ls) : null } catch { return null }
    }
    return data.value
  },

  async saveSetting(key, value) {
    localStorage.setItem(`artazest_${key}`, JSON.stringify(value))
    const { error } = await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' })
    if (error) console.warn(`saveSetting(${key}):`, error.message)
  },

  // Seed Supabase als tabellen leeg zijn
  async seedIfEmpty(store, items) {
    const { count } = await supabase.from(store).select('*', { count: 'exact', head: true })
    if (count === 0) {
      const { error } = await supabase.from(store).upsert(items, { onConflict: 'id' })
      if (error) console.warn(`Seed ${store}:`, error.message)
      else console.log(`✓ Supabase ${store} geseeded (${items.length} items)`)
    }
  }
}
