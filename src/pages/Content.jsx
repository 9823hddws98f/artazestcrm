import { useState, useEffect } from 'react'
import { api } from '../api'
const TYPES = ['Instagram post','Instagram reel','Blog artikel','Product foto','Video','Email','Overig']
const STATUSES = ['idee','concept','productie','review','klaar','live']
const SC = {idee:'badge-blue',concept:'badge-amber',productie:'badge-amber',review:'badge-red',klaar:'badge-green',live:'badge-green'}
export default function Content() {
  const [items, setItems] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [view, setView] = useState('pipeline')
  const [form, setForm] = useState({title:'',type:'Instagram post',status:'idee',assignee:'Tein',plannedDate:'',notes:''})
  useEffect(() => { api.getAll('content').then(setItems) }, [])
  const reload = () => api.getAll('content').then(setItems)
  const handleSave = async()=>{if(!form.title.trim())return;await api.save('content',{...form,createdAt:new Date().toISOString()});setForm({title:'',type:'Instagram post',status:'idee',assignee:'Tein',plannedDate:'',notes:''});setShowAdd(false);reload()}
  const updateStatus = async(item,s)=>{await api.save('content',{...item,status:s});reload()}
  const del = async(id)=>{await api.remove('content',id);reload()}
  return (
    <>
      <div className="page-header">
        <div><h1>Content Hub</h1><p className="page-subtitle">{items.length} items · {items.filter(i=>i.status==='live').length} live</p></div>
        <button className="btn btn-primary" onClick={()=>setShowAdd(true)}>+ Content toevoegen</button>
      </div>
      <div className="tabs">
        <button className={`tab ${view==='pipeline'?'active':''}`} onClick={()=>setView('pipeline')}>Pipeline</button>
        <button className={`tab ${view==='list'?'active':''}`} onClick={()=>setView('list')}>Lijst</button>
      </div>
      {view==='pipeline'?
      <div style={{display:'grid',gridTemplateColumns:`repeat(${STATUSES.length},minmax(140px,1fr))`,gap:'0.75rem',overflowX:'auto'}}>
        {STATUSES.map(s=>(
          <div key={s}>
            <div style={{fontSize:'0.75rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-secondary)',marginBottom:'0.75rem',display:'flex',justifyContent:'space-between'}}><span>{s}</span><span>{items.filter(i=>i.status===s).length}</span></div>
            <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
              {items.filter(i=>i.status===s).map(item=>(
                <div key={item.id} className="card" style={{padding:'0.75rem 1rem'}}>
                  <div style={{fontSize:'0.85rem',fontWeight:500,marginBottom:'0.35rem'}}>{item.title}</div>
                  <div style={{display:'flex',gap:'0.35rem',flexWrap:'wrap',alignItems:'center'}}>
                    <span className={`badge ${SC[s]}`}>{item.type}</span>
                    <span style={{fontSize:'0.7rem',color:'var(--text-secondary)'}}>{item.assignee}</span>
                  </div>
                  {item.plannedDate&&<div style={{fontSize:'0.7rem',color:'var(--text-secondary)',marginTop:'0.35rem'}}>📅 {item.plannedDate}</div>}
                  <div style={{display:'flex',gap:'0.25rem',marginTop:'0.5rem',flexWrap:'wrap'}}>
                    {STATUSES.filter(x=>x!==s).slice(0,2).map(x=>(
                      <button key={x} onClick={()=>updateStatus(item,x)} className="btn btn-sm btn-outline" style={{fontSize:'0.65rem',padding:'0.15rem 0.4rem'}}>→ {x}</button>))}
                    <button onClick={()=>del(item.id)} className="btn btn-sm" style={{fontSize:'0.65rem',padding:'0.15rem 0.4rem',color:'var(--text-secondary)'}}>✕</button>
                  </div>
                </div>))}
            </div>
          </div>))}
      </div>
      :<div className="card" style={{overflow:'auto'}}>
        <table className="data-table"><thead><tr><th>Titel</th><th>Type</th><th>Status</th><th>Wie</th><th>Datum</th><th></th></tr></thead>
        <tbody>{items.length===0?<tr><td colSpan="6" style={{textAlign:'center',padding:'2rem',color:'var(--text-secondary)'}}>Geen content</td></tr>:
          items.map(item=><tr key={item.id}>
            <td style={{fontWeight:500}}>{item.title}</td>
            <td><span className="badge badge-blue">{item.type}</span></td>
            <td><span className={`badge ${SC[item.status]}`}>{item.status}</span></td>
            <td style={{fontSize:'0.8rem'}}>{item.assignee}</td>
            <td style={{fontSize:'0.8rem',color:'var(--text-secondary)'}}>{item.plannedDate||'—'}</td>
            <td><button onClick={()=>del(item.id)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)'}}>✕</button></td>
          </tr>)}</tbody></table>
      </div>}
              {items.filter(i=>i.status===s).map(item=>(
                <div key={item.id} className="card" style={{padding:'0.75rem 1rem'}}>
                  <div style={{fontSize:'0.85rem',fontWeight:500,marginBottom:'0.35rem'}}>{item.title}</div>
                  <div style={{display:'flex',gap:'0.35rem',flexWrap:'wrap',alignItems:'center'}}>
                    <span className={`badge ${SC[s]}`}>{item.type}</span>
                    <span style={{fontSize:'0.7rem',color:'var(--text-secondary)'}}>{item.assignee}</span>
                  </div>
                  {item.plannedDate&&<div style={{fontSize:'0.7rem',color:'var(--text-secondary)',marginTop:'0.35rem'}}>📅 {item.plannedDate}</div>}
                  <div style={{display:'flex',gap:'0.25rem',marginTop:'0.5rem',flexWrap:'wrap'}}>
                    {STATUSES.filter(x=>x!==s).slice(0,2).map(x=>(
                      <button key={x} onClick={()=>updateStatus(item,x)} className="btn btn-sm btn-outline" style={{fontSize:'0.65rem',padding:'0.15rem 0.4rem'}}>→ {x}</button>))}
                    <button onClick={()=>del(item.id)} className="btn btn-sm" style={{fontSize:'0.65rem',padding:'0.15rem 0.4rem',color:'var(--text-secondary)'}}>✕</button>
                  </div>
                </div>))}
            </div></div>))}
      </div>:
      <div className="card" style={{overflow:'auto'}}>
        <table className="data-table"><thead><tr><th>Titel</th><th>Type</th><th>Status</th><th>Wie</th><th>Datum</th><th></th></tr></thead>
        <tbody>{items.length===0?<tr><td colSpan="6" style={{textAlign:'center',padding:'2rem',color:'var(--text-secondary)'}}>Nog geen content</td></tr>:
          items.map(item=>(<tr key={item.id}>
            <td style={{fontWeight:500}}>{item.title}</td>
            <td><span className="badge badge-blue">{item.type}</span></td>
            <td><span className={`badge ${SC[item.status]}`}>{item.status}</span></td>
            <td style={{fontSize:'0.8rem'}}>{item.assignee}</td>
            <td style={{fontSize:'0.8rem',color:'var(--text-secondary)'}}>{item.plannedDate||'—'}</td>
            <td><button onClick={()=>del(item.id)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)'}}>✕</button></td>
          </tr>))}</tbody></table>
      </div>}
      {showAdd&&<div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
        <div className="modal">
          <div className="modal-header"><h3>Content toevoegen</h3><button className="modal-close" onClick={()=>setShowAdd(false)}>✕</button></div>
          <div className="form-group"><label className="form-label">Titel</label>
            <input className="form-input" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="bijv. Product launch reel" autoFocus/></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
            <div className="form-group"><label className="form-label">Type</label>
              <select className="form-select" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Toewijzen aan</label>
              <select className="form-select" value={form.assignee} onChange={e=>setForm({...form,assignee:e.target.value})}>{['Tein','Sam','Productie'].map(a=><option key={a}>{a}</option>)}</select></div>
          </div>
          <div className="form-group"><label className="form-label">Geplande datum</label>
            <input className="form-input" type="date" value={form.plannedDate} onChange={e=>setForm({...form,plannedDate:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Notities</label>
            <textarea className="form-textarea" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Briefing, ideeën..."/></div>
          <div style={{display:'flex',gap:'0.5rem',justifyContent:'flex-end'}}>
            <button className="btn btn-outline" onClick={()=>setShowAdd(false)}>Annuleren</button>
            <button className="btn btn-primary" onClick={handleSave}>Opslaan</button>
          </div>
        </div>
      </div>}
    </>)
}
