import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

const LAUNCH_DATE = new Date('2026-04-18T09:00:00')
const ASSIGNEES = ['Tein', 'Sam', 'Productie']

function getDaysUntilLaunch() {
  const diff = LAUNCH_DATE - new Date()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}
function daysUntil(date) {
  if (!date) return null
  return Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24))
}
const fmt = d => new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })

export default function Dashboard({ user }) {
  const [tasks, setTasks] = useState([])
  const [inventory, setInventory] = useState([])
  const [daysLeft, setDaysLeft] = useState(getDaysUntilLaunch())

  useEffect(() => {
    api.getAll('tasks').then(setTasks)
    api.getAll('inventory').then(setInventory)
    const t = setInterval(() => setDaysLeft(getDaysUntilLaunch()), 60000)
    return () => clearInterval(t)
  }, [])

  const activeTasks = tasks.filter(t => !t.archived)
  const doneTasks = activeTasks.filter(t => t.status === 'klaar')
  const openTasks = activeTasks.filter(t => t.status !== 'klaar')

  // Readiness berekening op subtaak niveau
  let totalUnits = 0, doneUnits = 0
  activeTasks.forEach(t => {
    const subs = t.subtasks || []
    if (subs.length > 0) { totalUnits += subs.length; doneUnits += subs.filter(s => s.completed).length }
    else { totalUnits += 1; if (t.status === 'klaar') doneUnits += 1 }
  })
  const readiness = totalUnits > 0 ? Math.round((doneUnits / totalUnits) * 100) : 0

  const overdueTasks = openTasks.filter(t => { const d = daysUntil(t.dueDate); return d !== null && d < 0 })
  const todayTasks = openTasks.filter(t => { const d = daysUntil(t.dueDate); return d !== null && d === 0 })
  const thisWeekTasks = openTasks.filter(t => { const d = daysUntil(t.dueDate); return d !== null && d > 0 && d <= 7 })
  const urgentOpen = openTasks.filter(t => t.priority === 'high')

  const needsOrder = inventory.filter(i => i.minStock > 0 && i.quantity < i.minStock)
  const urgencyColor = daysLeft <= 3 ? '#DC2626' : daysLeft <= 7 ? '#D97706' : daysLeft <= 12 ? '#EA580C' : '#2563EB'
  const todayStr = new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })

  // Mijn taken vandaag (gepland of urgent)
  const myName = user?.name || 'Tein'
  const myUrgentTasks = urgentOpen.filter(t => t.assignee === myName).slice(0, 5)

  const personStats = ASSIGNEES.map(name => ({
    name,
    open: openTasks.filter(t => t.assignee === name).length,
    urgent: openTasks.filter(t => t.assignee === name && t.priority === 'high').length,
    overdue: overdueTasks.filter(t => t.assignee === name).length,
    done: doneTasks.filter(t => t.assignee === name).length,
    total: activeTasks.filter(t => t.assignee === name).length,
  }))

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Launch Control</h1>
          <p className="page-subtitle">{todayStr} — {daysLeft} dagen tot launch</p>
        </div>
      </div>

      {/* HERO ROW: Countdown + Readiness + Acties */}
      <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 220px', gap: '1rem', marginBottom: '1.25rem' }}>

        {/* Countdown */}
        <div style={{ background: urgencyColor, borderRadius: '12px', padding: '1.25rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: '0.25rem' }}>Dagen tot launch</div>
          <div style={{ fontSize: '3.5rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{daysLeft}</div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.35rem' }}>18 april 2026</div>
        </div>

        {/* Readiness + voortgang */}
        <div className="card" style={{ padding: '1.1rem 1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
            <div>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Launch Readiness</div>
              <div style={{ fontSize: '2.8rem', fontFamily: 'var(--font-display)', fontWeight: 700, lineHeight: 1, color: readiness >= 70 ? '#059669' : readiness >= 40 ? '#D97706' : '#DC2626' }}>{readiness}%</div>
            </div>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
              {overdueTasks.length > 0 && <span style={{ padding: '0.2rem 0.6rem', borderRadius: '99px', background: '#FEE2E2', color: '#991B1B', fontSize: '0.7rem', fontWeight: 700 }}>⚠ {overdueTasks.length} te laat</span>}
              {todayTasks.length > 0 && <span style={{ padding: '0.2rem 0.6rem', borderRadius: '99px', background: '#FFF7ED', color: '#C2410C', fontSize: '0.7rem', fontWeight: 700 }}>🔥 {todayTasks.length} vandaag</span>}
              {needsOrder.length > 0 && <span style={{ padding: '0.2rem 0.6rem', borderRadius: '99px', background: '#FEE2E2', color: '#991B1B', fontSize: '0.7rem', fontWeight: 700 }}>▦ {needsOrder.length} bestellen</span>}
            </div>
          </div>
          <div style={{ height: '12px', background: 'var(--bg-secondary)', borderRadius: '99px', overflow: 'hidden', marginBottom: '0.5rem' }}>
            <div style={{ height: '100%', width: `${readiness}%`, background: readiness >= 70 ? '#059669' : readiness >= 40 ? '#D97706' : '#DC2626', borderRadius: '99px', transition: 'width 0.8s ease' }} />
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            <span>✓ <strong style={{ color: '#059669' }}>{doneTasks.length}</strong> klaar</span>
            <span>○ <strong style={{ color: 'var(--text-primary)' }}>{openTasks.length}</strong> open</span>
            <span>🔴 <strong style={{ color: '#DC2626' }}>{urgentOpen.length}</strong> urgent</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{doneUnits}/{totalUnits} subtaken</span>
          </div>
        </div>

        {/* Jouw focus vandaag */}
        <div className="card" style={{ padding: '1rem', borderTop: '3px solid #EA580C' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#EA580C', marginBottom: '0.5rem' }}>Jouw prioriteiten</div>
          {myUrgentTasks.length === 0 ? (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Niets urgent — goed bezig!</div>
          ) : myUrgentTasks.map(t => {
            const d = daysUntil(t.dueDate)
            return (
              <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', marginBottom: '0.45rem' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#DC2626', flexShrink: 0, marginTop: '0.35rem' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                  {d !== null && <div style={{ fontSize: '0.65rem', color: d <= 0 ? '#DC2626' : d <= 3 ? '#D97706' : 'var(--text-secondary)', fontWeight: 600 }}>{d < 0 ? `${Math.abs(d)}d te laat` : d === 0 ? 'Vandaag!' : `over ${d}d`}</div>}
                </div>
              </div>
            )
          })}
          <Link to="/tasks" style={{ fontSize: '0.7rem', color: '#EA580C', textDecoration: 'none', fontWeight: 600 }}>Naar to-do's →</Link>
        </div>
      </div>

      {/* PER PERSOON */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
        {personStats.map(p => {
          const pct = p.total > 0 ? Math.round((p.done / p.total) * 100) : 0
          return (
            <div key={p.name} className="card" style={{ padding: '0.9rem 1.1rem', borderLeft: `4px solid ${p.overdue > 0 ? '#DC2626' : p.urgent > 0 ? '#D97706' : '#059669'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.name}</div>
                <div style={{ fontSize: '0.85rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: pct >= 70 ? '#059669' : '#D97706' }}>{pct}%</div>
              </div>
              <div style={{ height: '4px', background: 'var(--bg-secondary)', borderRadius: '99px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: pct >= 70 ? '#059669' : pct >= 40 ? '#D97706' : '#DC2626', borderRadius: '99px' }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.73rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--text-primary)' }}>{p.open}</strong> open</span>
                <span style={{ color: 'var(--text-secondary)' }}>✓ <strong style={{ color: '#059669' }}>{p.done}</strong> klaar</span>
                {p.overdue > 0 && <span style={{ color: '#DC2626', fontWeight: 700 }}>⚠ {p.overdue} te laat</span>}
                {p.urgent > 0 && p.overdue === 0 && <span style={{ color: '#D97706', fontWeight: 600 }}>🔴 {p.urgent} urgent</span>}
              </div>
            </div>
          )
        })}
      </div>

      {/* BOTTOM ROW: Vandaag/Week + Voorraad + Kosten */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        <div className="card">
          <div className="section-header">
            <h3 className="section-title">Deze week — {thisWeekTasks.length + overdueTasks.length + todayTasks.length} acties</h3>
            <Link to="/tasks" className="btn btn-sm btn-outline">To-do's →</Link>
          </div>

          {overdueTasks.length === 0 && todayTasks.length === 0 && thisWeekTasks.length === 0 ? (
            <div className="empty-state">Alles op schema 🎉</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {overdueTasks.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.45rem 0.7rem', borderRadius: '8px', background: '#FEF2F2', borderLeft: '3px solid #DC2626' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.81rem', fontWeight: 600 }}>{t.title}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{t.assignee} · {t.category}</div>
                  </div>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#DC2626', whiteSpace: 'nowrap' }}>{Math.abs(daysUntil(t.dueDate))}d te laat</span>
                </div>
              ))}
              {todayTasks.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.45rem 0.7rem', borderRadius: '8px', background: '#FFF7ED', borderLeft: '3px solid #EA580C' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.81rem', fontWeight: 600 }}>{t.title}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{t.assignee} · {t.category}</div>
                  </div>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#EA580C', whiteSpace: 'nowrap' }}>Vandaag!</span>
                </div>
              ))}
              {thisWeekTasks.slice(0, 7).map(t => {
                const d = daysUntil(t.dueDate)
                const subs = t.subtasks || []
                const subDone = subs.filter(s => s.completed).length
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.4rem 0.7rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{t.title}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                        {t.assignee} · {t.category}
                        {subs.length > 0 && <span style={{ color: subDone === subs.length ? '#059669' : 'var(--text-secondary)', marginLeft: '0.35rem' }}>{subDone}/{subs.length} ✓</span>}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 600, color: d <= 2 ? '#D97706' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{d}d</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Voorraad */}
          <div className="card" style={{ flex: 1 }}>
            <div className="section-header">
              <h3 className="section-title">Voorraad alerts</h3>
              <Link to="/inventory" className="btn btn-sm btn-outline">→</Link>
            </div>
            {needsOrder.length === 0 ? <div className="empty-state">Alles op voorraad ✓</div> :
              needsOrder.map(item => (
                <div key={item.id} style={{ padding: '0.5rem 0.65rem', borderRadius: '8px', background: '#FEF2F2', borderLeft: '3px solid #DC2626', marginBottom: '0.35rem' }}>
                  <div style={{ fontSize: '0.81rem', fontWeight: 600 }}>{item.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginTop: '0.1rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{item.quantity}/{item.minStock} stuks</span>
                    {item.leadTimeDays > 0 && <span style={{ color: '#DC2626', fontWeight: 600 }}>{item.leadTimeDays}d levertijd</span>}
                  </div>
                </div>
              ))
            }
          </div>

          {/* Kosten calc mini */}
          <div className="card" style={{ flex: 0 }}>
            <h3 className="section-title" style={{ marginBottom: '0.75rem' }}>Kosten per artwork</h3>
            <CostCalcMini />
          </div>
        </div>
      </div>
    </>
  )
}

function CostCalcMini() {
  const defaults = { panelCost: 25, frameCost: 8, packCost: 5, printCost: 3, laborMin: 30, hourlyRate: 35, sellPrice: 149 }
  const [c, setC] = useState(() => { try { return JSON.parse(localStorage.getItem('artazest_costs')) || defaults } catch { return defaults } })
  const update = (key, val) => { const next = { ...c, [key]: parseFloat(val) || 0 }; setC(next); localStorage.setItem('artazest_costs', JSON.stringify(next)) }
  const laborCost = (c.laborMin / 60) * c.hourlyRate
  const totalCost = c.panelCost + c.frameCost + c.packCost + c.printCost + laborCost
  const margin = c.sellPrice - totalCost
  const marginPct = c.sellPrice > 0 ? Math.round((margin / c.sellPrice) * 100) : 0
  const inp = (key, label, w = 65) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: '1px solid rgba(28,25,23,0.05)' }}>
      <span style={{ fontSize: '0.78rem', color: '#78716C' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
        <span style={{ fontSize: '0.75rem', color: '#78716C' }}>€</span>
        <input type="number" value={c[key]} onChange={e => update(key, e.target.value)} style={{ width: `${w}px`, textAlign: 'right', padding: '2px 4px', border: '1px solid rgba(28,25,23,0.1)', borderRadius: '4px', fontSize: '0.8rem' }} />
      </div>
    </div>
  )
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
      <div>
        {inp('panelCost', 'Paneel')}{inp('frameCost', 'Lijst')}{inp('packCost', 'Verpakking')}{inp('printCost', 'Drukwerk')}{inp('sellPrice', 'Verkoopprijs')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }}>
        <div style={{ background: '#F2F0EB', borderRadius: '8px', padding: '0.75rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.62rem', fontWeight: 600, color: '#78716C', textTransform: 'uppercase' }}>Kostprijs</div>
          <div style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)' }}>€{totalCost.toFixed(0)}</div>
        </div>
        <div style={{ background: marginPct >= 40 ? '#D1FAE5' : marginPct >= 25 ? '#FEF3C7' : '#FEE2E2', borderRadius: '8px', padding: '0.75rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.62rem', fontWeight: 600, color: marginPct >= 40 ? '#065F46' : marginPct >= 25 ? '#92400E' : '#991B1B', textTransform: 'uppercase' }}>Marge</div>
          <div style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)', color: marginPct >= 40 ? '#059669' : marginPct >= 25 ? '#D97706' : '#DC2626' }}>{marginPct}%</div>
        </div>
      </div>
    </div>
  )
}
