import { useState, useEffect } from 'react'
import { api } from '../api'

const KLEUREN = [
  { key: 'donkerblauw', label: 'Donkerblauw', hex: '#1B2A4A' },
  { key: 'zwart', label: 'Zwart', hex: '#1C1917' },
  { key: 'sahara', label: 'Sahara Zand', hex: '#D4B896' },
  { key: 'wit', label: 'Wit', hex: '#F5F0EB' },
  { key: 'terracotta', label: 'Terracotta', hex: '#C4624A' },
]
const FORMATS = {
  '60 x 60': { panels: 1, box: '70 x 70 x 10 cm' },
  '120 x 60': { panels: 2, box: '130 x 70 x 10 cm' },
  '100 x 70': { panels: 2, box: '110 x 80 x 10 cm' },
  '114 x 60': { panels: 2, box: '124 x 70 x 10 cm' },
  '70 x 100': { panels: 2, box: '80 x 110 x 10 cm' },
  '120 x 30': { panels: 1, box: '130 x 40 x 10 cm' },
  '90 cm': { panels: 1, box: '100 x 100 x 10 cm' },
}
const DEFAULT_STEPS = [
  { key: 'panelen', label: 'Panelen selecteren', desc: 'Juiste kleuren en hoeveelheid uit voorraad pakken' },
  { key: 'layout', label: 'Layout bepalen', desc: 'Compositie uitleggen volgens design referentie' },
  { key: 'snijden', label: 'Op maat snijden', desc: 'Panelen snijden op het juiste formaat' },
  { key: 'frame', label: 'Omlijsting monteren', desc: 'Houten lijst bevestigen (indien van toepassing)' },
  { key: 'ophanging', label: 'Ophangsysteem', desc: 'Ophangpunten bevestigen aan achterkant' },
  { key: 'qc', label: 'Kwaliteitscontrole', desc: 'Visuele inspectie, geen beschadigingen, rechte lijnen' },
  { key: 'foto', label: 'Productfoto', desc: 'Foto maken voor Shopify als dat nog niet is gedaan' },
  { key: 'verpakken', label: 'Verpakken', desc: 'Hoekbeschermers, bubbeltjesplastic, in doos' },
  { key: 'label', label: 'Label & documentatie', desc: 'Verzendlabel, pakbon, informatiekaartje erbij' },
]

