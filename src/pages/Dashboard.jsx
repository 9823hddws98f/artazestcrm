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

  // Subtask-aware readiness
  let totalUnits = 0, doneUnits = 0
  activeTasks.forEach(t => {
    const subs = t.subtasks || []
    if (subs.length > 0) {
      totalUnits += subs.length
      doneUnits += subs.filter(s => s.completed).length
    } else {
      totalUnits += 1
      if (t.status === 'klaar') doneUnits += 1
    }
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
        <div>
          <h1>Launch Control</h1>
          <p className="page-subtitle">Artazest pre-launch &mdash; {todayStr}</p>
        </div>
      </div>

      {/* TOP: Countdown + Readiness */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        <div className="card" style={{ background: urgencyColor, border: 'none', textAlign: 'center', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', marginBottom: '0.35rem' }}>Dagen tot launch</div>
          <div style={{ fontSize: '4.5rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{daysLeft}</div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)', marginTop: '0.5rem' }}>18 april 2026</div>
        </div>

        <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Launch Readiness</div>
              <div style={{ fontSize: '2.75rem', fontFamily: 'var(--font-display)', fontWeight: 700, lineHeight: 1, color: readiness >= 80 ? '#059669' : readiness >= 50 ? 'var(--accent)' : '#DC2626' }}>{readiness}%</div>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
              {overdueTasks.length > 0 && <span style={{ padding: '0.2rem 0.65rem', borderRadius: '99px', background: '#FEE2E2', color: '#991B1B', fontSize: '0.72rem', fontWeight: 700 }}>⚠ {overdueTasks.length} te laat</span>}
              {todayTasks.length > 0 && <span style={{ padding: '0.2rem 0.65rem', borderRadius: '99px', background: 'var(--accent-light)', color: 'var(--accent-text)', fontSize: '0.72rem', fontWeight: 700 }}>● {todayTasks.length} vandaag</span>}
              {thisWeekTasks.length > 0 && <span style={{ padding: '0.2rem 0.65rem', borderRadius: '99px', background: 'var(--info-light)', color: 'var(--info)', fontSize: '0.72rem', fontWeight: 700 }}>● {thisWeekTasks.length} deze week</span>}
              {needsOrder.length > 0 && <span style={{ padding: '0.2rem 0.65rem', borderRadius: '99px', background: '#FEE2E2', color: '#991B1B', fontSize: '0.72rem', fontWeight: 700 }}>▦ {needsOrder.length} bestellen</span>}
            </div>
          </div>
          <div style={{ height: '10px', background: 'var(--bg-secondary)', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${readiness}%`, background: readiness >= 80 ? '#059669' : readiness >= 50 ? 'var(--accent)' : '#DC2626', borderRadius: '99px', transition: 'width 0.8s ease' }} />
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.6rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            <span><strong style={{ color: 'var(--text-primary)' }}>{doneTasks.length}</strong> taken klaar</span>
            <span><strong style={{ color: 'var(--text-primary)' }}>{openTasks.length}</strong> open</span>
            <span><strong style={{ color: 'var(--text-primary)' }}>{activeTasks.length}</strong> totaal</span>
          </div>
        </div>
      </div>

      {/* PER-PERSOON */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
        {personStats.map(p => (
          <div key={p.name} className="card" style={{ padding: '0.9rem 1.1rem', borderLeft: `4px solid ${p.overdue > 0 ? '#DC2626' : p.urgent > 0 ? 'var(--accent)' : 'var(--border)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{p.name}</div>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                {p.overdue > 0 && <span style={{ padding: '0.1rem 0.4rem', borderRadius: '99px', background: '#FEE2E2', color: '#991B1B', fontSize: '0.65rem', fontWeight: 700 }}>{p.overdue} te laat</span>}
                {p.urgent > 0 && p.overdue === 0 && <span style={{ padding: '0.1rem 0.4rem', borderRadius: '99px', background: 'var(--accent-light)', color: 'var(--accent-text)', fontSize: '0.65rem', fontWeight: 700 }}>{p.urgent} urgent</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: p.open > 0 ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1.1 }}>{p.open}</div>
                open
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: '#059669', lineHeight: 1.1 }}>{p.done}</div>
                klaar
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* VANDAAG + VOORRAAD */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
        {/* Vandaag & Achterstand */}
        <div className="card">
          <div className="section-header">
            <h3 className="section-title">Vandaag &amp; Achterstand</h3>
            <Link to="/tasks" className="btn btn-sm btn-outline">Alle taken →</Link>
          </div>

          {overdueTasks.length === 0 && todayTasks.length === 0 ? (
            <div className="empty-state">Niets achter 🎉 Ga door zo!</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {overdueTasks.map(t => {
                const d = Math.abs(daysUntil(t.dueDate))
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-md)', background: '#FEF2F2', borderLeft: '3px solid #DC2626' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>{t.title}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{t.assignee} &middot; {t.category}</div>
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#DC2626', whiteSpace: 'nowrap' }}>{d}d te laat</span>
                  </div>
                )
              })}
              {todayTasks.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--accent-light)', borderLeft: '3px solid var(--accent)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>{t.title}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{t.assignee} &middot; {t.category}</div>
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-text)', whiteSpace: 'nowrap' }}>Vandaag</span>
                </div>
              ))}
            </div>
          )}

          {thisWeekTasks.length > 0 && (
            <>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', margin: '1rem 0 0.5rem' }}>Deze week</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {thisWeekTasks.slice(0, 6).map(t => {
                  const d = daysUntil(t.dueDate)
                  const subs = t.subtasks || []
                  const subDone = subs.filter(s => s.completed).length
                  return (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.45rem 0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.81rem', fontWeight: 500 }}>{t.title}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          {t.assignee} &middot; {t.category}
                          {subs.length > 0 && <span style={{ marginLeft: '0.35rem', color: subDone === subs.length ? '#059669' : 'var(--text-secondary)' }}> · {subDone}/{subs.length}</span>}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.68rem', fontWeight: 600, color: d <= 2 ? '#D97706' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{d}d</span>
                    </div>
                  )
                })}
                {thisWeekTasks.length > 6 && <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', paddingLeft: '0.5rem' }}>+{thisWeekTasks.length - 6} meer&hellip;</div>}
              </div>
            </>
          )}
        </div>

        {/* Voorraad alerts */}
        <div className="card">
          <div className="section-header">
            <h3 className="section-title">Voorraad</h3>
            <Link to="/inventory" className="btn btn-sm btn-outline">Beheer →</Link>
          </div>
          {needsOrder.length === 0 ? (
            <div className="empty-state">Alles op voorraad ✓</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {needsOrder.map(item => (
                <div key={item.id} style={{ padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-md)', background: '#FEF2F2', borderLeft: '3px solid #DC2626' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{item.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.71rem', marginTop: '0.15rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{item.quantity}/{item.minStock} stuks</span>
                    {item.leadTimeDays > 0 && <span style={{ color: '#DC2626', fontWeight: 600 }}>{item.leadTimeDays}d levertijd</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
