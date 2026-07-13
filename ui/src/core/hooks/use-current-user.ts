import { useMemo, useSyncExternalStore } from 'react'

import {
  parseStoredUser,
  readStoredUserSnapshot,
  subscribeStoredUser,
} from 'core/utils/current-user-storage'

export function useCurrentUser() {
  const rawUser = useSyncExternalStore(
    subscribeStoredUser,
    readStoredUserSnapshot,
    () => '',
  )

  const user = useMemo(() => parseStoredUser(rawUser || null), [rawUser])

  return useMemo(() => {
    const managedTeamIds = user?.managed_team_ids ?? []

    return {
      user,
      isAdmin: user?.role === 'admin',
      isLead: user?.role === 'lead',
      isUser: user?.role === 'user',
      managedTeamIds,
      canManageTeam: (teamId: string) => {
        if (!user) return false
        if (user.role === 'admin') return true
        if (user.role === 'lead') return managedTeamIds.includes(teamId)
        return false
      },
    }
  }, [user])
}
