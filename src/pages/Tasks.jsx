import { useState, useEffect } from 'react'
import { api } from '../api'

const ASSIGNEES = ['Tein','Sam','Productie']
const LAUNCH = new Date('2026-04-18T09:00:00')
const CATEGORIES = ['Shopify','Content','Ads','Design','Productie','Juridisch','Email','Verpakking','Overig']
const DEFAULT_STATUSES = [
  { key: 'todo', label: 'To do', color: '#78716C' },
  { key: 'bezig', label: 'Bezig', color: '#D97706' },
  { key: 'klaar', label: 'Klaar', color: '#059669' },
]
const COLORS = ['#78716C','#D97706','#059669','#2563EB','#7C3AED','#DC2626','#0891B2']

function daysUntil(date) {
  if (!date) return null
  const diff = new Date(date) - new Date()
  return Math.ceil(diff / (1000*60*60*24))
}
const daysToLaunch = daysUntil(LAUNCH)
const fmt = d => new Date(d).toLocaleDateString('nl-NL',{day:'numeric',month:'short'})

export default function Tasks({ user }) {
  const [tasks, setTasks] = useState([])
  const [view, setView] = useState('lijst')
  const [showAdd, setShowAdd] = useState(false)
  const [filterUser, setFilterUser] = useState(user?.name || 'all')
  const [editing, setEditing] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const [form, setForm] = useState({title:'',category:'Overig',assignee:user?.name||'Tein',status:'todo',priority:'normal',notes:'',dueDate:'',tags:[]})
  const [tagInput, setTagInput] = useState('')
  const [statuses, setStatuses] = useState(() => {
    const s = localStorage.getItem('artazest_statuses')
    return s ? JSON.parse(s) : DEFAULT_STATUSES
  })
  const [showPhaseEdit, setShowPhaseEdit] = useState(false)
  const [newPhase, setNewPhase] = useState('')

  const saveStatuses = st => { setStatuses(st); localStorage.setItem('artazest_statuses', JSON.stringify(st)) }
  const addPhase = () => {
    if (!newPhase.trim()) return
    const key = newPhase.trim().toLowerCase().replace(/\s+/g,'-')
    if (statuses.find(s=>s.key===key)) return
    const usedColors = statuses.map(s=>s.color)
    const nextColor = COLORS.find(c=>!usedColors.includes(c)) || COLORS[0]
    saveStatuses([...statuses, {key, label: newPhase.trim(), color: nextColor}])
    setNewPhase('')
  }
  const removePhase = key => {
    if (statuses.length <= 2) return
    saveStatuses(statuses.filter(s=>s.key!==key))
    // Move tasks in deleted phase to first phase
    tasks.filter(t=>t.status===key).forEach(async t => { await api.save('tasks',{...t,status:statuses[0].key}); reload() })
  }
  const STATUSES = statuses

  useEffect(() => { reload() }, [])
  const reload = () => api.getAll('tasks').then(setTasks)

  const handleSave = async () => {
    if (!form.title.trim()) return
    await api.save('tasks', { ...form, ...(editing ? {id:editing} : {}), createdAt: form.createdAt || new Date().toISOString() })
    resetForm(); setShowAdd(false); setEditing(null); reload()
  }
  const resetForm = () => setForm({title:'',category:'Overig',assignee:user?.name||'Tein',status:'todo',priority:'normal',notes:'',dueDate:'',tags:[]})
  const del = async id => { await api.remove('tasks',id); setConfirmDel(null); setEditing(null); setShowAdd(false); reload() }
  const startEdit = t => { setForm({...t,tags:t.tags||[]}); setEditing(t.id); setShowAdd(true) }
  const updateStatus = async (id,status) => { const t=tasks.find(x=>x.id===id); if(t){await api.save('tasks',{...t,status,completed:status==='klaar'}); reload()} }
  const archiveTask = async id => { const t=tasks.find(x=>x.id===id); if(t){await api.save('tasks',{...t,archived:true,archivedAt:new Date().toISOString()}); reload()} }

  const addTag = () => { if(tagInput.trim()&&!form.tags.includes(tagInput.trim())){setForm({...form,tags:[...form.tags,tagInput.trim()]});setTagInput('')}}
  const removeTag = t => setForm({...form,tags:form.tags.filter(x=>x!==t)})

  const active = tasks.filter(t => !t.archived)
  const filtered = active.filter(t => filterUser === 'all' || t.assignee === filterUser)
    .sort((a,b) => {
      const p = {high:0,normal:1}; if((p[a.priority]||1)!==(p[b.priority]||1)) return (p[a.priority]||1)-(p[b.priority]||1)
      if(a.dueDate&&b.dueDate) return a.dueDate<b.dueDate?-1:1
      if(a.dueDate&&!b.dueDate) return -1; if(!a.dueDate&&b.dueDate) return 1
      return 0
    })
  const archived = tasks.filter(t => t.archived).sort((a,b) => new Date(b.archivedAt||0)-new Date(a.archivedAt||0))
  const todoCount = filtered.filter(t=>t.status==='todo').length
  const bezigCount = filtered.filter(t=>t.status==='bezig').length
  const klaarCount = filtered.filter(t=>t.status==='klaar').length

  const views = [
    {key:'lijst',label:'Lijst'},
    {key:'kanban',label:'Kanban'},
    {key:'archief',label:`Archief (${archived.length})`},
  ]

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Taken</h1>
          <p className="page-subtitle">
            {todoCount} to do &middot; {bezigCount} bezig &middot; {klaarCount} klaar
            {daysToLaunch > 0 && <span style={{marginLeft:'0.5rem',padding:'0.15rem 0.5rem',borderRadius:'99px',fontSize:'0.75rem',fontWeight:600,background:daysToLaunch<=7?'var(--danger-light)':daysToLaunch<=14?'var(--accent-light)':'var(--info-light)',color:daysToLaunch<=7?'var(--danger)':daysToLaunch<=14?'var(--accent-text)':'var(--info)'}}>{daysToLaunch}d tot launch</span>}
          </p>
        </div>
        <button className="btn btn-primary" onClick={()=>{resetForm();setEditing(null);setShowAdd(true)}}>+ Nieuwe taak</button>
      </div>

      {/* View tabs + user filter */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:'0.5rem'}}>
        <div className="tabs" style={{marginBottom:0,borderBottom:'none'}}>
          {views.map(v => <button key={v.key} className={`tab ${view===v.key?'active':''}`} onClick={()=>setView(v.key)}>{v.label}</button>)}
        </div>
        <div style={{display:'flex',gap:'0.35rem'}}>
          <button className={`btn btn-sm ${filterUser==='all'?'btn-primary':'btn-outline'}`} onClick={()=>setFilterUser('all')}>Alle</button>
          {ASSIGNEES.map(a => <button key={a} className={`btn btn-sm ${filterUser===a?'btn-primary':'btn-outline'}`} onClick={()=>setFilterUser(a)}>{a}</button>)}
          <button className="btn btn-sm btn-outline" onClick={()=>setShowPhaseEdit(!showPhaseEdit)} style={{marginLeft:'0.25rem',fontSize:'0.75rem',color:'var(--text-secondary)'}}>⚙</button>
        </div>
      </div>

      {/* Phase editor */}
      {showPhaseEdit && (
        <div className="card" style={{marginBottom:'1rem',padding:'0.75rem 1rem'}}>
          <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.75rem'}}>
            <span style={{fontSize:'0.8rem',fontWeight:600}}>Fases beheren</span>
            <span style={{fontSize:'0.7rem',color:'var(--text-secondary)'}}>min. 2 fases</span>
          </div>
          <div style={{display:'flex',gap:'0.4rem',flexWrap:'wrap',marginBottom:'0.75rem'}}>
            {statuses.map(s => (
              <div key={s.key} style={{display:'flex',alignItems:'center',gap:'0.3rem',padding:'0.3rem 0.6rem',borderRadius:'99px',border:'1px solid var(--border)',fontSize:'0.8rem'}}>
                <span style={{width:'8px',height:'8px',borderRadius:'50%',background:s.color}}/>
                <span style={{fontWeight:500}}>{s.label}</span>
                {statuses.length > 2 && <button onClick={()=>removePhase(s.key)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',fontSize:'0.7rem',marginLeft:'0.15rem'}}>✕</button>}
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:'0.35rem'}}>
            <input className="form-input" value={newPhase} onChange={e=>setNewPhase(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addPhase()} placeholder="Nieuwe fase..." style={{maxWidth:'180px',padding:'0.3rem 0.6rem',fontSize:'0.8rem'}}/>
            <button className="btn btn-sm btn-outline" onClick={addPhase}>+</button>
          </div>
        </div>
      )}

      {/* KANBAN VIEW */}
      {view === 'kanban' ? (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'1rem'}}>
          {STATUSES.map(st => {
            const col = filtered.filter(t => t.status === st.key)
            return (
              <div key={st.key}>
                <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.75rem',padding:'0.5rem 0.75rem',borderRadius:'var(--radius-md)',background:'var(--bg-secondary)'}}>
                  <span style={{width:'8px',height:'8px',borderRadius:'50%',background:st.color}}/>
                  <span style={{fontSize:'0.82rem',fontWeight:600}}>{st.label}</span>
                  <span style={{fontSize:'0.75rem',color:'var(--text-secondary)',marginLeft:'auto'}}>{col.length}</span>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'0.5rem',minHeight:'100px'}}>
                  {col.map(t => <TaskCard key={t.id} task={t} statuses={STATUSES} onClick={()=>startEdit(t)} onStatusChange={s=>updateStatus(t.id,s)} compact/>)}
                </div>
              </div>
            )
          })}
        </div>
      ) : view === 'archief' ? (
        archived.length === 0 ? <div className="card"><div className="empty-state">Geen gearchiveerde taken</div></div> :
        <div className="task-list">{archived.map(t => (
          <div key={t.id} className="task-item" style={{opacity:0.6}}>
            <div style={{flex:1}}><div className="task-title" style={{textDecoration:'line-through'}}>{t.title}</div>
              <div className="task-meta">{t.assignee} &middot; {t.archivedAt && fmt(t.archivedAt)}</div></div>
            <button className="btn btn-sm btn-outline" onClick={async()=>{const x=tasks.find(a=>a.id===t.id);if(x){await api.save('tasks',{...x,archived:false});reload()}}} style={{fontSize:'0.7rem'}}>Terugzetten</button>
          </div>
        ))}</div>
      ) : (
        /* LIST VIEW */
        filtered.length === 0 ? <div className="card"><div className="empty-state">Geen taken{filterUser!=='all'?` voor ${filterUser}`:''}</div></div> :
        <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
          {filtered.map(t => <TaskCard key={t.id} task={t} statuses={STATUSES} onClick={()=>startEdit(t)} onStatusChange={s=>updateStatus(t.id,s)} onArchive={()=>archiveTask(t.id)}/>)}
        </div>
      )}

      {/* Delete confirm */}
      {confirmDel && (
        <div className="modal-overlay" onClick={()=>setConfirmDel(null)}>
          <div className="modal" style={{maxWidth:'380px',textAlign:'center'}} onClick={e=>e.stopPropagation()}>
            <h3 style={{marginBottom:'0.75rem'}}>Taak verwijderen?</h3>
            <div style={{display:'flex',gap:'0.5rem',justifyContent:'center'}}>
              <button className="btn btn-outline" onClick={()=>setConfirmDel(null)}>Annuleren</button>
              <button className="btn btn-primary" style={{background:'var(--danger)'}} onClick={()=>del(confirmDel)}>Verwijderen</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&(setShowAdd(false),setEditing(null))}>
          <div className="modal" style={{maxWidth:'550px'}}>
            <div className="modal-header"><h3>{editing?'Taak bewerken':'Nieuwe taak'}</h3><button className="modal-close" onClick={()=>{setShowAdd(false);setEditing(null)}}>✕</button></div>
            <div className="form-group"><label className="form-label">Titel</label>
              <input className="form-input" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Wat moet er gebeuren?" autoFocus/></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.75rem'}}>
              <div className="form-group"><label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                  {STATUSES.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Toewijzen</label>
                <select className="form-select" value={form.assignee} onChange={e=>setForm({...form,assignee:e.target.value})}>
                  {ASSIGNEES.map(a=><option key={a}>{a}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Deadline</label>
                <input className="form-input" type="date" value={form.dueDate||''} onChange={e=>setForm({...form,dueDate:e.target.value})}/></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
              <div className="form-group"><label className="form-label">Categorie</label>
                <select className="form-select" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                  {CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Prioriteit</label>
                <div style={{display:'flex',gap:'0.35rem'}}>
                  <button className="btn btn-sm" onClick={()=>setForm({...form,priority:form.priority==='high'?'normal':'high'})}
                    style={{flex:1,justifyContent:'center',fontSize:'0.75rem',background:form.priority==='high'?'var(--danger)':'transparent',color:form.priority==='high'?'#fff':undefined,border:form.priority==='high'?'none':'1px solid var(--border-strong)'}}>Urgent</button>
                </div></div>
            </div>
            <div className="form-group"><label className="form-label">Tags</label>
              <div style={{display:'flex',gap:'0.25rem',flexWrap:'wrap',marginBottom:'0.35rem'}}>
                {(form.tags||[]).map(t=><span key={t} style={{display:'flex',alignItems:'center',gap:'0.2rem',padding:'0.1rem 0.5rem',borderRadius:'99px',fontSize:'0.7rem',fontWeight:600,background:'var(--info-light)',color:'var(--info)'}}>#{t} <button onClick={()=>removeTag(t)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--info)',fontSize:'0.7rem'}}>✕</button></span>)}
              </div>
              <div style={{display:'flex',gap:'0.35rem'}}>
                <input className="form-input" value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addTag())} placeholder="Tag..." style={{fontSize:'0.8rem',padding:'0.3rem 0.6rem'}}/>
                <button className="btn btn-sm btn-outline" onClick={addTag}>+</button>
              </div></div>
            <div className="form-group"><label className="form-label">Notities</label>
              <textarea className="form-textarea" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Details..." rows={2}/></div>
            <div style={{display:'flex',gap:'0.5rem',justifyContent:'space-between'}}>
              <div>{editing && <button className="btn btn-sm" style={{color:'var(--danger)',background:'none',border:'none'}} onClick={()=>setConfirmDel(editing)}>Verwijderen</button>}</div>
              <div style={{display:'flex',gap:'0.5rem'}}>
                <button className="btn btn-outline" onClick={()=>{setShowAdd(false);setEditing(null)}}>Annuleren</button>
                <button className="btn btn-primary" onClick={handleSave}>{editing?'Bijwerken':'Opslaan'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function TaskCard({task:t,statuses:STATUSES,onClick,onStatusChange,onArchive,compact}) {
  const days = daysUntil(t.dueDate)
  const overdue = days !== null && days < 0 && t.status !== 'klaar'
  const today = days === 0 && t.status !== 'klaar'
  const soon = days !== null && days > 0 && days <= 3 && t.status !== 'klaar'
  const st = STATUSES.find(s=>s.key===t.status) || STATUSES[0]

  return (
    <div onClick={onClick} style={{padding:compact?'0.6rem':'0.75rem 1rem',borderRadius:'var(--radius-md)',border:'1px solid var(--border)',cursor:'pointer',background:'var(--bg-card)',transition:'all 0.15s',borderLeft:`3px solid ${t.priority==='high'?'var(--danger)':st.color}`,opacity:t.status==='klaar'?0.6:1}}
      onMouseEnter={e=>e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.06)'}
      onMouseLeave={e=>e.currentTarget.style.boxShadow=''}>
      <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:500,fontSize:compact?'0.82rem':'0.875rem',textDecoration:t.status==='klaar'?'line-through':'none'}}>{t.title}</div>
          <div style={{fontSize:'0.75rem',color:'var(--text-secondary)',marginTop:'0.15rem',display:'flex',gap:'0.4rem',alignItems:'center',flexWrap:'wrap'}}>
            <span>{t.assignee}</span>
            <span className="badge badge-amber" style={{fontSize:'0.65rem'}}>{t.category}</span>
            {t.priority==='high'&&<span className="badge badge-red" style={{fontSize:'0.65rem'}}>Urgent</span>}
            {t.dueDate && <span style={{padding:'0.1rem 0.35rem',borderRadius:'4px',fontSize:'0.65rem',fontWeight:600,background:overdue?'var(--danger-light)':today?'var(--accent-light)':soon?'#FEF3C7':'var(--bg-secondary)',color:overdue?'var(--danger)':today?'var(--accent)':soon?'#92400E':'var(--text-secondary)'}}>{overdue?`${Math.abs(days)}d te laat`:today?'Vandaag':soon?`${days}d`:fmt(t.dueDate)}</span>}
            {(t.tags||[]).map(tag=><span key={tag} style={{fontSize:'0.6rem',color:'var(--info)'}}>#{tag}</span>)}
          </div>
        </div>
        {/* Status buttons */}
        <div style={{display:'flex',gap:'0.2rem'}} onClick={e=>e.stopPropagation()}>
          {STATUSES.map(s=>(
            <button key={s.key} onClick={()=>onStatusChange(s.key)} title={s.label}
              style={{width:compact?'20px':'24px',height:compact?'20px':'24px',borderRadius:'50%',border:t.status===s.key?'none':`2px solid ${s.color}40`,background:t.status===s.key?s.color:'transparent',cursor:'pointer',fontSize:'0.6rem',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>
              {t.status===s.key&&'✓'}
            </button>
          ))}
        </div>
        {!compact && t.status==='klaar' && onArchive && (
          <button onClick={e=>{e.stopPropagation();onArchive()}} style={{background:'none',border:'none',cursor:'pointer',fontSize:'0.7rem',color:'var(--text-secondary)',whiteSpace:'nowrap'}}>Archiveer</button>
        )}
      </div>
    </div>
  )
}