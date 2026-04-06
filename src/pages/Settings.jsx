import { useState, useEffect } from 'react'

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
  const [pinForm, setPinForm] = useState({ current: '', next: '', confirm: '' })
  const [pinMsg, setPinMsg] = useState(null)

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
  if (!isAdmin) return <div style={{padding:'3rem',textAlign:'center',color:'var(--text-secondary)'}}>Alleen admins kunnen instellingen wijzigen.</div>

  const togglePage = (userName, path) => {
    const updated = { ...settings }
    const pages = updated.roles[userName]?.pages || []
    updated.roles[userName].pages = pages.includes(path) ? pages.filter(p => p !== path) : [...pages, path]
    setSettings(updated); setSaved(false)
  }

  const handleSave = () => {
    localStorage.setItem('artazest_settings', JSON.stringify(settings))
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const handlePinChange = () => {
    const storedPin = localStorage.getItem('artazest_pin') || '2026'
    if (pinForm.current !== storedPin) { setPinMsg({ ok: false, text: 'Huidige PIN klopt niet' }); return }
    if (pinForm.next.length < 3) { setPinMsg({ ok: false, text: 'PIN moet minimaal 3 tekens zijn' }); return }
    if (pinForm.next !== pinForm.confirm) { setPinMsg({ ok: false, text: 'PINs komen niet overeen' }); return }
    localStorage.setItem('artazest_pin', pinForm.next)
    setPinMsg({ ok: true, text: 'PIN gewijzigd ✓' })
    setPinForm({ current: '', next: '', confirm: '' })
    setTimeout(() => setPinMsg(null), 3000)
  }

  return (
    <>
      <div className="page-header">
        <div><h1>Instellingen</h1><p className="page-subtitle">Toegang en beveiliging beheren</p></div>
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
                {USERS.map(u => <th key={u} style={{ textAlign: 'center', padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{u}</th>)}
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

      {/* PIN wijzigen */}
      <div className="card" style={{ maxWidth: '400px' }}>
        <h3 className="section-title" style={{ marginBottom: '1rem' }}>Team PIN wijzigen</h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Één gedeelde PIN voor alle teamleden (Tein, Sam, Productie).</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {[
            ['current', 'Huidige PIN'],
            ['next', 'Nieuwe PIN'],
            ['confirm', 'Bevestig nieuwe PIN'],
          ].map(([key, label]) => (
            <div key={key} className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{label}</label>
              <input type="password" className="form-input" value={pinForm[key]}
                onChange={e => setPinForm({ ...pinForm, [key]: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handlePinChange()}
                placeholder="••••"
                style={{ letterSpacing: '0.25em', maxWidth: '160px' }} />
            </div>
          ))}
          {pinMsg && (
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: pinMsg.ok ? '#059669' : '#DC2626', padding: '0.35rem 0.5rem', borderRadius: '6px', background: pinMsg.ok ? '#F0FDF4' : '#FEF2F2' }}>
              {pinMsg.text}
            </div>
          )}
          <button className="btn btn-primary" onClick={handlePinChange} style={{ alignSelf: 'flex-start' }}>PIN wijzigen</button>
        </div>
      </div>
    </>
  )
}
