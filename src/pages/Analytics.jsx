import { useState, useEffect } from 'react'
import { api } from '../api'

const CATEGORIES = [
  { key: 'productie', label: 'Productie & tooling', icon: '⚙' },
  { key: 'fotografie', label: 'Fotografie & video', icon: '◉' },
  { key: 'juridisch', label: 'Juridisch & IP', icon: '§' },
  { key: 'branding', label: 'Branding & design', icon: '◈' },
  { key: 'voorraad', label: 'Voorraad (inkoop)', icon: '▦' },
  { key: 'marketing', label: 'Marketing & ads', icon: '▶' },
  { key: 'website', label: 'Website & tech', icon: '◻' },
  { key: 'verpakking', label: 'Verpakking & verzending', icon: '▣' },
  { key: 'overig', label: 'Overig', icon: '·' },
]

const fmt = n => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
const fmtD = n => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n)

export default function Analytics() {
  const [tab, setTab] = useState('overzicht')
  const [investments, setInvestments] = useState([])
  const [budgets, setBudgets] = useState([])
  const [cfg, setCfg] = useState({ cashOnHand: 15000, monthlyFixed: 2500 })
  const [showModal, setShowModal] = useState(false)
  const [liveMetrics, setLiveMetrics] = useState({ shopifyRevenue: 0, metaAdSpend: 0, cogs: 0 })
  useEffect(() => {
    // Laad live metrics uit Supabase settings
    api.getAll('settings').then(rows => {
      const row = rows.find(r => r.key === 'live_metrics')
      if (row?.value) setLiveMetrics(row.value)
      else {
        // Fallback localStorage
        try { const m = JSON.parse(localStorage.getItem('artazest_live_metrics')); if(m) setLiveMetrics(m) } catch {}
      }
    })
  }, [])
  const saveLiveMetrics = m => {
    setLiveMetrics(m)
    localStorage.setItem('artazest_live_metrics', JSON.stringify(m))
    api.save('settings', { key: 'live_metrics', value: m })
  }
  const [editItem, setEditItem] = useState(null)
  useEffect(() => {
    api.getAll('investments').then(setInvestments)
    api.getAll('budgets').then(setBudgets)
    const s = localStorage.getItem('artazest_analytics_cfg')
    if (s) setCfg(JSON.parse(s))
  }, [])

  const saveCfg = c => { setCfg(c); localStorage.setItem('artazest_analytics_cfg', JSON.stringify(c)) }
  const totalInv = investments.reduce((s, i) => s + (i.amount || 0), 0)
  const byCategory = CATEGORIES.map(cat => {
    const items = investments.filter(i => i.category === cat.key)
    const total = items.reduce((s, i) => s + (i.amount || 0), 0)
    const budget = budgets.find(b => b.category === cat.key)?.amount || 0
    return { ...cat, items, total, budget }
  }).filter(c => c.total > 0 || c.budget > 0)
  const maxCat = Math.max(...byCategory.map(c => Math.max(c.total, c.budget)), 1)
  const burnRate = cfg.monthlyFixed
  const runway = burnRate > 0 ? Math.round((cfg.cashOnHand / burnRate) * 10) / 10 : Infinity

  const tabs = [
    { key: 'overzicht', label: 'Overzicht' },
    { key: 'investeringen', label: 'Investeringen' },
    { key: 'breakeven', label: 'Break-even' },
    { key: 'cashflow', label: 'Cash flow' },
  ]

  return (
    <>
      <div className="page-header">
        <div><h1>Analytics</h1><p className="page-subtitle">Financieel overzicht — investeringen, burn rate & projecties</p></div>
      </div>      <div className="tabs">
        {tabs.map(t => <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>
      {tab === 'overzicht' && <OverviewTab {...{ totalInv, burnRate, runway, cfg, saveCfg, byCategory, maxCat, investments, liveMetrics, saveLiveMetrics }} />}
      {tab === 'investeringen' && <InvestmentsTab {...{ investments, setInvestments, budgets, setBudgets, showModal, setShowModal, editItem, setEditItem }} />}
      {tab === 'breakeven' && <BreakevenTab cfg={cfg} />}
      {tab === 'cashflow' && <CashflowTab {...{ cfg, saveCfg, totalInv }} />}
    </>
  )
}

/* ========== OVERVIEW ========== */
function OverviewTab({ totalInv, burnRate, runway, cfg, saveCfg, byCategory, maxCat, investments, liveMetrics, saveLiveMetrics }) {
  const recent = [...investments].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 6)
  const { shopifyRevenue, metaAdSpend, cogs } = liveMetrics
  const grossProfit = shopifyRevenue - cogs - metaAdSpend
  const margin = shopifyRevenue > 0 ? (grossProfit / shopifyRevenue * 100) : 0
  const marginTarget = 40
  const marginOk = margin >= marginTarget
  const upd = (k, v) => saveLiveMetrics({ ...liveMetrics, [k]: parseFloat(v) || 0 })

  return (
    <>
      {/* LIVE METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.85rem', marginBottom: '1.5rem' }}>
        {/* Shopify Omzet */}
        <div className="metric-card" style={{ borderTop: '3px solid #059669' }}>
          <div className="metric-label">Shopify omzet</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', margin: '0.35rem 0' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>€</span>
            <input type="number" value={shopifyRevenue} onChange={e => upd('shopifyRevenue', e.target.value)}
              style={{ width: '100%', fontSize: '1.5rem', fontFamily: 'var(--font-display)', fontWeight: 700, border: 'none', background: 'transparent', color: '#059669', outline: 'none', padding: 0 }} />
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>klik om in te vullen</div>
        </div>

        {/* Meta Ads */}
        <div className="metric-card" style={{ borderTop: '3px solid #DC2626' }}>
          <div className="metric-label">Meta Ads kosten</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', margin: '0.35rem 0' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>€</span>
            <input type="number" value={metaAdSpend} onChange={e => upd('metaAdSpend', e.target.value)}
              style={{ width: '100%', fontSize: '1.5rem', fontFamily: 'var(--font-display)', fontWeight: 700, border: 'none', background: 'transparent', color: '#DC2626', outline: 'none', padding: 0 }} />
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>klik om in te vullen</div>
        </div>

        {/* COGS */}
        <div className="metric-card" style={{ borderTop: '3px solid #D97706' }}>
          <div className="metric-label">Inkoopkosten (COGS)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', margin: '0.35rem 0' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>€</span>
            <input type="number" value={cogs} onChange={e => upd('cogs', e.target.value)}
              style={{ width: '100%', fontSize: '1.5rem', fontFamily: 'var(--font-display)', fontWeight: 700, border: 'none', background: 'transparent', color: '#D97706', outline: 'none', padding: 0 }} />
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>klik om in te vullen</div>
        </div>

        {/* Winst + marge */}
        <div className="metric-card" style={{ borderTop: `3px solid ${marginOk ? '#059669' : '#DC2626'}`, background: marginOk ? '#F0FDF4' : grossProfit < 0 ? '#FEF2F2' : 'var(--bg-card)' }}>
          <div className="metric-label">Brutomarge</div>
          <div style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: marginOk ? '#059669' : '#DC2626', margin: '0.35rem 0' }}>
            {fmtD(grossProfit)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: marginOk ? '#059669' : '#DC2626' }}>{margin.toFixed(1)}%</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>doel: ≥{marginTarget}%</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: marginOk ? '#059669' : '#DC2626' }}>{marginOk ? '✓' : `${(marginTarget - margin).toFixed(1)}% tekort`}</span>
          </div>
          {shopifyRevenue > 0 && (
            <div style={{ marginTop: '0.4rem', height: '4px', background: 'rgba(0,0,0,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, margin / marginTarget * 100))}%`, background: marginOk ? '#059669' : '#DC2626', borderRadius: '99px' }} />
            </div>
          )}
        </div>
      </div>

      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-label">Totaal geïnvesteerd</div>
          <div className="metric-value">{fmt(totalInv)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Burn rate /maand</div>
          <div className="metric-value">{fmt(burnRate)}</div>
          <input type="range" min="500" max="10000" step="100" value={cfg.monthlyFixed}
            onChange={e => saveCfg({ ...cfg, monthlyFixed: +e.target.value })}
            style={{ width: '100%', accentColor: 'var(--accent)', marginTop: '0.5rem' }} />
        </div>        <div className="metric-card">
          <div className="metric-label">Cash on hand</div>
          <div className="metric-value">{fmt(cfg.cashOnHand)}</div>
          <input type="range" min="0" max="100000" step="1000" value={cfg.cashOnHand}
            onChange={e => saveCfg({ ...cfg, cashOnHand: +e.target.value })}
            style={{ width: '100%', accentColor: 'var(--accent)', marginTop: '0.5rem' }} />
        </div>
        <div className="metric-card">
          <div className="metric-label">Runway</div>
          <div className="metric-value" style={{ color: runway > 12 ? 'var(--success)' : runway > 6 ? 'var(--accent)' : 'var(--danger)' }}>
            {runway === Infinity ? '∞' : runway} <span style={{ fontSize: '0.9rem' }}>mnd</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {runway > 18 ? 'Gezond' : runway > 12 ? 'Voldoende' : runway > 6 ? 'Let op' : 'Kritiek'}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="section-title" style={{ marginBottom: '1rem' }}>Investering per categorie</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {byCategory.sort((a, b) => b.total - a.total).map(cat => (
            <div key={cat.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.2rem' }}>
                <span><span style={{ marginRight: '0.5rem' }}>{cat.icon}</span>{cat.label}</span>
                <span style={{ fontWeight: 600 }}>{fmt(cat.total)}</span>
              </div>              <div style={{ position: 'relative', height: '8px', borderRadius: '4px', background: 'var(--bg-secondary)' }}>
                {cat.budget > 0 && <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${(cat.budget / maxCat) * 100}%`, borderRadius: '4px', background: 'rgba(217,119,6,0.15)' }} />}
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${(cat.total / maxCat) * 100}%`, borderRadius: '4px', background: cat.budget > 0 && cat.total > cat.budget ? 'var(--danger)' : 'var(--accent)', transition: 'width 0.5s ease' }} />
              </div>
              {cat.budget > 0 && <div style={{ fontSize: '0.7rem', color: cat.total > cat.budget ? 'var(--danger)' : 'var(--text-secondary)', marginTop: '0.15rem' }}>
                Budget: {fmt(cat.budget)} — {cat.total > cat.budget ? `⚠ ${fmt(cat.total - cat.budget)} over budget` : `${fmt(cat.budget - cat.total)} resterend`}
              </div>}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h3 className="section-title" style={{ marginBottom: '1rem' }}>Verdeling</h3>
          {byCategory.sort((a, b) => b.total - a.total).map(cat => {
            const pct = totalInv > 0 ? Math.round((cat.total / totalInv) * 100) : 0
            return (
              <div key={cat.key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.35rem 0' }}>
                <span style={{ fontSize: '0.85rem', width: '1.2rem', textAlign: 'center' }}>{cat.icon}</span>
                <span style={{ flex: 1, fontSize: '0.82rem' }}>{cat.label}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, minWidth: '3rem', textAlign: 'right' }}>{pct}%</span>
              </div>
            )
          })}
        </div>        <div className="card">
          <h3 className="section-title" style={{ marginBottom: '1rem' }}>Recente uitgaven</h3>
          {recent.length === 0 ? <div className="empty-state">Nog geen investeringen</div> :
          recent.map(inv => (
            <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.82rem' }}>
              <div><div style={{ fontWeight: 500 }}>{inv.description}</div><div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{inv.date || '—'}</div></div>
              <div style={{ fontWeight: 600 }}>{fmtD(inv.amount)}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

/* ========== INVESTMENTS TAB ========== */
function InvestmentsTab({ investments, setInvestments, budgets, setBudgets, showModal, setShowModal, editItem, setEditItem }) {
  const [form, setForm] = useState({ description: '', amount: '', category: 'productie', date: new Date().toISOString().split('T')[0], notes: '' })
  const [openCat, setOpenCat] = useState(null)
  const [budgetEdit, setBudgetEdit] = useState(null)

  const openNew = () => { setForm({ description: '', amount: '', category: 'productie', date: new Date().toISOString().split('T')[0], notes: '' }); setEditItem(null); setShowModal(true) }
  const openEdit = item => { setForm({ ...item, amount: String(item.amount) }); setEditItem(item); setShowModal(true) }
  const handleSave = async () => {
    if (!form.description || !form.amount) return
    await api.save('investments', { ...form, amount: parseFloat(form.amount), ...(editItem ? { id: editItem.id } : {}) })
    api.getAll('investments').then(setInvestments); setShowModal(false)
  }
  const handleDel = async id => { await api.remove('investments', id); api.getAll('investments').then(setInvestments) }
  const saveBudget = async (k, v) => {
    const ex = (await api.getAll('budgets')).find(b => b.category === k)
    await api.save('budgets', { ...(ex || {}), category: k, amount: parseFloat(v) || 0 })
    api.getAll('budgets').then(setBudgets); setBudgetEdit(null)
  }
  return (
    <>
      <div className="section-header" style={{ marginBottom: '1rem' }}>
        <h3 className="section-title">Alle investeringen</h3>
        <button className="btn btn-primary" onClick={openNew}>+ Toevoegen</button>
      </div>
      {CATEGORIES.map(cat => {
        const items = investments.filter(i => i.category === cat.key)
        const bud = budgets.find(b => b.category === cat.key)
        if (!items.length && !bud) return null
        const total = items.reduce((s, i) => s + (i.amount || 0), 0)
        return (
          <div key={cat.key} className="card" style={{ marginBottom: '0.75rem', padding: '0.75rem 1rem', cursor: 'pointer' }}
            onClick={() => setOpenCat(openCat === cat.key ? null : cat.key)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>{cat.icon}</span><span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{cat.label}</span>
                <span className="badge badge-amber">{fmt(total)}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{items.length} items</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={e => e.stopPropagation()}>
                {budgetEdit === cat.key
                  ? <input type="number" placeholder="Budget" autoFocus className="form-input" style={{ width: '100px', padding: '0.3rem 0.5rem', fontSize: '0.8rem' }} defaultValue={bud?.amount || ''} onBlur={e => saveBudget(cat.key, e.target.value)} onKeyDown={e => e.key === 'Enter' && saveBudget(cat.key, e.target.value)} />
                  : <button className="btn btn-sm btn-outline" onClick={() => setBudgetEdit(cat.key)}>{bud ? `Budget: ${fmt(bud.amount)}` : '+ Budget'}</button>}
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{openCat === cat.key ? '▲' : '▼'}</span>
              </div>
            </div>
            {openCat === cat.key && (
              <div onClick={e => e.stopPropagation()} style={{ marginTop: '0.75rem' }}>
            <table className="data-table">
              <thead><tr><th>Beschrijving</th><th>Datum</th><th style={{ textAlign: 'right' }}>Bedrag</th><th style={{ width: '60px' }}></th></tr></thead>
              <tbody>
                {items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).map(item => (
                  <tr key={item.id}>
                    <td><div style={{ fontWeight: 500 }}>{item.description}</div>{item.notes && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.notes}</div>}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.date || '—'}</td>                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmtD(item.amount)}</td>
                    <td><div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button onClick={() => openEdit(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>✎</button>
                      <button onClick={() => handleDel(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--danger)' }}>✕</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
              </div>
            )}
          </div>
        )
      })}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{editItem ? 'Bewerken' : 'Investering toevoegen'}</h3><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
            <div className="form-group"><label className="form-label">Beschrijving</label><input className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Bijv. Product fotografie shoot" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group"><label className="form-label">Bedrag (€)</label><input className="form-input" type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" /></div>
              <div className="form-group"><label className="form-label">Datum</label><input className="form-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
            </div>
            <div className="form-group"><label className="form-label">Categorie</label>
              <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Notities</label><textarea className="form-textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuleren</button>
              <button className="btn btn-primary" onClick={handleSave}>{editItem ? 'Opslaan' : 'Toevoegen'}</button>
            </div>          </div>
        </div>
      )}
    </>
  )
}

/* ========== BREAK-EVEN TAB ========== */
function BreakevenTab({ cfg }) {
  const [be, setBe] = useState({ sellPrice: 149, panelCost: 25, frameCost: 8, packCost: 5, printCost: 3, laborMin: 30, hourlyRate: 35, shippingCost: 12, paymentPct: 2.9, paymentFixed: 0.30, monthlyFixed: cfg.monthlyFixed || 2500 })
  useEffect(() => { const s = localStorage.getItem('artazest_be'); if (s) setBe(JSON.parse(s)) }, [])
  useEffect(() => { localStorage.setItem('artazest_be', JSON.stringify(be)) }, [be])

  const laborCost = (be.laborMin / 60) * be.hourlyRate
  const paymentCost = (be.sellPrice * be.paymentPct / 100) + be.paymentFixed
  const varCost = be.panelCost + be.frameCost + be.packCost + be.printCost + laborCost + be.shippingCost + paymentCost
  const cm = be.sellPrice - varCost
  const cmPct = be.sellPrice > 0 ? Math.round((cm / be.sellPrice) * 100) : 0
  const beUnits = cm > 0 ? Math.ceil(be.monthlyFixed / cm) : Infinity
  const beRev = beUnits * be.sellPrice

  const slider = (key, label, min, max, step, pre, suf) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.4rem 0' }}>
      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', minWidth: '130px' }}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={be[key]} onChange={e => setBe({ ...be, [key]: parseFloat(e.target.value) })} style={{ flex: 1, accentColor: 'var(--accent)' }} />
      <span style={{ fontSize: '0.85rem', fontWeight: 600, minWidth: '65px', textAlign: 'right' }}>{pre}{Number.isInteger(be[key]) || step >= 1 ? be[key] : be[key].toFixed(1)}{suf}</span>
    </div>
  )

  const costItems = [
    { label: 'Paneel', val: be.panelCost, color: '#D97706' },
    { label: 'Lijst', val: be.frameCost, color: '#B45309' },    { label: 'Verpakking', val: be.packCost, color: '#92400E' },
    { label: 'Drukwerk', val: be.printCost, color: '#78350F' },
    { label: 'Arbeid', val: laborCost, color: '#059669' },
    { label: 'Verzending', val: be.shippingCost, color: '#2563EB' },
    { label: 'Payment', val: paymentCost, color: '#7C3AED' },
  ]

  return (
    <>
      <div className="metric-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="metric-card" style={{ background: cmPct >= 50 ? 'var(--success-light)' : cmPct >= 30 ? 'var(--accent-light)' : 'var(--danger-light)' }}>
          <div className="metric-label">Contributie marge</div>
          <div className="metric-value">{fmtD(cm)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{cmPct}% per paneel</div>
        </div>
        <div className="metric-card"><div className="metric-label">Break-even punt</div><div className="metric-value">{beUnits === Infinity ? '∞' : beUnits}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>panelen per maand</div></div>
        <div className="metric-card"><div className="metric-label">Break-even omzet</div><div className="metric-value">{beUnits === Infinity ? '—' : fmt(beRev)}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>per maand nodig</div></div>
        <div className="metric-card"><div className="metric-label">Variabele kosten</div><div className="metric-value">{fmtD(varCost)}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>per paneel</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h3 className="section-title" style={{ marginBottom: '0.75rem' }}>Variabele kosten per paneel</h3>
          {slider('panelCost', 'Paneel (inkoop)', 5, 80, 1, '€', '')}
          {slider('frameCost', 'Houten lijst', 0, 30, 1, '€', '')}
          {slider('packCost', 'Verpakking', 0, 20, 1, '€', '')}
          {slider('printCost', 'Drukwerk', 0, 15, 1, '€', '')}
          {slider('shippingCost', 'Verzending', 0, 30, 1, '€', '')}
          {slider('laborMin', 'Arbeid', 5, 120, 5, '', ' min')}
          {slider('hourlyRate', 'Uurtarief', 15, 75, 5, '€', '/u')}          <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.5rem', paddingTop: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Payment ({be.paymentPct}% + €{be.paymentFixed})</span><span style={{ fontWeight: 600 }}>{fmtD(paymentCost)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Arbeid ({be.laborMin}min × €{be.hourlyRate}/u)</span><span style={{ fontWeight: 600 }}>{fmtD(laborCost)}</span></div>
          </div>
        </div>

        <div className="card">
          <h3 className="section-title" style={{ marginBottom: '0.75rem' }}>Prijs & vaste kosten</h3>
          {slider('sellPrice', 'Verkoopprijs', 49, 399, 1, '€', '')}
          {slider('monthlyFixed', 'Vaste kosten/mnd', 500, 10000, 100, '€', '')}
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem' }}>Kostenopbouw per paneel</h4>
            {costItems.map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.2rem 0' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: item.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '0.8rem' }}>{item.label}</span>
                <div style={{ width: '55%', height: '6px', borderRadius: '3px', background: 'rgba(28,25,23,0.06)' }}>
                  <div style={{ height: '100%', borderRadius: '3px', background: item.color, width: `${(item.val / be.sellPrice) * 100}%` }} />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, minWidth: '50px', textAlign: 'right' }}>{fmtD(item.val)}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: cmPct >= 50 ? '#059669' : '#DC2626', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: '0.8rem', fontWeight: 600 }}>Marge</span>
              <div style={{ width: '55%', height: '6px', borderRadius: '3px', background: 'rgba(28,25,23,0.06)' }}>
                <div style={{ height: '100%', borderRadius: '3px', background: cmPct >= 50 ? '#059669' : '#DC2626', width: `${Math.max(0, (cm / be.sellPrice) * 100)}%` }} />
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, minWidth: '50px', textAlign: 'right', color: cmPct >= 50 ? 'var(--success)' : 'var(--danger)' }}>{fmtD(cm)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 className="section-title" style={{ marginBottom: '1rem' }}>Winst/verlies per verkoopvolume</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {[5, 10, 15, 20, 30, 40, 50, 75, 100].map(units => {
            const profit = (units * cm) - be.monthlyFixed
            const maxP = 100 * be.sellPrice
            const w = Math.min(Math.abs(profit) / maxP * 100, 100)
            return (
              <div key={units} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', minWidth: '50px', textAlign: 'right', color: 'var(--text-secondary)' }}>{units} st.</span>
                <div style={{ flex: 1, height: '20px', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: 'var(--border-strong)' }} />
                  {profit >= 0
                    ? <div style={{ position: 'absolute', left: '50%', top: '3px', height: '14px', width: `${w / 2}%`, background: 'var(--success)', borderRadius: '0 3px 3px 0', opacity: 0.7 }} />
                    : <div style={{ position: 'absolute', right: '50%', top: '3px', height: '14px', width: `${w / 2}%`, background: 'var(--danger)', borderRadius: '3px 0 0 3px', opacity: 0.7 }} />}
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, minWidth: '80px', textAlign: 'right', color: profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>{profit >= 0 ? '+' : ''}{fmt(Math.round(profit))}</span>
              </div>
            )
          })}
          <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>← verlies | winst →</div>
        </div>
      </div>
    </>
  )
}
/* ========== CASHFLOW TAB ========== */
function CashflowTab({ cfg, saveCfg, totalInv }) {
  const [sc, setSc] = useState({ baseUnits: 5, growthPct: 15, sellPrice: 149, varCost: 65, monthlyFixed: cfg.monthlyFixed || 2500, adSpend1: 500, adGrowth: 10 })
  useEffect(() => { const s = localStorage.getItem('artazest_cf'); if (s) setSc(JSON.parse(s)) }, [])
  useEffect(() => { localStorage.setItem('artazest_cf', JSON.stringify(sc)) }, [sc])

  const months = 12
  const scenarios = ['worst', 'base', 'aggressive']
  const mult = { worst: 0.7, base: 1.0, aggressive: 1.3 }
  const labels = { worst: 'Worst case (70%)', base: 'Base case', aggressive: 'Optimistisch (130%)' }
  const colors = { worst: '#DC2626', base: '#D97706', aggressive: '#059669' }

  const proj = {}
  scenarios.forEach(s => {
    let cash = cfg.cashOnHand
    proj[s] = Array.from({ length: months }, (_, m) => {
      const units = Math.round(sc.baseUnits * Math.pow(1 + sc.growthPct / 100, m) * mult[s])
      const rev = units * sc.sellPrice
      const ad = Math.round(sc.adSpend1 * Math.pow(1 + sc.adGrowth / 100, m))
      const costs = units * sc.varCost + sc.monthlyFixed + ad
      const net = rev - costs
      cash += net
      return { m: m + 1, units, rev, costs, ad, net, cash: Math.round(cash) }
    })
  })
  const allCash = Object.values(proj).flatMap(d => d.map(r => r.cash))
  const minC = Math.min(...allCash), maxC = Math.max(...allCash), range = maxC - minC || 1

  const slider = (key, label, min, max, step, pre, suf) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.3rem 0' }}>
      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', minWidth: '140px' }}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={sc[key]} onChange={e => setSc({ ...sc, [key]: parseFloat(e.target.value) })} style={{ flex: 1, accentColor: 'var(--accent)' }} />
      <span style={{ fontSize: '0.85rem', fontWeight: 600, minWidth: '55px', textAlign: 'right' }}>{pre}{sc[key]}{suf}</span>
    </div>
  )

  return (
    <>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="section-title" style={{ marginBottom: '0.75rem' }}>Scenario parameters</h3>
        {slider('baseUnits', 'Verkoop maand 1', 1, 50, 1, '', ' st.')}
        {slider('growthPct', 'Groei per maand', 0, 50, 5, '', '%')}
        {slider('sellPrice', 'Verkoopprijs', 49, 399, 1, '€', '')}
        {slider('varCost', 'Var. kosten/st', 20, 150, 5, '€', '')}
        {slider('monthlyFixed', 'Vaste kosten/mnd', 500, 10000, 100, '€', '')}
        {slider('adSpend1', 'Ad spend maand 1', 0, 5000, 100, '€', '')}
        {slider('adGrowth', 'Ad spend groei/mnd', 0, 50, 5, '', '%')}
      </div>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="section-title" style={{ marginBottom: '1rem' }}>Cash flow projectie (12 maanden)</h3>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
          {scenarios.map(s => <span key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><span style={{ width: '12px', height: '3px', background: colors[s], borderRadius: '2px' }} />{labels[s]}</span>)}
        </div>
        <div style={{ position: 'relative', height: '200px', borderLeft: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          {minC < 0 && <div style={{ position: 'absolute', left: 0, right: 0, bottom: `${((0 - minC) / range) * 100}%`, borderTop: '1px dashed var(--border-strong)' }}><span style={{ position: 'absolute', left: '4px', top: '-10px', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>€0</span></div>}
          {scenarios.map(s => (
            <svg key={s} style={{ position: 'absolute', inset: 0, overflow: 'visible' }} viewBox={`0 0 ${months * 100} 200`} preserveAspectRatio="none">
              <polyline fill="none" stroke={colors[s]} strokeWidth="3" vectorEffect="non-scaling-stroke"
                points={proj[s].map((d, i) => `${(i + 0.5) * 100},${200 - ((d.cash - minC) / range) * 200}`).join(' ')} />
            </svg>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          {Array.from({ length: months }, (_, i) => <span key={i}>M{i + 1}</span>)}
        </div>
      </div>
      <div className="card">
        <h3 className="section-title" style={{ marginBottom: '1rem' }}>Maandoverzicht (base case)</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead><tr><th>Mnd</th><th style={{ textAlign: 'right' }}>Verkoop</th><th style={{ textAlign: 'right' }}>Omzet</th><th style={{ textAlign: 'right' }}>Kosten</th><th style={{ textAlign: 'right' }}>Ad spend</th><th style={{ textAlign: 'right' }}>Netto</th><th style={{ textAlign: 'right' }}>Cash</th></tr></thead>
            <tbody>
              {proj.base.map(d => (
                <tr key={d.m}>
                  <td>M{d.m}</td>
                  <td style={{ textAlign: 'right' }}>{d.units}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(d.rev)}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(d.costs)}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(d.ad)}</td>
                  <td style={{ textAlign: 'right', color: d.net >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>{d.net >= 0 ? '+' : ''}{fmt(Math.round(d.net))}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: d.cash >= 0 ? 'var(--text-primary)' : 'var(--danger)' }}>{fmt(d.cash)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}