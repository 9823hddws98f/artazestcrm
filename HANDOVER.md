# ARTAZEST CRM / CO-PILOT — HANDOVER PROMPT

## Kopieer alles hieronder naar een nieuw Claude gesprek:

---

Je gaat verder met het bouwen van de **Artazest CRM/Co-Pilot app** voor Tein. Dit is een React+Vite+Supabase webapp voor het managen van Artazest, een DTC akoestisch panelen merk.

## Toegang & Deploy

- **Repo:** `/Users/teinbrouwer/Documents/artazestcrm/` (op Tein's Mac, via Desktop Commander MCP)
- **Live URL:** https://artazestcrm.vercel.app
- **Deploy commando:** `cd /Users/teinbrouwer/Documents/artazestcrm && npx vite build && vercel --yes --prod`
- **Altijd build+deploy na elke wijziging** en bevestig aan de gebruiker
- **Git remote:** `git@github.com:9823hddws98f/artazestcrm.git` (SSH, push faalt nog — SSH key aangemaakt maar niet toegevoegd aan GitHub)

## Tech Stack

- **Frontend:** React 18 + Vite 5 + React Router 6
- **Backend:** Supabase (PostgreSQL + Realtime + Storage)
- **Hosting:** Vercel (productie)
- **Styling:** Vanilla CSS met CSS variabelen, geen Tailwind
- **Fonts:** Instrument Serif (display) + Figtree (body)
- **Kleuren:** Warm earth tones — accent #D97706 (amber), bg #FAFAF7

## Supabase

- **URL:** `https://umtvatbzlsltaxcujcot.supabase.co`
- **Anon key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtdHZhdGJ6bHNsdGF4Y3VqY290Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MjgwNjUsImV4cCI6MjA5MTAwNDA2NX0.rhg8QcUpfJ44nMoyqYzYgU95JvAJRqip1O1IfBu-tts`
- **Tabellen:** tasks, inventory, catalog (verouderd), investments, settings, checkins
- **Settings-based opslag:** Veel data zit in de `settings` tabel als JSONB (catalog_items, dev_items, dev_inspo, quick_orders, stock_todos, checkins, platform_checkins, health_checks, maintenance_schedule, blade_log, maintenance_videos, qa_checklist, inventory_sections, statuses, costs)
- **Storage bucket `artworks`:** MOET NOG AANGEMAAKT WORDEN in Supabase dashboard (public bucket)

## API Layer (`src/api.js`)

- `api.getAll(store)` — SELECT * uit Supabase tabel, fallback localStorage
- `api.save(store, item)` — UPSERT, auto-genereert ID, fallback localStorage
- `api.remove(store, id)` — DELETE
- `api.getSetting(key)` — Leest uit settings tabel (JSONB value)
- `api.saveSetting(key, value)` — Upsert in settings + localStorage backup
- `uploadImage(base64, filename)` — Upload naar Supabase Storage bucket 'artworks', return public URL

## Bestanden & Grootte

| Bestand | Regels | Beschrijving |
|---------|--------|-------------|
| `src/pages/Tasks.jsx` | 1722 | Kanban board, timeline, check-ins, designers, hiring, platforms, sticky lane, bulk acties |
| `src/pages/Inventory.jsx` | 1120 | Voorraad per sectie, bestellingen cards, stock todos, panel usage tracking |
| `src/pages/Analytics.jsx` | 633 | Omzet, kosten, break-even analyse |
| `src/pages/Maintenance.jsx` | 440 | 2 top-tabs: Shopify Store (Health) + Productie Onderhoud (schema, messen, QA, videos, settings) |
| `src/pages/Orders.jsx` | 437 | Order management |
| `src/pages/Catalog.jsx` | 324 | Artwork catalogus met drag-drop, kleuren, formats, Supabase Storage upload |
| `src/pages/Dashboard.jsx` | 301 | Launch countdown, readiness %, per-persoon stats, week-overzicht, voorraad alerts, kostprijs calc |
| `src/pages/Development.jsx` | 289 | Artwork ontwikkel-pipeline (5 stages), inspiratie tab met uploads |
| `src/pages/HealthMonitor.jsx` | 213 | Shopify store health checks (dagelijks/wekelijks/maandelijks), embedded in Maintenance |
| `src/pages/Stock.jsx` | 172 | Artwork voorraad per kleur/formaat |
| `src/components/Layout.jsx` | 176 | Sidebar, badges, dark mode toggle, Cmd+K zoek, mobile responsive |
| `src/index.css` | 162 | CSS variabelen, dark mode, responsive breakpoints |
| `src/api.js` | 64 | Supabase API wrapper met localStorage fallback |
| `src/supabase.js` | ~35 | Supabase client + image upload helper |

## Pagina's & Routes

| Route | Component | Sidebar |
|-------|-----------|---------|
| `/` | Dashboard | ✅ |
| `/tasks` | Tasks | ✅ To-do's (badge: open taken) |
| `/inventory` | Inventory | ✅ Inkoop (badge: needs order) |
| `/stock` | Stock | ✅ Voorraad |
| `/orders` | Orders | ✅ Orders |
| `/content` | Content | ✅ Content |
| `/catalog` | Catalog | ✅ Catalogus (badge: count) |
| `/analytics` | Analytics | ✅ Analytics |
| `/maintenance` | Maintenance | ✅ Onderhoud (badge: overdue) |
| `/settings` | Settings | ✅ Instellingen |
| `/development` | Development | ❌ (bereikbaar via Catalogus → "🧪 In Ontwikkeling" knop) |
| `/launch` | Launch | ❌ (uit sidebar, QA checklist verplaatst naar Onderhoud) |
| `/health` | HealthMonitor | ❌ (uit sidebar, embedded in Onderhoud → Shopify Store tab) |

