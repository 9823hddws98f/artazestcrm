const USERS = [
  { name: 'Tein', role: 'admin' },
  { name: 'Sam', role: 'team' },
  { name: 'Productie', role: 'team' },
]

const DEFAULT_PASSWORDS = { Tein: '2026', Sam: '2026', Productie: '2026' }

export const auth = {
  getPasswords() {
    try { return JSON.parse(localStorage.getItem('artazest_passwords')) || DEFAULT_PASSWORDS }
    catch { return DEFAULT_PASSWORDS }
  },
  getUser() {
    try { return JSON.parse(localStorage.getItem('artazest_user')) }
    catch { return null }
  },
  login(name, password) {
    const passwords = this.getPasswords()
    const user = USERS.find(u => u.name === name)
    if (!user) return null
    if (passwords[name] !== password) return null
    localStorage.setItem('artazest_user', JSON.stringify(user))
    return user
  },
  logout() { localStorage.removeItem('artazest_user') },
  getUsers() { return USERS },
  changePassword(name, newPassword) {
    const passwords = this.getPasswords()
    passwords[name] = newPassword
    localStorage.setItem('artazest_passwords', JSON.stringify(passwords))
  },
}
