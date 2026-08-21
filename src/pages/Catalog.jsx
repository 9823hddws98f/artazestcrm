import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { uploadImage } from '../supabase'

// Comprimeer + upload naar Supabase Storage, return URL
const processImage = async (dataUrl, id) => {
  if(!dataUrl || !dataUrl.startsWith('data:')) return dataUrl
  // Comprimeer eerst
  const compressed = await new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let w=img.width, h=img.height
      const max=800
      if(w>h){if(w>max){h=h*(max/w);w=max}}else{if(h>max){w=w*(max/h);h=max}}
      canvas.width=w; canvas.height=h
      canvas.getContext('2d').drawImage(img,0,0,w,h)
      resolve(canvas.toDataURL('image/jpeg',0.8))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
  // Upload naar Supabase Storage
  const filename = `${id || Date.now()}.jpg`
  const url = await uploadImage(compressed, filename)
  return url || compressed // fallback naar base64 als upload faalt
}

const KLEUREN = [
  { key: 'Black', label: 'Midnight Black', hex: '#1C1917' },
  { key: 'White', label: 'Snow White', hex: '#F5F5F4' },
  { key: 'Blue', label: 'Ocean Blue', hex: '#4A6FA5' },
  { key: 'Green', label: 'Forest Green', hex: '#6B8E6B' },
  { key: 'Grey', label: 'Stone Grey', hex: '#9CA3AF' },
  { key: 'Light tan', label: 'Sahara Beige', hex: '#E8DCCC' },
  { key: 'Beige', label: 'Ivory White', hex: '#D4C5A9' },
]
const FORMATS = ['60 x 60','120 x 60','100 x 70','114 x 60','70 x 100','120 x 30','90 cm']

