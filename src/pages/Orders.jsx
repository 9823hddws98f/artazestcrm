import { useState, useEffect } from 'react'
import { api } from '../api'
import { ARTAZEST_COLORS, brandName } from '../colors'

const STATUSES = [
  { key:'nieuw', label:'Nieuw', color:'#6366F1', icon:'📥' },
  { key:'ingepakt', label:'Ingepakt', color:'#D97706', icon:'📦' },
  { key:'verzonden', label:'Verzonden', color:'#2563EB', icon:'🚚' },
  { key:'geleverd', label:'Geleverd', color:'#059669', icon:'✓' },
]
const RETURN_REASONS = ['Beschadigd bij levering','Verkeerde kleur','Niet tevreden','Defect','Verkeerd adres','Anders']
const COLORS = ARTAZEST_COLORS.map(c => c.key)
const fmt = n => new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',minimumFractionDigits:2}).format(n)

export default function Orders() {
  const [tab, setTab] = useState('fulfillment')
  const [orders, setOrders] = useState([])
  const [returns, setReturns] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [shipCalc, setShipCalc] = useState({ lengthCm:80, widthCm:60, heightCm:8, weightKg:2.5, divisor:5000, shipCost:0, sellPrice:149 })

  useEffect(() => {
    api.getSetting('orders').then(val => { if (val?.length) setOrders(val) })
    api.getSetting('returns_log').then(val => { if (val?.length) setReturns(val) })
    api.getSetting('supplier_log').then(val => { if (val?.length) setSuppliers(val) })
    api.getSetting('ship_calc').then(val => { if (val) setShipCalc(val) })
  }, [])

  const saveOrders = d => { setOrders(d); api.saveSetting('orders', d) }
  const saveReturns = d => { setReturns(d); api.saveSetting('returns_log', d) }
  const saveSuppliers = d => { setSuppliers(d); api.saveSetting('supplier_log', d) }
  const saveCalc = d => { setShipCalc(d); api.saveSetting('ship_calc', d) }

  const tabs = [
    { key:'fulfillment', label:'Fulfillment', icon:'📦' },
    { key:'returns', label:'Retouren', icon:'↩' },
    { key:'suppliers', label:'Leveranciers', icon:'🏭' },
    { key:'shipping', label:'Verzendkosten', icon:'🚚' },
  ]

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Orders & Logistiek</h1>
          <p className="page-subtitle">{orders.length} orders · {returns.length} retouren · {suppliers.length} leverancier contacten</p>
        </div>
      </div>
      <div className="tabs">
        {tabs.map(t=><button key={t.key} className={`tab ${tab===t.key?'active':''}`} onClick={()=>setTab(t.key)}>{t.icon} {t.label}</button>)}
      </div>
      {tab==='fulfillment'&&<FulfillmentTab orders={orders} save={saveOrders}/>}
      {tab==='returns'&&<ReturnsTab returns={returns} save={saveReturns}/>}
      {tab==='suppliers'&&<SupplierTab suppliers={suppliers} save={saveSuppliers}/>}
      {tab==='shipping'&&<ShippingTab calc={shipCalc} save={saveCalc}/>}
    </>
  )
}

