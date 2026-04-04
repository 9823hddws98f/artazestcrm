import { NavLink } from 'react-router-dom'
import { auth } from '../auth'

const nav = [
  { path: '/', label: 'Dashboard', icon: '◉' },
  { path: '/tasks', label: 'Taken', icon: '☐' },
  { path: '/inventory', label: 'Voorraad', icon: '▦' },
  { path: '/content', label: 'Content', icon: '▶' },
  { path: '/artwork', label: 'Artworks', icon: '◈' },
]

export default function Layout({ user, children }) {
  const name = user?.user_metadata?.full_name || user?.email || 'User'
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand"><h2>Artazest</h2><span>Co-Pilot</span></div>
        <nav className="sidebar-nav">
          {nav.map(i => (
            <NavLink key={i.path} to={i.path} end={i.path==='/'} className={({isActive})=>`sidebar-link ${isActive?'active':''}`}>
              <span style={{fontSize:'1.1rem'}}>{i.icon}</span><span>{i.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div><div className="sidebar-user-info">{name}</div><div className="sidebar-user-role">{user?.role||'team'}</div></div>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  )
}
