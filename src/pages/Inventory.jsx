import { useState, useEffect } from 'react'
import { api } from '../api'

const SECTIONS = [
  'Akoestische panelen 240×120',
  'Houten lijst & knop',
  'Karton & verpakking',
  'Drukwerk',
  'Samples snijden',
  'CNC',
]

export default function Inventory() {
  const [items, setItems] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [addSection, setAddSection] = useState('')
  const [form, setForm] = useState({name:'',section:'',quantity:0,minStock:5,leadTimeDays:0,supplier:'',notes:''})

  useEffect(() => { api.getAll('inventory').then(setItems) }, [])
  const reload = () => api.getAll('inventory').then(setItems)

  const handleSave = async()=>{
    if(!form.name.trim())return
    await api.save('inventory',{...form,section:addSection||form.section})
    setForm({name:'',section:'',quantity:0,minStock:5,leadTimeDays:0,supplier:'',notes:''})
    setShowAdd(false);setAddSection('');reload()
  }
  const updateQty = async(item,d)=>{await api.save('inventory',{...item,quantity:Math.max(0,item.quantity+d)});reload()}
  const del = async(id)=>{await api.remove('inventory',id);reload()}

  const getStatus = (i)=>{
    if(!i.minStock) return 'ok'
    const r=i.quantity/i.minStock
    return r<=0.5?'low':r<=1?'warn':'ok'
  }
  const statusColor = {low:'var(--danger)',warn:'var(--accent)',ok:'var(--success)'}

  const totalItems = items.length
  const lowItems = items.filter(i=>getStatus(i)==='low').length

  const grouped = {}
  SECTIONS.forEach(s=>{grouped[s]=items.filter(i=>i.section===s)})
  const ungrouped = items.filter(i=>!SECTIONS.includes(i.section))

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Voorraad</h1>
          <p className="page-subtitle">{totalItems} items · {lowItems} lage voorraad</p>
        </div>
      </div>

      {SECTIONS.map(section=>{
        const sectionItems = grouped[section]||[]
        const sectionTotal = sectionItems.reduce((sum,i)=>sum+i.quantity,0)
        return (
          <div key={section} className="card" style={{marginBottom:'1.5rem'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',paddingBottom:'0.75rem',borderBottom:'1px solid var(--border)'}}>
              <div>
                <h3 style={{margin:0,fontSize:'1.15rem'}}>{section}</h3>
                <span style={{fontSize:'0.8rem',color:'var(--text-secondary)'}}>{sectionItems.length} items · {sectionTotal} totaal</span>
              </div>
              <button className="btn btn-sm btn-outline" onClick={()=>{setAddSection(section);setShowAdd(true)}}>+ Toevoegen</button>
            </div>

            {sectionItems.length===0?(
              <div style={{padding:'1rem',color:'var(--text-secondary)',fontSize:'0.85rem',fontStyle:'italic'}}>Nog geen items</div>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
                {sectionItems.map(item=>{
                  const s=getStatus(item)
                  const pct=item.minStock?Math.min(100,(item.quantity/item.minStock)*100):100
                  return (
                    <div key={item.id} style={{display:'flex',alignItems:'center',gap:'1rem',padding:'0.6rem 0.75rem',borderRadius:'var(--radius-sm)',background:s==='low'?'var(--danger-light)':'transparent',border:s==='low'?'1px solid rgba(220,38,38,0.15)':'1px solid var(--border)'}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:500,fontSize:'0.9rem'}}>{item.name}</div>
                        {item.notes&&<div style={{fontSize:'0.75rem',color:'var(--text-secondary)'}}>{item.notes}</div>}
                      </div>

                      <div style={{display:'flex',alignItems:'center',gap:'0.4rem'}}>
                        <button onClick={()=>updateQty(item,-1)} className="btn btn-sm btn-outline" style={{padding:'0.1rem 0.45rem',fontSize:'0.85rem'}}>−</button>
                        <span style={{fontWeight:600,minWidth:'28px',textAlign:'center',fontSize:'0.95rem'}}>{item.quantity}</span>
                        <button onClick={()=>updateQty(item,1)} className="btn btn-sm btn-outline" style={{padding:'0.1rem 0.45rem',fontSize:'0.85rem'}}>+</button>
                      </div>
                      {item.minStock>0&&(
                        <div style={{width:'70px'}}>
                          <div style={{height:'5px',borderRadius:'3px',background:'var(--bg-secondary)',overflow:'hidden'}}>
                            <div style={{height:'100%',borderRadius:'3px',width:`${pct}%`,background:statusColor[s],transition:'width 0.3s'}}/>
                          </div>
                          <div style={{fontSize:'0.65rem',color:'var(--text-secondary)',marginTop:'2px'}}>min: {item.minStock}</div>
                        </div>
                      )}

                      {item.leadTimeDays>0&&(
                        <div style={{fontSize:'0.75rem',color:'var(--text-secondary)',minWidth:'55px',textAlign:'right'}}>{item.leadTimeDays}d</div>
                      )}

                      <button onClick={()=>del(item.id)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',fontSize:'0.75rem',opacity:0.5}}>✕</button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      <div style={{textAlign:'center',padding:'1.5rem'}}>
        <button className="btn btn-primary" style={{padding:'0.75rem 2rem',fontSize:'1rem'}}
          onClick={()=>{setAddSection('');setShowAdd(true)}}>
          Inkoop nodig? Voeg item toe
        </button>
      </div>
      {showAdd&&<div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
        <div className="modal">
          <div className="modal-header"><h3>Item toevoegen{addSection?` — ${addSection}`:''}</h3><button className="modal-close" onClick={()=>setShowAdd(false)}>✕</button></div>
          <div className="form-group"><label className="form-label">Naam</label>
            <input className="form-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="bijv. Oak paneel" autoFocus/></div>
          {!addSection&&(
            <div className="form-group"><label className="form-label">Sectie</label>
              <select className="form-select" value={form.section} onChange={e=>setForm({...form,section:e.target.value})}>
                <option value="">Kies sectie...</option>
                {SECTIONS.map(s=><option key={s} value={s}>{s}</option>)}
              </select></div>
          )}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
            <div className="form-group"><label className="form-label">Hoeveelheid</label>
              <input className="form-input" type="number" value={form.quantity} onChange={e=>setForm({...form,quantity:parseInt(e.target.value)||0})}/></div>
            <div className="form-group"><label className="form-label">Min. voorraad</label>
              <input className="form-input" type="number" value={form.minStock} onChange={e=>setForm({...form,minStock:parseInt(e.target.value)||0})}/></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
            <div className="form-group"><label className="form-label">Levertijd (dagen)</label>
              <input className="form-input" type="number" value={form.leadTimeDays} onChange={e=>setForm({...form,leadTimeDays:parseInt(e.target.value)||0})}/></div>
            <div className="form-group"><label className="form-label">Leverancier</label>
              <input className="form-input" value={form.supplier} onChange={e=>setForm({...form,supplier:e.target.value})}/></div>
          </div>
          <div className="form-group"><label className="form-label">Notities</label>
            <textarea className="form-textarea" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
          <div style={{display:'flex',gap:'0.5rem',justifyContent:'flex-end'}}>
            <button className="btn btn-outline" onClick={()=>setShowAdd(false)}>Annuleren</button>
            <button className="btn btn-primary" onClick={handleSave}>Opslaan</button>
          </div>
        </div>
      </div>}
    </>
  )
}
