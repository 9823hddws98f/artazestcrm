import { useState, useEffect } from 'react'
import { api } from '../api'

const DEFAULT_CHECKS = [
  // DAGELIJKS
  { id:'hd01', label:'Website laadt correct (artazest.com)', freq:'daily', cat:'Site', url:'https://artazest.com' },
  { id:'hd02', label:'Checkout flow werkt (testbestelling starten)', freq:'daily', cat:'Site', url:'https://artazest.com/checkout' },
  { id:'hd03', label:'Shopify admin bereikbaar', freq:'daily', cat:'Site', url:'https://kfnqpb-ra.myshopify.com/admin' },
  { id:'hd04', label:'Nieuwe orders gecheckt + verwerkt', freq:'daily', cat:'Orders' },
  { id:'hd05', label:'Klantvragen beantwoord (email/DM)', freq:'daily', cat:'Klant' },
  { id:'hd06', label:'Voorraad niveaus kloppen nog', freq:'daily', cat:'Voorraad' },

  // WEKELIJKS
  { id:'hw01', label:'Volledige checkout test (inclusief betaling)', freq:'weekly', cat:'Site' },
  { id:'hw02', label:'Mobiele checkout test (iOS + Android)', freq:'weekly', cat:'Site' },
  { id:'hw03', label:'GA4 data binnenkomst controleren', freq:'weekly', cat:'Analytics', url:'https://analytics.google.com' },
  { id:'hw04', label:'Meta Pixel events vuren correct', freq:'weekly', cat:'Analytics', url:'https://business.facebook.com/events_manager' },
  { id:'hw05', label:'Clarity heatmaps bekijken', freq:'weekly', cat:'Analytics', url:'https://clarity.microsoft.com' },
  { id:'hw06', label:'Klaviyo email flows actief + performance', freq:'weekly', cat:'Email', url:'https://www.klaviyo.com' },
  { id:'hw07', label:'Abandoned cart emails triggeren', freq:'weekly', cat:'Email' },
  { id:'hw08', label:'Alle productpaginas laden met afbeeldingen', freq:'weekly', cat:'Site' },
  { id:'hw09', label:'Verzendkosten berekening klopt', freq:'weekly', cat:'Site' },
  { id:'hw10', label:'Kortingscodes werken nog', freq:'weekly', cat:'Site' },
  { id:'hw11', label:'Paginasnelheid check (PageSpeed Insights)', freq:'weekly', cat:'Performance', url:'https://pagespeed.web.dev/?url=https://artazest.com' },
  { id:'hw12', label:'Social media engagement bekijken', freq:'weekly', cat:'Marketing' },
  { id:'hw13', label:'Concurrentie check (Arturel, etc.)', freq:'weekly', cat:'Marketing' },
  { id:'hw14', label:'Fysieke voorraad tellen vs dashboard', freq:'weekly', cat:'Voorraad' },
  { id:'hw15', label:'Meta Ads performance review (ROAS, CPC)', freq:'weekly', cat:'Ads' },

  // MAANDELIJKS
  { id:'hm01', label:'SSL certificaat geldig (geen waarschuwingen)', freq:'monthly', cat:'Security' },
  { id:'hm02', label:'Domein verlenging check (artazest.com)', freq:'monthly', cat:'Security' },
  { id:'hm03', label:'Shopify facturatie/plan controleren', freq:'monthly', cat:'Admin' },
  { id:'hm04', label:'Algemene voorwaarden nog actueel', freq:'monthly', cat:'Juridisch' },
  { id:'hm05', label:'Privacybeleid nog actueel (AVG)', freq:'monthly', cat:'Juridisch' },
  { id:'hm06', label:'Retourbeleid reviewen', freq:'monthly', cat:'Juridisch' },
  { id:'hm07', label:'Break-even calculator bijwerken met echte cijfers', freq:'monthly', cat:'Finance' },
  { id:'hm08', label:'Leverancier prijzen/condities reviewen', freq:'monthly', cat:'Inkoop' },
  { id:'hm09', label:'Backup check: Supabase data + productfoto\'s', freq:'monthly', cat:'Security' },
  { id:'hm10', label:'Core Web Vitals check (LCP, FID, CLS)', freq:'monthly', cat:'Performance', url:'https://search.google.com/search-console' },
]

