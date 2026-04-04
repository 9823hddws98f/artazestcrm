import { useState, useEffect } from 'react'
import { api } from '../api'
const CATEGORIES = ['Shopify','Content','Ads','Design','Productie','Juridisch','Email','SEO','Overig']
const ASSIGNEES = ['Tein','Sam','Productie']
export default function Tasks({ user }) {
  const [tasks, setTasks] = useState([])
  const [tab, setTab] = useState('daily')
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState({title:'',category:'Overig',assignee:'Tein',type:'daily',priority:'medium',notes:'',completed:false})
  useEffect(() => { api.getAll('tasks').then(setTasks) }, [])
  const reload = () => api.getAll('tasks').then(setTasks)
  const filtered = tasks.filter(t=>t.type===tab).filter(t=>filter==='all'||t.assignee===filter)
    .sort((a,b)=>{if(a.completed!==b.completed)return a.completed?1:-1;const p={high:0,medium:1,low:2};return(p[a.priority]||1)-(p[b.priority]||1)})
  const handleSave = async () => {
    if(!form.title.trim())return
    await api.save('tasks',{...form,type:tab,createdAt:new Date().toISOString()})
    setForm({title:'',category:'Overig',assignee:'Tein',type:tab,priority:'medium',notes:'',completed:false})
    setShowAdd(false); reload()
  }
  const toggleTask = async(id)=>{await api.toggle('tasks',id,'completed');reload()}
  const deleteTask = async(id)=>{await api.remove('tasks',id);reload()}
  return (
    <>
      <div className="page-header">
        <div><h1>Taken</h1><p className="page-subtitle">{filtered.filter(t=>!t.completed).length} open · {filtered.filter(t=>t.completed).length} afgerond</p></div>
        <button className="btn btn-primary" onClick={()=>{setForm({...form,type:tab});setShowAdd(true)}}>+ Nieuwe taak</button>
      </div>
      <div className="tabs">
        <button className={`tab ${tab==='daily'?'active':''}`} onClick={()=>setTab('daily')}>Dagelijks</button>
        <button className={`tab ${tab==='weekly'?'active':''}`} onClick={()=>setTab('weekly')}>Wekelijks</button>
        <button className={`tab ${tab==='checklist'?'active':''}`} onClick={()=>setTab('checklist')}>Launch checklist</button>
      </div>
      <div style={{display:'flex',gap:'0.5rem',marginBottom:'1rem'}}>
        <button className={`btn btn-sm ${filter==='all'?'btn-primary':'btn-outline'}`} onClick={()=>setFilter('all')}>Alle</button>
        {ASSIGNEES.map(a=><button key={a} className={`btn btn-sm ${filter===a?'btn-primary':'btn-outline'}`} onClick={()=>setFilter(a)}>{a}</button>)}
      </div>
      {filtered.length===0?<div className="card"><div className="empty-state">Geen taken in deze view</div></div>:
      <div className="task-list">{filtered.map(task=>(
        <div key={task.id} className={`task-item ${task.completed?'completed':''}`}>
          <div className={`task-checkbox ${task.completed?'checked':''}`} onClick={()=>toggleTask(task.id)}/>
          <div className="task-info">
            <div className="task-title">{task.title}</div>
            <div className="task-meta"><span>{task.assignee}</span>
              {task.category&&<> · <span className="badge badge-amber">{task.category}</span></>}
              {task.priority==='high'&&<> · <span className="badge badge-red">Urgent</span></>}
              {task.notes&&<> · <span title={task.notes} style={{cursor:'help'}}>📝</span></>}
            </div>
          </div>
          <button onClick={()=>deleteTask(task.id)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',fontSize:'0.8rem'}}>✕</button>
        </div>))}</div>}
      {showAdd&&<div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
        <div className="modal">
          <div className="modal-header"><h3>Nieuwe taak</h3><button className="modal-close" onClick={()=>setShowAdd(false)}>✕</button></div>
          <div className="form-group"><label className="form-label">Titel</label>
            <input className="form-input" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Wat moet er gebeuren?" autoFocus/></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
            <div className="form-group"><label className="form-label">Categorie</label>
              <select className="form-select" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Toewijzen aan</label>
              <select className="form-select" value={form.assignee} onChange={e=>setForm({...form,assignee:e.target.value})}>{ASSIGNEES.map(a=><option key={a}>{a}</option>)}</select></div>
          </div>
          <div className="form-group"><label className="form-label">Prioriteit</label>
            <div style={{display:'flex',gap:'0.5rem'}}>
              {['high','medium','low'].map(p=><button key={p} className={`btn btn-sm ${form.priority===p?'btn-primary':'btn-outline'}`}
                onClick={()=>setForm({...form,priority:p})}>{p==='high'?'🔴 Urgent':p==='medium'?'🟡 Normaal':'🟢 Laag'}</button>)}
            </div></div>
          <div className="form-group"><label className="form-label">Notities</label>
            <textarea className="form-textarea" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Extra details..."/></div>
          <div style={{display:'flex',gap:'0.5rem',justifyContent:'flex-end'}}>
            <button className="btn btn-outline" onClick={()=>setShowAdd(false)}>Annuleren</button>
            <button className="btn btn-primary" onClick={handleSave}>Opslaan</button>
          </div>
        </div>
      </div>}
    </>)
}
