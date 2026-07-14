import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'

import { fetchUsers } from 'core/api/users-api'
import type { IUser } from 'core/types/user'

import { useCurrentUser } from './use-current-user'

export function useViewedUser(userId: string | null) {
  const { user, isAdmin, isLead } = useCurrentUser()
  const isManager = isAdmin || isLead

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    enabled: isManager && Boolean(userId),
  })

  const viewedUser = useMemo((): IUser | null => {
    if (!userId) {
      return null
    }
    if (isManager) {
      return users?.find((item) => item.id === userId) ?? null
    }
    if (user?.id === userId) {
      return user
    }
    return null
  }, [userId, isManager, users, user])

  return {
    viewedUser,
    isLoading: isManager && Boolean(userId) && isLoading && !viewedUser,
  }
}
