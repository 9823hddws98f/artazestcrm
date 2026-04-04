# Artazest Co-Pilot

Pre-launch management dashboard voor Artazest acoustic panels.

## Stack
- **Frontend**: React + Vite
- **Auth**: PIN-based login (Tein/Sam/Productie, PIN: 2026)
- **Data**: localStorage (per browser)
- **Hosting**: Vercel

## Lokaal draaien
```bash
npm install
npm run dev
```

## Deployen naar Vercel
1. Push naar GitHub
2. Ga naar vercel.com → Import Git Repository
3. Framework preset: Vite
4. Deploy

## Modules
- **Dashboard** — Launch countdown, metrics, voorraad alerts
- **Taken** — Dagelijks/wekelijks/launch checklist, toewijzen
- **Voorraad** — Panelen, verpakking, drukwerk, samples
- **Content** — Pipeline view (idee → live), content kalender
- **Artworks** — Design-to-live pipeline per artwork
