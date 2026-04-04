import { useState, useEffect } from 'react'
import { api } from '../api'
const STAGES = ['design','print','foto','shopify','live']
const SL = {design:'Design',print:'Print',foto:'Fotografie',shopify:'Shopify',live:'Live'}
const COLORS = ['Oak','Walnut','Black','White','Forest']
export default function Artwork() {
  const [artworks, setArtworks] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({name:'',stage:'design',colors:[],designer:'',notes:''})
  useEffect(() => { api.getAll('artwork').then(setArtworks) }, [])
  const reload = () => api.getAll('artwork').then(setArtworks)
  const handleSave = async()=>{if(!form.name.trim())return;await api.save('artwork',{...form,createdAt:new Date().toISOString()});setForm({name:'',stage:'design',colors:[],designer:'',notes:''});setShowAdd(false);reload()}
  const updateStage = async(a,s)=>{await api.save('artwork',{...a,stage:s});reload()}
  const del = async(id)=>{await api.remove('artwork',id);reload()}
  const toggleColor = (c)=>setForm(f=>({...f,colors:f.colors.includes(c)?f.colors.filter(x=>x!==c):[...f.colors,c]}))
  return (
    <>
      <div className="page-header">
        <div><h1>Artwork Pipeline</h1><p className="page-subtitle">{artworks.length} artworks · {artworks.filter(a=>a.stage==='live').length} live</p></div>
        <button className="btn btn-primary" onClick={()=>setShowAdd(true)}>+ Nieuw artwork</button>
      </div>
      {artworks.length===0?<div className="card"><div className="empty-state">Nog geen artworks</div></div>:
      <div className="content-grid">{artworks.map(a=>(
        <div key={a.id} className="card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1rem'}}>
            <div><h3 style={{fontSize:'1.1rem',margin:0}}>{a.name}</h3>
              {a.designer&&<div style={{fontSize:'0.8rem',color:'var(--text-secondary)',marginTop:'0.15rem'}}>Designer: {a.designer}</div>}</div>
            <button onClick={()=>del(a.id)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)'}}>✕</button>
          </div>
          <div className="pipeline-track" style={{marginBottom:'1rem'}}>
            {STAGES.map((s,idx)=>{const ci=STAGES.indexOf(a.stage);return(
              <span key={s}>{idx>0&&<span className="pipeline-arrow"> → </span>}
                <span className={`pipeline-step ${idx<ci?'done':''} ${idx===ci?'active':''}`}
                  onClick={()=>updateStage(a,s)} style={{cursor:'pointer'}} title={`→ ${SL[s]}`}>{SL[s]}</span></span>)})}
          </div>
          {a.colors&&a.colors.length>0&&<div style={{marginBottom:'0.75rem'}}>
            <div style={{fontSize:'0.7rem',fontWeight:600,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'0.35rem'}}>Kleuren</div>
            <div style={{display:'flex',gap:'0.35rem',flexWrap:'wrap'}}>{a.colors.map(c=><span key={c} className="badge badge-amber">{c}</span>)}</div>
          </div>}
          {a.notes&&<div style={{fontSize:'0.8rem',color:'var(--text-secondary)',borderTop:'1px solid var(--border)',paddingTop:'0.75rem',marginTop:'0.5rem'}}>{a.notes}</div>}
        </div>))}</div>}
      {showAdd&&<div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
        <div className="modal">
          <div className="modal-header"><h3>Nieuw artwork</h3><button className="modal-close" onClick={()=>setShowAdd(false)}>✕</button></div>
          <div className="form-group"><label className="form-label">Naam</label>
            <input className="form-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="bijv. Mountain Echo" autoFocus/></div>
          <div className="form-group"><label className="form-label">Designer</label>
            <input className="form-input" value={form.designer} onChange={e=>setForm({...form,designer:e.target.value})} placeholder="naam designer"/></div>
          <div className="form-group"><label className="form-label">Kleuren</label>
            <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
              {COLORS.map(c=><button key={c} className={`btn btn-sm ${form.colors.includes(c)?'btn-primary':'btn-outline'}`} onClick={()=>toggleColor(c)}>{c}</button>)}
            </div></div>
          <div className="form-group"><label className="form-label">Notities</label>
            <textarea className="form-textarea" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Designbrief, referenties..."/></div>
          <div style={{display:'flex',gap:'0.5rem',justifyContent:'flex-end'}}>
            <button className="btn btn-outline" onClick={()=>setShowAdd(false)}>Annuleren</button>
            <button className="btn btn-primary" onClick={handleSave}>Opslaan</button>
          </div>
        </div>
      </div>}
    </>)
}
