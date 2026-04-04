import { useState, useEffect } from 'react'
import { api } from '../api'
const TYPES = ['Panelen','Verpakking','Drukwerk','Samples','Overig']
export default function Inventory() {
  const [items, setItems] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({name:'',type:'Panelen',quantity:0,minStock:5,leadTimeDays:90,supplier:'',notes:''})
  useEffect(() => { api.getAll('inventory').then(setItems) }, [])
  const reload = () => api.getAll('inventory').then(setItems)
  const handleSave = async()=>{if(!form.name.trim())return;await api.save('inventory',form);setForm({name:'',type:'Panelen',quantity:0,minStock:5,leadTimeDays:90,supplier:'',notes:''});setShowAdd(false);reload()}
  const updateQty = async(item,d)=>{await api.save('inventory',{...item,quantity:Math.max(0,item.quantity+d)});reload()}
  const del = async(id)=>{await api.remove('inventory',id);reload()}
  const status = (i)=>{const r=i.quantity/(i.minStock||5);return r<=0.5?'low':r<=1?'warn':'ok'}
  return (
    <>
      <div className="page-header">
        <div><h1>Voorraad</h1><p className="page-subtitle">{items.length} items · {items.filter(i=>status(i)==='low').length} lage voorraad</p></div>
        <button className="btn btn-primary" onClick={()=>setShowAdd(true)}>+ Item toevoegen</button>
      </div>
      <div className="card" style={{overflow:'auto'}}>
        <table className="data-table"><thead><tr><th>Product</th><th>Type</th><th>Voorraad</th><th>Niveau</th><th>Levertijd</th><th>Leverancier</th><th></th></tr></thead>
        <tbody>
          {items.length===0?<tr><td colSpan="7" style={{textAlign:'center',padding:'2rem',color:'var(--text-secondary)'}}>Nog geen items</td></tr>:
          items.map(item=>{const s=status(item);const pct=Math.min(100,(item.quantity/Math.max(item.minStock||5,1))*50);return(
            <tr key={item.id}>
              <td><div style={{fontWeight:500}}>{item.name}</div>{item.notes&&<div style={{fontSize:'0.75rem',color:'var(--text-secondary)'}}>{item.notes}</div>}</td>
              <td><span className="badge badge-blue">{item.type}</span></td>
              <td><div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                <button onClick={()=>updateQty(item,-1)} className="btn btn-sm btn-outline" style={{padding:'0.15rem 0.5rem'}}>−</button>
                <span style={{fontWeight:600,minWidth:'30px',textAlign:'center'}}>{item.quantity}</span>
                <button onClick={()=>updateQty(item,1)} className="btn btn-sm btn-outline" style={{padding:'0.15rem 0.5rem'}}>+</button>
              </div></td>
              <td><div className={`stock-bar stock-${s}`}><div className="stock-bar-fill" style={{width:`${pct}%`}}/></div>
                <span style={{fontSize:'0.7rem',color:'var(--text-secondary)'}}>min: {item.minStock||5}</span></td>
              <td>{item.leadTimeDays||'—'} dagen</td>
              <td style={{fontSize:'0.8rem',color:'var(--text-secondary)'}}>{item.supplier||'—'}</td>
              <td><button onClick={()=>del(item.id)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)'}}>✕</button></td>
            </tr>)})}
        </tbody></table>
      </div>
      {showAdd&&<div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
        <div className="modal">
          <div className="modal-header"><h3>Voorraad item toevoegen</h3><button className="modal-close" onClick={()=>setShowAdd(false)}>✕</button></div>
          <div className="form-group"><label className="form-label">Naam</label>
            <input className="form-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="bijv. Paneel Oak" autoFocus/></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
            <div className="form-group"><label className="form-label">Type</label>
              <select className="form-select" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Hoeveelheid</label>
              <input className="form-input" type="number" value={form.quantity} onChange={e=>setForm({...form,quantity:parseInt(e.target.value)||0})}/></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
            <div className="form-group"><label className="form-label">Min. voorraad</label>
              <input className="form-input" type="number" value={form.minStock} onChange={e=>setForm({...form,minStock:parseInt(e.target.value)||0})}/></div>
            <div className="form-group"><label className="form-label">Levertijd (dagen)</label>
              <input className="form-input" type="number" value={form.leadTimeDays} onChange={e=>setForm({...form,leadTimeDays:parseInt(e.target.value)||0})}/></div>
          </div>
          <div className="form-group"><label className="form-label">Leverancier</label>
            <input className="form-input" value={form.supplier} onChange={e=>setForm({...form,supplier:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Notities</label>
            <textarea className="form-textarea" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
          <div style={{display:'flex',gap:'0.5rem',justifyContent:'flex-end'}}>
            <button className="btn btn-outline" onClick={()=>setShowAdd(false)}>Annuleren</button>
            <button className="btn btn-primary" onClick={handleSave}>Opslaan</button>
          </div>
        </div>
      </div>}
    </>)
}
