import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function Dashboard({ user }) {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [prodOrders, setProdOrders] = useState([])
  const [inventory, setInventory] = useState([])
  const [artworkStock, setArtworkStock] = useState([])
  const [investments, setInvestments] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    Promise.all([
      api.getAll('tasks').then(setTasks),
      api.getSetting('production_orders').then(v => setProdOrders(v || [])),
      api.getAll('inventory_items').then(v => setInventory(v || [])),
      api.getSetting('artwork_stock').then(v => setArtworkStock(v || [])),
      api.getAll('investments').then(v => setInvestments(v || []))
    ]).finally(() => setLoading(false))
  }, [])
  const today = new Date().toISOString().slice(0,10)
  const name = user?.name || 'Tein'
  const activeTasks = tasks.filter(t => !t.archived && t.status !== 'klaar')
  const todayTasks = tasks.filter(t => t.plannedDate === today && !t.archived && t.status !== 'klaar')
  const overdueTasks = activeTasks.filter(t => t.dueDate && t.dueDate < today)
  const activeProd = prodOrders.filter(o => !['geleverd'].includes(o.stage))
  const lowStock = inventory.filter(i => i.minStock > 0 && i.quantity < i.minStock)
  const totalPanels = artworkStock.reduce((s,a) => s + (a.total||0), 0)
  const totalInvested = investments.reduce((s,i) => s + (i.amount||0), 0)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Goedemorgen' : hour < 18 ? 'Goedemiddag' : 'Goedenavond'
  const dayStr = new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })
  if (loading) return <div style={{padding:'2rem',textAlign:'center',color:'var(--text-secondary)'}}>Laden...</div>
  return (
    <div style={{ padding:'1.5rem' }}>
      <div style={{ marginBottom:'1.5rem' }}>
        <h1 style={{ fontFamily:"'Instrument Serif',serif", fontSize:'1.75rem', margin:0, color:'var(--text-primary)' }}>{greeting}, {name}</h1>
        <p style={{ margin:'0.2rem 0 0', fontSize:'0.85rem', color:'var(--text-secondary)' }}>{dayStr}</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:'0.75rem', marginBottom:'1.5rem' }}>
        <KPI label="Open taken" value={activeTasks.length} sub={overdueTasks.length > 0 ? overdueTasks.length+' te laat' : 'op schema'} color={overdueTasks.length > 0 ? '#DC2626' : '#059669'} onClick={() => navigate('/tasks')} />
        <KPI label="Vandaag" value={todayTasks.length} sub="gepland" color="#D97706" onClick={() => navigate('/tasks')} />
        <KPI label="In productie" value={activeProd.length} sub="orders" color="#8B5CF6" onClick={() => navigate('/production')} />
        <KPI label="Panelen" value={totalPanels} sub={artworkStock.length+' artworks'} color="#06B6D4" onClick={() => navigate('/stock')} />
        <KPI label="Voorraad alerts" value={lowStock.length} sub="onder minimum" color={lowStock.length > 0 ? '#DC2626' : '#059669'} onClick={() => navigate('/inventory')} />
        <KPI label="Geïnvesteerd" value={'€'+(totalInvested/1000).toFixed(1)+'k'} sub={investments.length+' posten'} color="#78716C" onClick={() => navigate('/analytics')} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:'1rem' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.75rem' }}>
            <h3 style={{ margin:0, fontSize:'0.9rem', fontWeight:600 }}>Vandaag</h3>
            <span style={{ fontSize:'0.7rem', color:'var(--text-secondary)' }}>{todayTasks.length} taken</span>
          </div>
          {todayTasks.length === 0 ? <p style={{ fontSize:'0.8rem', color:'var(--text-secondary)', textAlign:'center', padding:'1rem 0' }}>Geen taken gepland</p> : (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
              {todayTasks.slice(0,8).map(t => (
                <div key={t.id} onClick={() => navigate('/tasks')} style={{ display:'flex', alignItems:'center', gap:'0.4rem', padding:'0.3rem 0.5rem', borderRadius:6, background:'var(--bg-secondary)', cursor:'pointer', fontSize:'0.75rem' }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--bg-hover,#f5f5f4)'} onMouseLeave={e => e.currentTarget.style.background='var(--bg-secondary)'}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background: t.priority==='high'?'#DC2626':'#D97706', flexShrink:0 }} />
                  <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.title}</span>
                </div>))}
            </div>)}        </div>
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:'1rem' }}>
          <h3 style={{ margin:'0 0 0.75rem', fontSize:'0.9rem', fontWeight:600 }}>Alerts</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
            {overdueTasks.slice(0,3).map(t => <Alert key={t.id} type="danger" text={'Te laat: '+t.title} onClick={() => navigate('/tasks')} />)}
            {lowStock.map(i => <Alert key={i.id} type="warning" text={i.name+': '+i.quantity+' over (min: '+i.minStock+')'} onClick={() => navigate('/inventory')} />)}
            {activeProd.filter(o => o.stage === 'lijmen').map(o => <Alert key={o.id} type="info" text={'Droogt: '+o.title} onClick={() => navigate('/production')} />)}
            {overdueTasks.length === 0 && lowStock.length === 0 && <p style={{ fontSize:'0.8rem', color:'var(--text-secondary)', textAlign:'center', padding:'1rem 0' }}>Alles op orde ✔</p>}
          </div>
        </div>
      </div>
      {activeProd.length > 0 && (
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:'1rem', marginTop:'1rem' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.75rem' }}>
            <h3 style={{ margin:0, fontSize:'0.9rem', fontWeight:600 }}>Productie</h3>
            <button onClick={() => navigate('/production')} style={{ fontSize:'0.7rem', color:'#D97706', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>Bekijk alles →</button>
          </div>
          <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
            {['nieuw','printen','lijmen','snijden','inlijsten','inpakken','verzonden'].map(stage => {
              const count = activeProd.filter(o => o.stage === stage).length
              if (count === 0) return null
              return <span key={stage} style={{ fontSize:'0.65rem', padding:'0.2rem 0.5rem', borderRadius:6, background:'var(--bg-secondary)', color:'var(--text-primary)', fontWeight:500 }}>{stage}: {count}</span>
            })}
          </div>
        </div>
      )}
    </div>
  )
}
function KPI({ label, value, sub, color, onClick }) {
  return (
    <div onClick={onClick} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:'0.85rem 1rem', cursor:'pointer', transition:'box-shadow 0.15s', borderTop:'3px solid '+color }}
      onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'} onMouseLeave={e => e.currentTarget.style.boxShadow=''}>
      <div style={{ fontSize:'0.65rem', color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:600 }}>{label}</div>
      <div style={{ fontSize:'1.6rem', fontWeight:700, marginTop:'0.2rem', color:'var(--text-primary)' }}>{value}</div>
      {sub && <div style={{ fontSize:'0.62rem', color, marginTop:'0.1rem', fontWeight:500 }}>{sub}</div>}
    </div>
  )
}
function Alert({ type, text, onClick }) {
  const bg = type === 'danger' ? '#FEE2E2' : type === 'warning' ? '#FEF3C7' : '#EFF6FF'
  const c = type === 'danger' ? '#DC2626' : type === 'warning' ? '#92400E' : '#2563EB'
  return (
    <div onClick={onClick} style={{ display:'flex', alignItems:'center', gap:'0.4rem', padding:'0.3rem 0.5rem', borderRadius:6, background:bg, cursor:'pointer', fontSize:'0.7rem', color:c }}>
      <span>⚠</span><span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{text}</span>
    </div>
  )
}