import { useState, useEffect } from 'react'
import { api } from '../api'
import { ARTAZEST_COLORS, brandName, colorHex, colorKeys } from '../colors'

const PANEL_COLORS = colorKeys
const COLOR_HEX = Object.fromEntries(ARTAZEST_COLORS.map(c => [c.key, c.hex]))

export default function Stock() {
  const [artworks, setArtworks] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name:'', image:'', primaryColor:PANEL_COLORS[0] })

  useEffect(() => {
    api.getSetting('artwork_stock').then(val => { if (val?.length) setArtworks(val) })
  }, [])

  const save = items => { setArtworks(items); api.saveSetting('artwork_stock', items) }

  const addArtwork = () => {
    if (!form.name.trim()) return
    const colors = {}
    PANEL_COLORS.forEach(c => { colors[c] = 0 })
    save([...artworks, { id:`art${Date.now()}`, name:form.name.trim(), image:form.image.trim(), primaryColor:form.primaryColor, colors, total:0 }])
    setForm({ name:'', image:'', primaryColor:PANEL_COLORS[0] }); setShowAdd(false)
  }

  const updateQty = (artId, color, delta) => {
    save(artworks.map(a => {
      if (a.id !== artId) return a
      const colors = { ...a.colors, [color]: Math.max(0, (a.colors[color]||0) + delta) }
      const total = Object.values(colors).reduce((s,v) => s+v, 0)
      return { ...a, colors, total }
    }))
  }

  const updateField = (artId, field, value) => {
    save(artworks.map(a => a.id===artId ? { ...a, [field]:value } : a))
  }

  const removeArtwork = id => save(artworks.filter(a => a.id!==id))

  const totalStock = artworks.reduce((s,a) => s+a.total, 0)
  const totalArtworks = artworks.length

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Voorraad</h1>
          <p className="page-subtitle">{totalArtworks} kunstwerken · {totalStock} panelen op voorraad</p>
        </div>
        <button onClick={()=>setShowAdd(!showAdd)} style={{padding:'0.4rem 0.8rem',borderRadius:'8px',background:'var(--accent)',color:'#fff',border:'none',cursor:'pointer',fontSize:'0.78rem',fontWeight:600}}>
          + Kunstwerk
        </button>
      </div>

      {showAdd && (
        <div className="card" style={{marginBottom:'1.25rem',padding:'0.85rem'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 150px',gap:'0.5rem',marginBottom:'0.5rem'}}>
            <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Naam kunstwerk"
              style={{padding:'0.4rem 0.6rem',borderRadius:'6px',border:'1px solid var(--border)',fontSize:'0.8rem',fontFamily:'var(--font-body)'}}/>
            <input value={form.image} onChange={e=>setForm({...form,image:e.target.value})} placeholder="Foto URL (optioneel)"
              style={{padding:'0.4rem 0.6rem',borderRadius:'6px',border:'1px solid var(--border)',fontSize:'0.8rem',fontFamily:'var(--font-body)'}}/>
            <select value={form.primaryColor} onChange={e=>setForm({...form,primaryColor:e.target.value})}
              style={{padding:'0.4rem',borderRadius:'6px',border:'1px solid var(--border)',fontSize:'0.8rem',fontFamily:'var(--font-body)'}}>
              {PANEL_COLORS.map(c=><option key={c} value={c}>{brandName(c)}</option>)}
            </select>
          </div>
          <div style={{display:'flex',gap:'0.4rem',justifyContent:'flex-end'}}>
            <button onClick={()=>setShowAdd(false)} style={{padding:'0.35rem 0.7rem',borderRadius:'6px',border:'1px solid var(--border)',background:'none',cursor:'pointer',fontSize:'0.75rem'}}>Annuleer</button>
            <button onClick={addArtwork} style={{padding:'0.35rem 0.7rem',borderRadius:'6px',background:'var(--accent)',color:'#fff',border:'none',cursor:'pointer',fontSize:'0.75rem',fontWeight:600}}>Toevoegen</button>
          </div>
        </div>
      )}

      {/* Artwork grid */}
      <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
        {artworks.map((art, idx) => {
          const isOpen = expanded === art.id
          return (
            <div key={art.id} className="card" style={{padding:0,overflow:'hidden',borderLeft:`4px solid ${COLOR_HEX[art.primaryColor]||'var(--accent)'}`}}>
              {/* Main row */}
              <div style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.65rem 0.85rem',cursor:'pointer'}}
                onClick={()=>setExpanded(isOpen?null:art.id)}>
                {/* Thumbnail */}
                <div style={{width:'52px',height:'52px',borderRadius:'8px',overflow:'hidden',flexShrink:0,background:'var(--bg-secondary)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {art.image ? (
                    <img src={art.image} alt={art.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  ) : (
                    <span style={{fontSize:'1.5rem'}}>🖼</span>
                  )}
                </div>

                {/* Name + color */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:'0.88rem',marginBottom:'0.1rem'}}>{art.name}</div>
                  <div style={{display:'flex',alignItems:'center',gap:'0.3rem'}}>
                    <span style={{width:'10px',height:'10px',borderRadius:'50%',background:COLOR_HEX[art.primaryColor],border:'1px solid rgba(0,0,0,0.1)',flexShrink:0}}/>
                    <span style={{fontSize:'0.72rem',color:'var(--text-secondary)'}}>{art.primaryColor}</span>
                  </div>
                </div>

                {/* Total quantity */}
                <div style={{textAlign:'center',flexShrink:0,minWidth:'70px'}}>
                  <div style={{fontSize:'1.4rem',fontWeight:700,color:art.total>0?'var(--text-primary)':'var(--text-secondary)'}}>{art.total}</div>
                  <div style={{fontSize:'0.62rem',color:'var(--text-secondary)'}}>op voorraad</div>
                </div>

                {/* Quick +/- for primary color */}
                <div style={{display:'flex',alignItems:'center',gap:'0.3rem',flexShrink:0}} onClick={e=>e.stopPropagation()}>
                  <button onClick={()=>updateQty(art.id,art.primaryColor,-1)} style={{width:'28px',height:'28px',borderRadius:'50%',border:'1px solid var(--border)',background:'none',cursor:'pointer',fontSize:'0.9rem',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-secondary)'}}>−</button>
                  <span style={{fontWeight:700,minWidth:'28px',textAlign:'center',fontSize:'0.9rem'}}>{art.colors[art.primaryColor]||0}</span>
                  <button onClick={()=>updateQty(art.id,art.primaryColor,1)} style={{width:'28px',height:'28px',borderRadius:'50%',border:'1px solid var(--border)',background:'none',cursor:'pointer',fontSize:'0.9rem',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-secondary)'}}>+</button>
                </div>

                <span style={{color:'var(--text-secondary)',fontSize:'0.7rem',flexShrink:0}}>{isOpen?'▲':'▼'}</span>
              </div>

              {/* Expanded: all colors */}
              {isOpen && (
                <div style={{borderTop:'1px solid var(--border)',padding:'0.75rem 0.85rem',background:'var(--bg-secondary)'}}>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:'0.5rem',marginBottom:'0.75rem'}}>
                    {PANEL_COLORS.map(color => {
                      const qty = art.colors[color] || 0
                      const isPrimary = color === art.primaryColor
                      return (
                        <div key={color} style={{padding:'0.5rem',borderRadius:'8px',border:`1.5px solid ${isPrimary?COLOR_HEX[color]+'80':'var(--border)'}`,background:'var(--bg-card)'}}>
                          <div style={{display:'flex',alignItems:'center',gap:'0.3rem',marginBottom:'0.35rem'}}>
                            <span style={{width:'12px',height:'12px',borderRadius:'50%',background:COLOR_HEX[color],border:'1px solid rgba(0,0,0,0.1)',flexShrink:0}}/>
                            <span style={{fontSize:'0.75rem',fontWeight:isPrimary?700:500}}>{brandName(color)}</span>
                            {isPrimary && <span style={{fontSize:'0.55rem',padding:'0.05rem 0.25rem',borderRadius:'99px',background:COLOR_HEX[color],color:color==='White'||color==='Light tan'||color==='Beige'?'#1C1917':'#fff',fontWeight:700,marginLeft:'auto'}}>primair</span>}
                          </div>
                          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'0.4rem'}}>
                            <button onClick={()=>updateQty(art.id,color,-1)} style={{width:'26px',height:'26px',borderRadius:'50%',border:'1px solid var(--border)',background:'none',cursor:'pointer',fontSize:'0.85rem',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-secondary)'}}>−</button>
                            <span style={{fontWeight:700,fontSize:'1.1rem',minWidth:'30px',textAlign:'center'}}>{qty}</span>
                            <button onClick={()=>updateQty(art.id,color,1)} style={{width:'26px',height:'26px',borderRadius:'50%',border:'1px solid var(--border)',background:'none',cursor:'pointer',fontSize:'0.85rem',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-secondary)'}}>+</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Edit fields */}
                  <div style={{display:'flex',gap:'0.4rem',alignItems:'center',flexWrap:'wrap'}}>
                    <input value={art.image} onChange={e=>updateField(art.id,'image',e.target.value)} placeholder="Foto URL..."
                      style={{flex:1,minWidth:'150px',padding:'0.3rem 0.5rem',borderRadius:'4px',border:'1px solid var(--border)',fontSize:'0.72rem',fontFamily:'var(--font-body)',background:'var(--bg-card)'}}/>
                    <select value={art.primaryColor} onChange={e=>updateField(art.id,'primaryColor',e.target.value)}
                      style={{padding:'0.3rem',borderRadius:'4px',border:'1px solid var(--border)',fontSize:'0.72rem',fontFamily:'var(--font-body)',background:'var(--bg-card)'}}>
                      {PANEL_COLORS.map(c=><option key={c} value={c}>{brandName(c)}</option>)}
                    </select>
                    <button onClick={()=>{if(confirm(`"${art.name}" verwijderen?`))removeArtwork(art.id)}}
                      style={{padding:'0.3rem 0.5rem',borderRadius:'4px',border:'1px solid #DC2626',background:'none',color:'#DC2626',cursor:'pointer',fontSize:'0.68rem',fontWeight:600}}>Verwijder</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {artworks.length===0 && !showAdd && (
        <div className="card" style={{textAlign:'center',padding:'2rem',color:'var(--text-secondary)'}}>
          <div style={{fontSize:'2rem',marginBottom:'0.5rem'}}>🎨</div>
          <div style={{fontSize:'0.88rem',marginBottom:'0.25rem'}}>Nog geen kunstwerken</div>
          <div style={{fontSize:'0.75rem'}}>Voeg je eerste kunstwerk toe met de knop hierboven</div>
        </div>
      )}
    </>
  )
}
