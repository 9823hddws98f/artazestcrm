import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
const LAUNCH_DATE = new Date('2026-04-18T09:00:00')
function getDaysUntilLaunch() {
  const diff = LAUNCH_DATE - new Date()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}
export default function Dashboard({ user }) {
  const [tasks, setTasks] = useState([])
  const [inventory, setInventory] = useState([])
  const [artwork, setArtwork] = useState([])
  const [daysLeft, setDaysLeft] = useState(getDaysUntilLaunch())
  useEffect(() => {
    api.getAll('tasks').then(setTasks)
    api.getAll('inventory').then(setInventory)
    api.getAll('artwork').then(setArtwork)
    const t = setInterval(() => setDaysLeft(getDaysUntilLaunch()), 60000)
    return () => clearInterval(t)
  }, [])
  const open = tasks.filter(t => !t.completed)
  const done = tasks.filter(t => t.completed)
  const total = tasks.length || 1
  const lowStock = inventory.filter(i => i.quantity <= (i.minStock || 5) && i.minStock > 0)
  const needsOrder = inventory.filter(i => i.minStock > 0 && i.quantity < i.minStock)

  // This week's urgent tasks for current user
  const myTasks = open.filter(t => !user || t.assignee === user.name)
  const urgentTasks = open.filter(t => t.priority === 'high')
  return (
    <>
      <div className="page-header">
        <div><h1>Launch Control</h1>
          <p className="page-subtitle">Welkom {user?.name || ''} — Artazest pre-launch dashboard</p>
        </div>
      </div>

      <div className="metric-grid">
        <div className="metric-card"><div className="countdown"><div className="countdown-number">{daysLeft}</div><div className="countdown-label">dagen tot launch</div></div></div>
        <div className="metric-card">
          <div className="metric-label">Taken open</div><div className="metric-value">{open.length}</div>
          <div className="progress-bar" style={{marginTop:'0.5rem'}}><div className="progress-fill" style={{width:`${(done.length/total)*100}%`}}/></div>
          <div style={{fontSize:'0.75rem',color:'var(--text-secondary)',marginTop:'0.25rem'}}>{done.length}/{tasks.length} afgerond</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Moet besteld worden</div>
          <div className="metric-value" style={{color:needsOrder.length>0?'var(--danger)':'var(--success)'}}>{needsOrder.length}</div>
          <div style={{fontSize:'0.75rem',color:'var(--text-secondary)',marginTop:'0.25rem'}}>{needsOrder.length>0?'items onder minimum':'alles op voorraad'}</div>
        </div>
        <div className="metric-card"><div className="metric-label">Artworks</div><div className="metric-value">{artwork.length}</div><div style={{fontSize:'0.75rem',color:'var(--text-secondary)',marginTop:'0.25rem'}}>in pipeline</div></div>
      </div>

      {/* This week banner */}
      {(urgentTasks.length > 0 || needsOrder.length > 0) && (
        <div className="card" style={{marginBottom:'1.5rem',borderLeft:'4px solid var(--accent)',background:'var(--accent-light)'}}>
          <h3 style={{margin:'0 0 0.75rem',color:'var(--accent-text)'}}>Deze week actie nodig</h3>
          <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
            {urgentTasks.slice(0,5).map(t => (
              <div key={t.id} style={{display:'flex',alignItems:'center',gap:'0.5rem',fontSize:'0.85rem'}}>
                <span style={{color:'var(--danger)'}}>●</span>
                <span style={{fontWeight:500}}>{t.title}</span>
                <span style={{fontSize:'0.75rem',color:'var(--accent-text)'}}>{t.assignee}</span>
              </div>
            ))}
            {needsOrder.slice(0,3).map(i => (
              <div key={i.id} style={{display:'flex',alignItems:'center',gap:'0.5rem',fontSize:'0.85rem'}}>
                <span style={{color:'var(--accent)'}}>▦</span>
                <span style={{fontWeight:500}}>Bestellen: {i.name}</span>
                <span style={{fontSize:'0.75rem',color:'var(--accent-text)'}}>{i.quantity}/{i.minStock} — levertijd {i.leadTimeDays}d</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.5rem'}}>
        <div className="card">
          <div className="section-header"><h3 className="section-title">Mijn taken</h3><Link to="/tasks" className="btn btn-sm btn-outline">Alle taken →</Link></div>
          {myTasks.length===0?<div className="empty-state">Geen open taken voor jou</div>:
          <div className="task-list">{myTasks.slice(0,5).map(task=>(
            <div key={task.id} className="task-item">
              <div className="task-checkbox" onClick={async()=>{await api.toggle('tasks',task.id,'completed');api.getAll('tasks').then(setTasks)}}/>
              <div className="task-info"><div className="task-title">{task.title}</div>
                <div className="task-meta">{task.assignee}{task.category&&<> · <span className="badge badge-amber">{task.category}</span></>}
                  {task.priority==='high'&&<> · <span className="badge badge-red">Urgent</span></>}</div>
              </div></div>))}</div>}
        </div>
        <div className="card">
          <div className="section-header"><h3 className="section-title">Voorraad alerts</h3><Link to="/inventory" className="btn btn-sm btn-outline">Voorraad →</Link></div>
          {lowStock.length===0?<div className="empty-state">Alles op voorraad</div>:
          lowStock.map(item=>(<div key={item.id} className="task-item" style={{borderLeft:'3px solid var(--danger)'}}>
            <div className="task-info"><div className="task-title">{item.name}</div><div className="task-meta">{item.quantity} stuks — min {item.minStock}</div></div>
            <span className="badge badge-red">Bestellen</span></div>))}
        </div>
      </div>
    </>
  )
}
