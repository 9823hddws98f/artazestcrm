import { useState, useEffect } from 'react'
import { api } from '../api'

const MACHINES = ['CNC Frees','Pers','Snijmachine','Printer','Verpakkingsmachine']
const INTERVALS = ['Dagelijks','Wekelijks','Maandelijks','Per 3 maanden','Per 6 maanden','Jaarlijks']
const BLADE_TYPES = ['Freeskop 6mm','Freeskop 8mm','Snijmes standaard','Snijmes fijn','Diamantfrees']

const uid = () => `m-${Date.now()}-${Math.random().toString(36).slice(2,5)}`
const fmt = d => d ? new Date(d).toLocaleDateString('nl-NL',{day:'numeric',month:'short',year:'numeric'}) : '—'
const fmtShort = d => d ? new Date(d).toLocaleDateString('nl-NL',{day:'numeric',month:'short'}) : '—'
const todayISO = () => new Date().toISOString().slice(0,10)
const daysUntil = d => d ? Math.ceil((new Date(d)-new Date())/864e5) : null

export default function Maintenance() {
  const [tab, setTab] = useState('schedule')
  const [schedule, setSchedule] = useState([])
  const [bladeLog, setBladeLog] = useState([])
  const [videos, setVideos] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [showAddBlade, setShowAddBlade] = useState(false)
  const [showAddVideo, setShowAddVideo] = useState(false)
  const [form, setForm] = useState({machine:'',task:'',interval:'Maandelijks',lastDone:'',nextDue:'',notes:''})
  const [bladeForm, setBladeForm] = useState({type:'',machine:'',replacedAt:'',notes:'',cost:''})
  const [videoForm, setVideoForm] = useState({title:'',url:'',category:'Onderhoud',notes:''})
  const [notifSettings, setNotifSettings] = useState({enabled:true,daysBefore:3,oilReminder:'Wekelijks',bladeReminder:'Maandelijks'})

  useEffect(() => {
    api.getSetting('maintenance_schedule').then(v => { if(v?.length) setSchedule(v) })
    api.getSetting('blade_log').then(v => { if(v?.length) setBladeLog(v) })
    api.getSetting('maintenance_videos').then(v => { if(v?.length) setVideos(v) })
    api.getSetting('maintenance_notif').then(v => { if(v) setNotifSettings(v) })
  }, [])

  const saveSchedule = items => { setSchedule(items); api.saveSetting('maintenance_schedule', items) }
  const saveBlades = items => { setBladeLog(items); api.saveSetting('blade_log', items) }
  const saveVideos = items => { setVideos(items); api.saveSetting('maintenance_videos', items) }
  const saveNotif = ns => { setNotifSettings(ns); api.saveSetting('maintenance_notif', ns) }

  // Schedule CRUD
  const addScheduleItem = () => {
    if(!form.machine||!form.task) return
    saveSchedule([...schedule, { id:uid(), ...form, lastDone:form.lastDone||null, nextDue:form.nextDue||null, archived:false }])
    setForm({machine:'',task:'',interval:'Maandelijks',lastDone:'',nextDue:'',notes:''}); setShowAdd(false)
  }
  const markDone = id => {
    saveSchedule(schedule.map(s => s.id===id ? {...s, lastDone:todayISO(), nextDue:calcNext(s.interval)} : s))
  }
  const calcNext = interval => {
    const d = new Date()
    if(interval==='Dagelijks') d.setDate(d.getDate()+1)
    else if(interval==='Wekelijks') d.setDate(d.getDate()+7)
    else if(interval==='Maandelijks') d.setMonth(d.getMonth()+1)
    else if(interval==='Per 3 maanden') d.setMonth(d.getMonth()+3)
    else if(interval==='Per 6 maanden') d.setMonth(d.getMonth()+6)
    else if(interval==='Jaarlijks') d.setFullYear(d.getFullYear()+1)
    return d.toISOString().slice(0,10)
  }
  const archiveItem = id => saveSchedule(schedule.map(s => s.id===id ? {...s, archived:true} : s))
  const unarchiveItem = id => saveSchedule(schedule.map(s => s.id===id ? {...s, archived:false} : s))
  const deleteItem = id => saveSchedule(schedule.filter(s => s.id!==id))

  // Blade CRUD
  const addBlade = () => {
    if(!bladeForm.type||!bladeForm.machine) return
    saveBlades([{id:uid(), ...bladeForm, replacedAt:bladeForm.replacedAt||todayISO(), archived:false}, ...bladeLog])
    setBladeForm({type:'',machine:'',replacedAt:'',notes:'',cost:''}); setShowAddBlade(false)
  }
  const archiveBlade = id => saveBlades(bladeLog.map(b => b.id===id ? {...b, archived:true} : b))
  const deleteBlade = id => saveBlades(bladeLog.filter(b => b.id!==id))

  // Video CRUD
  const addVideo = () => {
    if(!videoForm.title||!videoForm.url) return
    saveVideos([...videos, {id:uid(), ...videoForm, addedAt:todayISO()}])
    setVideoForm({title:'',url:'',category:'Onderhoud',notes:''}); setShowAddVideo(false)
  }
  const deleteVideo = id => saveVideos(videos.filter(v => v.id!==id))

  const getYoutubeId = url => {
    const m = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]+)/)
    return m ? m[1] : null
  }

  const activeSchedule = schedule.filter(s => !s.archived)
  const archivedSchedule = schedule.filter(s => s.archived)
  const activeBlades = bladeLog.filter(b => !b.archived)
  const archivedBlades = bladeLog.filter(b => b.archived)
  const overdue = activeSchedule.filter(s => s.nextDue && daysUntil(s.nextDue) < 0)
  const dueSoon = activeSchedule.filter(s => s.nextDue && daysUntil(s.nextDue) >= 0 && daysUntil(s.nextDue) <= 7)

  const tabs = [
    {key:'schedule',label:'Onderhoudsschema',icon:'🔧'},
    {key:'blades',label:'Messen & Frezen',icon:'🔪'},
    {key:'videos',label:'How-to Video\'s',icon:'🎬'},
    {key:'settings',label:'Instellingen',icon:'⚙️'},
  ]

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Onderhoud</h1>
          <p className="page-subtitle">Machines, messen & tutorials — {overdue.length > 0 ? `⚠️ ${overdue.length} achterstallig` : '✅ Alles up-to-date'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          if(tab==='schedule') setShowAdd(true)
          else if(tab==='blades') setShowAddBlade(true)
          else setShowAddVideo(true)
        }}>+ Toevoegen</button>
      </div>

      {/* Score cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1rem',marginBottom:'1.5rem'}}>
        <div className="card" style={{textAlign:'center',padding:'1rem'}}>
          <div style={{fontSize:'1.8rem',fontWeight:700,color:overdue.length?'#DC2626':'#059669'}}>{overdue.length}</div>
          <div style={{fontSize:'0.72rem',color:'var(--text-secondary)'}}>Achterstallig</div>
        </div>
        <div className="card" style={{textAlign:'center',padding:'1rem'}}>
          <div style={{fontSize:'1.8rem',fontWeight:700,color:dueSoon.length?'#D97706':'var(--text-primary)'}}>{dueSoon.length}</div>
          <div style={{fontSize:'0.72rem',color:'var(--text-secondary)'}}>Binnenkort</div>
        </div>
        <div className="card" style={{textAlign:'center',padding:'1rem'}}>
          <div style={{fontSize:'1.8rem',fontWeight:700}}>{activeBlades.length}</div>
          <div style={{fontSize:'0.72rem',color:'var(--text-secondary)'}}>Mes-vervangingen</div>
        </div>
        <div className="card" style={{textAlign:'center',padding:'1rem'}}>
          <div style={{fontSize:'1.8rem',fontWeight:700}}>{videos.length}</div>
          <div style={{fontSize:'0.72rem',color:'var(--text-secondary)'}}>Video's</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{marginBottom:'1rem'}}>
        {tabs.map(t => <button key={t.key} className={`tab ${tab===t.key?'active':''}`} onClick={()=>setTab(t.key)}>{t.icon} {t.label}</button>)}
      </div>

      {/* SCHEDULE TAB */}
      {tab==='schedule' && (<>
        {showAdd && (
          <div className="card" style={{marginBottom:'1rem',padding:'1rem'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
              <div className="form-group"><label className="form-label">Machine</label>
                <select className="form-select" value={form.machine} onChange={e=>setForm({...form,machine:e.target.value})}>
                  <option value="">Kies...</option>{MACHINES.map(m=><option key={m}>{m}</option>)}
                  <option value="_custom">+ Anders</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">Onderhoudstaak</label>
                <input className="form-input" value={form.task} onChange={e=>setForm({...form,task:e.target.value})} placeholder="Bijv. olie verversen, filters schoonmaken..."/></div>
              <div className="form-group"><label className="form-label">Interval</label>
                <select className="form-select" value={form.interval} onChange={e=>setForm({...form,interval:e.target.value})}>
                  {INTERVALS.map(i=><option key={i}>{i}</option>)}
                </select>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 2fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
              <div className="form-group"><label className="form-label">Laatst gedaan</label><input className="form-input" type="date" value={form.lastDone} onChange={e=>setForm({...form,lastDone:e.target.value})}/></div>
              <div className="form-group"><label className="form-label">Volgende keer</label><input className="form-input" type="date" value={form.nextDue} onChange={e=>setForm({...form,nextDue:e.target.value})}/></div>
              <div className="form-group"><label className="form-label">Notities</label><input className="form-input" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Optioneel..."/></div>
            </div>
            <div style={{display:'flex',gap:'0.5rem',justifyContent:'flex-end'}}>
              <button className="btn btn-outline" onClick={()=>setShowAdd(false)}>Annuleren</button>
              <button className="btn btn-primary" onClick={addScheduleItem}>Opslaan</button>
            </div>
          </div>
        )}

        {activeSchedule.length===0 && !showAdd ? (
          <div className="card"><div className="empty-state">Nog geen onderhoudstaken. Klik "+ Toevoegen" om te beginnen.</div></div>
        ) : (
          <div className="card" style={{overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.82rem'}}>
              <thead><tr style={{borderBottom:'2px solid var(--border)',textAlign:'left'}}>
                <th style={{padding:'0.5rem 0.75rem',fontWeight:700,fontSize:'0.7rem',textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-secondary)'}}>Machine</th>
                <th style={{padding:'0.5rem 0.75rem',fontWeight:700,fontSize:'0.7rem',textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-secondary)'}}>Taak</th>
                <th style={{padding:'0.5rem 0.75rem',fontWeight:700,fontSize:'0.7rem',textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-secondary)'}}>Interval</th>
                <th style={{padding:'0.5rem 0.75rem',fontWeight:700,fontSize:'0.7rem',textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-secondary)'}}>Laatst</th>
                <th style={{padding:'0.5rem 0.75rem',fontWeight:700,fontSize:'0.7rem',textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-secondary)'}}>Volgende</th>
                <th style={{padding:'0.5rem 0.75rem'}}></th>
              </tr></thead>
              <tbody>{activeSchedule.map(s => {
                const days = daysUntil(s.nextDue)
                const isOverdue = days!==null && days<0
                const isSoon = days!==null && days>=0 && days<=7
                return (
                  <tr key={s.id} style={{borderBottom:'1px solid var(--border)'}}>
                    <td style={{padding:'0.5rem 0.75rem',fontWeight:600}}>{s.machine}</td>
                    <td style={{padding:'0.5rem 0.75rem'}}>{s.task}{s.notes&&<div style={{fontSize:'0.68rem',color:'var(--text-secondary)'}}>{s.notes}</div>}</td>
                    <td style={{padding:'0.5rem 0.75rem'}}><span style={{padding:'0.1rem 0.4rem',borderRadius:'99px',fontSize:'0.68rem',background:'var(--bg-secondary)',fontWeight:600}}>{s.interval}</span></td>
                    <td style={{padding:'0.5rem 0.75rem',fontSize:'0.78rem',color:'var(--text-secondary)'}}>{fmtShort(s.lastDone)}</td>
                    <td style={{padding:'0.5rem 0.75rem'}}><span style={{fontSize:'0.78rem',fontWeight:600,padding:'0.1rem 0.4rem',borderRadius:'4px',background:isOverdue?'#FEE2E2':isSoon?'#FEF3C7':'transparent',color:isOverdue?'#DC2626':isSoon?'#92400E':'var(--text-primary)'}}>{isOverdue?`${Math.abs(days)}d te laat`:isSoon?`Over ${days}d`:fmtShort(s.nextDue)}</span></td>
                    <td style={{padding:'0.5rem 0.75rem',display:'flex',gap:'0.3rem'}}>
                      <button onClick={()=>markDone(s.id)} title="Markeer als gedaan" style={{padding:'0.2rem 0.5rem',borderRadius:'6px',border:'1px solid #059669',background:'#F0FDF4',color:'#059669',fontSize:'0.68rem',fontWeight:600,cursor:'pointer'}}>✓ Gedaan</button>
                      <button onClick={()=>archiveItem(s.id)} title="Archiveer" style={{padding:'0.2rem 0.4rem',borderRadius:'6px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text-secondary)',fontSize:'0.68rem',cursor:'pointer'}}>📦</button>
                      <button onClick={()=>deleteItem(s.id)} title="Verwijder" style={{padding:'0.2rem 0.4rem',borderRadius:'6px',border:'none',background:'none',color:'var(--text-secondary)',fontSize:'0.68rem',cursor:'pointer'}} onMouseEnter={e=>e.currentTarget.style.color='#DC2626'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-secondary)'}>✕</button>
                    </td>
                  </tr>
                )
              })}</tbody>
            </table>
          </div>
        )}

        {archivedSchedule.length>0 && (
          <details style={{marginTop:'1rem'}}><summary style={{cursor:'pointer',fontSize:'0.78rem',color:'var(--text-secondary)',fontWeight:600}}>📦 Archief ({archivedSchedule.length})</summary>
            <div className="card" style={{marginTop:'0.5rem'}}>{archivedSchedule.map(s=>(
              <div key={s.id} style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.4rem 0.5rem',borderBottom:'1px solid var(--border)',opacity:0.6}}>
                <span style={{fontSize:'0.78rem',flex:1}}>{s.machine} — {s.task}</span>
                <button onClick={()=>unarchiveItem(s.id)} className="btn btn-sm btn-outline" style={{fontSize:'0.68rem'}}>Terugzetten</button>
              </div>
            ))}</div>
          </details>
        )}
      </>)}

      {/* BLADES TAB */}
      {tab==='blades' && (<>
        {showAddBlade && (
          <div className="card" style={{marginBottom:'1rem',padding:'1rem'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
              <div className="form-group"><label className="form-label">Type mes/frees</label>
                <select className="form-select" value={bladeForm.type} onChange={e=>setBladeForm({...bladeForm,type:e.target.value})}>
                  <option value="">Kies...</option>{BLADE_TYPES.map(b=><option key={b}>{b}</option>)}
                </select></div>
              <div className="form-group"><label className="form-label">Machine</label>
                <select className="form-select" value={bladeForm.machine} onChange={e=>setBladeForm({...bladeForm,machine:e.target.value})}>
                  <option value="">Kies...</option>{MACHINES.map(m=><option key={m}>{m}</option>)}
                </select></div>
              <div className="form-group"><label className="form-label">Datum vervanging</label><input className="form-input" type="date" value={bladeForm.replacedAt} onChange={e=>setBladeForm({...bladeForm,replacedAt:e.target.value})}/></div>
              <div className="form-group"><label className="form-label">Kosten (€)</label><input className="form-input" type="number" value={bladeForm.cost} onChange={e=>setBladeForm({...bladeForm,cost:e.target.value})} placeholder="0.00"/></div>
            </div>
            <div className="form-group" style={{marginBottom:'0.75rem'}}><label className="form-label">Notities</label><input className="form-input" value={bladeForm.notes} onChange={e=>setBladeForm({...bladeForm,notes:e.target.value})} placeholder="Reden vervanging, slijtage, leverancier..."/></div>
            <div style={{display:'flex',gap:'0.5rem',justifyContent:'flex-end'}}>
              <button className="btn btn-outline" onClick={()=>setShowAddBlade(false)}>Annuleren</button>
              <button className="btn btn-primary" onClick={addBlade}>Opslaan</button>
            </div>
          </div>
        )}

        {activeBlades.length===0 && !showAddBlade ? (
          <div className="card"><div className="empty-state">Nog geen mes-vervangingen gelogd.</div></div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
            {activeBlades.map(b => (
              <div key={b.id} className="card" style={{padding:'0.75rem 1rem',display:'flex',alignItems:'center',gap:'1rem'}}>
                <div style={{width:'40px',height:'40px',borderRadius:'10px',background:'var(--bg-secondary)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem',flexShrink:0}}>🔪</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:'0.85rem'}}>{b.type}</div>
                  <div style={{fontSize:'0.72rem',color:'var(--text-secondary)',display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
                    <span>{b.machine}</span><span>·</span><span>{fmt(b.replacedAt)}</span>
                    {b.cost&&<><span>·</span><span style={{fontWeight:600}}>€{b.cost}</span></>}
                    {b.notes&&<><span>·</span><span>{b.notes}</span></>}
                  </div>
                </div>
                <button onClick={()=>archiveBlade(b.id)} style={{padding:'0.2rem 0.4rem',borderRadius:'6px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text-secondary)',fontSize:'0.68rem',cursor:'pointer'}}>📦</button>
                <button onClick={()=>deleteBlade(b.id)} style={{background:'none',border:'none',color:'var(--text-secondary)',cursor:'pointer',fontSize:'0.7rem'}} onMouseEnter={e=>e.currentTarget.style.color='#DC2626'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-secondary)'}>✕</button>
              </div>
            ))}
          </div>
        )}

        {archivedBlades.length>0 && (
          <details style={{marginTop:'1rem'}}><summary style={{cursor:'pointer',fontSize:'0.78rem',color:'var(--text-secondary)',fontWeight:600}}>📦 Archief ({archivedBlades.length})</summary>
            <div style={{display:'flex',flexDirection:'column',gap:'0.3rem',marginTop:'0.5rem'}}>{archivedBlades.map(b=>(
              <div key={b.id} className="card" style={{padding:'0.5rem 0.75rem',opacity:0.6,display:'flex',alignItems:'center',gap:'0.5rem'}}>
                <span style={{flex:1,fontSize:'0.78rem'}}>{b.type} — {b.machine} — {fmt(b.replacedAt)}</span>
              </div>
            ))}</div>
          </details>
        )}
      </>)}

      {/* VIDEOS TAB */}
      {tab==='videos' && (<>
        {showAddVideo && (
          <div className="card" style={{marginBottom:'1rem',padding:'1rem'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
              <div className="form-group"><label className="form-label">Titel</label><input className="form-input" value={videoForm.title} onChange={e=>setVideoForm({...videoForm,title:e.target.value})} placeholder="Bijv. CNC frees olie verversen"/></div>
              <div className="form-group"><label className="form-label">YouTube / Vimeo URL</label><input className="form-input" value={videoForm.url} onChange={e=>setVideoForm({...videoForm,url:e.target.value})} placeholder="https://youtube.com/watch?v=..."/></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
              <div className="form-group"><label className="form-label">Categorie</label>
                <select className="form-select" value={videoForm.category} onChange={e=>setVideoForm({...videoForm,category:e.target.value})}>
                  <option>Onderhoud</option><option>Mes vervangen</option><option>Machine setup</option><option>Verpakking</option><option>Shopify</option><option>Overig</option>
                </select></div>
              <div className="form-group"><label className="form-label">Notities</label><input className="form-input" value={videoForm.notes} onChange={e=>setVideoForm({...videoForm,notes:e.target.value})} placeholder="Optioneel..."/></div>
            </div>
            <div style={{display:'flex',gap:'0.5rem',justifyContent:'flex-end'}}>
              <button className="btn btn-outline" onClick={()=>setShowAddVideo(false)}>Annuleren</button>
              <button className="btn btn-primary" onClick={addVideo}>Opslaan</button>
            </div>
          </div>
        )}

        {videos.length===0 && !showAddVideo ? (
          <div className="card"><div className="empty-state">Nog geen video's toegevoegd. Voeg YouTube/Vimeo links toe als naslagwerk.</div></div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:'1rem'}}>
            {videos.map(v => {
              const ytId = getYoutubeId(v.url)
              return (
                <div key={v.id} className="card" style={{padding:0,overflow:'hidden'}}>
                  {ytId ? (
                    <div style={{position:'relative',paddingTop:'56.25%',background:'#000'}}>
                      <iframe src={`https://www.youtube.com/embed/${ytId}`} style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',border:'none'}} allowFullScreen/>
                    </div>
                  ) : (
                    <div style={{padding:'2rem',textAlign:'center',background:'var(--bg-secondary)'}}>
                      <a href={v.url} target="_blank" rel="noopener" style={{color:'var(--accent)',fontWeight:600,fontSize:'0.85rem'}}>▶ Open video</a>
                    </div>
                  )}
                  <div style={{padding:'0.75rem'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                      <div>
                        <div style={{fontWeight:600,fontSize:'0.85rem'}}>{v.title}</div>
                        <div style={{fontSize:'0.68rem',color:'var(--text-secondary)',display:'flex',gap:'0.3rem',marginTop:'0.15rem'}}>
                          <span style={{padding:'0.05rem 0.35rem',borderRadius:'99px',background:'var(--bg-secondary)',fontWeight:600}}>{v.category}</span>
                          {v.notes&&<span>{v.notes}</span>}
                        </div>
                      </div>
                      <button onClick={()=>deleteVideo(v.id)} style={{background:'none',border:'none',color:'var(--text-secondary)',cursor:'pointer',fontSize:'0.7rem',flexShrink:0}} onMouseEnter={e=>e.currentTarget.style.color='#DC2626'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-secondary)'}>✕</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </>)}

      {/* SETTINGS TAB */}
      {tab==='settings' && (
        <div className="card" style={{maxWidth:'600px'}}>
          <h3 className="section-title" style={{marginBottom:'1rem'}}>Notificatie-instellingen</h3>

          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0.75rem 0',borderBottom:'1px solid var(--border)'}}>
            <div><div style={{fontWeight:600,fontSize:'0.85rem'}}>Notificaties aan</div>
              <div style={{fontSize:'0.72rem',color:'var(--text-secondary)'}}>Ontvang herinneringen voor onderhoud</div></div>
            <button onClick={()=>{const ns={...notifSettings,enabled:!notifSettings.enabled};saveNotif(ns);if(ns.enabled&&Notification&&Notification.permission==='default')Notification.requestPermission()}}
              style={{width:'48px',height:'26px',borderRadius:'99px',border:'none',cursor:'pointer',background:notifSettings.enabled?'#059669':'#D1D5DB',position:'relative',transition:'background 0.2s'}}>
              <span style={{position:'absolute',top:'3px',left:notifSettings.enabled?'25px':'3px',width:'20px',height:'20px',borderRadius:'50%',background:'#fff',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/>
            </button>
          </div>

          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0.75rem 0',borderBottom:'1px solid var(--border)'}}>
            <div><div style={{fontWeight:600,fontSize:'0.85rem'}}>Dagen van tevoren waarschuwen</div>
              <div style={{fontSize:'0.72rem',color:'var(--text-secondary)'}}>Hoeveel dagen voor deadline een herinnering</div></div>
            <select className="form-select" value={notifSettings.daysBefore} onChange={e=>saveNotif({...notifSettings,daysBefore:parseInt(e.target.value)})} style={{width:'80px'}}>
              <option value={1}>1 dag</option><option value={2}>2 dagen</option><option value={3}>3 dagen</option><option value={5}>5 dagen</option><option value={7}>1 week</option>
            </select>
          </div>

          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0.75rem 0',borderBottom:'1px solid var(--border)'}}>
            <div><div style={{fontWeight:600,fontSize:'0.85rem'}}>🛢️ Machine smeren herinnering</div>
              <div style={{fontSize:'0.72rem',color:'var(--text-secondary)'}}>Automatische herinnering voor het smeren van machines</div></div>
            <select className="form-select" value={notifSettings.oilReminder} onChange={e=>saveNotif({...notifSettings,oilReminder:e.target.value})} style={{width:'140px'}}>
              {INTERVALS.map(i=><option key={i}>{i}</option>)}
            </select>
          </div>

          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0.75rem 0',borderBottom:'1px solid var(--border)'}}>
            <div><div style={{fontWeight:600,fontSize:'0.85rem'}}>🔪 Mes vervangen herinnering</div>
              <div style={{fontSize:'0.72rem',color:'var(--text-secondary)'}}>Automatische herinnering om messen/frezen te controleren</div></div>
            <select className="form-select" value={notifSettings.bladeReminder} onChange={e=>saveNotif({...notifSettings,bladeReminder:e.target.value})} style={{width:'140px'}}>
              {INTERVALS.map(i=><option key={i}>{i}</option>)}
            </select>
          </div>

          <div style={{marginTop:'1rem',padding:'0.75rem',borderRadius:'10px',background:'var(--bg-secondary)'}}>
            <div style={{fontSize:'0.72rem',color:'var(--text-secondary)',marginBottom:'0.35rem'}}>Browser notificaties</div>
            {typeof Notification!=='undefined'&&Notification.permission==='granted'?
              <span style={{fontSize:'0.78rem',color:'#059669',fontWeight:600}}>✅ Toegestaan</span>:
              typeof Notification!=='undefined'&&Notification.permission==='denied'?
              <span style={{fontSize:'0.78rem',color:'#DC2626',fontWeight:600}}>❌ Geblokkeerd — schakel in via browser-instellingen</span>:
              <button onClick={()=>Notification.requestPermission()} style={{padding:'0.35rem 0.7rem',borderRadius:'6px',border:'1px solid var(--accent)',background:'var(--accent-light)',color:'var(--accent)',fontSize:'0.78rem',fontWeight:600,cursor:'pointer'}}>🔔 Notificaties toestaan</button>
            }
          </div>
        </div>
      )}
    </>
  )
}
