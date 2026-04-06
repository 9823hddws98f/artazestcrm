import { useState, useEffect } from 'react'
import { api } from '../api'

const DEFAULT_QA = [
  { id:'q1', cat:'Shopify', label:'Alle productpagina\'s live met foto\'s + specs', checked:false, by:null, at:null },
  { id:'q2', cat:'Shopify', label:'Prijzen correct ingesteld (incl. BTW)', checked:false, by:null, at:null },
  { id:'q3', cat:'Shopify', label:'Verzendkosten correct berekend', checked:false, by:null, at:null },
  { id:'q4', cat:'Shopify', label:'Kortingscodes werken', checked:false, by:null, at:null },
  { id:'q5', cat:'Shopify', label:'Winkelwagentje + checkout flow volledig getest', checked:false, by:null, at:null },
  { id:'q6', cat:'Shopify', label:'Bestelbevestiging email triggert correct', checked:false, by:null, at:null },
  { id:'q7', cat:'Shopify', label:'Wachtwoord pagina verwijderd / store open', checked:false, by:null, at:null },
  { id:'q8', cat:'Betaling', label:'Shopify Payments actief + geverifieerd', checked:false, by:null, at:null },
  { id:'q9', cat:'Betaling', label:'Testbestelling met echte kaart gedaan', checked:false, by:null, at:null },
  { id:'q10', cat:'Betaling', label:'iDEAL / Bancontact actief (NL/BE)', checked:false, by:null, at:null },
  { id:'q11', cat:'Betaling', label:'Refund flow getest', checked:false, by:null, at:null },
  { id:'q12', cat:'Analytics', label:'GA4 property aangemaakt + Enhanced E-commerce aan', checked:false, by:null, at:null },
  { id:'q13', cat:'Analytics', label:'Meta Pixel geïnstalleerd + events testen', checked:false, by:null, at:null },
  { id:'q14', cat:'Analytics', label:'Google Tag Manager live', checked:false, by:null, at:null },
  { id:'q15', cat:'Analytics', label:'Microsoft Clarity geïnstalleerd (heatmaps)', checked:false, by:null, at:null },
  { id:'q16', cat:'Analytics', label:'Conversie events vuren correct (purchase, add_to_cart)', checked:false, by:null, at:null },
  { id:'q17', cat:'Mobiel', label:'Checkout getest op iOS Safari', checked:false, by:null, at:null },
  { id:'q18', cat:'Mobiel', label:'Checkout getest op Android Chrome', checked:false, by:null, at:null },
  { id:'q19', cat:'Mobiel', label:'Apple Pay / Google Pay actief', checked:false, by:null, at:null },
  { id:'q20', cat:'Mobiel', label:'Afbeeldingen laden snel op mobiel', checked:false, by:null, at:null },
  { id:'q21', cat:'Email', label:'Klaviyo welkomstmail actief', checked:false, by:null, at:null },
  { id:'q22', cat:'Email', label:'Abandoned cart flow actief', checked:false, by:null, at:null },
  { id:'q23', cat:'Email', label:'Launch email klaar + gepland', checked:false, by:null, at:null },
  { id:'q24', cat:'Email', label:'Post-purchase email flow actief', checked:false, by:null, at:null },
  { id:'q25', cat:'Content', label:'Alle social media posts gepland voor launch', checked:false, by:null, at:null },
  { id:'q26', cat:'Content', label:'Instagram bio + link-in-bio bijgewerkt', checked:false, by:null, at:null },
  { id:'q27', cat:'Content', label:'About pagina compleet', checked:false, by:null, at:null },
  { id:'q28', cat:'Content', label:'FAQ / veelgestelde vragen pagina live', checked:false, by:null, at:null },
  { id:'q29', cat:'Juridisch', label:'Algemene voorwaarden gepubliceerd', checked:false, by:null, at:null },
  { id:'q30', cat:'Juridisch', label:'Privacybeleid live', checked:false, by:null, at:null },
  { id:'q31', cat:'Juridisch', label:'Retourbeleid duidelijk op site', checked:false, by:null, at:null },
  { id:'q32', cat:'Juridisch', label:'Cookie banner actief', checked:false, by:null, at:null },
]

const DEFAULT_PIXELS = [
  { id:'p1', name:'GA4', status:'unknown', url:'https://analytics.google.com', lastChecked:null, notes:'' },
  { id:'p2', name:'Meta Pixel', status:'unknown', url:'https://business.facebook.com/events_manager', lastChecked:null, notes:'' },
  { id:'p3', name:'Google Tag Manager', status:'unknown', url:'https://tagmanager.google.com', lastChecked:null, notes:'' },
  { id:'p4', name:'Microsoft Clarity', status:'unknown', url:'https://clarity.microsoft.com', lastChecked:null, notes:'' },
  { id:'p5', name:'Klaviyo tracking', status:'unknown', url:'https://www.klaviyo.com', lastChecked:null, notes:'' },
  { id:'p6', name:'Shopify Analytics', status:'unknown', url:'https://admin.shopify.com', lastChecked:null, notes:'' },
]