export default function HowTo() {
  const [artworks, setArtworks] = useState([])
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [checkedSteps, setCheckedSteps] = useState({})

  useEffect(() => { api.getAll('catalog').then(setArtworks) }, [])

  useEffect(() => {
    const saved = localStorage.getItem('artazest_howto_checks')
    if (saved) setCheckedSteps(JSON.parse(saved))
  }, [])
  const toggleStep = (artId, stepKey) => {
    const next = { ...checkedSteps }
    const key = `${artId}_${stepKey}`
    next[key] = !next[key]
    setCheckedSteps(next)
    localStorage.setItem('artazest_howto_checks', JSON.stringify(next))
  }
  const isChecked = (artId, stepKey) => !!checkedSteps[`${artId}_${stepKey}`]
  const getProgress = (artId) => {
    const total = DEFAULT_STEPS.length
    const done = DEFAULT_STEPS.filter(s => isChecked(artId, s.key)).length
    return { done, total, pct: Math.round((done / total) * 100) }
  }
  const resetArt = (artId) => {
    const next = { ...checkedSteps }
    DEFAULT_STEPS.forEach(s => { delete next[`${artId}_${s.key}`] })
    setCheckedSteps(next)
    localStorage.setItem('artazest_howto_checks', JSON.stringify(next))
  }

  const filtered = artworks.filter(a => !search || a.name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.nummer || 99) - (b.nummer || 99))

  if (selected) {
    const a = selected
    const fmt = FORMATS[a.format] || { panels: 1, box: '—' }
    const prog = getProgress(a.id)
    return (
      <>
        <div className="page-header">
          <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
            <button className="btn btn-sm btn-outline" onClick={() => setSelected(null)}>← Terug</button>
            <div>
              <h1>How to make: {a.name}</h1>
              <p className="page-subtitle">{a.format || '—'} &middot; {(a.kleuren||[]).length} kleuren &middot; {a.frame ? 'Met lijst' : 'Zonder lijst'}</p>
            </div>
          </div>
          <button className="btn btn-sm btn-outline" onClick={() => resetArt(a.id)} style={{color:'var(--text-secondary)'}}>Reset checklist</button>
        </div>

        {/* Progress */}
        <div style={{marginBottom:'1.5rem'}}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.8rem',marginBottom:'0.35rem'}}>
            <span style={{fontWeight:600}}>{prog.done}/{prog.total} stappen</span>
            <span style={{color:prog.pct===100?'var(--success)':'var(--text-secondary)'}}>{prog.pct}%</span>
          </div>
          <div className="progress-bar"><div className="progress-fill" style={{width:`${prog.pct}%`,background:prog.pct===100?'var(--success)':'var(--accent)'}}/></div>
        </div>

        {/* Specs cards */}
        <div className="metric-grid" style={{marginBottom:'1.5rem'}}>
          <div className="metric-card">
            <div className="metric-label">Formaat</div>
            <div className="metric-value" style={{fontSize:'1.3rem'}}>{a.format || '—'}</div>
            <div style={{fontSize:'0.75rem',color:'var(--text-secondary)',marginTop:'0.25rem'}}>Doos: {fmt.box}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Panelen nodig</div>
            <div className="metric-value">{fmt.panels}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Omlijsting</div>
            <div className="metric-value" style={{fontSize:'1.3rem'}}>{a.frame ? 'Ja' : 'Nee'}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Kleuren</div>
            <div style={{display:'flex',gap:'0.35rem',marginTop:'0.35rem',flexWrap:'wrap'}}>
              {(a.kleuren||[]).map(k => { const kl = KLEUREN.find(x => x.key === k); return kl ? (
                <span key={k} style={{display:'flex',alignItems:'center',gap:'0.3rem',padding:'0.15rem 0.5rem',borderRadius:'99px',fontSize:'0.75rem',background:'var(--bg-card)',border:'1px solid var(--border)'}}>
                  <span style={{width:'8px',height:'8px',borderRadius:'50%',background:kl.hex,border:k==='wit'?'1px solid var(--border)':'none'}}/>{kl.label}
                </span>) : null })}
            </div>
          </div>
        </div>

        {/* Thumbnail if available */}
        {a.thumbnail && (
          <div className="card" style={{marginBottom:'1.5rem',padding:'0.75rem',display:'flex',justifyContent:'center'}}>
            <img src={a.thumbnail} style={{maxHeight:'200px',borderRadius:'var(--radius-md)'}} alt={a.name}/>
          </div>
        )}

        {/* Production steps */}
        <div className="card">
          <h3 className="section-title" style={{marginBottom:'1rem'}}>Productiestappen</h3>
          <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
            {DEFAULT_STEPS.map((step, idx) => {
              if (step.key === 'frame' && !a.frame) return null
              const checked = isChecked(a.id, step.key)
              return (
                <div key={step.key} onClick={() => toggleStep(a.id, step.key)}
                  style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.75rem 1rem',borderRadius:'var(--radius-md)',border:'1px solid var(--border)',cursor:'pointer',background:checked?'var(--success-light)':'var(--bg-card)',transition:'all 0.15s',opacity:checked?0.7:1}}>
                  <div style={{width:'28px',height:'28px',borderRadius:'50%',border:checked?'none':'2px solid var(--border-strong)',background:checked?'var(--success)':'none',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'#fff',fontSize:'0.8rem',fontWeight:700}}>{checked?'✓':idx+1}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:500,fontSize:'0.9rem',textDecoration:checked?'line-through':'none'}}>{step.label}</div>
                    <div style={{fontSize:'0.78rem',color:'var(--text-secondary)'}}>{step.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </>
    )
  }

  // Overview: all artworks
  return (
    <>
      <div className="page-header">
        <div><h1>How to make it?</h1>
          <p className="page-subtitle">Productiegids per artwork</p></div>
      </div>

      <input className="form-input" placeholder="Zoek artwork..." value={search} onChange={e => setSearch(e.target.value)}
        style={{marginBottom:'1.5rem',maxWidth:'300px'}}/>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))',gap:'1rem'}}>
        {filtered.map(a => {
          const prog = getProgress(a.id)
          const fmt = FORMATS[a.format] || {}
          return (
            <div key={a.id} onClick={() => setSelected(a)} className="card" style={{cursor:'pointer',padding:'0',overflow:'hidden',transition:'transform 0.15s,box-shadow 0.15s'}}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'}}
              onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=''}}>
              {a.thumbnail ? (
                <div style={{height:'120px',background:`url(${a.thumbnail}) center/cover`,borderBottom:'1px solid var(--border)'}}/>
              ) : (
                <div style={{height:'120px',background:`linear-gradient(135deg, ${(a.kleuren||[])[0]?KLEUREN.find(k=>k.key===(a.kleuren||[])[0])?.hex||'#D6D3D1':'#D6D3D1'}, #F2F0EB)`,borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <span style={{fontSize:'0.85rem',color:'rgba(0,0,0,0.15)',fontStyle:'italic'}}>{a.name}</span>
                </div>
              )}
              <div style={{padding:'0.75rem'}}>
                <div style={{fontWeight:600,fontSize:'0.85rem',marginBottom:'0.25rem'}}>{a.nummer?`${a.nummer}. `:''}{a.name}</div>
                <div style={{fontSize:'0.72rem',color:'var(--text-secondary)',marginBottom:'0.5rem'}}>
                  {a.format||'—'} &middot; {fmt.panels||'?'} paneel{(fmt.panels||0)>1?'en':''} &middot; {a.frame?'Met lijst':'Zonder'}
                </div>
                <div style={{display:'flex',gap:'0.2rem',marginBottom:'0.5rem'}}>
                  {(a.kleuren||[]).map(k=>{const kl=KLEUREN.find(x=>x.key===k);return kl?<span key={k} style={{width:'10px',height:'10px',borderRadius:'50%',background:kl.hex,border:k==='wit'?'1px solid var(--border)':'none'}}/>:null})}
                </div>
                <div className="progress-bar" style={{height:'4px'}}>
                  <div className="progress-fill" style={{width:`${prog.pct}%`,background:prog.pct===100?'var(--success)':'var(--accent)'}}/>
                </div>
                <div style={{fontSize:'0.68rem',color:prog.pct===100?'var(--success)':'var(--text-secondary)',marginTop:'0.2rem'}}>{prog.pct===100?'Compleet':prog.done>0?`${prog.done}/${prog.total} stappen`:'Niet gestart'}</div>
              </div>
            </div>
          )
        })}
      </div>
      {filtered.length===0&&<div className="card"><div className="empty-state">Geen artworks in catalogus. Voeg eerst artworks toe in de Catalogus pagina.</div></div>}
    </>
  )
}