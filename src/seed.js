const SEED_TASKS = [
  { title: 'Shopify productpaginas compleet (alle kleuren)', category: 'Shopify', assignee: 'Tein', status: 'bezig', priority: 'high', dueDate: '2026-04-10', tags: ['launch'] },
  { title: 'Betaalmethoden instellen (iDEAL, creditcard)', category: 'Shopify', assignee: 'Tein', status: 'todo', priority: 'high', dueDate: '2026-04-11', tags: ['launch'] },
  { title: 'Shipping zones NL, BE, DE configureren', category: 'Shopify', assignee: 'Tein', status: 'todo', priority: 'high', dueDate: '2026-04-11', tags: ['launch'] },
  { title: 'Meta Pixel installeren en testen', category: 'Ads', assignee: 'Tein', status: 'todo', priority: 'high', dueDate: '2026-04-12', tags: ['launch','ads'] },
  { title: 'Meta Ads campagne structuur opzetten', category: 'Ads', assignee: 'Tein', status: 'todo', priority: 'high', dueDate: '2026-04-14', tags: ['ads'] },
  { title: 'Launch dag advertenties klaarzetten', category: 'Ads', assignee: 'Tein', status: 'todo', priority: 'normal', dueDate: '2026-04-17', tags: ['launch','ads'] },
  { title: 'Instagram grid vullen (9 posts)', category: 'Content', assignee: 'Sam', status: 'bezig', priority: 'high', dueDate: '2026-04-15', tags: ['content'] },
  { title: 'Product fotografie selectie afronden', category: 'Content', assignee: 'Sam', status: 'bezig', priority: 'high', dueDate: '2026-04-08', tags: ['content'] },
  { title: 'Website copywriting (over ons, FAQ)', category: 'Content', assignee: 'Sam', status: 'todo', priority: 'normal', dueDate: '2026-04-12', tags: ['content'] },
  { title: 'Email welcome flow schrijven (Klaviyo)', category: 'Email', assignee: 'Sam', status: 'todo', priority: 'normal', dueDate: '2026-04-14', tags: ['email'] },
  { title: 'Abandoned cart email flow', category: 'Email', assignee: 'Sam', status: 'todo', priority: 'normal', dueDate: '2026-04-15', tags: ['email'] },
  { title: 'Verzenddozen assembleren (eerste batch 50)', category: 'Verpakking', assignee: 'Productie', status: 'todo', priority: 'normal', dueDate: '2026-04-16', tags: ['productie'] },
  { title: 'Eerste 10 artworks snijden en inlijsten', category: 'Productie', assignee: 'Productie', status: 'bezig', priority: 'high', dueDate: '2026-04-12', tags: ['productie'] },
  { title: 'QC checklist per artwork doorlopen', category: 'Productie', assignee: 'Productie', status: 'todo', priority: 'normal', dueDate: '2026-04-14', tags: ['productie'] },
  { title: 'Algemene voorwaarden op website zetten', category: 'Juridisch', assignee: 'Tein', status: 'klaar', priority: 'normal', dueDate: '2026-04-01', tags: [] },
  { title: 'Privacybeleid publiceren', category: 'Juridisch', assignee: 'Tein', status: 'klaar', priority: 'normal', dueDate: '2026-04-01', tags: [] },
  { title: 'Test bestelling plaatsen (heel proces)', category: 'Shopify', assignee: 'Tein', status: 'todo', priority: 'high', dueDate: '2026-04-16', tags: ['launch'] },
  { title: 'Launch announcement email klaarzetten', category: 'Email', assignee: 'Sam', status: 'todo', priority: 'normal', dueDate: '2026-04-17', tags: ['launch','email'] },
  { title: 'Google Analytics 4 koppelen', category: 'Ads', assignee: 'Tein', status: 'todo', priority: 'normal', dueDate: '2026-04-10', tags: ['ads'] },
  { title: 'Sample kits samenstellen (5 sets)', category: 'Productie', assignee: 'Productie', status: 'todo', priority: 'normal', dueDate: '2026-04-15', tags: ['productie'] },
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
    Tein: { role: 'admin', pages: ['/', '/tasks', '/inventory', '/content', '/catalog', '/analytics', '/settings'] },
    Sam: { role: 'team', pages: ['/', '/tasks', '/content', '/catalog'] },
    Productie: { role: 'team', pages: ['/', '/tasks', '/inventory'] },
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