const CATS = ['Shopify','Betaling','Analytics','Mobiel','Email','Content','Juridisch']
const CAT_ICONS = { Shopify:'🛒', Betaling:'💳', Analytics:'📊', Mobiel:'📱', Email:'📧', Content:'📝', Juridisch:'⚖️' }
const STATUS_COLORS = { active:'#059669', inactive:'#DC2626', unknown:'#9CA3AF', partial:'#D97706' }
const STATUS_LABELS = { active:'Actief', inactive:'Niet actief', unknown:'Onbekend', partial:'Deels' }

export default function Launch() {
  const [qa, setQa] = useState(DEFAULT_QA)
  const [pixels, setPixels] = useState(DEFAULT_PIXELS)
  const [showAdd, setShowAdd] = useState(false)
  const [newItem, setNewItem] = useState({ cat:'Shopify', label:'' })
  const user = JSON.parse(localStorage.getItem('artazest_user')||'{}')

  useEffect(() => {
    api.getSetting('qa_checklist').then(val => { if (val?.length) setQa(val) })
    api.getSetting('tracking_pixels').then(val => { if (val?.length) setPixels(val) })
  }, [])

  const saveQa = items => { setQa(items); api.saveSetting('qa_checklist', items) }
  const savePixels = items => { setPixels(items); api.saveSetting('tracking_pixels', items) }

  const toggleQa = id => {
    const now = new Date().toISOString()
    saveQa(qa.map(q => q.id===id ? { ...q, checked:!q.checked, by:!q.checked?user.name:null, at:!q.checked?now:null } : q))
  }

  const addItem = () => {
    if (!newItem.label.trim()) return
    saveQa([...qa, { id:`q${Date.now()}`, cat:newItem.cat, label:newItem.label.trim(), checked:false, by:null, at:null }])
    setNewItem({ cat:'Shopify', label:'' }); setShowAdd(false)
  }

  const removeItem = id => saveQa(qa.filter(q => q.id !== id))

  const setPixelStatus = (id, status) => {
    savePixels(pixels.map(p => p.id===id ? { ...p, status, lastChecked: new Date().toISOString() } : p))
  }

  const checked = qa.filter(q => q.checked).length
  const total = qa.length
  const pct = total > 0 ? Math.round(checked/total*100) : 0
  const pixelActive = pixels.filter(p => p.status==='active').length

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Launch Readiness</h1>
          <p className="page-subtitle">QA checklist & tracking status — {pct}% klaar</p>
        </div>
      </div>

      {/* Readiness score */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'1rem',marginBottom:'1.5rem'}}>
        <div className="card" style={{textAlign:'center',padding:'1.25rem'}}>
          <div style={{fontSize:'2rem',fontWeight:700,color:pct===100?'#059669':pct>=70?'var(--accent)':'#DC2626'}}>{pct}%</div>
          <div style={{fontSize:'0.75rem',color:'var(--text-secondary)'}}>QA Checklist</div>
          <div style={{fontSize:'0.68rem',color:'var(--text-secondary)',marginTop:'0.15rem'}}>{checked}/{total} items</div>
        </div>
        <div className="card" style={{textAlign:'center',padding:'1.25rem'}}>
          <div style={{fontSize:'2rem',fontWeight:700,color:pixelActive===pixels.length?'#059669':pixelActive>0?'var(--accent)':'#DC2626'}}>{pixelActive}/{pixels.length}</div>
          <div style={{fontSize:'0.75rem',color:'var(--text-secondary)'}}>Pixels actief</div>
        </div>
        <div className="card" style={{textAlign:'center',padding:'1.25rem'}}>
          <div style={{fontSize:'2rem',fontWeight:700,color:pct===100&&pixelActive===pixels.length?'#059669':'#DC2626'}}>{pct===100&&pixelActive===pixels.length?'GO':'NO GO'}</div>
          <div style={{fontSize:'0.75rem',color:'var(--text-secondary)'}}>Launch status</div>
        </div>
      </div>

      {/* Tracking Pixels */}
      <div className="card" style={{marginBottom:'1.5rem'}}>
        <h3 className="section-title" style={{marginBottom:'0.75rem'}}>Tracking Pixels</h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'0.5rem'}}>
          {pixels.map(p => (
            <div key={p.id} style={{padding:'0.6rem 0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-card)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.3rem'}}>
                <span style={{fontWeight:600,fontSize:'0.82rem'}}>{p.name}</span>
                <span style={{width:'8px',height:'8px',borderRadius:'50%',background:STATUS_COLORS[p.status]}} title={STATUS_LABELS[p.status]}/>
              </div>
              <div style={{display:'flex',gap:'0.2rem',marginBottom:'0.2rem'}}>
                {['active','partial','inactive'].map(s => (
                  <button key={s} onClick={()=>setPixelStatus(p.id,s)} style={{
                    flex:1,padding:'0.15rem',borderRadius:'4px',border:`1px solid ${p.status===s?STATUS_COLORS[s]:'var(--border)'}`,
                    background:p.status===s?STATUS_COLORS[s]+'15':'transparent',color:p.status===s?STATUS_COLORS[s]:'var(--text-secondary)',
                    fontSize:'0.58rem',fontWeight:600,cursor:'pointer'
                  }}>{STATUS_LABELS[s]}</button>
                ))}
              </div>
              {p.lastChecked && <div style={{fontSize:'0.58rem',color:'var(--text-secondary)'}}>
                Gecheckt: {new Date(p.lastChecked).toLocaleDateString('nl-NL',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
              </div>}
              {p.url && <a href={p.url} target="_blank" rel="noopener" style={{fontSize:'0.58rem',color:'var(--accent)'}}>→ Open dashboard</a>}
            </div>
          ))}
        </div>
      </div>

      {/* QA Checklist */}
      <div className="card">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem'}}>
          <h3 className="section-title" style={{margin:0}}>QA Checklist</h3>
          <button onClick={()=>setShowAdd(!showAdd)} style={{padding:'0.25rem 0.6rem',borderRadius:'6px',border:'1px solid var(--border)',background:'var(--bg-secondary)',cursor:'pointer',fontSize:'0.7rem',fontWeight:600}}>
            + Item
          </button>
        </div>

        {showAdd && (
          <div style={{display:'flex',gap:'0.4rem',marginBottom:'0.75rem',padding:'0.5rem',borderRadius:'8px',background:'var(--bg-secondary)'}}>
            <select value={newItem.cat} onChange={e=>setNewItem({...newItem,cat:e.target.value})} style={{padding:'0.3rem',borderRadius:'4px',border:'1px solid var(--border)',fontSize:'0.75rem',fontFamily:'var(--font-body)'}}>
              {CATS.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <input value={newItem.label} onChange={e=>setNewItem({...newItem,label:e.target.value})} onKeyDown={e=>e.key==='Enter'&&addItem()}
              placeholder="Check item..." style={{flex:1,padding:'0.3rem 0.5rem',borderRadius:'4px',border:'1px solid var(--border)',fontSize:'0.75rem',fontFamily:'var(--font-body)'}}/>
            <button onClick={addItem} style={{padding:'0.3rem 0.6rem',borderRadius:'4px',background:'var(--accent)',color:'#fff',border:'none',cursor:'pointer',fontSize:'0.7rem',fontWeight:600}}>+</button>
          </div>
        )}

        {/* Progress bar */}
        <div style={{height:'6px',background:'var(--bg-secondary)',borderRadius:'99px',overflow:'hidden',marginBottom:'1rem'}}>
          <div style={{height:'100%',width:`${pct}%`,background:pct===100?'#059669':'var(--accent)',borderRadius:'99px',transition:'width 0.5s'}}/>
        </div>

        {CATS.map(cat => {
          const items = qa.filter(q => q.cat===cat)
          if (items.length===0) return null
          const catDone = items.filter(q => q.checked).length
          return (
            <div key={cat} style={{marginBottom:'0.75rem'}}>
              <div style={{display:'flex',alignItems:'center',gap:'0.4rem',marginBottom:'0.35rem'}}>
                <span>{CAT_ICONS[cat]}</span>
                <span style={{fontWeight:600,fontSize:'0.82rem'}}>{cat}</span>
                <span style={{fontSize:'0.65rem',color:catDone===items.length?'#059669':'var(--text-secondary)',marginLeft:'auto'}}>{catDone}/{items.length}</span>
              </div>
              {items.map(q => (
                <div key={q.id} style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.3rem 0',borderBottom:'1px solid rgba(28,25,23,0.04)'}}>
                  <input type="checkbox" checked={q.checked} onChange={()=>toggleQa(q.id)} style={{accentColor:'var(--accent)',cursor:'pointer',flexShrink:0}}/>
                  <span style={{fontSize:'0.78rem',textDecoration:q.checked?'line-through':'none',color:q.checked?'var(--text-secondary)':'var(--text-primary)',flex:1}}>{q.label}</span>
                  {q.by && <span style={{fontSize:'0.6rem',color:'var(--text-secondary)',flexShrink:0}}>{q.by} · {new Date(q.at).toLocaleDateString('nl-NL',{day:'numeric',month:'short'})}</span>}
                  <button onClick={()=>removeItem(q.id)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',fontSize:'0.65rem',opacity:0.4,flexShrink:0}} title="Verwijder">✕</button>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </>
  )
}
