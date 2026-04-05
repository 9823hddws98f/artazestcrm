import { useState, useEffect, useRef } from 'react'
import { api } from '../api'

const KLEUREN = [
  { key: 'snowwhite', label: 'Snow White', hex: '#F5F0EB' },
  { key: 'midnightblack', label: 'MidnightBlack', hex: '#1C1917' },
  { key: 'oceanblue', label: 'Ocean Blue', hex: '#1B2A4A' },
  { key: 'forestgreen', label: 'Forest Green', hex: '#2D4A3E' },
  { key: 'stonegrey', label: 'Stone Grey', hex: '#8A8680' },
  { key: 'saharabeige', label: 'Sahara Beige', hex: '#D4B896' },
  { key: 'ivorywhite', label: 'Ivory White', hex: '#F0E8DC' },
]
const FORMATS = ['60 x 60','120 x 60','100 x 70','114 x 60','70 x 100','120 x 30','90 cm']

export default function Catalog() {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [filterKleur, setFilterKleur] = useState([])
  const [filterFrame, setFilterFrame] = useState(null)
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editMode, setEditMode] = useState(false)
  useEffect(() => { api.getAll('catalog').then(setItems) }, [])
  const reload = () => api.getAll('catalog').then(setItems)
  const save = async a => { await api.save('catalog', a); reload() }
  const del = async id => { await api.remove('catalog', id); setSelected(null); reload() }
  const toggleKF = k => setFilterKleur(f => f.includes(k) ? f.filter(x => x !== k) : [...f, k])

  const filtered = items.filter(a => {
    if (search && !a.name?.toLowerCase().includes(search.toLowerCase())) return false
    if (filterKleur.length > 0 && !(a.kleuren || []).some(k => filterKleur.includes(k))) return false
    if (filterFrame === true && !a.frame) return false
    return true
  }).sort((a, b) => (a.nummer || 99) - (b.nummer || 99))

  return (
    <>
      <div className="page-header">
        <div><h1>Catalogus</h1>
          <p className="page-subtitle">{items.length} artworks &middot; {items.filter(a => a.online).length} live</p></div>
        <div style={{display:'flex',gap:'0.5rem'}}>
          <button className={`btn btn-sm ${editMode?'btn-primary':'btn-outline'}`} onClick={()=>setEditMode(!editMode)}>
            {editMode ? '✓ Gereed' : '✎ Bewerken'}</button>
          <button className="btn btn-primary" onClick={()=>setShowAdd(true)}>+ Nieuw artwork</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:'0.5rem',marginBottom:'1.5rem',flexWrap:'wrap',alignItems:'center'}}>
        <span style={{fontSize:'0.7rem',fontWeight:600,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Filters:</span>
        <button onClick={()=>setFilterFrame(filterFrame===true?null:true)} className={`btn btn-sm ${filterFrame===true?'btn-primary':'btn-outline'}`} style={{fontSize:'0.75rem',gap:'0.3rem'}}>
          <span style={{width:'8px',height:'8px',borderRadius:'50%',background:'#A8A29E',display:'inline-block'}}/> Houten lijst</button>
        {KLEUREN.map(k => (
          <button key={k.key} onClick={()=>toggleKF(k.key)} className={`btn btn-sm ${filterKleur.includes(k.key)?'btn-primary':'btn-outline'}`} style={{fontSize:'0.75rem',gap:'0.3rem'}}>
            <span style={{width:'8px',height:'8px',borderRadius:'50%',background:k.hex,display:'inline-block',border:k.key==='wit'?'1px solid var(--border)':'none'}}/> {k.label}</button>
        ))}
        {(filterKleur.length>0||filterFrame!==null)&&<button onClick={()=>{setFilterKleur([]);setFilterFrame(null)}} style={{background:'none',border:'none',cursor:'pointer',fontSize:'0.75rem',color:'var(--text-secondary)'}}>✕ Reset</button>}
      </div>

      {/* Grid */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))',gap:'1rem'}}>
        {filtered.map(a => (
          <div key={a.id} onClick={()=>setSelected(a)} style={{cursor:'pointer',position:'relative',borderRadius:'var(--radius-md)',overflow:'hidden',border:a.online?'2px solid var(--success)':'1px solid var(--border)',transition:'transform 0.15s,box-shadow 0.15s'}}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'}}
            onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=''}}>
            {editMode&&<button onClick={e=>{e.stopPropagation();del(a.id)}} style={{position:'absolute',top:'6px',right:'6px',width:'22px',height:'22px',borderRadius:'50%',background:'var(--danger)',color:'#fff',border:'none',cursor:'pointer',fontSize:'0.7rem',zIndex:2,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>}
            <div style={{aspectRatio:'1',background:a.thumbnail?`url(${a.thumbnail}) center/cover`:`linear-gradient(135deg, ${(a.kleuren||[])[0]?KLEUREN.find(k=>k.key===(a.kleuren||[])[0])?.hex||'#D6D3D1':'#D6D3D1'}, #F2F0EB)`,display:'flex',alignItems:'center',justifyContent:'center'}}>
              {!a.thumbnail&&<span style={{fontSize:'0.8rem',color:'rgba(0,0,0,0.15)',fontWeight:500,fontStyle:'italic'}}>{a.name?.slice(0,14)}</span>}
            </div>
            <div style={{padding:'0.5rem 0.6rem',background:'var(--bg-card)'}}>
              <div style={{fontSize:'0.72rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.02em',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {a.nummer?`${a.nummer}. `:''}{a.name}</div>
              {a.format&&<div style={{fontSize:'0.65rem',color:'var(--text-secondary)',marginTop:'0.1rem'}}>{a.format}</div>}
              <div style={{display:'flex',gap:'0.2rem',marginTop:'0.3rem'}}>
                {(a.kleuren||[]).map(k=>{const kl=KLEUREN.find(x=>x.key===k);return kl?<span key={k} style={{width:'11px',height:'11px',borderRadius:'50%',background:kl.hex,border:k==='wit'?'1px solid var(--border)':'none'}} title={kl.label}/>:null})}
              </div>
            </div>
          </div>
        ))}
        <div onClick={()=>setShowAdd(true)} style={{cursor:'pointer',borderRadius:'var(--radius-md)',border:'2px dashed var(--border)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'200px',color:'var(--text-secondary)',transition:'border-color 0.15s'}}
          onMouseEnter={e=>e.currentTarget.style.borderColor='var(--accent)'} onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
          <span style={{fontSize:'1.5rem',opacity:0.4}}>+</span><span style={{fontSize:'0.8rem'}}>Nieuw artwork</span>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && <Detail art={selected} onSave={a=>{save(a);setSelected({...selected,...a})}} onClose={()=>setSelected(null)} onDel={()=>del(selected.id)}/>}

      {/* Add Modal */}
      {showAdd && <AddModal onSave={async a=>{await api.save('catalog',{...a,createdAt:new Date().toISOString()});setShowAdd(false);reload()}} onClose={()=>setShowAdd(false)} nextNum={items.length+1}/>}
    </>
  )
}

function Detail({art,onSave,onClose,onDel}) {
  const [a,setA]=useState({...art})
  const fRef=useRef()
  const upd=u=>{const n={...a,...u};setA(n);onSave(n)}
  const toggleK=k=>{const kl=a.kleuren||[];upd({kleuren:kl.includes(k)?kl.filter(x=>x!==k):[...kl,k]})}
  const handleImg=(e,field)=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>upd({[field]:r.result});r.readAsDataURL(f)}
  return(
    <div className="modal-overlay" onClick={onClose} style={{alignItems:'center',justifyContent:'center'}}>
      <div style={{display:'flex',maxWidth:'900px',width:'95%',maxHeight:'90vh',borderRadius:'var(--radius-lg)',overflow:'hidden',background:'var(--bg-card)',boxShadow:'0 20px 60px rgba(0,0,0,0.15)'}} onClick={e=>e.stopPropagation()}>
        {/* Left: Media */}
        <div style={{flex:1,background:'#F8F7F4',padding:'1.25rem',overflowY:'auto'}}>
          <div style={{fontSize:'0.7rem',fontWeight:600,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'0.75rem'}}>Media</div>
          <div style={{borderRadius:'var(--radius-md)',background:'#fff',border:'1px solid var(--border)',minHeight:'280px',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',cursor:'pointer',position:'relative'}} onClick={()=>fRef.current?.click()}>
            {a.thumbnail?<img src={a.thumbnail} style={{maxWidth:'100%',maxHeight:'350px',objectFit:'contain'}} alt=""/>:<span style={{color:'var(--text-secondary)',fontSize:'0.85rem'}}>Klik om foto te uploaden</span>}
            <input ref={fRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>handleImg(e,'thumbnail')}/>
          </div>
        </div>
        {/* Right: Details */}
        <div style={{width:'320px',padding:'1.25rem',overflowY:'auto',borderLeft:'1px solid var(--border)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
            <span style={{fontSize:'0.7rem',fontWeight:600,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Artwork {a.nummer||''}</span>
            <div style={{display:'flex',gap:'0.35rem'}}>
              <button onClick={onDel} style={{width:'28px',height:'28px',borderRadius:'50%',background:'var(--danger-light)',color:'var(--danger)',border:'none',cursor:'pointer',fontSize:'0.8rem'}}>✕</button>
              <button onClick={onClose} style={{width:'28px',height:'28px',borderRadius:'50%',background:'var(--bg-secondary)',color:'var(--text-secondary)',border:'none',cursor:'pointer',fontSize:'1rem'}}>✕</button>
            </div>
          </div>
          <input value={a.name||''} onChange={e=>upd({name:e.target.value})} className="form-input" style={{fontSize:'1.2rem',fontFamily:'var(--font-display)',fontWeight:400,border:'none',padding:'0',marginBottom:'0.75rem',background:'transparent'}} placeholder="Naam..."/>
          <textarea value={a.description||''} onChange={e=>upd({description:e.target.value})} className="form-textarea" style={{fontSize:'0.82rem',minHeight:'60px',marginBottom:'1rem'}} placeholder="Beschrijving..."/>

          {/* Online toggle */}
          <div style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.75rem',background:'var(--bg-secondary)',borderRadius:'var(--radius-md)',marginBottom:'0.75rem'}}>
            <span style={{fontSize:'1rem'}}>◉</span>
            <div style={{flex:1}}>
              <div style={{fontSize:'0.82rem',fontWeight:600}}>Online Status</div>
              <div style={{fontSize:'0.75rem',color:a.online?'var(--success)':'var(--text-secondary)'}}>{a.online?'Live (Online)':'Offline'}</div>
            </div>
            <button onClick={()=>upd({online:!a.online})} style={{width:'40px',height:'22px',borderRadius:'11px',border:'none',cursor:'pointer',background:a.online?'var(--success)':'#D6D3D1',position:'relative',transition:'background 0.2s'}}>
              <span style={{position:'absolute',top:'2px',left:a.online?'20px':'2px',width:'18px',height:'18px',borderRadius:'50%',background:'#fff',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/>
            </button>
          </div>

          {/* Frame toggle */}
          <div style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.75rem',background:'var(--bg-secondary)',borderRadius:'var(--radius-md)',marginBottom:'0.75rem'}}>
            <span style={{fontSize:'1rem'}}>⊞</span>
            <div style={{flex:1}}>
              <div style={{fontSize:'0.82rem',fontWeight:600}}>Omlijsting</div>
              <div style={{fontSize:'0.75rem',color:'var(--text-secondary)'}}>{a.frame?'Houten lijst':'Geen hout'}</div>
            </div>
            <button onClick={()=>upd({frame:!a.frame})} style={{width:'40px',height:'22px',borderRadius:'11px',border:'none',cursor:'pointer',background:a.frame?'var(--accent)':'#D6D3D1',position:'relative',transition:'background 0.2s'}}>
              <span style={{position:'absolute',top:'2px',left:a.frame?'20px':'2px',width:'18px',height:'18px',borderRadius:'50%',background:'#fff',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/>
            </button>
          </div>

          {/* Format */}
          <div style={{padding:'0.75rem',background:'var(--bg-secondary)',borderRadius:'var(--radius-md)',marginBottom:'0.75rem'}}>
            <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.5rem'}}><span style={{fontSize:'1rem'}}>◇</span><span style={{fontSize:'0.82rem',fontWeight:600}}>Formaat</span></div>
            <select className="form-select" value={a.format||''} onChange={e=>upd({format:e.target.value})} style={{fontSize:'0.82rem'}}>
              <option value="">Kies formaat...</option>
              {FORMATS.map(f=><option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {/* Kleuren */}
          <div style={{padding:'0.75rem',background:'var(--bg-secondary)',borderRadius:'var(--radius-md)'}}>
            <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.5rem'}}><span style={{fontSize:'1rem'}}>◎</span><span style={{fontSize:'0.82rem',fontWeight:600}}>Kleuren</span></div>
            <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
              {KLEUREN.map(k=>{const sel=(a.kleuren||[]).includes(k.key);return(
                <button key={k.key} onClick={()=>toggleK(k.key)} style={{display:'flex',alignItems:'center',gap:'0.3rem',padding:'0.25rem 0.6rem',borderRadius:'99px',border:sel?'2px solid var(--accent)':'1px solid var(--border)',background:sel?'var(--accent-light)':'var(--bg-card)',cursor:'pointer',fontSize:'0.75rem',fontFamily:'var(--font-body)',fontWeight:sel?600:400}}>
                  <span style={{width:'10px',height:'10px',borderRadius:'50%',background:k.hex,border:k.key==='wit'?'1px solid var(--border)':'none'}}/>{k.label}
                </button>)})}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AddModal({onSave,onClose,nextNum}) {
  const [f,setF]=useState({name:'',nummer:nextNum,format:'120 x 60',kleuren:[],frame:false,online:false,description:''})
  const toggleK=k=>setF(p=>({...p,kleuren:p.kleuren.includes(k)?p.kleuren.filter(x=>x!==k):[...p.kleuren,k]}))
  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h3>Nieuw artwork</h3><button className="modal-close" onClick={onClose}>✕</button></div>
        <div style={{display:'grid',gridTemplateColumns:'3fr 1fr',gap:'1rem'}}>
          <div className="form-group"><label className="form-label">Naam</label><input className="form-input" value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="bijv. Eclipse" autoFocus/></div>
          <div className="form-group"><label className="form-label">Nr.</label><input className="form-input" type="number" value={f.nummer} onChange={e=>setF({...f,nummer:parseInt(e.target.value)||0})}/></div>
        </div>
        <div className="form-group"><label className="form-label">Formaat</label>
          <select className="form-select" value={f.format} onChange={e=>setF({...f,format:e.target.value})}>
            {FORMATS.map(fm=><option key={fm} value={fm}>{fm}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Kleuren</label>
          <div style={{display:'flex',gap:'0.4rem',flexWrap:'wrap'}}>
            {KLEUREN.map(k=><button key={k.key} onClick={()=>toggleK(k.key)} className={`btn btn-sm ${f.kleuren.includes(k.key)?'btn-primary':'btn-outline'}`} style={{fontSize:'0.75rem',gap:'0.3rem'}}>
              <span style={{width:'8px',height:'8px',borderRadius:'50%',background:k.hex,display:'inline-block',border:k.key==='wit'?'1px solid #ccc':'none'}}/>{k.label}</button>)}
          </div></div>
        <div className="form-group"><label className="form-label">Beschrijving</label>
          <textarea className="form-textarea" value={f.description} onChange={e=>setF({...f,description:e.target.value})} placeholder="Beschrijving van het artwork..." rows={2}/></div>
        <div style={{display:'flex',gap:'0.5rem',justifyContent:'flex-end'}}>
          <button className="btn btn-outline" onClick={onClose}>Annuleren</button>
          <button className="btn btn-primary" onClick={()=>{if(f.name.trim())onSave(f)}}>Opslaan</button>
        </div>
      </div>
    </div>
  )
}