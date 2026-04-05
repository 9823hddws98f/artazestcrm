import { useState, useEffect } from 'react'

const ALL_PAGES = [
  { path: '/', label: 'Dashboard', icon: '◉' },
  { path: '/tasks', label: 'Taken', icon: '☐' },
  { path: '/inventory', label: 'Voorraad', icon: '▦' },
  { path: '/content', label: 'Content', icon: '▶' },
  { path: '/catalog', label: 'Catalogus', icon: '▣' },
  { path: '/settings', label: 'Instellingen', icon: '⚙' },
]

const USERS = ['Tein', 'Sam', 'Productie']

export default function Settings({ user }) {
  const [settings, setSettings] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const data = localStorage.getItem('artazest_settings')
    if (data) setSettings(JSON.parse(data))
    else setSettings({
      roles: {
        Tein: { role: 'admin', pages: ALL_PAGES.map(p => p.path) },
        Sam: { role: 'team', pages: ['/', '/tasks', '/content', '/catalog'] },
        Productie: { role: 'team', pages: ['/', '/tasks', '/inventory'] },
      }
    })
  }, [])
  if (!settings) return null

  const togglePage = (userName, path) => {
    const updated = { ...settings }
    const userPages = updated.roles[userName]?.pages || []
    if (userPages.includes(path)) {
      updated.roles[userName].pages = userPages.filter(p => p !== path)
    } else {
      updated.roles[userName].pages = [...userPages, path]
    }
    setSettings(updated)
    setSaved(false)
  }

  const handleSave = () => {
    localStorage.setItem('artazest_settings', JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const isAdmin = user?.role === 'admin'
  if (!isAdmin) return (
    <div style={{padding:'3rem',textAlign:'center',color:'var(--text-secondary)'}}>
      Alleen admins kunnen instellingen wijzigen.
    </div>
  )

  return (
    <>
      <div className="page-header">
        <div><h1>Instellingen</h1><p className="page-subtitle">Beheer wie wat kan zien</p></div>
        <button className="btn btn-primary" onClick={handleSave}>
          {saved ? '✓ Opgeslagen' : 'Opslaan'}
        </button>
      </div>

      <div className="card">
        <h3 style={{marginBottom:'1rem'}}>Navigatie per gebruiker</h3>
        <p style={{fontSize:'0.8rem',color:'var(--text-secondary)',marginBottom:'1.5rem'}}>Bepaal welke pagina's zichtbaar zijn voor elk teamlid. Dashboard is altijd zichtbaar.</p>

        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.85rem'}}>
            <thead>
              <tr style={{borderBottom:'1px solid var(--border-strong)'}}>
                <th style={{textAlign:'left',padding:'0.6rem 1rem',fontSize:'0.7rem',textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-secondary)',fontWeight:600}}>Pagina</th>
                {USERS.map(u => (
                  <th key={u} style={{textAlign:'center',padding:'0.6rem 1rem',fontSize:'0.7rem',textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-secondary)',fontWeight:600}}>
                    {u}
                    <div style={{fontSize:'0.65rem',fontWeight:400,color:'var(--text-secondary)',marginTop:'2px'}}>{settings.roles[u]?.role || 'team'}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_PAGES.map(page => (
                <tr key={page.path} style={{borderBottom:'1px solid var(--border)'}}>
                  <td style={{padding:'0.6rem 1rem',fontWeight:500}}>
                    <span style={{marginRight:'0.5rem'}}>{page.icon}</span>{page.label}
                  </td>
                  {USERS.map(u => {
                    const has = settings.roles[u]?.pages?.includes(page.path)
                    const isDashboard = page.path === '/'
                    return (
                      <td key={u} style={{textAlign:'center',padding:'0.6rem 1rem'}}>
                        <button
                          onClick={() => !isDashboard && togglePage(u, page.path)}
                          style={{
                            width:'32px', height:'32px', borderRadius:'50%',
                            border: has ? 'none' : '2px solid var(--border-strong)',
                            background: has ? 'var(--success)' : 'transparent',
                            color: has ? '#fff' : 'var(--text-secondary)',
                            cursor: isDashboard ? 'default' : 'pointer',
                            fontSize:'0.8rem', fontWeight:700,
                            opacity: isDashboard ? 0.5 : 1,
                            transition: 'all 0.15s',
                          }}>
                          {has ? '✓' : ''}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{marginTop:'1.5rem'}}>
        <h3 style={{marginBottom:'0.75rem'}}>Team</h3>
        <div style={{display:'flex',gap:'1rem',flexWrap:'wrap'}}>
          {USERS.map(u => (
            <div key={u} style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.75rem 1rem',background:'var(--bg-secondary)',borderRadius:'var(--radius-md)',minWidth:'150px'}}>
              <div style={{width:'36px',height:'36px',borderRadius:'50%',background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.75rem',fontWeight:600,color:'#fff'}}>{u.slice(0,2).toUpperCase()}</div>
              <div>
                <div style={{fontWeight:500,fontSize:'0.9rem'}}>{u}</div>
                <div style={{fontSize:'0.72rem',color:'var(--text-secondary)'}}>{settings.roles[u]?.role || 'team'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
