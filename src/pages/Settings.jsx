import { useState, useEffect } from 'react'
import { auth } from '../auth'

const ALL_PAGES = [
  { path: '/', label: 'Dashboard', icon: '◉' },
  { path: '/tasks', label: 'Taken', icon: '☐' },
  { path: '/inventory', label: 'Voorraad', icon: '▦' },
  { path: '/content', label: 'Content', icon: '▶' },
  { path: '/catalog', label: 'Catalogus', icon: '▣' },
  { path: '/analytics', label: 'Analytics', icon: '◐' },
  { path: '/settings', label: 'Instellingen', icon: '⚙' },
]
const USERS = ['Tein', 'Sam', 'Productie']

export default function Settings({ user }) {
  const [settings, setSettings] = useState(null)
  const [saved, setSaved] = useState(false)
  const [pwForms, setPwForms] = useState({
    Tein: { next: '', confirm: '' },
    Sam: { next: '', confirm: '' },
    Productie: { next: '', confirm: '' }
  })
  const [pwMsgs, setPwMsgs] = useState({})

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
  const isAdmin = user?.role === 'admin'
  if (!isAdmin) return (
    <div style={{padding:'3rem',textAlign:'center',color:'var(--text-secondary)'}}>
      Alleen admins kunnen instellingen wijzigen.
    </div>
  )

  const togglePage = (userName, path) => {
    const updated = { ...settings }
    const pages = updated.roles[userName]?.pages || []
    updated.roles[userName].pages = pages.includes(path)
      ? pages.filter(p => p !== path)
      : [...pages, path]
    setSettings(updated); setSaved(false)
  }

  const handleSave = () => {
    localStorage.setItem('artazest_settings', JSON.stringify(settings))
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const handlePwChange = (name) => {
    const f = pwForms[name]
    if (!f.next || f.next.length < 3) {
      setPwMsgs({ ...pwMsgs, [name]: { ok: false, text: 'Min. 3 tekens' } }); return
    }
    if (f.next !== f.confirm) {
      setPwMsgs({ ...pwMsgs, [name]: { ok: false, text: 'Wachtwoorden komen niet overeen' } }); return
    }
    auth.changePassword(name, f.next)
    setPwMsgs({ ...pwMsgs, [name]: { ok: true, text: 'Opgeslagen ✓' } })
    setPwForms({ ...pwForms, [name]: { next: '', confirm: '' } })
    setTimeout(() => setPwMsgs(m => ({ ...m, [name]: null })), 3000)
  }

  return (
    <>
      <div className="page-header">
        <div><h1>Instellingen</h1><p className="page-subtitle">Toegang en wachtwoorden beheren</p></div>
        <button className="btn btn-primary" onClick={handleSave}>{saved ? 'Opgeslagen ✓' : 'Opslaan'}</button>
      </div>

      {/* Pagina toegang */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="section-title" style={{ marginBottom: '1rem' }}>Pagina toegang per gebruiker</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border)', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.72rem' }}>Pagina</th>
                {USERS.map(u => (
                  <th key={u} style={{ textAlign: 'center', padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{u}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_PAGES.map(page => (
                <tr key={page.path} style={{ borderBottom: '1px solid rgba(28,25,23,0.04)' }}>
                  <td style={{ padding: '0.5rem 0.75rem' }}>
                    <span style={{ marginRight: '0.4rem' }}>{page.icon}</span>{page.label}
                  </td>
                  {USERS.map(u => {
                    const has = settings.roles[u]?.pages?.includes(page.path)
                    return (
                      <td key={u} style={{ textAlign: 'center', padding: '0.5rem' }}>
                        <button onClick={() => togglePage(u, page.path)}
                          style={{ width: '22px', height: '22px', borderRadius: '50%', border: has ? 'none' : '2px solid var(--border-strong)', background: has ? '#059669' : 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#fff', transition: 'all 0.15s' }}>
                          {has && '✓'}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={handleSave}>{saved ? 'Opgeslagen ✓' : 'Wijzigingen opslaan'}</button>
        </div>
      </div>

      {/* Wachtwoorden per gebruiker */}
      <div className="card">
        <h3 className="section-title" style={{ marginBottom: '0.25rem' }}>Wachtwoorden</h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Elke gebruiker heeft een eigen wachtwoord. Standaard is alles "2026".
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {USERS.map(name => {
            const f = pwForms[name]
            const msg = pwMsgs[name]
            return (
              <div key={name} style={{ padding: '1rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: name === 'Tein' ? 'var(--accent)' : '#78716C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem', fontWeight: 700 }}>
                    {name.slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{name}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{name === 'Tein' ? 'Admin' : 'Team'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <div>
                    <label style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.2rem' }}>Nieuw wachtwoord</label>
                    <input type="password" value={f.next}
                      onChange={e => setPwForms({ ...pwForms, [name]: { ...f, next: e.target.value } })}
                      placeholder="••••••" className="form-input"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.55rem', letterSpacing: '0.15em' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.2rem' }}>Bevestig</label>
                    <input type="password" value={f.confirm}
                      onChange={e => setPwForms({ ...pwForms, [name]: { ...f, confirm: e.target.value } })}
                      onKeyDown={e => e.key === 'Enter' && handlePwChange(name)}
                      placeholder="••••••" className="form-input"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.55rem', letterSpacing: '0.15em' }} />
                  </div>
                  {msg && (
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: msg.ok ? '#059669' : '#DC2626', padding: '0.25rem 0.4rem', borderRadius: '5px', background: msg.ok ? '#F0FDF4' : '#FEF2F2' }}>
                      {msg.text}
                    </div>
                  )}
                  <button onClick={() => handlePwChange(name)} className="btn btn-sm btn-outline" style={{ marginTop: '0.1rem', fontSize: '0.73rem' }}>
                    Opslaan
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
