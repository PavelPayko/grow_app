export const OPEN_MY_PROFILE_KEY = 'openMyProfile'

export function requestOpenMyProfile(): void {
  sessionStorage.setItem(OPEN_MY_PROFILE_KEY, '1')
}

export function consumeOpenMyProfile(): boolean {
  const shouldOpen = sessionStorage.getItem(OPEN_MY_PROFILE_KEY) === '1'
  if (shouldOpen) {
    sessionStorage.removeItem(OPEN_MY_PROFILE_KEY)
  }
  return shouldOpen
}
