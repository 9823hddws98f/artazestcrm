import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import SearchBar from './SearchBar'

const allNavItems = [
  { path: '/', label: 'Dashboard', icon: '\u25C9' },
  { path: '/tasks', label: 'Taken', icon: '\u2610' },
  { path: '/inventory', label: 'Voorraad', icon: '\u25A6' },
  { path: '/content', label: 'Content', icon: '\u25B6' },
  { path: '/artwork', label: 'Artworks', icon: '\u25C8' },
  { path: '/settings', label: 'Instellingen', icon: '\u2699' },
]

export default function Layout({ user, onLogout, children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const name = user?.name || 'User'
  const initials = name.slice(0, 2).toUpperCase()
  const role = user?.role || 'team'
  const settings = JSON.parse(localStorage.getItem('artazest_settings') || '{}')
  const userPages = settings.roles?.[name]?.pages || ['/', '/tasks']
  const navItems = allNavItems.filter(item => userPages.includes(item.path))
  return (
    <div className="app-layout">
      {/* Mobile header */}
      <div className="mobile-header">
        <button onClick={()=>setMobileOpen(!mobileOpen)} style={{background:'none',border:'none',fontSize:'1.5rem',cursor:'pointer',color:'#1C1917'}}>
          {mobileOpen ? '\u2715' : '\u2630'}
        </button>
        <span style={{fontFamily:'var(--font-display)',fontSize:'1.2rem'}}>Artazest</span>
        <div style={{width:'28px',height:'28px',borderRadius:'50%',background:'#D97706',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.65rem',fontWeight:600,color:'#fff'}}>{initials}</div>
      </div>
      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen?'sidebar-open':''}`}>
        <div className="sidebar-brand"><h2>Artazest</h2><span>Co-Pilot</span></div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path} end={item.path==='/'}
              className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={()=>setMobileOpen(false)}>
              <span style={{fontSize:'1.1rem'}}>{item.icon}</span>
              <span>{item.label}</span>
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
        <SearchBar />
        {children}
      </main>
    </div>
  )
}