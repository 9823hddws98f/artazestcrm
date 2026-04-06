import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { auth } from './auth'
import { api } from './api'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Inventory from './pages/Inventory'
import Content from './pages/Content'
import Catalog from './pages/Catalog'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'

const now = new Date().toISOString()
const SEED_TASKS = [
  {id:'seed-tasks-0',title:'Shopify productpaginas compleet (alle kleuren)',category:'Shopify',assignee:'Tein',status:'gepland',priority:'high',dueDate:'2026-04-10',plannedDate:'2026-04-06',tags:['launch'],subtasks:[{id:'st-1a',title:"Foto's uploaden per kleur",completed:true},{id:'st-1b',title:'Productteksten schrijven',completed:true},{id:'st-1c',title:'Prijzen & varianten instellen',completed:false},{id:'st-1d',title:'SEO-titel en meta-beschrijving',completed:false},{id:'st-1e',title:'Preview op mobiel checken',completed:false}],completed:false,archived:false,createdAt:now},
  {id:'seed-tasks-1',title:'Betaalmethoden instellen (iDEAL, creditcard)',category:'Shopify',assignee:'Tein',status:'todo',priority:'high',dueDate:'2026-04-11',plannedDate:'',tags:['launch'],subtasks:[{id:'st-2a',title:'Mollie koppelen',completed:false},{id:'st-2b',title:'iDEAL testen',completed:false},{id:'st-2c',title:'Creditcard testen',completed:false}],completed:false,archived:false,createdAt:now},
  {id:'seed-tasks-2',title:'Shipping zones NL, BE, DE configureren',category:'Shopify',assignee:'Tein',status:'todo',priority:'high',dueDate:'2026-04-11',plannedDate:'',tags:['launch'],subtasks:[],completed:false,archived:false,createdAt:now},
  {id:'seed-tasks-3',title:'Meta Pixel installeren en testen',category:'Ads',assignee:'Tein',status:'gepland',priority:'high',dueDate:'2026-04-12',plannedDate:'2026-04-07',tags:['launch','ads'],subtasks:[{id:'st-4a',title:'Pixel-code in Shopify zetten',completed:false},{id:'st-4b',title:'Events Debugger controleren',completed:false},{id:'st-4c',title:'Test-aankoop pixel testen',completed:false}],completed:false,archived:false,createdAt:now},
  {id:'seed-tasks-4',title:'Meta Ads campagne structuur opzetten',category:'Ads',assignee:'Tein',status:'todo',priority:'high',dueDate:'2026-04-14',plannedDate:'',tags:['ads'],subtasks:[],completed:false,archived:false,createdAt:now},
  {id:'seed-tasks-5',title:'Launch dag advertenties klaarzetten',category:'Ads',assignee:'Tein',status:'todo',priority:'normal',dueDate:'2026-04-17',plannedDate:'',tags:['launch','ads'],subtasks:[],completed:false,archived:false,createdAt:now},
  {id:'seed-tasks-6',title:'Instagram grid vullen (9 posts)',category:'Content',assignee:'Sam',status:'bezig',priority:'high',dueDate:'2026-04-15',plannedDate:'',tags:['content'],subtasks:[{id:'st-7a',title:'Post 1 — hero shot White',completed:true},{id:'st-7b',title:'Post 2 — lifestyle woonkamer',completed:true},{id:'st-7c',title:'Post 3 — detail texture',completed:false},{id:'st-7d',title:'Post 4 — kleurenvergelijking',completed:false},{id:'st-7e',title:'Post 5 t/m 9 afmaken',completed:false}],completed:false,archived:false,createdAt:now},
  {id:'seed-tasks-7',title:'Product fotografie selectie afronden',category:'Content',assignee:'Sam',status:'gepland',priority:'high',dueDate:'2026-04-08',plannedDate:'2026-04-06',tags:['content'],subtasks:[{id:'st-8a',title:'Selectie White (9 stuks)',completed:true},{id:'st-8b',title:'Selectie Black (9 stuks)',completed:true},{id:'st-8c',title:'Selectie overige kleuren',completed:false},{id:'st-8d',title:'Export & aanleveren webshop',completed:false}],completed:false,archived:false,createdAt:now},
  {id:'seed-tasks-8',title:'Website copywriting (over ons, FAQ)',category:'Content',assignee:'Sam',status:'todo',priority:'normal',dueDate:'2026-04-12',plannedDate:'',tags:['content'],subtasks:[],completed:false,archived:false,createdAt:now},
  {id:'seed-tasks-9',title:'Email welcome flow schrijven (Klaviyo)',category:'Email',assignee:'Sam',status:'todo',priority:'normal',dueDate:'2026-04-14',plannedDate:'',tags:['email'],subtasks:[{id:'st-10a',title:'Welkomstmail schrijven',completed:false},{id:'st-10b',title:'Mail 2: verhaal achter Artazest',completed:false},{id:'st-10c',title:'Mail 3: producttips',completed:false}],completed:false,archived:false,createdAt:now},
  {id:'seed-tasks-10',title:'Abandoned cart email flow',category:'Email',assignee:'Sam',status:'todo',priority:'normal',dueDate:'2026-04-15',plannedDate:'',tags:['email'],subtasks:[],completed:false,archived:false,createdAt:now},
  {id:'seed-tasks-11',title:'Verzenddozen assembleren (eerste batch 50)',category:'Verpakking',assignee:'Productie',status:'todo',priority:'normal',dueDate:'2026-04-16',plannedDate:'',tags:['productie'],subtasks:[],completed:false,archived:false,createdAt:now},
  {id:'seed-tasks-12',title:'Eerste 10 artworks snijden en inlijsten',category:'Productie',assignee:'Productie',status:'bezig',priority:'high',dueDate:'2026-04-12',plannedDate:'',tags:['productie'],subtasks:[{id:'st-13a',title:'Panelen op maat snijden (CNC)',completed:true},{id:'st-13b',title:'Artwork bedrukken',completed:false},{id:'st-13c',title:'Inlijsten + ophangbeugel monteren',completed:false},{id:'st-13d',title:'QC per stuk doorlopen',completed:false}],completed:false,archived:false,createdAt:now},
  {id:'seed-tasks-13',title:'QC checklist per artwork doorlopen',category:'Productie',assignee:'Productie',status:'todo',priority:'normal',dueDate:'2026-04-14',plannedDate:'',tags:['productie'],subtasks:[],completed:false,archived:false,createdAt:now},
  {id:'seed-tasks-14',title:'Algemene voorwaarden op website zetten',category:'Juridisch',assignee:'Tein',status:'klaar',priority:'normal',dueDate:'2026-04-01',plannedDate:'',tags:[],subtasks:[],completed:true,archived:false,createdAt:now},
  {id:'seed-tasks-15',title:'Privacybeleid publiceren',category:'Juridisch',assignee:'Tein',status:'klaar',priority:'normal',dueDate:'2026-04-01',plannedDate:'',tags:[],subtasks:[],completed:true,archived:false,createdAt:now},
  {id:'seed-tasks-16',title:'Test bestelling plaatsen (heel proces)',category:'Shopify',assignee:'Tein',status:'todo',priority:'high',dueDate:'2026-04-16',plannedDate:'',tags:['launch'],subtasks:[{id:'st-17a',title:'Bestelling aanmaken',completed:false},{id:'st-17b',title:'Betaalflow testen',completed:false},{id:'st-17c',title:'Bevestigingsemail ontvangen',completed:false},{id:'st-17d',title:'Pakket inpakken & verzenden',completed:false}],completed:false,archived:false,createdAt:now},
  {id:'seed-tasks-17',title:'Launch announcement email klaarzetten',category:'Email',assignee:'Sam',status:'todo',priority:'normal',dueDate:'2026-04-17',plannedDate:'',tags:['launch','email'],subtasks:[],completed:false,archived:false,createdAt:now},
  {id:'seed-tasks-18',title:'Google Analytics 4 koppelen',category:'Ads',assignee:'Tein',status:'gepland',priority:'normal',dueDate:'2026-04-10',plannedDate:'2026-04-06',tags:['ads'],subtasks:[],completed:false,archived:false,createdAt:now},
  {id:'seed-tasks-19',title:'Sample kits samenstellen (5 sets)',category:'Productie',assignee:'Productie',status:'todo',priority:'normal',dueDate:'2026-04-15',plannedDate:'',tags:['productie'],subtasks:[{id:'st-20a',title:'5x White sample',completed:false},{id:'st-20b',title:'5x Black sample',completed:false},{id:'st-20c',title:'5x Blue sample',completed:false},{id:'st-20d',title:'Verpakken in sample mapje',completed:false}],completed:false,archived:false,createdAt:now},
]
const SEED_INVENTORY = [
  {id:'seed-inv-0',name:'White',section:'panelen',quantity:120,minStock:30,leadTimeDays:90,supplier:'',notes:'',startStock:120,batches:[{qty:120,date:'2025-11-15',note:'Eerste voorraad'}]},
  {id:'seed-inv-1',name:'Black',section:'panelen',quantity:120,minStock:30,leadTimeDays:90,supplier:'',notes:'',startStock:120,batches:[]},
  {id:'seed-inv-2',name:'Blue',section:'panelen',quantity:120,minStock:30,leadTimeDays:90,supplier:'',notes:'',startStock:120,batches:[]},
  {id:'seed-inv-3',name:'Green',section:'panelen',quantity:120,minStock:30,leadTimeDays:90,supplier:'',notes:'',startStock:120,batches:[]},
  {id:'seed-inv-4',name:'Grey',section:'panelen',quantity:120,minStock:30,leadTimeDays:90,supplier:'',notes:'',startStock:120,batches:[]},
  {id:'seed-inv-5',name:'Light tan',section:'panelen',quantity:120,minStock:30,leadTimeDays:90,supplier:'',notes:'',startStock:120,batches:[]},
  {id:'seed-inv-6',name:'Beige',section:'panelen',quantity:130,minStock:30,leadTimeDays:90,supplier:'',notes:'',startStock:130,batches:[]},
  {id:'seed-inv-7',name:'Houten lijst',section:'lijst',quantity:0,minStock:20,leadTimeDays:14,supplier:'',notes:'',startStock:0,batches:[]},
  {id:'seed-inv-8',name:'Knopje',section:'lijst',quantity:0,minStock:50,leadTimeDays:7,supplier:'',notes:'Ophangbeugel',startStock:0,batches:[]},
  {id:'seed-inv-9',name:'Verzenddozen',section:'karton',quantity:0,minStock:50,leadTimeDays:7,supplier:'',notes:'Nog bestellen',startStock:0,batches:[]},
  {id:'seed-inv-10',name:'Custom plakband',section:'karton',quantity:20,minStock:10,leadTimeDays:14,supplier:'',notes:'Branded',startStock:20,batches:[]},
  {id:'seed-inv-11',name:'Product boekje',section:'drukwerk',quantity:0,minStock:100,leadTimeDays:10,supplier:'',notes:'Ontwerp afronden',startStock:0,batches:[]},
  {id:'seed-inv-12',name:'Sample folder',section:'drukwerk',quantity:0,minStock:50,leadTimeDays:10,supplier:'',notes:'',startStock:0,batches:[]},
]
const SEED_INVESTMENTS = [
  {id:'inv-001',description:'Eerste voorraad platen (850 st)',category:'voorraad',amount:25000,date:'2025-11-15',notes:''},
  {id:'inv-002',description:'CNC-machine',category:'productie',amount:15000,date:'2025-12-20',notes:''},
  {id:'inv-003',description:'Lijsten 60x60cm red oak (50st)',category:'productie',amount:2400,date:'2025-03-30',notes:''},
  {id:'inv-013',description:'Lijsten 60x120cm red oak (100st)',category:'productie',amount:7200,date:'2025-03-30',notes:''},
  {id:'inv-014',description:'Lijsten 70x100cm red oak (100st)',category:'productie',amount:6820,date:'2025-03-30',notes:''},
  {id:'inv-004',description:'Product fotografie',category:'fotografie',amount:1250,date:'2026-01-18',notes:''},
  {id:'inv-005',description:'Video content',category:'fotografie',amount:850,date:'2026-02-10',notes:''},
  {id:'inv-006',description:'Merknaam registratie',category:'juridisch',amount:450,date:'2025-10-05',notes:'BOIP Benelux'},
  {id:'inv-007',description:'Logo & identiteit',category:'branding',amount:1800,date:'2025-09-20',notes:''},
  {id:'inv-008',description:'Verpakkingsdesign',category:'branding',amount:600,date:'2026-01-25',notes:''},
]

