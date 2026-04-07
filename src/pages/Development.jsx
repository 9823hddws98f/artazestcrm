import { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import { uploadImage } from '../supabase'

const STAGES = [
  {key:'idee',label:'Idee',color:'#9CA3AF',icon:'💡'},
  {key:'schets',label:'Schets',color:'#D97706',icon:'✏️'},
  {key:'prototype',label:'Prototype',color:'#2563EB',icon:'🔧'},
  {key:'productie',label:'Productie',color:'#7C3AED',icon:'⚙️'},
  {key:'klaar',label:'Klaar',color:'#059669',icon:'✅'},
]
const KLEUREN = [
  {key:'Black',label:'Midnight Black',hex:'#1C1917'},
  {key:'White',label:'Snow White',hex:'#F5F5F4'},
  {key:'Blue',label:'Ocean Blue',hex:'#4A6FA5'},
  {key:'Green',label:'Forest Green',hex:'#6B8E6B'},
  {key:'Grey',label:'Stone Grey',hex:'#9CA3AF'},
  {key:'Light tan',label:'Sahara Beige',hex:'#E8DCCC'},
  {key:'Beige',label:'Ivory White',hex:'#D4C5A9'},
]
const FORMATS = ['60 x 60','120 x 60','100 x 70','114 x 60','70 x 100','120 x 30','90 cm']
const uid = () => `dev-${Date.now()}-${Math.random().toString(36).slice(2,5)}`

const compress = (dataUrl, max=600) => new Promise(resolve => {
  if(!dataUrl||!dataUrl.startsWith('data:')) return resolve(dataUrl)
  const img=new Image();img.onload=()=>{const c=document.createElement('canvas');let w=img.width,h=img.height;if(w>h){if(w>max){h=h*(max/w);w=max}}else{if(h>max){w=w*(max/h);h=max}};c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);resolve(c.toDataURL('image/jpeg',0.7))};img.onerror=()=>resolve(dataUrl);img.src=dataUrl
})

