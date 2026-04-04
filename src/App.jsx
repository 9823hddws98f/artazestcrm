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

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    auth.init(); seedData()
    const u = auth.getUser(); if (u) setUser(u)
    setLoading(false)
    auth.onLogin(u => setUser(u)); auth.onLogout(() => setUser(null))
  }, [])
  if (loading) return null
  if (!user) return (
    <div className="login-page">
      <div style={{textAlign:'center'}}><h1>Artazest</h1><p>Co-Pilot — Launch Control</p></div>
      <button className="login-btn" onClick={() => auth.login()}>Inloggen</button>
    </div>
  )
  return (
    <Layout user={user}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tasks" element={<Tasks user={user} />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/content" element={<Content />} />
        <Route path="/artwork" element={<Artwork />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  )
}