export default function App() {
  const [user, setUser] = useState(null)
  const [loginName, setLoginName] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    // Seed Supabase als leeg
    api.seedIfEmpty('tasks', SEED_TASKS)
    api.seedIfEmpty('inventory', SEED_INVENTORY)
    api.seedIfEmpty('investments', SEED_INVESTMENTS)
    const u = auth.getUser()
    if (u) setUser(u)
  }, [])

  const handleLogin = () => {
    const u = auth.login(loginName, pin)
    if (u) { setUser(u); setError('') }
    else setError('Onjuist wachtwoord')
  }
  const handleLogout = () => { auth.logout(); setUser(null) }

  if (!user) {
    return (
      <div className="login-page">
        <div style={{textAlign:'center'}}>
          <h1>Artazest</h1>
          <p>Co-Pilot — Launch Control</p>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'0.75rem',width:'240px'}}>
          <select className="form-select" value={loginName} onChange={e=>setLoginName(e.target.value)}
            style={{background:'rgba(255,255,255,0.1)',color:'#fff',border:'1px solid rgba(255,255,255,0.2)'}}>
            <option value="">Kies je naam...</option>
            {auth.getUsers().map(u=><option key={u.name} value={u.name}>{u.name}</option>)}
          </select>
          <input type="password" placeholder="Wachtwoord" value={pin} onChange={e=>setPin(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&handleLogin()}
            style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.1)',color:'#fff',fontSize:'1rem',textAlign:'center',letterSpacing:'0.3em'}}/>
          {error&&<div style={{color:'#f87171',fontSize:'0.8rem',textAlign:'center'}}>{error}</div>}
          <button className="login-btn" onClick={handleLogin}>Inloggen</button>
        </div>
      </div>
    )
  }
  return (
    <Layout user={user} onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Dashboard user={user} />} />
        <Route path="/tasks" element={<Tasks user={user} />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/content" element={<Content />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings user={user} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  )
}
