import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../api'
import { uploadToCloudinary } from '../cloudinary'

const STAGES = [
  { id:'ideeen_video', label:'Video ideeën', emoji:'🎬', color:'#8B5CF6' },
  { id:'ideeen_foto', label:'Foto ideeën', emoji:'📸', color:'#A855F7' },
  { id:'ingepland', label:'Ingepland', emoji:'📆', color:'#2563EB' },
  { id:'opgenomen', label:'Opgenomen', emoji:'🎬', color:'#D97706' },
  { id:'montage', label:'Montage', emoji:'✂️', color:'#EC4899' },
  { id:'klaar', label:'Klaar', emoji:'✓', color:'#059669' },
  { id:'scheduled', label:'Gescheduled', emoji:'📅', color:'#2563EB' },
]
const PLATFORMS = ['Instagram','TikTok']
const CHANNELS = ['Artazest','Founder']
const TYPES = ['video','foto']
const MONTHS = ['Januari','Februari','Maart','April','Mei','Juni','Juli','Augustus','September','Oktober','November','December']
let _id = Date.now()
const uid = () => `ct-${_id++}`

export default function Content() {
  const [items, setItems] = useState([])
  const [view, setView] = useState('kanban')
  const [channelFilter, setChannelFilter] = useState('alle')
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [dragItem, setDragItem] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOver, setDragOver] = useState(null)
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [form, setForm] = useState({ title:'', description:'', type:'video', platforms:['Instagram'], props:'', location:'', duration:'', inspiration:'', scheduledDate:'', stage:'ideeen_video', channel:'Artazest', imageUrl:'', camera:'', audio:'', propsNotes:'', script:'' })
  const [uploading, setUploading] = useState(false)
  const loaded = useRef(false)

  useEffect(() => {
    if (loaded.current) return; loaded.current = true
    api.getSetting('content_items').then(v => { if (v?.length) setItems(v) })
  }, [])
  const save = useCallback(v => { setItems(v); api.saveSetting('content_items', v) }, [])

  const resetForm = () => setForm({ title:'', description:'', type:'video', platforms:['Instagram'], props:'', location:'', duration:'', inspiration:'', scheduledDate:'', stage:'ideeen_video', channel:'Artazest', imageUrl:'', camera:'', audio:'', propsNotes:'', script:'' })
  const openAdd = (stg) => { resetForm(); setForm(f => ({...f, stage: stg || 'ideeen_video', channel: channelFilter !== 'alle' ? channelFilter : 'Artazest'})); setEditing(null); setShowAdd(true) }
  const openEdit = (item) => { setForm({...item}); setEditing(item.id); setShowAdd(true) }
  const saveItem = () => {
    if (!form.title.trim()) return
    if (editing) { save(items.map(i => i.id === editing ? {...form, id: editing} : i)) }
    else { save([...items, { ...form, id: uid(), createdAt: new Date().toISOString() }]) }
    setShowAdd(false); setEditing(null); resetForm()
  }
  const deleteItem = (id) => { if (!confirm('Verwijderen?')) return; save(items.filter(i => i.id !== id)); setShowAdd(false); setEditing(null) }
  const moveItem = (id, stage) => save(items.map(i => i.id === id ? {...i, stage, stageMovedAt: new Date().toISOString()} : i))

  const uploadImage = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const result = await uploadToCloudinary(file, { getSetting: api.getSetting })
      setForm(prev => ({...prev, imageUrl: result.thumbnailUrl || result.url}))
    } catch (e) { alert('Upload mislukt: ' + e.message) }
    setUploading(false)
  }
  const handleImgDrop = (e) => { e.preventDefault(); if (e.dataTransfer.files[0]) uploadImage(e.dataTransfer.files[0]) }
  const handleImgDragOver = (e) => { e.preventDefault() }

  const togglePlatform = (p) => {
    const cur = form.platforms || []
    setForm({...form, platforms: cur.includes(p) ? cur.filter(x => x !== p) : [...cur, p]})
  }

  // Drag
  const onDragStart = (e, id) => { setDragItem(id); setIsDragging(true); e.dataTransfer.effectAllowed = 'move' }
  const onDragOver = (e, stageId) => { e.preventDefault(); setDragOver(stageId) }
  const onDrop = (e, stageId) => { e.preventDefault(); if (dragItem) moveItem(dragItem, stageId); setDragItem(null); setDragOver(null) }

  // Calendar helpers
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const firstDay = (new Date(calYear, calMonth, 1).getDay() + 6) % 7 // Mon=0
  const calDays = []
  for (let i = 0; i < firstDay; i++) calDays.push(null)
  for (let i = 1; i <= daysInMonth; i++) calDays.push(i)
  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1) } else setCalMonth(calMonth - 1) }
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1) } else setCalMonth(calMonth + 1) }

  const stageCounts = {}; STAGES.forEach(s => { stageCounts[s.id] = items.filter(i => i.stage === s.id).length })

  return (
    <div style={{ padding:'1.5rem', height:'calc(100vh - 60px)', display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem', flexWrap:'wrap', gap:'0.5rem' }}>
        <div>
          <h1 style={{ fontFamily:"'Instrument Serif',serif", fontSize:'1.75rem', margin:0, color:'var(--text-primary)' }}>{'🎬'} Content</h1>
          <p style={{ margin:'0.2rem 0 0', fontSize:'0.8rem', color:'var(--text-secondary)' }}>{channelFilter==='alle'?items.length:items.filter(i=>(i.channel||'Artazest')===channelFilter).length} items {'·'} {items.filter(i=>i.stage==='scheduled'&&(channelFilter==='alle'||(i.channel||'Artazest')===channelFilter)).length} gescheduled</p>
        </div>
        <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
          <div style={{ display:'flex', borderRadius:8, border:'1px solid var(--border)', overflow:'hidden' }}>
            <button onClick={() => setView('kanban')} style={{ padding:'0.3rem 0.7rem', border:'none', fontSize:'0.75rem', fontWeight:600, cursor:'pointer', background: view==='kanban' ? '#D97706' : 'var(--bg-secondary)', color: view==='kanban' ? '#fff' : 'var(--text-secondary)' }}>Kanban</button>
            <button onClick={() => setView('kalender')} style={{ padding:'0.3rem 0.7rem', border:'none', fontSize:'0.75rem', fontWeight:600, cursor:'pointer', background: view==='kalender' ? '#D97706' : 'var(--bg-secondary)', color: view==='kalender' ? '#fff' : 'var(--text-secondary)' }}>Kalender</button>
          </div>
          <div style={{display:"flex",borderRadius:8,border:"1px solid var(--border)",overflow:"hidden"}}>
            {["alle","Artazest","Founder"].map(ch => (
              <button key={ch} onClick={() => setChannelFilter(ch)} style={{padding:"0.3rem 0.7rem",border:"none",fontSize:"0.7rem",fontWeight:600,cursor:"pointer",background:channelFilter===ch?(ch==="Founder"?"#7C3AED":ch==="Artazest"?"#D97706":"#78716C"):"var(--bg-secondary)",color:channelFilter===ch?"#fff":"var(--text-secondary)"}}>
                {ch==="alle"?"Alle":ch}
              </button>
            ))}
          </div>
          <button onClick={() => openAdd()} style={{ padding:'0.4rem 1rem', borderRadius:8, border:'none', background:'#D97706', color:'#fff', fontSize:'0.85rem', fontWeight:600, cursor:'pointer' }}>+ Nieuw</button>
        </div>
      </div>

      {/* Modal */}
      {showAdd && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={e => e.target===e.currentTarget && setShowAdd(false)}>
          <div style={{ background:'var(--bg-primary,#fff)', borderRadius:16, padding:'1.5rem', width:'90vw', maxWidth:1100, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin:'0 0 1rem', fontFamily:"'Instrument Serif',serif", fontSize:'1.2rem' }}>{editing ? 'Content bewerken' : 'Nieuw content item'}</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
              <input placeholder="Titel" value={form.title} onChange={e => setForm({...form, title:e.target.value})} autoFocus
                style={{ padding:'0.5rem 0.6rem', borderRadius:8, border:'1px solid var(--border)', fontSize:'0.9rem', fontWeight:600, background:'var(--bg-secondary)', color:'var(--text-primary)' }} />
              <div onDrop={handleImgDrop} onDragOver={handleImgDragOver}
                style={{ border: form.imageUrl ? 'none' : '2px dashed var(--border)', borderRadius:8, padding: form.imageUrl ? 0 : '0.75rem', textAlign:'center', cursor:'pointer', overflow:'hidden', minHeight: form.imageUrl ? 0 : 50 }}
                onClick={() => { const inp = document.createElement('input'); inp.type='file'; inp.accept='image/*'; inp.onchange=e=>{if(e.target.files[0])uploadImage(e.target.files[0])}; inp.click() }}>
                {form.imageUrl ? (
                  <div style={{ position:'relative' }}>
                    <img src={form.imageUrl} style={{ width:'100%', maxHeight:180, objectFit:'cover', borderRadius:8 }} />
                    <button onClick={e => { e.stopPropagation(); setForm({...form, imageUrl:''}) }}
                      style={{ position:'absolute', top:6, right:6, background:'rgba(0,0,0,0.6)', color:'#fff', border:'none', borderRadius:'50%', width:22, height:22, fontSize:'0.7rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
                  </div>
                ) : (
                  <div style={{ color:'var(--text-tertiary)', fontSize:'0.7rem' }}>{uploading ? 'Uploaden...' : '📷 Sleep afbeelding hierheen of klik'}</div>
                )}
              </div>
              <textarea placeholder="Beschrijving / concept..." value={form.description} onChange={e => setForm({...form, description:e.target.value})} rows={3}
                style={{ padding:'0.5rem 0.6rem', borderRadius:8, border:'1px solid var(--border)', fontSize:'0.8rem', resize:'vertical', background:'var(--bg-secondary)', color:'var(--text-primary)' }} />
              </div>
              </div>
              <div style={{ display:'flex', gap:'0.5rem' }}>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:'0.65rem', fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Type</label>
                  <div style={{ display:'flex', gap:'0.3rem', marginTop:'0.2rem' }}>
                    {TYPES.map(t => <button key={t} onClick={() => setForm({...form, type:t})} style={{ padding:'0.25rem 0.6rem', borderRadius:6, border: form.type===t ? '2px solid #D97706' : '1px solid var(--border)', background: form.type===t ? '#FFFBEB' : 'transparent', fontSize:'0.75rem', fontWeight:600, cursor:'pointer', color: form.type===t ? '#D97706' : 'var(--text-secondary)' }}>{t==='video'?'🎬':'📸'} {t}</button>)}
                  </div>
                </div>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:'0.65rem', fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Platform</label>
                  <div style={{ display:'flex', gap:'0.3rem', marginTop:'0.2rem' }}>
                    {PLATFORMS.map(p => <button key={p} onClick={() => togglePlatform(p)} style={{ padding:'0.25rem 0.6rem', borderRadius:6, border: (form.platforms||[]).includes(p) ? '2px solid #D97706' : '1px solid var(--border)', background: (form.platforms||[]).includes(p) ? '#FFFBEB' : 'transparent', fontSize:'0.75rem', fontWeight:600, cursor:'pointer', color: (form.platforms||[]).includes(p) ? '#D97706' : 'var(--text-secondary)' }}>{p}</button>)}
                  </div>
                </div>
              </div>
              <div>
                <label style={{ fontSize:'0.65rem', fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Kanaal</label>
                <div style={{ display:'flex', gap:'0.3rem', marginTop:'0.2rem' }}>
                  {CHANNELS.map(ch => <button key={ch} onClick={() => setForm({...form, channel:ch})} style={{ padding:'0.25rem 0.6rem', borderRadius:6, border: form.channel===ch ? '2px solid #D97706' : '1px solid var(--border)', background: form.channel===ch ? '#FFFBEB' : 'transparent', fontSize:'0.75rem', fontWeight:600, cursor:'pointer', color: form.channel===ch ? '#D97706' : 'var(--text-secondary)' }}>{ch}</button>)}
                </div>
              </div>
              {/* Equipment & Locatie */}
              <div style={{ background:'var(--bg-tertiary,#f3f4f6)', borderRadius:8, padding:'0.6rem 0.7rem' }}>
                <label style={{ fontSize:'0.6rem', fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.4rem', display:'block' }}>Productie details</label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.4rem' }}>
                  <div>
                    <label style={{ fontSize:'0.55rem', color:'var(--text-secondary)' }}>Locatie</label>
                    <input placeholder="Studio, buiten, klant..." value={form.location} onChange={e => setForm({...form, location:e.target.value})}
                      style={{ width:'100%', marginTop:'0.1rem', padding:'0.3rem 0.4rem', borderRadius:6, border:'1px solid var(--border)', fontSize:'0.75rem', background:'var(--bg-card)', color:'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize:'0.55rem', color:'var(--text-secondary)' }}>Camera</label>
                    <input placeholder="iPhone, Sony A7, drone..." value={form.camera||''} onChange={e => setForm({...form, camera:e.target.value})}
                      style={{ width:'100%', marginTop:'0.1rem', padding:'0.3rem 0.4rem', borderRadius:6, border:'1px solid var(--border)', fontSize:'0.75rem', background:'var(--bg-card)', color:'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize:'0.55rem', color:'var(--text-secondary)' }}>Geluid</label>
                    <input placeholder="Lav mic, boom, voice-over..." value={form.audio||''} onChange={e => setForm({...form, audio:e.target.value})}
                      style={{ width:'100%', marginTop:'0.1rem', padding:'0.3rem 0.4rem', borderRadius:6, border:'1px solid var(--border)', fontSize:'0.75rem', background:'var(--bg-card)', color:'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize:'0.55rem', color:'var(--text-secondary)' }}>Props</label>
                    <input placeholder="Panelen, tripod, licht..." value={form.props} onChange={e => setForm({...form, props:e.target.value})}
                      style={{ width:'100%', marginTop:'0.1rem', padding:'0.3rem 0.4rem', borderRadius:6, border:'1px solid var(--border)', fontSize:'0.75rem', background:'var(--bg-card)', color:'var(--text-primary)' }} />
                  </div>
                </div>
                <div style={{ marginTop:'0.4rem' }}>
                  <label style={{ fontSize:'0.55rem', color:'var(--text-secondary)' }}>Productie notities</label>
                  <textarea placeholder="Extra details, shotlist, specifieke instructies..." value={form.propsNotes||''} onChange={e => setForm({...form, propsNotes:e.target.value})} rows={2}
                    style={{ width:'100%', marginTop:'0.1rem', padding:'0.3rem 0.4rem', borderRadius:6, border:'1px solid var(--border)', fontSize:'0.75rem', background:'var(--bg-card)', color:'var(--text-primary)', resize:'vertical' }} />
                </div>
              </div>
              <div style={{ display:'flex', gap:'0.5rem' }}>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:'0.65rem', fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Duur (geschat)</label>
                  <input placeholder="30 sec, 1 min, 3 min..." value={form.duration} onChange={e => setForm({...form, duration:e.target.value})}
                    style={{ width:'100%', marginTop:'0.2rem', padding:'0.35rem 0.5rem', borderRadius:6, border:'1px solid var(--border)', fontSize:'0.8rem', background:'var(--bg-secondary)', color:'var(--text-primary)' }} />
                </div>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:'0.65rem', fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Schema datum</label>
                  <input type="date" value={form.scheduledDate||''} onChange={e => setForm({...form, scheduledDate:e.target.value})}
                    style={{ width:'100%', marginTop:'0.2rem', padding:'0.35rem 0.5rem', borderRadius:6, border:'1px solid var(--border)', fontSize:'0.8rem', background:'var(--bg-secondary)', color:'var(--text-primary)' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize:'0.65rem', fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Inspiratie link</label>
                <input placeholder="https://..." value={form.inspiration} onChange={e => setForm({...form, inspiration:e.target.value})}
                  style={{ width:'100%', marginTop:'0.2rem', padding:'0.35rem 0.5rem', borderRadius:6, border:'1px solid var(--border)', fontSize:'0.8rem', background:'var(--bg-secondary)', color:'var(--text-primary)' }} />
              </div>
              {/* Script */}
              <div style={{ background:'var(--bg-tertiary,#f3f4f6)', borderRadius:8, padding:'0.6rem 0.7rem' }}>
                <label style={{ fontSize:'0.6rem', fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.3rem', display:'block' }}>📝 Script / Draaiboek</label>
                <textarea placeholder="Intro: ...
Shot 1: Close-up paneel aan muur
Shot 2: Hand voelt textuur
Voice-over: 'Artazest panels absorb...'
Outro: Logo + CTA" value={form.script||''} onChange={e => setForm({...form, script:e.target.value})} rows={8}
                  style={{ width:'100%', padding:'0.4rem 0.5rem', borderRadius:6, border:'1px solid var(--border)', fontSize:'0.78rem', background:'var(--bg-card)', color:'var(--text-primary)', resize:'vertical', fontFamily:'var(--font-body)', lineHeight:1.5 }} />
              </div>
              <div>
                <label style={{ fontSize:'0.65rem', fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Status</label>
                <div style={{ display:'flex', gap:'0.25rem', marginTop:'0.2rem', flexWrap:'wrap' }}>
                  {STAGES.map(s => <button key={s.id} onClick={() => setForm({...form, stage:s.id})} style={{ padding:'0.2rem 0.5rem', borderRadius:6, border: form.stage===s.id ? `2px solid ${s.color}` : '1px solid var(--border)', background: form.stage===s.id ? s.color+'15' : 'transparent', fontSize:'0.7rem', fontWeight:600, cursor:'pointer', color: form.stage===s.id ? s.color : 'var(--text-secondary)' }}>{s.emoji} {s.label}</button>)}
                </div>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'0.5rem' }}>
                {editing ? <button onClick={() => deleteItem(editing)} style={{ color:'#DC2626', background:'none', border:'none', cursor:'pointer', fontSize:'0.8rem' }}>Verwijderen</button> : <div/>}
                <div style={{ display:'flex', gap:'0.5rem' }}>
                  <button onClick={() => {setShowAdd(false);setEditing(null);resetForm()}} style={{ padding:'0.4rem 0.8rem', borderRadius:8, border:'1px solid var(--border)', background:'transparent', cursor:'pointer', fontSize:'0.8rem', color:'var(--text-primary)' }}>Annuleren</button>
                  <button onClick={saveItem} style={{ padding:'0.4rem 0.8rem', borderRadius:8, border:'none', background:'#D97706', color:'#fff', fontWeight:600, cursor:'pointer', fontSize:'0.8rem' }}>{editing ? 'Opslaan' : 'Toevoegen'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kanban view */}
      {view === 'kanban' && (
        <div style={{ flex:1, display:'flex', gap:'0.65rem', overflowX:'auto' }}>
          {STAGES.map(stage => {
            const stageItems = items.filter(i => { const s = i.stage === 'ideeen' ? (i.type === 'foto' ? 'ideeen_foto' : 'ideeen_video') : i.stage; return s === stage.id && (channelFilter === 'alle' || (i.channel || 'Artazest') === channelFilter) })
            const isOver = dragOver === stage.id
            return (
              <div key={stage.id}
                onDragOver={e => onDragOver(e, stage.id)} onDrop={e => onDrop(e, stage.id)} onDragLeave={() => setDragOver(null)}
                style={{ minWidth:200, flex:'1 0 200px', background: isOver ? 'rgba(217,119,6,0.06)' : 'var(--bg-secondary)', borderRadius:12, padding:'0.65rem', display:'flex', flexDirection:'column', border: isOver ? '2px dashed #D97706' : '2px solid transparent' }}>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:'0.5rem', paddingBottom:'0.35rem', borderBottom:`2px solid ${stage.color}` }}>
                  <span style={{ fontSize:14 }}>{stage.emoji}</span>
                  <span style={{ fontWeight:700, fontSize:'0.78rem', color:'var(--text-primary)', flex:1 }}>{stage.label}</span>
                  <span style={{ background:stage.color, color:'#fff', borderRadius:20, padding:'0 0.35rem', fontSize:'0.55rem', fontWeight:700 }}>{stageItems.length}</span>
                </div>
                <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'0.35rem', overflowY:'auto' }}>
                  {stageItems.map(item => (
                    <div key={item.id} draggable onDragStart={e => onDragStart(e, item.id)} onDragEnd={() => {setDragItem(null);setDragOver(null);setTimeout(()=>setIsDragging(false),100)}}
                      onClick={() => {if(!isDragging)openEdit(item)}}
                      style={{ padding:'0.45rem 0.55rem', borderRadius:8, background:'var(--bg-card)', border:'1px solid var(--border)', cursor:'grab', boxShadow:'0 1px 3px rgba(0,0,0,0.04)', opacity: dragItem===item.id ? 0.4 : 1, transition:'opacity 0.15s,box-shadow 0.15s' }}
                      onMouseEnter={e=>e.currentTarget.style.boxShadow='0 3px 10px rgba(0,0,0,0.1)'} onMouseLeave={e=>e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,0.04)'}>
                      {item.imageUrl && <img src={item.imageUrl} style={{ width:'100%', borderRadius:6, marginBottom:'0.25rem' }} />}
                      <div style={{ display:'flex', alignItems:'center', gap:'0.3rem', marginBottom:'0.25rem' }}>
                        <span style={{ fontSize:'0.5rem', padding:'0.08rem 0.3rem', borderRadius:4, background: item.type==='video'?'#FEE2E2':'#DBEAFE', color: item.type==='video'?'#DC2626':'#2563EB', fontWeight:700 }}>{item.type==='video'?'🎬 video':'📸 foto'}</span>
                        <span style={{ fontSize:'0.5rem', padding:'0.08rem 0.3rem', borderRadius:4, background: (item.channel||'Artazest')==='Founder'?'#F3E8FF':'#FFFBEB', color: (item.channel||'Artazest')==='Founder'?'#7C3AED':'#D97706', fontWeight:700 }}>{item.channel||'Artazest'}</span>
                      </div>
                      <div style={{ fontWeight:600, fontSize:'0.82rem', color:'var(--text-primary)', lineHeight:1.3, marginBottom:'0.15rem' }}>{item.title}</div>
                      {item.description && <div style={{ fontSize:'0.65rem', color:'var(--text-secondary)', lineHeight:1.3, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', marginBottom:'0.2rem' }}>{item.description}</div>}
                      <div style={{ display:'flex', gap:'0.2rem', flexWrap:'wrap', alignItems:'center' }}>
                        {(item.platforms||[]).map(p => <span key={p} style={{ fontSize:'0.5rem', padding:'0.05rem 0.25rem', borderRadius:4, background:'var(--bg-tertiary,#f3f4f6)', color:'var(--text-secondary)', fontWeight:600 }}>{p}</span>)}
                        {item.duration && <span style={{ fontSize:'0.5rem', color:'var(--text-tertiary)' }}>{item.duration}</span>}
                        {item.scheduledDate && <span style={{ fontSize:'0.5rem', padding:'0.05rem 0.25rem', borderRadius:4, background:'#DBEAFE', color:'#2563EB', fontWeight:600, marginLeft:'auto' }}>{item.scheduledDate.slice(5)}</span>}
                      </div>
                    </div>
                  ))}
                  {stageItems.length === 0 && <div style={{ textAlign:'center', padding:'1.5rem 0.5rem', color:'var(--text-tertiary)', fontSize:'0.7rem' }}>Sleep items hierheen</div>}
                </div>
                <button onClick={() => openAdd(stage.id)} style={{ marginTop:'0.4rem', width:'100%', padding:'0.3rem', borderRadius:6, border:'1px dashed var(--border)', background:'transparent', cursor:'pointer', fontSize:'0.7rem', color:'var(--text-secondary)' }}>+ toevoegen</button>
              </div>
            )
          })}
        </div>
      )}

      {/* Kalender view */}
      {view === 'kalender' && (
        <div style={{ flex:1, overflow:'auto' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
            <button onClick={prevMonth} style={{ background:'none', border:'1px solid var(--border)', borderRadius:6, padding:'0.3rem 0.6rem', cursor:'pointer', fontSize:'0.8rem', color:'var(--text-primary)' }}>{'←'}</button>
            <h2 style={{ fontFamily:"'Instrument Serif',serif", fontSize:'1.2rem', margin:0 }}>{MONTHS[calMonth]} {calYear}</h2>
            <button onClick={nextMonth} style={{ background:'none', border:'1px solid var(--border)', borderRadius:6, padding:'0.3rem 0.6rem', cursor:'pointer', fontSize:'0.8rem', color:'var(--text-primary)' }}>{'→'}</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'1px', background:'var(--border)', borderRadius:8, overflow:'hidden' }}>
            {['Ma','Di','Wo','Do','Vr','Za','Zo'].map(d => <div key={d} style={{ padding:'0.4rem', textAlign:'center', fontSize:'0.65rem', fontWeight:700, color:'var(--text-secondary)', background:'var(--bg-secondary)' }}>{d}</div>)}
            {calDays.map((day, idx) => {
              const dateStr = day ? `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}` : null
              const dayItems = dateStr ? items.filter(i => i.scheduledDate === dateStr && (channelFilter === 'alle' || (i.channel || 'Artazest') === channelFilter)) : []
              const isToday = dateStr === new Date().toISOString().slice(0,10)
              return (
                <div key={idx} style={{ minHeight:80, padding:'0.25rem', background: isToday ? '#FFFBEB' : 'var(--bg-card)', position:'relative' }}>
                  {day && <div style={{ fontSize:'0.65rem', fontWeight: isToday ? 700 : 400, color: isToday ? '#D97706' : 'var(--text-secondary)', marginBottom:'0.2rem' }}>{day}</div>}
                  {dayItems.map(item => {
                    const stage = STAGES.find(s => s.id === item.stage)
                    return (
                      <div key={item.id} onClick={() => openEdit(item)} style={{ padding:'0.15rem 0.3rem', borderRadius:4, background: stage?.color+'20', borderLeft:`2px solid ${stage?.color}`, marginBottom:'0.15rem', cursor:'pointer', fontSize:'0.55rem', fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {item.type==='video'?'🎬':'📸'} {item.title}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
