import { useState, useEffect } from 'react'
import { api } from '../api'

const KLEUREN = [
  { key: 'donkerblauw', label: 'Donkerblauw', hex: '#1B2A4A' },
  { key: 'zwart', label: 'Zwart', hex: '#1C1917' },
  { key: 'sahara', label: 'Sahara Zand', hex: '#D4B896' },
  { key: 'wit', label: 'Wit', hex: '#F5F0EB' },
  { key: 'terracotta', label: 'Terracotta', hex: '#C4624A' },
]

export default function HowToMake() {
  const [artworks, setArtworks] = useState([])
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  useEffect(() => { api.getAll('catalog').then(setArtworks) }, [])
  const reload = () => api.getAll('catalog').then(setArtworks)
  const save = async a => { await api.save('catalog', a); reload() }
  const filtered = artworks.filter(a => !search || a.name?.toLowerCase().includes(search.toLowerCase())).sort((a,b) => (a.nummer||99) - (b.nummer||99))
  const art = selected ? artworks.find(a => a.id === selected) : null
  return (
    <>
      <div className="page-header">
        <div><h1>How to Make</h1><p className="page-subtitle">Productie-instructies per artwork</p></div>
        <input className="form-input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Zoek artwork..." style={{maxWidth:'220px'}}/>
      </div>
      {!selected ? (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))',gap:'0.75rem'}}>
          {filtered.map(a=>(
            <div key={a.id} onClick={()=>setSelected(a.id)} style={{cursor:'pointer',borderRadius:'var(--radius-md)',overflow:'hidden',border:'1px solid var(--border)',transition:'transform 0.15s,box-shadow 0.15s'}}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'}}
              onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=''}}>
              <div style={{aspectRatio:'1',background:a.thumbnail?`url(${a.thumbnail}) center/cover`:`linear-gradient(135deg, ${(a.kleuren||[])[0]?KLEUREN.find(k=>k.key===(a.kleuren||[])[0])?.hex||'#D6D3D1':'#D6D3D1'}, #F2F0EB)`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                {!a.thumbnail&&<span style={{fontSize:'0.8rem',color:'rgba(0,0,0,0.15)',fontWeight:500,fontStyle:'italic'}}>{a.name?.slice(0,14)}</span>}
              </div>
              <div style={{padding:'0.5rem 0.6rem',background:'var(--bg-card)'}}>
                <div style={{fontSize:'0.72rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.02em',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.nummer?`${a.nummer}. `:''}{a.name}</div>
                {a.format&&<div style={{fontSize:'0.65rem',color:'var(--text-secondary)',marginTop:'0.1rem'}}>{a.format}</div>}
                <div style={{display:'flex',gap:'0.2rem',marginTop:'0.3rem'}}>{(a.kleuren||[]).map(k=>{const kl=KLEUREN.find(x=>x.key===k);return kl?<span key={k} style={{width:'10px',height:'10px',borderRadius:'50%',background:kl.hex,border:k==='wit'?'1px solid var(--border)':'none'}}/>:null})}</div>
                {a.howto?.stappen?.length>0&&<div style={{fontSize:'0.6rem',color:'var(--success)',marginTop:'0.2rem',fontWeight:600}}>✓ {a.howto.stappen.filter(s=>s.klaar).length}/{a.howto.stappen.length} stappen</div>}
              </div>
            </div>
          ))}
        </div>      ) : art ? (
        <div>
          <button className="btn btn-outline btn-sm" onClick={()=>setSelected(null)} style={{marginBottom:'1rem'}}>← Terug</button>
          <div style={{display:'grid',gridTemplateColumns:'260px 1fr',gap:'1.5rem'}}>
            <div>
              <div style={{borderRadius:'var(--radius-md)',overflow:'hidden',border:'1px solid var(--border)',marginBottom:'1rem'}}>
                {art.thumbnail?<img src={art.thumbnail} style={{width:'100%',aspectRatio:'1',objectFit:'cover'}} alt=""/>
                :<div style={{width:'100%',aspectRatio:'1',background:`linear-gradient(135deg,${(art.kleuren||[])[0]?KLEUREN.find(k=>k.key===(art.kleuren||[])[0])?.hex||'#D6D3D1':'#D6D3D1'},#F2F0EB)`,display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{color:'rgba(0,0,0,0.15)',fontSize:'1rem'}}>{art.name}</span></div>}
              </div>
              <div className="card">
                <h3 style={{fontSize:'1.2rem',margin:'0 0 0.25rem'}}>{art.nummer?`${art.nummer}. `:''}{art.name}</h3>
                {art.format&&<div style={{fontSize:'0.82rem',color:'var(--text-secondary)',marginBottom:'0.5rem'}}>{art.format}</div>}
                {art.description&&<p style={{fontSize:'0.82rem',color:'var(--text-secondary)',marginBottom:'0.75rem'}}>{art.description}</p>}
                <div style={{display:'flex',gap:'0.3rem',flexWrap:'wrap'}}>
                  {(art.kleuren||[]).map(k=>{const kl=KLEUREN.find(x=>x.key===k);return kl?<span key={k} style={{display:'flex',alignItems:'center',gap:'0.25rem',padding:'0.15rem 0.5rem',borderRadius:'99px',fontSize:'0.7rem',fontWeight:600,background:'var(--bg-secondary)'}}><span style={{width:'8px',height:'8px',borderRadius:'50%',background:kl.hex,border:k==='wit'?'1px solid var(--border)':'none'}}/>{kl.label}</span>:null})}
                </div>
                {art.frame&&<div style={{marginTop:'0.5rem',fontSize:'0.75rem',color:'var(--accent)'}}>◻ Met houten lijst</div>}
              </div>
            </div>
            <div><HowToEditor art={art} onSave={save}/></div>
          </div>
        </div>
      ) : null}
    </>
  )
}
function HowToEditor({art,onSave}) {
  const howto = art.howto||{materialen:'',stappen:[],notities:''}
  const upd=(f,v)=>onSave({...art,howto:{...howto,[f]:v}})
  const addStap=()=>upd('stappen',[...(howto.stappen||[]),{titel:'',beschrijving:'',klaar:false}])
  const updStap=(i,f,v)=>{const s=[...(howto.stappen||[])];s[i]={...s[i],[f]:v};upd('stappen',s)}
  const delStap=i=>upd('stappen',(howto.stappen||[]).filter((_,j)=>j!==i))
  const moveStap=(i,d)=>{const s=[...(howto.stappen||[])];const n=i+d;if(n<0||n>=s.length)return;[s[i],s[n]]=[s[n],s[i]];upd('stappen',s)}
  const done=(howto.stappen||[]).filter(s=>s.klaar).length, total=(howto.stappen||[]).length

  return (
    <>
      {total>0&&<div style={{marginBottom:'1.25rem',padding:'1rem',background:done===total&&total>0?'var(--success-light)':'var(--bg-secondary)',borderRadius:'var(--radius-md)'}}>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.82rem',marginBottom:'0.35rem'}}>
          <span style={{fontWeight:600}}>Productie voortgang</span><span style={{color:'var(--text-secondary)'}}>{done}/{total} stappen</span></div>
        <div className="progress-bar"><div className="progress-fill" style={{width:`${total>0?(done/total)*100:0}%`,background:done===total?'var(--success)':undefined}}/></div>
      </div>}

      <div className="card" style={{marginBottom:'1rem'}}>
        <h3 className="section-title" style={{marginBottom:'0.5rem'}}>Benodigde materialen</h3>
        <textarea className="form-textarea" value={howto.materialen||''} onChange={e=>upd('materialen',e.target.value)}
          placeholder={"Bijv:\n- 2x akoestisch paneel Donkerblauw 60x60\n- 1x houten lijst eiken\n- Montagekit"} style={{minHeight:'100px',fontSize:'0.85rem'}}/>
      </div>
      <div className="card" style={{marginBottom:'1rem'}}>
        <div className="section-header"><h3 className="section-title">Productiestappen</h3><button className="btn btn-sm btn-primary" onClick={addStap}>+ Stap</button></div>
        {total===0?<div className="empty-state" style={{padding:'1.5rem'}}>Nog geen stappen. Klik "+ Stap" om te beginnen.</div>:
        <div style={{display:'flex',flexDirection:'column',gap:'0.5rem',marginTop:'0.75rem'}}>
          {(howto.stappen||[]).map((stap,idx)=>(
            <div key={idx} style={{display:'flex',gap:'0.75rem',padding:'0.75rem',background:stap.klaar?'var(--success-light)':'var(--bg-secondary)',borderRadius:'var(--radius-md)',alignItems:'flex-start',opacity:stap.klaar?0.7:1}}>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'0.25rem',paddingTop:'0.1rem'}}>
                <div onClick={()=>updStap(idx,'klaar',!stap.klaar)} className={`task-checkbox ${stap.klaar?'checked':''}`} style={{width:'22px',height:'22px'}}/>
                <span style={{fontSize:'0.65rem',color:'var(--text-secondary)',fontWeight:600}}>{idx+1}</span>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <input value={stap.titel||''} onChange={e=>updStap(idx,'titel',e.target.value)} placeholder="Stap titel..."
                  style={{width:'100%',border:'none',background:'transparent',fontSize:'0.85rem',fontWeight:600,fontFamily:'var(--font-body)',padding:'0 0 0.25rem',outline:'none',textDecoration:stap.klaar?'line-through':'none'}}/>
                <textarea value={stap.beschrijving||''} onChange={e=>updStap(idx,'beschrijving',e.target.value)} placeholder="Beschrijving, tips..."
                  style={{width:'100%',border:'none',background:'transparent',fontSize:'0.8rem',fontFamily:'var(--font-body)',padding:0,outline:'none',resize:'vertical',minHeight:'36px',color:'var(--text-secondary)'}}/>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'0.15rem'}}>
                <button onClick={()=>moveStap(idx,-1)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'0.6rem',color:'var(--text-secondary)',padding:'2px'}}>▲</button>
                <button onClick={()=>moveStap(idx,1)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'0.6rem',color:'var(--text-secondary)',padding:'2px'}}>▼</button>
                <button onClick={()=>delStap(idx)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'0.7rem',color:'var(--danger)',padding:'2px'}}>✕</button>
              </div>
            </div>
          ))}
        </div>}
      </div>

      <div className="card">
        <h3 className="section-title" style={{marginBottom:'0.5rem'}}>Productie notities</h3>
        <textarea className="form-textarea" value={howto.notities||''} onChange={e=>upd('notities',e.target.value)}
          placeholder="Extra opmerkingen, droogtijden, aandachtspunten..." style={{minHeight:'80px',fontSize:'0.85rem'}}/>
      </div>
    </>
  )
}