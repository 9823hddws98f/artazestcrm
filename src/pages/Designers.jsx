import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../api'
import { supabase } from '../supabase'

let _id = Date.now()
const genId = () => `des-${_id++}`
const COLORS = ['Black','White','Blue','Green','Grey','Light tan','Beige']
const SIZES = ['60×60','60×120','70×100']
const PLATFORMS = ['Upwork','Fiverr','Direct','Anders']
const STATUSES = ['actief','pauze','gestopt']

export default function Designers() {
  const [designers, setDesigners] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name:'', email:'', platform:'Upwork', status:'actief', notes:'', designs:[], contractUrl:'' })
  const [showDesignAdd, setShowDesignAdd] = useState(null)
  const [designForm, setDesignForm] = useState({ title:'', size:'60×60', color:'Black', date:new Date().toISOString().slice(0,10) })
  const [uploading, setUploading] = useState(false)
  const loaded = useRef(false)

  useEffect(() => {
    if (loaded.current) return; loaded.current = true
    api.getSetting('designers_crm').then(d => { if (d?.length) setDesigners(d) })
  }, [])
  const save = useCallback(next => { setDesigners(next); api.saveSetting('designers_crm', next) }, [])
  const resetForm = () => setForm({ name:'', email:'', platform:'Upwork', status:'actief', notes:'', designs:[], contractUrl:'' })
  const addDesigner = () => {    if (!form.name.trim()) return
    if (editing) { save(designers.map(d => d.id === editing ? { ...d, ...form } : d)) }
    else { save([...designers, { id: genId(), ...form, createdAt: new Date().toISOString() }]) }
    resetForm(); setShowAdd(false); setEditing(null)
  }
  const deleteDesigner = id => { if (!confirm('Verwijderen?')) return; save(designers.filter(d => d.id !== id)) }
  const startEdit = d => { setForm({ name:d.name, email:d.email||'', platform:d.platform||'Upwork', status:d.status||'actief', notes:d.notes||'', designs:d.designs||[], contractUrl:d.contractUrl||'', contractName:d.contractName||'' }); setEditing(d.id); setShowAdd(true) }
  const addDesign = (did) => {
    if (!designForm.title.trim()) return
    save(designers.map(d => d.id === did ? { ...d, designs: [...(d.designs||[]), { id: genId(), ...designForm }] } : d))
    setDesignForm({ title:'', size:'60×60', color:'Black', date:new Date().toISOString().slice(0,10) }); setShowDesignAdd(null)
  }
  const removeDesign = (did, desId) => { save(designers.map(d => d.id === did ? { ...d, designs: (d.designs||[]).filter(x => x.id !== desId) } : d)) }
  const uploadContract = async (did, file) => {
    setUploading(true)
    try {
      const path = `contracts/${did}-${file.name}`
      const { error } = await supabase.storage.from('artworks').upload(path, file, { upsert: true })
      if (error) { alert('Upload mislukt: ' + error.message); setUploading(false); return }
      const { data: urlData } = supabase.storage.from('artworks').getPublicUrl(path)
      save(designers.map(d => d.id === did ? { ...d, contractUrl: urlData?.publicUrl||'', contractName: file.name } : d))
    } catch (e) { alert('Fout: ' + e.message) }
    setUploading(false)
  }
  const activeCount = designers.filter(d => d.status === 'actief').length
  return (
    <div style={{ padding:'1.5rem' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'0.75rem' }}>
        <div>
          <h1 style={{ fontFamily:"'Instrument Serif',serif", fontSize:'1.75rem', margin:0, color:'var(--text-primary,#111)' }}>🎨 Designers</h1>
          <p style={{ margin:'0.25rem 0 0', fontSize:'0.85rem', color:'var(--text-secondary,#666)' }}>{activeCount} actief · {designers.length} totaal</p>
        </div>
        <button onClick={() => { resetForm(); setEditing(null); setShowAdd(true) }}
          style={{ padding:'0.4rem 1rem', borderRadius:8, border:'none', background:'#D97706', color:'#fff', fontSize:'0.85rem', fontWeight:600, cursor:'pointer' }}>+ Designer</button>
      </div>
      {showAdd && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div style={{ background:'var(--bg-primary,#fff)', borderRadius:16, padding:'1.5rem', width:420, maxWidth:'90vw', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin:'0 0 1rem', fontFamily:"'Instrument Serif',serif", fontSize:'1.25rem', color:'var(--text-primary)' }}>{editing ? 'Designer bewerken' : 'Nieuwe designer'}</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
              <input placeholder="Naam" value={form.name} onChange={e => setForm({...form, name:e.target.value})} autoFocus style={{ padding:'0.4rem 0.6rem', borderRadius:8, border:'1px solid var(--border,#e5e7eb)', fontSize:'0.85rem', background:'var(--bg-secondary)', color:'var(--text-primary)' }} />
              <input placeholder="E-mail" value={form.email} onChange={e => setForm({...form, email:e.target.value})} style={{ padding:'0.4rem 0.6rem', borderRadius:8, border:'1px solid var(--border,#e5e7eb)', fontSize:'0.85rem', background:'var(--bg-secondary)', color:'var(--text-primary)' }} />
              <div style={{ display:'flex', gap:'0.5rem' }}>
                <select value={form.platform} onChange={e => setForm({...form, platform:e.target.value})} style={{ flex:1, padding:'0.4rem', borderRadius:8, border:'1px solid var(--border)', fontSize:'0.85rem', background:'var(--bg-secondary)', color:'var(--text-primary)' }}>{PLATFORMS.map(p => <option key={p}>{p}</option>)}</select>
                <select value={form.status} onChange={e => setForm({...form, status:e.target.value})} style={{ flex:1, padding:'0.4rem', borderRadius:8, border:'1px solid var(--border)', fontSize:'0.85rem', background:'var(--bg-secondary)', color:'var(--text-primary)' }}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select>
              </div>
              <textarea placeholder="Notities" value={form.notes} onChange={e => setForm({...form, notes:e.target.value})} rows={2} style={{ padding:'0.4rem 0.6rem', borderRadius:8, border:'1px solid var(--border)', fontSize:'0.85rem', resize:'vertical', background:'var(--bg-secondary)', color:'var(--text-primary)' }} />
              <div style={{ display:'flex', gap:'0.5rem', justifyContent:'flex-end' }}>
                <button onClick={() => { setShowAdd(false); setEditing(null); resetForm() }} style={{ padding:'0.4rem 0.8rem', borderRadius:8, border:'1px solid var(--border)', background:'transparent', cursor:'pointer', color:'var(--text-primary)', fontSize:'0.8rem' }}>Annuleren</button>
                <button onClick={addDesigner} style={{ padding:'0.4rem 0.8rem', borderRadius:8, border:'none', background:'#D97706', color:'#fff', fontWeight:600, cursor:'pointer', fontSize:'0.8rem' }}>{editing ? 'Opslaan' : 'Toevoegen'}</button>
              </div>
            </div>
          </div>
        </div>
      )}      <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
        {designers.length === 0 && <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-secondary)', fontSize:'0.85rem' }}>Nog geen designers toegevoegd</div>}
        {designers.map(d => {
          const designs = d.designs || []
          const sc = d.status==='actief'?'#059669':d.status==='pauze'?'#D97706':'#DC2626'
          return (
            <div key={d.id} style={{ background:'var(--bg-card,#fff)', border:'1px solid var(--border)', borderRadius:12, padding:'0.75rem 1rem', borderLeft:`3px solid ${sc}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'0.5rem' }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
                    <span style={{ fontWeight:600, fontSize:'0.9rem', color:'var(--text-primary)' }}>{d.name}</span>
                    <span style={{ fontSize:'0.55rem', padding:'0.08rem 0.35rem', borderRadius:99, background:sc+'20', color:sc, fontWeight:600 }}>{d.status}</span>
                    <span style={{ fontSize:'0.55rem', padding:'0.08rem 0.35rem', borderRadius:99, background:'var(--bg-secondary)', color:'var(--text-secondary)' }}>{d.platform}</span>
                  </div>
                  {d.email && <div style={{ fontSize:'0.65rem', color:'var(--text-secondary)', marginTop:'0.1rem' }}>{d.email}</div>}
                  {d.notes && <div style={{ fontSize:'0.65rem', color:'var(--text-secondary)', marginTop:'0.15rem', fontStyle:'italic' }}>{d.notes}</div>}
                </div>
                <div style={{ display:'flex', gap:'0.25rem' }}>
                  <button onClick={() => startEdit(d)} style={{ border:'1px solid var(--border)', background:'none', borderRadius:6, padding:'0.15rem 0.4rem', fontSize:'0.6rem', cursor:'pointer', color:'var(--text-secondary)' }}>✎</button>
                  <button onClick={() => deleteDesigner(d.id)} style={{ border:'1px solid var(--border)', background:'none', borderRadius:6, padding:'0.15rem 0.4rem', fontSize:'0.6rem', cursor:'pointer', color:'#DC2626' }}>×</button>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', marginTop:'0.5rem' }}>
                <input type="file" accept=".pdf" id={`file-${d.id}`} style={{ display:'none' }} onChange={e => { if (e.target.files[0]) uploadContract(d.id, e.target.files[0]); e.target.value='' }} />
                {d.contractUrl ? <a href={d.contractUrl} target="_blank" rel="noopener" style={{ fontSize:'0.65rem', color:'#2563EB', textDecoration:'none' }}>📄 {d.contractName||'Contract.pdf'}</a>
                  : <span style={{ fontSize:'0.6rem', color:'var(--text-tertiary,#bbb)' }}>Geen contract</span>}
                <button onClick={() => document.getElementById(`file-${d.id}`).click()} disabled={uploading}
                  style={{ fontSize:'0.55rem', padding:'0.1rem 0.35rem', borderRadius:6, border:'1px solid var(--border)', background:'none', cursor:'pointer', color:'var(--text-secondary)' }}>{uploading?'...':d.contractUrl?'Vervangen':'Upload PDF'}</button>
              </div>              <div style={{ marginTop:'0.5rem' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.25rem' }}>
                  <span style={{ fontSize:'0.65rem', fontWeight:600, color:'var(--text-primary)' }}>Designs ({designs.length})</span>
                  <button onClick={() => setShowDesignAdd(showDesignAdd===d.id?null:d.id)} style={{ fontSize:'0.55rem', padding:'0.08rem 0.35rem', borderRadius:6, border:'none', background:'#D97706', color:'#fff', cursor:'pointer', fontWeight:600 }}>+</button>
                </div>
                {showDesignAdd===d.id && (
                  <div style={{ display:'flex', gap:'0.25rem', marginBottom:'0.3rem', flexWrap:'wrap' }}>
                    <input placeholder="Design naam" value={designForm.title} onChange={e => setDesignForm({...designForm, title:e.target.value})} onKeyDown={e => e.key==='Enter' && addDesign(d.id)}
                      style={{ flex:'2 1 100px', padding:'0.2rem 0.35rem', borderRadius:6, border:'1px solid var(--border)', fontSize:'0.65rem', background:'var(--bg-secondary)', color:'var(--text-primary)' }} />
                    <select value={designForm.color} onChange={e => setDesignForm({...designForm, color:e.target.value})} style={{ flex:'1 1 60px', padding:'0.2rem', borderRadius:6, border:'1px solid var(--border)', fontSize:'0.6rem', background:'var(--bg-secondary)', color:'var(--text-primary)' }}>{COLORS.map(c => <option key={c}>{c}</option>)}</select>
                    <select value={designForm.size} onChange={e => setDesignForm({...designForm, size:e.target.value})} style={{ flex:'1 1 50px', padding:'0.2rem', borderRadius:6, border:'1px solid var(--border)', fontSize:'0.6rem', background:'var(--bg-secondary)', color:'var(--text-primary)' }}>{SIZES.map(s => <option key={s}>{s}</option>)}</select>
                    <button onClick={() => addDesign(d.id)} style={{ padding:'0.2rem 0.4rem', borderRadius:6, border:'none', background:'#D97706', color:'#fff', fontSize:'0.6rem', fontWeight:600, cursor:'pointer' }}>+</button>
                  </div>
                )}
                {designs.length > 0 ? (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'0.2rem' }}>
                    {designs.map(des => (
                      <div key={des.id} style={{ display:'flex', alignItems:'center', gap:'0.2rem', padding:'0.1rem 0.35rem', borderRadius:6, background:'var(--bg-secondary)', fontSize:'0.6rem', color:'var(--text-primary)' }}>
                        <span>{des.title}</span><span style={{ color:'var(--text-tertiary)' }}>{des.color} {des.size}</span>
                        <button onClick={() => removeDesign(d.id, des.id)} style={{ border:'none', background:'none', cursor:'pointer', color:'var(--text-tertiary)', fontSize:'0.55rem', padding:0, lineHeight:1 }}>×</button>
                      </div>
                    ))}
                  </div>
                ) : <div style={{ fontSize:'0.6rem', color:'var(--text-tertiary)' }}>Nog geen designs</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}