export type User = { name: string; email: string; role: 'admin' | 'user' }
const USER_KEY = 'user'
export function setUser(user: User) { localStorage.setItem(USER_KEY, JSON.stringify(user)) }
export function getUser(): User | null { const raw = localStorage.getItem(USER_KEY); return raw ? JSON.parse(raw) as User : null }
export function clearUser() { localStorage.removeItem(USER_KEY) }
