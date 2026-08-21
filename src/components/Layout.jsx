import React, { useState, useEffect, useCallback } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { api } from '../api'

const allNavItems = [
  { path: '/', label: 'Dashboard', icon: '◉' },
  { path: '/tasks', label: "To-do's", icon: '☐' },
  { path: '/content', label: 'Content', icon: '🎬' },
  { path: '/production', label: 'Productie', icon: '🏭' },
  { path: '/catalog', label: 'Catalogus', icon: '▣' },
  { path: '/inventory', label: 'Inkoop', icon: '▦' },
  { path: '/stock', label: 'Voorraad', icon: '🎨' },
  { path: '/orders', label: 'Orders', icon: '📦' },
  { path: '/designers', label: 'Designers', icon: '✎' },
  { path: '/analytics', label: 'Analytics', icon: '◐' },
  { path: '/shopify', label: 'Shopify', icon: '🛒' },
  { path: '/maintenance', label: 'Onderhoud', icon: '🔧' },
  { path: '/backup', label: 'Backup', icon: '💾' },
  { path: '/settings', label: 'Instellingen', icon: '⚙' },
]

// Global Search Component
function GlobalSearch({tasks,onClose,onNavigate}) {
  const [q,setQ]=useState('')
  const results = q.trim().length<2?[]:tasks.filter(t=>!t.archived&&(t.title||'').toLowerCase().includes(q.toLowerCase())||(t.category||'').toLowerCase().includes(q.toLowerCase())||(t.notes||'').toLowerCase().includes(q.toLowerCase())).slice(0,10)
  const pages = q.trim().length<2?[]:allNavItems.filter(p=>p.label.toLowerCase().includes(q.toLowerCase()))
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',backdropFilter:'blur(4px)',zIndex:9999,display:'flex',alignItems:'flex-start',justifyContent:'center',paddingTop:'15vh'}} onClick={onClose}>
      <div style={{width:'90%',maxWidth:'520px',background:'var(--bg-card)',borderRadius:'16px',boxShadow:'0 20px 60px rgba(0,0,0,0.2)',overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',alignItems:'center',padding:'0.75rem 1rem',borderBottom:'1px solid var(--border)',gap:'0.5rem'}}>
          <span style={{color:'var(--text-secondary)',fontSize:'1rem'}}>🔍</span>
          <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Zoek taken, pagina's..." style={{flex:1,border:'none',background:'transparent',fontSize:'1rem',outline:'none',fontFamily:'var(--font-body)',color:'var(--text-primary)'}}/>
          <kbd style={{padding:'0.1rem 0.4rem',borderRadius:'4px',background:'var(--bg-secondary)',color:'var(--text-secondary)',fontSize:'0.65rem',border:'1px solid var(--border)'}}>ESC</kbd>
        </div>
        <div style={{maxHeight:'350px',overflowY:'auto',padding:'0.35rem'}}>
          {pages.map(p=>(
            <div key={p.path} onClick={()=>{onNavigate(p.path);onClose()}} style={{display:'flex',alignItems:'center',gap:'0.6rem',padding:'0.5rem 0.75rem',borderRadius:'8px',cursor:'pointer',transition:'background 0.1s'}}
              onMouseEnter={e=>e.currentTarget.style.background='var(--bg-secondary)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <span style={{fontSize:'1rem'}}>{p.icon}</span>
              <span style={{fontSize:'0.85rem',fontWeight:600}}>{p.label}</span>
              <span style={{fontSize:'0.65rem',color:'var(--text-secondary)',marginLeft:'auto'}}>Pagina</span>
            </div>
          ))}
          {results.map(t=>(
            <div key={t.id} onClick={()=>{onNavigate('/tasks');onClose()}} style={{display:'flex',alignItems:'center',gap:'0.6rem',padding:'0.5rem 0.75rem',borderRadius:'8px',cursor:'pointer',transition:'background 0.1s'}}
              onMouseEnter={e=>e.currentTarget.style.background='var(--bg-secondary)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <span style={{width:'8px',height:'8px',borderRadius:'50%',background:t.status==='klaar'?'#059669':t.priority==='high'?'#DC2626':'var(--accent)',flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'0.82rem',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
                <div style={{fontSize:'0.65rem',color:'var(--text-secondary)'}}>{t.assignee} · {t.category} · {t.status}</div>
              </div>
            </div>
          ))}
          {q.trim().length>=2&&results.length===0&&pages.length===0&&<div style={{padding:'1.5rem',textAlign:'center',color:'var(--text-secondary)',fontSize:'0.85rem'}}>Geen resultaten voor "{q}"</div>}
          {q.trim().length<2&&<div style={{padding:'1.5rem',textAlign:'center',color:'var(--text-secondary)',fontSize:'0.82rem'}}>Typ om te zoeken...</div>}
        </div>
      </div>
    </div>
  )
}

export default function Layout({ user, onLogout, children }) {
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [badges, setBadges] = useState({})
  const [showSearch, setShowSearch] = useState(false)
  const [allTasks, setAllTasks] = useState([])
  const [dark, setDark] = useState(()=>localStorage.getItem('artazest_dark')==='true')
  const name = user?.name || 'User'
  const initials = name.slice(0, 2).toUpperCase()
  const role = user?.role || 'team'

  // Dark mode
  useEffect(()=>{document.documentElement.setAttribute('data-theme',dark?'dark':'light');localStorage.setItem('artazest_dark',dark)},[dark])

  // Cmd+K zoek + N nieuwe taak
  useEffect(()=>{
    const handler=e=>{
      if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();setShowSearch(true)}
      if(e.key==='Escape')setShowSearch(false)
      if(e.key==='n'&&!e.metaKey&&!e.ctrlKey&&document.activeElement.tagName!=='INPUT'&&document.activeElement.tagName!=='TEXTAREA'&&document.activeElement.tagName!=='SELECT'){navigate('/tasks')}
    }
    window.addEventListener('keydown',handler)
    return ()=>window.removeEventListener('keydown',handler)
  },[])

  // Laad badge counts
  useEffect(() => {
    const load = async () => {
      try {
        const [tasks, stockTodos, artworkStock, items, orders, maintSchedule, maintBlades, catalogItems, devItems] = await Promise.all([
          api.getAll('tasks'),
          api.getSetting('stock_todos'),
          api.getSetting('artwork_stock'),
          api.getAll('inventory_items'),
          api.getAll('orders'),
          api.getSetting('maintenance_schedule'),
          api.getSetting('blade_log'),
          api.getSetting('catalog_items'),
          api.getSetting('dev_items'),
        ])
        const openTasks = (tasks||[]).filter(t => !t.archived && t.status !== 'klaar').length
        const openStockTodos = (stockTodos||[]).filter(t => !t.done).length
        const totalStock = (artworkStock||[]).reduce((s,a) => s + (a.total||0), 0)
        const needsOrder = (items||[]).filter(i => i.minStock > 0 && i.quantity < i.minStock).length
        const openOrders = (orders||[]).filter(o => o.status && o.status !== 'geleverd' && o.status !== 'afgerond').length
        const totalArtworks = (catalogItems||[]).length
        const overdueM = (maintSchedule||[]).filter(s => !s.archived && s.nextDue && new Date(s.nextDue) < new Date()).length
        const devCount = (devItems||[]).filter(d => d.stage !== 'klaar').length
        setBadges({
          '/tasks': openTasks,
          '/inventory': needsOrder || openStockTodos,
          '/stock': totalStock,
          '/orders': openOrders,
          '/catalog': totalArtworks,
          '/maintenance': overdueM,
          '/development': devCount,
        })
      } catch {}
    }
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [])
  // Tasks for search
  useEffect(()=>{api.getAll('tasks').then(t=>setAllTasks(t||[]))},[])
  const settings = JSON.parse(localStorage.getItem('artazest_settings') || '{}')
  const allPages = allNavItems.map(i => i.path)
  const savedPages = settings.roles?.[name]?.pages
  const userPages = role === 'admin' ? allPages : (savedPages || allPages)
  const navItems = allNavItems.filter(item => userPages.includes(item.path))
  return (
    <div className="app-layout">
      <div className="mobile-header">
        <button onClick={()=>setMobileOpen(!mobileOpen)} style={{background:'none',border:'none',fontSize:'1.5rem',cursor:'pointer',color:'#1C1917'}}>
          {mobileOpen ? '✕' : '☰'}
        </button>
        <span style={{fontFamily:'var(--font-display)',fontSize:'1.2rem',color:'var(--text-primary)'}}>Artazest</span>
        <div style={{display:'flex',gap:'0.5rem',alignItems:'center'}}>
          <button onClick={()=>setShowSearch(true)} style={{background:'none',border:'none',fontSize:'1.1rem',cursor:'pointer'}}>🔍</button>
          <div style={{width:'28px',height:'28px',borderRadius:'50%',background:'#D97706',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.65rem',fontWeight:600,color:'#fff'}}>{initials}</div>
        </div>
      </div>
      <aside className={`sidebar ${mobileOpen?'sidebar-open':''}`}>
        <div className="sidebar-brand"><h2>Artazest</h2><span>Co-Pilot</span></div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <React.Fragment key={item.path}>
            {item.divider&&<div style={{height:1,background:'rgba(255,255,255,0.08)',margin:'0.35rem 1rem'}}/>}
            <NavLink to={item.path} end={item.path==='/'}
              className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={()=>setMobileOpen(false)}>
              <span style={{fontSize:'1.1rem'}}>{item.icon}</span>
              <span style={{flex:1}}>{item.label}</span>
              {badges[item.path]>0&&<span style={{minWidth:'20px',height:'20px',borderRadius:'50%',background:item.path==='/tasks'?'#DC2626':item.path==='/inventory'?'#D97706':item.path==='/maintenance'?'#DC2626':item.path==='/orders'?'#2563EB':item.path==='/catalog'?'#059669':item.path==='/development'?'#7C3AED':'#059669',color:'#fff',fontSize:'0.62rem',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1,padding:'0 4px'}}>{badges[item.path]>999?'999+':badges[item.path]}</span>}
            </NavLink>
            </React.Fragment>
          ))}
        </nav>
        {/* Search + Dark mode */}
        <div style={{padding:'0.5rem 0.75rem',display:'flex',gap:'0.35rem'}}>
          <button onClick={()=>setShowSearch(true)} style={{flex:1,display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.4rem 0.6rem',borderRadius:'6px',border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.05)',cursor:'pointer',color:'var(--text-sidebar-muted)',fontSize:'0.75rem',fontFamily:'var(--font-body)'}}>
            🔍 <span style={{flex:1,textAlign:'left'}}>Zoeken...</span><kbd style={{fontSize:'0.55rem',padding:'0.05rem 0.25rem',borderRadius:'3px',border:'1px solid rgba(255,255,255,0.15)',background:'rgba(255,255,255,0.05)'}}>⌘K</kbd>
          </button>
          <button onClick={()=>setDark(!dark)} style={{width:'32px',height:'32px',borderRadius:'6px',border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.05)',cursor:'pointer',fontSize:'0.85rem',display:'flex',alignItems:'center',justifyContent:'center'}} title={dark?'Licht':'Donker'}>
            {dark?'☀️':'🌙'}
          </button>
        </div>
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div><div className="sidebar-user-info">{name}</div><div className="sidebar-user-role">{role}</div></div>
        </div>
        <div style={{padding:'0 1.25rem',marginTop:'0.5rem'}}>
          <button onClick={onLogout} style={{background:'none',border:'none',color:'var(--text-sidebar-muted)',fontSize:'0.75rem',cursor:'pointer',fontFamily:'var(--font-body)'}}>Uitloggen</button>
        </div>
      </aside>
      {mobileOpen && <div className="sidebar-overlay" onClick={()=>setMobileOpen(false)}/>}
      <main className="main-content">
        {children}
      </main>
      {showSearch&&<GlobalSearch tasks={allTasks} onClose={()=>setShowSearch(false)} onNavigate={path=>navigate(path)}/>}
    </div>
  )
}