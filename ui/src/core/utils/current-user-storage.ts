import type { IUser } from 'core/types/user'

const STORAGE_KEY = 'user'

type Listener = () => void

const listeners = new Set<Listener>()

function notifyListeners() {
  listeners.forEach((listener) => listener())
}

export function parseStoredUser(raw: string | null): IUser | null {
  if (!raw) return null

  try {
    const user = JSON.parse(raw) as IUser
    if (!user?.id && !user?.full_name && !user?.login) {
      return null
    }

    return user
  } catch {
    return null
  }
}

export function readStoredUserSnapshot(): string {
  return localStorage.getItem(STORAGE_KEY) ?? ''
}

export function readStoredUser(): IUser | null {
  return parseStoredUser(readStoredUserSnapshot())
}

export function writeStoredUser(user: IUser): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  notifyListeners()
}

export function clearStoredUser(): void {
  localStorage.setItem('token', '')
  localStorage.setItem(STORAGE_KEY, '{}')
  notifyListeners()
}

export function subscribeStoredUser(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
