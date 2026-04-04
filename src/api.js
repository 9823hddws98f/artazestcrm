const IS_LOCAL = window.location.hostname === 'localhost';
const localGet = (store) => { const d = localStorage.getItem(`artazest_${store}`); return d ? JSON.parse(d) : []; };
const localSave = (store, items) => { localStorage.setItem(`artazest_${store}`, JSON.stringify(items)); };

export const api = {
  async getAll(store) {
    if (IS_LOCAL) return localGet(store);
    const res = await fetch(`/api/${store}`);
    return res.json();
  },
  async save(store, item) {
    const id = item.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const saved = { ...item, id };
    if (IS_LOCAL) {
      const items = localGet(store);
      const idx = items.findIndex(i => i.id === id);
      if (idx >= 0) items[idx] = saved; else items.push(saved);
      localSave(store, items); return saved;
    }
    const method = item.id ? 'PUT' : 'POST';
    const url = item.id ? `/api/${store}/${id}` : `/api/${store}`;
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(saved) });
    return res.json();
  },
  async remove(store, id) {
    if (IS_LOCAL) { localSave(store, localGet(store).filter(i => i.id !== id)); return; }
    await fetch(`/api/${store}/${id}`, { method: 'DELETE' });
  },
  async toggle(store, id, field) {
    const items = await this.getAll(store);
    const item = items.find(i => i.id === id);
    if (item) { item[field] = !item[field]; return this.save(store, item); }
  }
};
