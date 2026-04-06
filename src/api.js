import { supabase } from './supabase'

// Veld-mapping: sommige velden zijn camelCase in de app maar quoted in Supabase
const STORES = ['tasks', 'inventory', 'catalog', 'investments', 'settings', 'checkins']

export const api = {
  async getAll(store) {
    const { data, error } = await supabase.from(store).select('*')
    if (error) {
      console.warn(`Supabase getAll(${store}) fout:`, error.message)
      // Fallback naar localStorage
      try { return JSON.parse(localStorage.getItem(`artazest_${store}`) || '[]') } catch { return [] }
    }
    return data || []
  },

  async save(store, item) {
    const id = item.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const saved = { ...item, id }
    const { error } = await supabase.from(store).upsert(saved, { onConflict: 'id' })
    if (error) {
      console.warn(`Supabase save(${store}) fout:`, error.message)
      // Fallback: localStorage
      const items = await this._localGetAll(store)
      const idx = items.findIndex(i => i.id === id)
      if (idx >= 0) items[idx] = saved; else items.push(saved)
      localStorage.setItem(`artazest_${store}`, JSON.stringify(items))
    }
    return saved
  },

  async remove(store, id) {
    const { error } = await supabase.from(store).delete().eq('id', id)
    if (error) {
      console.warn(`Supabase remove(${store}) fout:`, error.message)
      const items = (await this._localGetAll(store)).filter(i => i.id !== id)
      localStorage.setItem(`artazest_${store}`, JSON.stringify(items))
    }
  },

  async toggle(store, id, field) {
    const { data } = await supabase.from(store).select('*').eq('id', id).single()
    if (data) {
      const updated = { ...data, [field]: !data[field] }
      return this.save(store, updated)
    }
  },

  // localStorage fallback helpers
  _localGetAll(store) {
    try { return JSON.parse(localStorage.getItem(`artazest_${store}`) || '[]') } catch { return [] }
  },

  // Migreer bestaande localStorage data naar Supabase (eenmalig)
  async migrateFromLocalStorage() {
    const migrated = localStorage.getItem('artazest_migrated_to_supabase')
    if (migrated) return

    console.log('Migreren van localStorage naar Supabase...')
    for (const store of STORES) {
      const local = this._localGetAll(store)
      if (local.length > 0) {
        const { error } = await supabase.from(store).upsert(local, { onConflict: 'id' })
        if (error) console.warn(`Migratie ${store} fout:`, error.message)
        else console.log(`✓ ${store}: ${local.length} items gemigreerd`)
      }
    }
    localStorage.setItem('artazest_migrated_to_supabase', '1')
    console.log('Migratie klaar!')
  }
}