export default function Development() {
  const [items, setItems] = useState([])
  const [inspo, setInspo] = useState([])
  const [tab, setTab] = useState('dev')
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showAddInspo, setShowAddInspo] = useState(false)
  const [filterStage, setFilterStage] = useState(null)
  const [inspoDragOver, setInspoDragOver] = useState(false)
  const inspoFileRef = useRef(null)

  useEffect(() => {
    api.getSetting('dev_items').then(v => { if(v?.length) setItems(v) })
    api.getSetting('dev_inspo').then(v => { if(v?.length) setInspo(v) })
  }, [])

  const saveItems = async d => { setItems(d); localStorage.setItem('artazest_dev',JSON.stringify(d)); await api.saveSetting('dev_items', d) }
  const saveInspo = async d => { setInspo(d); localStorage.setItem('artazest_inspo',JSON.stringify(d)); await api.saveSetting('dev_inspo', d) }
  const save = async a => { if(a.thumbnail&&a.thumbnail.startsWith('data:'))a.thumbnail=await compress(a.thumbnail);const i=items.findIndex(x=>x.id===a.id);const u=i>=0?items.map(x=>x.id===a.id?a:x):[...items,a];await saveItems(u) }
  const del = async id => { await saveItems(items.filter(x=>x.id!==id)); setSelected(null) }

  const addInspo = async (url, note) => { 
    let thumb = url
    if(url.startsWith('data:')) thumb = await compress(url)
    await saveInspo([...inspo, {id:`inspo-${Date.now()}`,thumbnail:thumb,note:note||'',addedAt:new Date().toISOString()}]) 
  }
  const delInspo = id => saveInspo(inspo.filter(x=>x.id!==id))
  const handleInspoFiles = async files => {
    const newItems = []
    for(const file of files) {
      if(!file.type.startsWith('image/')) continue
      const dataUrl = await new Promise(r=>{const rd=new FileReader();rd.onload=e=>r(e.target.result);rd.readAsDataURL(file)})
      const thumb = await compress(dataUrl)
      newItems.push({id:`inspo-${Date.now()}-${Math.random().toString(36).slice(2,5)}`,thumbnail:thumb,note:'',addedAt:new Date().toISOString()})
    }
    if(newItems.length) await saveInspo([...inspo,...newItems])
  }

  const filtered = filterStage ? items.filter(i=>i.stage===filterStage) : items
  const stageCounts = STAGES.map(s=>({...s,count:items.filter(i=>i.stage===s.key).length}))

  return (
    <>
      <div className="page-header">
        <div>
          <h1>In Ontwikkeling</h1>
          <p className="page-subtitle">{items.length} artworks · {items.filter(i=>i.stage==='klaar').length} klaar</p>
        </div>
        <button className="btn btn-primary" onClick={()=>setShowAdd(true)}>+ Nieuw artwork</button>
      </div>

      {/* Score cards per stage */}
      <div style={{display:'flex',gap:'0.5rem',marginBottom:'1.25rem',flexWrap:'wrap'}}>
        {stageCounts.map(s=>(
          <button key={s.key} onClick={()=>setFilterStage(filterStage===s.key?null:s.key)}
            style={{padding:'0.4rem 0.75rem',borderRadius:'10px',border:`1.5px solid ${filterStage===s.key?s.color:'var(--border)'}`,background:filterStage===s.key?`${s.color}15`:'var(--bg-card)',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.35rem',transition:'all 0.15s'}}>
            <span>{s.icon}</span>
            <span style={{fontSize:'0.78rem',fontWeight:600,color:filterStage===s.key?s.color:'var(--text-primary)'}}>{s.label}</span>
            <span style={{fontSize:'0.68rem',fontWeight:700,color:s.color,background:`${s.color}20`,borderRadius:'99px',padding:'0.05rem 0.35rem'}}>{s.count}</span>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{marginBottom:'1rem'}}>
        <button className={`tab ${tab==='dev'?'active':''}`} onClick={()=>setTab('dev')}>🎨 Artworks ({items.length})</button>
        <button className={`tab ${tab==='inspo'?'active':''}`} onClick={()=>setTab('inspo')}>✨ Inspiratie ({inspo.length})</button>
      </div>

      {/* DEV TAB — Artwork grid */}
      {tab==='dev'&&(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:'1rem'}}>
          {filtered.map(a=>{
            const stage=STAGES.find(s=>s.key===a.stage)||STAGES[0]
            return (
              <div key={a.id} onClick={()=>setSelected(a)} style={{cursor:'pointer',borderRadius:'12px',overflow:'hidden',border:'1px solid var(--border)',background:'var(--bg-card)',transition:'all 0.15s'}}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.1)'}} onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=''}}>
                <div style={{aspectRatio:'1',background:a.thumbnail?`url(${a.thumbnail}) center/cover`:`linear-gradient(135deg,${stage.color}30,#F2F0EB)`,display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
                  {!a.thumbnail&&<span style={{fontSize:'0.85rem',color:'rgba(0,0,0,0.12)',fontStyle:'italic'}}>{a.name?.slice(0,14)}</span>}
                  <span style={{position:'absolute',top:'6px',left:'6px',fontSize:'0.6rem',padding:'0.1rem 0.4rem',borderRadius:'99px',background:stage.color,color:'#fff',fontWeight:700}}>{stage.icon} {stage.label}</span>
                </div>
                <div style={{padding:'0.55rem 0.65rem'}}>
                  <div style={{fontWeight:700,fontSize:'0.78rem',textTransform:'uppercase',letterSpacing:'0.02em',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.name||'Naamloos'}</div>
                  <div style={{fontSize:'0.68rem',color:'var(--text-secondary)',marginTop:'0.1rem'}}>{a.format||'—'}</div>
                  <div style={{display:'flex',gap:'0.15rem',marginTop:'0.25rem'}}>
                    {(a.kleuren||[]).map(k=>{const kl=KLEUREN.find(x=>x.key===k);return kl?<span key={k} style={{width:'10px',height:'10px',borderRadius:'50%',background:kl.hex,border:k==='White'?'1px solid #ddd':'none'}}/>:null})}
                  </div>
                  {a.notes&&<div style={{fontSize:'0.62rem',color:'var(--text-secondary)',marginTop:'0.2rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.notes}</div>}
                </div>
              </div>
            )
          })}
          {filtered.length===0&&<div style={{gridColumn:'1/-1',textAlign:'center',padding:'3rem',color:'var(--text-secondary)'}}>Geen artworks{filterStage?` in "${STAGES.find(s=>s.key===filterStage)?.label}"`:''} — klik "+ Nieuw artwork"</div>}
        </div>
      )}

      {/* INSPO TAB — drag & drop */}
      {tab==='inspo'&&(
        <div
          onDragOver={e=>{e.preventDefault();setInspoDragOver(true)}}
          onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget))setInspoDragOver(false)}}
          onDrop={e=>{e.preventDefault();setInspoDragOver(false);handleInspoFiles(Array.from(e.dataTransfer.files))}}
          style={{minHeight:'400px',borderRadius:'16px',border:inspoDragOver?'3px dashed var(--accent)':'2px dashed transparent',background:inspoDragOver?'var(--accent-light)':'transparent',transition:'all 0.2s',padding:inspoDragOver?'1rem':'0'}}>

          {/* Upload bar */}
          <div style={{display:'flex',gap:'0.5rem',marginBottom:'1rem',alignItems:'center'}}>
            <button onClick={()=>inspoFileRef.current?.click()} style={{padding:'0.45rem 0.85rem',borderRadius:'8px',border:'1px dashed var(--accent)',background:'var(--accent-light)',color:'var(--accent)',fontSize:'0.78rem',fontWeight:600,cursor:'pointer'}}>📷 Foto's uploaden</button>
            <span style={{fontSize:'0.72rem',color:'var(--text-secondary)'}}>of sleep afbeeldingen hierheen</span>
            <input ref={inspoFileRef} type="file" accept="image/*" multiple style={{display:'none'}} onChange={e=>handleInspoFiles(Array.from(e.target.files))}/>
            {inspo.length>0&&<button onClick={()=>{if(confirm('Alle inspiratie wissen?'))saveInspo([])}} style={{marginLeft:'auto',fontSize:'0.68rem',color:'var(--text-secondary)',background:'none',border:'1px solid var(--border)',borderRadius:'6px',padding:'0.25rem 0.5rem',cursor:'pointer'}}>Alles wissen</button>}
          </div>

          {/* Grid */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:'0.75rem'}}>
            {inspo.map(item=>(
              <div key={item.id} style={{borderRadius:'12px',overflow:'hidden',border:'1px solid var(--border)',background:'var(--bg-card)',position:'relative',transition:'all 0.15s'}}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)';e.currentTarget.querySelector('.del-btn').style.opacity='1'}}
                onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='';e.currentTarget.querySelector('.del-btn').style.opacity='0'}}>
                {item.thumbnail&&<div style={{aspectRatio:'1',background:`url(${item.thumbnail}) center/cover`}}/>}
                {item.note&&<div style={{padding:'0.4rem 0.55rem',fontSize:'0.72rem',color:'var(--text-secondary)'}}>{item.note}</div>}
                <button className="del-btn" onClick={()=>delInspo(item.id)} style={{position:'absolute',top:'6px',right:'6px',width:'24px',height:'24px',borderRadius:'50%',background:'rgba(0,0,0,0.6)',color:'#fff',border:'none',cursor:'pointer',fontSize:'0.75rem',opacity:0,transition:'opacity 0.15s',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
              </div>
            ))}
          </div>

          {inspo.length===0&&!inspoDragOver&&(
            <div style={{textAlign:'center',padding:'4rem 2rem',color:'var(--text-secondary)'}}>
              <div style={{fontSize:'3rem',marginBottom:'0.5rem'}}>🖼️</div>
              <div style={{fontSize:'1rem',fontWeight:600,marginBottom:'0.25rem'}}>Sleep afbeeldingen hierheen</div>
              <div style={{fontSize:'0.82rem'}}>of klik op "Foto's uploaden" — meerdere tegelijk kan!</div>
            </div>
          )}
        </div>
      )}

      {/* ADD ARTWORK MODAL */}
      {showAdd&&<AddDevModal onSave={async a=>{await save({...a,id:uid(),createdAt:new Date().toISOString()});setShowAdd(false)}} onClose={()=>setShowAdd(false)}/>}

      {/* ADD INSPO MODAL */}
      {showAddInspo&&<InspoModal onAdd={async(url,note)=>{await addInspo(url,note);setShowAddInspo(false)}} onClose={()=>setShowAddInspo(false)}/>}

      {/* DETAIL MODAL */}
      {selected&&<DevDetail art={selected} onSave={a=>{save(a);setSelected({...selected,...a})}} onClose={()=>setSelected(null)} onDel={()=>del(selected.id)} stages={STAGES}/>}
    </>
  )
}

