import { supabase } from './supabase'

/**
 * Inloggen via Supabase Auth.
 *
 * Hiervoor stond de wachtwoordcontrole volledig in de browser en lagen de
 * wachtwoorden in platte tekst in de `settings`-tabel. Dat beschermde niets:
 * de database zelf stond open voor de anon-key. Nu doet Supabase de controle
 * server-side, en geeft het een JWT terug waar de RLS-policies op werken.
 *
 * Het team kiest nog steeds een naam in plaats van een e-mailadres; de mapping
 * naar het echte account staat hieronder.
 */

const USERS = [
  { name: 'Tein', email: 'tein@artazest.com', role: 'admin' },
  { name: 'Sam', email: 'sam@artazest.com', role: 'team' },
  { name: 'Productie', email: 'productie@artazest.com', role: 'team' },
  { name: 'Remy', email: 'remy@artazest.com', role: 'team' },
]

function userByEmail(email) {
  return USERS.find(u => u.email.toLowerCase() === String(email).toLowerCase())
}

export const auth = {
  /** Haalt een bestaande sessie op, of null. Draait bij het opstarten. */
  async getUser() {
    const { data } = await supabase.auth.getSession()
    const email = data?.session?.user?.email
    return email ? userByEmail(email) || null : null
  },

  /** Roept `cb` aan zodra de sessie verandert (login, logout, verlopen token). */
  onChange(cb) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user?.email
      cb(email ? userByEmail(email) || null : null)
    })
    return () => data?.subscription?.unsubscribe()
  },

  /** Logt in. Geeft { user } of { error } terug. */
  async login(name, password) {
    const known = USERS.find(u => u.name === name)
    if (!known) return { error: 'Onbekende gebruiker' }

    const { error } = await supabase.auth.signInWithPassword({
      email: known.email,
      password,
    })
    if (error) return { error: 'Onjuist wachtwoord' }
    return { user: known }
  },

  async logout() {
    await supabase.auth.signOut()
  },

  getUsers() {
    return USERS
  },

  /**
   * Wijzigt het wachtwoord van de ingelogde gebruiker.
   *
   * Een gebruiker kan alleen zijn eigen wachtwoord wijzigen. Wachtwoorden van
   * anderen resetten gaat via het Supabase-dashboard; daar is een admin-key
   * voor nodig die niet in de browser hoort.
   */
  async changePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return error ? { error: error.message } : { ok: true }
  },
}
