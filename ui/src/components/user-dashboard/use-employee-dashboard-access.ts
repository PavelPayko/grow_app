import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'

import { fetchUsers } from 'core/api/users-api'
import { useCurrentUser } from 'core/hooks/use-current-user'

import { canLeadViewEmployee } from './user-dashboard-utils'

export function useEmployeeDashboardAccess(userId: string) {
  const { user, isAdmin, isLead, isUser, managedTeamIds } = useCurrentUser()

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    enabled: !!userId,
  })

  const targetUser = useMemo(
    () => users.find((item) => item.id === userId),
    [users, userId]
  )

  const allowed = useMemo(() => {
    if (!userId || !user) return false
    if (isAdmin) return true
    if (userId === user.id) return true
    if (isLead) {
      return canLeadViewEmployee(targetUser, user.id, managedTeamIds)
    }
    if (isUser) {
      return userId === user.id
    }
    return false
  }, [userId, user, isAdmin, isLead, isUser, targetUser, managedTeamIds])

  return { allowed, targetUser, isLoading }
}
