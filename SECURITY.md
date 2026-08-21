# Opnieuw opzetten — veilige versie

Het oude Supabase-project (`umtvatbzlsltaxcujcot`) bestaat niet meer; de
hostnaam resolvet niet. Daardoor draaide de app op de localStorage-fallback in
`api.js` en had elk teamlid een eigen kopie van de data.

Deze opzet zet een vers project neer dat vanaf dag één dicht zit.

## Wat er is veranderd

| Was | Is nu |
|---|---|
| RLS uit, `grant all to anon` | RLS aan, alleen `authenticated` |
| Wachtwoorden in platte tekst in `settings` | Supabase Auth, gehasht |
| Login volledig in de browser | Server-side, met JWT |
| Supabase-URL en key hardcoded | Environment-variabelen |
| Shopify-token in `settings` | Edge Function, alleen server-side |
| Shopify direct uit de browser (CORS) | Via de Edge Function |

## Volgorde

De volgorde is belangrijk. Draai je de migratie voordat de nieuwe login live
staat, dan kan niemand meer bij de data.

### 1. Backups veiligstellen — eerst doen

Open de CRM in **elke browser en op elk apparaat** waar iemand ermee gewerkt
heeft. Ga naar Backup en klik "Download backup.json". Elk bestand bevat alleen
de localStorage van dát apparaat, dus bewaar ze apart onder herkenbare namen.

### 2. Nieuw Supabase-project

Maak een project aan in de organisatie die op Pro staat. Noteer uit
Project Settings > Data API:

- de project-URL
- de anon-key (publiek van ontwerp; de service-role-key blijft in het dashboard)

### 3. Schema en RLS

Plak `migrations/001_init.sql` in SQL Editor > New query > Run.

Onderaan draaien twee controle-queries. Alle tabellen horen `rowsecurity = true`
te tonen en precies één policy `team_full_access` te hebben.

### 4. Teamleden aanmaken

Authentication > Users > Add user, met "Auto Confirm User" aan:

| Naam | E-mail |
|---|---|
| Tein | tein@artazest.com |
| Sam | sam@artazest.com |
| Productie | productie@artazest.com |
| Remy | remy@artazest.com |

Die adressen staan in `src/auth.js`; pas ze daar aan als je andere gebruikt.
Kies per persoon een eigen wachtwoord van minstens 8 tekens — niet meer één
gedeeld wachtwoord zoals hiervoor.

### 5. Environment-variabelen

Lokaal, in `.env` (zie `.env.example`):

```
VITE_SUPABASE_URL=https://JOUW_REF.supabase.co
VITE_SUPABASE_ANON_KEY=JOUW_ANON_KEY
```

In Vercel: Project Settings > Environment Variables, dezelfde twee, voor
Production en Preview.

### 6. Uitrollen

```bash
cd ~/Documents/artazestcrm && npx vite build && vercel --yes --prod
```

Log daarna in en controleer dat je data ziet. Zet met Backup > Herstellen je
backup.json terug.

### 7. Shopify-koppeling

Pas hierna, en los van het bovenstaande.

Maak in Shopify een nieuwe custom app aan met alleen leesrechten:
`read_orders`, `read_products`, `read_customers`, `read_inventory`.

De winkel-handle is **`kfnqpb-ra`**, niet `artazest` — dat stond fout in de
oude code en was een van de redenen dat de koppeling nooit werkte.

```bash
supabase secrets set SHOPIFY_STORE=kfnqpb-ra
supabase secrets set SHOPIFY_ACCESS_TOKEN=shpat_...
supabase functions deploy shopify
```

Het token gaat dus naar de omgeving van de function en nooit meer naar de
database of de browser.

## Terugdraaien

Van elk gewijzigd bestand staat de vorige versie ernaast als `.bak`:
`src/auth.js.bak`, `src/supabase.js.bak`, `src/App.jsx.bak`,
`src/pages/Settings.jsx.bak`, `src/pages/Shopify.jsx.bak`.
Het oude schema staat in `migrations/000_oud_schema_ongebruikt.sql`.
