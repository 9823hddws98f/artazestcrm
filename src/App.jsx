import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { auth } from './auth'
import { seedData } from './seed'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Inventory from './pages/Inventory'
import Content from './pages/Content'
import Artwork from './pages/Artwork'
import Analytics from './pages/Analytics'
import Catalog from './pages/Catalog'
import Settings from './pages/Settings'

export default function App() {
  const [user, setUser] = useState(null)
  const [loginName, setLoginName] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    seedData()
    const u = auth.getUser()
    if (u) setUser(u)
  }, [])
  const handleLogin = () => {
    const u = auth.login(loginName, pin)
    if (u) { setUser(u); setError('') }
    else setError('Onjuiste PIN of naam')
  }
  const handleLogout = () => { auth.logout(); setUser(null) }

  if (!user) {
    return (
      <div className="login-page">
        <div style={{textAlign:'center'}}>
          <h1>Artazest</h1>
          <p>Co-Pilot — Launch Control</p>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'0.75rem',width:'240px'}}>
          <select className="form-select" value={loginName} onChange={e=>setLoginName(e.target.value)}
            style={{background:'rgba(255,255,255,0.1)',color:'#fff',border:'1px solid rgba(255,255,255,0.2)'}}>
            <option value="">Kies je naam...</option>
            {auth.getUsers().map(u=><option key={u.name} value={u.name}>{u.name}</option>)}
          </select>
          <input type="password" placeholder="PIN" value={pin} onChange={e=>setPin(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&handleLogin()}
            style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.1)',color:'#fff',fontSize:'1rem',textAlign:'center',letterSpacing:'0.3em'}}/>
          {error&&<div style={{color:'#f87171',fontSize:'0.8rem',textAlign:'center'}}>{error}</div>}
          <button className="login-btn" onClick={handleLogin}>Inloggen</button>
        </div>
      </div>
    )
  }
  return (
    <Layout user={user} onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Dashboard user={user} />} />
        <Route path="/tasks" element={<Tasks user={user} />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/content" element={<Content />} />
        <Route path="/artwork" element={<Artwork />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/settings" element={<Settings user={user} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  )
}