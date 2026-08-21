import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

/**
 * Shopify-overzicht.
 *
 * De vorige versie vroeg om een Admin API-token, bewaarde dat in de
 * `settings`-tabel en riep Shopify rechtstreeks aan vanuit de browser. Dat had
 * twee problemen: het token was uitleesbaar voor iedereen met de anon-key, en
 * Shopify blokkeert browser-calls (CORS), dus het werkte sowieso niet.
 *
 * Nu loopt alles via de Edge Function `shopify`. Het token staat daar in de
 * omgeving van de server; de browser krijgt het nooit te zien.
 */

async function callShopify(resource, query = '') {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Niet ingelogd')

  const { data, error } = await supabase.functions.invoke('shopify', {
    body: { resource, query },
  })
  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error)
  return data
}

export default function Shopify() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState(null)

  const loadAll = async () => {
    setLoading(true); setError('')
    try {
      const [ordersData, productsData, customersData] = await Promise.all([
        callShopify('orders', 'limit=50&status=any'),
        callShopify('products', 'limit=50'),
        callShopify('customers', 'limit=50'),
      ])
      const list = ordersData.orders || []
      setOrders(list)
      setStats({
        revenue: list.reduce((s, o) => s + parseFloat(o.total_price || 0), 0),
        paidOrders: list.filter(o => o.financial_status === 'paid').length,
        totalOrders: list.length,
        totalProducts: (productsData.products || []).length,
        totalCustomers: (customersData.customers || []).length,
      })
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [])

  return (
    <div style={{ padding:'1.5rem' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'0.5rem' }}>
        <div>
          <h1 style={{ fontFamily:"'Instrument Serif',serif", fontSize:'1.75rem', margin:0 }}>🛒 Shopify</h1>
          <p style={{ margin:'0.25rem 0 0', fontSize:'0.85rem', color:'var(--text-secondary)' }}>Live via de Edge Function</p>
        </div>
        <button onClick={loadAll} disabled={loading}
          style={{ padding:'0.4rem 0.8rem', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-secondary)', cursor:'pointer', fontSize:'0.8rem', color:'var(--text-primary)' }}>
          {loading ? 'Laden...' : '↻ Ververs'}
        </button>
      </div>

      {error && (
        <div style={{ padding:'0.75rem', background:'#FEE2E2', color:'#DC2626', borderRadius:8, fontSize:'0.75rem', marginBottom:'1rem' }}>
          {error}
          <div style={{ marginTop:'0.35rem', color:'#92400E' }}>
            Staat de Edge Function er al? Zie <code>supabase/functions/shopify</code> en SECURITY.md.
          </div>
        </div>
      )}

      {stats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:'0.75rem', marginBottom:'1.5rem' }}>
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:'1rem' }}>
            <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Omzet</div>
            <div style={{ fontSize:'1.5rem', fontWeight:600, marginTop:'0.25rem' }}>€{stats.revenue.toFixed(2)}</div>
          </div>
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:'1rem' }}>
            <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Orders</div>
            <div style={{ fontSize:'1.5rem', fontWeight:600, marginTop:'0.25rem' }}>{stats.totalOrders}</div>
            <div style={{ fontSize:'0.65rem', color:'#059669' }}>{stats.paidOrders} betaald</div>
          </div>
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:'1rem' }}>
            <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Producten</div>
            <div style={{ fontSize:'1.5rem', fontWeight:600, marginTop:'0.25rem' }}>{stats.totalProducts}</div>
          </div>
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:'1rem' }}>
            <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Klanten</div>
            <div style={{ fontSize:'1.5rem', fontWeight:600, marginTop:'0.25rem' }}>{stats.totalCustomers}</div>
          </div>
        </div>
      )}

      {orders.length > 0 && (
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:'1rem', marginBottom:'1rem' }}>
          <h3 style={{ margin:'0 0 0.75rem', fontSize:'0.9rem' }}>Recente orders</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
            {orders.slice(0,10).map(o => (
              <div key={o.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.4rem 0.5rem', borderRadius:6, background:'var(--bg-secondary)', fontSize:'0.75rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flex:1, minWidth:0 }}>
                  <span style={{ fontWeight:600 }}>#{o.order_number}</span>
                  <span style={{ color:'var(--text-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.customer?.first_name} {o.customer?.last_name}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  <span style={{ fontSize:'0.6rem', padding:'0.05rem 0.35rem', borderRadius:4, background: o.financial_status==='paid'?'#ECFDF5':'#FEF3C7', color: o.financial_status==='paid'?'#059669':'#92400E', fontWeight:600 }}>{o.financial_status}</span>
                  <span style={{ fontWeight:600 }}>€{parseFloat(o.total_price).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {orders.length === 0 && !loading && !error && (
        <div style={{ padding:'2rem', textAlign:'center', color:'var(--text-secondary)', fontSize:'0.85rem' }}>Geen orders gevonden.</div>
      )}
    </div>
  )
}