export default function Catalog() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [filterKleur, setFilterKleur] = useState([])
  const [filterFrame, setFilterFrame] = useState(null)
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [dragId, setDragId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  useEffect(() => {
    api.getSetting('catalog_items').then(v => {
      if(v?.length) setItems(v)
      else { try { const ls=JSON.parse(localStorage.getItem('artazest_catalog_items')||'[]'); if(ls.length) setItems(ls) } catch{} }
    })
  }, [])
  const reload = () => api.getSetting('catalog_items').then(v => setItems(v||[]))
  const saveAll = async items => {
    setItems(items)
    localStorage.setItem('artazest_catalog_items', JSON.stringify(items))
    await api.saveSetting('catalog_items', items)
  }
  const save = async a => {
    if(a.thumbnail && a.thumbnail.startsWith('data:')) a.thumbnail = await processImage(a.thumbnail, a.id)
    const idx=items.findIndex(x=>x.id===a.id); const upd=idx>=0?items.map(x=>x.id===a.id?a:x):[...items,a]; await saveAll(upd)
  }
  const del = async id => { await saveAll(items.filter(x=>x.id!==id)); setSelected(null) }
  const seedCatalog = async () => {
    const arts = [
      {nummer:1,name:'Eclipse',format:'114 x 60',kleuren:['Light tan','Black','White'],frame:true,online:true},
      {nummer:2,name:'Wave',format:'60 x 60',kleuren:['Blue','Black','White'],frame:false,online:true},
      {nummer:3,name:'Artwork 3',format:'120 x 60',kleuren:['Blue','Black','White'],frame:false,online:true},
      {nummer:4,name:'Artwork 4',format:'120 x 60',kleuren:['Blue','Black','White'],frame:true,online:true},
      {nummer:5,name:'Artwork 5',format:'100 x 70',kleuren:['Light tan','Black','Blue'],frame:false,online:true},
      {nummer:6,name:'Maris',format:'100 x 70',kleuren:['Light tan','Black','Blue'],frame:false,online:true},
      {nummer:7,name:'Eterna',format:'90 cm',kleuren:['Blue','White'],frame:false,online:true},
      {nummer:8,name:'Artwork 8',format:'120 x 60',kleuren:['Beige','Black','White'],frame:false,online:false},
      {nummer:9,name:'Artwork 9',format:'60 x 60',kleuren:['Light tan','Black'],frame:false,online:false},
      {nummer:10,name:'Touch',format:'114 x 60',kleuren:['Blue','White','Beige'],frame:true,online:true},
      {nummer:11,name:'Artwork 11',format:'120 x 60',kleuren:['Beige','Black','White'],frame:false,online:true},
      {nummer:12,name:'Artwork 12',format:'70 x 100',kleuren:['Light tan','Black','White'],frame:false,online:true},
      {nummer:13,name:'Allerlij',format:'114 x 60',kleuren:['Blue','White','Light tan'],frame:false,online:true},
      {nummer:14,name:'Artwork 14',format:'120 x 60',kleuren:['Beige','Black','White'],frame:false,online:true},
      {nummer:15,name:'Artwork 15',format:'60 x 60',kleuren:['Beige','Black'],frame:false,online:true},
      {nummer:16,name:'Woman',format:'120 x 60',kleuren:['Blue','Black'],frame:false,online:true},
      {nummer:17,name:'Eclipse SE',format:'114 x 60',kleuren:['Beige','Black','White'],frame:true,online:true},
      {nummer:18,name:'Stone',format:'60 x 60',kleuren:['Light tan','Black'],frame:false,online:true},
      {nummer:19,name:'Artwork 19',format:'60 x 60',kleuren:['Blue','White'],frame:false,online:false},
      {nummer:20,name:'Artwork 20',format:'120 x 60',kleuren:['Beige','Black','White'],frame:false,online:false},
      {nummer:21,name:'Zephyr',format:'120 x 30',kleuren:['Beige','Black'],frame:false,online:true},
      {nummer:22,name:'Stone II',format:'100 x 70',kleuren:['Blue','White'],frame:false,online:true},
      {nummer:23,name:'Wave II',format:'100 x 70',kleuren:['Blue','Black'],frame:false,online:true},
    ]
    const seeded = arts.map(a=>({...a,id:`art-${a.nummer}`,description:'',thumbnail:'',createdAt:new Date().toISOString()}))
    await saveAll(seeded)
  }
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
          <button onClick={()=>navigate('/development')} className="btn btn-sm btn-outline" style={{display:'flex',alignItems:'center',gap:'0.3rem'}}>🧪 In Ontwikkeling</button>
          <button className={`btn btn-sm ${editMode?'btn-primary':'btn-outline'}`} onClick={()=>setEditMode(!editMode)}>
            {editMode ? '✓ Gereed' : '✎ Bewerken'}</button>
          {items.length===0&&<button className="btn btn-sm btn-outline" onClick={seedCatalog}>🔄 Laad 23 artworks</button>}
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
            <span style={{width:'8px',height:'8px',borderRadius:'50%',background:k.hex,display:'inline-block',border:k.key==='White'?'1px solid var(--border)':'none'}}/> {k.label}</button>
        ))}
        {(filterKleur.length>0||filterFrame!==null)&&<button onClick={()=>{setFilterKleur([]);setFilterFrame(null)}} style={{background:'none',border:'none',cursor:'pointer',fontSize:'0.75rem',color:'var(--text-secondary)'}}>✕ Reset</button>}
      </div>

      {/* Grid */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))',gap:'1rem'}}>
        {filtered.map((a,idx) => (
          <div key={a.id}
            draggable={editMode}
            onDragStart={e=>{if(!editMode)return;setDragId(a.id);e.dataTransfer.effectAllowed='move'}}
            onDragEnd={()=>{setDragId(null);setDragOverId(null)}}
            onDragOver={e=>{if(!editMode||!dragId)return;e.preventDefault();setDragOverId(a.id)}}
            onDrop={e=>{
              e.preventDefault();if(!editMode||!dragId||dragId===a.id){setDragId(null);setDragOverId(null);return}
              const reordered=[...items];const fromIdx=reordered.findIndex(x=>x.id===dragId);const[moved]=reordered.splice(fromIdx,1)
              const toIdx=reordered.findIndex(x=>x.id===a.id);reordered.splice(toIdx,0,moved)
              reordered.forEach((item,i)=>item.nummer=i+1);saveAll(reordered);setDragId(null);setDragOverId(null)
            }}
            onClick={()=>!dragId&&setSelected(a)}
            style={{cursor:editMode?'grab':'pointer',position:'relative',borderRadius:'var(--radius-md)',overflow:'hidden',border:dragOverId===a.id?'2px dashed var(--accent)':a.online?'2px solid var(--success)':'1px solid var(--border)',transition:'transform 0.15s,box-shadow 0.15s,opacity 0.15s',opacity:dragId===a.id?0.4:1}}
            onMouseEnter={e=>{if(!dragId)e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'}}
            onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=''}}>
            {editMode&&<button onClick={e=>{e.stopPropagation();del(a.id)}} style={{position:'absolute',top:'6px',right:'6px',width:'22px',height:'22px',borderRadius:'50%',background:'var(--danger)',color:'#fff',border:'none',cursor:'pointer',fontSize:'0.7rem',zIndex:2,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>}
            <div style={{aspectRatio:'1',background:a.thumbnail?`url(${a.thumbnail}) center/cover`:`linear-gradient(135deg, ${(a.kleuren||[])[0]?KLEUREN.find(k=>k.key===(a.kleuren||[])[0])?.hex||'#D6D3D1':'#D6D3D1'}, #F2F0EB)`,display:'flex',alignItems:'center',justifyContent:'center'}}>
              {!a.thumbnail&&<span style={{fontSize:'0.8rem',color:'rgba(0,0,0,0.15)',fontWeight:500,fontStyle:'italic'}}>{a.name?.slice(0,14)}</span>}
            </div>
            <div style={{padding:'0.5rem 0.6rem',background:'var(--bg-card)'}}>
              <div style={{fontSize:'0.72rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.02em',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {idx+1}. {a.name}</div>
              {a.format&&<div style={{fontSize:'0.65rem',color:'var(--text-secondary)',marginTop:'0.1rem'}}>{a.format}</div>}
              <div style={{display:'flex',gap:'0.2rem',marginTop:'0.3rem',alignItems:'center'}}>
                {(a.kleuren||[]).map(k=>{const kl=KLEUREN.find(x=>x.key===k);return kl?<span key={k} style={{width:'11px',height:'11px',borderRadius:'50%',background:kl.hex,border:k==='White'?'1px solid var(--border)':'none'}} title={kl.label}/>:null})}
                {!a.online&&<span style={{marginLeft:'auto',fontSize:'0.55rem',fontWeight:600,padding:'0.1rem 0.35rem',borderRadius:4,background:'#FEE2E2',color:'#DC2626',border:'1px solid #FECACA',whiteSpace:'nowrap'}}>niet actief</span>}
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
      {showAdd && <AddModal onSave={async a=>{await save({...a,id:`art-${Date.now()}`,createdAt:new Date().toISOString()});setShowAdd(false)}} onClose={()=>setShowAdd(false)} nextNum={items.length+1}/>}
    </>
  )
}

function Detail({art,onSave,onClose,onDel}) {
  const [a,setA]=useState({...art})
  const [saved,setSaved]=useState(false)
  const fRef=useRef()
  const upd=u=>{const n={...a,...u};setA(n);onSave(n);setSaved(true);setTimeout(()=>setSaved(false),1500)}
  const toggleK=k=>{const kl=a.kleuren||[];upd({kleuren:kl.includes(k)?kl.filter(x=>x!==k):[...kl,k]})}
  const handleImg=(e,field)=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=async()=>{const url=await processImage(r.result,a.id);upd({[field]:url})};r.readAsDataURL(f)}
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
            <div style={{display:'flex',gap:'0.35rem',alignItems:'center'}}>
              {saved&&<span style={{fontSize:'0.68rem',color:'#059669',fontWeight:600,animation:'fadeIn 0.2s'}}>✓ Opgeslagen</span>}
              <button onClick={()=>{if(confirm('Artwork verwijderen?'))onDel()}} style={{width:'28px',height:'28px',borderRadius:'50%',background:'var(--danger-light)',color:'var(--danger)',border:'none',cursor:'pointer',fontSize:'0.7rem'}} title="Verwijder">🗑</button>
              <button onClick={onClose} style={{width:'28px',height:'28px',borderRadius:'50%',background:'var(--bg-secondary)',color:'var(--text-secondary)',border:'none',cursor:'pointer',fontSize:'1rem'}} title="Sluiten">✕</button>
            </div>
          </div>
          <div style={{display:'flex',gap:'0.5rem',alignItems:'center',marginBottom:'0.5rem'}}>
            <input value={a.name||''} onChange={e=>upd({name:e.target.value})} className="form-input" style={{fontSize:'1.2rem',fontFamily:'var(--font-display)',fontWeight:400,border:'none',padding:'0',background:'transparent',flex:1}} placeholder="Naam..."/>
            <input value={a.nummer||''} onChange={e=>upd({nummer:parseInt(e.target.value)||0})} className="form-input" type="number" style={{width:'50px',fontSize:'0.82rem',textAlign:'center',padding:'0.25rem'}} title="Nummer"/>
          </div>
          <textarea value={a.description||''} onChange={e=>upd({description:e.target.value})} className="form-textarea" style={{fontSize:'0.82rem',minHeight:'70px',marginBottom:'0.75rem'}} placeholder="Beschrijving van het artwork..."/>

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
                  <span style={{width:'10px',height:'10px',borderRadius:'50%',background:k.hex,border:k.key==='White'?'1px solid var(--border)':'none'}}/>{k.label}
                </button>)})}
            </div>
          </div>

          {/* Opslaan knop */}
          <div style={{marginTop:'1rem',display:'flex',gap:'0.5rem'}}>
            <button onClick={onClose} className="btn btn-primary" style={{flex:1,fontSize:'0.82rem'}}>✓ Opslaan & sluiten</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AddModal({onSave,onClose,nextNum}) {
  const [f,setF]=useState({name:'',nummer:nextNum,format:'120 x 60',kleuren:[],frame:false,online:false,description:'',thumbnail:''})
  const toggleK=k=>setF(p=>({...p,kleuren:p.kleuren.includes(k)?p.kleuren.filter(x=>x!==k):[...p.kleuren,k]}))
  const imgRef=useRef(null)
  const [dragOver,setDragOver]=useState(false)
  const handleFile=file=>{if(!file||!file.type.startsWith('image/'))return;const reader=new FileReader();reader.onload=async ev=>{const url=await processImage(ev.target.result,`new-${Date.now()}`);setF(p=>({...p,thumbnail:url}))};reader.readAsDataURL(file)}
  const handleImg=e=>{handleFile(e.target.files?.[0])}
  const handleDrop=e=>{e.preventDefault();setDragOver(false);const file=e.dataTransfer?.files?.[0];handleFile(file)}
  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h3>Nieuw artwork</h3><button className="modal-close" onClick={onClose}>✕</button></div>
        {/* Thumbnail */}
        <div className="form-group" style={{marginBottom:'0.75rem'}}>
          <label className="form-label">Thumbnail</label>
          <div onClick={()=>imgRef.current?.click()}
            onDragOver={e=>{e.preventDefault();setDragOver(true)}}
            onDragLeave={()=>setDragOver(false)}
            onDrop={handleDrop}
            style={{width:'100%',height:'160px',borderRadius:'10px',border:`2px dashed ${dragOver?'var(--accent)':'var(--border)'}`,background:dragOver?'var(--accent-light)':'var(--bg-secondary)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s',overflow:'hidden',position:'relative'}}>
            {f.thumbnail ? (
              <>
                <img src={f.thumbnail} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="preview"/>
                <div onClick={e=>{e.stopPropagation();setF(p=>({...p,thumbnail:''}))}} style={{position:'absolute',top:'0.4rem',right:'0.4rem',background:'rgba(0,0,0,0.6)',color:'#fff',borderRadius:'50%',width:'24px',height:'24px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:'0.7rem',backdropFilter:'blur(4px)'}}>✕</div>
              </>
            ) : (
              <div style={{textAlign:'center',color:dragOver?'var(--accent)':'var(--text-secondary)'}}>
                <div style={{fontSize:'1.8rem',marginBottom:'0.3rem'}}>📷</div>
                <div style={{fontSize:'0.75rem',fontWeight:500}}>Sleep een afbeelding hierheen</div>
                <div style={{fontSize:'0.65rem',marginTop:'0.1rem'}}>of klik om te uploaden</div>
              </div>
            )}
          </div>
          <input ref={imgRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleImg}/>
          <input className="form-input" value={f.thumbnail?.startsWith('data:')?'':f.thumbnail||''} onChange={e=>setF({...f,thumbnail:e.target.value})} placeholder="Of plak een URL..." style={{marginTop:'0.35rem',fontSize:'0.75rem'}}/>
        </div>
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
              <span style={{width:'8px',height:'8px',borderRadius:'50%',background:k.hex,display:'inline-block',border:k.key==='White'?'1px solid #ccc':'none'}}/>{k.label}</button>)}
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