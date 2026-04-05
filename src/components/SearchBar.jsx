import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function SearchBar() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [show, setShow] = useState(false)
  const nav = useNavigate()

  useEffect(() => {
    if (q.length < 2) { setResults([]); return }
    const search = async () => {
      const [tasks, inv, content, art] = await Promise.all([
        api.getAll('tasks'), api.getAll('inventory'), api.getAll('content'), api.getAll('catalog')
      ])
      const lq = q.toLowerCase()
      const r = []
      tasks.filter(t => t.title?.toLowerCase().includes(lq)).slice(0,3).forEach(t => r.push({ type: 'Taak', label: t.title, badge: t.category, path: '/tasks' }))
      inv.filter(i => i.name?.toLowerCase().includes(lq)).slice(0,3).forEach(i => r.push({ type: 'Voorraad', label: i.name, badge: `${i.quantity} stuks`, path: '/inventory' }))
      content.filter(c => c.title?.toLowerCase().includes(lq)).slice(0,3).forEach(c => r.push({ type: 'Content', label: c.title, badge: c.status, path: '/content' }))
      art.filter(a => a.name?.toLowerCase().includes(lq)).slice(0,3).forEach(a => r.push({ type: 'Artwork', label: a.name, badge: a.stage, path: '/catalog' }))
      setResults(r)
    }
    search()
  }, [q])

  return (
    <div style={{position:'relative',marginBottom:'1.5rem'}}>
      <input value={q} onChange={e=>{setQ(e.target.value);setShow(true)}}
        onFocus={()=>setShow(true)} onBlur={()=>setTimeout(()=>setShow(false),200)}
        placeholder="Zoeken in taken, voorraad, content..."
        style={{width:'100%',padding:'0.6rem 1rem 0.6rem 2.5rem',border:'1px solid rgba(28,25,23,0.1)',borderRadius:'99px',fontSize:'0.85rem',fontFamily:'var(--font-body)',background:'#fff',color:'#1C1917'}}/>
      <span style={{position:'absolute',left:'1rem',top:'50%',transform:'translateY(-50%)',color:'#78716C',fontSize:'0.9rem'}}>&#128269;</span>
      {show && results.length > 0 && (
        <div style={{position:'absolute',top:'100%',left:0,right:0,marginTop:'4px',background:'#fff',borderRadius:'12px',border:'1px solid rgba(28,25,23,0.1)',boxShadow:'0 8px 30px rgba(0,0,0,0.1)',zIndex:50,overflow:'hidden'}}>
          {results.map((r,i) => (
            <div key={i} onClick={()=>{nav(r.path);setQ('');setShow(false)}}
              style={{padding:'0.6rem 1rem',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.75rem',borderBottom:i<results.length-1?'1px solid rgba(28,25,23,0.05)':'none',fontSize:'0.85rem'}}
              onMouseEnter={e=>e.currentTarget.style.background='#F2F0EB'} onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
              <span style={{fontSize:'0.7rem',color:'#78716C',minWidth:'55px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>{r.type}</span>
              <span style={{flex:1,fontWeight:500}}>{r.label}</span>
              {r.badge && <span style={{padding:'0.1rem 0.5rem',borderRadius:'99px',fontSize:'0.65rem',fontWeight:600,background:'#F2F0EB',color:'#78716C'}}>{r.badge}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}