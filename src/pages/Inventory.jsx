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
const PANELS_PER_ARTWORK = 2
export default function Inventory() {
  const [items, setItems] = useState([])
  const [tab, setTab] = useState('panelen')
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({name:'',quantity:0,minStock:10,leadTimeDays:90,supplier:'',notes:''})
  useEffect(() => { api.getAll('inventory').then(setItems) }, [])
  const reload = () => api.getAll('inventory').then(setItems)
  const handleSave = async () => {
    if (!form.name.trim()) return
    await api.save('inventory', { ...form, section: tab })
    setForm({name:'',quantity:0,minStock:10,leadTimeDays:90,supplier:'',notes:''})
    setShowAdd(false); reload()
  }
  const updateField = async (item, field, value) => {
    await api.save('inventory', { ...item, [field]: value })
    reload()
  }
  const updateQty = async (item, d) => { await api.save('inventory', { ...item, quantity: Math.max(0, item.quantity + d) }); reload() }
  const del = async (id) => { await api.remove('inventory', id); reload() }
  const current = items.filter(i => i.section === tab)
  const needsOrder = items.filter(i => i.minStock > 0 && i.quantity < i.minStock).length
  const sectionBad = (key) => items.filter(i => i.section === key && i.minStock > 0 && i.quantity < i.minStock).length > 0
  // Kunstwerken berekening (alleen voor panelen)
  const panelenItems = items.filter(i => i.section === 'panelen')
  const minPaneel = panelenItems.length > 0 ? Math.min(...panelenItems.map(i => i.quantity)) : 0
  const maxArtworks = Math.floor(minPaneel / PANELS_PER_ARTWORK)
  const avgStock = panelenItems.length > 0 ? Math.round(panelenItems.reduce((s,i) => s + i.quantity, 0) / panelenItems.length) : 0
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
          const active = tab === s.key, bad = sectionBad(s.key)
          return (
            <button key={s.key} onClick={() => setTab(s.key)} style={{
              padding:'0.45rem 1rem',borderRadius:'99px',border:'none',cursor:'pointer',
              fontSize:'0.82rem',fontWeight:active?600:500,fontFamily:'var(--font-body)',
              background:active?'#1C1917':'#F2F0EB',color:active?'#fff':'#1C1917',
              position:'relative',transition:'all 0.15s',
            }}>
              {s.label}
              {bad&&<span style={{position:'absolute',top:'-2px',right:'-2px',width:'8px',height:'8px',borderRadius:'50%',background:'#DC2626',border:'2px solid #FAFAF7'}}/>}
            </button>
          )
        })}
      </div>
      {tab === 'panelen' && panelenItems.length > 0 && (
        <div style={{display:'flex',gap:'1rem',marginBottom:'1.5rem',flexWrap:'wrap'}}>
          <div style={{background:'#F2F0EB',borderRadius:'10px',padding:'0.75rem 1.25rem',flex:1,minWidth:'140px'}}>
            <div style={{fontSize:'0.7rem',fontWeight:600,color:'#78716C',textTransform:'uppercase',letterSpacing:'0.05em'}}>Gem. voorraad</div>
            <div style={{fontSize:'1.5rem',fontFamily:'var(--font-display)'}}>{avgStock} <span style={{fontSize:'0.8rem',color:'#78716C'}}>per kleur</span></div>
          </div>
          <div style={{background:maxArtworks<3?'#FEE2E2':'#D1FAE5',borderRadius:'10px',padding:'0.75rem 1.25rem',flex:1,minWidth:'140px'}}>
            <div style={{fontSize:'0.7rem',fontWeight:600,color:maxArtworks<3?'#991B1B':'#065F46',textTransform:'uppercase',letterSpacing:'0.05em'}}>Kunstwerken mogelijk</div>
            <div style={{fontSize:'1.5rem',fontFamily:'var(--font-display)',color:maxArtworks<3?'#DC2626':'#059669'}}>{maxArtworks} <span style={{fontSize:'0.8rem',color:'#78716C'}}>({PANELS_PER_ARTWORK} panelen/stuk)</span></div>
          </div>
        </div>
      )}
      <div className="card" style={{padding:0}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'1rem 1.25rem',borderBottom:'1px solid rgba(28,25,23,0.08)'}}>
          <h3 style={{margin:0,fontSize:'1.1rem'}}>{SECTIONS.find(s=>s.key===tab)?.label}</h3>
          <button className="btn btn-sm btn-primary" onClick={()=>setShowAdd(true)}>+ Toevoegen</button>
        </div>
        {current.length === 0 ? (
          <div style={{padding:'2rem',textAlign:'center',color:'#78716C',fontSize:'0.85rem'}}>Nog geen items</div>
        ) : (
          <div>{current.map((item, idx) => {
            const pct = item.minStock > 0 ? Math.min(100, (item.quantity / item.minStock) * 100) : 100
            const isLow = item.minStock > 0 && item.quantity < item.minStock
            const isEmpty = item.quantity === 0 && item.minStock > 0
            const barColor = isEmpty ? '#DC2626' : isLow ? '#D97706' : '#059669'
            const artworksFromThis = Math.floor(item.quantity / PANELS_PER_ARTWORK)
            return (
              <div key={item.id} style={{padding:'0.75rem 1.25rem',borderBottom:idx<current.length-1?'1px solid rgba(28,25,23,0.08)':'none'}}>
                <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'0.5rem'}}>
                  {/* Editable name */}
                  {editing === item.id + '-name' ? (
                    <input autoFocus style={{fontWeight:500,fontSize:'0.9rem',border:'1px solid #D97706',borderRadius:'4px',padding:'2px 6px',flex:1,fontFamily:'var(--font-body)'}}
                      defaultValue={item.name} onBlur={e => { updateField(item,'name',e.target.value); setEditing(null) }}
                      onKeyDown={e => { if(e.key==='Enter'){updateField(item,'name',e.target.value);setEditing(null)} }}/>
                  ) : (
                    <div style={{flex:1,fontWeight:500,fontSize:'0.9rem',cursor:'pointer'}} onClick={() => setEditing(item.id+'-name')}>{item.name}</div>
                  )}
                  {/* Status */}
                  <span style={{padding:'0.15rem 0.55rem',borderRadius:'99px',fontSize:'0.7rem',fontWeight:600,whiteSpace:'nowrap',
                    background:isEmpty?'#FEE2E2':isLow?'#FEF3C7':'#D1FAE5',
                    color:isEmpty?'#991B1B':isLow?'#92400E':'#065F46',
                  }}>{isEmpty?'Op!':isLow?'Bestellen':'Op voorraad'}</span>
                  {/* Quantity */}
                  <div style={{display:'flex',alignItems:'center',gap:'0.35rem'}}>
                    <button onClick={()=>updateQty(item,-1)} style={{width:'26px',height:'26px',borderRadius:'50%',border:'1px solid rgba(28,25,23,0.15)',background:'none',cursor:'pointer',fontSize:'0.9rem',display:'flex',alignItems:'center',justifyContent:'center',color:'#78716C'}}>-</button>
                    {editing === item.id + '-qty' ? (
                      <input autoFocus type="number" style={{width:'45px',textAlign:'center',fontWeight:600,fontSize:'0.9rem',border:'1px solid #D97706',borderRadius:'4px',padding:'2px',fontFamily:'var(--font-body)'}}
                        defaultValue={item.quantity} onBlur={e => { updateField(item,'quantity',parseInt(e.target.value)||0); setEditing(null) }}
                        onKeyDown={e => { if(e.key==='Enter'){updateField(item,'quantity',parseInt(e.target.value)||0);setEditing(null)} }}/>
                    ) : (
                      <span style={{fontWeight:600,minWidth:'30px',textAlign:'center',fontSize:'0.95rem',cursor:'pointer'}} onClick={() => setEditing(item.id+'-qty')}>{item.quantity}</span>
                    )}
                    <button onClick={()=>updateQty(item,1)} style={{width:'26px',height:'26px',borderRadius:'50%',border:'1px solid rgba(28,25,23,0.15)',background:'none',cursor:'pointer',fontSize:'0.9rem',display:'flex',alignItems:'center',justifyContent:'center',color:'#78716C'}}>+</button>
                  </div>
                  <button onClick={()=>del(item.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#78716C',fontSize:'0.7rem',opacity:0.3}}>&#10005;</button>
                </div>
                {/* Order bar */}
                {item.minStock > 0 && (
                  <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
                    <div style={{flex:1,height:'8px',borderRadius:'4px',background:'#F2F0EB',overflow:'hidden',position:'relative'}}>
                      {/* Min stock marker */}
                      <div style={{position:'absolute',left:'50%',top:0,bottom:0,width:'2px',background:'rgba(28,25,23,0.2)',zIndex:1}}/>
                      <div style={{height:'100%',borderRadius:'4px',width:`${pct}%`,background:barColor,transition:'width 0.3s'}}/>
                    </div>
                    <div style={{fontSize:'0.7rem',color:'#78716C',minWidth:'70px',textAlign:'right'}}>{item.quantity}/{item.minStock} min</div>
                    {tab === 'panelen' && (
                      <div style={{fontSize:'0.7rem',color:'#78716C',minWidth:'80px',textAlign:'right'}}>~{artworksFromThis} kunstwerk{artworksFromThis!==1?'en':''}</div>
                    )}
                  </div>
                )}
                {/* Order warning */}
                {isLow && (
                  <div style={{marginTop:'0.35rem',fontSize:'0.75rem',color:'#DC2626',fontWeight:500,display:'flex',alignItems:'center',gap:'0.35rem'}}>
                    <span>&#9888;</span> Bestellen — levertijd {item.leadTimeDays || '?'} dagen
                  </div>
                )}
              </div>
            )
          })}</div>
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
