const SEED_TASKS = [
  { title: "Shopify productpagina's compleet (alle 5 kleuren)", category: 'Shopify', assignee: 'Tein', type: 'checklist', priority: 'high', completed: false },
  { title: 'Betaalmethoden instellen (iDEAL, creditcard, Klarna)', category: 'Shopify', assignee: 'Tein', type: 'checklist', priority: 'high', completed: false },
  { title: 'Shipping zones configureren (NL, BE, DE)', category: 'Shopify', assignee: 'Tein', type: 'checklist', priority: 'high', completed: false },
  { title: 'Meta Pixel installeren en testen', category: 'Ads', assignee: 'Tein', type: 'checklist', priority: 'high', completed: false },
  { title: 'Meta Ads campagne structuur opzetten', category: 'Ads', assignee: 'Tein', type: 'checklist', priority: 'high', completed: false },
  { title: 'Klaviyo welcome flow activeren', category: 'Email', assignee: 'Tein', type: 'checklist', priority: 'medium', completed: false },
  { title: 'Abandoned cart email flow', category: 'Email', assignee: 'Tein', type: 'checklist', priority: 'medium', completed: false },
  { title: 'Post-purchase email flow', category: 'Email', assignee: 'Tein', type: 'checklist', priority: 'low', completed: false },
  { title: 'SEO meta titles en descriptions per product', category: 'SEO', assignee: 'Sam', type: 'checklist', priority: 'medium', completed: false },
  { title: "Alt tags op alle productfoto's", category: 'SEO', assignee: 'Sam', type: 'checklist', priority: 'medium', completed: false },
  { title: 'AVG/Privacy policy pagina', category: 'Juridisch', assignee: 'Tein', type: 'checklist', priority: 'high', completed: false },
  { title: 'Algemene voorwaarden pagina', category: 'Juridisch', assignee: 'Tein', type: 'checklist', priority: 'high', completed: false },
  { title: 'Retourbeleid schrijven', category: 'Juridisch', assignee: 'Tein', type: 'checklist', priority: 'medium', completed: false },
  { title: 'Artwork 1 - Fotoselectie afronden', category: 'Content', assignee: 'Sam', type: 'checklist', priority: 'high', completed: false },
  { title: 'Artwork 2 - Fotoselectie afronden', category: 'Content', assignee: 'Sam', type: 'checklist', priority: 'high', completed: false },
  { title: 'Artwork 3 - Fotoselectie afronden', category: 'Content', assignee: 'Sam', type: 'checklist', priority: 'high', completed: false },
  { title: 'Test bestelling plaatsen en afhandelen', category: 'Shopify', assignee: 'Tein', type: 'checklist', priority: 'high', completed: false },
  { title: 'Sample insert kaartje drukken', category: 'Productie', assignee: 'Productie', type: 'checklist', priority: 'medium', completed: false },
  { title: 'R1 Weekly review', category: 'Overig', assignee: 'Tein', type: 'weekly', priority: 'high', completed: false },
  { title: 'Content planning komende week', category: 'Content', assignee: 'Sam', type: 'weekly', priority: 'medium', completed: false },
  { title: 'Voorraadcheck', category: 'Productie', assignee: 'Productie', type: 'weekly', priority: 'medium', completed: false },
  { title: 'Instagram posts plannen (3x per week)', category: 'Content', assignee: 'Sam', type: 'weekly', priority: 'medium', completed: false },
  { title: 'Shopify dashboard checken', category: 'Shopify', assignee: 'Tein', type: 'daily', priority: 'low', completed: false },
  { title: 'Instagram story posten', category: 'Content', assignee: 'Sam', type: 'daily', priority: 'low', completed: false },
];
const SEED_INVENTORY = [
  { name: 'Oak', section: 'panelen', quantity: 15, minStock: 10, leadTimeDays: 90, supplier: 'Alibaba', notes: '', startStock: 60, batches: [{qty:60,date:'2026-01-12',note:'Eerste bestelling Alibaba'}] },
  { name: 'Walnut', section: 'panelen', quantity: 12, minStock: 10, leadTimeDays: 90, supplier: 'Alibaba', notes: '', startStock: 60, batches: [{qty:60,date:'2026-01-12',note:'Eerste bestelling Alibaba'}] },
  { name: 'Black', section: 'panelen', quantity: 10, minStock: 10, leadTimeDays: 90, supplier: 'Alibaba', notes: '', startStock: 60, batches: [{qty:60,date:'2026-01-12',note:'Eerste bestelling Alibaba'}] },
  { name: 'White', section: 'panelen', quantity: 8, minStock: 10, leadTimeDays: 90, supplier: 'Alibaba', notes: '', startStock: 60, batches: [{qty:60,date:'2026-01-12',note:'Eerste bestelling Alibaba'}] },
  { name: 'Forest', section: 'panelen', quantity: 5, minStock: 10, leadTimeDays: 90, supplier: 'Alibaba', notes: '', startStock: 60, batches: [{qty:60,date:'2026-01-12',note:'Eerste bestelling Alibaba'}] },
  { name: 'Charcoal', section: 'panelen', quantity: 3, minStock: 10, leadTimeDays: 90, supplier: 'Alibaba', notes: '' },
  { name: 'Natural', section: 'panelen', quantity: 0, minStock: 10, leadTimeDays: 90, supplier: 'Alibaba', notes: '' },
  { name: 'Houten lijst', section: 'lijst', quantity: 0, minStock: 20, leadTimeDays: 14, supplier: '', notes: '' },
  { name: 'Knopje', section: 'lijst', quantity: 0, minStock: 50, leadTimeDays: 7, supplier: '', notes: 'Ophangbeugel' },
  { name: 'Verzenddozen', section: 'karton', quantity: 0, minStock: 50, leadTimeDays: 7, supplier: '', notes: 'Nog bestellen' },
  { name: 'Custom plakband', section: 'karton', quantity: 20, minStock: 10, leadTimeDays: 14, supplier: '', notes: 'Branded' },
  { name: 'Product boekje', section: 'drukwerk', quantity: 0, minStock: 100, leadTimeDays: 10, supplier: '', notes: 'Ontwerp afronden' },
  { name: 'Sample folder', section: 'drukwerk', quantity: 0, minStock: 50, leadTimeDays: 10, supplier: '', notes: 'Ontwerp afronden' },
  { name: 'Sample set (5 kleuren)', section: 'samples', quantity: 0, minStock: 20, leadTimeDays: 14, supplier: '', notes: '' },
  { name: 'Losse samples', section: 'samples', quantity: 0, minStock: 50, leadTimeDays: 7, supplier: '', notes: '' },
  { name: 'CNC freeswerk', section: 'cnc', quantity: 0, minStock: 0, leadTimeDays: 0, supplier: '', notes: 'Nog uitzoeken' },
];
const SEED_ARTWORK = [
  { name: 'Artwork 1', stage: 'foto', colors: ['Oak','Walnut','Black','White','Forest','Natural'], designer: '', notes: 'Fotoselectie — 45 shots' },
  { name: 'Artwork 2', stage: 'design', colors: ['Oak','Walnut','Black'], designer: '', notes: 'Nieuw design' },
  { name: 'Artwork 3', stage: 'design', colors: [], designer: '', notes: 'Concept fase' },
];
const SEED_SETTINGS = {
  roles: {
    Tein: { role: 'admin', pages: ['/', '/tasks', '/inventory', '/content', '/artwork', '/catalog', '/howto', '/analytics', '/settings'] },
    Sam: { role: 'team', pages: ['/', '/tasks', '/content', '/artwork'] },
    Productie: { role: 'team', pages: ['/', '/tasks', '/inventory', '/howto'] },
  }
};
export function seedData() {
  const V = 'v5'
  const stores = { tasks: SEED_TASKS, inventory: SEED_INVENTORY, artwork: SEED_ARTWORK }
  const curV = localStorage.getItem('artazest_seed_version')
  for (const [store, items] of Object.entries(stores)) {
    const existing = localStorage.getItem('artazest_' + store)
    if (existing && JSON.parse(existing).length > 0 && curV === V) continue
    const withIds = items.map((item, i) => ({ ...item, id: 'seed-' + store + '-' + i, createdAt: new Date().toISOString() }))
    localStorage.setItem('artazest_' + store, JSON.stringify(withIds))
  }
  if (!localStorage.getItem('artazest_settings')) {
    localStorage.setItem('artazest_settings', JSON.stringify(SEED_SETTINGS))
  }
  localStorage.setItem('artazest_seed_version', V)

  // Investment seed data
  if (!localStorage.getItem('artazest_investments')) {
    localStorage.setItem('artazest_investments', JSON.stringify([
      { id: 'inv-001', description: 'Paneel prototypes (3 rondes)', category: 'productie', amount: 2400, date: '2025-11-15', notes: 'Eerste samples van fabriek' },
      { id: 'inv-002', description: 'Productie tooling & mallen', category: 'productie', amount: 3200, date: '2025-12-20', notes: 'Custom mallen voor 60x60 en 120x60' },
      { id: 'inv-003', description: 'Product fotografie shoot', category: 'fotografie', amount: 1250, date: '2026-01-18', notes: 'Studio shoot, 7 kleuren, lifestyle' },
      { id: 'inv-004', description: 'Video content productie', category: 'fotografie', amount: 850, date: '2026-02-10', notes: 'Montage tutorial + brand video' },
      { id: 'inv-005', description: 'Merknaam registratie Benelux', category: 'juridisch', amount: 450, date: '2025-10-05', notes: 'BOIP registratie Artazest' },
      { id: 'inv-006', description: 'Algemene voorwaarden & privacy', category: 'juridisch', amount: 350, date: '2026-01-08', notes: 'Juridisch advies webshop' },
      { id: 'inv-007', description: 'Logo & visuele identiteit', category: 'branding', amount: 1800, date: '2025-09-20', notes: 'Logo, kleuren, typografie, guidelines' },
      { id: 'inv-008', description: 'Verpakkingsdesign', category: 'branding', amount: 600, date: '2026-01-25', notes: 'Doos design + inlegvel' },
      { id: 'inv-009', description: 'Eerste voorraad 7 kleuren (50st)', category: 'voorraad', amount: 1875, date: '2026-02-28', notes: '50 panelen x ~37.50 inkoop' },
      { id: 'inv-010', description: 'Houten lijsten voorraad', category: 'voorraad', amount: 480, date: '2026-03-05', notes: '60 lijsten' },
      { id: 'inv-011', description: 'Meta Ads pre-launch campagne', category: 'marketing', amount: 400, date: '2026-03-15', notes: 'Awareness campagne' },
      { id: 'inv-012', description: 'Shopify abonnement (6 mnd)', category: 'website', amount: 228, date: '2026-01-01', notes: 'Basic plan' },
      { id: 'inv-013', description: 'Domein artazest.nl + .com', category: 'website', amount: 45, date: '2025-09-01', notes: '2 jaar registratie' },
      { id: 'inv-014', description: 'Verzenddozen (100st)', category: 'verpakking', amount: 320, date: '2026-03-01', notes: 'Custom maat voor panelen' },
    ]))
  }
  if (!localStorage.getItem('artazest_budgets')) {
    localStorage.setItem('artazest_budgets', JSON.stringify([
      { id: 'bud-001', category: 'productie', amount: 6000 },
      { id: 'bud-002', category: 'fotografie', amount: 2500 },
      { id: 'bud-003', category: 'juridisch', amount: 1000 },
      { id: 'bud-004', category: 'branding', amount: 3000 },
      { id: 'bud-005', category: 'voorraad', amount: 5000 },
      { id: 'bud-006', category: 'marketing', amount: 3000 },
      { id: 'bud-007', category: 'website', amount: 800 },
      { id: 'bud-008', category: 'verpakking', amount: 600 },
    ]))
  }
}
