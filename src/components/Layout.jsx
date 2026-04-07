import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { api } from '../api'

const allNavItems = [
  { path: '/', label: 'Dashboard', icon: '◉' },
  { path: '/tasks', label: "To-do's", icon: '☐' },
  { path: '/inventory', label: 'Inkoop', icon: '▦' },
  { path: '/stock', label: 'Voorraad', icon: '🎨' },
  { path: '/orders', label: 'Orders', icon: '📦' },
  { path: '/launch', label: 'Launch', icon: '🚀' },
  { path: '/health', label: 'Health', icon: '🩺' },
  { path: '/content', label: 'Content', icon: '▶' },
  { path: '/catalog', label: 'Catalogus', icon: '▣' },
  { path: '/development', label: 'In Ontwikkeling', icon: '🧪' },
  { path: '/analytics', label: 'Analytics', icon: '◐' },
  { path: '/maintenance', label: 'Onderhoud', icon: '🔧' },
  { path: '/settings', label: 'Instellingen', icon: '⚙' },
]

export default function Layout({ user, onLogout, children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [badges, setBadges] = useState({})
  const name = user?.name || 'User'
  const initials = name.slice(0, 2).toUpperCase()
  const role = user?.role || 'team'

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
  const settings = JSON.parse(localStorage.getItem('artazest_settings') || '{}')
  const allPages = allNavItems.map(i => i.path)
  const savedPages = settings.roles?.[name]?.pages
  const userPages = role === 'admin' ? allPages : (savedPages || ['/', '/tasks'])
  const navItems = allNavItems.filter(item => userPages.includes(item.path))
  return (
    <div className="app-layout">
      <div className="mobile-header">
        <button onClick={()=>setMobileOpen(!mobileOpen)} style={{background:'none',border:'none',fontSize:'1.5rem',cursor:'pointer',color:'#1C1917'}}>
          {mobileOpen ? '✕' : '☰'}
        </button>
        <span style={{fontFamily:'var(--font-display)',fontSize:'1.2rem'}}>Artazest</span>
        <div style={{width:'28px',height:'28px',borderRadius:'50%',background:'#D97706',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.65rem',fontWeight:600,color:'#fff'}}>{initials}</div>
      </div>
      <aside className={`sidebar ${mobileOpen?'sidebar-open':''}`}>
        <div className="sidebar-brand"><h2>Artazest</h2><span>Co-Pilot</span></div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path} end={item.path==='/'}
              className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={()=>setMobileOpen(false)}>
              <span style={{fontSize:'1.1rem'}}>{item.icon}</span>
              <span style={{flex:1}}>{item.label}</span>
              {badges[item.path]>0&&<span style={{minWidth:'20px',height:'20px',borderRadius:'50%',background:item.path==='/tasks'?'#DC2626':item.path==='/inventory'?'#D97706':item.path==='/maintenance'?'#DC2626':item.path==='/orders'?'#2563EB':item.path==='/catalog'?'#059669':item.path==='/development'?'#7C3AED':'#059669',color:'#fff',fontSize:'0.62rem',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1,padding:'0 4px'}}>{badges[item.path]>999?'999+':badges[item.path]}</span>}
            </NavLink>
          ))}
        </nav>
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
    </div>
  )
}