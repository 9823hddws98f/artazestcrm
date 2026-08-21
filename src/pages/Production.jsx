import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../api'

const STAGES = [
  { id: 'nieuw', label: 'Nieuw', emoji: '📥', color: '#3B82F6' },
  { id: 'printen', label: 'Printen', emoji: '🖨️', color: '#8B5CF6' },
  { id: 'lijmen', label: 'Lijmen & Drogen', emoji: '🧪', color: '#F59E0B', timerHours: 8 },
  { id: 'snijden', label: 'Snijden', emoji: '✂️', color: '#EC4899' },
  { id: 'inlijsten', label: 'Inlijsten', emoji: '🖼️', color: '#EF4444' },
  { id: 'inpakken', label: 'Inpakken', emoji: '📦', color: '#F97316' },
  { id: 'verzonden', label: 'Verzonden', emoji: '🚚', color: '#06B6D4' },
  { id: 'geleverd', label: 'Geleverd', emoji: '✓', color: '#10B981' },
]
const COLORS = ['Black','White','Blue','Green','Grey','Light tan','Beige']
const SIZES = ['60×60','60×120','70×100']
let _id = Date.now()
const genId = () => `prod-${_id++}`

function TimerBadge({ movedAt, requiredHours }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(i) }, [])
  const elapsed = (now - new Date(movedAt).getTime()) / 3600000
  const remaining = Math.max(0, requiredHours - elapsed)
  const done = remaining <= 0
  const hrs = Math.floor(remaining), mins = Math.floor((remaining - hrs) * 60)
  return (<div style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:600,
    background: done ? 'var(--color-success-bg,#ECFDF5)' : 'var(--color-warning-bg,#FEF3C7)',
    color: done ? 'var(--color-success,#059669)' : 'var(--color-warning,#B45309)' }}>
    <span style={{ fontSize:10 }}>{done ? '✓' : '⏱'}</span>{done ? 'Droog' : `${hrs}u ${mins}m`}
  </div>)
}

