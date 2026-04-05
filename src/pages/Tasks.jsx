import { useState, useEffect } from 'react'
import { api } from '../api'
const DEFAULT_CATS = ['Shopify','Content','Ads','Design','Productie','Juridisch','Email','SEO','Overig']
const ASSIGNEES = ['Tein','Sam','Productie']
const LAUNCH = new Date('2026-04-18T09:00:00')
export default function Tasks({ user }) {
  const [tasks, setTasks] = useState([])
  const [tab, setTab] = useState('daily')
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('artazest_categories')
    return saved ? JSON.parse(saved) : DEFAULT_CATS
  })
  const [newCat, setNewCat] = useState('')
  const [showCatEdit, setShowCatEdit] = useState(false)
  const [form, setForm] = useState({title:'',category:'Overig',assignee:'Tein',type:'daily',priority:'normal',notes:'',dueDate:'',completed:false,tags:[],timeMin:0,signal:false})
  const [tagInput, setTagInput] = useState('')
  useEffect(() => { reload() }, [])
  const reload = () => api.getAll('tasks').then(setTasks)
  const handleSave = async () => {
    if (!form.title.trim()) return
    await api.save('tasks', { ...form, type: tab === 'timeline' ? 'checklist' : tab, createdAt: form.createdAt || new Date().toISOString() })
    setForm({title:'',category:'Overig',assignee:user?.name||'Tein',type:tab,priority:'normal',notes:'',dueDate:'',completed:false,tags:[],timeMin:0,signal:false})
    setShowAdd(false); setEditing(null); reload()
  }
  const toggleTask = async (id) => { await api.toggle('tasks', id, 'completed'); reload() }
  const del = async (id) => { await api.remove('tasks', id); setConfirmDel(null); reload() }
  const startEdit = (task) => { setForm({...task, tags: task.tags||[], timeMin: task.timeMin||0, signal: task.signal||false}); setEditing(task.id); setShowAdd(true) }
  const addTag = () => { if (tagInput.trim() && !form.tags.includes(tagInput.trim())) { setForm({...form, tags:[...form.tags, tagInput.trim()]}); setTagInput('') } }
  const removeTag = (t) => setForm({...form, tags: form.tags.filter(x=>x!==t)})
  const addCategory = () => { if (newCat.trim() && !categories.includes(newCat.trim())) { const c = [...categories, newCat.trim()]; setCategories(c); localStorage.setItem('artazest_categories',JSON.stringify(c)); setNewCat('') } }
  const removeCat = (c) => { const nc = categories.filter(x=>x!==c); setCategories(nc); localStorage.setItem('artazest_categories',JSON.stringify(nc)) }
  const archiveTask = async (id) => {
    const t = tasks.find(x => x.id === id)
    if (t) { await api.save('tasks', { ...t, archived: true, archivedAt: new Date().toISOString() }); reload() }
  }
  const unarchiveTask = async (id) => {
    const t = tasks.find(x => x.id === id)
    if (t) { await api.save('tasks', { ...t, archived: false, archivedAt: null }); reload() }
  }
  const archiveAllDone = async () => {
    const done = tasks.filter(t => t.completed && !t.archived && t.type === (tab==='timeline'?'checklist':tab))
    for (const t of done) await api.save('tasks', { ...t, archived: true, archivedAt: new Date().toISOString() })
    reload()
  }
  const archivedTasks = tasks.filter(t => t.archived).sort((a,b) => new Date(b.archivedAt||0) - new Date(a.archivedAt||0))
  const filtered = tasks.filter(t => !t.archived && t.type === (tab==='timeline'?'checklist':tab)).filter(t => filter === 'all' || t.assignee === filter)
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      if ((a.signal||false) !== (b.signal||false)) return a.signal ? -1 : 1
      // Sort by deadline (soonest first, no deadline last)
      if (!a.completed && !b.completed && (a.dueDate || b.dueDate)) {
        if (a.dueDate && !b.dueDate) return -1; if (!a.dueDate && b.dueDate) return 1
        if (a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1
      }
      const p = {high:0,medium:1,low:2}; return (p[a.priority]||1) - (p[b.priority]||1)
    })
  const openCount = filtered.filter(t => !t.completed).length
  const doneCount = filtered.filter(t => t.completed).length
  const totalTimeMin = filtered.filter(t => !t.completed).reduce((s,t) => s + (t.timeMin||0), 0)
  const today = new Date().toISOString().slice(0, 10)
  const isOverdue = (t) => t.dueDate && t.dueDate < today && !t.completed
  const isDueToday = (t) => t.dueDate === today && !t.completed
  const catProgress = categories.map(c => {
    const ct = tasks.filter(t => !t.archived && t.type === (tab==='timeline'?'checklist':tab) && t.category === c)
    if (ct.length === 0) return null
    return { cat: c, total: ct.length, done: ct.filter(t => t.completed).length, pct: Math.round((ct.filter(t=>t.completed).length / ct.length) * 100) }
  }).filter(Boolean)
  // Timeline data (2 weeks)
  const timelineDays = []
  for (let i = 0; i < 14; i++) {
    const d = new Date(); d.setDate(d.getDate() + i)
    timelineDays.push(d.toISOString().slice(0, 10))
  }
  const timelineTasks = tasks.filter(t => !t.archived && t.type === 'checklist' && t.dueDate && !t.completed)
  return (
    <>
      <div className="page-header">
        <div>
          <h1>Taken</h1>
          <p className="page-subtitle">{openCount} open &middot; {doneCount} afgerond
            {totalTimeMin > 0 && <span> &middot; ~{totalTimeMin >= 60 ? Math.round(totalTimeMin/60) + 'u' : totalTimeMin + 'min'} werk</span>}
          </p>
        </div>
        <div style={{display:'flex',gap:'0.5rem'}}>
          <button className="btn btn-outline btn-sm" onClick={()=>setShowCatEdit(!showCatEdit)}>Tags &amp; categorie&euml;n</button>
          <button className="btn btn-primary" onClick={() => { setForm({title:'',category:'Overig',assignee:user?.name||'Tein',type:tab==='timeline'?'checklist':tab,priority:'normal',notes:'',dueDate:'',completed:false,tags:[],timeMin:0,signal:false}); setEditing(null); setShowAdd(true) }}>+ Nieuwe taak</button>
        </div>
      </div>
      {showCatEdit && (
        <div className="card" style={{marginBottom:'1.5rem'}}>
          <h3 style={{marginBottom:'0.75rem',fontSize:'1rem'}}>Categorie&euml;n beheren</h3>
          <div style={{display:'flex',flexWrap:'wrap',gap:'0.35rem',marginBottom:'0.75rem'}}>
            {categories.map(c => (
              <span key={c} style={{display:'flex',alignItems:'center',gap:'0.3rem',padding:'0.2rem 0.6rem',borderRadius:'99px',fontSize:'0.75rem',fontWeight:600,background:'#FEF3C7',color:'#92400E'}}>
                {c} <button onClick={()=>removeCat(c)} style={{background:'none',border:'none',cursor:'pointer',color:'#92400E',fontSize:'0.7rem'}}>&times;</button>
              </span>
            ))}
          </div>
          <div style={{display:'flex',gap:'0.5rem'}}>
            <input className="form-input" value={newCat} onChange={e=>setNewCat(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addCategory()} placeholder="Nieuwe categorie..." style={{maxWidth:'200px',padding:'0.35rem 0.6rem',fontSize:'0.8rem'}}/>
            <button className="btn btn-sm btn-outline" onClick={addCategory}>Toevoegen</button>
          </div>
        </div>
      )}
      {catProgress.length > 0 && tab !== 'timeline' && (
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
        <button className={`tab ${tab==='daily'?'active':''}`} onClick={()=>setTab('daily')}>Dagelijks</button>
        <button className={`tab ${tab==='weekly'?'active':''}`} onClick={()=>setTab('weekly')}>Wekelijks</button>
        <button className={`tab ${tab==='checklist'?'active':''}`} onClick={()=>setTab('checklist')}>Launch checklist</button>
        <button className={`tab ${tab==='timeline'?'active':''}`} onClick={()=>setTab('timeline')}>2-weken timeline</button>
        <button className={`tab ${tab==='archief'?'active':''}`} onClick={()=>setTab('archief')} style={{marginLeft:'auto',color:tab==='archief'?undefined:'var(--text-secondary)'}}>Archief ({archivedTasks.length})</button>
      </div>
      {tab !== 'timeline' && tab !== 'archief' && (
        <div style={{display:'flex',gap:'0.5rem',marginBottom:'1rem',alignItems:'center'}}>
          <button className={`btn btn-sm ${filter==='all'?'btn-primary':'btn-outline'}`} onClick={()=>setFilter('all')}>Alle</button>
          {ASSIGNEES.map(a => <button key={a} className={`btn btn-sm ${filter===a?'btn-primary':'btn-outline'}`} onClick={()=>setFilter(a)}>{a}</button>)}
          {filtered.filter(t => t.completed).length > 0 && (
            <button className="btn btn-sm btn-outline" onClick={archiveAllDone} style={{marginLeft:'auto',fontSize:'0.75rem',color:'var(--text-secondary)'}}>
              Archiveer {filtered.filter(t => t.completed).length} afgeronde →
            </button>
          )}
        </div>
      )}
      {/* ARCHIVE VIEW */}
      {tab === 'archief' ? (
        archivedTasks.length === 0 ? (
          <div className="card"><div className="empty-state">Geen gearchiveerde taken</div></div>
        ) : (
          <div className="task-list">
            {archivedTasks.map(task => (
              <div key={task.id} className="task-item completed" style={{opacity:0.7}}>
                <div style={{flex:1,minWidth:0}}>
                  <div className="task-title" style={{textDecoration:'line-through'}}>{task.title}</div>
                  <div className="task-meta">
                    <span>{task.assignee}</span>
                    {task.category && <> &middot; <span className="badge badge-amber">{task.category}</span></>}
                    {task.archivedAt && <> &middot; <span style={{color:'var(--text-secondary)'}}>Gearchiveerd {new Date(task.archivedAt).toLocaleDateString('nl-NL')}</span></>}
                  </div>
                </div>
                <button className="btn btn-sm btn-outline" onClick={()=>unarchiveTask(task.id)} style={{fontSize:'0.7rem'}}>Terugzetten</button>
                <button onClick={()=>setConfirmDel(task.id)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--danger)',fontSize:'0.8rem'}}>✕</button>
              </div>
            ))}
          </div>
        )
      ) :
      /* TIMELINE VIEW */
      tab === 'timeline' ? (
        <div className="card" style={{padding:'1rem',overflowX:'auto'}}>
          <div style={{display:'flex',gap:0,minWidth:'700px'}}>
            {timelineDays.map((day,di) => {
              const dayTasks = timelineTasks.filter(t => t.dueDate === day)
              const isToday = day === today
              const d = new Date(day)
              const label = d.toLocaleDateString('nl-NL',{weekday:'short',day:'numeric',month:'short'})
              return (
                <div key={day} style={{flex:1,borderRight:di<13?'1px solid rgba(28,25,23,0.06)':'none',padding:'0.25rem',minWidth:'50px'}}>
                  <div style={{textAlign:'center',fontSize:'0.65rem',fontWeight:600,color:isToday?'#D97706':'#78716C',textTransform:'uppercase',letterSpacing:'0.03em',marginBottom:'0.5rem',padding:'0.25rem',borderRadius:'4px',background:isToday?'#FEF3C7':'transparent'}}>{label}</div>
                  {dayTasks.map(t => (
                    <div key={t.id} onClick={()=>startEdit(t)} style={{padding:'0.25rem 0.35rem',marginBottom:'0.25rem',borderRadius:'4px',fontSize:'0.65rem',fontWeight:500,cursor:'pointer',background:t.signal?'#DBEAFE':t.priority==='high'?'#FEE2E2':'#D1FAE5',color:t.signal?'#1E40AF':t.priority==='high'?'#991B1B':'#065F46',lineHeight:1.3,wordBreak:'break-word'}}>
                      {t.title.slice(0,30)}{t.title.length>30?'...':''}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
          {timelineTasks.length === 0 && <div style={{textAlign:'center',padding:'1rem',color:'#78716C',fontSize:'0.85rem'}}>Geen taken met deadlines. Voeg deadlines toe aan je launch checklist taken.</div>}
        </div>
      ) : (
        /* REGULAR LIST VIEW */
        filtered.length === 0 ? (
          <div className="card"><div className="empty-state">Geen taken in deze view</div></div>
        ) : (
          <div className="task-list">
            {filtered.map(task => {
              const overdue = isOverdue(task)
              const dueToday = isDueToday(task)
              return (
                <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}
                  style={{flexDirection:'column',alignItems:'stretch',gap:0,cursor:'pointer',transition:'background 0.1s',
                    borderLeft: task.signal ? '3px solid #2563EB' : overdue ? '3px solid #DC2626' : dueToday ? '3px solid #D97706' : undefined}}
                  onMouseEnter={e=>e.currentTarget.style.background='#F2F0EB'}
                  onMouseLeave={e=>e.currentTarget.style.background=''}>
                  <div style={{display:'flex',alignItems:'center',gap:'0.75rem',width:'100%'}}>
                    <div className={`task-checkbox ${task.completed ? 'checked' : ''}`} onClick={e=>{e.stopPropagation();toggleTask(task.id)}} />
                    <div style={{flex:1,minWidth:0}} onClick={()=>startEdit(task)}>
                      <div className="task-title" style={{display:'flex',alignItems:'center',gap:'0.4rem'}}>
                        {task.signal && <span style={{fontSize:'0.7rem',color:'#2563EB'}} title="Signal">&#9733;</span>}
                        {task.title}
                      </div>
                      <div className="task-meta">
                        <span>{task.assignee}</span>
                        {task.category && <> &middot; <span className="badge badge-amber">{task.category}</span></>}
                        {task.priority === 'high' && <> &middot; <span className="badge badge-red">Urgent</span></>}
                        {task.timeMin > 0 && <> &middot; <span style={{color:'#78716C'}}>{task.timeMin}min</span></>}
                        {task.dueDate && <> &middot; <span style={{padding:'0.1rem 0.4rem',borderRadius:'4px',fontSize:'0.7rem',fontWeight:600,background:overdue?'#FEE2E2':dueToday?'#FEF3C7':'var(--bg-secondary)',color:overdue?'#DC2626':dueToday?'#D97706':'#78716C'}}>{overdue?'⚠ ':dueToday?'▸ ':''}{new Date(task.dueDate).toLocaleDateString('nl-NL',{day:'numeric',month:'short'})}</span></>}
                      </div>
                      {(task.tags||[]).length > 0 && (
                        <div style={{display:'flex',gap:'0.25rem',marginTop:'0.25rem',flexWrap:'wrap'}}>
                          {task.tags.map(t => <span key={t} style={{padding:'0.1rem 0.4rem',borderRadius:'99px',fontSize:'0.6rem',fontWeight:600,background:'#DBEAFE',color:'#1E40AF'}}>#{t}</span>)}
                        </div>
                      )}
                    </div>
                    {task.completed && <button onClick={e=>{e.stopPropagation();archiveTask(task.id)}} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',fontSize:'0.7rem',whiteSpace:'nowrap'}}>Archiveer</button>}
                    <button onClick={e=>{e.stopPropagation();setConfirmDel(task.id)}} style={{background:'none',border:'none',cursor:'pointer',color:'#78716C',fontSize:'0.8rem',opacity:0.3}}>×</button>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}
      {/* Delete confirm */}
      {confirmDel && (
        <div className="modal-overlay" onClick={()=>setConfirmDel(null)}>
          <div className="modal" style={{maxWidth:'380px',textAlign:'center'}} onClick={e=>e.stopPropagation()}>
            <h3 style={{marginBottom:'0.75rem'}}>Taak verwijderen?</h3>
            <p style={{fontSize:'0.85rem',color:'#78716C',marginBottom:'1.25rem'}}>Permanent verwijderd.</p>
            <div style={{display:'flex',gap:'0.5rem',justifyContent:'center'}}>
              <button className="btn btn-outline" onClick={()=>setConfirmDel(null)}>Annuleren</button>
              <button className="btn btn-primary" style={{background:'#DC2626'}} onClick={()=>del(confirmDel)}>Verwijderen</button>
            </div>
          </div>
        </div>
      )}
      {/* Add/Edit modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
          <div className="modal" style={{maxWidth:'550px'}}>
            <div className="modal-header"><h3>{editing?'Taak bewerken':'Nieuwe taak'}</h3><button className="modal-close" onClick={()=>{setShowAdd(false);setEditing(null)}}>&times;</button></div>
            <div className="form-group"><label className="form-label">Titel</label>
              <input className="form-input" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Wat moet er gebeuren?" autoFocus/></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
              <div className="form-group"><label className="form-label">Categorie</label>
                <select className="form-select" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Toewijzen aan</label>
                <select className="form-select" value={form.assignee} onChange={e=>setForm({...form,assignee:e.target.value})}>{ASSIGNEES.map(a=><option key={a}>{a}</option>)}</select></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'1rem'}}>
              <div className="form-group"><label className="form-label">Deadline</label>
                <input className="form-input" type="date" value={form.dueDate||''} onChange={e=>setForm({...form,dueDate:e.target.value})}/></div>
              <div className="form-group"><label className="form-label">Tijd (min)</label>
                <input className="form-input" type="number" value={form.timeMin} onChange={e=>setForm({...form,timeMin:parseInt(e.target.value)||0})} placeholder="0"/></div>
              <div className="form-group"><label className="form-label">Prioriteit</label>
                <div style={{display:'flex',gap:'0.35rem'}}>
                  {[{k:'high',l:'Urgent',bg:'#FEE2E2',c:'#991B1B',ab:'#DC2626'},{k:'medium',l:'Medium',bg:'#FEF3C7',c:'#92400E',ab:'#D97706'}].map(p=><button key={p.k} className="btn btn-sm"
                    onClick={()=>setForm({...form,priority:form.priority===p.k?'normal':p.k})}
                    style={{flex:1,justifyContent:'center',fontSize:'0.75rem',padding:'0.35rem 0.5rem',background:form.priority===p.k?p.ab:undefined,color:form.priority===p.k?'#fff':undefined,border:form.priority===p.k?'none':'1px solid var(--border-strong)'}}>
                    {p.l}</button>)}
                </div>
                <div style={{fontSize:'0.7rem',color:'var(--text-secondary)',marginTop:'0.25rem'}}>{form.priority==='high'?'Bovenaan + rood label':form.priority==='medium'?'Oranje label':'Geen selectie = normaal'}</div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                Signal
                <button onClick={()=>setForm({...form,signal:!form.signal})} style={{
                  width:'36px',height:'20px',borderRadius:'10px',border:'none',cursor:'pointer',position:'relative',
                  background:form.signal?'#2563EB':'#D6D3D1',transition:'background 0.2s',
                }}>
                  <span style={{position:'absolute',top:'2px',left:form.signal?'18px':'2px',width:'16px',height:'16px',borderRadius:'50%',background:'#fff',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/>
                </button>
                <span style={{fontSize:'0.75rem',color:'#78716C'}}>{form.signal?'Belangrijk — altijd bovenaan':'Normaal'}</span>
              </label>
            </div>
            <div className="form-group"><label className="form-label">Tags</label>
              <div style={{display:'flex',gap:'0.25rem',flexWrap:'wrap',marginBottom:'0.5rem'}}>
                {(form.tags||[]).map(t=><span key={t} style={{display:'flex',alignItems:'center',gap:'0.2rem',padding:'0.1rem 0.5rem',borderRadius:'99px',fontSize:'0.7rem',fontWeight:600,background:'#DBEAFE',color:'#1E40AF'}}>
                  #{t} <button onClick={()=>removeTag(t)} style={{background:'none',border:'none',cursor:'pointer',color:'#1E40AF',fontSize:'0.7rem'}}>&times;</button>
                </span>)}
              </div>
              <div style={{display:'flex',gap:'0.35rem'}}>
                <input className="form-input" value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addTag())} placeholder="Tag toevoegen..." style={{fontSize:'0.8rem',padding:'0.3rem 0.6rem'}}/>
                <button className="btn btn-sm btn-outline" onClick={addTag}>+</button>
              </div>
            </div>
            <div className="form-group"><label className="form-label">Notities</label>
              <textarea className="form-textarea" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Extra details, subtaken..."/></div>
            <div style={{display:'flex',gap:'0.5rem',justifyContent:'flex-end'}}>
              <button className="btn btn-outline" onClick={()=>{setShowAdd(false);setEditing(null)}}>Annuleren</button>
              <button className="btn btn-primary" onClick={handleSave}>{editing?'Bijwerken':'Opslaan'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}