// ─── FULFILLMENT PIPELINE ────────────────────────────────────────────────────
function FulfillmentTab({ orders, save }) {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ orderNumber:'', customer:'', items:1, notes:'', trackingNumber:'' })

  const add = () => {
    if (!form.orderNumber.trim()&&!form.customer.trim()) return
    save([...orders, { ...form, id:`o${Date.now()}`, status:'nieuw', createdAt:new Date().toISOString(), packedAt:null, shippedAt:null, deliveredAt:null }])
    setForm({ orderNumber:'', customer:'', items:1, notes:'', trackingNumber:'' }); setShowAdd(false)
  }

  const moveStatus = (id, newStatus) => {
    const now = new Date().toISOString()
    const timeKey = { ingepakt:'packedAt', verzonden:'shippedAt', geleverd:'deliveredAt' }
    save(orders.map(o => o.id===id ? { ...o, status:newStatus, ...(timeKey[newStatus]?{[timeKey[newStatus]]:now}:{}) } : o))
  }

  const remove = id => save(orders.filter(o => o.id!==id))

  return (
    <>
      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'0.75rem',marginBottom:'1.5rem'}}>
        {STATUSES.map(s => {
          const count = orders.filter(o=>o.status===s.key).length
          return (
            <div key={s.key} className="card" style={{padding:'0.75rem',textAlign:'center',borderTop:`3px solid ${s.color}`}}>
              <div style={{fontSize:'1.5rem',fontWeight:700,color:s.color}}>{count}</div>
              <div style={{fontSize:'0.72rem',color:'var(--text-secondary)'}}>{s.icon} {s.label}</div>
            </div>
          )
        })}
      </div>

      <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.75rem'}}>
        <h3 className="section-title" style={{margin:0}}>Order Pipeline</h3>
        <button onClick={()=>setShowAdd(!showAdd)} style={{padding:'0.3rem 0.7rem',borderRadius:'6px',background:'var(--accent)',color:'#fff',border:'none',cursor:'pointer',fontSize:'0.72rem',fontWeight:600}}>+ Order</button>
      </div>

      {showAdd && (
        <div className="card" style={{marginBottom:'1rem',padding:'0.75rem'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 80px',gap:'0.4rem',marginBottom:'0.4rem'}}>
            <input value={form.orderNumber} onChange={e=>setForm({...form,orderNumber:e.target.value})} placeholder="Order #" style={{padding:'0.35rem 0.5rem',borderRadius:'4px',border:'1px solid var(--border)',fontSize:'0.75rem',fontFamily:'var(--font-body)'}}/>
            <input value={form.customer} onChange={e=>setForm({...form,customer:e.target.value})} placeholder="Klant" style={{padding:'0.35rem 0.5rem',borderRadius:'4px',border:'1px solid var(--border)',fontSize:'0.75rem',fontFamily:'var(--font-body)'}}/>
            <input type="number" value={form.items} onChange={e=>setForm({...form,items:parseInt(e.target.value)||1})} min={1} style={{padding:'0.35rem 0.5rem',borderRadius:'4px',border:'1px solid var(--border)',fontSize:'0.75rem',fontFamily:'var(--font-body)'}}/>
          </div>
          <div style={{display:'flex',gap:'0.4rem'}}>
            <input value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Notities..." onKeyDown={e=>e.key==='Enter'&&add()}
              style={{flex:1,padding:'0.35rem 0.5rem',borderRadius:'4px',border:'1px solid var(--border)',fontSize:'0.75rem',fontFamily:'var(--font-body)'}}/>
            <button onClick={add} style={{padding:'0.35rem 0.7rem',borderRadius:'4px',background:'var(--accent)',color:'#fff',border:'none',cursor:'pointer',fontSize:'0.72rem',fontWeight:600}}>Toevoegen</button>
          </div>
        </div>
      )}

      {/* Kanban columns */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'0.75rem'}}>
        {STATUSES.map(s => {
          const col = orders.filter(o=>o.status===s.key).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))
          const nextStatus = STATUSES[STATUSES.findIndex(x=>x.key===s.key)+1]
          return (
            <div key={s.key}>
              <div style={{padding:'0.4rem 0.6rem',borderRadius:'6px',background:'var(--bg-secondary)',marginBottom:'0.5rem',display:'flex',alignItems:'center',gap:'0.3rem'}}>
                <span style={{width:'7px',height:'7px',borderRadius:'50%',background:s.color}}/><span style={{fontSize:'0.78rem',fontWeight:600}}>{s.label}</span>
                <span style={{fontSize:'0.65rem',color:'var(--text-secondary)',marginLeft:'auto'}}>{col.length}</span>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'0.35rem',minHeight:'60px'}}>
                {col.map(o => (
                  <div key={o.id} style={{padding:'0.5rem',borderRadius:'6px',border:'1px solid var(--border)',background:'var(--bg-card)',fontSize:'0.75rem'}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.15rem'}}>
                      <span style={{fontWeight:600}}>#{o.orderNumber||'—'}</span>
                      <button onClick={()=>remove(o.id)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',fontSize:'0.6rem',opacity:0.5}}>✕</button>
                    </div>
                    <div style={{color:'var(--text-secondary)',fontSize:'0.68rem'}}>{o.customer||'Onbekend'} · {o.items} panels</div>
                    {o.notes&&<div style={{color:'var(--text-secondary)',fontSize:'0.62rem',fontStyle:'italic',marginTop:'0.1rem'}}>{o.notes}</div>}
                    {o.trackingNumber&&<div style={{fontSize:'0.6rem',color:'var(--accent)',marginTop:'0.15rem'}}>📍 {o.trackingNumber}</div>}
                    <div style={{fontSize:'0.58rem',color:'var(--text-secondary)',marginTop:'0.2rem'}}>{new Date(o.createdAt).toLocaleDateString('nl-NL',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
                    {nextStatus && (
                      <button onClick={()=>moveStatus(o.id,nextStatus.key)} style={{marginTop:'0.3rem',width:'100%',padding:'0.2rem',borderRadius:'4px',border:`1px solid ${nextStatus.color}40`,background:nextStatus.color+'10',color:nextStatus.color,fontSize:'0.62rem',fontWeight:600,cursor:'pointer'}}>
                        → {nextStatus.label}
                      </button>
                    )}
                  </div>
                ))}
                {col.length===0&&<div style={{padding:'0.5rem',textAlign:'center',color:'var(--text-secondary)',fontSize:'0.68rem',fontStyle:'italic'}}>Leeg</div>}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

// ─── RETOUREN & BESCHADIGINGEN ───────────────────────────────────────────────
function ReturnsTab({ returns, save }) {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ orderId:'', reason:RETURN_REASONS[0], color:COLORS[0], cost:0, notes:'' })

  const add = () => {
    save([...returns, { ...form, id:`r${Date.now()}`, date:new Date().toISOString(), cost:parseFloat(form.cost)||0 }])
    setForm({ orderId:'', reason:RETURN_REASONS[0], color:COLORS[0], cost:0, notes:'' }); setShowAdd(false)
  }

  const remove = id => save(returns.filter(r => r.id!==id))
  const totalCost = returns.reduce((s,r) => s+r.cost, 0)
  const byReason = RETURN_REASONS.map(r => ({ reason:r, count:returns.filter(x=>x.reason===r).length })).filter(x=>x.count>0)
  const byColor = COLORS.map(c => ({ color:c, count:returns.filter(x=>x.color===c).length, cost:returns.filter(x=>x.color===c).reduce((s,x)=>s+x.cost,0) })).filter(x=>x.count>0)

  return (
    <>
      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'1rem',marginBottom:'1.5rem'}}>
        <div className="card" style={{textAlign:'center',padding:'1rem'}}>
          <div style={{fontSize:'1.5rem',fontWeight:700,color:returns.length>0?'#DC2626':'#059669'}}>{returns.length}</div>
          <div style={{fontSize:'0.72rem',color:'var(--text-secondary)'}}>Totaal retouren</div>
        </div>
        <div className="card" style={{textAlign:'center',padding:'1rem'}}>
          <div style={{fontSize:'1.5rem',fontWeight:700,color:'var(--text-primary)'}}>{fmt(totalCost)}</div>
          <div style={{fontSize:'0.72rem',color:'var(--text-secondary)'}}>Totale kosten</div>
        </div>
        <div className="card" style={{textAlign:'center',padding:'1rem'}}>
          <div style={{fontSize:'1.5rem',fontWeight:700}}>{byReason[0]?.reason?.slice(0,15)||'—'}</div>
          <div style={{fontSize:'0.72rem',color:'var(--text-secondary)'}}>Top reden</div>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1.5rem'}}>
        {/* Per reden */}
        {byReason.length>0 && (
          <div className="card" style={{padding:'0.75rem'}}>
            <h4 style={{fontSize:'0.82rem',fontWeight:600,marginBottom:'0.5rem'}}>Per reden</h4>
            {byReason.sort((a,b)=>b.count-a.count).map(r => (
              <div key={r.reason} style={{display:'flex',justifyContent:'space-between',padding:'0.2rem 0',fontSize:'0.75rem',borderBottom:'1px solid rgba(28,25,23,0.04)'}}>
                <span>{r.reason}</span><span style={{fontWeight:600}}>{r.count}</span>
              </div>
            ))}
          </div>
        )}
        {/* Per kleur */}
        {byColor.length>0 && (
          <div className="card" style={{padding:'0.75rem'}}>
            <h4 style={{fontSize:'0.82rem',fontWeight:600,marginBottom:'0.5rem'}}>Per kleur</h4>
            {byColor.sort((a,b)=>b.count-a.count).map(c => (
              <div key={c.color} style={{display:'flex',justifyContent:'space-between',padding:'0.2rem 0',fontSize:'0.75rem',borderBottom:'1px solid rgba(28,25,23,0.04)'}}>
                <span>{brandName(c.color)}</span><span style={{fontWeight:600}}>{c.count} · {fmt(c.cost)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add + Log */}
      <div className="card">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem'}}>
          <h3 className="section-title" style={{margin:0}}>Retourenlog</h3>
          <button onClick={()=>setShowAdd(!showAdd)} style={{padding:'0.25rem 0.6rem',borderRadius:'6px',border:'1px solid var(--border)',background:'var(--bg-secondary)',cursor:'pointer',fontSize:'0.7rem',fontWeight:600}}>+ Retour</button>
        </div>

        {showAdd && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 80px',gap:'0.4rem',marginBottom:'0.75rem',padding:'0.5rem',borderRadius:'8px',background:'var(--bg-secondary)'}}>
            <input value={form.orderId} onChange={e=>setForm({...form,orderId:e.target.value})} placeholder="Order #" style={{padding:'0.3rem 0.5rem',borderRadius:'4px',border:'1px solid var(--border)',fontSize:'0.72rem',fontFamily:'var(--font-body)'}}/>
            <select value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} style={{padding:'0.3rem',borderRadius:'4px',border:'1px solid var(--border)',fontSize:'0.72rem',fontFamily:'var(--font-body)'}}>
              {RETURN_REASONS.map(r=><option key={r}>{r}</option>)}
            </select>
            <select value={form.color} onChange={e=>setForm({...form,color:e.target.value})} style={{padding:'0.3rem',borderRadius:'4px',border:'1px solid var(--border)',fontSize:'0.72rem',fontFamily:'var(--font-body)'}}>
              {COLORS.map(c=><option key={c} value={c}>{brandName(c)}</option>)}
            </select>
            <input type="number" value={form.cost} onChange={e=>setForm({...form,cost:e.target.value})} placeholder="€" style={{padding:'0.3rem 0.5rem',borderRadius:'4px',border:'1px solid var(--border)',fontSize:'0.72rem',fontFamily:'var(--font-body)'}}/>
            <input value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Notities..." onKeyDown={e=>e.key==='Enter'&&add()} style={{gridColumn:'1/4',padding:'0.3rem 0.5rem',borderRadius:'4px',border:'1px solid var(--border)',fontSize:'0.72rem',fontFamily:'var(--font-body)'}}/>
            <button onClick={add} style={{padding:'0.3rem',borderRadius:'4px',background:'var(--accent)',color:'#fff',border:'none',cursor:'pointer',fontSize:'0.7rem',fontWeight:600}}>+</button>
          </div>
        )}

        {returns.length===0?<div style={{textAlign:'center',color:'var(--text-secondary)',fontSize:'0.78rem',padding:'1rem'}}>Nog geen retouren — hopelijk blijft dat zo 🤞</div>:
        <div style={{display:'flex',flexDirection:'column',gap:'0.25rem'}}>
          {returns.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(r => (
            <div key={r.id} style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.4rem 0',borderBottom:'1px solid rgba(28,25,23,0.04)',fontSize:'0.75rem'}}>
              <span style={{fontWeight:600,minWidth:'60px'}}>#{r.orderId||'—'}</span>
              <span style={{flex:1}}>{r.reason}</span>
              <span style={{color:'var(--text-secondary)'}}>{brandName(r.color)}</span>
              <span style={{fontWeight:600,minWidth:'60px',textAlign:'right'}}>{fmt(r.cost)}</span>
              <span style={{fontSize:'0.62rem',color:'var(--text-secondary)',minWidth:'50px'}}>{new Date(r.date).toLocaleDateString('nl-NL',{day:'numeric',month:'short'})}</span>
              <button onClick={()=>remove(r.id)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',fontSize:'0.6rem',opacity:0.4}}>✕</button>
            </div>
          ))}
        </div>}
      </div>
    </>
  )
}

// ─── SUPPLIER COMMUNICATIE LOG ────────────────────────────────────────────────
function SupplierTab({ suppliers, save }) {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ supplier:'', type:'Email', notes:'', expectedDate:'', actualDate:'' })
  const TYPES = ['Email','Telefoon','WhatsApp','Bezoek','WeChat','Alibaba']

  const add = () => {
    if (!form.supplier.trim()&&!form.notes.trim()) return
    save([...suppliers, { ...form, id:`s${Date.now()}`, date:new Date().toISOString() }])
    setForm({ supplier:'', type:'Email', notes:'', expectedDate:'', actualDate:'' }); setShowAdd(false)
  }

  const remove = id => save(suppliers.filter(s => s.id!==id))
  const updateActual = (id, actualDate) => save(suppliers.map(s => s.id===id ? { ...s, actualDate } : s))

  const uniqueSuppliers = [...new Set(suppliers.map(s=>s.supplier).filter(Boolean))]
  const overdue = suppliers.filter(s => s.expectedDate && !s.actualDate && new Date(s.expectedDate) < new Date())

  return (
    <>
      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'1rem',marginBottom:'1.5rem'}}>
        <div className="card" style={{textAlign:'center',padding:'1rem'}}>
          <div style={{fontSize:'1.5rem',fontWeight:700}}>{suppliers.length}</div>
          <div style={{fontSize:'0.72rem',color:'var(--text-secondary)'}}>Contactmomenten</div>
        </div>
        <div className="card" style={{textAlign:'center',padding:'1rem'}}>
          <div style={{fontSize:'1.5rem',fontWeight:700}}>{uniqueSuppliers.length}</div>
          <div style={{fontSize:'0.72rem',color:'var(--text-secondary)'}}>Leveranciers</div>
        </div>
        <div className="card" style={{textAlign:'center',padding:'1rem'}}>
          <div style={{fontSize:'1.5rem',fontWeight:700,color:overdue.length>0?'#DC2626':'#059669'}}>{overdue.length}</div>
          <div style={{fontSize:'0.72rem',color:'var(--text-secondary)'}}>Overdue leveringen</div>
        </div>
      </div>

      <div className="card">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem'}}>
          <h3 className="section-title" style={{margin:0}}>Communicatielog</h3>
          <button onClick={()=>setShowAdd(!showAdd)} style={{padding:'0.25rem 0.6rem',borderRadius:'6px',border:'1px solid var(--border)',background:'var(--bg-secondary)',cursor:'pointer',fontSize:'0.7rem',fontWeight:600}}>+ Contact</button>
        </div>

        {showAdd && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.4rem',marginBottom:'0.75rem',padding:'0.5rem',borderRadius:'8px',background:'var(--bg-secondary)'}}>
            <input value={form.supplier} onChange={e=>setForm({...form,supplier:e.target.value})} placeholder="Leverancier naam" list="supplier-list"
              style={{padding:'0.3rem 0.5rem',borderRadius:'4px',border:'1px solid var(--border)',fontSize:'0.72rem',fontFamily:'var(--font-body)'}}/>
            <datalist id="supplier-list">{uniqueSuppliers.map(s=><option key={s} value={s}/>)}</datalist>
            <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={{padding:'0.3rem',borderRadius:'4px',border:'1px solid var(--border)',fontSize:'0.72rem',fontFamily:'var(--font-body)'}}>
              {TYPES.map(t=><option key={t}>{t}</option>)}
            </select>
            <input value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Notities / onderwerp" onKeyDown={e=>e.key==='Enter'&&add()}
              style={{gridColumn:'1/3',padding:'0.3rem 0.5rem',borderRadius:'4px',border:'1px solid var(--border)',fontSize:'0.72rem',fontFamily:'var(--font-body)'}}/>
            <div style={{display:'flex',gap:'0.3rem',alignItems:'center'}}>
              <label style={{fontSize:'0.65rem',color:'var(--text-secondary)',whiteSpace:'nowrap'}}>Verwacht:</label>
              <input type="date" value={form.expectedDate} onChange={e=>setForm({...form,expectedDate:e.target.value})} style={{flex:1,padding:'0.25rem',borderRadius:'4px',border:'1px solid var(--border)',fontSize:'0.68rem',fontFamily:'var(--font-body)'}}/>
            </div>
            <button onClick={add} style={{padding:'0.3rem',borderRadius:'4px',background:'var(--accent)',color:'#fff',border:'none',cursor:'pointer',fontSize:'0.7rem',fontWeight:600}}>Toevoegen</button>
          </div>
        )}

        {suppliers.length===0?<div style={{textAlign:'center',color:'var(--text-secondary)',fontSize:'0.78rem',padding:'1rem'}}>Nog geen contactmomenten geregistreerd</div>:
        <div style={{display:'flex',flexDirection:'column',gap:'0.25rem'}}>
          {suppliers.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(s => {
            const isOverdue = s.expectedDate && !s.actualDate && new Date(s.expectedDate) < new Date()
            return (
              <div key={s.id} style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.45rem 0',borderBottom:'1px solid rgba(28,25,23,0.04)',fontSize:'0.75rem',background:isOverdue?'#FEE2E210':'transparent',borderLeft:isOverdue?'3px solid #DC2626':'3px solid transparent',paddingLeft:isOverdue?'0.5rem':'0'}}>
                <span style={{fontWeight:600,minWidth:'100px'}}>{s.supplier||'—'}</span>
                <span style={{fontSize:'0.62rem',padding:'0.1rem 0.35rem',borderRadius:'99px',background:'var(--bg-secondary)',color:'var(--text-secondary)',fontWeight:600}}>{s.type}</span>
                <span style={{flex:1,color:'var(--text-secondary)'}}>{s.notes}</span>
                {s.expectedDate && (
                  <span style={{fontSize:'0.62rem',color:isOverdue?'#DC2626':s.actualDate?'#059669':'var(--text-secondary)',fontWeight:isOverdue?700:400,whiteSpace:'nowrap'}}>
                    Verwacht: {new Date(s.expectedDate).toLocaleDateString('nl-NL',{day:'numeric',month:'short'})}
                    {s.actualDate?` ✓ ${new Date(s.actualDate).toLocaleDateString('nl-NL',{day:'numeric',month:'short'})}`:isOverdue?' ⚠ OVERDUE':''}
                  </span>
                )}
                {s.expectedDate && !s.actualDate && (
                  <button onClick={()=>updateActual(s.id,new Date().toISOString().slice(0,10))} title="Markeer als geleverd"
                    style={{background:'none',border:'1px solid #059669',borderRadius:'4px',color:'#059669',fontSize:'0.58rem',padding:'0.1rem 0.3rem',cursor:'pointer',fontWeight:600,whiteSpace:'nowrap'}}>✓ Ontvangen</button>
                )}
                <span style={{fontSize:'0.62rem',color:'var(--text-secondary)',minWidth:'50px',whiteSpace:'nowrap'}}>{new Date(s.date).toLocaleDateString('nl-NL',{day:'numeric',month:'short'})}</span>
                <button onClick={()=>remove(s.id)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',fontSize:'0.6rem',opacity:0.4}}>✕</button>
              </div>
            )
          })}
        </div>}
      </div>
    </>
  )
}

// ─── VERZENDKOSTEN CALCULATOR ────────────────────────────────────────────────
function ShippingTab({ calc, save }) {
  const up = (k,v) => { const n = { ...calc, [k]:parseFloat(v)||0 }; save(n) }

  const dimWeight = (calc.lengthCm * calc.widthCm * calc.heightCm) / calc.divisor
  const chargeWeight = Math.max(dimWeight, calc.weightKg)
  const isDim = dimWeight > calc.weightKg

  // Estimate shipping tiers
  const tiers = [
    { label:'PostNL pakket', cost: chargeWeight<=10?6.95:chargeWeight<=23?8.55:13.45 },
    { label:'DHL Parcel NL', cost: chargeWeight<=10?6.50:chargeWeight<=23?8.25:12.95 },
    { label:'DPD NL', cost: chargeWeight<=10?5.95:chargeWeight<=23?7.50:11.50 },
    { label:'UPS Standard', cost: chargeWeight<=10?8.50:chargeWeight<=23?11.00:16.00 },
  ]

  const margin = calc.sellPrice - calc.shipCost
  const marginPct = calc.sellPrice > 0 ? Math.round(margin / calc.sellPrice * 100) : 0

  const inputStyle = {padding:'0.4rem 0.5rem',borderRadius:'6px',border:'1px solid var(--border)',fontSize:'0.82rem',fontFamily:'var(--font-body)',width:'100%',background:'var(--bg-card)'}

  return (
    <div style={{maxWidth:'700px'}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1.5rem'}}>
        {/* Dimensies */}
        <div className="card" style={{padding:'1rem'}}>
          <h4 style={{fontSize:'0.82rem',fontWeight:600,marginBottom:'0.75rem'}}>📐 Pakkettdimensies</h4>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.5rem',marginBottom:'0.5rem'}}>
            <div><label style={{fontSize:'0.65rem',color:'var(--text-secondary)',display:'block',marginBottom:'0.15rem'}}>Lengte (cm)</label>
              <input type="number" value={calc.lengthCm} onChange={e=>up('lengthCm',e.target.value)} style={inputStyle}/></div>
            <div><label style={{fontSize:'0.65rem',color:'var(--text-secondary)',display:'block',marginBottom:'0.15rem'}}>Breedte (cm)</label>
              <input type="number" value={calc.widthCm} onChange={e=>up('widthCm',e.target.value)} style={inputStyle}/></div>
            <div><label style={{fontSize:'0.65rem',color:'var(--text-secondary)',display:'block',marginBottom:'0.15rem'}}>Hoogte (cm)</label>
              <input type="number" value={calc.heightCm} onChange={e=>up('heightCm',e.target.value)} style={inputStyle}/></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem'}}>
            <div><label style={{fontSize:'0.65rem',color:'var(--text-secondary)',display:'block',marginBottom:'0.15rem'}}>Gewicht (kg)</label>
              <input type="number" step="0.1" value={calc.weightKg} onChange={e=>up('weightKg',e.target.value)} style={inputStyle}/></div>
            <div><label style={{fontSize:'0.65rem',color:'var(--text-secondary)',display:'block',marginBottom:'0.15rem'}}>Divisor</label>
              <input type="number" value={calc.divisor} onChange={e=>up('divisor',e.target.value)} style={inputStyle}/></div>
          </div>
        </div>

        {/* Resultaat */}
        <div className="card" style={{padding:'1rem'}}>
          <h4 style={{fontSize:'0.82rem',fontWeight:600,marginBottom:'0.75rem'}}>⚖ Gewicht analyse</h4>
          <div style={{display:'flex',flexDirection:'column',gap:'0.4rem'}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.78rem'}}>
              <span>Actueel gewicht</span><span style={{fontWeight:600}}>{calc.weightKg} kg</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.78rem'}}>
              <span>Dimensioneel gewicht</span><span style={{fontWeight:600,color:isDim?'#DC2626':'var(--text-primary)'}}>{dimWeight.toFixed(1)} kg</span>
            </div>
            <div style={{height:'1px',background:'var(--border)',margin:'0.2rem 0'}}/>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.82rem'}}>
              <span style={{fontWeight:600}}>Factureerbaar gewicht</span>
              <span style={{fontWeight:700,color:isDim?'#DC2626':'#059669'}}>{chargeWeight.toFixed(1)} kg</span>
            </div>
            {isDim && <div style={{fontSize:'0.68rem',color:'#DC2626',fontWeight:600}}>⚠ Dimensioneel gewicht is hoger — je betaalt meer!</div>}
          </div>
        </div>
      </div>

      {/* Carrier vergelijking */}
      <div className="card" style={{padding:'1rem',marginBottom:'1.5rem'}}>
        <h4 style={{fontSize:'0.82rem',fontWeight:600,marginBottom:'0.75rem'}}>🚚 Geschatte verzendkosten (NL binnenland)</h4>
        <div style={{display:'flex',flexDirection:'column',gap:'0.3rem'}}>
          {tiers.map(t => (
            <div key={t.label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.35rem 0',borderBottom:'1px solid rgba(28,25,23,0.04)',fontSize:'0.78rem'}}>
              <span>{t.label}</span>
              <span style={{fontWeight:600}}>€ {t.cost.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div style={{fontSize:'0.65rem',color:'var(--text-secondary)',marginTop:'0.5rem'}}>* Schattingen op basis van publieke tarieven. Echte kosten variëren met contract.</div>
      </div>

      {/* Marge impact */}
      <div className="card" style={{padding:'1rem'}}>
        <h4 style={{fontSize:'0.82rem',fontWeight:600,marginBottom:'0.75rem'}}>💰 Marge-impact per bestelling</h4>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem',marginBottom:'0.5rem'}}>
          <div><label style={{fontSize:'0.65rem',color:'var(--text-secondary)',display:'block',marginBottom:'0.15rem'}}>Verkoopprijs (€)</label>
            <input type="number" value={calc.sellPrice} onChange={e=>up('sellPrice',e.target.value)} style={inputStyle}/></div>
          <div><label style={{fontSize:'0.65rem',color:'var(--text-secondary)',display:'block',marginBottom:'0.15rem'}}>Werkelijke verzendkosten (€)</label>
            <input type="number" step="0.01" value={calc.shipCost} onChange={e=>up('shipCost',e.target.value)} style={inputStyle}/></div>
        </div>
        <div style={{display:'flex',gap:'1rem',padding:'0.5rem',borderRadius:'6px',background:'var(--bg-secondary)',fontSize:'0.78rem'}}>
          <div>Marge na verzending: <strong style={{color:margin>0?'#059669':'#DC2626'}}>{fmt(margin)}</strong></div>
          <div>({marginPct}% van verkoopprijs)</div>
        </div>
        <div style={{fontSize:'0.68rem',color:'var(--text-secondary)',marginTop:'0.4rem'}}>
          Tip: Stel gratis verzending in boven €{Math.ceil(calc.sellPrice*1.5)} om AOV te verhogen — klanten bestellen dan vaker 2+ panelen.
        </div>
      </div>
    </div>
  )
}
