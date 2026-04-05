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
  { name: 'White', section: 'panelen', quantity: 120, minStock: 30, leadTimeDays: 90, supplier: '', notes: '', startStock: 120, batches: [{qty:120,date:'2025-11-15',note:'Eerste voorraad'}] },
  { name: 'Black', section: 'panelen', quantity: 120, minStock: 30, leadTimeDays: 90, supplier: '', notes: '', startStock: 120, batches: [{qty:120,date:'2025-11-15',note:'Eerste voorraad'}] },
  { name: 'Blue', section: 'panelen', quantity: 120, minStock: 30, leadTimeDays: 90, supplier: '', notes: '', startStock: 120, batches: [{qty:120,date:'2025-11-15',note:'Eerste voorraad'}] },
  { name: 'Green', section: 'panelen', quantity: 120, minStock: 30, leadTimeDays: 90, supplier: '', notes: '', startStock: 120, batches: [{qty:120,date:'2025-11-15',note:'Eerste voorraad'}] },
  { name: 'Grey', section: 'panelen', quantity: 120, minStock: 30, leadTimeDays: 90, supplier: '', notes: '', startStock: 120, batches: [{qty:120,date:'2025-11-15',note:'Eerste voorraad'}] },
  { name: 'Light tan', section: 'panelen', quantity: 120, minStock: 30, leadTimeDays: 90, supplier: '', notes: '', startStock: 120, batches: [{qty:120,date:'2025-11-15',note:'Eerste voorraad'}] },
  { name: 'Beige', section: 'panelen', quantity: 130, minStock: 30, leadTimeDays: 90, supplier: '', notes: '', startStock: 130, batches: [{qty:130,date:'2025-11-15',note:'Eerste voorraad'}] },
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
    Tein: { role: 'admin', pages: ['/', '/tasks', '/inventory', '/content', '/catalog', '/howto', '/analytics', '/settings'] },
    Sam: { role: 'team', pages: ['/', '/tasks', '/content', '/catalog'] },
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
      { id: 'inv-001', description: 'Eerste voorraad platen (850 st)', category: 'voorraad', amount: 25000, date: '2025-11-15', notes: '850 akoestische platen' },
      { id: 'inv-002', description: 'CNC-machine', category: 'productie', amount: 15000, date: '2025-12-20', notes: '' },
      { id: 'inv-003', description: 'Lijsten 60x60cm red oak (50st)', category: 'productie', amount: 2400, date: '2025-03-30', notes: '50x $24 x2' },
      { id: 'inv-013', description: 'Lijsten 60x120cm red oak (100st)', category: 'productie', amount: 7200, date: '2025-03-30', notes: '100x $36 x2' },
      { id: 'inv-014', description: 'Lijsten 70x100cm red oak (100st)', category: 'productie', amount: 6820, date: '2025-03-30', notes: '100x $34.10 x2' },
      { id: 'inv-004', description: 'Product fotografie', category: 'fotografie', amount: 1250, date: '2026-01-18', notes: '' },
      { id: 'inv-005', description: 'Video content', category: 'fotografie', amount: 850, date: '2026-02-10', notes: '' },
      { id: 'inv-006', description: 'Merknaam registratie', category: 'juridisch', amount: 450, date: '2025-10-05', notes: 'BOIP Benelux' },
      { id: 'inv-007', description: 'Logo & identiteit', category: 'branding', amount: 1800, date: '2025-09-20', notes: '' },
      { id: 'inv-008', description: 'Verpakkingsdesign', category: 'branding', amount: 600, date: '2026-01-25', notes: '' },
      { id: 'inv-009', description: 'Meta Ads pre-launch', category: 'marketing', amount: 400, date: '2026-03-15', notes: '' },
      { id: 'inv-010', description: 'Shopify (6 mnd)', category: 'website', amount: 228, date: '2026-01-01', notes: '' },
      { id: 'inv-011', description: 'Verzenddozen', category: 'verpakking', amount: 320, date: '2026-03-01', notes: '' },
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