function InspoModal({onAdd,onClose}) {
  const [url,setUrl]=useState('')
  const [note,setNote]=useState('')
  const [preview,setPreview]=useState('')
  const fRef=useRef()
  const handleFile=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>{setPreview(ev.target.result);setUrl(ev.target.result)};r.readAsDataURL(f)}
  return(
    <div className="modal-overlay" onClick={onClose}><div className="modal" style={{maxWidth:'440px'}} onClick={e=>e.stopPropagation()}>
      <div className="modal-header"><h3>✨ Inspiratie toevoegen</h3><button className="modal-close" onClick={onClose}>✕</button></div>
      <div onClick={()=>fRef.current?.click()} style={{width:'100%',height:'180px',borderRadius:'10px',border:'2px dashed var(--border)',background:preview?`url(${preview}) center/cover`:'var(--bg-secondary)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'0.75rem',overflow:'hidden'}}
        onMouseEnter={e=>e.currentTarget.style.borderColor='var(--accent)'} onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
        {!preview&&<div style={{textAlign:'center',color:'var(--text-secondary)'}}><div style={{fontSize:'1.5rem'}}>📷</div><div style={{fontSize:'0.72rem'}}>Klik of plak URL</div></div>}
      </div>
      <input ref={fRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleFile}/>
      <input className="form-input" value={url.startsWith('data:')?'':url} onChange={e=>{setUrl(e.target.value);setPreview(e.target.value)}} placeholder="Of plak een URL..." style={{marginBottom:'0.5rem'}}/>
      <input className="form-input" value={note} onChange={e=>setNote(e.target.value)} placeholder="Notitie (optioneel)..." style={{marginBottom:'0.75rem'}}/>
      <div style={{display:'flex',gap:'0.5rem',justifyContent:'flex-end'}}>
        <button className="btn btn-outline" onClick={onClose}>Annuleren</button>
        <button className="btn btn-primary" onClick={()=>{if(url)onAdd(url,note)}}>Toevoegen</button>
      </div>
    </div></div>
  )
}

function AddDevModal({onSave,onClose}) {
  const [f,setF]=useState({name:'',stage:'idee',format:'120 x 60',kleuren:[],notes:'',thumbnail:'',designer:''})
  const fRef=useRef()
  const handleFile=file=>{if(!file||!file.type.startsWith('image/'))return;const r=new FileReader();r.onload=ev=>setF(p=>({...p,thumbnail:ev.target.result}));r.readAsDataURL(file)}
  return(
    <div className="modal-overlay" onClick={onClose}><div className="modal" style={{maxWidth:'500px'}} onClick={e=>e.stopPropagation()}>
      <div className="modal-header"><h3>Nieuw artwork</h3><button className="modal-close" onClick={onClose}>✕</button></div>
      <div onClick={()=>fRef.current?.click()} style={{width:'100%',height:'140px',borderRadius:'10px',border:'2px dashed var(--border)',background:f.thumbnail?`url(${f.thumbnail}) center/cover`:'var(--bg-secondary)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'0.75rem',overflow:'hidden'}}>
        {!f.thumbnail&&<div style={{textAlign:'center',color:'var(--text-secondary)'}}><div style={{fontSize:'1.5rem'}}>📷</div><div style={{fontSize:'0.72rem'}}>Upload foto</div></div>}
      </div>
      <input ref={fRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>handleFile(e.target.files?.[0])}/>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
        <div className="form-group"><label className="form-label">Naam</label><input className="form-input" value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="bijv. Eclipse v2" autoFocus/></div>
        <div className="form-group"><label className="form-label">Stage</label><select className="form-select" value={f.stage} onChange={e=>setF({...f,stage:e.target.value})}>{STAGES.map(s=><option key={s.key} value={s.key}>{s.icon} {s.label}</option>)}</select></div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
        <div className="form-group"><label className="form-label">Formaat</label><select className="form-select" value={f.format} onChange={e=>setF({...f,format:e.target.value})}>{FORMATS.map(fm=><option key={fm}>{fm}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Designer</label><input className="form-input" value={f.designer} onChange={e=>setF({...f,designer:e.target.value})} placeholder="Wie ontwerpt..."/></div>
      </div>
      <div className="form-group" style={{marginBottom:'0.75rem'}}><label className="form-label">Kleuren</label>
        <div style={{display:'flex',gap:'0.35rem',flexWrap:'wrap'}}>{KLEUREN.map(k=>{const sel=f.kleuren.includes(k.key);return <button key={k.key} onClick={()=>setF(p=>({...p,kleuren:sel?p.kleuren.filter(x=>x!==k.key):[...p.kleuren,k.key]}))} style={{display:'flex',alignItems:'center',gap:'0.25rem',padding:'0.2rem 0.5rem',borderRadius:'99px',border:sel?'2px solid var(--accent)':'1px solid var(--border)',background:sel?'var(--accent-light)':'var(--bg-card)',cursor:'pointer',fontSize:'0.72rem',fontFamily:'var(--font-body)'}}><span style={{width:'8px',height:'8px',borderRadius:'50%',background:k.hex,border:k.key==='White'?'1px solid #ccc':'none'}}/>{k.label}</button>})}</div>
      </div>
      <div className="form-group" style={{marginBottom:'0.75rem'}}><label className="form-label">Notities</label><textarea className="form-textarea" value={f.notes} onChange={e=>setF({...f,notes:e.target.value})} placeholder="Ideeën, inspiratie, specs..." rows={2}/></div>
      <div style={{display:'flex',gap:'0.5rem',justifyContent:'flex-end'}}>
        <button className="btn btn-outline" onClick={onClose}>Annuleren</button>
        <button className="btn btn-primary" onClick={()=>{if(f.name.trim())onSave(f)}}>Opslaan</button>
      </div>
    </div></div>
  )
}

function DevDetail({art,onSave,onClose,onDel,stages}) {
  const [a,setA]=useState({...art})
  const [saved,setSaved]=useState(false)
  const fRef=useRef()
  const upd=u=>{const n={...a,...u};setA(n);onSave(n);setSaved(true);setTimeout(()=>setSaved(false),1500)}
  const handleImg=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>upd({thumbnail:r.result});r.readAsDataURL(f)}
  const stage=stages.find(s=>s.key===a.stage)||stages[0]
  return(
    <div className="modal-overlay" onClick={onClose} style={{alignItems:'center',justifyContent:'center'}}>
      <div style={{display:'flex',maxWidth:'800px',width:'95%',maxHeight:'90vh',borderRadius:'16px',overflow:'hidden',background:'var(--bg-card)',boxShadow:'0 20px 60px rgba(0,0,0,0.15)'}} onClick={e=>e.stopPropagation()}>
        <div style={{flex:1,background:'#F8F7F4',padding:'1.25rem',overflowY:'auto'}}>
          <div style={{borderRadius:'12px',background:'#fff',border:'1px solid var(--border)',minHeight:'250px',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',cursor:'pointer',position:'relative'}} onClick={()=>fRef.current?.click()}>
            {a.thumbnail?<img src={a.thumbnail} style={{maxWidth:'100%',maxHeight:'350px',objectFit:'contain'}}/>:<span style={{color:'var(--text-secondary)',fontSize:'0.85rem'}}>📷 Klik om foto te uploaden</span>}
            <input ref={fRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleImg}/>
          </div>
        </div>
        <div style={{width:'300px',padding:'1.25rem',overflowY:'auto',borderLeft:'1px solid var(--border)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem'}}>
            <span style={{fontSize:'0.65rem',fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em'}}>In Ontwikkeling</span>
            <div style={{display:'flex',gap:'0.3rem',alignItems:'center'}}>
              {saved&&<span style={{fontSize:'0.65rem',color:'#059669',fontWeight:600}}>✓</span>}
              <button onClick={()=>{if(confirm('Verwijderen?'))onDel()}} style={{width:'24px',height:'24px',borderRadius:'50%',background:'#FEE2E2',color:'#DC2626',border:'none',cursor:'pointer',fontSize:'0.6rem'}}>🗑</button>
              <button onClick={onClose} style={{width:'24px',height:'24px',borderRadius:'50%',background:'var(--bg-secondary)',color:'var(--text-secondary)',border:'none',cursor:'pointer',fontSize:'0.85rem'}}>✕</button>
            </div>
          </div>
          <input value={a.name||''} onChange={e=>upd({name:e.target.value})} style={{fontSize:'1.1rem',fontFamily:'var(--font-display)',border:'none',padding:0,background:'transparent',width:'100%',marginBottom:'0.5rem',outline:'none'}} placeholder="Naam..."/>
          {/* Stage selector */}
          <div style={{display:'flex',gap:'0.25rem',marginBottom:'0.75rem',flexWrap:'wrap'}}>
            {stages.map(s=><button key={s.key} onClick={()=>upd({stage:s.key})} style={{padding:'0.2rem 0.5rem',borderRadius:'99px',border:`1.5px solid ${a.stage===s.key?s.color:'var(--border)'}`,background:a.stage===s.key?`${s.color}15`:'transparent',color:a.stage===s.key?s.color:'var(--text-secondary)',fontSize:'0.68rem',fontWeight:600,cursor:'pointer'}}>{s.icon} {s.label}</button>)}
          </div>
          <div className="form-group" style={{marginBottom:'0.5rem'}}><label className="form-label" style={{fontSize:'0.68rem'}}>Designer</label><input className="form-input" value={a.designer||''} onChange={e=>upd({designer:e.target.value})} placeholder="Wie ontwerpt..." style={{fontSize:'0.8rem'}}/></div>
          <div className="form-group" style={{marginBottom:'0.5rem'}}><label className="form-label" style={{fontSize:'0.68rem'}}>Formaat</label><select className="form-select" value={a.format||''} onChange={e=>upd({format:e.target.value})} style={{fontSize:'0.8rem'}}><option value="">—</option>{FORMATS.map(f=><option key={f}>{f}</option>)}</select></div>
          <div className="form-group" style={{marginBottom:'0.5rem'}}><label className="form-label" style={{fontSize:'0.68rem'}}>Kleuren</label>
            <div style={{display:'flex',gap:'0.3rem',flexWrap:'wrap'}}>{KLEUREN.map(k=>{const sel=(a.kleuren||[]).includes(k.key);return <button key={k.key} onClick={()=>{const kl=a.kleuren||[];upd({kleuren:sel?kl.filter(x=>x!==k.key):[...kl,k.key]})}} style={{display:'flex',alignItems:'center',gap:'0.2rem',padding:'0.15rem 0.4rem',borderRadius:'99px',border:sel?'2px solid var(--accent)':'1px solid var(--border)',background:sel?'var(--accent-light)':'var(--bg-card)',cursor:'pointer',fontSize:'0.68rem',fontFamily:'var(--font-body)'}}><span style={{width:'8px',height:'8px',borderRadius:'50%',background:k.hex}}/>{k.label}</button>})}</div>
          </div>
          <div className="form-group" style={{marginBottom:'0.75rem'}}><label className="form-label" style={{fontSize:'0.68rem'}}>Notities</label><textarea className="form-textarea" value={a.notes||''} onChange={e=>upd({notes:e.target.value})} placeholder="Ideeën, specs, feedback..." rows={3} style={{fontSize:'0.8rem'}}/></div>
          <button onClick={onClose} className="btn btn-primary" style={{width:'100%',fontSize:'0.82rem'}}>✓ Opslaan & sluiten</button>
        </div>
      </div>
    </div>
  )
}