const FREQ = { daily: { label: 'Dagelijks', days: 1, color: '#DC2626' }, weekly: { label: 'Wekelijks', days: 7, color: '#D97706' }, monthly: { label: 'Maandelijks', days: 30, color: '#2563EB' } }
const FREQ_ORDER = ['daily', 'weekly', 'monthly']

function daysSince(dateStr) {
  if (!dateStr) return Infinity
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

function statusFor(check) {
  const days = daysSince(check.lastChecked)
  const max = FREQ[check.freq]?.days || 7
  if (days <= max) return 'ok'        // Groen: op tijd
  if (days <= max * 1.5) return 'due'  // Geel: binnenkort
  return 'overdue'                     // Rood: te laat
}

const STATUS_STYLE = {
  ok: { bg: '#F0FDF4', border: '#BBF7D0', dot: '#059669', text: '✓' },
  due: { bg: '#FFFBEB', border: '#FDE68A', dot: '#D97706', text: '⏳' },
  overdue: { bg: '#FEF2F2', border: '#FECACA', dot: '#DC2626', text: '!' },
}

export default function HealthMonitor() {
  const [checks, setChecks] = useState(DEFAULT_CHECKS.map(c => ({ ...c, lastChecked: null, lastBy: null, notes: '' })))
  const [showAdd, setShowAdd] = useState(false)
  const [newCheck, setNewCheck] = useState({ label: '', freq: 'weekly', cat: 'Site', url: '' })
  const [filterFreq, setFilterFreq] = useState('all')
  const user = JSON.parse(localStorage.getItem('artazest_user') || '{}')

  useEffect(() => {
    api.getSetting('health_checks').then(val => { if (val?.length) setChecks(val) })
  }, [])

  const save = items => { setChecks(items); api.saveSetting('health_checks', items) }

  const markDone = id => {
    save(checks.map(c => c.id === id ? { ...c, lastChecked: new Date().toISOString(), lastBy: user.name || 'Tein' } : c))
  }

  const addCheck = () => {
    if (!newCheck.label.trim()) return
    save([...checks, { ...newCheck, id: `hc${Date.now()}`, lastChecked: null, lastBy: null, notes: '' }])
    setNewCheck({ label: '', freq: 'weekly', cat: 'Site', url: '' }); setShowAdd(false)
  }

  const removeCheck = id => save(checks.filter(c => c.id !== id))

  const filtered = filterFreq === 'all' ? checks : checks.filter(c => c.freq === filterFreq)
  const stats = {
    ok: checks.filter(c => statusFor(c) === 'ok').length,
    due: checks.filter(c => statusFor(c) === 'due').length,
    overdue: checks.filter(c => statusFor(c) === 'overdue').length,
  }
  const healthScore = checks.length > 0 ? Math.round(stats.ok / checks.length * 100) : 0

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Health Monitor</h1>
          <p className="page-subtitle">Periodieke checks — {stats.ok} ok · {stats.due} binnenkort · {stats.overdue} overdue</p>
        </div>
      </div>

      {/* Score + stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: healthScore >= 80 ? '#059669' : healthScore >= 50 ? '#D97706' : '#DC2626' }}>{healthScore}%</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Health score</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1rem', borderTop: '3px solid #059669' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#059669' }}>{stats.ok}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>✓ Op tijd</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1rem', borderTop: '3px solid #D97706' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#D97706' }}>{stats.due}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>⏳ Binnenkort</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1rem', borderTop: '3px solid #DC2626' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#DC2626' }}>{stats.overdue}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>! Overdue</div>
        </div>
      </div>

      {/* Filter + add */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.3rem' }}>
          <button onClick={() => setFilterFreq('all')} style={{ padding: '0.25rem 0.6rem', borderRadius: '99px', border: `1.5px solid ${filterFreq === 'all' ? 'var(--accent)' : 'var(--border)'}`, background: filterFreq === 'all' ? 'var(--accent)' : 'transparent', color: filterFreq === 'all' ? '#fff' : 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}>Alle ({checks.length})</button>
          {FREQ_ORDER.map(f => {
            const count = checks.filter(c => c.freq === f).length
            const overdueCount = checks.filter(c => c.freq === f && statusFor(c) === 'overdue').length
            return (
              <button key={f} onClick={() => setFilterFreq(f)} style={{ padding: '0.25rem 0.6rem', borderRadius: '99px', border: `1.5px solid ${filterFreq === f ? FREQ[f].color : 'var(--border)'}`, background: filterFreq === f ? FREQ[f].color : 'transparent', color: filterFreq === f ? '#fff' : 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}>
                {FREQ[f].label} ({count}){overdueCount > 0 && <span style={{ color: filterFreq === f ? '#fff' : '#DC2626', marginLeft: '0.2rem' }}>· {overdueCount}!</span>}
              </button>
            )
          })}
        </div>
        <button onClick={() => setShowAdd(!showAdd)} style={{ padding: '0.25rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600 }}>+ Check</button>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: '1rem', padding: '0.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <input value={newCheck.label} onChange={e => setNewCheck({ ...newCheck, label: e.target.value })} placeholder="Wat moet je checken?" onKeyDown={e => e.key === 'Enter' && addCheck()}
              style={{ padding: '0.35rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.75rem', fontFamily: 'var(--font-body)' }} />
            <select value={newCheck.freq} onChange={e => setNewCheck({ ...newCheck, freq: e.target.value })} style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.72rem', fontFamily: 'var(--font-body)' }}>
              {FREQ_ORDER.map(f => <option key={f} value={f}>{FREQ[f].label}</option>)}
            </select>
            <button onClick={addCheck} style={{ padding: '0.35rem', borderRadius: '4px', background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}>+</button>
          </div>
          <input value={newCheck.url || ''} onChange={e => setNewCheck({ ...newCheck, url: e.target.value })} placeholder="URL (optioneel)" style={{ width: '100%', padding: '0.3rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.72rem', fontFamily: 'var(--font-body)' }} />
        </div>
      )}

      {/* Checks per frequentie */}
      {FREQ_ORDER.filter(f => filterFreq === 'all' || filterFreq === f).map(freq => {
        const items = filtered.filter(c => c.freq === freq)
          .sort((a, b) => {
            const sa = statusFor(a), sb = statusFor(b)
            const order = { overdue: 0, due: 1, ok: 2 }
            return (order[sa] ?? 1) - (order[sb] ?? 1)
          })
        if (items.length === 0) return null

        return (
          <div key={freq} style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: FREQ[freq].color }} />
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>{FREQ[freq].label}</h3>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>elke {FREQ[freq].days === 1 ? 'dag' : `${FREQ[freq].days} dagen`}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {items.map(check => {
                const st = statusFor(check)
                const s = STATUS_STYLE[st]
                const days = daysSince(check.lastChecked)
                return (
                  <div key={check.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', borderRadius: '8px', background: s.bg, border: `1px solid ${s.border}`, borderLeft: `3px solid ${s.dot}` }}>
                    {/* Check knop */}
                    <button onClick={() => markDone(check.id)} style={{ width: '24px', height: '24px', borderRadius: '50%', border: `2px solid ${s.dot}`, background: st === 'ok' ? s.dot : 'transparent', color: st === 'ok' ? '#fff' : s.dot, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }}>
                      {s.text}
                    </button>

                    {/* Label */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-primary)' }}>{check.label}</div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>
                        {check.cat}
                        {check.lastChecked && <> · {days === 0 ? 'vandaag' : days === 1 ? 'gisteren' : `${days}d geleden`} door {check.lastBy}</>}
                        {!check.lastChecked && ' · nog nooit gecheckt'}
                      </div>
                    </div>

                    {/* Link */}
                    {check.url && <a href={check.url} target="_blank" rel="noopener" onClick={e => e.stopPropagation()} style={{ fontSize: '0.6rem', color: 'var(--accent)', flexShrink: 0, textDecoration: 'none' }}>→ Open</a>}

                    {/* Verwijder */}
                    <button onClick={() => removeCheck(check.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.6rem', opacity: 0.3, flexShrink: 0 }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.3'}>×</button>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </>
  )
}
