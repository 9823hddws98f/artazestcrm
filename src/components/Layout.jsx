import { NavLink } from 'react-router-dom'

const allNavItems = [
  { path: '/', label: 'Dashboard', icon: '◉' },
  { path: '/tasks', label: 'Taken', icon: '☐' },
  { path: '/inventory', label: 'Voorraad', icon: '▦' },
  { path: '/content', label: 'Content', icon: '▶' },
  { path: '/artwork', label: 'Artworks', icon: '◈' },
  { path: '/settings', label: 'Instellingen', icon: '⚙' },
]

export default function Layout({ user, onLogout, children }) {
  const name = user?.name || 'User'
  const initials = name.slice(0, 2).toUpperCase()
  const role = user?.role || 'team'

  // Get allowed pages from settings
  const settings = JSON.parse(localStorage.getItem('artazest_settings') || '{}')
  const userPages = settings.roles?.[name]?.pages || ['/', '/tasks']
  const navItems = allNavItems.filter(item => userPages.includes(item.path))

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>Artazest</h2>
          <span>Co-Pilot</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path} end={item.path==='/'}
              className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <span style={{fontSize:'1.1rem'}}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div>
            <div className="sidebar-user-info">{name}</div>
            <div className="sidebar-user-role">{role}</div>
          </div>
        </div>
        <div style={{padding:'0 1.25rem',marginTop:'0.5rem'}}>
          <button onClick={onLogout} style={{
            background:'none',border:'none',color:'var(--text-sidebar-muted)',
            fontSize:'0.75rem',cursor:'pointer',fontFamily:'var(--font-body)',
          }}>Uitloggen</button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  )
}
