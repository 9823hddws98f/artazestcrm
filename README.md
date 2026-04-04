# Artazest Co-Pilot

Pre-launch management dashboard voor Artazest acoustic panels.

## Stack
- **Frontend**: React + Vite
- **Auth**: Netlify Identity (gratis, max 5 users)
- **Data**: Netlify Blobs via Netlify Functions
- **Hosting**: Netlify

## Lokaal draaien
```bash
npm install
npm run dev
```

## Deployen
1. Push naar GitHub
2. Netlify → New site from Git → selecteer repo
3. Build: `npm run build` / Publish: `dist`
4. Identity activeren: Site settings → Identity → Enable

## Users
Netlify → Identity → Invite users
Admin: app_metadata `{"roles": ["admin"]}`
