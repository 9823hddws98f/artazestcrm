import { useState, useEffect, useRef } from 'react'
import { api } from '../api'

const ASSIGNEES = ['Tein','Sam','Productie']
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

function Timeline({ tasks, onDropDay, draggedId }) {
  const today = new Date(); today.setHours(0,0,0,0)
  const DAYS = 14
  const DAY_W = 54 // px per dag
  const LABEL_W = 156
  const days = Array.from({length:DAYS},(_,i)=>{ const d=new Date(today); d.setDate(d.getDate()+i); return d })
  const toISO = d => d.toISOString().slice(0,10)
  const todayStr = toISO(today)
  const launchStr = '2026-04-18'
  const [overDay, setOverDay] = useState(null)

  // Bereken dag-index (0 = vandaag) voor een ISO-datum
  const dayIdx = iso => Math.round((new Date(iso) - today) / (1000*60*60*24))

  // Taken met datums, gesorteerd op startdatum
  const ganttTasks = tasks
    .filter(t => !t.archived && t.status !== 'klaar' && (t.plannedDate || t.dueDate))
    .sort((a,b) => (a.plannedDate||a.dueDate) > (b.plannedDate||b.dueDate) ? 1 : -1)
    .slice(0, 10)

  const statusColor = { todo:'#9CA3AF', gepland:'#2563EB', bezig:'#D97706', klaar:'#059669' }
  const launchIdx = dayIdx(launchStr)

  return (
    <div style={{marginBottom:'1.25rem',border:'1px solid var(--border)',borderRadius:'10px',overflow:'hidden',background:'var(--bg-card)'}}>
      {/* HEADER: dag-kolommen */}
      <div style={{display:'flex',borderBottom:'1px solid var(--border)',background:'var(--bg-secondary)'}}>
        <div style={{width:LABEL_W,flexShrink:0,padding:'0.4rem 0.75rem',fontSize:'0.6rem',fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.08em',display:'flex',alignItems:'center'}}>Taken</div>
        <div style={{flex:1,overflowX:'auto'}}>
          <div style={{display:'flex',minWidth:DAYS*DAY_W}}>
            {days.map((day,i) => {
              const iso = toISO(day)
              const isToday = iso === todayStr
              const isLaunch = iso === launchStr
              const isWeekend = day.getDay()===0||day.getDay()===6
              const isOver = overDay===iso && !!draggedId
              return (
                <div key={iso}
                  onDragOver={e=>{e.preventDefault();setOverDay(iso)}}
                  onDragLeave={()=>setOverDay(null)}
                  onDrop={e=>{e.preventDefault();setOverDay(null);if(draggedId)onDropDay(draggedId,iso)}}
                  style={{width:DAY_W,flexShrink:0,padding:'0.3rem 0.15rem',textAlign:'center',borderRight:'1px solid var(--border)',background:isOver?'#DBEAFE':isToday?'#FFF7ED':isLaunch?'#FEF3C7':isWeekend?'rgba(0,0,0,0.025)':'transparent',cursor:'default',transition:'background 0.1s',position:'relative'}}>
                  <div style={{fontSize:'0.55rem',fontWeight:700,textTransform:'uppercase',color:isToday?'#D97706':isLaunch?'#D97706':isWeekend?'#9CA3AF':'var(--text-secondary)',lineHeight:1}}>{day.toLocaleDateString('nl-NL',{weekday:'short'})}</div>
                  <div style={{fontSize:'0.75rem',fontWeight:isToday||isLaunch?700:400,color:isToday?'#D97706':isLaunch?'#D97706':'var(--text-primary)',lineHeight:1.2}}>{day.getDate()}</div>
                  {isLaunch&&<div style={{fontSize:'0.5rem',color:'#D97706',fontWeight:700,lineHeight:1}}>launch</div>}
                  {isOver&&<div style={{position:'absolute',inset:0,border:'2px dashed #2563EB',borderRadius:'2px',pointerEvents:'none'}}/>}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* GANTT RIJEN */}
      <div style={{position:'relative'}}>
        {/* Vandaag-lijn */}
        <div style={{position:'absolute',left:LABEL_W + DAY_W*0 + DAY_W/2,top:0,bottom:0,width:'2px',background:'#F97316',opacity:0.35,pointerEvents:'none',zIndex:1}}/>
        {/* Launch-lijn */}
        {launchIdx>=0&&launchIdx<DAYS&&<div style={{position:'absolute',left:LABEL_W + DAY_W*launchIdx + DAY_W/2,top:0,bottom:0,width:'2px',background:'#D97706',opacity:0.5,pointerEvents:'none',zIndex:1,borderStyle:'dashed'}}/>}

        {ganttTasks.length===0?(
          <div style={{padding:'0.9rem 0.75rem',fontSize:'0.75rem',color:'var(--text-secondary)',paddingLeft:LABEL_W+8}}>Sleep taken vanuit de kanban om ze te plannen op de tijdlijn</div>
        ):ganttTasks.map(task=>{
          const startISO = task.plannedDate || task.dueDate
          const endISO = task.dueDate || task.plannedDate
          const si = Math.max(0, dayIdx(startISO))
          const ei = Math.min(DAYS-1, dayIdx(endISO))
          if (si > DAYS-1) return null
          const barLeft = si * DAY_W
          const barW = Math.max(DAY_W - 6, (ei - si + 1) * DAY_W - 6)
          const color = task.priority==='high'?'#DC2626':statusColor[task.status]||'#9CA3AF'
          const subs = task.subtasks||[]
          const subPct = subs.length>0?Math.round(subs.filter(s=>s.completed).length/subs.length*100):null

          return (
            <div key={task.id} style={{display:'flex',alignItems:'stretch',borderBottom:'1px solid rgba(28,25,23,0.05)',minHeight:'34px'}}>
              {/* Label */}
              <div style={{width:LABEL_W,flexShrink:0,padding:'0.2rem 0.75rem',fontSize:'0.71rem',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'var(--text-primary)',display:'flex',alignItems:'center',borderRight:'1px solid var(--border)'}}>
                <span style={{display:'inline-block',width:'6px',height:'6px',borderRadius:'50%',background:color,flexShrink:0,marginRight:'0.35rem'}}/>
                {task.title}
              </div>
              {/* Bar area */}
              <div style={{flex:1,position:'relative',overflow:'hidden'}}>
                {/* Grid achtergrond */}
                <div style={{position:'absolute',inset:0,display:'flex'}}>
                  {days.map((day,i)=>{
                    const iso=toISO(day)
                    const isToday=iso===todayStr; const isWeekend=day.getDay()===0||day.getDay()===6; const isLaunch=iso===launchStr
                    return <div key={iso} style={{width:DAY_W,flexShrink:0,height:'100%',borderRight:'1px solid rgba(28,25,23,0.04)',background:isToday?'rgba(249,115,22,0.04)':isLaunch?'rgba(217,119,6,0.05)':isWeekend?'rgba(0,0,0,0.01)':'transparent'}}/>
                  })}
                </div>
                {/* Taak balk */}
                <div style={{position:'absolute',left:barLeft+3,width:barW,top:'6px',height:'22px',borderRadius:'4px',background:color,opacity:0.85,display:'flex',alignItems:'center',paddingLeft:'6px',paddingRight:'4px',overflow:'hidden',gap:'4px'}}>
                  <span style={{fontSize:'0.58rem',color:'#fff',fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',flex:1}}>{task.assignee}</span>
                  {subPct!==null&&<span style={{fontSize:'0.55rem',color:'rgba(255,255,255,0.85)',flexShrink:0}}>{subPct}%</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* DROP HINT */}
      {draggedId&&(
        <div style={{padding:'0.4rem 0.75rem',fontSize:'0.68rem',color:'#2563EB',background:'#EFF6FF',borderTop:'1px solid #BFDBFE',fontWeight:500}}>
          Sleep naar een dag hierboven om te plannen
        </div>
      )}
    </div>
  )
}

function VandaagPanel({ tasks, statuses, onDropToday, onEdit, draggedId }) {
  const today = todayISO()
  const todayTasks = tasks.filter(t => t.plannedDate===today && t.status!=='klaar' && !t.archived)
  const doneTodayCount = tasks.filter(t => t.plannedDate===today && t.status==='klaar').length
  const [isOver, setIsOver] = useState(false)
  const dayStr = new Date().toLocaleDateString('nl-NL',{weekday:'long',day:'numeric',month:'long'})

  return (
    <div style={{width:'230px',flexShrink:0}}>
      <div onDragOver={e=>{e.preventDefault();setIsOver(true)}} onDragLeave={()=>setIsOver(false)}
        onDrop={e=>{e.preventDefault();setIsOver(false);if(draggedId)onDropToday(draggedId)}}
        className="card"
        style={{borderTop:'3px solid #D97706',position:'sticky',top:'1rem',maxHeight:'calc(100vh - 180px)',overflowY:'auto',background:isOver?'#FFFBF0':'var(--bg-card)',outline:isOver?'2px dashed #D97706':'none',outlineOffset:'2px',transition:'all 0.1s'}}>
        <div style={{marginBottom:'0.75rem'}}>
          <div style={{fontSize:'0.65rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#D97706'}}>Vandaag</div>
          <div style={{fontSize:'0.73rem',color:'var(--text-secondary)',marginTop:'0.1rem'}}>{dayStr}</div>
          {doneTodayCount>0&&<div style={{fontSize:'0.7rem',color:'#059669',marginTop:'0.2rem'}}>checkmark {doneTodayCount} afgerond</div>}
        </div>
        {todayTasks.length===0?(
          <div style={{textAlign:'center',padding:'1.5rem 0.5rem 1rem',color:'var(--text-secondary)',fontSize:'0.78rem',lineHeight:1.4}}>
            {isOver?<span style={{color:'#D97706',fontWeight:600}}>Laat hier los</span>:'Sleep taken hiernaartoe voor jouw dagplanning'}
          </div>
        ):(
          <div style={{display:'flex',flexDirection:'column',gap:'0.4rem'}}>
            {todayTasks.map(t=>{
              const subs=t.subtasks||[]; const subDone=subs.filter(s=>s.completed).length
              const st=statuses.find(s=>s.key===t.status)||statuses[0]
              return (
                <div key={t.id} onClick={()=>onEdit(t)}
                  style={{padding:'0.5rem 0.6rem',borderRadius:'var(--radius-md)',border:'1px solid var(--border)',cursor:'pointer',borderLeft:`3px solid ${t.priority==='high'?'#DC2626':st.color}`,background:'var(--bg-secondary)'}}
                  onMouseEnter={e=>e.currentTarget.style.boxShadow='0 2px 6px rgba(0,0,0,0.07)'} onMouseLeave={e=>e.currentTarget.style.boxShadow=''}>
                  <div style={{fontSize:'0.8rem',fontWeight:500,marginBottom:'0.2rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
                  <div style={{display:'flex',alignItems:'center',gap:'0.35rem'}}>
                    <span style={{fontSize:'0.65rem',color:'var(--text-secondary)'}}>{t.assignee}</span>
                    {subs.length>0&&<span style={{fontSize:'0.65rem',color:subDone===subs.length?'#059669':'var(--text-secondary)'}}>{subDone}/{subs.length}</span>}
                  </div>
                  {subs.length>0&&(<div style={{marginTop:'0.3rem',height:'3px',background:'var(--bg-card)',borderRadius:'99px',overflow:'hidden'}}><div style={{height:'100%',width:`${Math.round(subDone/subs.length*100)}%`,background:subDone===subs.length?'#059669':'#D97706',borderRadius:'99px'}}/></div>)}
                </div>
              )
            })}
            {isOver&&<div style={{textAlign:'center',padding:'0.5rem',borderRadius:'6px',border:'2px dashed #D97706',color:'#D97706',fontSize:'0.75rem',fontWeight:600}}>Hier neerzetten</div>}
          </div>
        )}
      </div>
    </div>
  )
}

function TaskCard({task:t,statuses,onClick,onStatusChange,onSubtaskToggle,onArchive,compact,draggable:isDraggable,onDragStart,onDragEnd}) {
  const days = daysUntil(t.dueDate)
  const overdue = days!==null&&days<0&&t.status!=='klaar'
  const isToday2 = days===0&&t.status!=='klaar'
  const soon = days!==null&&days>0&&days<=3&&t.status!=='klaar'
  const st = statuses.find(s=>s.key===t.status)||statuses[0]
  const subs = t.subtasks||[]; const subDone=subs.filter(s=>s.completed).length
  const subPct = subs.length>0?Math.round(subDone/subs.length*100):null

  if (compact) {
    return (
      <div draggable={isDraggable}
        onDragStart={e=>{if(isDraggable){e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',t.id);onDragStart&&onDragStart()}}}
        onDragEnd={()=>onDragEnd&&onDragEnd()}
        onClick={onClick}
        style={{padding:'0.38rem 0.55rem',borderRadius:'6px',border:'1px solid var(--border)',cursor:'grab',background:'var(--bg-card)',marginBottom:'0.28rem',borderLeft:`3px solid ${t.priority==='high'?'#DC2626':st.color}`,opacity:t.status==='klaar'?0.5:1,userSelect:'none'}}
        onMouseEnter={e=>e.currentTarget.style.boxShadow='0 1px 6px rgba(0,0,0,0.08)'}
        onMouseLeave={e=>e.currentTarget.style.boxShadow=''}>
        <div style={{fontWeight:500,fontSize:'0.79rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textDecoration:t.status==='klaar'?'line-through':'none',lineHeight:1.3}}>{t.title}</div>
        <div style={{display:'flex',alignItems:'center',gap:'0.3rem',marginTop:'0.12rem'}}>
          <span style={{fontSize:'0.62rem',color:'var(--text-secondary)',flexShrink:0}}>{t.assignee}</span>
          {t.priority==='high'&&<span style={{fontSize:'0.55rem',padding:'0.02rem 0.28rem',borderRadius:'99px',background:'#FEE2E2',color:'#DC2626',fontWeight:700}}>!</span>}
          {t.dueDate&&<span style={{fontSize:'0.58rem',fontWeight:600,padding:'0.02rem 0.26rem',borderRadius:'3px',background:overdue?'#FEE2E2':isToday2?'var(--accent-light)':soon?'#FEF3C7':'transparent',color:overdue?'#DC2626':isToday2?'var(--accent)':soon?'#92400E':'var(--text-secondary)',whiteSpace:'nowrap'}}>{overdue?`${Math.abs(days)}d te laat`:isToday2?'Vandaag':soon?`${days}d`:fmt(t.dueDate)}</span>}
          {subPct!==null&&<span style={{fontSize:'0.58rem',color:subPct===100?'#059669':'var(--text-secondary)',marginLeft:'auto',flexShrink:0}}>{subDone}/{subs.length}</span>}
        </div>
        {subPct!==null&&subPct>0&&<div style={{marginTop:'0.2rem',height:'2px',background:'var(--bg-secondary)',borderRadius:'99px',overflow:'hidden'}}><div style={{height:'100%',width:`${subPct}%`,background:subPct===100?'#059669':'var(--accent)',borderRadius:'99px'}}/></div>}
      </div>
    )
  }

  return (
    <div draggable={isDraggable}
      onDragStart={e=>{if(isDraggable){e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',t.id);onDragStart&&onDragStart()}}}
      onDragEnd={()=>onDragEnd&&onDragEnd()}
      onClick={onClick}
      style={{padding:'0.75rem 1rem',borderRadius:'var(--radius-md)',border:'1px solid var(--border)',cursor:isDraggable?'grab':'pointer',background:'var(--bg-card)',borderLeft:`3px solid ${t.priority==='high'?'#DC2626':st.color}`,opacity:t.status==='klaar'?0.6:1,userSelect:'none',transition:'box-shadow 0.1s'}}
      onMouseEnter={e=>e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.06)'} onMouseLeave={e=>e.currentTarget.style.boxShadow=''}>
      <div style={{display:'flex',alignItems:'flex-start',gap:'0.5rem'}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:500,fontSize:'0.875rem',textDecoration:t.status==='klaar'?'line-through':'none'}}>{t.title}</div>
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
        {t.status==='klaar'&&onArchive&&<button onClick={e=>{e.stopPropagation();onArchive()}} style={{background:'none',border:'none',cursor:'pointer',fontSize:'0.68rem',color:'var(--text-secondary)',whiteSpace:'nowrap',paddingTop:'0.1rem'}}>Archiveer</button>}
      </div>
    </div>
  )
}

function KanbanColumn({status,tasks,statuses,onDrop,onCardDragStart,onCardDragEnd,onCardClick,onStatusChange,onSubtaskToggle,onArchive,draggedId}) {
  const [isOver,setIsOver]=useState(false)
  return (
    <div style={{display:'flex',flexDirection:'column'}}>
      <div style={{display:'flex',alignItems:'center',gap:'0.4rem',marginBottom:'0.55rem',padding:'0.4rem 0.6rem',borderRadius:'var(--radius-md)',background:'var(--bg-secondary)'}}>
        <span style={{width:'7px',height:'7px',borderRadius:'50%',background:status.color,flexShrink:0}}/><span style={{fontSize:'0.79rem',fontWeight:600}}>{status.label}</span><span style={{fontSize:'0.7rem',color:'var(--text-secondary)',marginLeft:'auto',fontWeight:500}}>{tasks.length}</span>
      </div>
      <div onDragOver={e=>{e.preventDefault();setIsOver(true)}} onDragLeave={()=>setIsOver(false)}
        onDrop={e=>{e.preventDefault();setIsOver(false);if(draggedId)onDrop(status.key)}}
        style={{flex:1,minHeight:'140px',borderRadius:'var(--radius-md)',padding:'0.3rem',background:isOver?'#EFF6FF':'rgba(0,0,0,0.01)',border:isOver?'2px dashed #2563EB':'2px solid transparent',transition:'all 0.1s'}}>
        {tasks.map(t=>(<TaskCard key={t.id} task={t} statuses={statuses} compact draggable onDragStart={()=>onCardDragStart(t.id)} onDragEnd={onCardDragEnd} onClick={()=>onCardClick(t)} onStatusChange={s=>onStatusChange(t.id,s)} onSubtaskToggle={subId=>onSubtaskToggle(t.id,subId)} onArchive={()=>onArchive(t.id)}/>))}
        {tasks.length===0&&<div style={{textAlign:'center',padding:'1.25rem 0.5rem',color:'var(--text-secondary)',fontSize:'0.73rem'}}>{isOver?<span style={{color:'#2563EB',fontWeight:600}}>Hier neerzetten</span>:'Leeg'}</div>}
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
  const [draggedId,setDraggedId]=useState(null)
  const [form,setForm]=useState({title:'',category:'Overig',assignee:user?.name||'Tein',status:'todo',priority:'normal',notes:'',dueDate:'',plannedDate:'',tags:[],subtasks:[]})
  const [tagInput,setTagInput]=useState('')
  const [subtaskInput,setSubtaskInput]=useState('')
  const subtaskInputRef=useRef(null)
  const [statuses,setStatuses]=useState(()=>{
    const s=localStorage.getItem('artazest_statuses')
    if(s){const parsed=JSON.parse(s);if(!parsed.find(x=>x.key==='gepland')){const m=[parsed[0],{key:'gepland',label:'Gepland',color:'#2563EB'},...parsed.slice(1)];localStorage.setItem('artazest_statuses',JSON.stringify(m));return m};return parsed}
    return DEFAULT_STATUSES
  })
  const [showPhaseEdit,setShowPhaseEdit]=useState(false)
  const [newPhase,setNewPhase]=useState('')

  const saveStatuses=st=>{setStatuses(st);localStorage.setItem('artazest_statuses',JSON.stringify(st))}
  const addPhase=()=>{if(!newPhase.trim())return;const key=newPhase.trim().toLowerCase().replace(/\s+/g,'-');if(statuses.find(s=>s.key===key))return;const used=statuses.map(s=>s.color);const color=COLORS.find(c=>!used.includes(c))||COLORS[0];saveStatuses([...statuses,{key,label:newPhase.trim(),color}]);setNewPhase('')}
  const removePhase=key=>{if(statuses.length<=2)return;saveStatuses(statuses.filter(s=>s.key!==key));tasks.filter(t=>t.status===key).forEach(async t=>{await api.save('tasks',{...t,status:statuses[0].key});reload()})}

  useEffect(()=>{reload()},[])
  const reload=()=>api.getAll('tasks').then(setTasks)
  const handleSave=async()=>{if(!form.title.trim())return;await api.save('tasks',{...form,...(editing?{id:editing}:{}),createdAt:form.createdAt||new Date().toISOString()});resetForm();setShowAdd(false);setEditing(null);reload()}
  const resetForm=()=>setForm({title:'',category:'Overig',assignee:user?.name||'Tein',status:'todo',priority:'normal',notes:'',dueDate:'',plannedDate:'',tags:[],subtasks:[]})
  const del=async id=>{await api.remove('tasks',id);setConfirmDel(null);setEditing(null);setShowAdd(false);reload()}
  const startEdit=t=>{setForm({...t,tags:t.tags||[],subtasks:t.subtasks||[],plannedDate:t.plannedDate||''});setEditing(t.id);setShowAdd(true)}
  const updateStatus=async(id,status)=>{const t=tasks.find(x=>x.id===id);if(t){await api.save('tasks',{...t,status,completed:status==='klaar'});reload()}}
  const archiveTask=async id=>{const t=tasks.find(x=>x.id===id);if(t){await api.save('tasks',{...t,archived:true,archivedAt:new Date().toISOString()});reload()}}
  const assignDay=async(id,date)=>{const t=tasks.find(x=>x.id===id);if(!t)return;const ns=t.status==='todo'?'gepland':t.status;await api.save('tasks',{...t,plannedDate:date,status:ns,completed:ns==='klaar'});setDraggedId(null);reload()}
  const assignToday=async id=>assignDay(id,todayISO())
  const toggleSubtaskOnCard=async(taskId,subId)=>{const t=tasks.find(x=>x.id===taskId);if(!t)return;const upd={...t,subtasks:(t.subtasks||[]).map(s=>s.id===subId?{...s,completed:!s.completed}:s)};if(upd.subtasks.length>0&&upd.subtasks.every(s=>s.completed)){upd.status='klaar';upd.completed=true};await api.save('tasks',upd);reload()}
  const addTag=()=>{if(tagInput.trim()&&!form.tags.includes(tagInput.trim())){setForm({...form,tags:[...form.tags,tagInput.trim()]});setTagInput('')}}
  const removeTag=t=>setForm({...form,tags:form.tags.filter(x=>x!==t)})
  const addSubtask=()=>{if(!subtaskInput.trim())return;setForm({...form,subtasks:[...(form.subtasks||[]),{id:uid(),title:subtaskInput.trim(),completed:false}]});setSubtaskInput('');subtaskInputRef.current?.focus()}
  const toggleSubtask=subId=>setForm({...form,subtasks:form.subtasks.map(s=>s.id===subId?{...s,completed:!s.completed}:s)})
  const removeSubtask=subId=>setForm({...form,subtasks:form.subtasks.filter(s=>s.id!==subId)})

  const active=tasks.filter(t=>!t.archived)
  const filtered=active.filter(t=>filterUser==='all'||t.assignee===filterUser).sort((a,b)=>{const p={high:0,normal:1};if((p[a.priority]||1)!==(p[b.priority]||1))return(p[a.priority]||1)-(p[b.priority]||1);if(a.dueDate&&b.dueDate)return a.dueDate<b.dueDate?-1:1;if(a.dueDate&&!b.dueDate)return -1;if(!a.dueDate&&b.dueDate)return 1;return 0})
  const archived=tasks.filter(t=>t.archived).sort((a,b)=>new Date(b.archivedAt||0)-new Date(a.archivedAt||0))
  const counts={todo:filtered.filter(t=>t.status==='todo').length,gepland:filtered.filter(t=>t.status==='gepland').length,bezig:filtered.filter(t=>t.status==='bezig').length,klaar:filtered.filter(t=>t.status==='klaar').length}
  const views=[{key:'kanban',label:'Kanban'},{key:'lijst',label:'Lijst'},{key:'archief',label:`Archief (${archived.length})`}]

  return (
    <>
      <div className="page-header">
        <div><h1>Taken</h1>
          <p className="page-subtitle">{counts.todo} to do &middot; {counts.gepland} gepland &middot; {counts.bezig} bezig &middot; {counts.klaar} klaar
            {daysToLaunch>0&&<span style={{marginLeft:'0.5rem',padding:'0.15rem 0.5rem',borderRadius:'99px',fontSize:'0.75rem',fontWeight:600,background:daysToLaunch<=7?'var(--danger-light)':daysToLaunch<=14?'var(--accent-light)':'var(--info-light)',color:daysToLaunch<=7?'var(--danger)':daysToLaunch<=14?'var(--accent-text)':'var(--info)'}}>{daysToLaunch}d tot launch</span>}
          </p>
        </div>
        <button className="btn btn-primary" onClick={()=>{resetForm();setEditing(null);setShowAdd(true)}}>+ Nieuwe taak</button>
      </div>

      <Timeline tasks={active} onDropDay={assignDay} draggedId={draggedId}/>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:'0.5rem'}}>
        <div className="tabs" style={{marginBottom:0,borderBottom:'none'}}>{views.map(v=><button key={v.key} className={`tab ${view===v.key?'active':''}`} onClick={()=>setView(v.key)}>{v.label}</button>)}</div>
        <div style={{display:'flex',gap:'0.35rem',alignItems:'center'}}>
          <button className={`btn btn-sm ${filterUser==='all'?'btn-primary':'btn-outline'}`} onClick={()=>setFilterUser('all')}>Alle</button>
          {ASSIGNEES.map(a=><button key={a} className={`btn btn-sm ${filterUser===a?'btn-primary':'btn-outline'}`} onClick={()=>setFilterUser(a)}>{a}</button>)}
          <button className="btn btn-sm btn-outline" onClick={()=>setShowPhaseEdit(!showPhaseEdit)} style={{marginLeft:'0.25rem',fontSize:'0.75rem',color:'var(--text-secondary)'}}>check</button>
        </div>
      </div>

      {showPhaseEdit&&(<div className="card" style={{marginBottom:'1rem',padding:'0.75rem 1rem'}}>
        <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.75rem'}}><span style={{fontSize:'0.8rem',fontWeight:600}}>Fases beheren</span><span style={{fontSize:'0.7rem',color:'var(--text-secondary)'}}>min. 2 fases</span></div>
        <div style={{display:'flex',gap:'0.4rem',flexWrap:'wrap',marginBottom:'0.75rem'}}>{statuses.map(s=>(<div key={s.key} style={{display:'flex',alignItems:'center',gap:'0.3rem',padding:'0.3rem 0.6rem',borderRadius:'99px',border:'1px solid var(--border)',fontSize:'0.8rem'}}><span style={{width:'8px',height:'8px',borderRadius:'50%',background:s.color}}/><span style={{fontWeight:500}}>{s.label}</span>{statuses.length>2&&<button onClick={()=>removePhase(s.key)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',fontSize:'0.7rem',marginLeft:'0.15rem'}}>x</button>}</div>))}</div>
        <div style={{display:'flex',gap:'0.35rem'}}><input className="form-input" value={newPhase} onChange={e=>setNewPhase(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addPhase()} placeholder="Nieuwe fase..." style={{maxWidth:'180px',padding:'0.3rem 0.6rem',fontSize:'0.8rem'}}/><button className="btn btn-sm btn-outline" onClick={addPhase}>+</button></div>
      </div>)}

      <div style={{display:'flex',gap:'1.25rem',alignItems:'flex-start'}}>
        <div style={{flex:1,minWidth:0}}>
          {view==='kanban'?(
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(190px,1fr))',gap:'0.75rem',minWidth:'800px'}}>
              {statuses.map(st=>(<KanbanColumn key={st.key} status={st} statuses={statuses} tasks={filtered.filter(t=>t.status===st.key)} onDrop={ns=>draggedId&&updateStatus(draggedId,ns)} onCardDragStart={id=>setDraggedId(id)} onCardDragEnd={()=>setDraggedId(null)} onCardClick={startEdit} onStatusChange={(id,s)=>updateStatus(id,s)} onSubtaskToggle={(tid,sid)=>toggleSubtaskOnCard(tid,sid)} onArchive={id=>archiveTask(id)} draggedId={draggedId}/>))}
            </div>
          ):view==='archief'?(
            archived.length===0?<div className="card"><div className="empty-state">Geen gearchiveerde taken</div></div>:
            <div className="task-list">{archived.map(t=>(<div key={t.id} className="task-item" style={{opacity:0.6}}><div style={{flex:1}}><div className="task-title" style={{textDecoration:'line-through'}}>{t.title}</div><div className="task-meta">{t.assignee} &middot; {t.archivedAt&&fmt(t.archivedAt)}</div></div><button className="btn btn-sm btn-outline" onClick={async()=>{const x=tasks.find(a=>a.id===t.id);if(x){await api.save('tasks',{...x,archived:false});reload()}}} style={{fontSize:'0.7rem'}}>Terugzetten</button></div>))}</div>
          ):(
            filtered.length===0?<div className="card"><div className="empty-state">Geen taken{filterUser!=='all'?` voor ${filterUser}`:''}</div></div>:
            <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>{filtered.map(t=><TaskCard key={t.id} task={t} statuses={statuses} draggable onDragStart={()=>setDraggedId(t.id)} onDragEnd={()=>setDraggedId(null)} onClick={()=>startEdit(t)} onStatusChange={s=>updateStatus(t.id,s)} onSubtaskToggle={subId=>toggleSubtaskOnCard(t.id,subId)} onArchive={()=>archiveTask(t.id)}/>)}</div>
          )}
        </div>
        <VandaagPanel tasks={active} statuses={statuses} onDropToday={assignToday} onEdit={startEdit} draggedId={draggedId}/>
      </div>

      {confirmDel&&(<div className="modal-overlay" onClick={()=>setConfirmDel(null)}><div className="modal" style={{maxWidth:'380px',textAlign:'center'}} onClick={e=>e.stopPropagation()}><h3 style={{marginBottom:'0.75rem'}}>Taak verwijderen?</h3><div style={{display:'flex',gap:'0.5rem',justifyContent:'center'}}><button className="btn btn-outline" onClick={()=>setConfirmDel(null)}>Annuleren</button><button className="btn btn-primary" style={{background:'var(--danger)'}} onClick={()=>del(confirmDel)}>Verwijderen</button></div></div></div>)}

      {showAdd&&(<div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&(setShowAdd(false),setEditing(null))}>
        <div className="modal" style={{maxWidth:'560px'}}>
          <div className="modal-header"><h3>{editing?'Taak bewerken':'Nieuwe taak'}</h3><button className="modal-close" onClick={()=>{setShowAdd(false);setEditing(null)}}>x</button></div>
          <div className="form-group"><label className="form-label">Titel</label><input className="form-input" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Wat moet er gebeuren?" autoFocus/></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.75rem'}}>
            <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>{statuses.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Toewijzen</label><select className="form-select" value={form.assignee} onChange={e=>setForm({...form,assignee:e.target.value})}>{ASSIGNEES.map(a=><option key={a}>{a}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Prioriteit</label><button className="btn btn-sm" onClick={()=>setForm({...form,priority:form.priority==='high'?'normal':'high'})} style={{width:'100%',justifyContent:'center',fontSize:'0.75rem',background:form.priority==='high'?'var(--danger)':'transparent',color:form.priority==='high'?'#fff':undefined,border:form.priority==='high'?'none':'1px solid var(--border-strong)'}}>Urgent</button></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.75rem'}}>
            <div className="form-group"><label className="form-label">Categorie</label><select className="form-select" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div>
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
    </>
  )
}
