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
  // Akoestische panelen 240x120
  { name: 'Oak', section: 'Akoestische panelen 240×120', quantity: 15, minStock: 10, leadTimeDays: 90, supplier: 'Alibaba', notes: '' },
  { name: 'Walnut', section: 'Akoestische panelen 240×120', quantity: 12, minStock: 10, leadTimeDays: 90, supplier: 'Alibaba', notes: '' },
  { name: 'Black', section: 'Akoestische panelen 240×120', quantity: 10, minStock: 10, leadTimeDays: 90, supplier: 'Alibaba', notes: '' },
  { name: 'White', section: 'Akoestische panelen 240×120', quantity: 8, minStock: 10, leadTimeDays: 90, supplier: 'Alibaba', notes: '' },
  { name: 'Forest', section: 'Akoestische panelen 240×120', quantity: 5, minStock: 10, leadTimeDays: 90, supplier: 'Alibaba', notes: '' },
  { name: 'Natural', section: 'Akoestische panelen 240×120', quantity: 0, minStock: 10, leadTimeDays: 90, supplier: 'Alibaba', notes: '' },
  // Houten lijst & knop
  { name: 'Houten lijst', section: 'Houten lijst & knop', quantity: 0, minStock: 20, leadTimeDays: 14, supplier: '', notes: '' },
  { name: 'Knopje (ophangbeugel)', section: 'Houten lijst & knop', quantity: 0, minStock: 50, leadTimeDays: 7, supplier: '', notes: '' },
  // Karton & verpakking
  { name: 'Verzenddozen', section: 'Karton & verpakking', quantity: 0, minStock: 50, leadTimeDays: 7, supplier: '', notes: 'Nog bestellen' },
  { name: 'Custom plakband', section: 'Karton & verpakking', quantity: 20, minStock: 10, leadTimeDays: 14, supplier: '', notes: 'Branded tape' },
  { name: 'Vulmateriaal', section: 'Karton & verpakking', quantity: 0, minStock: 20, leadTimeDays: 5, supplier: '', notes: '' },
  // Drukwerk
  { name: 'Product boekje', section: 'Drukwerk', quantity: 0, minStock: 100, leadTimeDays: 10, supplier: '', notes: 'Ontwerp afronden' },
  { name: 'Sample folder', section: 'Drukwerk', quantity: 0, minStock: 50, leadTimeDays: 10, supplier: '', notes: 'Ontwerp afronden' },
  { name: 'Visitekaartjes', section: 'Drukwerk', quantity: 0, minStock: 100, leadTimeDays: 7, supplier: '', notes: '' },
  // Samples snijden
  { name: 'Sample set compleet (5 kleuren)', section: 'Samples snijden', quantity: 0, minStock: 20, leadTimeDays: 14, supplier: '', notes: '' },
  { name: 'Losse samples', section: 'Samples snijden', quantity: 0, minStock: 50, leadTimeDays: 7, supplier: '', notes: '' },
  // CNC
  { name: 'CNC freeswerk', section: 'CNC', quantity: 0, minStock: 0, leadTimeDays: 0, supplier: '', notes: 'Nog uitzoeken' },
];
const SEED_ARTWORK = [
  { name: 'Artwork 1', stage: 'foto', colors: ['Oak', 'Walnut', 'Black', 'White', 'Forest', 'Natural'], designer: '', notes: 'Fotoselectie afronden — 45 shots scope' },
  { name: 'Artwork 2', stage: 'design', colors: ['Oak', 'Walnut', 'Black'], designer: '', notes: 'Nieuw design' },
  { name: 'Artwork 3', stage: 'design', colors: [], designer: '', notes: 'Concept fase' },
];
export function seedData() {
  const stores = { tasks: SEED_TASKS, inventory: SEED_INVENTORY, artwork: SEED_ARTWORK };
  for (const [store, items] of Object.entries(stores)) {
    const existing = localStorage.getItem(`artazest_${store}`);
    if (existing && JSON.parse(existing).length > 0) continue;
    const withIds = items.map((item, i) => ({ ...item, id: `seed-${store}-${i}`, createdAt: new Date().toISOString() }));
    localStorage.setItem(`artazest_${store}`, JSON.stringify(withIds));
  }
}
