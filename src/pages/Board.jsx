import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../api'

const todayISO = () => { const d=new Date(); if(d.getHours()<1) d.setDate(d.getDate()-1); return d.toISOString().slice(0,10) }
let _id = Date.now()
const uid = () => `b-${_id++}`

export default function Board() {
  const [checkins, setCheckins] = useState([])
  const [columns, setColumns] = useState([])
  const [dragCard, setDragCard] = useState(null)
  const [dragOverCol, setDragOverCol] = useState(null)
  const [addCheckin, setAddCheckin] = useState('')
  const [addCard, setAddCard] = useState({})
  const [newColName, setNewColName] = useState('')
  const [showNewCol, setShowNewCol] = useState(false)
  const [editCard, setEditCard] = useState(null)
  const [editCheckin, setEditCheckin] = useState(null)
  const loaded = useRef(false)
  const today = todayISO()

  useEffect(() => {
    if (loaded.current) return; loaded.current = true
    api.getSetting('board_checkins').then(v => { if (v?.length) setCheckins(v) })
    api.getSetting('board_columns').then(v => {
      if (v?.length) setColumns(v)
      else setColumns([
        { id: uid(), name: 'To do', cards: [] },
        { id: uid(), name: 'Bezig', cards: [] },
        { id: uid(), name: 'Klaar', cards: [] },
      ])
    })
  }, [])

  const saveCheckins = useCallback(v => { setCheckins(v); api.saveSetting('board_checkins', v) }, [])
  const saveCols = useCallback(v => { setColumns(v); api.saveSetting('board_columns', v) }, [])

  // Check-in logic
  const isChecked = item => item.checkedDate === today
  const toggleCheck = id => {
    saveCheckins(checkins.map(c => c.id===id ? {...c, checkedDate: isChecked(c)?null:today} : c))
  }
  const doAddCheckin = () => {
    if (!addCheckin.trim()) return
    saveCheckins([...checkins, { id: uid(), name: addCheckin.trim(), checkedDate: null }])
    setAddCheckin('')
  }
  const removeCheckin = id => saveCheckins(checkins.filter(c => c.id !== id))
  const renameCheckin = (id, name) => saveCheckins(checkins.map(c => c.id===id ? {...c, name} : c))
  const checkedCount = checkins.filter(c => isChecked(c)).length

  // Column logic
  const addColumn = () => {
    if (!newColName.trim()) return
    saveCols([...columns, { id: uid(), name: newColName.trim(), cards: [] }])
    setNewColName(''); setShowNewCol(false)
  }
  const removeColumn = id => {
    if (!confirm('Kolom verwijderen inclusief alle kaartjes?')) return
    saveCols(columns.filter(c => c.id !== id))
  }
  const renameColumn = (id, name) => saveCols(columns.map(c => c.id===id ? {...c, name} : c))

  // Card logic
  const doAddCard = (colId) => {
    const val = addCard[colId]
    if (!val?.trim()) return
    saveCols(columns.map(c => c.id===colId ? {...c, cards:[...c.cards, {id:uid(), title:val.trim(), color:'', notes:'', createdAt:new Date().toISOString()}]} : c))
    setAddCard({...addCard, [colId]: ''})
  }
  const removeCard = (colId, cardId) => {
    saveCols(columns.map(c => c.id===colId ? {...c, cards:c.cards.filter(x=>x.id!==cardId)} : c))
  }
  const updateCard = (colId, cardId, updates) => {
    saveCols(columns.map(c => c.id===colId ? {...c, cards:c.cards.map(x=>x.id===cardId?{...x,...updates}:x)} : c))
  }

  // Drag & drop
  const onDragStart = (e, cardId, fromColId) => { setDragCard({cardId, fromColId}); e.dataTransfer.effectAllowed='move' }
  const onDragOver = (e, colId) => { e.preventDefault(); setDragOverCol(colId) }
  const onDrop = (e, toColId) => {
    e.preventDefault(); setDragOverCol(null)
    if (!dragCard || dragCard.fromColId === toColId) { setDragCard(null); return }
    let card = null
    const newCols = columns.map(c => {
      if (c.id === dragCard.fromColId) {
        card = c.cards.find(x => x.id === dragCard.cardId)
        return {...c, cards: c.cards.filter(x => x.id !== dragCard.cardId)}
      }
      return c
    }).map(c => {
      if (c.id === toColId && card) return {...c, cards: [...c.cards, card]}
      return c
    })
    saveCols(newCols); setDragCard(null)
  }

  const CARD_COLORS = ['','#FEF3C7','#DBEAFE','#F3E8FF','#ECFDF5','#FEE2E2','#FFF7ED']
  const dayStr = new Date().toLocaleDateString('nl-NL', {weekday:'long', day:'numeric', month:'long'})

  return (
    <div style={{display:'flex', height:'calc(100vh - 60px)', overflow:'hidden'}}>
      {/* LEFT: Dagelijkse check-ins */}
      <div style={{width:260, flexShrink:0, borderRight:'1px solid var(--border)', padding:'1rem', overflowY:'auto', background:'var(--bg-secondary)'}}>
        <div style={{marginBottom:'1rem'}}>
          <h2 style={{fontFamily:"'Instrument Serif',serif", fontSize:'1.2rem', margin:'0 0 0.15rem', color:'var(--text-primary)'}}>Dagelijks</h2>
          <p style={{fontSize:'0.65rem', color:'var(--text-secondary)', margin:0}}>{dayStr} \u00b7 {checkedCount}/{checkins.length}</p>
        </div>

        <div style={{display:'flex', flexDirection:'column', gap:'0.3rem'}}>
          {checkins.map(item => {
            const done = isChecked(item)
            return (
              <div key={item.id} style={{display:'flex', alignItems:'center', gap:'0.4rem', padding:'0.4rem 0.5rem', borderRadius:8, background: done ? '#F0FDF4' : 'var(--bg-card)', border: done ? '1px solid #BBF7D0' : '1px solid var(--border)', cursor:'pointer', transition:'all 0.15s'}}
                onClick={() => toggleCheck(item.id)}>
                <div style={{width:18, height:18, borderRadius:'50%', border: done ? 'none' : '2px solid #D6D3D1', background: done ? '#059669' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                  {done && <span style={{color:'#fff', fontSize:'0.55rem'}}>\u2713</span>}
                </div>
                {editCheckin===item.id ? (
                  <input autoFocus value={item.name} onChange={e => renameCheckin(item.id, e.target.value)}
                    onBlur={() => setEditCheckin(null)} onKeyDown={e => {if(e.key==='Enter')setEditCheckin(null)}}
                    onClick={e => e.stopPropagation()}
                    style={{flex:1, border:'none', borderBottom:'1px solid #D97706', background:'transparent', fontSize:'0.8rem', outline:'none', fontFamily:'var(--font-body)', color:'var(--text-primary)', padding:0, fontWeight:500}} />
                ) : (
                  <span onDoubleClick={e => {e.stopPropagation(); setEditCheckin(item.id)}}
                    style={{flex:1, fontSize:'0.8rem', fontWeight:500, color: done ? '#059669' : 'var(--text-primary)', textDecoration: done ? 'line-through' : 'none'}}>{item.name}</span>
                )}
                <button onClick={e => {e.stopPropagation(); removeCheckin(item.id)}}
                  style={{background:'none', border:'none', cursor:'pointer', color:'#DC2626', fontSize:'0.7rem', padding:'0.1rem', opacity:0.5, lineHeight:1}}
                  onMouseEnter={e => e.currentTarget.style.opacity='1'} onMouseLeave={e => e.currentTarget.style.opacity='0.5'}>\u00d7</button>
              </div>
            )
          })}
        </div>

        <div style={{marginTop:'0.5rem', display:'flex', gap:'0.25rem'}}>
          <input value={addCheckin} onChange={e => setAddCheckin(e.target.value)}
            onKeyDown={e => e.key==='Enter' && doAddCheckin()}
            placeholder="+ check-in toevoegen..."
            style={{flex:1, padding:'0.35rem 0.5rem', borderRadius:6, border:'1px solid var(--border)', fontSize:'0.75rem', background:'var(--bg-card)', color:'var(--text-primary)', outline:'none'}} />
          {addCheckin.trim() && <button onClick={doAddCheckin}
            style={{border:'none', background:'#D97706', color:'#fff', borderRadius:6, padding:'0 0.5rem', fontSize:'0.75rem', fontWeight:600, cursor:'pointer'}}>+</button>}
        </div>

        <div style={{marginTop:'1.5rem', borderTop:'1px solid var(--border)', paddingTop:'0.75rem'}}>
          <p style={{fontSize:'0.6rem', color:'var(--text-tertiary)', margin:0}}>Dubbelklik om naam te wijzigen. Reset elke dag om 01:00.</p>
        </div>
      </div>

      {/* RIGHT: Trello columns */}
      <div style={{flex:1, display:'flex', gap:'0.75rem', padding:'1rem', overflowX:'auto'}}>
        {columns.map(col => {
          const isOver = dragOverCol === col.id
          return (
            <div key={col.id}
              onDragOver={e => onDragOver(e, col.id)}
              onDrop={e => onDrop(e, col.id)}
              onDragLeave={() => setDragOverCol(null)}
              style={{minWidth:240, maxWidth:300, flex:'0 0 260px', background: isOver ? 'rgba(217,119,6,0.06)' : 'var(--bg-secondary)', borderRadius:12, padding:'0.75rem', display:'flex', flexDirection:'column', border: isOver ? '2px dashed #D97706' : '2px solid transparent', transition:'all 0.1s', maxHeight:'calc(100vh - 90px)'}}>

              {/* Column header */}
              <div style={{display:'flex', alignItems:'center', gap:'0.4rem', marginBottom:'0.5rem', paddingBottom:'0.4rem', borderBottom:'2px solid #D97706'}}>
                <span style={{fontWeight:700, fontSize:'0.8rem', color:'var(--text-primary)', flex:1}}>{col.name}</span>
                <span style={{fontSize:'0.6rem', background:'#D97706', color:'#fff', borderRadius:20, padding:'0 0.4rem', fontWeight:700}}>{col.cards.length}</span>
                <button onClick={() => removeColumn(col.id)} style={{background:'none', border:'none', cursor:'pointer', color:'var(--text-tertiary)', fontSize:'0.65rem', padding:0, lineHeight:1}}
                  onMouseEnter={e => e.currentTarget.style.color='#DC2626'} onMouseLeave={e => e.currentTarget.style.color='var(--text-tertiary)'}>×</button>
              </div>

              {/* Cards */}
              <div style={{flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:'0.4rem'}}>
                {col.cards.map(card => (
                  <div key={card.id} draggable
                    onDragStart={e => onDragStart(e, card.id, col.id)}
                    style={{padding:'0.5rem 0.6rem', borderRadius:8, background: card.color || 'var(--bg-card)', border:'1px solid var(--border)', cursor:'grab', boxShadow:'0 1px 3px rgba(0,0,0,0.05)', borderLeft: card.color ? 'none' : '3px solid #D97706', opacity: dragCard?.cardId===card.id ? 0.4 : 1, transition:'opacity 0.15s'}}>
                    {editCard===card.id ? (
                      <div onClick={e => e.stopPropagation()}>
                        <input autoFocus value={card.title} onChange={e => updateCard(col.id, card.id, {title:e.target.value})}
                          onKeyDown={e => {if(e.key==='Enter')setEditCard(null)}}
                          style={{width:'100%', border:'none', borderBottom:'1px solid #D97706', background:'transparent', fontSize:'0.82rem', fontWeight:600, outline:'none', fontFamily:'var(--font-body)', color:'var(--text-primary)', padding:0, marginBottom:'0.3rem'}} />
                        <textarea value={card.notes||''} onChange={e => updateCard(col.id, card.id, {notes:e.target.value})}
                          placeholder="Notities..."
                          style={{width:'100%', border:'none', borderBottom:'1px solid var(--border)', background:'transparent', fontSize:'0.7rem', outline:'none', fontFamily:'var(--font-body)', color:'var(--text-secondary)', padding:0, resize:'vertical', minHeight:30}} />
                        <div style={{display:'flex', gap:'0.2rem', marginTop:'0.3rem', flexWrap:'wrap'}}>
                          {CARD_COLORS.map(c => (
                            <div key={c||'none'} onClick={() => updateCard(col.id, card.id, {color:c})}
                              style={{width:16, height:16, borderRadius:4, background: c || 'var(--bg-card)', border: card.color===c ? '2px solid #D97706' : '1px solid var(--border)', cursor:'pointer'}} />
                          ))}
                        </div>
                        <div style={{display:'flex', justifyContent:'flex-end', gap:'0.3rem', marginTop:'0.3rem'}}>
                          <button onClick={() => {removeCard(col.id, card.id)}} style={{fontSize:'0.6rem', color:'#DC2626', background:'none', border:'none', cursor:'pointer'}}>Verwijderen</button>
                          <button onClick={() => setEditCard(null)} style={{fontSize:'0.6rem', color:'#fff', background:'#D97706', border:'none', borderRadius:4, padding:'0.15rem 0.4rem', cursor:'pointer', fontWeight:600}}>Klaar</button>
                        </div>
                      </div>
                    ) : (
                      <div onClick={() => setEditCard(card.id)}>
                        <div style={{fontSize:'0.82rem', fontWeight:600, color:'var(--text-primary)', lineHeight:1.3}}>{card.title}</div>
                        {card.notes && <div style={{fontSize:'0.65rem', color:'var(--text-secondary)', marginTop:'0.2rem', lineHeight:1.3, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical'}}>{card.notes}</div>}
                      </div>
                    )}
                  </div>
                ))}

                {col.cards.length === 0 && !dragCard && (
                  <div style={{textAlign:'center', padding:'1rem 0.5rem', color:'var(--text-tertiary)', fontSize:'0.7rem'}}>Sleep kaartjes hierheen</div>
                )}
              </div>

              {/* Quick add */}
              <div style={{marginTop:'0.5rem'}}>
                <input value={addCard[col.id]||''} onChange={e => setAddCard({...addCard, [col.id]:e.target.value})}
                  onKeyDown={e => e.key==='Enter' && doAddCard(col.id)}
                  placeholder="+ kaartje..."
                  style={{width:'100%', padding:'0.35rem 0.5rem', borderRadius:6, border:'1px dashed var(--border)', fontSize:'0.75rem', background:'transparent', color:'var(--text-primary)', outline:'none'}} />
              </div>
            </div>
          )
        })}

        {/* Add column */}
        <div style={{minWidth:200, flex:'0 0 200px'}}>
          {showNewCol ? (
            <div style={{background:'var(--bg-secondary)', borderRadius:12, padding:'0.75rem'}}>
              <input autoFocus value={newColName} onChange={e => setNewColName(e.target.value)}
                onKeyDown={e => {if(e.key==='Enter')addColumn(); if(e.key==='Escape')setShowNewCol(false)}}
                placeholder="Kolom naam..."
                style={{width:'100%', padding:'0.4rem 0.5rem', borderRadius:6, border:'1px solid var(--border)', fontSize:'0.8rem', background:'var(--bg-card)', color:'var(--text-primary)', outline:'none', marginBottom:'0.4rem'}} />
              <div style={{display:'flex', gap:'0.3rem'}}>
                <button onClick={addColumn} style={{padding:'0.3rem 0.6rem', borderRadius:6, border:'none', background:'#D97706', color:'#fff', fontSize:'0.75rem', fontWeight:600, cursor:'pointer'}}>Toevoegen</button>
                <button onClick={() => setShowNewCol(false)} style={{padding:'0.3rem 0.6rem', borderRadius:6, border:'1px solid var(--border)', background:'transparent', fontSize:'0.75rem', cursor:'pointer', color:'var(--text-primary)'}}>Annuleren</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowNewCol(true)}
              style={{width:'100%', padding:'0.6rem', borderRadius:12, border:'2px dashed var(--border)', background:'transparent', cursor:'pointer', fontSize:'0.8rem', color:'var(--text-secondary)', fontWeight:500}}>
              + Kolom toevoegen
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
