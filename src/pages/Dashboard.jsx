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
  const diff = new Date(date) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

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

  const personStats = ASSIGNEES.map(name => ({
    name,
    open: openTasks.filter(t => t.assignee === name).length,
    urgent: openTasks.filter(t => t.assignee === name && t.priority === 'high').length,
    overdue: overdueTasks.filter(t => t.assignee === name).length,
    done: doneTasks.filter(t => t.assignee === name).length,
  }))

  const needsOrder = inventory.filter(i => i.minStock > 0 && i.quantity < i.minStock)
  const urgencyColor = daysLeft <= 3 ? '#DC2626' : daysLeft <= 7 ? '#D97706' : daysLeft <= 14 ? 'var(--accent)' : '#2563EB'
  const todayStr = new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <>
      <div className="page-header">
        <div><h1>Launch Control</h1>
          <p className="page-subtitle">Artazest pre-launch &mdash; {todayStr}</p>
        </div>
      </div>

      {/* Countdown + Readiness */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        <div className="card" style={{ background: urgencyColor, border: 'none', textAlign: 'center', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', marginBottom: '0.35rem' }}>Dagen tot launch</div>
          <div style={{ fontSize: '4rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{daysLeft}</div>
          <div style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.65)', marginTop: '0.5rem' }}>18 april 2026</div>
        </div>
        <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Launch Readiness</div>
              <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: 700, lineHeight: 1, color: readiness >= 80 ? '#059669' : readiness >= 50 ? 'var(--accent)' : '#DC2626' }}>{readiness}%</div>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
              {overdueTasks.length > 0 && <span style={{ padding: '0.2rem 0.65rem', borderRadius: '99px', background: '#FEE2E2', color: '#991B1B', fontSize: '0.7rem', fontWeight: 700 }}>⚠ {overdueTasks.length} te laat</span>}
              {todayTasks.length > 0 && <span style={{ padding: '0.2rem 0.65rem', borderRadius: '99px', background: 'var(--accent-light)', color: 'var(--accent-text)', fontSize: '0.7rem', fontWeight: 700 }}>● {todayTasks.length} vandaag</span>}
              {thisWeekTasks.length > 0 && <span style={{ padding: '0.2rem 0.65rem', borderRadius: '99px', background: 'var(--info-light)', color: 'var(--info)', fontSize: '0.7rem', fontWeight: 700 }}>● {thisWeekTasks.length} deze week</span>}
              {needsOrder.length > 0 && <span style={{ padding: '0.2rem 0.65rem', borderRadius: '99px', background: '#FEE2E2', color: '#991B1B', fontSize: '0.7rem', fontWeight: 700 }}>▦ {needsOrder.length} bestellen</span>}
            </div>
          </div>
          <div style={{ height: '10px', background: 'var(--bg-secondary)', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${readiness}%`, background: readiness >= 80 ? '#059669' : readiness >= 50 ? 'var(--accent)' : '#DC2626', borderRadius: '99px', transition: 'width 0.8s ease' }} />
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.6rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            <span><strong style={{ color: 'var(--text-primary)' }}>{doneTasks.length}</strong> klaar</span>
            <span><strong style={{ color: 'var(--text-primary)' }}>{openTasks.length}</strong> open</span>
            <span><strong style={{ color: 'var(--text-primary)' }}>{activeTasks.length}</strong> totaal</span>
          </div>
        </div>
      </div>

      {/* Per persoon */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
        {personStats.map(p => (
          <div key={p.name} className="card" style={{ padding: '0.9rem 1.1rem', borderLeft: `4px solid ${p.overdue > 0 ? '#DC2626' : p.urgent > 0 ? 'var(--accent)' : 'var(--border)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{p.name}</div>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                {p.overdue > 0 && <span style={{ padding: '0.1rem 0.4rem', borderRadius: '99px', background: '#FEE2E2', color: '#991B1B', fontSize: '0.63rem', fontWeight: 700 }}>{p.overdue} te laat</span>}
                {p.urgent > 0 && p.overdue === 0 && <span style={{ padding: '0.1rem 0.4rem', borderRadius: '99px', background: 'var(--accent-light)', color: 'var(--accent-text)', fontSize: '0.63rem', fontWeight: 700 }}>{p.urgent} urgent</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: p.open > 0 ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1.1 }}>{p.open}</div>open
              </div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: '#059669', lineHeight: 1.1 }}>{p.done}</div>klaar
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Vandaag & Voorraad */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        <div className="card">
          <div className="section-header">
            <h3 className="section-title">Vandaag &amp; Achterstand</h3>
            <Link to="/tasks" className="btn btn-sm btn-outline">Alle taken →</Link>
          </div>
          {overdueTasks.length === 0 && todayTasks.length === 0 ? (
            <div className="empty-state">Niets achter 🎉</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {overdueTasks.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', background: '#FEF2F2', borderLeft: '3px solid #DC2626' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>{t.title}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{t.assignee} · {t.category}</div>
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#DC2626', whiteSpace: 'nowrap' }}>{Math.abs(daysUntil(t.dueDate))}d te laat</span>
                </div>
              ))}
              {todayTasks.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--accent-light)', borderLeft: '3px solid var(--accent)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>{t.title}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{t.assignee} · {t.category}</div>
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-text)', whiteSpace: 'nowrap' }}>Vandaag</span>
                </div>
              ))}
            </div>
          )}
          {thisWeekTasks.length > 0 && (
            <>
              <div style={{ fontSize: '0.63rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', margin: '1rem 0 0.5rem' }}>Deze week</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {thisWeekTasks.slice(0, 6).map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{t.title}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{t.assignee} · {t.category}</div>
                    </div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 600, color: daysUntil(t.dueDate) <= 2 ? '#D97706' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{daysUntil(t.dueDate)}d</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="card">
          <div className="section-header">
            <h3 className="section-title">Voorraad alerts</h3>
            <Link to="/inventory" className="btn btn-sm btn-outline">Beheer →</Link>
          </div>
          {needsOrder.length === 0 ? <div className="empty-state">Alles op voorraad ✓</div> :
            needsOrder.map(item => (
              <div key={item.id} style={{ padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-md)', background: '#FEF2F2', borderLeft: '3px solid #DC2626', marginBottom: '0.4rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{item.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginTop: '0.1rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.quantity}/{item.minStock} stuks</span>
                  {item.leadTimeDays > 0 && <span style={{ color: '#DC2626', fontWeight: 600 }}>{item.leadTimeDays}d levertijd</span>}
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Kosten calculator */}
      <div className="card">
        <h3 className="section-title" style={{ marginBottom: '1rem' }}>Kosten per artwork</h3>
        <CostCalc />
      </div>
    </>
  )
}

function CostCalc() {
  const defaults = { panelCost: 25, frameCost: 8, packCost: 5, printCost: 3, laborMin: 30, hourlyRate: 35, sellPrice: 149 }
  const [c, setC] = useState(() => { try { return JSON.parse(localStorage.getItem('artazest_costs')) || defaults } catch { return defaults } })
  const update = (key, val) => { const next = { ...c, [key]: parseFloat(val) || 0 }; setC(next); localStorage.setItem('artazest_costs', JSON.stringify(next)) }
  const laborCost = (c.laborMin / 60) * c.hourlyRate
  const totalCost = c.panelCost + c.frameCost + c.packCost + c.printCost + laborCost
  const margin = c.sellPrice - totalCost
  const marginPct = c.sellPrice > 0 ? Math.round((margin / c.sellPrice) * 100) : 0
  const f = (key, label) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid rgba(28,25,23,0.05)' }}>
      <span style={{ fontSize: '0.82rem', color: '#78716C' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <span style={{ fontSize: '0.8rem', color: '#78716C' }}>€</span>
        <input type="number" value={c[key]} onChange={e => update(key, e.target.value)} style={{ width: '65px', textAlign: 'right', padding: '2px 6px', border: '1px solid rgba(28,25,23,0.1)', borderRadius: '4px', fontSize: '0.85rem', fontFamily: 'var(--font-body)' }} />
      </div>
    </div>
  )
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
      <div>
        {f('panelCost', 'Paneel (inkoop)')}{f('frameCost', 'Houten lijst')}{f('packCost', 'Verpakking')}{f('printCost', 'Drukwerk')}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid rgba(28,25,23,0.05)' }}>
          <span style={{ fontSize: '0.82rem', color: '#78716C' }}>Arbeid</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <input type="number" value={c.laborMin} onChange={e => update('laborMin', e.target.value)} style={{ width: '45px', textAlign: 'right', padding: '2px 6px', border: '1px solid rgba(28,25,23,0.1)', borderRadius: '4px', fontSize: '0.85rem', fontFamily: 'var(--font-body)' }} />
            <span style={{ fontSize: '0.72rem', color: '#78716C' }}>min × €</span>
            <input type="number" value={c.hourlyRate} onChange={e => update('hourlyRate', e.target.value)} style={{ width: '45px', textAlign: 'right', padding: '2px 6px', border: '1px solid rgba(28,25,23,0.1)', borderRadius: '4px', fontSize: '0.85rem', fontFamily: 'var(--font-body)' }} />
          </div>
        </div>
        {f('sellPrice', 'Verkoopprijs')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center' }}>
        <div style={{ background: '#F2F0EB', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#78716C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kostprijs</div>
          <div style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)' }}>€{totalCost.toFixed(2)}</div>
        </div>
        <div style={{ background: marginPct >= 50 ? '#D1FAE5' : marginPct >= 30 ? '#FEF3C7' : '#FEE2E2', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, color: marginPct >= 50 ? '#065F46' : marginPct >= 30 ? '#92400E' : '#991B1B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Marge</div>
          <div style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', color: marginPct >= 50 ? '#059669' : marginPct >= 30 ? '#D97706' : '#DC2626' }}>€{margin.toFixed(2)} <span style={{ fontSize: '0.9rem' }}>({marginPct}%)</span></div>
        </div>
      </div>
    </div>
  )
}
