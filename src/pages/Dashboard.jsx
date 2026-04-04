import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
const LAUNCH_DATE = new Date('2026-04-18T09:00:00')
function getDaysUntilLaunch() {
  const diff = LAUNCH_DATE - new Date()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}
export default function Dashboard() {
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
  const lowStock = inventory.filter(i => i.quantity <= (i.minStock || 5))
  return (
    <>
      <div className="page-header">
        <div><h1>Launch Control</h1><p className="page-subtitle">Artazest Shopify — pre-launch dashboard</p></div>
      </div>
      <div className="metric-grid">
        <div className="metric-card"><div className="countdown"><div className="countdown-number">{daysLeft}</div><div className="countdown-label">dagen tot launch</div></div></div>
        <div className="metric-card">
          <div className="metric-label">Taken open</div><div className="metric-value">{open.length}</div>
          <div className="progress-bar" style={{marginTop:'0.5rem'}}><div className="progress-fill" style={{width:`${(done.length/total)*100}%`}}/></div>
          <div style={{fontSize:'0.75rem',color:'var(--text-secondary)',marginTop:'0.25rem'}}>{done.length}/{tasks.length} afgerond</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Voorraad alerts</div>
          <div className="metric-value" style={{color:lowStock.length>0?'var(--danger)':'var(--success)'}}>{lowStock.length}</div>
          <div style={{fontSize:'0.75rem',color:'var(--text-secondary)',marginTop:'0.25rem'}}>{lowStock.length>0?'items onder minimum':'alles op voorraad'}</div>
        </div>
        <div className="metric-card"><div className="metric-label">Artworks</div><div className="metric-value">{artwork.length}</div><div style={{fontSize:'0.75rem',color:'var(--text-secondary)',marginTop:'0.25rem'}}>in pipeline</div></div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.5rem'}}>
        <div className="card">
          <div className="section-header"><h3 className="section-title">Open taken</h3><Link to="/tasks" className="btn btn-sm btn-outline">Alle taken →</Link></div>
          {open.length===0?<div className="empty-state">Geen open taken</div>:
          <div className="task-list">{open.slice(0,5).map(task=>(
            <div key={task.id} className="task-item">
              <div className="task-checkbox" onClick={async()=>{await api.toggle('tasks',task.id,'completed');api.getAll('tasks').then(setTasks)}}/>
              <div className="task-info"><div className="task-title">{task.title}</div>
                <div className="task-meta">{task.assignee}{task.category&&<> · <span className="badge badge-amber">{task.category}</span></>}</div>
              </div></div>))}</div>}
        </div>
        <div className="card">
          <div className="section-header"><h3 className="section-title">Voorraad alerts</h3><Link to="/inventory" className="btn btn-sm btn-outline">Alle voorraad →</Link></div>
          {lowStock.length===0?<div className="empty-state">Alle voorraden op peil</div>:
          lowStock.map(item=>(<div key={item.id} className="task-item" style={{borderLeft:'3px solid var(--danger)'}}>
            <div className="task-info"><div className="task-title">{item.name}</div><div className="task-meta">{item.quantity} stuks — min {item.minStock||5}</div></div>
            <span className="badge badge-red">Laag</span></div>))}
        </div>
      </div>
    </>)
}
