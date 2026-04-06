const USERS = [
  { name: 'Tein', role: 'admin' },
  { name: 'Sam', role: 'team' },
  { name: 'Productie', role: 'team' },
]

export const auth = {
  getUser() {
    const stored = localStorage.getItem('artazest_user')
    return stored ? JSON.parse(stored) : null
  },
  login(name, pin) {
    const validPin = localStorage.getItem('artazest_pin') || '2026'
    if (pin !== validPin) return null
    const user = USERS.find(u => u.name === name)
    if (!user) return null
    localStorage.setItem('artazest_user', JSON.stringify(user))
    return user
  },
  logout() {
    localStorage.removeItem('artazest_user')
  },
  getUsers() { return USERS },
}
