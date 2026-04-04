// Data stored in localStorage for now
// TODO: Vercel KV for shared data between users

export const api = {
  async getAll(store) {
    const data = localStorage.getItem(`artazest_${store}`)
    return data ? JSON.parse(data) : []
  },

  async save(store, item) {
    const id = item.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const saved = { ...item, id }
    const items = await this.getAll(store)
    const idx = items.findIndex(i => i.id === id)
    if (idx >= 0) items[idx] = saved; else items.push(saved)
    localStorage.setItem(`artazest_${store}`, JSON.stringify(items))
    return saved
  },

  async remove(store, id) {
    const items = (await this.getAll(store)).filter(i => i.id !== id)
    localStorage.setItem(`artazest_${store}`, JSON.stringify(items))
  },

  async toggle(store, id, field) {
    const items = await this.getAll(store)
    const item = items.find(i => i.id === id)
    if (item) { item[field] = !item[field]; return this.save(store, item) }
  }
}
