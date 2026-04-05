import { useState, useEffect } from 'react'
import { api } from '../api'
const SECTIONS = [
  { key: 'panelen', label: 'Akoestische panelen' },
  { key: 'lijst', label: 'Houten lijst & knop' },
  { key: 'karton', label: 'Karton & verpakking' },
  { key: 'drukwerk', label: 'Drukwerk' },
  { key: 'samples', label: 'Samples snijden' },
  { key: 'cnc', label: 'CNC' },
]
export default function Inventory() {
  const [items, setItems] = useState([])
  const [tab, setTab] = useState('panelen')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({name:'',quantity:0,minStock:5,leadTimeDays:0,supplier:'',notes:''})
  useEffect(() => { api.getAll('inventory').then(setItems) }, [])
  const reload = () => api.getAll('inventory').then(setItems)
  const handleSave = async () => {
    if (!form.name.trim()) return
    await api.save('inventory', { ...form, section: tab })
    setForm({name:'',quantity:0,minStock:5,leadTimeDays:0,supplier:'',notes:''})
    setShowAdd(false); reload()
  }
  const updateQty = async (item, d) => { await api.save('inventory', { ...item, quantity: Math.max(0, item.quantity + d) }); reload() }
  const del = async (id) => { await api.remove('inventory', id); reload() }
  const getStatus = (i) => {
    if (!i.minStock) return 'none'
    const r = i.quantity / i.minStock
    return r <= 0 ? 'empty' : r < 0.5 ? 'low' : r < 1 ? 'warn' : 'ok'
  }
  const dots = { ok: '#059669', warn: '#D97706', low: '#DC2626', empty: '#DC2626', none: '#A8A29E' }
  const badges = {
    ok: { bg: '#D1FAE5', color: '#065F46', t: 'Op voorraad' },
    warn: { bg: '#FEF3C7', color: '#92400E', t: 'Bijna op' },
    low: { bg: '#FEE2E2', color: '#991B1B', t: 'Bestellen' },
    empty: { bg: '#FEE2E2', color: '#991B1B', t: 'Op!' },
    none: { bg: '#F2F0EB', color: '#78716C', t: '\u2014' },
  }
  const current = items.filter(i => i.section === tab)
  const needsOrder = items.filter(i => i.minStock > 0 && i.quantity < i.minStock).length
  const sectionBad = (key) => items.filter(i => i.section === key && i.minStock > 0 && i.quantity < i.minStock).length > 0
  return (
    <>
      <div className="page-header">
        <div>
          <h1>Voorraad</h1>
          <p className="page-subtitle">{items.length} items
            {needsOrder > 0 ? <span style={{color:'#DC2626'}}> · {needsOrder} bestellen</span>
              : <span style={{color:'#059669'}}> · alles op voorraad</span>}
          </p>
        </div>
      </div>
      <div style={{display:'flex',gap:'0.4rem',marginBottom:'1.5rem',flexWrap:'wrap'}}>
        {SECTIONS.map(s => {
          const active = tab === s.key
          const bad = sectionBad(s.key)
          return (
            <button key={s.key} onClick={() => setTab(s.key)} style={{
              padding:'0.45rem 1rem',borderRadius:'99px',border:'none',cursor:'pointer',
              fontSize:'0.82rem',fontWeight:active?600:500,fontFamily:'var(--font-body)',
              background:active?'#1C1917':'#F2F0EB',color:active?'#fff':'#1C1917',
              position:'relative',transition:'all 0.15s',
            }}>
              {s.label}
              {bad && <span style={{position:'absolute',top:'-2px',right:'-2px',width:'8px',height:'8px',borderRadius:'50%',background:'#DC2626',border:'2px solid #FAFAF7'}}/>}
            </button>
          )
        })}
      </div>
      <div className="card" style={{padding:0}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'1rem 1.25rem',borderBottom:'1px solid rgba(28,25,23,0.08)'}}>
          <h3 style={{margin:0,fontSize:'1.1rem'}}>{SECTIONS.find(s=>s.key===tab)?.label}</h3>
          <button className="btn btn-sm btn-primary" onClick={()=>setShowAdd(true)}>+ Toevoegen</button>
        </div>
        {current.length === 0 ? (
          <div style={{padding:'2rem',textAlign:'center',color:'#78716C',fontSize:'0.85rem'}}>Nog geen items</div>
        ) : (
          <div>
            {current.map((item, idx) => {
              const s = getStatus(item)
              const b = badges[s]
              return (
                <div key={item.id} style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.7rem 1.25rem',borderBottom:idx<current.length-1?'1px solid rgba(28,25,23,0.08)':'none'}}>
                  <div style={{width:'8px',height:'8px',borderRadius:'50%',background:dots[s],flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:500,fontSize:'0.9rem'}}>{item.name}</div>
                    {item.notes&&<div style={{fontSize:'0.72rem',color:'#78716C'}}>{item.notes}</div>}
                  </div>
                  <span style={{padding:'0.15rem 0.55rem',borderRadius:'99px',fontSize:'0.7rem',fontWeight:600,background:b.bg,color:b.color,whiteSpace:'nowrap'}}>{b.t}</span>
                  <div style={{display:'flex',alignItems:'center',gap:'0.35rem'}}>
                    <button onClick={()=>updateQty(item,-1)} style={{width:'24px',height:'24px',borderRadius:'50%',border:'1px solid rgba(28,25,23,0.15)',background:'none',cursor:'pointer',fontSize:'0.85rem',display:'flex',alignItems:'center',justifyContent:'center',color:'#78716C'}}>-</button>
                    <span style={{fontWeight:600,minWidth:'24px',textAlign:'center',fontSize:'0.9rem'}}>{item.quantity}</span>
                    <button onClick={()=>updateQty(item,1)} style={{width:'24px',height:'24px',borderRadius:'50%',border:'1px solid rgba(28,25,23,0.15)',background:'none',cursor:'pointer',fontSize:'0.85rem',display:'flex',alignItems:'center',justifyContent:'center',color:'#78716C'}}>+</button>
                  </div>
                  {item.minStock>0&&<div style={{fontSize:'0.7rem',color:'#78716C',minWidth:'40px',textAlign:'right'}}>min {item.minStock}</div>}
                  {item.leadTimeDays>0&&<div style={{fontSize:'0.7rem',color:'#78716C',minWidth:'35px',textAlign:'right'}}>{item.leadTimeDays}d</div>}
                  <button onClick={()=>del(item.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#78716C',fontSize:'0.7rem',opacity:0.4}}>&#10005;</button>
                </div>
              )
            })}
          </div>
        )}
      </div>
      {showAdd&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
          <div className="modal">
            <div className="modal-header"><h3>Item toevoegen</h3><button className="modal-close" onClick={()=>setShowAdd(false)}>&#10005;</button></div>
            <div className="form-group"><label className="form-label">Naam</label>
              <input className="form-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="bijv. Oak" autoFocus/></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
              <div className="form-group"><label className="form-label">Hoeveelheid</label>
                <input className="form-input" type="number" value={form.quantity} onChange={e=>setForm({...form,quantity:parseInt(e.target.value)||0})}/></div>
              <div className="form-group"><label className="form-label">Min. voorraad</label>
                <input className="form-input" type="number" value={form.minStock} onChange={e=>setForm({...form,minStock:parseInt(e.target.value)||0})}/></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
              <div className="form-group"><label className="form-label">Levertijd (dagen)</label>
                <input className="form-input" type="number" value={form.leadTimeDays} onChange={e=>setForm({...form,leadTimeDays:parseInt(e.target.value)||0})}/></div>
              <div className="form-group"><label className="form-label">Leverancier</label>
                <input className="form-input" value={form.supplier} onChange={e=>setForm({...form,supplier:e.target.value})}/></div>
            </div>
            <div className="form-group"><label className="form-label">Notities</label>
              <textarea className="form-textarea" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
            <div style={{display:'flex',gap:'0.5rem',justifyContent:'flex-end'}}>
              <button className="btn btn-outline" onClick={()=>setShowAdd(false)}>Annuleren</button>
              <button className="btn btn-primary" onClick={handleSave}>Opslaan</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
