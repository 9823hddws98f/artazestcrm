// Edge Function: Shopify-proxy
//
// Waarom deze bestaat:
//   1. Het Admin API-token hoort niet in de browser en niet in de database.
//      Hier staat het in de omgeving van de function, waar alleen de server bij kan.
//   2. Shopify blokkeert directe calls vanuit een browser (CORS). De vorige
//      opzet in Shopify.jsx liep daar op vast.
//
// Instellen:
//   supabase secrets set SHOPIFY_STORE=kfnqpb-ra
//   supabase secrets set SHOPIFY_ACCESS_TOKEN=shpat_...
//   supabase functions deploy shopify

import { createClient } from 'jsr:@supabase/supabase-js@2'

const SHOPIFY_STORE = Deno.env.get('SHOPIFY_STORE')
const SHOPIFY_ACCESS_TOKEN = Deno.env.get('SHOPIFY_ACCESS_TOKEN')
const API_VERSION = '2026-01'

// Alleen deze endpoints mogen door. Zonder lijst is dit een open doorgeefluik
// naar de hele Admin API, inclusief schrijfacties.
const ALLOWED = new Set(['orders', 'products', 'customers'])

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  if (!SHOPIFY_STORE || !SHOPIFY_ACCESS_TOKEN) {
    return json({ error: 'Shopify-instellingen ontbreken op de server' }, 500)
  }

  // Alleen ingelogde teamleden. Zonder deze controle kan iedereen die de
  // function-URL kent jouw Shopify-data opvragen.
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Niet ingelogd' }, 401)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return json({ error: 'Niet ingelogd' }, 401)

  let resource: string, query: string
  try {
    const body = await req.json()
    resource = String(body.resource || '')
    query = String(body.query || '')
  } catch {
    return json({ error: 'Ongeldig verzoek' }, 400)
  }

  if (!ALLOWED.has(resource)) {
    return json({ error: `Niet toegestaan: ${resource}` }, 403)
  }

  // Query zelf opbouwen in plaats van doorgeven, zodat er niets anders dan
  // limit en status in de URL kan belanden.
  const params = new URLSearchParams(query)
  const safe = new URLSearchParams()
  const limit = params.get('limit')
  safe.set('limit', String(Math.min(Number(limit) || 50, 250)))
  if (resource === 'orders') safe.set('status', params.get('status') || 'any')

  const url = `https://${SHOPIFY_STORE}.myshopify.com/admin/api/${API_VERSION}/${resource}.json?${safe}`

  const res = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    return json({ error: `Shopify gaf ${res.status} terug` }, res.status)
  }

  return json(await res.json())
})
