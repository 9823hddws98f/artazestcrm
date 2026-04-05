import { useState, useEffect } from 'react'
import { api } from '../api'
const CATEGORIES = ['Shopify','Content','Ads','Design','Productie','Juridisch','Email','SEO','Overig']
const ASSIGNEES = ['Tein','Sam','Productie']
export default function Tasks({ user }) {
  const [tasks, setTasks] = useState([])
  const [tab, setTab] = useState('daily')
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [form, setForm] = useState({title:'',category:'Overig',assignee:'Tein',type:'daily',priority:'medium',notes:'',dueDate:'',completed:false})
  useEffect(() => { reload() }, [])
  const reload = () => api.getAll('tasks').then(setTasks)
  const handleSave = async () => {
    if (!form.title.trim()) return
    await api.save('tasks', { ...form, type: tab, createdAt: form.createdAt || new Date().toISOString() })
    setForm({title:'',category:'Overig',assignee:'Tein',type:tab,priority:'medium',notes:'',dueDate:'',completed:false})
    setShowAdd(false); setEditing(null); reload()
  }
  const toggleTask = async (id) => { await api.toggle('tasks', id, 'completed'); reload() }
  const del = async (id) => { await api.remove('tasks', id); setConfirmDel(null); reload() }
  const updateField = async (item, field, value) => { await api.save('tasks', { ...item, [field]: value }); reload() }
  const startEdit = (task) => { setForm({...task}); setEditing(task.id); setShowAdd(true) }
  const filtered = tasks.filter(t => t.type === tab).filter(t => filter === 'all' || t.assignee === filter)
    .sort((a, b) => { if (a.completed !== b.completed) return a.completed ? 1 : -1; const p = {high:0,medium:1,low:2}; return (p[a.priority]||1) - (p[b.priority]||1) })
  const openCount = filtered.filter(t => !t.completed).length
  const doneCount = filtered.filter(t => t.completed).length
  // Category progress
  const catProgress = CATEGORIES.map(c => {
    const ct = tasks.filter(t => t.type === tab && t.category === c)
    if (ct.length === 0) return null
    const done = ct.filter(t => t.completed).length
    return { cat: c, total: ct.length, done, pct: Math.round((done / ct.length) * 100) }
  }).filter(Boolean)
  // Due dates
  const today = new Date().toISOString().slice(0, 10)
  const isOverdue = (t) => t.dueDate && t.dueDate < today && !t.completed
  const isDueToday = (t) => t.dueDate === today && !t.completed
  return (
    <>
      <div className="page-header">
        <div>
          <h1>Taken</h1>
          <p className="page-subtitle">{openCount} open &middot; {doneCount} afgerond</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm({title:'',category:'Overig',assignee:user?.name||'Tein',type:tab,priority:'medium',notes:'',dueDate:'',completed:false}); setEditing(null); setShowAdd(true) }}>+ Nieuwe taak</button>
      </div>
      {/* Category progress */}
      {catProgress.length > 0 && (
        <div style={{display:'flex',gap:'0.5rem',marginBottom:'1.25rem',flexWrap:'wrap'}}>
          {catProgress.map(cp => (
            <div key={cp.cat} style={{background:'#F2F0EB',borderRadius:'8px',padding:'0.4rem 0.75rem',fontSize:'0.75rem',display:'flex',alignItems:'center',gap:'0.5rem',minWidth:'100px'}}>
              <span style={{fontWeight:600}}>{cp.cat}</span>
              <div style={{flex:1,height:'4px',borderRadius:'2px',background:'rgba(28,25,23,0.1)',minWidth:'40px',overflow:'hidden'}}>
                <div style={{height:'100%',borderRadius:'2px',width:`${cp.pct}%`,background:cp.pct===100?'#059669':'#D97706',transition:'width 0.3s'}}/>
              </div>
              <span style={{color:'#78716C',fontSize:'0.7rem'}}>{cp.done}/{cp.total}</span>
            </div>
          ))}
        </div>
      )}
      <div className="tabs">
        <button className={`tab ${tab==='daily'?'active':''}`} onClick={() => setTab('daily')}>Dagelijks</button>
        <button className={`tab ${tab==='weekly'?'active':''}`} onClick={() => setTab('weekly')}>Wekelijks</button>
        <button className={`tab ${tab==='checklist'?'active':''}`} onClick={() => setTab('checklist')}>Launch checklist</button>
      </div>
      <div style={{display:'flex',gap:'0.5rem',marginBottom:'1rem'}}>
        <button className={`btn btn-sm ${filter==='all'?'btn-primary':'btn-outline'}`} onClick={() => setFilter('all')}>Alle</button>
        {ASSIGNEES.map(a => <button key={a} className={`btn btn-sm ${filter===a?'btn-primary':'btn-outline'}`} onClick={() => setFilter(a)}>{a}</button>)}
      </div>
      {filtered.length === 0 ? (
        <div className="card"><div className="empty-state">Geen taken in deze view</div></div>
      ) : (
        <div className="task-list">
          {filtered.map(task => {
            const overdue = isOverdue(task)
            const dueToday = isDueToday(task)
            const isExp = expanded === task.id
            return (
              <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}
                style={{flexDirection:'column',alignItems:'stretch',gap:0,
                  borderLeft: overdue ? '3px solid #DC2626' : dueToday ? '3px solid #D97706' : undefined}}>
                <div style={{display:'flex',alignItems:'center',gap:'0.75rem',width:'100%'}}>
                  <div className={`task-checkbox ${task.completed ? 'checked' : ''}`} onClick={() => toggleTask(task.id)} />
                  <div style={{flex:1,minWidth:0,cursor:'pointer'}} onClick={() => setExpanded(isExp ? null : task.id)}>
                    <div className="task-title">{task.title}</div>
                    <div className="task-meta">
                      <span>{task.assignee}</span>
                      {task.category && <> &middot; <span className="badge badge-amber">{task.category}</span></>}
                      {task.priority === 'high' && <> &middot; <span className="badge badge-red">Urgent</span></>}
                      {task.dueDate && <> &middot; <span style={{color: overdue ? '#DC2626' : dueToday ? '#D97706' : '#78716C'}}>{overdue ? 'Te laat: ' : dueToday ? 'Vandaag: ' : ''}{task.dueDate}</span></>}
                    </div>
                  </div>
                  <button onClick={() => startEdit(task)} style={{background:'none',border:'none',cursor:'pointer',color:'#78716C',fontSize:'0.8rem'}} title="Bewerken">&#9998;</button>
                  <button onClick={() => setConfirmDel(task.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#78716C',fontSize:'0.8rem',opacity:0.4}} title="Verwijderen">&times;</button>
                </div>
                {/* Expanded notes */}
                {isExp && task.notes && (
                  <div style={{marginTop:'0.5rem',marginLeft:'2.75rem',padding:'0.5rem 0.75rem',background:'#FAFAF7',borderRadius:'6px',fontSize:'0.82rem',color:'#78716C',borderLeft:'2px solid rgba(28,25,23,0.1)'}}>
                    {task.notes}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      {/* Delete confirmation */}
      {confirmDel && (
        <div className="modal-overlay" onClick={() => setConfirmDel(null)}>
          <div className="modal" style={{maxWidth:'380px',textAlign:'center'}} onClick={e => e.stopPropagation()}>
            <h3 style={{marginBottom:'0.75rem'}}>Taak verwijderen?</h3>
            <p style={{fontSize:'0.85rem',color:'#78716C',marginBottom:'1.25rem'}}>Deze taak wordt permanent verwijderd.</p>
            <div style={{display:'flex',gap:'0.5rem',justifyContent:'center'}}>
              <button className="btn btn-outline" onClick={() => setConfirmDel(null)}>Annuleren</button>
              <button className="btn btn-primary" style={{background:'#DC2626'}} onClick={() => del(confirmDel)}>Verwijderen</button>
            </div>
          </div>
        </div>
      )}
      {/* Add/Edit modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="modal">
            <div className="modal-header"><h3>{editing ? 'Taak bewerken' : 'Nieuwe taak'}</h3><button className="modal-close" onClick={() => { setShowAdd(false); setEditing(null) }}>&times;</button></div>
            <div className="form-group"><label className="form-label">Titel</label>
              <input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Wat moet er gebeuren?" autoFocus /></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
              <div className="form-group"><label className="form-label">Categorie</label>
                <select className="form-select" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Toewijzen aan</label>
                <select className="form-select" value={form.assignee} onChange={e => setForm({...form, assignee: e.target.value})}>{ASSIGNEES.map(a => <option key={a}>{a}</option>)}</select></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
              <div className="form-group"><label className="form-label">Deadline</label>
                <input className="form-input" type="date" value={form.dueDate || ''} onChange={e => setForm({...form, dueDate: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Prioriteit</label>
                <div style={{display:'flex',gap:'0.35rem'}}>
                  {['high','medium','low'].map(p => <button key={p} className={`btn btn-sm ${form.priority===p?'btn-primary':'btn-outline'}`}
                    onClick={() => setForm({...form,priority:p})} style={{flex:1,justifyContent:'center',fontSize:'0.75rem'}}>
                    {p==='high'?'Urgent':p==='medium'?'Normaal':'Laag'}</button>)}
                </div></div>
            </div>
            <div className="form-group"><label className="form-label">Notities</label>
              <textarea className="form-textarea" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Extra details, subtaken..." /></div>
            <div style={{display:'flex',gap:'0.5rem',justifyContent:'flex-end'}}>
              <button className="btn btn-outline" onClick={() => { setShowAdd(false); setEditing(null) }}>Annuleren</button>
              <button className="btn btn-primary" onClick={handleSave}>{editing ? 'Bijwerken' : 'Opslaan'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}