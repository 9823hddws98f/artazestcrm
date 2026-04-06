import React, { useState, useEffect } from 'react'
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
// ─── PANELEN RANKING VIEW ────────────────────────────────────────────────────
function PanelenRankingView({ items, usageLogs, onUpdateQty, onUpdateField, onRegisterUsage, onDelete, onDeleteUsage, currentUser }) {
  const [selectedItem, setSelectedItem] = useState(null) // detail modal
  const [usageForm, setUsageForm] = useState({ quantity: 1, reason: 'productie', notes: '' })
  const [showUsageForm, setShowUsageForm] = useState(null)

  const today = new Date()
  const toISO = d => d.toISOString().slice(0,10)
  const weekAgo = new Date(today); weekAgo.setDate(today.getDate()-7)

  const panelUsage = usageLogs.filter(l => items.find(i => i.id === l.itemId))

  // Bereken stats per kleur
  const ranked = items.map(item => {
    const logs = panelUsage.filter(l => l.itemId === item.id).sort((a,b)=>a.date>b.date?1:-1)
    const total = logs.reduce((s,l)=>s+l.quantity,0)
    const thisWeek = logs.filter(l=>l.date>=toISO(weekAgo)).reduce((s,l)=>s+l.quantity,0)
    const daysWithData = logs.length > 0 ? Math.max(1, Math.ceil((today - new Date(logs[0].date)) / (1000*60*60*24))) : 0
    const avgPerDay = daysWithData > 0 ? total / daysWithData : 0
    const daysLeft = avgPerDay > 0 ? Math.floor(item.quantity / avgPerDay) : null

    // Laatste 7 dagen mini grafiek
    const last7 = Array.from({length:7},(_,i)=>{
      const d = new Date(today); d.setDate(today.getDate()-6+i)
      const iso = toISO(d)
      return logs.filter(l=>l.date===iso).reduce((s,l)=>s+l.quantity,0)
    })

    return { ...item, totalUsed: total, thisWeek, avgPerDay, daysLeft, last7, logs }
  }).sort((a,b) => b.totalUsed - a.totalUsed || b.thisWeek - a.thisWeek || b.quantity - a.quantity)

  const maxUsed = Math.max(...ranked.map(r=>r.totalUsed), 1)
  const maxLast7 = Math.max(...ranked.flatMap(r=>r.last7), 1)

  const doRegister = (item) => {
    onRegisterUsage(item, usageForm)
    setUsageForm({ quantity: 1, reason: 'productie', notes: '' })
    setShowUsageForm(null)
  }

  return (
    <>
      {/* RANKING LIJST */}
      <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
        {ranked.map((item, idx) => {
          const isEmpty = item.quantity === 0 && item.minStock > 0
          const isLow = item.minStock > 0 && item.quantity < item.minStock
          const statusColor = isEmpty ? '#DC2626' : isLow ? '#D97706' : '#059669'
          const urgent = item.daysLeft !== null && item.daysLeft < 60
          const maxBar = Math.max(...ranked.map(r=>r.last7), 1)

          return (
            <div key={item.id} style={{borderRadius:'10px',border:`1px solid ${urgent&&item.totalUsed>0?'#FEE2E2':'var(--border)'}`,background:'var(--bg-card)',overflow:'hidden'}}>
              {/* HOOFD RIJ */}
              <div style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.65rem 1rem',cursor:'pointer'}}
                onClick={()=>setSelectedItem(selectedItem?.id===item.id?null:item)}>
                {/* Nummer */}
                <div style={{width:'28px',height:'28px',borderRadius:'50%',background:idx===0?'#D97706':idx===1?'#9CA3AF':idx===2?'#CD7F32':'var(--bg-secondary)',color:idx<3?'#fff':'var(--text-secondary)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.7rem',fontWeight:700,flexShrink:0}}>
                  #{idx+1}
                </div>

                {/* Naam + status dot */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:'0.4rem',marginBottom:'0.1rem'}}>
                    <span style={{width:'8px',height:'8px',borderRadius:'50%',background:statusColor,flexShrink:0}}/>
                    <span style={{fontWeight:600,fontSize:'0.88rem'}}>{item.name}</span>
                    {idx===0&&item.totalUsed>0&&<span style={{fontSize:'0.6rem',padding:'0.05rem 0.3rem',borderRadius:'99px',background:'#FEF3C7',color:'#92400E',fontWeight:700}}>🔥 #1</span>}
                    {urgent&&item.totalUsed>0&&<span style={{fontSize:'0.6rem',padding:'0.05rem 0.3rem',borderRadius:'99px',background:'#FEE2E2',color:'#991B1B',fontWeight:700}}>⚠ {item.daysLeft}d</span>}
                  </div>
                  {/* Usage balk */}
                  <div style={{height:'4px',background:'var(--bg-secondary)',borderRadius:'99px',overflow:'hidden',maxWidth:'160px'}}>
                    <div style={{height:'100%',width:`${Math.round(item.totalUsed/maxUsed*100)}%`,background:statusColor,borderRadius:'99px',transition:'width 0.5s'}}/>
                  </div>
                </div>

                {/* Mini sparkline 7 dagen */}
                <div style={{display:'flex',alignItems:'flex-end',gap:'2px',height:'28px',flexShrink:0}}>
                  {item.last7.map((v,i)=>(
                    <div key={i} style={{width:'8px',borderRadius:'2px 2px 0 0',background:v>0?'var(--accent)':'rgba(28,25,23,0.08)',height:`${Math.max(v>0?20:4,Math.round(v/maxLast7*28))}%`,minHeight:v>0?'4px':'2px',transition:'height 0.3s'}} title={`${v} panelen`}/>
                  ))}
                </div>

                {/* Stats */}
                <div style={{display:'flex',gap:'1rem',flexShrink:0,fontSize:'0.72rem',textAlign:'center'}}>
                  <div><div style={{fontWeight:700,fontSize:'0.9rem',color:'var(--text-primary)'}}>{item.totalUsed}</div><div style={{color:'var(--text-secondary)'}}>gebruikt</div></div>
                  <div><div style={{fontWeight:700,fontSize:'0.9rem',color:'var(--text-primary)'}}>{item.quantity}</div><div style={{color:'var(--text-secondary)'}}>resterend</div></div>
                </div>

                {/* +/- knoppen */}
                <div style={{display:'flex',alignItems:'center',gap:'0.3rem',flexShrink:0}} onClick={e=>e.stopPropagation()}>
                  <button onClick={()=>onUpdateQty(item,-1)} style={{width:'26px',height:'26px',borderRadius:'50%',border:'1px solid var(--border)',background:'none',cursor:'pointer',fontSize:'0.85rem',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-secondary)'}}>-</button>
                  <span style={{fontWeight:700,minWidth:'30px',textAlign:'center',fontSize:'0.9rem'}}>{item.quantity}</span>
                  <button onClick={()=>onUpdateQty(item,1)} style={{width:'26px',height:'26px',borderRadius:'50%',border:'1px solid var(--border)',background:'none',cursor:'pointer',fontSize:'0.85rem',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-secondary)'}}>+</button>
                </div>

                {/* Gebruik registreren */}
                <button onClick={e=>{e.stopPropagation();setShowUsageForm(showUsageForm===item.id?null:item.id)}}
                  style={{padding:'0.25rem 0.6rem',borderRadius:'6px',background:'var(--accent)',color:'#fff',border:'none',cursor:'pointer',fontSize:'0.7rem',fontWeight:600,flexShrink:0}}>
                  + Gebruik
                </button>

                <span style={{color:'var(--text-secondary)',fontSize:'0.7rem',flexShrink:0}}>{selectedItem?.id===item.id?'▲':'▼'}</span>
              </div>

              {/* GEBRUIK REGISTREER FORM */}
              {showUsageForm===item.id&&(
                <div style={{display:'flex',gap:'0.5rem',alignItems:'flex-end',padding:'0.5rem 1rem',background:'#FFF7ED',borderTop:'1px solid #FED7AA',flexWrap:'wrap'}} onClick={e=>e.stopPropagation()}>
                  <div>
                    <div style={{fontSize:'0.6rem',fontWeight:600,color:'var(--text-secondary)',marginBottom:'0.15rem'}}>Aantal</div>
                    <input type="number" min="1" value={usageForm.quantity} onChange={e=>setUsageForm({...usageForm,quantity:parseInt(e.target.value)||1})}
                      style={{width:'60px',padding:'0.25rem 0.4rem',border:'1px solid var(--border)',borderRadius:'6px',fontSize:'0.82rem',fontFamily:'var(--font-body)'}}/>
                  </div>
                  <div>
                    <div style={{fontSize:'0.6rem',fontWeight:600,color:'var(--text-secondary)',marginBottom:'0.15rem'}}>Reden</div>
                    <select value={usageForm.reason} onChange={e=>setUsageForm({...usageForm,reason:e.target.value})}
                      style={{padding:'0.25rem 0.4rem',border:'1px solid var(--border)',borderRadius:'6px',fontSize:'0.78rem',fontFamily:'var(--font-body)'}}>
                      <option value="productie">Productie</option>
                      <option value="SEM">SEM</option>
                      <option value="sample">Sample</option>
                      <option value="beschadigd">Beschadigd</option>
                      <option value="overig">Overig</option>
                    </select>
                  </div>
                  <div style={{flex:1,minWidth:'100px'}}>
                    <div style={{fontSize:'0.6rem',fontWeight:600,color:'var(--text-secondary)',marginBottom:'0.15rem'}}>Notitie</div>
                    <input value={usageForm.notes} onChange={e=>setUsageForm({...usageForm,notes:e.target.value})}
                      onKeyDown={e=>e.key==='Enter'&&doRegister(item)}
                      placeholder="bijv. artwork #12" style={{width:'100%',padding:'0.25rem 0.4rem',border:'1px solid var(--border)',borderRadius:'6px',fontSize:'0.78rem',fontFamily:'var(--font-body)',boxSizing:'border-box'}}/>
                  </div>
                  <button onClick={()=>doRegister(item)} style={{background:'var(--accent)',color:'#fff',border:'none',borderRadius:'6px',padding:'0.3rem 0.75rem',cursor:'pointer',fontSize:'0.78rem',fontWeight:600}}>Registreer</button>
                  <button onClick={()=>setShowUsageForm(null)} style={{background:'none',border:'1px solid var(--border)',borderRadius:'6px',padding:'0.3rem 0.5rem',cursor:'pointer',fontSize:'0.75rem',color:'var(--text-secondary)'}}>✕</button>
                </div>
              )}

              {/* DETAIL DRAWER */}
              {selectedItem?.id===item.id&&(
                <div style={{padding:'0.75rem 1rem 1rem',borderTop:'1px solid var(--border)',background:'var(--bg-secondary)'}}>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'0.5rem',marginBottom:'0.75rem'}}>
                    {[
                      ['Totaal gebruikt',item.totalUsed,'panelen'],
                      ['Deze week',item.thisWeek,'panelen'],
                      ['Gem./dag',item.avgPerDay>0?item.avgPerDay.toFixed(1):'-','per dag'],
                      ['Voorraad nog',item.daysLeft!==null?`${item.daysLeft}d`:'∞','bij huidig tempo'],
                    ].map(([l,v,u])=>(
                      <div key={l} style={{background:'var(--bg-card)',borderRadius:'8px',padding:'0.5rem 0.65rem',textAlign:'center'}}>
                        <div style={{fontWeight:700,fontSize:'1.1rem',fontFamily:'var(--font-display)',color:'var(--text-primary)'}}>{v}</div>
                        <div style={{fontSize:'0.62rem',color:'var(--text-secondary)',fontWeight:600,textTransform:'uppercase'}}>{l}</div>
                        <div style={{fontSize:'0.58rem',color:'var(--text-secondary)'}}>{u}</div>
                      </div>
                    ))}
                  </div>

                  {/* Per reden */}
                  <div style={{display:'flex',gap:'0.5rem',marginBottom:'0.75rem',flexWrap:'wrap'}}>
                    {['productie','SEM','sample','beschadigd','overig'].map(r=>{
                      const cnt = item.logs.filter(l=>l.reason===r).reduce((s,l)=>s+l.quantity,0)
                      if(cnt===0) return null
                      return <span key={r} style={{padding:'0.2rem 0.55rem',borderRadius:'99px',background:'var(--bg-card)',border:'1px solid var(--border)',fontSize:'0.72rem',fontWeight:600}}>
                        {r}: <strong>{cnt}</strong>
                      </span>
                    })}
                  </div>

                  {/* Log lijst */}
                  <div style={{fontSize:'0.65rem',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--text-secondary)',marginBottom:'0.35rem'}}>Gebruik per dag</div>
                  <div style={{maxHeight:'180px',overflowY:'auto',display:'flex',flexDirection:'column',gap:'0.2rem'}}>
                    {item.logs.length===0&&<div style={{fontSize:'0.75rem',color:'var(--text-secondary)',fontStyle:'italic'}}>Nog geen gebruik geregistreerd — gebruik de + Gebruik knop</div>}
                    {[...item.logs].sort((a,b)=>b.date>a.date?1:-1).map(log=>(
                      <div key={log.id} style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.28rem 0.5rem',borderRadius:'5px',background:'var(--bg-card)',fontSize:'0.73rem'}}>
                        <span style={{color:'var(--text-secondary)',flexShrink:0,minWidth:'72px'}}>{log.date}</span>
                        <span style={{fontWeight:700,color:'var(--accent)',flexShrink:0}}>{log.quantity}×</span>
                        <span style={{padding:'0.03rem 0.3rem',borderRadius:'4px',background:'var(--bg-secondary)',fontSize:'0.62rem',color:'var(--text-secondary)',flexShrink:0}}>{log.reason}</span>
                        {log.notes&&<span style={{color:'var(--text-secondary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{log.notes}</span>}
                        <span style={{color:'var(--text-secondary)',marginLeft:'auto',flexShrink:0,fontSize:'0.62rem'}}>{log.registeredBy}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}


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
  const [usageLogs, setUsageLogs] = useState([])
  const [showUsageForm, setShowUsageForm] = useState(null) // itemId
  const [usageForm, setUsageForm] = useState({ quantity: 1, reason: 'productie', notes: '' })
  const [expandedItem, setExpandedItem] = useState(null) // voor detail-view
  const [activeTab2, setActiveTab2] = useState('overzicht') // 'overzicht' | 'gebruik'

  useEffect(() => {
    api.getAll('inventory').then(setItems)
    api.getAll('panel_usage').then(setUsageLogs)
  }, [])
  const reloadUsage = () => api.getAll('panel_usage').then(setUsageLogs)
  const deleteUsage = async (logId, item) => {
    // Herstel de voorraad
    const log = usageLogs.find(l => l.id === logId)
    if (!log) return
    await api.remove('panel_usage', logId)
    // Tel voorraad terug op
    await api.save('inventory', { ...item, quantity: item.quantity + log.quantity })
    reload(); reloadUsage()
  }
  const reload = () => api.getAll('inventory').then(setItems)

  const registerUsage = async (item, form) => {
    if (!form || form.quantity <= 0) return
    const log = {
      id: `use-${Date.now()}`,
      itemId: item.id, itemName: item.name,
      quantity: form.quantity, date: new Date().toISOString().slice(0,10),
      reason: form.reason, registeredBy: 'Tein',
      notes: form.notes, createdAt: new Date().toISOString()
    }
    await api.save('panel_usage', log)
    await api.save('inventory', { ...item, quantity: Math.max(0, item.quantity - form.quantity) })
    reload(); reloadUsage()
  }


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

  // Usage analytics berekeningen
  const today = new Date()
  const toISO = d => d.toISOString().slice(0,10)
  const weekAgo = new Date(today); weekAgo.setDate(today.getDate()-7)
  const monthAgo = new Date(today); monthAgo.setDate(today.getDate()-30)
  const twoWeeksAgo = new Date(today); twoWeeksAgo.setDate(today.getDate()-14)

  const panelUsage = usageLogs.filter(l => {
    const item = items.find(i => i.id === l.itemId)
    return item && item.section === 'panelen'
  })
  const usageThisWeek = panelUsage.filter(l => l.date >= toISO(weekAgo)).reduce((s,l)=>s+l.quantity,0)
  const usageLastWeek = panelUsage.filter(l => l.date >= toISO(new Date(weekAgo.getTime()-7*86400000)) && l.date < toISO(weekAgo)).reduce((s,l)=>s+l.quantity,0)
  const usageThisMonth = panelUsage.filter(l => l.date >= toISO(monthAgo)).reduce((s,l)=>s+l.quantity,0)

  // Per kleur: totaal gebruik + ranking
  const usageByColor = panelen.map(item => {
    const logs = panelUsage.filter(l => l.itemId === item.id)
    const total = logs.reduce((s,l)=>s+l.quantity,0)
    const lastWeekUsage = logs.filter(l=>l.date>=toISO(weekAgo)).reduce((s,l)=>s+l.quantity,0)
    const avgPerWeek = panelUsage.length > 0 && total > 0
      ? total / Math.max(1, Math.ceil((today - new Date(Math.min(...logs.map(l=>new Date(l.date))))) / (7*86400000)))
      : 0
    const weeksLeft = avgPerWeek > 0 ? Math.floor(item.quantity / avgPerWeek) : null
    return { ...item, totalUsed: total, lastWeekUsage, avgPerWeek: Math.round(avgPerWeek*10)/10, weeksLeft }
  }).sort((a,b) => b.totalUsed - a.totalUsed || b.lastWeekUsage - a.lastWeekUsage)

  // Dagelijkse usage voor grafiek (laatste 14 dagen)
  const last14 = Array.from({length:14},(_,i)=>{
    const d = new Date(today); d.setDate(today.getDate()-13+i)
    const iso = toISO(d)
    const used = panelUsage.filter(l=>l.date===iso).reduce((s,l)=>s+l.quantity,0)
    return { date: iso, label: d.toLocaleDateString('nl-NL',{day:'numeric',month:'short'}), used }
  })
  const maxDaily = Math.max(...last14.map(d=>d.used),1)
  const avgStock = panelen.length > 0 ? Math.round(panelen.reduce((s,i) => s + i.quantity, 0) / panelen.length) : 0
  const minP = panelen.length > 0 ? Math.min(...panelen.map(i => i.quantity)) : 0
  const maxArt = Math.floor(minP / PER_ARTWORK)
  return (
    <>
      <div className="page-header" style={{alignItems:'flex-start'}}>
        <div>
          <h1>Voorraad</h1>
          <p className="page-subtitle">{items.length} items
            {needsOrder > 0 ? <span style={{color:'#DC2626'}}> &middot; {needsOrder} bestellen</span>
            : <span style={{color:'#059669'}}> &middot; alles op voorraad</span>}
          </p>
        </div>
        <BestellingTracker
          shipments={shipments}
          onAdd={()=>{setShipForm(emptyShipment);setEditShipment(null);setShowAddShipment(true)}}
          onEdit={startEditShipment}
          onDelete={id=>setConfirmDelShipment(id)}
        />
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
      {tab === 'panelen' && (
        <PanelenRankingView
          items={panelen}
          usageLogs={usageLogs}
          onUpdateQty={updateQty}
          onUpdateField={updateField}
          onRegisterUsage={registerUsage}
          onDelete={(id)=>setConfirmDel(id)}
          onDeleteUsage={deleteUsage}
          currentUser={localStorage.getItem('artazest_user')||'Tein'}
        />
      )}
      {tab !== 'panelen' && (
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
      )}
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
// ─── BESTELLING TRACKER ─────────────────────────────────────────────────────
const STATUS_CONFIG = {
  besteld:   { label: 'Besteld',    color: '#2563EB', bg: '#EFF6FF', icon: '📋' },
  verzonden: { label: 'Verzonden',  color: '#7C3AED', bg: '#F5F3FF', icon: '📦' },
  onderweg:  { label: 'Onderweg',   color: '#D97706', bg: '#FFF7ED', icon: '🚢' },
  geleverd:  { label: 'Geleverd',   color: '#059669', bg: '#F0FDF4', icon: '✅' },
  vertraagd: { label: 'Vertraagd',  color: '#DC2626', bg: '#FEF2F2', icon: '⚠️' },
}

function BestellingTracker({ shipments, onAdd, onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const ref = React.useRef(null)

  // Sluit bij klik buiten
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setSelected(null) } }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const active = shipments.filter(s => s.status !== 'geleverd')
  const today = new Date().toISOString().slice(0,10)

  const daysUntil = d => d ? Math.ceil((new Date(d) - new Date()) / (1000*60*60*24)) : null
  const fmt = d => d ? new Date(d).toLocaleDateString('nl-NL', {day:'numeric', month:'short'}) : '—'

  return (
    <div ref={ref} style={{position:'relative'}}>
      {/* Trigger knop */}
      <button onClick={()=>{setOpen(!open);setSelected(null)}}
        style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.45rem 0.85rem',borderRadius:'10px',border:'1px solid var(--border)',background:'var(--bg-card)',cursor:'pointer',transition:'all 0.15s',fontFamily:'var(--font-body)'}}>
        <span style={{fontSize:'0.85rem'}}>🚢</span>
        <span style={{fontSize:'0.82rem',fontWeight:600,color:'var(--text-primary)'}}>Bestellingen</span>
        {active.length > 0 && (
          <span style={{background:'#D97706',color:'#fff',borderRadius:'99px',padding:'0.05rem 0.45rem',fontSize:'0.65rem',fontWeight:700}}>{active.length}</span>
        )}
        <span style={{fontSize:'0.65rem',color:'var(--text-secondary)'}}>{open?'▲':'▼'}</span>
      </button>

      {/* Dropdown */}
      {open && !selected && (
        <div style={{position:'absolute',top:'calc(100% + 8px)',right:0,zIndex:999,background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'14px',boxShadow:'0 8px 32px rgba(0,0,0,0.14)',padding:'0.75rem',minWidth:'340px',maxWidth:'400px',maxHeight:'480px',overflowY:'auto'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.65rem'}}>
            <span style={{fontSize:'0.65rem',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--text-secondary)'}}>Bestellingen onderweg</span>
            <button onClick={onAdd} style={{background:'var(--accent)',color:'#fff',border:'none',borderRadius:'6px',padding:'0.2rem 0.6rem',cursor:'pointer',fontSize:'0.7rem',fontWeight:600}}>+ Nieuwe</button>
          </div>

          {shipments.length === 0 && (
            <div style={{textAlign:'center',padding:'1.5rem 0',color:'var(--text-secondary)',fontSize:'0.8rem',fontStyle:'italic'}}>
              Geen bestellingen — klik "+ Nieuwe" om te beginnen
            </div>
          )}

          <div style={{display:'flex',flexDirection:'column',gap:'0.35rem'}}>
            {shipments.sort((a,b)=>a.status==='geleverd'?1:b.status==='geleverd'?-1:0).map(s => {
              const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.besteld
              const d = daysUntil(s.expectedDate)
              const isLate = s.status !== 'geleverd' && s.expectedDate && s.expectedDate < today
              return (
                <div key={s.id} onClick={()=>setSelected(s)}
                  style={{padding:'0.55rem 0.7rem',borderRadius:'10px',border:`1px solid ${isLate?'#FCA5A5':cfg.color+'40'}`,background:isLate?'#FEF2F2':cfg.bg,cursor:'pointer',transition:'all 0.15s'}}
                  onMouseEnter={e=>e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.08)'}
                  onMouseLeave={e=>e.currentTarget.style.boxShadow=''}>
                  <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                    <span style={{fontSize:'1rem',flexShrink:0}}>{cfg.icon}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:600,fontSize:'0.83rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.description}</div>
                      <div style={{fontSize:'0.68rem',color:'var(--text-secondary)',marginTop:'0.1rem'}}>{s.supplier}{s.quantity?` · ${s.quantity} ${s.unit||'stuks'}`:''}</div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'0.1rem',flexShrink:0}}>
                      <span style={{fontSize:'0.65rem',padding:'0.1rem 0.4rem',borderRadius:'99px',background:cfg.color,color:'#fff',fontWeight:600,whiteSpace:'nowrap'}}>{cfg.label}</span>
                      {s.expectedDate && (
                        <span style={{fontSize:'0.62rem',color:isLate?'#DC2626':d!==null&&d<=3?'#D97706':'var(--text-secondary)',fontWeight:isLate||d<=3?600:400}}>
                          {isLate ? `${Math.abs(d)}d te laat` : d===0 ? 'Vandaag!' : d!==null ? `over ${d}d` : ''} · {fmt(s.expectedDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Progress bar status */}
                  <div style={{marginTop:'0.4rem',display:'flex',gap:'2px'}}>
                    {['besteld','verzonden','onderweg','geleverd'].map((st,i) => {
                      const steps = ['besteld','verzonden','onderweg','geleverd']
                      const cur = steps.indexOf(s.status)
                      const filled = i <= cur
                      return <div key={st} style={{flex:1,height:'3px',borderRadius:'99px',background:filled?cfg.color:'rgba(0,0,0,0.1)',transition:'background 0.3s'}}/>
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Detail popup */}
      {open && selected && (
        <div style={{position:'absolute',top:'calc(100% + 8px)',right:0,zIndex:999,background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'14px',boxShadow:'0 8px 32px rgba(0,0,0,0.14)',padding:'1rem',minWidth:'340px',maxWidth:'420px'}}>
          {/* Header */}
          <div style={{display:'flex',alignItems:'flex-start',gap:'0.5rem',marginBottom:'0.75rem'}}>
            <button onClick={()=>setSelected(null)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',fontSize:'0.8rem',padding:0,flexShrink:0,marginTop:'0.1rem'}}>← Terug</button>
            <div style={{flex:1}}/>
            <button onClick={()=>{onEdit(selected);setOpen(false);setSelected(null)}} style={{background:'var(--bg-secondary)',border:'none',cursor:'pointer',color:'var(--text-primary)',fontSize:'0.7rem',padding:'0.2rem 0.5rem',borderRadius:'5px',fontWeight:500}}>✎ Bewerken</button>
            <button onClick={()=>{onDelete(selected.id);setSelected(null)}} style={{background:'none',border:'none',cursor:'pointer',color:'#DC2626',fontSize:'0.7rem',padding:'0.2rem 0.3rem'}}>✕</button>
          </div>

          <div style={{marginBottom:'0.75rem'}}>
            <div style={{fontSize:'1rem',fontWeight:700,marginBottom:'0.15rem'}}>{selected.description}</div>
            <div style={{fontSize:'0.75rem',color:'var(--text-secondary)'}}>{selected.supplier}{selected.quantity?` · ${selected.quantity} ${selected.unit||'stuks'}`:''}</div>
          </div>

          {/* Status voortgang */}
          {(() => {
            const cfg = STATUS_CONFIG[selected.status] || STATUS_CONFIG.besteld
            const steps = ['besteld','verzonden','onderweg','geleverd']
            const cur = steps.indexOf(selected.status)
            return (
              <div style={{marginBottom:'0.85rem'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.35rem'}}>
                  {steps.map((st,i) => {
                    const scfg = STATUS_CONFIG[st]
                    const done = i <= cur
                    return (
                      <div key={st} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'0.2rem',flex:1}}>
                        <div style={{width:'24px',height:'24px',borderRadius:'50%',background:done?cfg.color:'var(--bg-secondary)',border:`2px solid ${done?cfg.color:'var(--border)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.65rem',transition:'all 0.3s'}}>
                          {done && <span style={{color:'#fff',fontSize:'0.55rem'}}>✓</span>}
                        </div>
                        <div style={{fontSize:'0.55rem',color:done?cfg.color:'var(--text-secondary)',fontWeight:done?700:400,textAlign:'center'}}>{scfg.label}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}

          {/* Details grid */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem',marginBottom:'0.75rem'}}>
            {[
              ['Besteld op', selected.orderedDate],
              ['Verzonden op', selected.shippedDate || '—'],
              ['Verwacht', selected.expectedDate || '—'],
              ['Bedrag', selected.amount ? `€${selected.amount}` : '—'],
            ].map(([l,v]) => (
              <div key={l} style={{background:'var(--bg-secondary)',borderRadius:'8px',padding:'0.4rem 0.55rem'}}>
                <div style={{fontSize:'0.6rem',color:'var(--text-secondary)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.04em'}}>{l}</div>
                <div style={{fontSize:'0.82rem',fontWeight:600,color:'var(--text-primary)',marginTop:'0.1rem'}}>{v && v.match(/^\d{4}-\d{2}-\d{2}$/) ? new Date(v).toLocaleDateString('nl-NL',{day:'numeric',month:'long'}) : v}</div>
              </div>
            ))}
          </div>

          {/* Tracking + notities */}
          {selected.trackingUrl && (
            <a href={selected.trackingUrl} target="_blank" rel="noreferrer"
              style={{display:'block',padding:'0.4rem 0.65rem',borderRadius:'8px',background:'#EFF6FF',color:'#2563EB',fontSize:'0.78rem',fontWeight:600,textDecoration:'none',marginBottom:'0.5rem',textAlign:'center'}}>
              🔍 Track & Trace →
            </a>
          )}
          {selected.notes && (
            <div style={{padding:'0.4rem 0.55rem',borderRadius:'8px',background:'var(--bg-secondary)',fontSize:'0.75rem',color:'var(--text-secondary)',fontStyle:'italic'}}>{selected.notes}</div>
          )}
        </div>
      )}
    </div>
  )
}


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
