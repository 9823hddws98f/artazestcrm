import { useState, useRef } from 'react'
import { api } from '../api'

const STORES = ['tasks','inventory_items','orders','investments','content']
const SETTINGS = [
  'catalog_items','dev_items','dev_inspo','quick_orders','stock_todos',
  'checkins','platform_checkins','health_checks','maintenance_schedule',
  'blade_log','qa_checklist','inventory_sections','statuses','costs',
  'artwork_stock','hiring','designers','platforms','designers_crm',
  'production_orders','projects','shopify_token'
]

export default function Backup() {
  const [status, setStatus] = useState('')
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [preview, setPreview] = useState(null)
  const fileRef = useRef(null)

  const exportAll = async () => {
    setExporting(true); setStatus('Bezig met exporteren...')
    try {
      const data = { exported: new Date().toISOString(), version: 1, stores: {}, settings: {} }
      for (const s of STORES) {
        try { data.stores[s] = await api.getAll(s) } catch (e) { data.stores[s] = [] }
      }
      for (const k of SETTINGS) {
        try { data.settings[k] = await api.getSetting(k) } catch (e) { data.settings[k] = null }
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `artazest-backup-${new Date().toISOString().slice(0,10)}.json`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setStatus(`✓ Backup gedownload (${Object.keys(data.stores).length} stores, ${Object.keys(data.settings).length} settings)`)
    } catch (e) { setStatus('✗ Export mislukt: ' + e.message) }
    setExporting(false)
  }
  const handleFile = async (file) => {
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!data.stores || !data.settings) { alert('Ongeldig backup bestand'); return }
      const storeCount = Object.keys(data.stores).length
      const settingCount = Object.keys(data.settings).length
      const totalItems = Object.values(data.stores).reduce((s,v) => s + (Array.isArray(v)?v.length:0), 0)
      setPreview({ data, storeCount, settingCount, totalItems, filename: file.name, exported: data.exported })
    } catch (e) { alert('Kan bestand niet lezen: ' + e.message) }
  }

  const doImport = async () => {
    if (!preview) return
    if (!confirm(`ZEKER WETEN? Dit OVERSCHRIJFT alle huidige data met ${preview.totalItems} items.`)) return
    setImporting(true); setStatus('Bezig met importeren...')
    try {
      for (const [store, items] of Object.entries(preview.data.stores)) {
        if (Array.isArray(items)) {
          for (const item of items) {
            try { await api.save(store, item) } catch (e) { console.warn('skip', store, e) }
          }
        }
      }
      for (const [key, value] of Object.entries(preview.data.settings)) {
        if (value !== null && value !== undefined) {
          try { await api.saveSetting(key, value) } catch (e) { console.warn('skip setting', key, e) }
        }
      }
      setStatus(`✓ Import voltooid. Ververs de pagina.`)
      setPreview(null)
    } catch (e) { setStatus('✗ Import mislukt: ' + e.message) }
    setImporting(false)
  }
  return (
    <div style={{ padding:'1.5rem', maxWidth:800 }}>
      <h1 style={{ fontFamily:"'Instrument Serif',serif", fontSize:'1.75rem', margin:'0 0 0.25rem' }}>💾 Backup & Export</h1>
      <p style={{ fontSize:'0.85rem', color:'var(--text-secondary)', marginTop:0 }}>Exporteer alle data als JSON of importeer een eerdere backup</p>

      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:'1.25rem', marginTop:'1.5rem' }}>
        <h3 style={{ margin:'0 0 0.5rem', fontSize:'1rem' }}>📤 Exporteer alle data</h3>
        <p style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginTop:0 }}>Downloadt alle taken, orders, voorraad, catalogus, settings etc. als één JSON bestand.</p>
        <button onClick={exportAll} disabled={exporting}
          style={{ padding:'0.5rem 1rem', borderRadius:8, border:'none', background:'#D97706', color:'#fff', fontWeight:600, cursor:'pointer', fontSize:'0.85rem' }}>
          {exporting ? 'Bezig...' : '⬇ Download backup.json'}
        </button>
      </div>

      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:'1.25rem', marginTop:'1rem' }}>
        <h3 style={{ margin:'0 0 0.5rem', fontSize:'1rem' }}>📥 Importeer backup</h3>
        <p style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginTop:0 }}><strong style={{ color:'#DC2626' }}>Let op:</strong> dit overschrijft bestaande data met dezelfde IDs.</p>
        <input ref={fileRef} type="file" accept=".json" style={{ display:'none' }}
          onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); e.target.value='' }} />
        <button onClick={() => fileRef.current?.click()} disabled={importing}
          style={{ padding:'0.5rem 1rem', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--text-primary)', fontWeight:600, cursor:'pointer', fontSize:'0.85rem' }}>
          Kies bestand...
        </button>
        {preview && (
          <div style={{ marginTop:'1rem', padding:'0.75rem', background:'var(--bg-secondary)', borderRadius:8, border:'1px solid var(--border)' }}>
            <div style={{ fontSize:'0.8rem', fontWeight:600 }}>📄 {preview.filename}</div>
            <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)', marginTop:'0.25rem' }}>Geëxporteerd: {new Date(preview.exported).toLocaleString('nl-NL')}</div>
            <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)' }}>{preview.storeCount} stores · {preview.totalItems} items · {preview.settingCount} settings</div>
            <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.75rem' }}>
              <button onClick={doImport} disabled={importing}
                style={{ padding:'0.4rem 0.8rem', borderRadius:6, border:'none', background:'#DC2626', color:'#fff', fontWeight:600, cursor:'pointer', fontSize:'0.75rem' }}>
                {importing ? 'Bezig...' : '⚠ Importeer & overschrijf'}
              </button>
              <button onClick={() => setPreview(null)}
                style={{ padding:'0.4rem 0.8rem', borderRadius:6, border:'1px solid var(--border)', background:'transparent', cursor:'pointer', fontSize:'0.75rem' }}>
                Annuleren
              </button>
            </div>
          </div>
        )}
      </div>

      {status && (
        <div style={{ marginTop:'1rem', padding:'0.75rem 1rem', borderRadius:8, background: status.startsWith('✓') ? '#ECFDF5' : status.startsWith('✗') ? '#FEE2E2' : 'var(--bg-secondary)', color: status.startsWith('✓') ? '#059669' : status.startsWith('✗') ? '#DC2626' : 'var(--text-primary)', fontSize:'0.85rem' }}>
          {status}
        </div>
      )}
    </div>
  )
}