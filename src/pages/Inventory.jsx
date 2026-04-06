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
const SHIPMENT_STATUSES = [
  { key: 'besteld', label: 'Besteld', color: '#2563EB' },
  { key: 'verzonden', label: 'Verzonden', color: '#D97706' },
  { key: 'onderweg', label: 'Onderweg', color: '#7C3AED' },
  { key: 'geleverd', label: 'Geleverd', color: '#059669' },
  { key: 'vertraagd', label: 'Vertraagd', color: '#DC2626' },
]
const PER_ARTWORK = 2
export default function Inventory() {
  const [items, setItems] = useState([])
  const [tab, setTab] = useState('panelen')
  const [showAdd, setShowAdd] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [editing, setEditing] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const [showBatch, setShowBatch] = useState(null)
  const [batchForm, setBatchForm] = useState({ qty: 0, date: '', note: '' })
  const [form, setForm] = useState({name:'',quantity:0,minStock:10,leadTimeDays:90,supplier:'',notes:''})
  const [shipments, setShipments] = useState([])
  const [showAddShipment, setShowAddShipment] = useState(false)
  const [expandedShipment, setExpandedShipment] = useState(null)
  const [editShipment, setEditShipment] = useState(null)
  const [confirmDelShipment, setConfirmDelShipment] = useState(null)
  const emptyShipment = {description:'',supplier:'Alibaba',orderedDate:new Date().toISOString().slice(0,10),shippedDate:'',expectedDate:'',status:'besteld',quantity:0,unit:'stuks',amount:0,trackingUrl:'',supplierUrl:'',notes:''}
  const [shipForm, setShipForm] = useState(emptyShipment)
  useEffect(() => { api.getAll('inventory').then(setItems) }, [])
  const reload = () => api.getAll('inventory').then(setItems)
  const reloadShipments = () => api.getAll('shipments').then(setShipments)
  useEffect(() => { reloadShipments() }, [])
  const saveShipment = async () => {
    if (!shipForm.description.trim()) return
    await api.save('shipments', { ...shipForm, ...(editShipment?{id:editShipment}:{}), id: editShipment||`ship-${Date.now()}`, createdAt: new Date().toISOString() })
    setShipForm(emptyShipment); setShowAddShipment(false); setEditShipment(null); reloadShipments()
  }
  const delShipment = async (id) => { await api.remove('shipments', id); setConfirmDelShipment(null); reloadShipments() }
  const startEditShipment = (s) => { setShipForm({...emptyShipment,...s}); setEditShipment(s.id); setShowAddShipment(true) }
  const handleSave = async () => {
    if (!form.name.trim()) return
    await api.save('inventory', { ...form, section: tab, batches: [{ qty: form.quantity, date: new Date().toISOString().slice(0,10), note: 'Startvoorraad' }], startStock: form.quantity })
    setForm({name:'',quantity:0,minStock:10,leadTimeDays:90,supplier:'',notes:''})
    setShowAdd(false); reload()
  }
  const updateField = async (item, field, value) => { await api.save('inventory', { ...item, [field]: value }); reload() }
  const updateQty = async (item, d) => { await api.save('inventory', { ...item, quantity: Math.max(0, item.quantity + d) }); reload() }
  const addBatch = async (item) => {
    const batches = [...(item.batches || []), { qty: batchForm.qty, date: batchForm.date || new Date().toISOString().slice(0,10), note: batchForm.note || 'Nieuwe bestelling' }]
    const newQty = item.quantity + batchForm.qty
    const newStart = (item.startStock || 0) + batchForm.qty
    await api.save('inventory', { ...item, quantity: newQty, startStock: newStart, batches })
    setBatchForm({ qty: 0, date: '', note: '' }); setShowBatch(null); reload()
  }
  const del = async (id) => { await api.remove('inventory', id); setConfirmDel(null); reload() }
  const current = items.filter(i => i.section === tab).sort((a, b) => a.quantity - b.quantity).sort((a, b) => a.quantity - b.quantity)
  const needsOrder = items.filter(i => i.minStock > 0 && i.quantity < i.minStock).length
  const sectionBad = (key) => items.filter(i => i.section === key && i.minStock > 0 && i.quantity < i.minStock).length > 0
  const sectionStats = (key) => {
    const si = items.filter(i => i.section === key)
    return { count: si.length, total: si.reduce((s,i) => s + i.quantity, 0), bad: si.filter(i => i.minStock > 0 && i.quantity < i.minStock).length }
  }
  const panelen = items.filter(i => i.section === 'panelen')
  const avgStock = panelen.length > 0 ? Math.round(panelen.reduce((s,i) => s + i.quantity, 0) / panelen.length) : 0
  const minP = panelen.length > 0 ? Math.min(...panelen.map(i => i.quantity)) : 0
  const maxArt = Math.floor(minP / PER_ARTWORK)
  return (
    <>
      <div className="page-header">
        <div>
          <h1>Voorraad</h1>
          <p className="page-subtitle">{items.length} items
            {needsOrder > 0 ? <span style={{color:'#DC2626'}}> &middot; {needsOrder} bestellen</span>
            : <span style={{color:'#059669'}}> &middot; alles op voorraad</span>}
          </p>
        </div>
      </div>
      <div style={{display:'flex',gap:'0.4rem',marginBottom:'1.5rem',flexWrap:'wrap'}}>
        {SECTIONS.map(s => {
          const active = tab === s.key, st = sectionStats(s.key)
          return (
            <button key={s.key} onClick={() => setTab(s.key)} style={{
              padding:'0.5rem 1rem',borderRadius:'12px',border:'none',cursor:'pointer',
              fontFamily:'var(--font-body)',transition:'all 0.15s',textAlign:'left',
              background:active?'#1C1917':'#F2F0EB',color:active?'#fff':'#1C1917',
              position:'relative',minWidth:'120px',
            }}>
              <div style={{fontSize:'0.82rem',fontWeight:active?600:500}}>{s.label}</div>
              {st.count > 0 && <div style={{fontSize:'0.7rem',marginTop:'2px',color:active?'rgba(255,255,255,0.7)':'#78716C'}}>
                {st.total} stuks{st.bad > 0 && <span style={{color:active?'#fca5a5':'#DC2626',fontWeight:600}}> &middot; {st.bad} bestellen</span>}
              </div>}
              {st.bad > 0 && <span style={{position:'absolute',top:'-2px',right:'-2px',width:'8px',height:'8px',borderRadius:'50%',background:'#DC2626',border:'2px solid #FAFAF7'}}/>}
            </button>
          )
        })}
      </div>
      {tab === 'panelen' && panelen.length > 0 && (
        <div style={{display:'flex',gap:'1rem',marginBottom:'1.5rem',flexWrap:'wrap'}}>
          <div style={{background:'#F2F0EB',borderRadius:'10px',padding:'0.75rem 1.25rem',flex:1,minWidth:'140px'}}>
            <div style={{fontSize:'0.7rem',fontWeight:600,color:'#78716C',textTransform:'uppercase',letterSpacing:'0.05em'}}>Gem. voorraad</div>
            <div style={{fontSize:'1.5rem',fontFamily:'var(--font-display)'}}>{avgStock} <span style={{fontSize:'0.8rem',color:'#78716C'}}>per kleur</span></div>
          </div>
          <div style={{background:maxArt<3?'#FEE2E2':'#D1FAE5',borderRadius:'10px',padding:'0.75rem 1.25rem',flex:1,minWidth:'140px'}}>
            <div style={{fontSize:'0.7rem',fontWeight:600,color:maxArt<3?'#991B1B':'#065F46',textTransform:'uppercase',letterSpacing:'0.05em'}}>Kunstwerken mogelijk</div>
            <div style={{fontSize:'1.5rem',fontFamily:'var(--font-display)',color:maxArt<3?'#DC2626':'#059669'}}>{maxArt} <span style={{fontSize:'0.8rem',color:'#78716C'}}>({PER_ARTWORK} panelen/stuk)</span></div>
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
            const stockPct = item.startStock > 0 ? Math.round((item.quantity / item.startStock) * 100) : 100
            const dotColor = isEmpty ? '#DC2626' : isLow ? '#D97706' : stockPct < 50 ? '#F59E0B' : '#059669'
            const used = (item.startStock || item.quantity) - item.quantity
            const isExpanded = expanded === item.id
            return (
              <div key={item.id} style={{borderBottom:idx<current.length-1?'1px solid rgba(28,25,23,0.08)':'none',borderLeft:isEmpty?'4px solid var(--danger)':isLow?'4px solid var(--accent)':'4px solid transparent',background:isEmpty?'#FEE2E210':isLow?'#FEF3C710':'transparent'}}>
                <div style={{padding:'0.75rem 1.25rem'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'0.5rem'}}>
                    {editing === item.id+'-name' ? (
                      <input autoFocus style={{fontWeight:500,fontSize:'0.9rem',border:'1px solid #D97706',borderRadius:'4px',padding:'2px 6px',flex:1,fontFamily:'var(--font-body)'}}
                        defaultValue={item.name} onBlur={e=>{updateField(item,'name',e.target.value);setEditing(null)}}
                        onKeyDown={e=>{if(e.key==='Enter'){updateField(item,'name',e.target.value);setEditing(null)}}}/>
                    ) : (
                      <div style={{flex:1,fontWeight:500,fontSize:'0.9rem',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.4rem'}} onClick={()=>setEditing(item.id+'-name')}>
                      <span style={{width:'10px',height:'10px',borderRadius:'50%',background:dotColor,flexShrink:0,boxShadow:`0 0 0 2px ${dotColor}33`}}/>
                      <span style={{borderBottom:'1px dashed rgba(28,25,23,0.25)'}}>{item.name}</span>
                      <span style={{fontSize:'0.7rem',color:'#A8A29E'}}>&#9998;</span>
                    </div>
                    )}
                    <span style={{padding:'0.15rem 0.55rem',borderRadius:'99px',fontSize:'0.7rem',fontWeight:600,whiteSpace:'nowrap',
                      background:isEmpty?'#FEE2E2':isLow?'#FEF3C7':'#D1FAE5',
                      color:isEmpty?'#991B1B':isLow?'#92400E':'#065F46',
                    }}>{isEmpty?'Op!':isLow?'Bestellen':'Op voorraad'}</span>
                    <div style={{display:'flex',alignItems:'center',gap:'0.35rem'}}>
                      <button onClick={()=>updateQty(item,-1)} style={{width:'26px',height:'26px',borderRadius:'50%',border:'1px solid rgba(28,25,23,0.15)',background:'none',cursor:'pointer',fontSize:'0.9rem',display:'flex',alignItems:'center',justifyContent:'center',color:'#78716C'}}>-</button>
                      {editing === item.id+'-qty' ? (
                        <input autoFocus type="number" style={{width:'45px',textAlign:'center',fontWeight:600,fontSize:'0.9rem',border:'1px solid #D97706',borderRadius:'4px',padding:'2px',fontFamily:'var(--font-body)'}}
                          defaultValue={item.quantity} onBlur={e=>{updateField(item,'quantity',parseInt(e.target.value)||0);setEditing(null)}}
                          onKeyDown={e=>{if(e.key==='Enter'){updateField(item,'quantity',parseInt(e.target.value)||0);setEditing(null)}}}/>
                      ) : (
                        <span style={{fontWeight:600,minWidth:'30px',textAlign:'center',fontSize:'0.95rem',cursor:'pointer',borderBottom:'1px dashed rgba(28,25,23,0.25)'}} onClick={()=>setEditing(item.id+'-qty')}>{item.quantity}</span>
                      )}
                      <button onClick={()=>updateQty(item,1)} style={{width:'26px',height:'26px',borderRadius:'50%',border:'1px solid rgba(28,25,23,0.15)',background:'none',cursor:'pointer',fontSize:'0.9rem',display:'flex',alignItems:'center',justifyContent:'center',color:'#78716C'}}>+</button>
                    </div>
                    <button onClick={()=>setExpanded(isExpanded?null:item.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#78716C',fontSize:'0.75rem',padding:'4px'}}>{isExpanded?'\u25B2':'\u25BC'}</button>
                    <button onClick={()=>setConfirmDel(item.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#78716C',fontSize:'0.7rem',opacity:0.3}}>&times;</button>
                  </div>
                  {/* Clean stats row */}
                  <div style={{display:'flex',gap:'1.5rem',fontSize:'0.8rem',color:'var(--text-secondary)',flexWrap:'wrap'}}>
                    <div><span style={{color:'var(--text-secondary)'}}>Op voorraad:</span> <strong style={{color:isEmpty?'var(--danger)':isLow?'var(--accent)':'var(--text-primary)'}}>{item.quantity}</strong></div>
                    <div><span style={{color:'var(--text-secondary)'}}>Gebruikt:</span> <strong>{used}</strong></div>
                    <div><span style={{color:'var(--text-secondary)'}}>Levertijd:</span> <strong>{item.leadTimeDays >= 30 ? Math.round(item.leadTimeDays / 30) + ' maanden' : (item.leadTimeDays || 0) + ' dagen'}</strong></div>
                    {item.supplier && <div><span style={{color:'var(--text-secondary)'}}>Leverancier:</span> <strong>{item.supplier}</strong></div>}
                  </div>
                  {isLow && <div style={{marginTop:'0.35rem',fontSize:'0.75rem',color:'#DC2626',fontWeight:500}}>▲ Bestellen — levertijd {item.leadTimeDays >= 30 ? Math.round(item.leadTimeDays / 30) + ' maanden' : (item.leadTimeDays || 0) + ' dagen'}</div>}
                </div>
                {/* Expanded detail panel */}
                {isExpanded && (
                  <div style={{padding:'0 1.25rem 1rem',background:'#FAFAF7',borderTop:'1px solid rgba(28,25,23,0.05)'}}>
                    {item.notes && <div style={{fontSize:'0.8rem',color:'var(--text-secondary)',padding:'0.5rem 0',fontStyle:'italic'}}>{item.notes}</div>}
                    {/* Bestelhistorie */}
                    <div style={{marginTop:'0.5rem'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.5rem'}}>
                        <div style={{fontSize:'0.75rem',fontWeight:600,color:'#78716C',textTransform:'uppercase',letterSpacing:'0.05em'}}>Bestelhistorie</div>
                        <button className="btn btn-sm btn-outline" onClick={()=>setShowBatch(showBatch===item.id?null:item.id)}>+ Bestelling toevoegen</button>
                      </div>
                      {(item.batches && item.batches.length > 0) ? (
                        <div style={{display:'flex',flexDirection:'column',gap:'0.25rem'}}>
                          {item.batches.map((b, bi) => (
                            <div key={bi} style={{display:'flex',gap:'1rem',fontSize:'0.8rem',padding:'0.35rem 0.5rem',background:'#fff',borderRadius:'6px',border:'1px solid rgba(28,25,23,0.06)'}}>
                              <span style={{color:'#78716C',minWidth:'80px'}}>{b.date}</span>
                              <span style={{fontWeight:600}}>+{b.qty} stuks</span>
                              <span style={{color:'#78716C'}}>{b.note}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{fontSize:'0.8rem',color:'#78716C',fontStyle:'italic'}}>Nog geen bestellingen geregistreerd</div>
                      )}
                      {showBatch === item.id && (
                        <div style={{marginTop:'0.75rem',padding:'0.75rem',background:'#fff',borderRadius:'8px',border:'1px solid rgba(28,25,23,0.1)'}}>
                          <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap',alignItems:'flex-end'}}>
                            <div><label style={{fontSize:'0.7rem',fontWeight:600,color:'#78716C',display:'block',marginBottom:'2px'}}>Aantal</label>
                              <input type="number" style={{width:'70px',padding:'4px 6px',border:'1px solid rgba(28,25,23,0.15)',borderRadius:'4px',fontSize:'0.85rem',fontFamily:'var(--font-body)'}} value={batchForm.qty} onChange={e=>setBatchForm({...batchForm,qty:parseInt(e.target.value)||0})}/></div>
                            <div><label style={{fontSize:'0.7rem',fontWeight:600,color:'#78716C',display:'block',marginBottom:'2px'}}>Datum</label>
                              <input type="date" style={{padding:'4px 6px',border:'1px solid rgba(28,25,23,0.15)',borderRadius:'4px',fontSize:'0.85rem',fontFamily:'var(--font-body)'}} value={batchForm.date} onChange={e=>setBatchForm({...batchForm,date:e.target.value})}/></div>
                            <div style={{flex:1}}><label style={{fontSize:'0.7rem',fontWeight:600,color:'#78716C',display:'block',marginBottom:'2px'}}>Notitie</label>
                              <input style={{width:'100%',padding:'4px 6px',border:'1px solid rgba(28,25,23,0.15)',borderRadius:'4px',fontSize:'0.85rem',fontFamily:'var(--font-body)'}} value={batchForm.note} onChange={e=>setBatchForm({...batchForm,note:e.target.value})} placeholder="bijv. Alibaba order #123"/></div>
                            <button className="btn btn-sm btn-primary" onClick={()=>addBatch(item)}>Toevoegen</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}</div>
        )}
      </div>
      {/* Delete confirmation */}
      {confirmDel && (
        <div className="modal-overlay" onClick={()=>setConfirmDel(null)}>
          <div className="modal" style={{maxWidth:'380px',textAlign:'center'}} onClick={e=>e.stopPropagation()}>
            <h3 style={{marginBottom:'0.75rem'}}>Weet je het zeker?</h3>
            <p style={{fontSize:'0.85rem',color:'#78716C',marginBottom:'1.25rem'}}>Dit item wordt permanent verwijderd inclusief bestelhistorie.</p>
            <div style={{display:'flex',gap:'0.5rem',justifyContent:'center'}}>
              <button className="btn btn-outline" onClick={()=>setConfirmDel(null)}>Annuleren</button>
              <button className="btn btn-primary" style={{background:'#DC2626'}} onClick={()=>del(confirmDel)}>Verwijderen</button>
            </div>
          </div>
        </div>
      )}
      {/* Add item modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
          <div className="modal">
            <div className="modal-header"><h3>Item toevoegen</h3><button className="modal-close" onClick={()=>setShowAdd(false)}>&times;</button></div>
            <div className="form-group"><label className="form-label">Naam</label>
              <input className="form-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="bijv. Oak" autoFocus/></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
              <div className="form-group"><label className="form-label">Startvoorraad</label>
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

      {/* ZENDINGEN VIEW */}
      {tab === 'zendingen' && (
        <ZendingenView shipments={shipments} onAdd={()=>{setShipForm(emptyShipment);setEditShipment(null);setShowAddShipment(true)}}
          onEdit={startEditShipment} onDelete={id=>setConfirmDelShipment(id)} expanded={expandedShipment} setExpanded={setExpandedShipment}/>
      )}

      {/* ZENDINGEN MODAL */}
      {showAddShipment && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&(setShowAddShipment(false),setEditShipment(null))}>
          <div className="modal" style={{maxWidth:'560px'}}>
            <div className="modal-header"><h3>{editShipment?'Zending bewerken':'Nieuwe zending'}</h3><button className="modal-close" onClick={()=>{setShowAddShipment(false);setEditShipment(null)}}>✕</button></div>
            <div className="form-group"><label className="form-label">Omschrijving</label>
              <input className="form-input" value={shipForm.description} onChange={e=>setShipForm({...shipForm,description:e.target.value})} placeholder="bijv. Houten lijsten 60x60cm (50 stuks)" autoFocus/></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
              <div className="form-group"><label className="form-label">Leverancier</label>
                <input className="form-input" value={shipForm.supplier} onChange={e=>setShipForm({...shipForm,supplier:e.target.value})} placeholder="Alibaba, Bol.com..."/></div>
              <div className="form-group"><label className="form-label">Status</label>
                <select className="form-select" value={shipForm.status} onChange={e=>setShipForm({...shipForm,status:e.target.value})}>
                  {SHIPMENT_STATUSES.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}</select></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.75rem'}}>
              <div className="form-group"><label className="form-label">Besteld op</label>
                <input className="form-input" type="date" value={shipForm.orderedDate} onChange={e=>setShipForm({...shipForm,orderedDate:e.target.value})}/></div>
              <div className="form-group"><label className="form-label">Verzonden op</label>
                <input className="form-input" type="date" value={shipForm.shippedDate} onChange={e=>setShipForm({...shipForm,shippedDate:e.target.value})}/></div>
              <div className="form-group"><label className="form-label">Verwachte levering</label>
                <input className="form-input" type="date" value={shipForm.expectedDate} onChange={e=>setShipForm({...shipForm,expectedDate:e.target.value})}/></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.75rem'}}>
              <div className="form-group"><label className="form-label">Aantal</label>
                <input className="form-input" type="number" value={shipForm.quantity} onChange={e=>setShipForm({...shipForm,quantity:parseInt(e.target.value)||0})}/></div>
              <div className="form-group"><label className="form-label">Eenheid</label>
                <input className="form-input" value={shipForm.unit} onChange={e=>setShipForm({...shipForm,unit:e.target.value})} placeholder="stuks, meter..."/></div>
              <div className="form-group"><label className="form-label">Bedrag (€)</label>
                <input className="form-input" type="number" value={shipForm.amount} onChange={e=>setShipForm({...shipForm,amount:parseFloat(e.target.value)||0})}/></div>
            </div>
            <div className="form-group"><label className="form-label">🔗 Link leveranciersgesprek (Alibaba etc.)</label>
              <input className="form-input" value={shipForm.supplierUrl} onChange={e=>setShipForm({...shipForm,supplierUrl:e.target.value})} placeholder="https://alibaba.com/trade/..."/></div>
            <div className="form-group"><label className="form-label">🚚 Tracking link</label>
              <input className="form-input" value={shipForm.trackingUrl} onChange={e=>setShipForm({...shipForm,trackingUrl:e.target.value})} placeholder="https://track.alibaba.com/..."/></div>
            <div className="form-group"><label className="form-label">Notities</label>
              <textarea className="form-textarea" value={shipForm.notes} onChange={e=>setShipForm({...shipForm,notes:e.target.value})} placeholder="Details, afspraken..." rows={2}/></div>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <div>{editShipment&&<button className="btn btn-sm" style={{color:'var(--danger)',background:'none',border:'none'}} onClick={()=>{setConfirmDelShipment(editShipment);setShowAddShipment(false)}}>Verwijderen</button>}</div>
              <div style={{display:'flex',gap:'0.5rem'}}>
                <button className="btn btn-outline" onClick={()=>{setShowAddShipment(false);setEditShipment(null)}}>Annuleren</button>
                <button className="btn btn-primary" onClick={saveShipment}>{editShipment?'Bijwerken':'Opslaan'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verwijder zending bevestiging */}
      {confirmDelShipment&&(
        <div className="modal-overlay" onClick={()=>setConfirmDelShipment(null)}>
          <div className="modal" style={{maxWidth:'380px',textAlign:'center'}} onClick={e=>e.stopPropagation()}>
            <h3 style={{marginBottom:'0.75rem'}}>Zending verwijderen?</h3>
            <div style={{display:'flex',gap:'0.5rem',justifyContent:'center'}}>
              <button className="btn btn-outline" onClick={()=>setConfirmDelShipment(null)}>Annuleren</button>
              <button className="btn btn-primary" style={{background:'var(--danger)'}} onClick={()=>delShipment(confirmDelShipment)}>Verwijderen</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── ZENDINGEN VIEW ─────────────────────────────────────────────────────────
function ZendingenView({ shipments, onAdd, onEdit, onDelete, expanded, setExpanded }) {
  const active = shipments.filter(s => s.status !== 'geleverd').sort((a,b) => (a.expectedDate||'').localeCompare(b.expectedDate||''))
  const delivered = shipments.filter(s => s.status === 'geleverd').sort((a,b) => (b.expectedDate||'').localeCompare(a.expectedDate||''))
  const statusInfo = { besteld:{label:'Besteld',color:'#2563EB',bg:'#EFF6FF'}, verzonden:{label:'Verzonden',color:'#D97706',bg:'#FFF7ED'}, onderweg:{label:'Onderweg',color:'#7C3AED',bg:'#F5F3FF'}, geleverd:{label:'Geleverd',color:'#059669',bg:'#F0FDF4'}, vertraagd:{label:'Vertraagd',color:'#DC2626',bg:'#FEF2F2'} }
  const fmt = d => d ? new Date(d).toLocaleDateString('nl-NL',{day:'numeric',month:'short',year:'numeric'}) : '—'
  const daysUntil = d => d ? Math.ceil((new Date(d)-new Date())/(1000*60*60*24)) : null
  const fmtEur = n => n ? new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n) : '—'

  const ShipCard = ({s}) => {
    const si = statusInfo[s.status] || statusInfo.besteld
    const days = daysUntil(s.expectedDate)
    const isOpen = expanded === s.id
    return (
      <div style={{border:'1px solid var(--border)',borderRadius:'12px',overflow:'hidden',marginBottom:'0.75rem',background:'var(--bg-card)'}}>
        {/* Header */}
        <div onClick={()=>setExpanded(isOpen?null:s.id)} style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.75rem 1rem',cursor:'pointer',background:isOpen?'var(--bg-secondary)':'transparent'}}>
          <div style={{padding:'0.2rem 0.6rem',borderRadius:'99px',background:si.bg,color:si.color,fontSize:'0.7rem',fontWeight:700,flexShrink:0}}>{si.label}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:600,fontSize:'0.85rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.description}</div>
            <div style={{fontSize:'0.7rem',color:'var(--text-secondary)',marginTop:'0.1rem'}}>{s.supplier}{s.quantity>0?` · ${s.quantity} ${s.unit||'stuks'}`:''}{s.amount>0?` · ${fmtEur(s.amount)}`:''}</div>
          </div>
          {s.expectedDate && (
            <div style={{textAlign:'right',flexShrink:0}}>
              <div style={{fontSize:'0.72rem',fontWeight:600,color:days!==null&&days<0?'#DC2626':days!==null&&days<=3?'#D97706':'var(--text-secondary)'}}>
                {days===null?'':days<0?`${Math.abs(days)}d vertraagd`:days===0?'Vandaag':days<=7?`over ${days}d`:`${fmt(s.expectedDate)}`}
              </div>
              <div style={{fontSize:'0.65rem',color:'var(--text-secondary)'}}>{days!==null&&Math.abs(days)<=7?fmt(s.expectedDate):''}</div>
            </div>
          )}
          <span style={{color:'var(--text-secondary)',fontSize:'0.75rem'}}>{isOpen?'▲':'▼'}</span>
        </div>
        {/* Detail */}
        {isOpen && (
          <div style={{padding:'0.75rem 1rem',borderTop:'1px solid var(--border)',background:'var(--bg-secondary)'}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.75rem',marginBottom:'0.75rem'}}>
              {[['Besteld',fmt(s.orderedDate)],['Verzonden',fmt(s.shippedDate)],['Verwacht',fmt(s.expectedDate)]].map(([l,v])=>(
                <div key={l}>
                  <div style={{fontSize:'0.62rem',fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'0.15rem'}}>{l}</div>
                  <div style={{fontSize:'0.82rem',fontWeight:500}}>{v}</div>
                </div>
              ))}
            </div>
            {s.notes&&<p style={{fontSize:'0.78rem',color:'var(--text-secondary)',margin:'0 0 0.75rem'}}>{s.notes}</p>}
            <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
              {s.supplierUrl&&<a href={s.supplierUrl} target="_blank" rel="noreferrer" style={{fontSize:'0.75rem',color:'#2563EB',textDecoration:'none',padding:'0.25rem 0.6rem',borderRadius:'6px',background:'#EFF6FF',fontWeight:500}} onClick={e=>e.stopPropagation()}>🔗 Leveranciersgesprek</a>}
              {s.trackingUrl&&<a href={s.trackingUrl} target="_blank" rel="noreferrer" style={{fontSize:'0.75rem',color:'#7C3AED',textDecoration:'none',padding:'0.25rem 0.6rem',borderRadius:'6px',background:'#F5F3FF',fontWeight:500}} onClick={e=>e.stopPropagation()}>🚚 Track & Trace</a>}
              <button onClick={e=>{e.stopPropagation();onEdit(s)}} style={{fontSize:'0.75rem',padding:'0.25rem 0.6rem',borderRadius:'6px',background:'var(--bg-card)',border:'1px solid var(--border)',cursor:'pointer',fontFamily:'var(--font-body)'}}>✎ Bewerken</button>
              <button onClick={e=>{e.stopPropagation();onDelete(s.id)}} style={{fontSize:'0.75rem',padding:'0.25rem 0.6rem',borderRadius:'6px',background:'#FEF2F2',color:'#DC2626',border:'1px solid #FCA5A5',cursor:'pointer',fontFamily:'var(--font-body)'}}>Verwijderen</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.25rem'}}>
        <div>
          <h3 style={{margin:0,fontSize:'1rem',fontWeight:600}}>Actieve zendingen</h3>
          <p style={{margin:'0.1rem 0 0',fontSize:'0.75rem',color:'var(--text-secondary)'}}>{active.length} onderweg · {delivered.length} geleverd</p>
        </div>
        <button className="btn btn-primary" onClick={onAdd}>+ Nieuwe zending</button>
      </div>

      {active.length===0?(
        <div className="card" style={{textAlign:'center',padding:'2rem',color:'var(--text-secondary)'}}>
          <div style={{fontSize:'2rem',marginBottom:'0.5rem'}}>📦</div>
          <div style={{fontSize:'0.85rem',marginBottom:'1rem'}}>Geen actieve zendingen</div>
          <button className="btn btn-outline" onClick={onAdd}>+ Eerste zending toevoegen</button>
        </div>
      ):active.map(s=><ShipCard key={s.id} s={s}/>)}

      {delivered.length>0&&(
        <>
          <div style={{fontSize:'0.65rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-secondary)',margin:'1.5rem 0 0.75rem'}}>Geleverd ({delivered.length})</div>
          {delivered.map(s=><ShipCard key={s.id} s={s}/>)}
        </>
      )}
    </>
  )
}