export default function Production() {
  const [orders, setOrders] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [newOrder, setNewOrder] = useState({ title:'', color:'Black', size:'60×60', qty:1, notes:'' })
  const [dragItem, setDragItem] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [filter, setFilter] = useState('alle')
  const [search, setSearch] = useState('')
  const loaded = useRef(false)
  useEffect(() => { if (loaded.current) return; loaded.current = true; api.getSetting('production_orders').then(d => { if (d?.length) setOrders(d) }) }, [])
  const save = useCallback((next) => { setOrders(next); api.saveSetting('production_orders', next) }, [])
  const addOrder = () => {
    if (!newOrder.title.trim()) return
    save([...orders, { id: genId(), ...newOrder, stage: 'nieuw', createdAt: new Date().toISOString(), stageMovedAt: new Date().toISOString() }])
    setNewOrder({ title:'', color:'Black', size:'60×60', qty:1, notes:'' }); setShowAdd(false)
  }
  const bumpStock = async (order) => {
    try {
      const stock = (await api.getSetting('artwork_stock')) || []
      // Find by matching title or create a virtual entry
      const idx = stock.findIndex(a => a.name && order.title && order.title.toLowerCase().includes(a.name.toLowerCase()))
      if (idx >= 0) {
        const a = stock[idx]
        const colors = { ...a.colors, [order.color]: (a.colors[order.color]||0) + (order.qty||1) }
        const total = Object.values(colors).reduce((s,v) => s+v, 0)
        stock[idx] = { ...a, colors, total }
        await api.saveSetting('artwork_stock', stock)
      }
    } catch (e) { console.warn('stock update failed', e) }
  }
  const moveOrder = (id, to) => {
    const order = orders.find(o => o.id === id)
    if (order && to === 'geleverd' && order.stage !== 'geleverd') bumpStock(order)
    save(orders.map(o => o.id === id ? { ...o, stage: to, stageMovedAt: new Date().toISOString() } : o))
  }
  const deleteOrder = (id) => { if (!confirm('Verwijderen?')) return; save(orders.filter(o => o.id !== id)) }
  const handleDragStart = (e, id) => { setDragItem(id); e.dataTransfer.effectAllowed = 'move' }
  const handleDragOver = (e, s) => { e.preventDefault(); setDragOver(s) }
  const handleDrop = (e, s) => { e.preventDefault(); if (dragItem) moveOrder(dragItem, s); setDragItem(null); setDragOver(null) }
  const handleDragEnd = () => { setDragItem(null); setDragOver(null) }
  const filtered = orders.filter(o => { if (filter !== 'alle' && o.color !== filter) return false; if (search && !o.title.toLowerCase().includes(search.toLowerCase()) && !o.notes?.toLowerCase().includes(search.toLowerCase())) return false; return true })
  const stageCounts = {}; STAGES.forEach(s => { stageCounts[s.id] = filtered.filter(o => o.stage === s.id).length })
  const totalActive = orders.filter(o => o.stage !== 'geleverd').length

  return (
    <div style={{ padding:'1.5rem' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'0.75rem' }}>
        <div>
          <h1 style={{ fontFamily:"'Instrument Serif',serif", fontSize:'1.75rem', margin:0, color:'var(--text-primary,#111)' }}>{'🏭'} Productie</h1>
          <p style={{ margin:'0.25rem 0 0', fontSize:'0.85rem', color:'var(--text-secondary,#666)' }}>{totalActive} actieve orders</p>
        </div>
        <div style={{ display:'flex', gap:'0.5rem', alignItems:'center', flexWrap:'wrap' }}>
          <input placeholder="Zoeken..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding:'0.4rem 0.75rem', borderRadius:8, border:'1px solid var(--border,#e5e7eb)', fontSize:'0.85rem', background:'var(--bg-secondary,#f9fafb)', color:'var(--text-primary,#111)', width:160 }} />
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding:'0.4rem 0.75rem', borderRadius:8, border:'1px solid var(--border,#e5e7eb)', fontSize:'0.85rem', background:'var(--bg-secondary,#f9fafb)', color:'var(--text-primary,#111)' }}>
            <option value="alle">Alle kleuren</option>
            {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={() => setShowAdd(true)} style={{ padding:'0.4rem 1rem', borderRadius:8, border:'none', background:'#D97706', color:'#fff', fontSize:'0.85rem', fontWeight:600, cursor:'pointer' }}>+ Nieuw</button>
        </div>
      </div>
      {showAdd && (<div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
        <div style={{ background:'var(--bg-primary,#fff)', borderRadius:16, padding:'1.5rem', width:400, maxWidth:'90vw', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
          <h3 style={{ margin:'0 0 1rem', fontFamily:"'Instrument Serif',serif", fontSize:'1.25rem', color:'var(--text-primary,#111)' }}>Nieuwe productie-order</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            <input placeholder="Titel (bv. Batch #12 Black 60x60)" value={newOrder.title} onChange={e => setNewOrder({...newOrder, title: e.target.value})} autoFocus onKeyDown={e => e.key === 'Enter' && addOrder()} style={{ padding:'0.5rem 0.75rem', borderRadius:8, border:'1px solid var(--border,#e5e7eb)', fontSize:'0.9rem', background:'var(--bg-secondary,#f9fafb)', color:'var(--text-primary,#111)' }} />
            <div style={{ display:'flex', gap:'0.5rem' }}>
              <select value={newOrder.color} onChange={e => setNewOrder({...newOrder, color:e.target.value})} style={{ flex:1, padding:'0.5rem', borderRadius:8, border:'1px solid var(--border,#e5e7eb)', fontSize:'0.85rem', background:'var(--bg-secondary,#f9fafb)', color:'var(--text-primary,#111)' }}>{COLORS.map(c => <option key={c} value={c}>{c}</option>)}</select>
              <select value={newOrder.size} onChange={e => setNewOrder({...newOrder, size:e.target.value})} style={{ flex:1, padding:'0.5rem', borderRadius:8, border:'1px solid var(--border,#e5e7eb)', fontSize:'0.85rem', background:'var(--bg-secondary,#f9fafb)', color:'var(--text-primary,#111)' }}>{SIZES.map(s => <option key={s} value={s}>{s}</option>)}</select>
              <input type="number" min={1} value={newOrder.qty} onChange={e => setNewOrder({...newOrder, qty: parseInt(e.target.value)||1})} style={{ width:60, padding:'0.5rem', borderRadius:8, border:'1px solid var(--border,#e5e7eb)', fontSize:'0.85rem', textAlign:'center', background:'var(--bg-secondary,#f9fafb)', color:'var(--text-primary,#111)' }} />
            </div>
            <textarea placeholder="Notities (optioneel)" value={newOrder.notes} onChange={e => setNewOrder({...newOrder, notes:e.target.value})} rows={2} style={{ padding:'0.5rem 0.75rem', borderRadius:8, border:'1px solid var(--border,#e5e7eb)', fontSize:'0.85rem', resize:'vertical', background:'var(--bg-secondary,#f9fafb)', color:'var(--text-primary,#111)' }} />
            <div style={{ display:'flex', gap:'0.5rem', justifyContent:'flex-end' }}>
              <button onClick={() => setShowAdd(false)} style={{ padding:'0.5rem 1rem', borderRadius:8, border:'1px solid var(--border,#e5e7eb)', background:'transparent', cursor:'pointer', color:'var(--text-primary,#111)' }}>Annuleren</button>
              <button onClick={addOrder} style={{ padding:'0.5rem 1rem', borderRadius:8, border:'none', background:'#D97706', color:'#fff', fontWeight:600, cursor:'pointer' }}>Toevoegen</button>
            </div>
          </div>
        </div>
      </div>)}
      <div style={{ display:'flex', gap:'0.75rem', overflowX:'auto', paddingBottom:'1rem', minHeight:'70vh' }}>
        {STAGES.map(stage => {
          const items = filtered.filter(o => o.stage === stage.id)
          const isOver = dragOver === stage.id
          return (<div key={stage.id} onDragOver={e => handleDragOver(e, stage.id)} onDrop={e => handleDrop(e, stage.id)} onDragLeave={() => setDragOver(null)}
              style={{ minWidth:220, maxWidth:260, flex:'1 0 220px', background: isOver ? 'var(--bg-hover,rgba(217,119,6,0.08))' : 'var(--bg-secondary,#f9fafb)', borderRadius:12, padding:'0.75rem', display:'flex', flexDirection:'column', border: isOver ? '2px dashed #D97706' : '2px solid transparent', transition:'all 0.15s ease' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:'0.75rem', paddingBottom:'0.5rem', borderBottom:`2px solid ${stage.color}` }}>
                <span style={{ fontSize:16 }}>{stage.emoji}</span>
                <span style={{ fontWeight:600, fontSize:'0.85rem', color:'var(--text-primary,#111)', flex:1 }}>{stage.label}</span>
                <span style={{ background:stage.color, color:'#fff', borderRadius:20, padding:'1px 8px', fontSize:11, fontWeight:700 }}>{stageCounts[stage.id]}</span>
              </div>
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'0.5rem', overflowY:'auto' }}>
                {items.map(order => (<div key={order.id} draggable onDragStart={e => handleDragStart(e, order.id)} onDragEnd={handleDragEnd}
                    style={{ background:'var(--bg-primary,#fff)', borderRadius:10, padding:'0.65rem', cursor:'grab', border:'1px solid var(--border,#e5e7eb)', boxShadow:'0 1px 3px rgba(0,0,0,0.06)', opacity: dragItem === order.id ? 0.4 : 1, transition:'opacity 0.15s' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:4 }}>
                      <span style={{ fontWeight:600, fontSize:'0.82rem', color:'var(--text-primary,#111)', lineHeight:1.3 }}>{order.title}</span>
                      <button onClick={() => deleteOrder(order.id)} style={{ border:'none', background:'none', cursor:'pointer', color:'var(--text-tertiary,#999)', fontSize:14, padding:0, lineHeight:1, flexShrink:0 }}>×</button>
                    </div>
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:6 }}>
                      <span style={{ fontSize:11, padding:'1px 6px', borderRadius:4, background:'var(--bg-tertiary,#f3f4f6)', color:'var(--text-secondary,#666)' }}>{order.color}</span>
                      <span style={{ fontSize:11, padding:'1px 6px', borderRadius:4, background:'var(--bg-tertiary,#f3f4f6)', color:'var(--text-secondary,#666)' }}>{order.size}</span>
                      <span style={{ fontSize:11, padding:'1px 6px', borderRadius:4, background:'var(--bg-tertiary,#f3f4f6)', color:'var(--text-secondary,#666)' }}>×{order.qty}</span>
                    </div>
                    {stage.timerHours && order.stageMovedAt && <div style={{ marginTop:6 }}><TimerBadge movedAt={order.stageMovedAt} requiredHours={stage.timerHours} /></div>}
                    {order.notes && <p style={{ margin:'6px 0 0', fontSize:'0.75rem', color:'var(--text-tertiary,#999)', lineHeight:1.3 }}>{order.notes}</p>}
                    <div style={{ display:'flex', gap:4, marginTop:8 }}>
                      {(() => { const idx = STAGES.findIndex(s => s.id === stage.id); const prev = STAGES[idx-1], next = STAGES[idx+1]; return <>
                        {prev && <button onClick={() => moveOrder(order.id, prev.id)} style={{ border:'1px solid var(--border,#e5e7eb)', background:'none', borderRadius:6, padding:'2px 6px', fontSize:11, cursor:'pointer', color:'var(--text-secondary,#666)' }}>←</button>}
                        {next && <button onClick={() => moveOrder(order.id, next.id)} style={{ border:'none', background:next.color, borderRadius:6, padding:'2px 8px', fontSize:11, cursor:'pointer', color:'#fff', fontWeight:600 }}>→ {next.emoji}</button>}
                      </> })()}
                    </div>
                  </div>))}
                {items.length === 0 && <div style={{ textAlign:'center', padding:'2rem 0.5rem', color:'var(--text-tertiary,#ccc)', fontSize:'0.8rem' }}>Sleep orders hierheen</div>}
              </div>
            </div>)
        })}
      </div>
    </div>
  )
}
