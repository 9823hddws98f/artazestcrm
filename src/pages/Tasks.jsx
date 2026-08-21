import React, { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import Board from './Board'

// Module-level — nooit stale, werkt buiten React render cycle
let _DRAG_ID = null

const ASSIGNEES = ['Tein','Sam']
const ALL_ASSIGNEES = ['Tein','Sam','Productie']
const LAUNCH = new Date('2026-04-18T09:00:00')
const CATEGORIES = ['Shopify','Content','Ads','Design','Productie','Juridisch','Email','Verpakking','Overig']
const DEFAULT_STATUSES = [
  { key: 'todo',    label: 'To do',   color: '#78716C' },
  { key: 'gepland', label: 'Gepland', color: '#2563EB' },
  { key: 'bezig',   label: 'Bezig',   color: '#D97706' },
  { key: 'klaar',   label: 'Klaar',   color: '#059669' },
]
const COLORS = ['#78716C','#2563EB','#D97706','#059669','#7C3AED','#DC2626','#0891B2']

function daysUntil(date) {
  if (!date) return null
  return Math.ceil((new Date(date) - new Date()) / (1000*60*60*24))
}
const daysToLaunch = daysUntil(LAUNCH)
const fmt = d => new Date(d).toLocaleDateString('nl-NL',{day:'numeric',month:'short'})
const todayISO = () => new Date().toISOString().slice(0,10)
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2,7)}`

// ─── WEKELIJKSE TO-DO'S ─────────────────────────────────────────────────────
const DEFAULT_WEEKLY = [
  { id: 'w1', title: 'Content plannen voor volgende week', done: false },
  { id: 'w2', title: 'Analytics & omzet bijwerken', done: false },
  { id: 'w3', title: 'Voorraad controleren', done: false },
  { id: 'w4', title: 'To-dos prioriteren', done: false },
  { id: 'w5', title: 'Sam en Productie briefing', done: false },
]

function WekelijkseTodos() {
  const weekKey = () => {
    const d = new Date(); const jan1 = new Date(d.getFullYear(),0,1)
    return `w${Math.ceil(((d-jan1)/86400000+jan1.getDay()+1)/7)}-${d.getFullYear()}`
  }
  const loadItems = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('artazest_weekly_todos') || '[]')
      const savedWeek = localStorage.getItem('artazest_weekly_key')
      const curWeek = weekKey()
      if (savedWeek !== curWeek && saved.length > 0) {
        const reset = saved.map(i => ({...i, done: false}))
        localStorage.setItem('artazest_weekly_key', curWeek)
        localStorage.setItem('artazest_weekly_todos', JSON.stringify(reset))
        return reset
      }
      if (!savedWeek) localStorage.setItem('artazest_weekly_key', curWeek)
      return saved.length > 0 ? saved : DEFAULT_WEEKLY
    } catch { return DEFAULT_WEEKLY }
  }
  const save = items => {
    localStorage.setItem('artazest_weekly_todos', JSON.stringify(items))
    api.saveSetting('weekly_todos', items)
    api.saveSetting('weekly_key', weekKey())
  }

  const [items, setItems] = useState(loadItems)
  const [showPanel, setShowPanel] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [editId, setEditId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  useEffect(()=>{
    Promise.all([api.getSetting('weekly_todos'),api.getSetting('weekly_key')]).then(([todos,wk])=>{
      if(todos&&todos.length>0){
        const curWeek=weekKey()
        if(wk!==curWeek){const reset=todos.map(i=>({...i,done:false}));setItems(reset);save(reset)}
        else setItems(todos)
      }
    })
  },[])

  const doneCount = items.filter(i => i.done).length

  useEffect(() => {
    api.getSetting('weekly_todos').then(val => {
      if (val && val.length > 0) {
        const curWeek = weekKey()
        api.getSetting('weekly_key').then(wk => {
          if (wk !== curWeek) { const reset = val.map(i=>({...i,done:false})); setItems(reset); save(reset) }
          else setItems(val)
        })
      }
    })
  }, [])

  const uid = () => `w${Date.now()}`

  const toggle = id => { const u = items.map(i => i.id===id?{...i,done:!i.done}:i); save(u); setItems(u) }
  const add = () => {
    if (!newTitle.trim()) return
    const u = [...items, {id: uid(), title: newTitle.trim(), done: false}]
    save(u); setItems(u); setNewTitle('')
  }
  const remove = id => { const u = items.filter(i=>i.id!==id); save(u); setItems(u) }
  const startEdit = (item) => { setEditId(item.id); setEditTitle(item.title) }
  const saveEdit = () => {
    if (!editTitle.trim()) return
    const u = items.map(i => i.id===editId?{...i,title:editTitle.trim()}:i)
    save(u); setItems(u); setEditId(null)
  }

  return (
    <div style={{position:'relative'}}>
      <button onClick={()=>setShowPanel(!showPanel)}
        style={{display:'flex',alignItems:'center',gap:'0.35rem',padding:'0.35rem 0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:doneCount===items.length&&items.length>0?'#F0FDF4':'var(--bg-card)',cursor:'pointer',fontSize:'0.78rem',fontWeight:600,color:'var(--text-primary)',transition:'all 0.15s'}}>
        <span>📋</span>
        <span>Week</span>
        <span style={{background:doneCount===items.length&&items.length>0?'#059669':'var(--bg-secondary)',color:doneCount===items.length&&items.length>0?'#fff':'var(--text-secondary)',borderRadius:'99px',padding:'0.05rem 0.4rem',fontSize:'0.65rem',fontWeight:700}}>{doneCount}/{items.length}</span>
      </button>

      {showPanel && (
        <div style={{position:'absolute',top:'calc(100% + 6px)',right:0,zIndex:999,background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'12px',boxShadow:'0 8px 24px rgba(0,0,0,0.12)',padding:'0.75rem',minWidth:'280px',maxHeight:'400px',overflowY:'auto'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.6rem'}}>
            <div>
              <span style={{fontSize:'0.65rem',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--text-secondary)'}}>Wekelijkse to-dos</span>
              <div style={{fontSize:'0.62rem',color:'var(--text-secondary)',marginTop:'0.05rem'}}>Reset elke week automatisch</div>
            </div>
            <button onClick={()=>setShowPanel(false)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',fontSize:'0.75rem'}}>✕</button>
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:'0.3rem',marginBottom:'0.5rem'}}>
            {items.map(item => (
              <div key={item.id} style={{display:'flex',alignItems:'center',gap:'0.4rem',padding:'0.4rem 0.5rem',borderRadius:'8px',border:`1px solid ${item.done?'#059669':'var(--border)'}`,background:item.done?'#F0FDF4':'var(--bg-secondary)'}}>
                <input type="checkbox" checked={item.done} onChange={()=>toggle(item.id)} style={{width:'15px',height:'15px',cursor:'pointer',accentColor:'#059669',flexShrink:0}}/>
                {editId===item.id ? (
                  <input autoFocus value={editTitle} onChange={e=>setEditTitle(e.target.value)}
                    onKeyDown={e=>{if(e.key==='Enter')saveEdit();if(e.key==='Escape')setEditId(null)}}
                    onBlur={saveEdit}
                    style={{flex:1,border:'none',background:'transparent',fontSize:'0.8rem',outline:'none',fontFamily:'var(--font-body)',color:'var(--text-primary)'}}/>
                ) : (
                  <span onClick={()=>startEdit(item)} style={{flex:1,fontSize:'0.8rem',fontWeight:500,color:item.done?'#059669':'var(--text-primary)',textDecoration:item.done?'line-through':'none',cursor:'text'}}>{item.title}</span>
                )}
                <button onClick={()=>remove(item.id)} style={{background:'none',border:'none',cursor:'pointer',color:'transparent',fontSize:'0.65rem',padding:'0.1rem',flexShrink:0}}
                  onMouseEnter={e=>e.currentTarget.style.color='#DC2626'} onMouseLeave={e=>e.currentTarget.style.color='transparent'}>×</button>
              </div>
            ))}
          </div>

          <div style={{display:'flex',gap:'0.3rem'}}>
            <input value={newTitle} onChange={e=>setNewTitle(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()} placeholder="Nieuwe wekelijkse taak..." className="form-input" style={{flex:1,fontSize:'0.75rem',padding:'0.3rem 0.5rem'}}/>
            <button onClick={add} className="btn btn-sm btn-outline" style={{fontSize:'0.72rem',flexShrink:0}}>+</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── DAGELIJKSE CHECK-INS (COMPACT — naast header) ──────────────────────────
// ─── HIRING / ZOEKEN TRACKER ────────────────────────────────────────────────
function HiringTracker() {
  const load = () => { try { return JSON.parse(localStorage.getItem('artazest_hiring') || '[]') } catch { return [] } }
  const save = items => { localStorage.setItem('artazest_hiring', JSON.stringify(items)); api.saveSetting('hiring', items) }
  const [items, setItems] = useState(load)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({role:'',platform:'Upwork',status:'zoekend',notes:''})
  const STATUSES = [{key:'zoekend',label:'Zoekend',color:'#D97706',bg:'#FFFBEB'},{key:'gesprek',label:'In gesprek',color:'#2563EB',bg:'#EFF6FF'},{key:'proef',label:'Proefwerk',color:'#7C3AED',bg:'#F5F3FF'},{key:'aangenomen',label:'Aangenomen',color:'#059669',bg:'#F0FDF4'}]

  useEffect(()=>{ api.getSetting('hiring').then(v=>{ if(v?.length) setItems(v) }) },[])

  const add = () => { if(!form.role.trim()) return; const u=[...items,{id:`h-${Date.now()}`,...form}]; save(u); setItems(u); setForm({role:'',platform:'Upwork',status:'zoekend',notes:''}); setShowAdd(false) }
  const remove = id => { const u=items.filter(i=>i.id!==id); save(u); setItems(u) }
  const cycleStatus = id => { const u=items.map(i=>{if(i.id!==id)return i;const idx=STATUSES.findIndex(s=>s.key===i.status);return{...i,status:STATUSES[(idx+1)%STATUSES.length].key}}); save(u); setItems(u) }
  const updateNotes = (id,notes) => { const u=items.map(i=>i.id===id?{...i,notes}:i); save(u); setItems(u) }
  const [editNotes, setEditNotes] = useState(null)
  const active = items.filter(i=>i.status!=='aangenomen')

  return (
    <div style={{minWidth:'180px',maxWidth:'280px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'0.15rem'}}>
        <span style={{fontSize:'0.62rem',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--text-secondary)'}}>Zoeken <span style={{fontWeight:700}}>{active.length}</span></span>
        <button onClick={()=>setShowAdd(!showAdd)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'0.7rem',color:'var(--text-secondary)',padding:'0'}}>+ vacature</button>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'0.25rem'}}>
        {items.map(item=>{
          const st=STATUSES.find(s=>s.key===item.status)||STATUSES[0]
          return (
            <div key={item.id} style={{padding:'0.3rem 0.5rem',borderRadius:'6px',background:st.bg,borderLeft:`3px solid ${st.color}`,border:`1px solid ${st.color}30`,display:'flex',alignItems:'center',gap:'0.35rem'}}>
              <div onClick={()=>cycleStatus(item.id)} style={{width:'16px',height:'16px',borderRadius:'50%',border:`2px solid ${st.color}`,background:item.status==='aangenomen'?st.color:'transparent',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}>
                {item.status==='aangenomen'&&<span style={{color:'#fff',fontSize:'0.5rem'}}>✓</span>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'0.72rem',fontWeight:600,color:'var(--text-primary)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{item.role}</div>
                {editNotes===item.id?(
                  <input autoFocus value={item.notes||''} onChange={e=>updateNotes(item.id,e.target.value)} onBlur={()=>setEditNotes(null)} onKeyDown={e=>{if(e.key==='Enter'||e.key==='Escape')setEditNotes(null)}}
                    style={{width:'100%',border:'none',borderBottom:`1px solid ${st.color}`,background:'transparent',fontSize:'0.6rem',outline:'none',fontFamily:'var(--font-body)',padding:0}}/>
                ):(
                  <div onClick={()=>setEditNotes(item.id)} style={{fontSize:'0.6rem',color:item.notes?st.color:'#D1C4B8',fontWeight:item.notes?600:400,fontStyle:item.notes?'normal':'italic',cursor:'text',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {item.notes||'+ notitie'}
                  </div>
                )}
              </div>
              <span style={{fontSize:'0.5rem',color:'var(--text-secondary)',flexShrink:0}}>{item.platform?.slice(0,2)}</span>
              <span style={{fontSize:'0.5rem',padding:'0.05rem 0.25rem',borderRadius:'99px',background:`${st.color}20`,color:st.color,fontWeight:700,flexShrink:0}}>{st.label.slice(0,4)}</span>
              <button onClick={()=>remove(item.id)} style={{background:'none',border:'none',cursor:'pointer',color:'transparent',fontSize:'0.6rem',padding:0,flexShrink:0}}
                onMouseEnter={e=>e.currentTarget.style.color='#DC2626'} onMouseLeave={e=>e.currentTarget.style.color='transparent'}>×</button>
            </div>
          )
        })}
        {showAdd&&(
          <div style={{padding:'0.35rem',borderRadius:'6px',border:'1px dashed var(--accent)',background:'var(--accent-light)'}}>
            <div style={{display:'flex',gap:'0.25rem',alignItems:'center',marginBottom:'0.2rem'}}>
              <input autoFocus value={form.role} onChange={e=>setForm({...form,role:e.target.value})} onKeyDown={e=>e.key==='Enter'&&add()} placeholder="Rol (bijv. 3D designer)..." style={{flex:1,border:'none',background:'transparent',fontSize:'0.72rem',fontWeight:600,outline:'none',fontFamily:'var(--font-body)',padding:0,minWidth:0}}/>
              <select value={form.platform} onChange={e=>setForm({...form,platform:e.target.value})} style={{border:'none',background:'transparent',fontSize:'0.6rem',outline:'none',cursor:'pointer',fontFamily:'var(--font-body)',color:'var(--text-secondary)'}}>
                <option>Upwork</option><option>Fiverr</option><option>LinkedIn</option><option>Direct</option>
              </select>
            </div>
            <div style={{display:'flex',gap:'0.25rem'}}>
              <input value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} onKeyDown={e=>e.key==='Enter'&&add()} placeholder="Notitie..." style={{flex:1,border:'none',background:'transparent',fontSize:'0.62rem',outline:'none',fontFamily:'var(--font-body)',padding:0,minWidth:0,color:'var(--text-secondary)'}}/>
              <button onClick={add} style={{background:'var(--accent)',color:'#fff',border:'none',borderRadius:'4px',fontSize:'0.55rem',padding:'0.1rem 0.35rem',cursor:'pointer',fontWeight:600}}>+</button>
              <button onClick={()=>setShowAdd(false)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',fontSize:'0.6rem'}}>✕</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── PLATFORM CHECK-INS ─────────────────────────────────────────────────────
function PlatformCheckins() {
  // Today = reset om 1:00 's nachts lokale tijd
  const getToday = () => { const d=new Date(); if(d.getHours()<1) d.setDate(d.getDate()-1); return d.toISOString().slice(0,10) }
  const [today, setToday] = useState(getToday)
  const load = () => { try { return JSON.parse(localStorage.getItem('artazest_platforms') || '[]') } catch { return [] } }
  const save = items => { localStorage.setItem('artazest_platforms', JSON.stringify(items)); api.saveSetting('platform_checkins', items) }
  const DEFAULT = [
    {id:'pl-1',name:'Upwork',icon:'💼',checked:null,url:'https://www.upwork.com/messages'},
    {id:'pl-2',name:'Shopify',icon:'🛒',checked:null,url:'https://kfnqpb-ra.myshopify.com/admin'},
    {id:'pl-3',name:'Email',icon:'📧',checked:null,url:'https://mail.google.com'},
    {id:'pl-4',name:'Alibaba',icon:'📦',checked:null,url:'https://message.alibaba.com'},
    {id:'pl-5',name:'Instagram',icon:'📸',checked:null,url:'https://www.instagram.com/direct/inbox/'},
  ]
  const ICONS = ['💼','🛒','📧','📦','📸','💬','🎨','📊','🔧','🌐','💳','📱','🎯','📋','🏪','🖥','💰','🔔']
  const [items, setItems] = useState(load)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('🌐')
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [showIcons, setShowIcons] = useState(null)

  useEffect(()=>{ api.getSetting('platform_checkins').then(v=>{ if(v?.length) setItems(v); else { save(DEFAULT); setItems(DEFAULT) } }) },[])
  // Reset om 1:00 's nachts
  useEffect(()=>{ const iv=setInterval(()=>{ const n=getToday(); if(n!==today) setToday(n) },30000); return ()=>clearInterval(iv) },[today])

  const isChecked = item => item.checked === today
  const toggle = id => { const u=items.map(i=>i.id===id?{...i,checked:isChecked(i)?null:today}:i); save(u); setItems(u) }
  const remove = id => { const u=items.filter(i=>i.id!==id); save(u); setItems(u) }
  const add = () => { if(!newName.trim()) return; const u=[...items,{id:`pl-${Date.now()}`,name:newName.trim(),icon:newIcon,checked:null}]; save(u); setItems(u); setNewName(''); setNewIcon('🌐'); setShowAdd(false) }
  const updateName = (id,name) => { const u=items.map(i=>i.id===id?{...i,name}:i); save(u); setItems(u) }
  const updateIcon = (id,icon) => { const u=items.map(i=>i.id===id?{...i,icon}:i); save(u); setItems(u); setShowIcons(null) }
  const doneCount = items.filter(isChecked).length

  return (
    <div style={{minWidth:'140px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'0.15rem'}}>
        <span style={{fontSize:'0.62rem',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--text-secondary)'}}>
          Platforms <span style={{color:doneCount===items.length&&items.length>0?'#059669':'var(--text-secondary)',fontWeight:700}}>{doneCount}/{items.length}</span>
        </span>
        <button onClick={()=>setShowAdd(!showAdd)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'0.7rem',color:'var(--text-secondary)',padding:'0'}}>+</button>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'0.2rem'}}>
        {items.map(item => {
          const done = isChecked(item)
          return (
            <div key={item.id} style={{display:'flex',alignItems:'center',gap:'0.35rem',padding:'0.25rem 0.4rem',borderRadius:'6px',background:done?'#F0FDF4':'var(--bg-card)',border:`1px solid ${done?'#BBF7D0':'var(--border)'}`,transition:'all 0.12s',userSelect:'none',position:'relative'}}
              onMouseEnter={e=>e.currentTarget.style.background=done?'#DCFCE7':'var(--bg-secondary)'} onMouseLeave={e=>e.currentTarget.style.background=done?'#F0FDF4':'var(--bg-card)'}>
              {/* Icon — klik om te wijzigen */}
              <span onClick={e=>{e.stopPropagation();setShowIcons(showIcons===item.id?null:item.id)}} style={{fontSize:'0.7rem',flexShrink:0,cursor:'pointer',borderRadius:'3px',padding:'0 1px'}}
                onMouseEnter={e=>e.currentTarget.style.background='var(--bg-secondary)'} onMouseLeave={e=>e.currentTarget.style.background='none'}>{item.icon}</span>
              {showIcons===item.id&&(
                <div onClick={e=>e.stopPropagation()} style={{position:'absolute',top:'100%',left:0,zIndex:99,background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'8px',boxShadow:'0 6px 20px rgba(0,0,0,0.12)',padding:'0.4rem',display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:'0.2rem',minWidth:'140px',marginTop:'2px'}}>
                  {ICONS.map(ic=><button key={ic} onClick={()=>updateIcon(item.id,ic)} style={{fontSize:'0.85rem',padding:'0.2rem',border:'none',background:item.icon===ic?'var(--accent-light)':'none',borderRadius:'4px',cursor:'pointer'}}>{ic}</button>)}
                </div>
              )}
              {/* Naam — dubbelklik om te bewerken */}
              {editId===item.id ? (
                <input autoFocus value={editName} onChange={e=>setEditName(e.target.value)}
                  onBlur={()=>{if(editName.trim())updateName(item.id,editName.trim());setEditId(null)}}
                  onKeyDown={e=>{if(e.key==='Enter'){if(editName.trim())updateName(item.id,editName.trim());setEditId(null)}if(e.key==='Escape')setEditId(null)}}
                  onClick={e=>e.stopPropagation()}
                  style={{flex:1,border:'none',borderBottom:'1px solid var(--accent)',background:'transparent',fontSize:'0.72rem',fontWeight:600,outline:'none',fontFamily:'var(--font-body)',color:'var(--text-primary)',padding:0,minWidth:0}}/>
              ) : (
                <span onClick={()=>toggle(item.id)} onDoubleClick={e=>{e.stopPropagation();setEditId(item.id);setEditName(item.name)}}
                  style={{fontSize:'0.72rem',fontWeight:600,color:done?'#059669':'var(--text-primary)',flex:1,textDecoration:done?'line-through':'none',cursor:'pointer'}} title="Dubbelklik om naam te wijzigen">{item.name}</span>
              )}
              {done&&<span style={{color:'#059669',fontSize:'0.6rem',flexShrink:0}}>✓</span>}
              {item.url&&<a href={item.url} target="_blank" rel="noopener" onClick={e=>e.stopPropagation()} style={{color:'var(--accent)',fontSize:'0.55rem',flexShrink:0,padding:'0.1rem',borderRadius:'3px',textDecoration:'none'}}
                onMouseEnter={e=>e.currentTarget.style.background='var(--accent-light)'} onMouseLeave={e=>e.currentTarget.style.background='none'} title={`Open ${item.name}`}>→</a>}
              <button onClick={e=>{e.stopPropagation();setEditId(item.id);setEditName(item.name)}} style={{background:'none',border:'none',cursor:'pointer',color:'#9CA3AF',fontSize:'0.55rem',flexShrink:0,padding:'0.1rem',borderRadius:'3px'}}
                onMouseEnter={e=>{e.currentTarget.style.color='var(--accent)';e.currentTarget.style.background='var(--accent-light)'}} onMouseLeave={e=>{e.currentTarget.style.color='#9CA3AF';e.currentTarget.style.background='none'}} title="Naam wijzigen">✎</button>
              <button onClick={e=>{e.stopPropagation();if(confirm(`${item.name} verwijderen?`))remove(item.id)}} style={{background:'none',border:'none',cursor:'pointer',color:'#D1D5DB',fontSize:'0.65rem',flexShrink:0,padding:'0.1rem',borderRadius:'3px'}}
                onMouseEnter={e=>{e.currentTarget.style.color='#DC2626';e.currentTarget.style.background='#FEE2E2'}} onMouseLeave={e=>{e.currentTarget.style.color='#D1D5DB';e.currentTarget.style.background='none'}} title="Verwijderen">×</button>
            </div>
          )
        })}
        {showAdd&&(
          <div style={{padding:'0.3rem',borderRadius:'6px',border:'1px dashed var(--accent)',background:'var(--accent-light)'}}>
            <div style={{display:'flex',gap:'0.25rem',alignItems:'center'}}>
              <button onClick={()=>setNewIcon(ICONS[(ICONS.indexOf(newIcon)+1)%ICONS.length])} style={{fontSize:'0.85rem',border:'none',background:'none',cursor:'pointer',padding:0}} title="Klik om icoon te kiezen">{newIcon}</button>
              <input autoFocus value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')add();if(e.key==='Escape')setShowAdd(false)}} placeholder="Naam..." style={{flex:1,border:'none',background:'transparent',fontSize:'0.72rem',fontWeight:600,outline:'none',fontFamily:'var(--font-body)',padding:'0.15rem 0',minWidth:0}}/>
              <button onClick={add} style={{background:'var(--accent)',color:'#fff',border:'none',borderRadius:'4px',fontSize:'0.55rem',padding:'0.12rem 0.35rem',cursor:'pointer',fontWeight:600}}>+</button>
              <button onClick={()=>setShowAdd(false)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',fontSize:'0.6rem'}}>✕</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── DESIGNERS TRACKER ──────────────────────────────────────────────────────
function DesignersTracker() {
  const load = () => { try { return JSON.parse(localStorage.getItem('artazest_designers') || '[]') } catch { return [] } }
  const save = items => { localStorage.setItem('artazest_designers', JSON.stringify(items)); api.saveSetting('designers', items) }
  const [designers, setDesigners] = useState(load)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({name:'',task:'',platform:'Upwork'})
  const PLATFORMS = ['Upwork','Fiverr','Direct','Intern']
  const STATUS_CYCLE = ['idle','bezig','review','klaar']
  const STATUS_STYLE = {idle:{bg:'#F5F5F4',border:'#D6D3D1',color:'#78716C',label:'Vrij'},bezig:{bg:'#FEF3C7',border:'#FDE68A',color:'#92400E',label:'Bezig'},review:{bg:'#DBEAFE',border:'#93C5FD',color:'#1D4ED8',label:'Review'},klaar:{bg:'#F0FDF4',border:'#BBF7D0',color:'#059669',label:'Klaar'}}

  useEffect(()=>{ api.getSetting('designers').then(v=>{ if(v?.length) setDesigners(v) }) },[])

  const add = () => { if(!form.name.trim()) return; const d=[...designers,{id:`d-${Date.now()}`,name:form.name.trim(),task:form.task.trim(),platform:form.platform,status:'bezig'}]; save(d); setDesigners(d); setForm({name:'',task:'',platform:'Upwork'}); setShowAdd(false) }
  const remove = id => { const d=designers.filter(x=>x.id!==id); save(d); setDesigners(d) }
  const cycleStatus = id => { const d=designers.map(x=>{if(x.id!==id)return x;const i=STATUS_CYCLE.indexOf(x.status||'idle');return{...x,status:STATUS_CYCLE[(i+1)%STATUS_CYCLE.length]}}); save(d); setDesigners(d) }
  const updateTask = (id,task) => { const d=designers.map(x=>x.id===id?{...x,task}:x); save(d); setDesigners(d) }
  const [editTask, setEditTask] = useState(null)

  return (
    <div style={{minWidth:'200px',maxWidth:'500px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'0.15rem'}}>
        <span style={{fontSize:'0.62rem',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--text-secondary)'}}>
          Designers <span style={{fontWeight:700}}>{designers.filter(d=>d.status==='bezig').length}/{designers.length}</span>
        </span>
        <button onClick={()=>setShowAdd(!showAdd)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'0.7rem',color:'var(--text-secondary)',padding:'0'}}>+ designer</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))',gap:'0.25rem'}}>
        {designers.map(d=>{
          const st = STATUS_STYLE[d.status||'idle']
          return (
            <div key={d.id} style={{padding:'0.3rem 0.5rem',borderRadius:'6px',background:st.bg,borderLeft:`3px solid ${st.color}`,border:`1px solid ${st.border}`,display:'flex',alignItems:'center',gap:'0.35rem'}}>
              <div onClick={()=>cycleStatus(d.id)} style={{width:'16px',height:'16px',borderRadius:'50%',border:`2px solid ${st.color}`,background:d.status==='klaar'?st.color:'transparent',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0,transition:'all 0.15s'}}>
                {d.status==='klaar'&&<span style={{color:'#fff',fontSize:'0.5rem'}}>✓</span>}
                {d.status==='bezig'&&<span style={{color:st.color,fontSize:'0.45rem'}}>●</span>}
                {d.status==='review'&&<span style={{color:st.color,fontSize:'0.45rem'}}>◎</span>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'0.72rem',fontWeight:600,color:'var(--text-primary)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{d.name}</div>
                {editTask===d.id ? (
                  <input autoFocus value={d.task||''} onChange={e=>updateTask(d.id,e.target.value)}
                    onBlur={()=>setEditTask(null)} onKeyDown={e=>{if(e.key==='Enter'||e.key==='Escape')setEditTask(null)}}
                    style={{width:'100%',border:'none',borderBottom:`1px solid ${st.color}`,background:'transparent',fontSize:'0.65rem',outline:'none',fontFamily:'var(--font-body)',color:'var(--text-primary)',padding:0,fontWeight:600}}/>
                ) : (
                  <div onClick={e=>{e.stopPropagation();setEditTask(d.id)}} style={{fontSize:d.task?'0.65rem':'0.6rem',color:d.task?'var(--text-primary)':'#D1C4B8',fontWeight:d.task?700:400,fontStyle:d.task?'normal':'italic',cursor:'text',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',background:d.task?`${st.color}18`:'none',padding:d.task?'0.06rem 0.35rem':'0',borderRadius:'3px',marginTop:'0.05rem'}}>
                    {d.task||'+ waar bezig mee?'}
                  </div>
                )}
              </div>
              <span style={{fontSize:'0.5rem',color:'var(--text-secondary)',flexShrink:0}}>{d.platform?.slice(0,2)}</span>
              <button onClick={()=>remove(d.id)} style={{background:'none',border:'none',cursor:'pointer',color:'transparent',fontSize:'0.6rem',padding:0,flexShrink:0}}
                onMouseEnter={e=>e.currentTarget.style.color='#DC2626'} onMouseLeave={e=>e.currentTarget.style.color='transparent'}>×</button>
            </div>
          )
        })}
      </div>
      {showAdd&&(
        <div style={{display:'flex',gap:'0.25rem',marginTop:'0.25rem',alignItems:'center'}}>
          <input autoFocus value={form.name} onChange={e=>setForm({...form,name:e.target.value})} onKeyDown={e=>e.key==='Enter'&&add()} placeholder="Naam..." style={{flex:1,border:'none',borderBottom:'1px solid var(--accent)',background:'transparent',fontSize:'0.72rem',fontWeight:600,outline:'none',fontFamily:'var(--font-body)',padding:'0.15rem 0',minWidth:0}}/>
          <input value={form.task} onChange={e=>setForm({...form,task:e.target.value})} onKeyDown={e=>e.key==='Enter'&&add()} placeholder="Bezig met..." style={{flex:1,border:'none',borderBottom:'1px solid var(--border)',background:'transparent',fontSize:'0.65rem',outline:'none',fontFamily:'var(--font-body)',padding:'0.15rem 0',minWidth:0}}/>
          <select value={form.platform} onChange={e=>setForm({...form,platform:e.target.value})} style={{border:'none',background:'transparent',fontSize:'0.6rem',outline:'none',cursor:'pointer',fontFamily:'var(--font-body)',color:'var(--text-secondary)'}}>
            {PLATFORMS.map(p=><option key={p}>{p}</option>)}
          </select>
          <button onClick={add} style={{background:'var(--accent)',color:'#fff',border:'none',borderRadius:'4px',fontSize:'0.6rem',padding:'0.15rem 0.4rem',cursor:'pointer',fontWeight:600,flexShrink:0}}>+</button>
          <button onClick={()=>setShowAdd(false)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',fontSize:'0.6rem',flexShrink:0}}>✕</button>
        </div>
      )}
    </div>
  )
}

function DagelijkseCheckinsCompact() {
  // Today = reset om 1:00 's nachts lokale tijd
  const getToday = () => { const d=new Date(); if(d.getHours()<1) d.setDate(d.getDate()-1); return d.toISOString().slice(0,10) }
  const [today, setToday] = useState(getToday)
  const load = () => { try { return JSON.parse(localStorage.getItem('artazest_checkins') || '[]') } catch { return [] } }
  const save = items => { localStorage.setItem('artazest_checkins', JSON.stringify(items)); api.saveSetting('checkins', items) }
  const [items, setItems] = useState(load)

  useEffect(() => { api.getSetting('checkins').then(val => { if (val && val.length > 0) setItems(val) }) }, [])
  // Reset om 1:00 's nachts
  useEffect(() => { const iv = setInterval(() => { const now = getToday(); if(now !== today) setToday(now) }, 30000); return () => clearInterval(iv) }, [today])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({name:'', via:'WhatsApp', topic:''})
  const [editStatus, setEditStatus] = useState(null) // id van persoon wiens status je bewerkt
  const viaIcon = {WhatsApp:'💬', Bellen:'📞', Email:'📧', Bezoek:'🤝', Teams:'💻'}
  const VIA_OPTIONS = ['WhatsApp','Bellen','Email','Bezoek','Teams']
  const getState = item => item.checkedDate === today ? 'done' : (item.status && item.statusDate === today) ? 'waiting' : 'none'
  const doneCount = items.filter(i => getState(i)==='done').length
  const waitCount = items.filter(i => getState(i)==='waiting').length

  const toggle = id => {
    const item = items.find(i=>i.id===id)
    if(!item) return
    const st = getState(item)
    // Cycle: none → waiting → done → none
    const next = st==='none' ? 'waiting' : st==='waiting' ? 'done' : 'none'
    const u = items.map(i => i.id===id ? {...i, checkedDate: next==='none'?null:today, checkState: next==='none'?null:next, statusDate: next==='none'?null:today } : i)
    save(u); setItems(u)
  }
  const remove = id => { const u = items.filter(i=>i.id!==id); save(u); setItems(u) }
  const add = () => {
    if (!form.name.trim()) return
    const u = [...items, {...form, id:`ci-${Date.now()}`, checkedDate:null, status:'', notif:true}]
    save(u); setItems(u); setForm({name:'', via:'WhatsApp', topic:''}); setShowAdd(false)
  }
  const updateStatus = (id, val) => {
    const u = items.map(i => i.id===id ? {...i, status:val, statusDate: val ? today : null} : i)
    save(u); setItems(u)
  }
  const toggleNotif = (id) => {
    const u = items.map(i => i.id===id ? {...i, notif: !i.notif} : i)
    save(u); setItems(u)
    // Vraag notificatie toestemming als nodig
    if (Notification && Notification.permission === 'default') Notification.requestPermission()
  }

  // Dagelijkse notificatie check
  useEffect(() => {
    const today = new Date().toISOString().slice(0,10)
    const lastNotif = localStorage.getItem('artazest_checkin_notif_date')
    if (lastNotif === today) return // Vandaag al gedaan
    
    const notifItems = items.filter(i => i.notif !== false && getState(i)==='none')
    if (notifItems.length === 0) return
    
    // Vraag toestemming en stuur notificatie
    const sendNotif = () => {
      if (Notification.permission === 'granted') {
        notifItems.forEach(item => {
          new Notification(`Check-in: ${item.name}`, {
            body: item.topic ? `Vergeet niet te checken over: ${item.topic}` : `Heb je al contact gehad met ${item.name}?`,
            icon: '/favicon.ico',
            tag: `checkin-${item.id}`
          })
        })
        localStorage.setItem('artazest_checkin_notif_date', today)
      }
    }
    
    if (Notification && Notification.permission === 'default') {
      Notification.requestPermission().then(p => { if (p === 'granted') sendNotif() })
    } else if (Notification && Notification.permission === 'granted') {
      // Stuur na 2 sec zodat de pagina geladen is
      setTimeout(sendNotif, 2000)
    }
  }, [])

  return (
    <div style={{minWidth:'220px',maxWidth:'600px'}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'0.1rem'}}>
        <span style={{fontSize:'0.62rem',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--text-secondary)'}}>
          Check-ins <span style={{color:doneCount===items.length&&items.length>0?'#059669':'var(--text-secondary)',fontWeight:700}}>{doneCount}/{items.length}</span>{waitCount>0&&<span style={{color:'#D97706',fontWeight:700}}> · {waitCount} ⏳</span>}
        </span>
        <button onClick={()=>setShowAdd(!showAdd)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'0.7rem',color:'var(--text-secondary)',padding:'0'}}>+ persoon</button>
      </div>

      {/* Personen — grid, max 4 per kolom */}
      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))',
        gap:'0.3rem',
        alignItems:'start',
        marginBottom:'0.3rem'
      }}>
        {items.map(item => {
          const st = getState(item)
          const colors = { none:{bg:'#FEF2F2',border:'#FECACA',dot:'#DC2626',icon:''},waiting:{bg:'#FFFBEB',border:'#FDE68A',dot:'#D97706',icon:'⏳'},done:{bg:'#F0FDF4',border:'#BBF7D0',dot:'#059669',icon:'✓'} }
          const cs = colors[st]
          return (
            <div key={item.id}
              style={{padding:'0.3rem 0.5rem',borderRadius:'6px',background:cs.bg,borderLeft:`3px solid ${cs.dot}`,border:`1px solid ${cs.border}`,cursor:'pointer',transition:'all 0.15s',userSelect:'none'}}
              onClick={()=>toggle(item.id)}>
              <div style={{display:'flex',alignItems:'center',gap:'0.35rem'}}>
                <div onClick={e=>{e.stopPropagation();toggle(item.id)}} style={{width:'18px',height:'18px',borderRadius:'50%',border:`2px solid ${cs.dot}`,background:st!=='none'?cs.dot:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,cursor:'pointer',transition:'all 0.15s'}}>
                  {st==='done'&&<span style={{color:'#fff',fontSize:'0.55rem',lineHeight:1}}>✓</span>}
                  {st==='waiting'&&<span style={{color:'#fff',fontSize:'0.5rem',lineHeight:1}}>⏳</span>}
                </div>
                <span style={{fontSize:'0.78rem',fontWeight:700,color:'#1C1917',whiteSpace:'nowrap',flexShrink:0}}>
                  {item.name}
                </span>
                <div style={{flex:1,minWidth:0}} onClick={e=>e.stopPropagation()}>
                  {editStatus===item.id ? (
                    <input autoFocus value={item.status||''} onChange={e=>updateStatus(item.id,e.target.value)}
                      onBlur={()=>setEditStatus(null)} onKeyDown={e=>{if(e.key==='Enter'||e.key==='Escape')setEditStatus(null)}}
                      placeholder="bezig met..." style={{width:'100%',border:'none',borderBottom:'1px solid var(--accent)',background:'transparent',fontSize:'0.62rem',outline:'none',fontFamily:'var(--font-body)',color:'var(--text-secondary)',padding:0}}/>
                  ) : (
                    <span onClick={()=>setEditStatus(item.id)} style={{fontSize:item.status?'0.72rem':'0.62rem',color:item.status?st==='waiting'?'#92400E':'var(--text-primary)':'#D1C4B8',fontWeight:item.status?700:400,fontStyle:item.status?'normal':'italic',cursor:'text',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'block',background:item.status?'#FEF3C7':'none',padding:item.status?'0.08rem 0.4rem':'0',borderRadius:'4px'}}>
                      {item.status||'+ status'}
                    </span>
                  )}
                </div>
                <span style={{fontSize:'0.55rem',color:'var(--text-secondary)',flexShrink:0}}>{viaIcon[item.via]||''}</span>
                <button onClick={e=>{e.stopPropagation();toggleNotif(item.id)}} style={{background:'none',border:'none',cursor:'pointer',fontSize:'0.55rem',padding:'0',flexShrink:0}}>
                  {item.notif!==false?'🔔':'🔕'}
                </button>
                <button onClick={e=>{e.stopPropagation();if(confirm(`${item.name} verwijderen?`))remove(item.id)}} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',fontSize:'0.75rem',padding:'0.15rem 0.25rem',flexShrink:0,opacity:0.5,borderRadius:'4px',lineHeight:1}}
                  onMouseEnter={e=>{e.currentTarget.style.opacity='1';e.currentTarget.style.color='#DC2626';e.currentTarget.style.background='#FEE2E2'}} onMouseLeave={e=>{e.currentTarget.style.opacity='0.5';e.currentTarget.style.color='var(--text-secondary)';e.currentTarget.style.background='none'}}>×</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Toevoeg form */}
      {showAdd && (
        <div style={{padding:'0.35rem 0.45rem',borderRadius:'6px',border:'1px solid var(--border)',background:'var(--bg-secondary)',display:'flex',flexDirection:'column',gap:'0.2rem',marginBottom:'0.25rem'}}>
          <div style={{display:'flex',gap:'0.25rem',alignItems:'center'}}>
            <input autoFocus value={form.name} onChange={e=>setForm({...form,name:e.target.value})} onKeyDown={e=>e.key==='Enter'&&add()}
              placeholder="Naam..." style={{flex:1,border:'none',background:'transparent',fontSize:'0.75rem',fontWeight:600,outline:'none',fontFamily:'var(--font-body)',color:'var(--text-primary)',minWidth:0}}/>
            <select value={form.via} onChange={e=>setForm({...form,via:e.target.value})} style={{border:'none',background:'transparent',fontSize:'0.65rem',outline:'none',cursor:'pointer',fontFamily:'var(--font-body)',color:'var(--text-secondary)'}}>
              {VIA_OPTIONS.map(v=><option key={v}>{v}</option>)}
            </select>
          </div>
          <div style={{display:'flex',gap:'0.25rem',alignItems:'center'}}>
            <input value={form.topic} onChange={e=>setForm({...form,topic:e.target.value})} onKeyDown={e=>e.key==='Enter'&&add()}
              placeholder="Onderwerp..." style={{flex:1,border:'none',background:'transparent',fontSize:'0.68rem',outline:'none',fontFamily:'var(--font-body)',color:'var(--text-secondary)',minWidth:0}}/>
            <button onClick={add} style={{background:'var(--accent)',color:'#fff',border:'none',borderRadius:'4px',fontSize:'0.62rem',padding:'0.12rem 0.4rem',cursor:'pointer',fontWeight:600,whiteSpace:'nowrap',flexShrink:0}}>+ Toevoegen</button>
            <button onClick={()=>setShowAdd(false)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',fontSize:'0.65rem',padding:0,flexShrink:0}}>✕</button>
          </div>
        </div>
      )}

      {items.length===0&&!showAdd&&(
        <div style={{fontSize:'0.72rem',color:'var(--text-secondary)',fontStyle:'italic',padding:'0.25rem 0'}}>Voeg mensen toe die je dagelijks checkt</div>
      )}
    </div>
  )
}

function DagelijkseCheckins() {
  const today = new Date().toISOString().slice(0,10)
  const load = () => JSON.parse(localStorage.getItem('artazest_checkins') || '[]')
  const save = items => { localStorage.setItem('artazest_checkins', JSON.stringify(items)); api.saveSetting('checkins', items) }

  const [items, setItems] = useState(load)
  useEffect(() => { api.getSetting('checkins').then(val => { if (val && val.length > 0) setItems(val) }) }, [])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({name:'', via:'WhatsApp', topic:''})

  const isChecked = item => item.checkedDate === today

  const toggle = id => {
    const updated = items.map(i => i.id===id ? {...i, checkedDate: isChecked(i)?null:today} : i)
    save(updated); setItems(updated)
  }
  const add = () => {
    if (!form.name.trim()) return
    const updated = [...items, {...form, id:`ci-${Date.now()}`, checkedDate:null}]
    save(updated); setItems(updated); setForm({name:'', via:'WhatsApp', topic:''}); setShowAdd(false)
  }
  const remove = id => { const updated = items.filter(i=>i.id!==id); save(updated); setItems(updated) }

  const doneCount = items.filter(isChecked).length
  const viaIcon = {WhatsApp:'💬', Bellen:'📞', Email:'📧', Bezoek:'🤝', Teams:'💻'}

  return (
    <div style={{marginBottom:'1.1rem'}}>
      <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.5rem'}}>
        <span style={{fontSize:'0.62rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-secondary)'}}>Dagelijkse check-ins</span>
        {items.length>0&&<span style={{fontSize:'0.62rem',color:doneCount===items.length?'#059669':'var(--text-secondary)',fontWeight:600}}>{doneCount}/{items.length}</span>}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'0.5rem'}}>
        {items.map(item => {
          const done = isChecked(item)
          return (
            <div key={item.id}
              onClick={()=>toggle(item.id)}
              style={{position:'relative',padding:'0.6rem 0.7rem',borderRadius:'10px',border:`1.5px solid ${done?'#059669':'var(--border)'}`,background:done?'#F0FDF4':'var(--bg-card)',cursor:'pointer',transition:'all 0.15s',userSelect:'none'}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.07)'}
              onMouseLeave={e=>e.currentTarget.style.boxShadow=''}>
              {/* Vinkje */}
              <div style={{position:'absolute',top:'0.45rem',right:'0.45rem',width:'16px',height:'16px',borderRadius:'50%',border:`2px solid ${done?'#059669':'#D1D5DB'}`,background:done?'#059669':item.status?'#D97706':'transparent',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s'}}>
                {done&&<span style={{color:'#fff',fontSize:'0.55rem',lineHeight:1}}>✓</span>}
              </div>
              {/* Via icon */}
              <div style={{fontSize:'1rem',marginBottom:'0.2rem',lineHeight:1}}>{viaIcon[item.via]||'👤'}</div>
              {/* Naam */}
              <div style={{fontWeight:600,fontSize:'0.78rem',color:done?'#059669':'var(--text-primary)',textDecoration:done?'line-through':'none',marginBottom:'0.08rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.name}</div>
              {/* Via */}
              <div style={{fontSize:'0.62rem',color:'var(--text-secondary)'}}>{item.via}</div>
              {/* Onderwerp */}
              {item.topic&&<div style={{fontSize:'0.62rem',color:'var(--text-secondary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginTop:'0.08rem'}}>· {item.topic}</div>}
              {/* Verwijder */}
              <button onClick={e=>{e.stopPropagation();remove(item.id)}}
                style={{position:'absolute',bottom:'0.35rem',right:'0.4rem',background:'none',border:'none',cursor:'pointer',fontSize:'0.65rem',color:'transparent',padding:0,lineHeight:1}}
                onMouseEnter={e=>{e.stopPropagation();e.currentTarget.style.color='#DC2626'}}
                onMouseLeave={e=>e.currentTarget.style.color='transparent'}>×</button>
            </div>
          )
        })}

        {/* Toevoeg-card */}
        {!showAdd ? (
          <div onClick={()=>setShowAdd(true)}
            style={{padding:'0.6rem 0.7rem',borderRadius:'10px',border:'1.5px dashed var(--border)',background:'transparent',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'0.2rem',opacity:0.55,transition:'opacity 0.15s',minHeight:'76px'}}
            onMouseEnter={e=>e.currentTarget.style.opacity='1'}
            onMouseLeave={e=>e.currentTarget.style.opacity='0.55'}>
            <span style={{fontSize:'1.1rem',lineHeight:1}}>+</span>
            <span style={{fontSize:'0.65rem',color:'var(--text-secondary)',fontWeight:500}}>Persoon</span>
          </div>
        ) : (
          <div style={{padding:'0.55rem 0.65rem',borderRadius:'10px',border:'1.5px dashed var(--accent)',background:'var(--accent-light)',display:'flex',flexDirection:'column',gap:'0.3rem'}}>
            <input autoFocus value={form.name} onChange={e=>setForm({...form,name:e.target.value})} onKeyDown={e=>e.key==='Enter'&&add()} placeholder="Naam" style={{border:'none',background:'transparent',fontSize:'0.78rem',fontWeight:600,outline:'none',width:'100%',fontFamily:'var(--font-body)',color:'var(--text-primary)'}}/>
            <select value={form.via} onChange={e=>setForm({...form,via:e.target.value})} style={{border:'none',background:'transparent',fontSize:'0.65rem',outline:'none',cursor:'pointer',fontFamily:'var(--font-body)',color:'var(--text-secondary)',padding:0}}>
              {VIA_OPTIONS.map(v=><option key={v}>{v}</option>)}
            </select>
            <input value={form.topic} onChange={e=>setForm({...form,topic:e.target.value})} onKeyDown={e=>e.key==='Enter'&&add()} placeholder="Waarover..." style={{border:'none',background:'transparent',fontSize:'0.65rem',outline:'none',width:'100%',fontFamily:'var(--font-body)',color:'var(--text-secondary)'}}/>
            <div style={{display:'flex',gap:'0.3rem',marginTop:'0.1rem'}}>
              <button onClick={add} style={{background:'var(--accent)',color:'#fff',border:'none',borderRadius:'5px',fontSize:'0.65rem',padding:'0.2rem 0.4rem',cursor:'pointer',flex:1}}>+ Add</button>
              <button onClick={()=>setShowAdd(false)} style={{background:'none',border:'1px solid var(--border)',borderRadius:'5px',fontSize:'0.65rem',padding:'0.2rem 0.4rem',cursor:'pointer',color:'var(--text-secondary)'}}>✕</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


function Timeline({ tasks, onDropDay, draggedId, onTaskClick, onTaskUpdate }) {
  const today = new Date(); today.setHours(0,0,0,0)
  const DAYS = 14
  const LANES = ['Tein','Sam','Productie']
  const LANE_COLORS = {Tein:'#D97706',Sam:'#2563EB',Productie:'#059669'}
  const days = Array.from({length:DAYS},(_,i)=>{ const d=new Date(today); d.setDate(d.getDate()+i); return d })
  const toISO = d => new Date(d).toISOString().slice(0,10)
  const todayStr = toISO(today)
  const launchStr = '2026-04-18'
  const statusColor = { todo:'#D6D3D1', gepland:'#93C5FD', bezig:'#FCD34D', klaar:'#86EFAC' }
  const [overDay, setOverDay] = useState(null)
  const [clickedDay, setClickedDay] = useState(null)

  const ganttTasks = tasks.filter(t => !t.archived && t.status!=='klaar' && t.plannedDate)

  const tasksForDay = (day, lane) => {
    const iso = toISO(day)
    return ganttTasks.filter(t => {
      if(t.assignee!==lane) return false
      const start = t.plannedDate || t.dueDate
      const end = t.dueDate || t.plannedDate
      return iso >= start && iso <= end
    })
  }

  return (
    <div style={{display:'flex',gap:'2px',alignItems:'flex-end',padding:'0.5rem 0'}}>
      {days.map((day,i) => {
        const iso = toISO(day)
        const isToday = iso===todayStr
        const isLaunch = iso===launchStr
        const isWeekend = day.getDay()===0||day.getDay()===6
        const isOver = overDay===iso && !!draggedId
        const dayName = day.toLocaleDateString('nl-NL',{weekday:'narrow'})
        const allDayTasks = LANES.flatMap(l => tasksForDay(day,l))

        return (
          <div key={iso} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'2px',minWidth:0,cursor:'pointer',position:'relative'}}
            onClick={()=>setClickedDay(clickedDay===iso?null:iso)}
            onDragOver={e=>{e.preventDefault();setOverDay(iso)}}
            onDragLeave={()=>setOverDay(null)}
            onDrop={e=>{e.preventDefault();setOverDay(null);if(draggedId)onDropDay(draggedId,iso)}}>

            {/* Taak balkjes per lane */}
            <div style={{width:'100%',minHeight:'60px',display:'flex',flexDirection:'column',gap:'1px',justifyContent:'flex-end'}}>
              {LANES.map(lane => {
                const lt = tasksForDay(day,lane)
                if(lt.length===0) return null
                return lt.map(t => (
                  <div key={t.id} onClick={e=>{e.stopPropagation();onTaskClick&&onTaskClick(t)}}
                    title={`${t.title} (${lane})`}
                    style={{width:'100%',height:'8px',borderRadius:'2px',background:LANE_COLORS[lane],opacity:t.status==='bezig'?1:0.5,cursor:'pointer',transition:'all 0.15s'}}
                    onMouseEnter={e=>{e.currentTarget.style.height='16px';e.currentTarget.style.opacity='1'}}
                    onMouseLeave={e=>{e.currentTarget.style.height='8px';e.currentTarget.style.opacity=t.status==='bezig'?'1':'0.5'}}/>
                ))
              })}
              {allDayTasks.length===0&&<div style={{width:'100%',height:'4px',borderRadius:'2px',background:isOver?'#BFDBFE':'transparent',transition:'all 0.15s'}}/>}
            </div>

            {/* Dag indicator */}
            <div style={{width:'100%',height:isToday?'4px':clickedDay===iso?'3px':'2px',borderRadius:'99px',background:isToday?'#D97706':isLaunch?'#DC2626':clickedDay===iso?'var(--accent)':isOver?'#2563EB':isWeekend?'rgba(0,0,0,0.06)':'rgba(0,0,0,0.1)',transition:'all 0.15s'}}/>

            {/* Label */}
            <div style={{textAlign:'center',lineHeight:1}}>
              <div style={{fontSize:'0.5rem',fontWeight:600,color:isToday?'#D97706':isLaunch?'#DC2626':isWeekend?'#D1D5DB':'#9CA3AF',textTransform:'uppercase'}}>{dayName}</div>
              <div style={{fontSize:'0.68rem',fontWeight:isToday||isLaunch?700:400,color:isToday?'#D97706':isLaunch?'#DC2626':'#78716C'}}>{day.getDate()}</div>
              {isLaunch&&<div style={{fontSize:'0.4rem',color:'#DC2626',fontWeight:700,marginTop:'-1px'}}>LAUNCH</div>}
              {allDayTasks.length>0&&<div style={{fontSize:'0.5rem',color:'var(--text-secondary)',fontWeight:600,marginTop:'1px'}}>{allDayTasks.length}</div>}
            </div>

            {/* Day popup */}
            {clickedDay===iso&&allDayTasks.length>0&&(
              <div onClick={e=>e.stopPropagation()} style={{position:'absolute',top:'100%',left:'50%',transform:'translateX(-50%)',zIndex:99,background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'10px',boxShadow:'0 8px 24px rgba(0,0,0,0.12)',padding:'0.5rem',minWidth:'180px',marginTop:'4px'}}>
                <div style={{fontSize:'0.6rem',fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'0.3rem'}}>{day.toLocaleDateString('nl-NL',{weekday:'long',day:'numeric',month:'short'})}</div>
                {allDayTasks.map(t=>(
                  <div key={t.id} onClick={()=>{onTaskClick&&onTaskClick(t);setClickedDay(null)}} style={{display:'flex',alignItems:'center',gap:'0.3rem',padding:'0.25rem 0.35rem',borderRadius:'5px',cursor:'pointer',marginBottom:'0.15rem',borderLeft:`3px solid ${LANE_COLORS[t.assignee]||'#9CA3AF'}`}}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--bg-secondary)'} onMouseLeave={e=>e.currentTarget.style.background='none'}>
                    <span style={{fontSize:'0.72rem',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{t.title}</span>
                    <span style={{fontSize:'0.58rem',color:'var(--text-secondary)',flexShrink:0}}>{t.assignee}</span>
                  </div>
                ))}
              </div>
            )}

            {isOver&&<div style={{width:'100%',height:'2px',borderRadius:'99px',background:'#2563EB',marginTop:'-2px'}}/>}
          </div>
        )
      })}
    </div>
  )
}


function VandaagPanel({ tasks, statuses, onDropToday, onEdit, onDragStart, onDragEnd, draggedId, onClearDay, onQuickAdd }) {
  const today = todayISO()
  const doneTodayCount = tasks.filter(t => t.plannedDate===today && t.status==='klaar').length
  const [isOver, setIsOver] = useState(false)
  const [quickVal, setQuickVal] = useState('')
  const [localOrder, setLocalOrder] = useState([])
  const [dragOverIdx, setDragOverIdx] = useState(null)
  const [internalDragIdx, setInternalDragIdx] = useState(null)
  const dayStr = new Date().toLocaleDateString('nl-NL',{weekday:'long',day:'numeric',month:'long'})

  // Sync localOrder with tasks
  const todayTasks = tasks.filter(t => t.plannedDate===today && t.status!=='klaar' && !t.archived)
  useEffect(() => {
    setLocalOrder(prev => {
      const prevIds = prev.map(t => t.id)
      const newIds = todayTasks.map(t => t.id)
      // Keep existing order, append new ones
      const kept = prev.filter(t => newIds.includes(t.id))
      const added = todayTasks.filter(t => !prevIds.includes(t.id))
      return [...kept, ...added]
    })
  }, [todayTasks.map(t=>t.id).join(',')])

  const ordered = localOrder.length > 0
    ? localOrder.filter(t => todayTasks.find(x => x.id === t.id)).map(t => todayTasks.find(x => x.id === t.id))
    : todayTasks

  const handleInternalDrop = (dropIdx) => {
    if (internalDragIdx === null || internalDragIdx === dropIdx) return
    const newOrder = [...ordered]
    const [moved] = newOrder.splice(internalDragIdx, 1)
    newOrder.splice(dropIdx, 0, moved)
    setLocalOrder(newOrder)
    setDragOverIdx(null)
    setInternalDragIdx(null)
  }

  return (
    <div style={{width:'100%'}}>
      <div
        onDragOver={e=>{e.preventDefault();if(internalDragIdx===null)setIsOver(true)}}
        onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget)){setIsOver(false);setDragOverIdx(null)}}}
        onDrop={e=>{
          e.preventDefault()
          setIsOver(false)
          if(internalDragIdx!==null){handleInternalDrop(ordered.length);return}
          const _vid = _DRAG_ID||draggedId; if(_vid){onDropToday(_vid);_DRAG_ID=null}
        }}
        className="card"
        style={{borderTop:'3px solid #D97706',background:isOver?'#FFFBF0':'var(--bg-card)',outline:isOver&&internalDragIdx===null?'2px dashed #D97706':'none',outlineOffset:'2px',transition:'all 0.1s'}}>

        <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'0.4rem',flexWrap:'wrap'}}>
          <div style={{display:'flex',alignItems:'center',gap:'0.4rem'}}>
            <span style={{fontSize:'0.6rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#D97706'}}>Vandaag</span>
            <span style={{fontSize:'0.65rem',color:'var(--text-secondary)'}}>{dayStr}</span>
            {doneTodayCount>0&&<span style={{fontSize:'0.6rem',color:'#059669'}}>✓ {doneTodayCount}</span>}
          </div>
        </div>

        {ordered.length===0?(
          <div style={{textAlign:'center',padding:'0.5rem',color:'var(--text-secondary)',fontSize:'0.7rem',lineHeight:1.4}}>
            {isOver?<span style={{color:'#D97706',fontWeight:600}}>Laat hier los</span>:'Sleep taken hiernaartoe voor jouw dagplanning'}
          </div>
        ):(
          <div style={{display:'flex',flexWrap:'wrap',gap:'0.3rem'}}>
            {ordered.map((t, idx) => {
              if (!t) return null
              const subs=t.subtasks||[]; const subDone=subs.filter(s=>s.completed).length
              const st=statuses.find(s=>s.key===t.status)||statuses[0]
              const isBeingDragged = internalDragIdx === idx
              const showDropLine = dragOverIdx === idx && internalDragIdx !== idx
              const allDone = subs.length>0&&subDone===subs.length

              return (
                <div key={t.id}>
                  <div
                    onDragOver={e=>{e.preventDefault();e.stopPropagation();setDragOverIdx(idx)}}
                    onDrop={e=>{e.preventDefault();e.stopPropagation();handleInternalDrop(idx)}}
                    style={{height: showDropLine ? '3px' : '0', background:'#D97706', borderRadius:'2px', margin: showDropLine ? '2px 0' : '0', transition:'all 0.1s'}}
                  />
                  <div
                    draggable
                    onDragStart={e=>{e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',t.id);setInternalDragIdx(idx);onDragStart&&onDragStart(t.id)}}
                    onDragEnd={()=>{setInternalDragIdx(null);setDragOverIdx(null);onDragEnd&&onDragEnd()}}
                    onDragOver={e=>{e.preventDefault();e.stopPropagation();setDragOverIdx(idx+1)}}
                    onClick={()=>onEdit(t)}
                    style={{display:'flex',alignItems:'center',gap:'0.4rem',padding:'0.3rem 0.55rem',borderRadius:'6px',background:'var(--bg-card,#FEFCE8)',border:'1px solid var(--border,#e5e7eb)',cursor:'grab',opacity:isBeingDragged?0.3:1,transition:'opacity 0.15s,background 0.1s',userSelect:'none'}}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover,#FEF9C3)'}
                    onMouseLeave={e=>e.currentTarget.style.background='var(--bg-card,#FEFCE8)'}>
                    <span style={{width:20,height:20,borderRadius:'50%',border: allDone?'none':`2px solid ${st.color||'#D4D4D4'}`,background:allDone?'#059669':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:10,color:'#fff'}}>{allDone&&'✓'}</span>
                    <span style={{flex:1,fontSize:'0.85rem',fontWeight:500,color:'var(--text-primary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</span>
                    <button onClick={e=>{e.stopPropagation();onClearDay&&onClearDay(t.id)}} title="Verwijder uit dagplanning"
                      style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-tertiary,#bbb)',fontSize:'0.8rem',padding:'0 0.15rem',lineHeight:1,flexShrink:0}}
                      onMouseEnter={e=>e.currentTarget.style.color='#DC2626'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-tertiary,#bbb)'}>×</button>
                  </div>
                </div>
              )
            })}
            {/* Bodem drop zone */}
            <div
              onDragOver={e=>{e.preventDefault();e.stopPropagation();setDragOverIdx(ordered.length)}}
              onDrop={e=>{e.preventDefault();e.stopPropagation();if(internalDragIdx!==null){handleInternalDrop(ordered.length)}else if(draggedId){onDropToday(draggedId)}}}
              style={{height:dragOverIdx===ordered.length&&internalDragIdx!==null?'3px':'20px',background:dragOverIdx===ordered.length&&internalDragIdx!==null?'#D97706':'transparent',borderRadius:'2px',transition:'all 0.1s'}}
            />
          </div>
        )}

        {isOver&&ordered.length>0&&internalDragIdx===null&&(
          <div style={{textAlign:'center',padding:'0.4rem',borderRadius:'6px',border:'2px dashed #D97706',color:'#D97706',fontSize:'0.73rem',fontWeight:600,marginTop:'0.25rem'}}>↓ Hier neerzetten</div>
        )}

        <div style={{marginTop:'0.3rem',display:'flex',gap:'0.3rem',maxWidth:'250px'}}>
          <input value={quickVal} onChange={e=>setQuickVal(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&quickVal.trim()){onQuickAdd&&onQuickAdd(quickVal.trim());setQuickVal('')}}} placeholder="+ taak toevoegen..." style={{flex:1,padding:'0.35rem 0.5rem',borderRadius:'6px',border:'1px solid var(--border)',fontSize:'0.78rem',background:'var(--bg-secondary)',color:'var(--text-primary)',fontFamily:'var(--font-body)',outline:'none'}} />
          {quickVal.trim()&&<button onClick={()=>{onQuickAdd&&onQuickAdd(quickVal.trim());setQuickVal('')}} style={{border:'none',background:'#D97706',color:'#fff',borderRadius:'6px',padding:'0 0.5rem',fontSize:'0.78rem',fontWeight:600,cursor:'pointer',flexShrink:0}}>+</button>}
        </div>
      </div>
    </div>
  )
}

function TaskCard({task:t,statuses,onClick,onStatusChange,onSubtaskToggle,onArchive,onDelete,onPin,compact,draggable:isDraggable,onDragStart,onDragEnd,showArchiveBtn,isSelected,onToggleSelect}) {
  const [menuOpen,setMenuOpen]=useState(false)
  const days = daysUntil(t.dueDate)
  const overdue = days!==null&&days<0&&t.status!=='klaar'
  const isToday2 = days===0&&t.status!=='klaar'
  const soon = days!==null&&days>0&&days<=3&&t.status!=='klaar'
  const st = statuses.find(s=>s.key===t.status)||statuses[0]
  const subs = t.subtasks||[]; const subDone=subs.filter(s=>s.completed).length
  const subPct = subs.length>0?Math.round(subDone/subs.length*100):null

  if (compact) {
    return (
      <div style={{display:'flex',alignItems:'stretch',gap:'0',marginBottom:'0.28rem',userSelect:'none'}}>
        {/* Checkbox buiten kaart */}
        {onToggleSelect&&<div style={{display:'flex',alignItems:'center',paddingRight:'0.3rem',flexShrink:0}} onClick={e=>e.stopPropagation()}>
          <input type="checkbox" checked={!!isSelected} onChange={()=>onToggleSelect(t.id)} style={{width:'12px',height:'12px',cursor:'pointer',accentColor:'var(--accent)'}}/>
        </div>}
        {/* Drag handle buiten kaart */}
        {isDraggable&&<div
          draggable
          onDragStart={e=>{e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',t.id);_DRAG_ID=t.id;onDragStart&&onDragStart()}}
          onDragEnd={()=>onDragEnd&&onDragEnd()}
          style={{display:'flex',alignItems:'center',justifyContent:'center',width:'14px',cursor:'grab',flexShrink:0,color:'#D6D3D1',fontSize:'0.7rem',lineHeight:1,borderRadius:'4px',transition:'color 0.15s'}}
          onMouseEnter={e=>{e.currentTarget.style.color='#78716C';e.currentTarget.style.background='var(--bg-secondary)'}}
          onMouseLeave={e=>{e.currentTarget.style.color='#D6D3D1';e.currentTarget.style.background='none'}}>⠿</div>}
        {/* Kaart zelf */}
        <div
          onClick={onClick}
          style={{flex:1,minWidth:0,padding:'0.15rem 0.3rem',borderRadius:'8px',border:'1px solid var(--border)',cursor:'pointer',background:isSelected?'#EFF6FF':'var(--bg-card)',borderLeft:`3px solid ${t.priority==='high'?'#DC2626':st.color}`,opacity:t.status==='klaar'?0.5:1,transition:'all 0.1s'}}
          onMouseEnter={e=>e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.08)'}
          onMouseLeave={e=>e.currentTarget.style.boxShadow=''}>
          {/* Row 1: Title */}
          <div style={{fontWeight:500,fontSize:'0.82rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textDecoration:t.status==='klaar'?'line-through':'none',lineHeight:1.15,color:'var(--text-primary)'}}>{t.isMIT&&<span style={{marginRight:'0.2rem'}}>🔥</span>}{t.title}</div>

          {/* Row 3: Date + Subtasks */}
          {(t.dueDate||subPct!==null)&&<div style={{display:'flex',alignItems:'center',gap:'0.3rem',marginTop:'0.2rem'}}>
            {t.dueDate&&<span style={{fontSize:'0.6rem',fontWeight:600,padding:'0.05rem 0.3rem',borderRadius:'4px',background:overdue?'#FEE2E2':isToday2?'var(--accent-light)':soon?'#FEF3C7':'var(--bg-secondary)',color:overdue?'#DC2626':isToday2?'var(--accent)':soon?'#92400E':'var(--text-secondary)'}}>{overdue?`⚠ ${Math.abs(days)}d te laat`:isToday2?'📅 Vandaag':soon?`⏰ ${days}d`:fmt(t.dueDate)}</span>}
            {subPct!==null&&<div style={{display:'flex',alignItems:'center',gap:'0.2rem',marginLeft:'auto'}}><div style={{width:'30px',height:'3px',background:'var(--bg-secondary)',borderRadius:'99px',overflow:'hidden'}}><div style={{height:'100%',width:`${subPct}%`,background:subPct===100?'#059669':'var(--accent)',borderRadius:'99px'}}/></div><span style={{fontSize:'0.55rem',color:subPct===100?'#059669':'var(--text-secondary)'}}>{subDone}/{subs.length}</span></div>}
          </div>}
          {/* Menu */}
          {showArchiveBtn&&onArchive&&(
            <div style={{display:'flex',justifyContent:'flex-end',marginTop:'0',position:'relative'}} onClick={e=>e.stopPropagation()}>
              <button onClick={()=>setMenuOpen(!menuOpen)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'0.6rem',color:'var(--text-secondary)',padding:'0 0.15rem',lineHeight:1,borderRadius:'4px'}}
                onMouseEnter={e=>e.currentTarget.style.background='var(--bg-secondary)'} onMouseLeave={e=>{if(!menuOpen)e.currentTarget.style.background='none'}}>⋯</button>
              {menuOpen&&<div style={{position:'absolute',right:0,bottom:'100%',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'6px',boxShadow:'0 4px 12px rgba(0,0,0,0.1)',zIndex:50,overflow:'hidden',minWidth:'110px'}}>
                {onPin&&<button onClick={()=>{onPin();setMenuOpen(false)}} style={{display:'block',width:'100%',textAlign:'left',padding:'0.35rem 0.6rem',border:'none',background:'none',cursor:'pointer',fontSize:'0.68rem',color:'var(--text-primary)',fontFamily:'var(--font-body)'}}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--bg-secondary)'} onMouseLeave={e=>e.currentTarget.style.background='none'}>{t.isSticky?'📌 Losmaken':'📌 Pinnen'}</button>}
                <button onClick={()=>{onArchive();setMenuOpen(false)}} style={{display:'block',width:'100%',textAlign:'left',padding:'0.35rem 0.6rem',border:'none',background:'none',cursor:'pointer',fontSize:'0.68rem',color:'var(--text-primary)',fontFamily:'var(--font-body)'}}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--bg-secondary)'} onMouseLeave={e=>e.currentTarget.style.background='none'}>📦 Archiveer</button>
                {onDelete&&<button onClick={()=>{onDelete();setMenuOpen(false)}} style={{display:'block',width:'100%',textAlign:'left',padding:'0.35rem 0.6rem',border:'none',background:'none',cursor:'pointer',fontSize:'0.68rem',color:'#DC2626',fontFamily:'var(--font-body)'}}
                  onMouseEnter={e=>e.currentTarget.style.background='#FEE2E2'} onMouseLeave={e=>e.currentTarget.style.background='none'}>🗑 Verwijder</button>}
              </div>}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div draggable={isDraggable}
      onDragStart={e=>{if(isDraggable){e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',t.id);_DRAG_ID=t.id;onDragStart&&onDragStart()}}}
      onDragEnd={()=>onDragEnd&&onDragEnd()}
      onClick={onClick}
      style={{padding:'0.75rem 1rem',borderRadius:'var(--radius-md)',border:'1px solid var(--border)',cursor:isDraggable?'grab':'pointer',background:'var(--bg-card)',borderLeft:`3px solid ${t.priority==='high'?'#DC2626':st.color}`,opacity:t.status==='klaar'?0.6:1,userSelect:'none',transition:'box-shadow 0.1s'}}
      onMouseEnter={e=>e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.06)'} onMouseLeave={e=>e.currentTarget.style.boxShadow=''}>
      <div style={{display:'flex',alignItems:'flex-start',gap:'0.5rem'}}>
        {isDraggable&&<span style={{color:'#D6D3D1',fontSize:'0.9rem',lineHeight:1.5,flexShrink:0,cursor:'grab',userSelect:'none',paddingTop:'0.1rem',letterSpacing:'1px',padding:'0.15rem 0.15rem',borderRadius:'4px',transition:'all 0.15s'}}
          onMouseEnter={e=>{e.currentTarget.style.color='#78716C';e.currentTarget.style.background='var(--bg-secondary)'}}
          onMouseLeave={e=>{e.currentTarget.style.color='#D6D3D1';e.currentTarget.style.background='none'}}>⠿⠿</span>}
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:500,fontSize:'0.875rem',textDecoration:t.status==='klaar'?'line-through':'none'}}>{t.isMIT&&<span style={{marginRight:'0.25rem'}}>🔥</span>}{t.title}</div>
          <div style={{fontSize:'0.72rem',color:'var(--text-secondary)',marginTop:'0.15rem',display:'flex',gap:'0.3rem',alignItems:'center',flexWrap:'wrap'}}>
            <span>{t.assignee}</span>
            <span className="badge badge-amber" style={{fontSize:'0.6rem'}}>{t.category}</span>
            {t.priority==='high'&&<span className="badge badge-red" style={{fontSize:'0.6rem'}}>Urgent</span>}
            {t.dueDate&&<span style={{padding:'0.08rem 0.3rem',borderRadius:'4px',fontSize:'0.6rem',fontWeight:600,background:overdue?'#FEE2E2':isToday2?'var(--accent-light)':soon?'#FEF3C7':'var(--bg-secondary)',color:overdue?'#DC2626':isToday2?'var(--accent)':soon?'#92400E':'var(--text-secondary)'}}>{overdue?`${Math.abs(days)}d te laat`:isToday2?'Vandaag':soon?`${days}d`:fmt(t.dueDate)}</span>}
            {t.plannedDate&&<span style={{fontSize:'0.6rem',color:'#2563EB',fontWeight:500}}>plan {fmt(t.plannedDate)}</span>}
          </div>
          {subPct!==null&&<div style={{marginTop:'0.35rem',display:'flex',alignItems:'center',gap:'0.35rem'}}><div style={{flex:1,height:'3px',background:'var(--bg-secondary)',borderRadius:'99px',overflow:'hidden'}}><div style={{height:'100%',width:`${subPct}%`,background:subPct===100?'#059669':'var(--accent)',borderRadius:'99px'}}/></div><span style={{fontSize:'0.6rem',color:'var(--text-secondary)',whiteSpace:'nowrap'}}>{subDone}/{subs.length}</span></div>}
          {subs.length>0&&<div style={{display:'flex',flexDirection:'column',gap:'0.18rem',marginTop:'0.35rem'}} onClick={e=>e.stopPropagation()}>{subs.map(sub=><div key={sub.id} style={{display:'flex',alignItems:'center',gap:'0.35rem'}}><input type="checkbox" checked={sub.completed} onChange={()=>onSubtaskToggle&&onSubtaskToggle(sub.id)} style={{width:'12px',height:'12px',cursor:'pointer',accentColor:'var(--accent)',flexShrink:0}}/><span style={{fontSize:'0.75rem',textDecoration:sub.completed?'line-through':'none',color:sub.completed?'var(--text-secondary)':'var(--text-primary)'}}>{sub.title}</span></div>)}</div>}
        </div>
        <div style={{display:'flex',gap:'0.15rem',flexShrink:0,paddingTop:'0.1rem'}} onClick={e=>e.stopPropagation()}>
          {statuses.map(s=><button key={s.key} onClick={()=>onStatusChange(s.key)} title={s.label} style={{width:'22px',height:'22px',borderRadius:'50%',border:t.status===s.key?'none':`2px solid ${s.color}40`,background:t.status===s.key?s.color:'transparent',cursor:'pointer',fontSize:'0.55rem',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{t.status===s.key&&'✓'}</button>)}
        </div>
        {onArchive&&<div style={{position:'relative',flexShrink:0}} onClick={e=>e.stopPropagation()}>
          <button onClick={()=>setMenuOpen(!menuOpen)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'0.9rem',color:'var(--text-secondary)',padding:'0.1rem 0.3rem',borderRadius:'4px',lineHeight:1}}
            onMouseEnter={e=>e.currentTarget.style.background='var(--bg-secondary)'} onMouseLeave={e=>{if(!menuOpen)e.currentTarget.style.background='none'}}>⋯</button>
          {menuOpen&&<div style={{position:'absolute',right:0,top:'100%',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'6px',boxShadow:'0 4px 12px rgba(0,0,0,0.1)',zIndex:50,overflow:'hidden',minWidth:'110px'}}>
            <button onClick={()=>{onArchive();setMenuOpen(false)}} style={{display:'block',width:'100%',textAlign:'left',padding:'0.4rem 0.65rem',border:'none',background:'none',cursor:'pointer',fontSize:'0.72rem',color:'var(--text-primary)',fontFamily:'var(--font-body)'}}
              onMouseEnter={e=>e.currentTarget.style.background='var(--bg-secondary)'} onMouseLeave={e=>e.currentTarget.style.background='none'}>📦 Archiveer</button>
            {onDelete&&<button onClick={()=>{onDelete();setMenuOpen(false)}} style={{display:'block',width:'100%',textAlign:'left',padding:'0.4rem 0.65rem',border:'none',background:'none',cursor:'pointer',fontSize:'0.72rem',color:'#DC2626',fontFamily:'var(--font-body)'}}
              onMouseEnter={e=>e.currentTarget.style.background='#FEE2E2'} onMouseLeave={e=>e.currentTarget.style.background='none'}>🗑 Verwijder</button>}
          </div>}
        </div>}
      </div>
    </div>
  )
}

function KanbanColumn({status,tasks,statuses,onDrop,onCardDragStart,onCardDragEnd,onCardClick,onStatusChange,onSubtaskToggle,onArchive,draggedId,onAddTask,onReorder,selected,onToggleSelect,onQuickAdd,onPin}) {
  // Gebruik ref voor draggedId om stale closure te voorkomen
  const draggedIdRef = React.useRef(null)
  React.useEffect(()=>{ draggedIdRef.current = draggedId },[draggedId])
  const [dropIdx, setDropIdx] = useState(null)
  const dropRef = React.useRef(null)
  const cardRefs = React.useRef([])
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [quickTitle, setQuickTitle] = useState('')
  const submitQuick = () => { if(!quickTitle.trim()) return; onQuickAdd&&onQuickAdd(quickTitle.trim()); setQuickTitle(''); setQuickAddOpen(false) }

  // Bereken op welke positie in de lijst de kaart losgelaten wordt
  const getDropIndex = (e) => {
    const cards = cardRefs.current.filter(Boolean)
    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i].getBoundingClientRect()
      const mid = rect.top + rect.height / 2
      if (e.clientY < mid) return i
    }
    return cards.length
  }

  const allSelected = tasks.length>0 && tasks.every(t=>selected&&selected.has(t.id))
  const someSelected = tasks.some(t=>selected&&selected.has(t.id))
  const toggleAll = () => { if(allSelected){tasks.forEach(t=>onToggleSelect&&onToggleSelect(t.id))}else{tasks.forEach(t=>{if(!selected||!selected.has(t.id))onToggleSelect&&onToggleSelect(t.id)})}}

  return (
    <div style={{display:'flex',flexDirection:'column'}}>
      {/* Kolom header */}
      <div style={{display:'flex',alignItems:'center',gap:'0.4rem',marginBottom:'0.55rem',padding:'0.4rem 0.6rem',borderRadius:'var(--radius-md)',background:'var(--bg-secondary)'}}>
        <input type="checkbox" checked={allSelected} ref={el=>{if(el)el.indeterminate=someSelected&&!allSelected}} onChange={toggleAll} onClick={e=>e.stopPropagation()} style={{width:'13px',height:'13px',cursor:'pointer',accentColor:'var(--accent)',flexShrink:0}} title={allSelected?'Deselecteer kolom':'Selecteer kolom'}/>
        <span style={{width:'7px',height:'7px',borderRadius:'50%',background:status.color,flexShrink:0}}/>
        <span style={{fontSize:'0.79rem',fontWeight:600}}>{status.label}</span>
        <span style={{fontSize:'0.7rem',color:'var(--text-secondary)',marginLeft:'auto',fontWeight:500}}>{tasks.length}</span>
        <button onClick={onAddTask} title="Nieuwe taak"
          style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',fontSize:'0.9rem',padding:'0 0 0 0.3rem',lineHeight:1}}
          onMouseEnter={e=>e.currentTarget.style.color='var(--accent)'}
          onMouseLeave={e=>e.currentTarget.style.color='var(--text-secondary)'}>+</button>
      </div>

      {/* Drop zone */}
      <div ref={dropRef}
        onDragOver={e=>{
          e.preventDefault(); e.dataTransfer.dropEffect='move'
          setDropIdx(getDropIndex(e))
        }}
        onDragLeave={e=>{
          if(!e.relatedTarget || (dropRef.current && !dropRef.current.contains(e.relatedTarget))) setDropIdx(null)
        }}
        onDrop={e=>{
          e.preventDefault(); e.stopPropagation()
          // Pak id via dataTransfer (meest betrouwbaar), dan ref, dan prop
          const id = _DRAG_ID || e.dataTransfer.getData('text/plain') || draggedIdRef.current || draggedId
          const idx = getDropIndex(e)
          setDropIdx(null)
          if (!id) return
          const existingIdx = tasks.findIndex(t => t.id === id)
          if (existingIdx !== -1) {
            onReorder && onReorder(id, idx)
          } else {
            onDrop(status.key, id)
          }
        }}
        style={{flex:1,minHeight:'120px',borderRadius:'var(--radius-md)',padding:'0.25rem',background:dropIdx!==null?'rgba(37,99,235,0.03)':'transparent',border:dropIdx!==null?'2px dashed #2563EB20':'2px solid transparent',transition:'all 0.1s'}}>



        {tasks.map((t, i) => (
          <div key={t.id}>
            {/* Drop indicator lijn VOOR dit item */}
            {dropIdx === i && (
              <div style={{height:'3px',background:'#2563EB',borderRadius:'99px',margin:'3px 0',transition:'all 0.1s',boxShadow:'0 0 6px rgba(37,99,235,0.4)'}}/>
            )}
            <div ref={el => cardRefs.current[i] = el}>
              <TaskCard
                task={t} statuses={statuses} compact draggable showArchiveBtn
                isSelected={selected&&selected.has(t.id)} onToggleSelect={onToggleSelect}
                onDragStart={()=>onCardDragStart(t.id)}
                onDragEnd={()=>{ onCardDragEnd(); setDropIdx(null) }}
                onClick={()=>onCardClick(t)}
                onStatusChange={s=>onStatusChange(t.id,s)}
                onSubtaskToggle={subId=>onSubtaskToggle(t.id,subId)}
                onArchive={()=>onArchive(t.id)}
                onPin={onPin?()=>onPin(t.id):null}
              />
            </div>
          </div>
        ))}

        {/* Drop indicator lijn NA het laatste item */}
        {dropIdx === tasks.length && (
          <div style={{height:'3px',background:'#2563EB',borderRadius:'99px',margin:'3px 0',transition:'all 0.1s',boxShadow:'0 0 6px rgba(37,99,235,0.4)'}}/>
        )}

        {/* Quick add */}
        {quickAddOpen ? (
          <div style={{padding:'0.35rem',borderRadius:'6px',border:'1px solid var(--accent)',background:'var(--bg-card)',marginTop:'0.2rem'}}>
            <input autoFocus value={quickTitle} onChange={e=>setQuickTitle(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter')submitQuick();if(e.key==='Escape'){setQuickAddOpen(false);setQuickTitle('')}}}
              placeholder="Taaknaam..." style={{width:'100%',border:'none',background:'transparent',fontSize:'0.78rem',fontWeight:500,outline:'none',fontFamily:'var(--font-body)',color:'var(--text-primary)',padding:'0.15rem 0'}}/>
            <div style={{display:'flex',gap:'0.25rem',marginTop:'0.2rem'}}>
              <button onClick={submitQuick} style={{flex:1,padding:'0.2rem',borderRadius:'4px',background:'var(--accent)',color:'#fff',border:'none',cursor:'pointer',fontSize:'0.68rem',fontWeight:600}}>Toevoegen</button>
              <button onClick={()=>{setQuickAddOpen(false);setQuickTitle('')}} style={{padding:'0.2rem 0.4rem',borderRadius:'4px',border:'1px solid var(--border)',background:'none',cursor:'pointer',fontSize:'0.68rem',color:'var(--text-secondary)'}}>✕</button>
            </div>
          </div>
        ) : (
          <button onClick={()=>setQuickAddOpen(true)} style={{width:'100%',padding:'0.3rem',borderRadius:'6px',border:'1px dashed var(--border)',background:'transparent',cursor:'pointer',color:'var(--text-secondary)',fontSize:'0.68rem',marginTop:'0.2rem',transition:'all 0.12s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-secondary)'}}>+ Nieuwe taak</button>
        )}
      </div>
    </div>
  )
}

// ─── KALENDER VIEW ──────────────────────────────────────────────────────────
function KalenderView({ tasks, onTaskClick, onAddTask }) {
  const [weekOffset, setWeekOffset] = useState(0)
  const today = new Date()
  const todayISO = today.toISOString().slice(0,10)
  
  // Bereken maandag van de huidige week + offset
  const getMonday = (d, offset) => {
    const date = new Date(d)
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7) + (offset * 7))
    return date
  }
  
  const monday = getMonday(today, weekOffset)
  const weekDays = Array.from({length:7}, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
  
  const weekLabel = () => {
    const start = weekDays[0]
    const end = weekDays[6]
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()} – ${end.getDate()} ${start.toLocaleDateString('nl-NL',{month:'long',year:'numeric'})}`
    }
    return `${start.getDate()} ${start.toLocaleDateString('nl-NL',{month:'short'})} – ${end.getDate()} ${end.toLocaleDateString('nl-NL',{month:'short',year:'numeric'})}`
  }
  
  const dayNames = ['Maandag','Dinsdag','Woensdag','Donderdag','Vrijdag','Zaterdag','Zondag']
  const dayNamesShort = ['Ma','Di','Wo','Do','Vr','Za','Zo']
  
  const tasksForDay = (date) => {
    const iso = date.toISOString().slice(0,10)
    return tasks.filter(t => (t.dueDate===iso||t.plannedDate===iso) && t.status!=='klaar' && !t.archived)
  }

  return (
    <div>
      {/* Header */}
      <div className="card" style={{marginBottom:'0.75rem',padding:'0.75rem 1rem'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <button onClick={()=>setWeekOffset(w=>w-1)} className="btn btn-sm btn-outline">← Vorige</button>
          <div style={{textAlign:'center'}}>
            <div style={{fontFamily:'var(--font-display)',fontSize:'1rem',fontWeight:600}}>{weekLabel()}</div>
            {weekOffset!==0&&<button onClick={()=>setWeekOffset(0)} style={{background:'none',border:'none',color:'var(--accent)',fontSize:'0.68rem',cursor:'pointer',fontWeight:600,marginTop:'0.1rem'}}>↩ Vandaag</button>}
          </div>
          <button onClick={()=>setWeekOffset(w=>w+1)} className="btn btn-sm btn-outline">Volgende →</button>
        </div>
      </div>
      
      {/* Week grid */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'0.5rem'}}>
        {weekDays.map((date, i) => {
          const iso = date.toISOString().slice(0,10)
          const isToday = iso === todayISO
          const isPast = date < new Date(todayISO)
          const dayTasks = tasksForDay(date)
          const hasUrgent = dayTasks.some(t=>t.priority==='high'||t.isMIT)
          const overdue = dayTasks.filter(t=>t.dueDate===iso&&isPast)
          
          return (
            <div key={i} style={{minHeight:'200px',borderRadius:'10px',border:isToday?'2px solid #D97706':'1px solid var(--border)',background:isToday?'#FFF7ED':'var(--bg-card)',padding:'0.5rem',display:'flex',flexDirection:'column'}}>
              {/* Dag header */}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.4rem',paddingBottom:'0.3rem',borderBottom:'1px solid var(--border)'}}>
                <div>
                  <div style={{fontSize:'0.62rem',color:isToday?'#D97706':'var(--text-secondary)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>{dayNamesShort[i]}</div>
                  <div style={{fontSize:'1.2rem',fontWeight:700,color:isToday?'#D97706':isPast?'var(--text-secondary)':'var(--text-primary)',lineHeight:1}}>{date.getDate()}</div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'0.2rem'}}>
                  {hasUrgent&&<span style={{fontSize:'0.6rem'}}>🔥</span>}
                  {dayTasks.length>0&&<span style={{fontSize:'0.6rem',padding:'0.05rem 0.3rem',borderRadius:'99px',background:overdue.length>0?'#FEE2E2':'var(--bg-secondary)',color:overdue.length>0?'#DC2626':'var(--text-secondary)',fontWeight:700}}>{dayTasks.length}</span>}
                </div>
              </div>
              
              {/* Taken */}
              <div style={{flex:1,display:'flex',flexDirection:'column',gap:'0.2rem',overflow:'auto'}}>
                {dayTasks.map(t=>{
                  const isOverdue = t.dueDate===iso && isPast
                  return (
                    <div key={t.id} onClick={()=>onTaskClick(t)}
                      style={{fontSize:'0.68rem',padding:'0.25rem 0.35rem',borderRadius:'5px',cursor:'pointer',fontWeight:500,
                        background:t.isMIT?'#FEE2E2':isOverdue?'#FEF2F2':t.priority==='high'?'#FEF3C7':'var(--bg-secondary)',
                        color:t.isMIT?'#991B1B':isOverdue?'#DC2626':t.priority==='high'?'#92400E':'var(--text-primary)',
                        borderLeft:`2px solid ${t.isMIT?'#DC2626':isOverdue?'#DC2626':t.priority==='high'?'#D97706':'var(--border)'}`,
                        transition:'all 0.1s'}}
                      onMouseEnter={e=>e.currentTarget.style.transform='scale(1.02)'}
                      onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
                      <div style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.isMIT?'🔥 ':''}{t.title}</div>
                      <div style={{fontSize:'0.55rem',color:'var(--text-secondary)',marginTop:'0.08rem'}}>{t.assignee} · {t.category||'Overig'}</div>
                    </div>
                  )
                })}
              </div>
              
              {/* Add knop */}
              <button onClick={()=>onAddTask(iso)} style={{marginTop:'0.3rem',width:'100%',padding:'0.15rem',borderRadius:'4px',border:'1px dashed var(--border)',background:'transparent',color:'var(--text-secondary)',fontSize:'0.6rem',cursor:'pointer',opacity:0.5,transition:'opacity 0.15s'}}
                onMouseEnter={e=>e.currentTarget.style.opacity='1'} onMouseLeave={e=>e.currentTarget.style.opacity='0.5'}>+</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── INBOX (floating quick capture) ─────────────────────────────────────────
function InboxCapture({ onAdd, user }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const submit = async () => {
    if (!title.trim()) return
    await api.save('tasks', {
      id: `inbox-${Date.now()}`,
      title: title.trim(),
      category: 'Overig', assignee: user?.name||'Tein',
      status: 'todo', priority: 'normal',
      notes: '', dueDate: '', plannedDate: '', tags: [], subtasks: [],
      estimatedHours: 0, energyLevel: 'middel', recurring: 'nooit', isMIT: false,
      createdAt: new Date().toISOString()
    })
    setTitle(''); setOpen(false)
  }
  return (
    <div style={{position:'fixed',bottom:'1.5rem',right:'1.5rem',zIndex:888}}>
      {open && (
        <div style={{position:'absolute',bottom:'3.5rem',right:0,background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'12px',boxShadow:'0 8px 32px rgba(0,0,0,0.15)',padding:'1rem',width:'280px'}}>
          <div style={{fontSize:'0.7rem',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--text-secondary)',marginBottom:'0.5rem'}}>📥 Inbox — snel toevoegen</div>
          <input autoFocus value={title} onChange={e=>setTitle(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter')submit();if(e.key==='Escape')setOpen(false)}}
            placeholder="Idee, taak, herinnering..." className="form-input"
            style={{width:'100%',marginBottom:'0.5rem',fontSize:'0.85rem'}}/>
          <div style={{display:'flex',gap:'0.4rem'}}>
            <button onClick={submit} className="btn btn-primary" style={{flex:1,fontSize:'0.78rem'}}>Toevoegen</button>
            <button onClick={()=>setOpen(false)} className="btn btn-outline" style={{fontSize:'0.78rem'}}>✕</button>
          </div>
          <div style={{fontSize:'0.65rem',color:'var(--text-secondary)',marginTop:'0.4rem'}}>Komt als "To do" in Overig — later categoriseren</div>
        </div>
      )}
      <button onClick={()=>setOpen(!open)}
        title="Inbox — snel idee toevoegen"
        style={{width:'48px',height:'48px',borderRadius:'50%',background:open?'var(--text-primary)':'var(--accent)',border:'none',cursor:'pointer',fontSize:'1.3rem',boxShadow:'0 4px 16px rgba(0,0,0,0.2)',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.2s'}}>
        {open?'✕':'📥'}
      </button>
    </div>
  )
}

// ─── REACTIES PER TAAK ───────────────────────────────────────────────────────
function TaskComments({ taskId, user }) {
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')
  const load = async () => {
    const all = await api.getAll('comments')
    setComments(all.filter(c => c.taskId === taskId).sort((a,b)=>a.createdAt>b.createdAt?1:-1))
  }
  useEffect(()=>{ if(taskId) load() },[taskId])

  const add = async () => {
    if (!text.trim()) return
    await api.save('comments', {
      id: `cmt-${Date.now()}`, taskId,
      author: user?.name||'Tein', body: text.trim(),
      createdAt: new Date().toISOString()
    })
    setText(''); load()
  }

  const fmt = d => new Date(d).toLocaleDateString('nl-NL',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})

  return (
    <div>
      <div style={{fontSize:'0.65rem',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--text-secondary)',marginBottom:'0.5rem'}}>Opmerkingen</div>
      {comments.length===0&&<div style={{fontSize:'0.75rem',color:'var(--text-secondary)',marginBottom:'0.5rem',fontStyle:'italic'}}>Nog geen opmerkingen</div>}
      <div style={{display:'flex',flexDirection:'column',gap:'0.4rem',marginBottom:'0.5rem',maxHeight:'150px',overflowY:'auto'}}>
        {comments.map(cm=>(
          <div key={cm.id} style={{padding:'0.4rem 0.55rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}>
            <div style={{display:'flex',gap:'0.4rem',alignItems:'center',marginBottom:'0.15rem'}}>
              <span style={{fontSize:'0.72rem',fontWeight:700,color:'var(--accent)'}}>{cm.author}</span>
              <span style={{fontSize:'0.62rem',color:'var(--text-secondary)'}}>{fmt(cm.createdAt)}</span>
            </div>
            <div style={{fontSize:'0.78rem',color:'var(--text-primary)',lineHeight:1.4}}>{cm.body}</div>
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:'0.4rem'}}>
        <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),add())}
          placeholder="Reactie toevoegen (Enter)..." className="form-input" style={{flex:1,fontSize:'0.78rem',padding:'0.35rem 0.5rem'}}/>
        <button onClick={add} className="btn btn-sm btn-outline" style={{flexShrink:0}}>↵</button>
      </div>
    </div>
  )
}


export default function Tasks({ user }) {
  const [tasks,setTasks]=useState([])
  const [view,setView]=useState('kanban')
  const [showAdd,setShowAdd]=useState(false)
  const [filterUser,setFilterUser]=useState(user?.name||'all')
  const [editing,setEditing]=useState(null)
  const [confirmDel,setConfirmDel]=useState(null)
  const [confirmMigratePhase,setConfirmMigratePhase]=useState(null) // {key, label, taskCount}
  const [draggedId,setDraggedId]=useState(null)
  const [undoToast,setUndoToast]=useState(null) // {id, title, timer}
  const [confirmArchive,setConfirmArchive]=useState(null) // {id, title}
  const [selected,setSelected]=useState(new Set())
  const toggleSelect=(id,e)=>{e&&e.stopPropagation();setSelected(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n})}
  const selectAll=()=>{const ids=filtered.map(t=>t.id);setSelected(new Set(ids))}
  const clearSelection=()=>setSelected(new Set())
  const bulkArchive=async()=>{for(const id of selected){const t=tasks.find(x=>x.id===id);if(t)await api.save('tasks',{...t,archived:true,archivedAt:new Date().toISOString()})};clearSelection();reload()}
  const bulkDelete=async()=>{for(const id of selected)await api.remove('tasks',id);clearSelection();reload()}
  const [form,setForm]=useState({title:'',category:'Overig',assignee:user?.name||'Tein',status:'todo',priority:'normal',notes:'',dueDate:'',plannedDate:'',tags:[],subtasks:[],estimatedHours:0,energyLevel:'middel',recurring:'nooit',isMIT:false})
  const [tagInput,setTagInput]=useState('')
  const [subtaskInput,setSubtaskInput]=useState('')
  const subtaskInputRef=useRef(null)
  const [statuses,setStatuses]=useState(()=>{
    const s=localStorage.getItem('artazest_statuses')
    if(s){const parsed=JSON.parse(s);if(!parsed.find(x=>x.key==='gepland')){const m=[parsed[0],{key:'gepland',label:'Gepland',color:'#2563EB'},...parsed.slice(1)];localStorage.setItem('artazest_statuses',JSON.stringify(m));return m};return parsed}
    return DEFAULT_STATUSES
  })
  const [trackersOpen,setTrackersOpen]=useState(false)
  const [boardView,setBoardView]=useState(false)
  const [showPhaseEdit,setShowPhaseEdit]=useState(false)
  const [showExtraCols,setShowExtraCols]=useState(false)
  const [dragPhase,setDragPhase]=useState(null)
  const [dragOverPhase,setDragOverPhase]=useState(null)
  const [newPhase,setNewPhase]=useState('')
  const [timelineOpen,setTimelineOpen]=useState(false)
  const [activeProject,setActiveProject]=useState('alle')
  const [projects,setProjects]=useState(()=>{
    try { return JSON.parse(localStorage.getItem('artazest_projects') || '[]').filter(p=>p&&p.trim()) }
    catch { return [] }
  })
  const [showAddProject,setShowAddProject]=useState(false)
  const [newProject,setNewProject]=useState('')
  const [confirmDeleteProject,setConfirmDeleteProject]=useState(null)
  const [showBulkPaste,setShowBulkPaste]=useState(false)
  const [bulkText,setBulkText]=useState('')
  const [bulkPreview,setBulkPreview]=useState(null) // naam van project

  const saveStatuses=st=>{setStatuses(st);localStorage.setItem('artazest_statuses',JSON.stringify(st));api.saveSetting('statuses',st)}
  const saveProjects=ps=>{setProjects(ps);localStorage.setItem('artazest_projects',JSON.stringify(ps));api.saveSetting('projects',ps)}
  useEffect(()=>{
    api.getSetting('statuses').then(val=>{if(val&&val.length>0)setStatuses(val)})
    api.getSetting('projects').then(val=>{if(val&&val.length>0)setProjects(val.filter(p=>p&&p.trim()))})
  },[])
  const addProject=()=>{
    if(!newProject.trim()) return
    const exists=projects.find(p=>p.toLowerCase()===newProject.trim().toLowerCase())
    if(!exists) saveProjects([...projects,newProject.trim()])
    setActiveProject(newProject.trim()); setNewProject(''); setShowAddProject(false)
  }
  const removeProject=name=>setConfirmDeleteProject(name)
  const doRemoveProject=name=>{
    saveProjects(projects.filter(p=>p!==name))
    if(activeProject===name) setActiveProject('alle')
    setConfirmDeleteProject(null)
  }
  const addPhase=()=>{if(!newPhase.trim())return;const key=newPhase.trim().toLowerCase().replace(/\s+/g,'-');if(statuses.find(s=>s.key===key))return;const used=statuses.map(s=>s.color);const color=COLORS.find(c=>!used.includes(c))||COLORS[0];saveStatuses([...statuses,{key,label:newPhase.trim(),color}]);setNewPhase('')}
  const removePhase=key=>{
    if(statuses.length<=2)return
    const affected=tasks.filter(t=>t.status===key)
    if(affected.length>0){
      const st=statuses.find(s=>s.key===key)
      setConfirmMigratePhase({key,label:st?.label||key,taskCount:affected.length})
    } else {
      saveStatuses(statuses.filter(s=>s.key!==key))
    }
  }
  const doRemovePhase=async(fromKey,toKey)=>{
    const affected=tasks.filter(t=>t.status===fromKey)
    for(const t of affected){ await api.save('tasks',{...t,status:toKey}) }
    saveStatuses(statuses.filter(s=>s.key!==fromKey))
    setConfirmMigratePhase(null)
    reload()
  }

  useEffect(()=>{reload()},[])
  const reload=()=>api.getAll('tasks').then(setTasks)
  const handleSave=async()=>{
    if(!form.title.trim())return
    try {
      const taskData = {
        ...form,
        ...(editing?{id:editing}:{}),
        createdAt:form.createdAt||new Date().toISOString(),
        archived: form.archived || false,
        tags: form.tags || [],
        subtasks: form.subtasks || [],
      }
      await api.save('tasks', taskData)
      resetForm()
      setShowAdd(false)
      setEditing(null)
      reload()
    } catch(err) {
      console.error('Save fout:', err)
      alert('Opslaan mislukt: ' + (err.message||err))
    }
  }
  const resetForm=()=>setForm({title:'',category:activeProject!=='alle'?activeProject:'Overig',assignee:user?.name||'Tein',status:'todo',priority:'normal',notes:'',dueDate:'',plannedDate:'',tags:[],subtasks:[],estimatedHours:0,energyLevel:'middel',recurring:'nooit',isMIT:false})
  const del=async id=>{await api.remove('tasks',id);setConfirmDel(null);setEditing(null);setShowAdd(false);reload()}
  const startEdit=t=>{setForm({...t,tags:t.tags||[],subtasks:t.subtasks||[],plannedDate:t.plannedDate||'',estimatedHours:t.estimatedHours||0,energyLevel:t.energyLevel||'middel',recurring:t.recurring||'nooit',isMIT:t.isMIT||false});setEditing(t.id);setShowAdd(true)}
  const updateStatus=async(id,status)=>{const t=tasks.find(x=>x.id===id);if(t){await api.save('tasks',{...t,status,completed:status==='klaar'});reload()}}
  const reorderInColumn=async(taskId, newIdx, columnKey)=>{
    // Haal alle taken van deze kolom op in huidige volgorde
    const col = filtered.filter(t => t.status === columnKey)
    const oldIdx = col.findIndex(t => t.id === taskId)
    if (oldIdx === -1 || oldIdx === newIdx) return
    // Bouw nieuwe volgorde
    const reordered = [...col]
    const [moved] = reordered.splice(oldIdx, 1)
    const insertAt = newIdx > oldIdx ? newIdx - 1 : newIdx
    reordered.splice(insertAt, 0, moved)
    // Sla sortOrder op per taak
    for (let i = 0; i < reordered.length; i++) {
      const t = reordered[i]
      await api.save('tasks', {...t, sortOrder: i})
    }
    reload()
  }
  const archiveTask=async id=>{
    const t=tasks.find(x=>x.id===id);if(!t)return
    await api.save('tasks',{...t,archived:true,archivedAt:new Date().toISOString()})
    reload()
    setUndoToast(prev=>{if(prev?.timer)clearTimeout(prev.timer);const timer=setTimeout(()=>setUndoToast(null),6000);return {id,title:t.title,timer}})
  }
  const undoArchive=async()=>{
    if(!undoToast)return
    clearTimeout(undoToast.timer)
    const all=await api.getAll('tasks')
    const t=all.find(x=>x.id===undoToast.id)
    if(t)await api.save('tasks',{...t,archived:false,archivedAt:null})
    setUndoToast(null);reload()
  }
  const assignDay=async(id,date)=>{const t=tasks.find(x=>x.id===id);if(!t)return;const ns=t.status==='todo'?'gepland':t.status;await api.save('tasks',{...t,plannedDate:date,status:ns,completed:ns==='klaar'});setDraggedId(null);reload()}
  const assignToday=async id=>assignDay(id,todayISO())
  const updateTaskDates=async(task,newStart,newEnd)=>{
    await api.save('tasks',{...task,plannedDate:newStart,dueDate:newEnd,status:task.status==='todo'?'gepland':task.status})
    reload()
  }
  const clearDay=async id=>{const t=tasks.find(x=>x.id===id);if(!t)return;await api.save('tasks',{...t,plannedDate:'',status:t.status==='gepland'?'todo':t.status});reload()}
  const toggleSubtaskOnCard=async(taskId,subId)=>{const t=tasks.find(x=>x.id===taskId);if(!t)return;const upd={...t,subtasks:(t.subtasks||[]).map(s=>s.id===subId?{...s,completed:!s.completed}:s)};if(upd.subtasks.length>0&&upd.subtasks.every(s=>s.completed)){upd.status='klaar';upd.completed=true};await api.save('tasks',upd);reload()}
  const addTag=()=>{if(tagInput.trim()&&!form.tags.includes(tagInput.trim())){setForm({...form,tags:[...form.tags,tagInput.trim()]});setTagInput('')}}
  const removeTag=t=>setForm({...form,tags:form.tags.filter(x=>x!==t)})
  const addSubtask=()=>{if(!subtaskInput.trim())return;setForm({...form,subtasks:[...(form.subtasks||[]),{id:uid(),title:subtaskInput.trim(),completed:false}]});setSubtaskInput('');subtaskInputRef.current?.focus()}
  const toggleSubtask=subId=>setForm({...form,subtasks:form.subtasks.map(s=>s.id===subId?{...s,completed:!s.completed}:s)})
  const removeSubtask=subId=>setForm({...form,subtasks:form.subtasks.filter(s=>s.id!==subId)})

  const active=tasks.filter(t=>!t.archived)
  const filtered=active.filter(t=>(filterUser==='all'||t.assignee===filterUser)&&(activeProject==='alle'||t.category===activeProject)).sort((a,b)=>{
    // 1. Binnen dezelfde kolom: gebruik handmatige sortOrder als die gezet is
    if(a.status===b.status && a.sortOrder!=null && b.sortOrder!=null) return a.sortOrder-b.sortOrder
    if(a.status===b.status && a.sortOrder!=null && b.sortOrder==null) return -1
    if(a.status===b.status && a.sortOrder==null && b.sortOrder!=null) return 1
    // 2. Daarna: prioriteit
    const p={high:0,normal:1}
    if((p[a.priority]||1)!==(p[b.priority]||1))return(p[a.priority]||1)-(p[b.priority]||1)
    // 3. Dan: deadline
    if(a.dueDate&&b.dueDate)return a.dueDate<b.dueDate?-1:1
    if(a.dueDate&&!b.dueDate)return -1
    if(!a.dueDate&&b.dueDate)return 1
    return 0
  })
  const archived=tasks.filter(t=>t.archived).sort((a,b)=>new Date(b.archivedAt||0)-new Date(a.archivedAt||0))
  const counts={todo:filtered.filter(t=>t.status==='todo').length,gepland:filtered.filter(t=>t.status==='gepland').length,bezig:filtered.filter(t=>t.status==='bezig'||t.status==='in-uitvoering').length,klaar:filtered.filter(t=>t.status==='klaar').length}
  const views=[{key:'kanban',label:'Kanban'},{key:'lijst',label:'Lijst'},{key:'kalender',label:'Kalender'},{key:'archief',label:`Archief (${archived.length})`}]
  const exportCSV = () => {
    const rows = [['Titel','Status','Prioriteit','Categorie','Assignee','Deadline','Aangemaakt','Subtaken','Archived']]
    tasks.forEach(t => rows.push([t.title,t.status,t.priority,t.category,t.assignee,t.dueDate||'',t.createdAt||'',(t.subtasks||[]).length,t.archived?'Ja':'Nee']))
    const csv = rows.map(r => r.map(c => `"${(c+'').replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `artazest-taken-${new Date().toISOString().slice(0,10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'0.5rem'}}>
        <h1 style={{margin:0,flexShrink:0}}>To-do's</h1>
        <div style={{display:'flex',gap:'0.4rem',alignItems:'center',flexShrink:0}}>
          <WekelijkseTodos/>
          <button className="btn btn-primary" onClick={()=>{
            resetForm()
            setEditing(null)
            setShowAdd(true)
          }}>+ Nieuwe taak</button>
        </div>
      </div>
      <div style={{display:'flex',gap:'0.5rem',marginBottom:'0.75rem'}}><div style={{display:'flex',borderRadius:8,border:'1px solid var(--border)',overflow:'hidden'}}><button onClick={()=>setBoardView(false)} style={{padding:'0.3rem 0.7rem',border:'none',fontSize:'0.75rem',fontWeight:600,cursor:'pointer',background:!boardView?'#D97706':'var(--bg-secondary)',color:!boardView?'#fff':'var(--text-secondary)'}}>Taken</button><button onClick={()=>setBoardView(true)} style={{padding:'0.3rem 0.7rem',border:'none',fontSize:'0.75rem',fontWeight:600,cursor:'pointer',background:boardView?'#D97706':'var(--bg-secondary)',color:boardView?'#fff':'var(--text-secondary)'}}>Board</button></div></div>
      {boardView ? <Board /> : <><div style={{marginBottom:'0.35rem'}}>
        <button onClick={()=>setTrackersOpen(!trackersOpen)} style={{display:'flex',alignItems:'center',gap:'0.5rem',width:'100%',padding:'0.4rem 0.6rem',borderRadius:8,border:'1px solid var(--border)',background:'var(--bg-secondary)',cursor:'pointer',fontSize:'0.7rem',fontWeight:600,color:'var(--text-secondary)',textAlign:'left'}}>
          <span style={{transition:'transform 0.15s',transform:trackersOpen?'rotate(90deg)':'rotate(0deg)'}}>▸</span>
          <span>Check-ins · Designers · Platforms</span>
          <span style={{marginLeft:'auto',fontSize:'0.6rem',color:'var(--text-tertiary)'}}>klik om {trackersOpen?'in te klappen':'te openen'}</span>
        </button>
        {trackersOpen && (
          <div style={{display:'flex',alignItems:'flex-start',gap:'0.75rem',marginTop:'0.35rem',overflowX:'auto',paddingBottom:'0.15rem'}}>
            <DagelijkseCheckinsCompact/>
            <HiringTracker/>
            <DesignersTracker/>
            <PlatformCheckins/>
          </div>
        )}
      </div>

      {/* Timeline verwijderd */}

      {/* Signal & Sticky lane */}
      {active.filter(t=>t.isSticky).length>0&&(
      <div style={{marginBottom:'0.5rem',padding:'0.4rem 0.6rem',borderRadius:'10px',background:'linear-gradient(90deg,#FEF3C720,#DBEAFE20)',border:'1px solid var(--border)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'0.4rem',marginBottom:'0.25rem'}}>
          <span style={{fontSize:'0.58rem',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--text-secondary)'}}>📌 Signal & Sticky</span>
          <span style={{fontSize:'0.55rem',color:'var(--text-secondary)'}}>{active.filter(t=>t.isSticky).length}/8</span>
        </div>
        <div style={{display:'flex',gap:'0.4rem',overflowX:'auto',paddingBottom:'0.15rem'}}>
          {active.filter(t=>t.isSticky).slice(0,8).map(t=>{
            const st=statuses.find(s=>s.key===t.status)||statuses[0]
            const days=t.dueDate?Math.ceil((new Date(t.dueDate)-new Date())/864e5):null
            const overdue=days!==null&&days<0
            return (
              <div key={t.id}
                onClick={()=>startEdit(t)}
                style={{flexShrink:0,padding:'0.3rem 0.6rem',borderRadius:'8px',border:`1px solid ${overdue?'#FECACA':st.color+'40'}`,background:'var(--bg-card)',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.35rem',maxWidth:'200px',transition:'all 0.12s'}}
                onMouseEnter={e=>e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.08)'} onMouseLeave={e=>e.currentTarget.style.boxShadow=''}>
                <span style={{width:'6px',height:'6px',borderRadius:'50%',background:st.color,flexShrink:0}}/>
                <span style={{fontSize:'0.72rem',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</span>
                {overdue&&<span style={{fontSize:'0.55rem',color:'#DC2626',fontWeight:700,flexShrink:0}}>{Math.abs(days)}d</span>}
                {t.priority==='high'&&<span style={{fontSize:'0.5rem',color:'#DC2626',flexShrink:0}}>!</span>}
                <button onClick={e=>{e.stopPropagation();api.save('tasks',{...t,isSticky:false});reload()}} style={{background:'none',border:'none',cursor:'pointer',color:'#D1D5DB',fontSize:'0.6rem',flexShrink:0,padding:0}}
                  onMouseEnter={e=>e.currentTarget.style.color='#DC2626'} onMouseLeave={e=>e.currentTarget.style.color='#D1D5DB'}>✕</button>
              </div>
            )
          })}
        </div>
      </div>
      )}

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:'0.5rem'}}>
        
        <div style={{display:'flex',gap:'0.35rem',alignItems:'center'}}>
          <button className={`btn btn-sm ${filterUser==='all'?'btn-primary':'btn-outline'}`} onClick={()=>setFilterUser('all')}>Alle</button>
          {ASSIGNEES.map(a=><button key={a} className={`btn btn-sm ${filterUser===a?'btn-primary':'btn-outline'}`} onClick={()=>setFilterUser(a)}>{a}</button>)}
          <button className="btn btn-sm btn-outline" onClick={()=>setShowPhaseEdit(!showPhaseEdit)} style={{marginLeft:'0.25rem',fontSize:'0.75rem',color:'var(--text-secondary)'}}>⚙</button>
          <button className="btn btn-sm btn-outline" onClick={exportCSV} style={{fontSize:'0.7rem',color:'var(--text-secondary)'}} title="Exporteer taken als CSV">📥</button>
        </div>
      </div>

      {/* PROJECT FILTER BALK */}
      <div style={{display:'flex',alignItems:'center',gap:'0.35rem',flexWrap:'wrap',marginBottom:'0.85rem',paddingBottom:'0.75rem',borderBottom:'1px solid var(--border)'}}>
        <span style={{fontSize:'0.6rem',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--text-secondary)',marginRight:'0.15rem',whiteSpace:'nowrap'}}>Project</span>
        {/* Alle knop */}
        <button onClick={()=>setActiveProject('alle')}
          style={{padding:'0.22rem 0.7rem',borderRadius:'99px',border:`1.5px solid ${activeProject==='alle'?'var(--accent)':'var(--border)'}`,background:activeProject==='alle'?'var(--accent)':'transparent',color:activeProject==='alle'?'#fff':'var(--text-secondary)',fontSize:'0.75rem',fontWeight:600,cursor:'pointer',transition:'all 0.15s',whiteSpace:'nowrap'}}>
          Alle
        </button>
        {/* Project knopjes */}
        {projects.map((p,pi)=>{
          const count=active.filter(t=>t.category===p&&t.status!=='klaar').length
          const isActive=activeProject===p
          return (
            <div key={p} draggable onDragStart={e=>{e.dataTransfer.setData('text/plain',pi.toString());e.dataTransfer.effectAllowed='move'}}
              onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderLeft='2px solid var(--accent)'}}
              onDragLeave={e=>{e.currentTarget.style.borderLeft='none'}}
              onDrop={e=>{e.preventDefault();e.currentTarget.style.borderLeft='none';const from=parseInt(e.dataTransfer.getData('text/plain'));if(isNaN(from)||from===pi)return;const np=[...projects];const[moved]=np.splice(from,1);np.splice(pi,0,moved);saveProjects(np)}}
              style={{position:'relative',display:'flex',alignItems:'center',cursor:'grab'}}>
              <button onClick={()=>setActiveProject(isActive?'alle':p)}
                style={{padding:'0.22rem 0.7rem',borderRadius:'99px',border:`1.5px solid ${isActive?'var(--accent)':'var(--border)'}`,background:isActive?'var(--accent)':'var(--bg-secondary)',color:isActive?'#fff':'var(--text-primary)',fontSize:'0.75rem',fontWeight:600,cursor:'pointer',transition:'all 0.15s',display:'flex',alignItems:'center',gap:'0.3rem',whiteSpace:'nowrap'}}>
                {p}
                {count>0&&<span style={{fontSize:'0.65rem',background:isActive?'rgba(255,255,255,0.25)':'var(--bg-card)',color:isActive?'#fff':'var(--text-secondary)',borderRadius:'99px',padding:'0 0.3rem',fontWeight:700}}>{count}</span>}
              </button>
              <button onClick={e=>{e.stopPropagation();removeProject(p)}} title="Verwijder project"
                style={{position:'absolute',top:'-5px',right:'-5px',width:'15px',height:'15px',borderRadius:'50%',background:'#DC2626',color:'#fff',border:'2px solid white',cursor:'pointer',fontSize:'0.6rem',display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1,padding:0,opacity:0,transition:'opacity 0.15s'}}
                ref={el=>{if(el){el.closest('div').addEventListener('mouseenter',()=>el.style.opacity='1');el.closest('div').addEventListener('mouseleave',()=>el.style.opacity='0')}}}>×</button>
            </div>
          )
        })}
        {/* Toevoeg */}
        {!showAddProject ? (
          <button onClick={()=>setShowAddProject(true)}
            style={{padding:'0.22rem 0.6rem',borderRadius:'99px',border:'1.5px dashed var(--border)',background:'transparent',color:'var(--text-secondary)',fontSize:'0.73rem',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.2rem'}}>
            + Project
          </button>
        ) : (
          <div style={{display:'flex',alignItems:'center',gap:'0.3rem',padding:'0.15rem 0.4rem',borderRadius:'99px',border:'1.5px solid var(--accent)',background:'var(--accent-light)'}}>
            <input autoFocus value={newProject} onChange={e=>setNewProject(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter')addProject();if(e.key==='Escape')setShowAddProject(false)}}
              placeholder="Projectnaam..." list="cat-suggestions"
              style={{border:'none',background:'transparent',fontSize:'0.75rem',fontWeight:600,outline:'none',width:'110px',fontFamily:'var(--font-body)',color:'var(--text-primary)'}}/>
            <datalist id="cat-suggestions">
              {CATEGORIES.map(cat=><option key={cat} value={cat}/>)}
            </datalist>
            <button onClick={addProject} style={{background:'var(--accent)',color:'#fff',border:'none',borderRadius:'99px',fontSize:'0.65rem',padding:'0.15rem 0.4rem',cursor:'pointer',fontWeight:600}}>+</button>
            <button onClick={()=>setShowAddProject(false)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',fontSize:'0.65rem'}}>✕</button>
          </div>
        )}
      </div>

      {/* Teller onder projectbalk */}
      <div style={{fontSize:'0.78rem',color:'var(--text-secondary)',marginBottom:'0.75rem',display:'flex',alignItems:'center',gap:'0.5rem'}}>
        <span>{counts.todo} to do · {counts.gepland} gepland · {counts.bezig} in uitvoering · {counts.klaar} klaar</span>
        {daysToLaunch>0&&<span style={{padding:'0.12rem 0.5rem',borderRadius:'99px',fontSize:'0.72rem',fontWeight:600,background:daysToLaunch<=7?'var(--danger-light)':daysToLaunch<=14?'var(--accent-light)':'var(--info-light)',color:daysToLaunch<=7?'var(--danger)':daysToLaunch<=14?'var(--accent-text)':'var(--info)'}}>{daysToLaunch}d tot launch</span>}
      </div>

      {/* Bulk action bar */}
      {selected.size>0&&(
        <div style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.5rem 0.75rem',marginBottom:'0.75rem',borderRadius:'10px',background:'#EFF6FF',border:'1px solid #BFDBFE'}}>
          <span style={{fontSize:'0.82rem',fontWeight:700,color:'#1D4ED8'}}>{selected.size} geselecteerd</span>
          <button onClick={clearSelection} style={{fontSize:'0.72rem',background:'none',border:'none',cursor:'pointer',color:'#2563EB',fontWeight:600,textDecoration:'underline'}}>Deselecteer</button>
          <div style={{flex:1}}/>
          <button onClick={async()=>{if(confirm(selected.size+' taken archiveren?'))await bulkArchive()}} style={{padding:'0.3rem 0.7rem',borderRadius:'6px',border:'1px solid #D97706',background:'#FFFBEB',color:'#92400E',fontSize:'0.72rem',fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:'0.3rem'}}>📦 Archiveer</button>
          <button onClick={async()=>{if(confirm(selected.size+' taken PERMANENT verwijderen?'))await bulkDelete()}} style={{padding:'0.3rem 0.7rem',borderRadius:'6px',border:'1px solid #DC2626',background:'#FEF2F2',color:'#DC2626',fontSize:'0.72rem',fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:'0.3rem'}}>🗑 Verwijder</button>
        </div>
      )}

      {showPhaseEdit&&(<div className="card" style={{marginBottom:'1rem',padding:'0.75rem 1rem'}}>
        <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.75rem'}}><span style={{fontSize:'0.8rem',fontWeight:600}}>Fases beheren</span><span style={{fontSize:'0.7rem',color:'var(--text-secondary)'}}>min. 2 fases</span></div>
        <div style={{display:'flex',gap:'0.4rem',flexWrap:'wrap',marginBottom:'0.75rem'}}>{statuses.map((s,i)=>(<div key={s.key} draggable
          onDragStart={()=>setDragPhase(i)} onDragEnd={()=>{setDragPhase(null);setDragOverPhase(null)}}
          onDragOver={e=>{e.preventDefault();setDragOverPhase(i)}}
          onDrop={e=>{e.preventDefault();if(dragPhase!==null&&dragPhase!==i){const r=[...statuses];const[m]=r.splice(dragPhase,1);r.splice(i,0,m);saveStatuses(r)};setDragPhase(null);setDragOverPhase(null)}}
          style={{display:'flex',alignItems:'center',gap:'0.3rem',padding:'0.3rem 0.6rem',borderRadius:'99px',border:dragOverPhase===i?'2px dashed var(--accent)':'1px solid var(--border)',fontSize:'0.8rem',cursor:'grab',opacity:dragPhase===i?0.4:1,transition:'all 0.12s',background:dragOverPhase===i?'var(--accent-light)':'var(--bg-card)'}}><span style={{width:'8px',height:'8px',borderRadius:'50%',background:s.color}}/><span style={{fontWeight:500}}>{s.label}</span>{statuses.length>2&&<button onClick={()=>removePhase(s.key)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',fontSize:'0.7rem',marginLeft:'0.15rem'}}>x</button>}</div>))}</div>
        <div style={{display:'flex',gap:'0.35rem'}}><input className="form-input" value={newPhase} onChange={e=>setNewPhase(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addPhase()} placeholder="Nieuwe fase..." style={{maxWidth:'180px',padding:'0.3rem 0.6rem',fontSize:'0.8rem'}}/><button className="btn btn-sm btn-outline" onClick={addPhase}>+</button></div>
      </div>)}

      <VandaagPanel tasks={active} statuses={statuses} onDropToday={assignToday} onEdit={startEdit} draggedId={draggedId} onDragStart={id=>setDraggedId(id)} onDragEnd={()=>setDraggedId(null)} onClearDay={clearDay} onQuickAdd={async title=>{await api.save('tasks',{id:uid(),title,category:activeProject!=='alle'?activeProject:'Overig',assignee:user?.name||'Tein',status:'gepland',priority:'normal',notes:'',dueDate:'',plannedDate:todayISO(),tags:[],subtasks:[],estimatedHours:0,energyLevel:'middel',recurring:'nooit',isMIT:false,createdAt:new Date().toISOString()});reload()}}/>
      <div style={{overflowX:'auto'}}>
          {view==='kanban'?(
            <div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'0.75rem'}}>
              {statuses.filter(st=>st.key==='todo'||st.key==='bezig').map(st=>(<KanbanColumn key={st.key} status={st} statuses={statuses} tasks={filtered.filter(t=>t.status===st.key&&t.plannedDate!==todayISO())} onDrop={(ns,dropId)=>{ const id=dropId||_DRAG_ID||draggedId; if(id){updateStatus(id,ns);_DRAG_ID=null}}} onCardDragStart={id=>{setDraggedId(id);_DRAG_ID=id}} onCardDragEnd={()=>{setDraggedId(null);setTimeout(()=>{_DRAG_ID=null},100)}} onCardClick={startEdit} onStatusChange={(id,s)=>updateStatus(id,s)} onSubtaskToggle={(tid,sid)=>toggleSubtaskOnCard(tid,sid)} onArchive={id=>{const t=tasks.find(x=>x.id===id);if(t)setConfirmArchive({id,title:t.title})}} draggedId={draggedId} onAddTask={()=>{resetForm();setForm(f=>({...f,status:st.key}));setEditing(null);setShowAdd(true)}} onReorder={(id,idx)=>reorderInColumn(id,idx,st.key)} selected={selected} onToggleSelect={toggleSelect} onQuickAdd={async title=>{await api.save('tasks',{id:uid(),title,category:activeProject!=='alle'?activeProject:'Overig',assignee:user?.name||'Tein',status:st.key,priority:'normal',notes:'',dueDate:'',plannedDate:'',tags:[],subtasks:[],estimatedHours:0,energyLevel:'middel',recurring:'nooit',isMIT:false,createdAt:new Date().toISOString()});reload()}} onPin={id=>{const t=tasks.find(x=>x.id===id);if(t){if(t.isSticky){api.save('tasks',{...t,isSticky:false});reload()}else if(active.filter(x=>x.isSticky).length<8){api.save('tasks',{...t,isSticky:true});reload()}}}}/>))}
            </div>
            {/* Extra kolommen toggle */}
            <div style={{marginTop:'0.75rem',display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
              {statuses.filter(st=>st.key!=='todo'&&st.key!=='bezig').map(st=>{
                const count=filtered.filter(t=>t.status===st.key&&t.plannedDate!==todayISO()).length
                return <button key={st.key} onClick={()=>setShowExtraCols(showExtraCols===st.key?false:st.key)} style={{padding:'0.25rem 0.6rem',borderRadius:8,border:showExtraCols===st.key?'2px solid '+st.color:'1px solid var(--border)',background:showExtraCols===st.key?st.color+'15':'var(--bg-secondary)',cursor:'pointer',fontSize:'0.7rem',fontWeight:600,color:showExtraCols===st.key?st.color:'var(--text-secondary)',display:'flex',alignItems:'center',gap:'0.3rem'}}>
                  <span style={{width:8,height:8,borderRadius:'50%',background:st.color}}/>{st.label}<span style={{background:st.color,color:'#fff',borderRadius:20,padding:'0 0.3rem',fontSize:'0.55rem',fontWeight:700}}>{count}</span>
                </button>
              })}
            </div>
            {showExtraCols&&(()=>{const st=statuses.find(s=>s.key===showExtraCols);if(!st)return null;const items=filtered.filter(t=>t.status===st.key&&t.plannedDate!==todayISO());return(
              <div style={{marginTop:'0.5rem',background:'var(--bg-secondary)',borderRadius:12,padding:'0.75rem',border:'1px solid var(--border)'}}>
                <div style={{display:'flex',alignItems:'center',gap:'0.4rem',marginBottom:'0.5rem'}}>
                  <span style={{width:10,height:10,borderRadius:'50%',background:st.color}}/>
                  <span style={{fontWeight:600,fontSize:'0.8rem',color:'var(--text-primary)'}}>{st.label}</span>
                  <span style={{fontSize:'0.65rem',color:'var(--text-secondary)'}}>{items.length} taken</span>
                  <button onClick={()=>setShowExtraCols(false)} style={{marginLeft:'auto',border:'none',background:'none',cursor:'pointer',color:'var(--text-secondary)',fontSize:'0.8rem'}}>×</button>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'0.25rem',maxHeight:'300px',overflowY:'auto'}}>
                  {items.map(t=><div key={t.id} onClick={()=>startEdit(t)} style={{padding:'0.3rem 0.5rem',borderRadius:6,background:'var(--bg-card)',border:'1px solid var(--border)',cursor:'pointer',fontSize:'0.7rem',fontWeight:500,color:'var(--text-primary)',display:'flex',alignItems:'center',gap:'0.4rem'}} onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover,#f5f5f4)'} onMouseLeave={e=>e.currentTarget.style.background='var(--bg-card)'}><span style={{textDecoration:st.key==='klaar'?'line-through':'none',flex:1}}>{t.title}</span></div>)}
                  {items.length===0&&<div style={{fontSize:'0.65rem',color:'var(--text-tertiary)',textAlign:'center',padding:'0.5rem'}}>Geen taken</div>}
                </div>
              </div>
            )})()}
            </div>
          ):view==='archief'?(
            view==='kalender' ? <KalenderView tasks={filtered} onTaskClick={startEdit} onAddTask={(date)=>{resetForm();setForm(f=>({...f,dueDate:date}));setShowAdd(true)}}/> :
          archived.length===0?<div className="card"><div className="empty-state">Geen gearchiveerde taken</div></div>:
            <div className="task-list">{archived.map(t=>(<div key={t.id} className="task-item" style={{opacity:0.6}}><div style={{flex:1}}><div className="task-title" style={{textDecoration:'line-through'}}>{t.title}</div><div className="task-meta">{t.assignee} &middot; {t.archivedAt&&fmt(t.archivedAt)}</div></div><button className="btn btn-sm btn-outline" onClick={async()=>{const x=tasks.find(a=>a.id===t.id);if(x){await api.save('tasks',{...x,archived:false});reload()}}} style={{fontSize:'0.7rem'}}>Terugzetten</button></div>))}</div>
          ):(
            filtered.length===0?<div className="card"><div className="empty-state">Geen taken{filterUser!=='all'?` voor ${filterUser}`:''}</div></div>:
            <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>{filtered.map(t=><TaskCard key={t.id} task={t} statuses={statuses} draggable onDragStart={()=>setDraggedId(t.id)} onDragEnd={()=>setDraggedId(null)} onClick={()=>startEdit(t)} onStatusChange={s=>updateStatus(t.id,s)} onSubtaskToggle={subId=>toggleSubtaskOnCard(t.id,subId)} onArchive={()=>setConfirmArchive({id:t.id,title:t.title})}/>)}</div>
          )}
        </div>

      {/* Project verwijderen bevestiging */}
      {confirmDeleteProject&&(
        <div className="modal-overlay" onClick={()=>setConfirmDeleteProject(null)}>
          <div className="modal" style={{maxWidth:'380px',textAlign:'center'}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:'1.5rem',marginBottom:'0.5rem'}}>🗂</div>
            <h3 style={{marginBottom:'0.5rem'}}>Project verwijderen?</h3>
            <p style={{fontSize:'0.82rem',color:'var(--text-secondary)',marginBottom:'1.25rem'}}>
              Weet je zeker dat je <strong>"{confirmDeleteProject}"</strong> wilt verwijderen?<br/>
              De taken blijven bestaan, alleen het projectfilter verdwijnt.
            </p>
            <div style={{display:'flex',gap:'0.5rem',justifyContent:'center'}}>
              <button className="btn btn-outline" onClick={()=>setConfirmDeleteProject(null)}>Annuleren</button>
              <button className="btn btn-primary" style={{background:'var(--danger)'}} onClick={()=>doRemoveProject(confirmDeleteProject)}>Verwijderen</button>
            </div>
          </div>
        </div>
      )}

      {/* Archiveer bevestiging */}
      {confirmArchive&&(
        <div className="modal-overlay" onClick={()=>setConfirmArchive(null)}>
          <div className="modal" style={{maxWidth:'400px',textAlign:'center'}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:'1.5rem',marginBottom:'0.5rem'}}>📦</div>
            <h3 style={{marginBottom:'0.5rem'}}>Naar archief?</h3>
            <p style={{fontSize:'0.82rem',color:'var(--text-secondary)',marginBottom:'1.25rem'}}>"{confirmArchive.title}" wordt gearchiveerd. Je kunt dit ongedaan maken.</p>
            <div style={{display:'flex',gap:'0.5rem',justifyContent:'center'}}>
              <button className="btn btn-outline" onClick={()=>setConfirmArchive(null)}>Annuleren</button>
              <button className="btn btn-primary" onClick={()=>{archiveTask(confirmArchive.id);setConfirmArchive(null)}}>Archiveer</button>
            </div>
          </div>
        </div>
      )}

      {/* Undo toast */}
      {undoToast&&(
        <div style={{position:'fixed',bottom:'1.5rem',left:'50%',transform:'translateX(-50%)',background:'rgba(28,25,23,0.92)',color:'#fff',padding:'0.65rem 1rem',borderRadius:'10px',display:'flex',alignItems:'center',gap:'0.75rem',zIndex:9999,boxShadow:'0 4px 20px rgba(0,0,0,0.2)',backdropFilter:'blur(8px)',fontSize:'0.82rem',fontWeight:500,whiteSpace:'nowrap'}}>
          <span>📦 "{undoToast.title.slice(0,30)}{undoToast.title.length>30?'…':''}" gearchiveerd</span>
          <button onClick={undoArchive} style={{background:'#fff',color:'rgba(28,25,23,0.9)',border:'none',borderRadius:'6px',padding:'0.3rem 0.75rem',cursor:'pointer',fontWeight:700,fontSize:'0.78rem',fontFamily:'var(--font-body)'}}>Ongedaan</button>
          <button onClick={()=>{clearTimeout(undoToast.timer);setUndoToast(null)}} style={{background:'none',border:'none',color:'rgba(255,255,255,0.5)',cursor:'pointer',fontSize:'0.75rem',padding:'0.1rem'}}>✕</button>
        </div>
      )}

      {/* Fase verwijderen — migratie modal */}
      {confirmMigratePhase&&(
        <div className="modal-overlay" onClick={()=>setConfirmMigratePhase(null)}>
          <div className="modal" style={{maxWidth:'420px'}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>Fase verwijderen</h3>
              <button className="modal-close" onClick={()=>setConfirmMigratePhase(null)}>✕</button>
            </div>
            <p style={{fontSize:'0.85rem',color:'var(--text-secondary)',marginBottom:'1rem'}}>
              De fase <strong>"{confirmMigratePhase.label}"</strong> heeft nog <strong>{confirmMigratePhase.taskCount} taken</strong>.
              Waar wil je deze taken naartoe verplaatsen?
            </p>
            <div style={{display:'flex',flexDirection:'column',gap:'0.5rem',marginBottom:'1.25rem'}}>
              {statuses.filter(s=>s.key!==confirmMigratePhase.key).map(s=>(
                <button key={s.key} onClick={()=>doRemovePhase(confirmMigratePhase.key,s.key)}
                  style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.75rem 1rem',borderRadius:'10px',border:'1px solid var(--border)',background:'var(--bg-secondary)',cursor:'pointer',textAlign:'left',transition:'all 0.15s'}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=s.color;e.currentTarget.style.background='var(--bg-card)'}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.background='var(--bg-secondary)'}}>
                  <span style={{width:'10px',height:'10px',borderRadius:'50%',background:s.color,flexShrink:0}}/>
                  <span style={{fontWeight:600,fontSize:'0.85rem'}}>{s.label}</span>
                  <span style={{fontSize:'0.75rem',color:'var(--text-secondary)',marginLeft:'auto'}}>Verplaats {confirmMigratePhase.taskCount} taken hiernaartoe →</span>
                </button>
              ))}
            </div>
            <div style={{display:'flex',justifyContent:'flex-end'}}>
              <button className="btn btn-outline" onClick={()=>setConfirmMigratePhase(null)}>Annuleren</button>
            </div>
          </div>
        </div>
      )}

      {confirmDel&&(<div className="modal-overlay" onClick={()=>setConfirmDel(null)}><div className="modal" style={{maxWidth:'380px',textAlign:'center'}} onClick={e=>e.stopPropagation()}><h3 style={{marginBottom:'0.75rem'}}>Taak verwijderen?</h3><div style={{display:'flex',gap:'0.5rem',justifyContent:'center'}}><button className="btn btn-outline" onClick={()=>setConfirmDel(null)}>Annuleren</button><button className="btn btn-primary" style={{background:'var(--danger)'}} onClick={()=>del(confirmDel)}>Verwijderen</button></div></div></div>)}

      {showAdd&&(<div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&(setShowAdd(false),setEditing(null))}>
        <div className="modal" style={{maxWidth:'560px'}}>
          <div className="modal-header"><h3>{editing?'Taak bewerken':'Nieuwe taak'}</h3><button className="modal-close" onClick={()=>{setShowAdd(false);setEditing(null)}}>x</button></div>
          <div className="form-group"><label className="form-label">Titel</label><input className="form-input" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Wat moet er gebeuren?" autoFocus/></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.75rem'}}>
            <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>{statuses.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Toewijzen</label><select className="form-select" value={form.assignee} onChange={e=>setForm({...form,assignee:e.target.value})}>{ALL_ASSIGNEES.map(a=><option key={a}>{a}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Prioriteit</label><button className="btn btn-sm" onClick={()=>setForm({...form,priority:form.priority==='high'?'normal':'high'})} style={{width:'100%',justifyContent:'center',fontSize:'0.75rem',background:form.priority==='high'?'var(--danger)':'transparent',color:form.priority==='high'?'#fff':undefined,border:form.priority==='high'?'none':'1px solid var(--border-strong)'}}>Urgent</button></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.75rem'}}>
            <div className="form-group"><label className="form-label">Categorie</label><select className="form-select" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option value="Overig">Overig</option>{[...new Set([...CATEGORIES,...projects])].filter(c=>c&&c!=='Overig').map(c=><option key={c} value={c}>{c}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Deadline</label><input className="form-input" type="date" value={form.dueDate||''} onChange={e=>setForm({...form,dueDate:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">Plan op dag</label><input className="form-input" type="date" value={form.plannedDate||''} onChange={e=>setForm({...form,plannedDate:e.target.value,status:e.target.value&&form.status==='todo'?'gepland':form.status})}/></div>
          </div>
          <div className="form-group"><label className="form-label">Subtaken / Checklist</label>
            {(form.subtasks||[]).length>0&&(<div style={{display:'flex',flexDirection:'column',gap:'0.22rem',marginBottom:'0.5rem',maxHeight:'160px',overflowY:'auto'}}>{(form.subtasks||[]).map(sub=>(<div key={sub.id} style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.3rem 0.5rem',borderRadius:'6px',background:sub.completed?'var(--bg-secondary)':'var(--bg-card)',border:'1px solid var(--border)'}}><input type="checkbox" checked={sub.completed} onChange={()=>toggleSubtask(sub.id)} style={{width:'14px',height:'14px',cursor:'pointer',accentColor:'var(--accent)'}}/><span style={{flex:1,fontSize:'0.82rem',textDecoration:sub.completed?'line-through':'none',color:sub.completed?'var(--text-secondary)':'var(--text-primary)'}}>{sub.title}</span><button onClick={()=>removeSubtask(sub.id)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',fontSize:'0.7rem'}}>x</button></div>))}</div>)}
            <div style={{display:'flex',gap:'0.35rem'}}><input ref={subtaskInputRef} className="form-input" value={subtaskInput} onChange={e=>setSubtaskInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addSubtask())} placeholder="Subtaak toevoegen (Enter)..." style={{fontSize:'0.82rem',padding:'0.35rem 0.6rem'}}/><button className="btn btn-sm btn-outline" onClick={addSubtask}>+</button></div>
            {(form.subtasks||[]).length>0&&<div style={{marginTop:'0.3rem',fontSize:'0.72rem',color:'var(--text-secondary)'}}>{(form.subtasks||[]).filter(s=>s.completed).length}/{(form.subtasks||[]).length} afgerond</div>}
          </div>
          <div className="form-group"><label className="form-label">Tags</label>
            <div style={{display:'flex',gap:'0.25rem',flexWrap:'wrap',marginBottom:'0.35rem'}}>{(form.tags||[]).map(t=><span key={t} style={{display:'flex',alignItems:'center',gap:'0.2rem',padding:'0.1rem 0.5rem',borderRadius:'99px',fontSize:'0.7rem',fontWeight:600,background:'var(--info-light)',color:'var(--info)'}}>#{t}<button onClick={()=>removeTag(t)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--info)',fontSize:'0.7rem'}}>x</button></span>)}</div>
            <div style={{display:'flex',gap:'0.35rem'}}><input className="form-input" value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addTag())} placeholder="Tag..." style={{fontSize:'0.8rem',padding:'0.3rem 0.6rem'}}/><button className="btn btn-sm btn-outline" onClick={addTag}>+</button></div>
          </div>
          <div className="form-group"><label className="form-label">Notities</label><textarea className="form-textarea" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Details..." rows={2}/></div>
          <div style={{display:'flex',gap:'0.5rem',justifyContent:'space-between'}}>
            <div>{editing&&<button className="btn btn-sm" style={{color:'var(--danger)',background:'none',border:'none'}} onClick={()=>setConfirmDel(editing)}>Verwijderen</button>}</div>
            <div style={{display:'flex',gap:'0.5rem'}}><button className="btn btn-outline" onClick={()=>{setShowAdd(false);setEditing(null)}}>Annuleren</button><button className="btn btn-primary" onClick={handleSave}>{editing?'Bijwerken':'Opslaan'}</button></div>
          </div>
        </div>
      </div>)}
    </>}
    </>
  )
}
