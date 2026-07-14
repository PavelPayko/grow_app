import type { NavigateFunction } from 'react-router-dom'

export const SELECTED_TEAM_STORAGE_KEY = 'selectedTeamId'

export function readSelectedTeamId(): string | null {
  return localStorage.getItem(SELECTED_TEAM_STORAGE_KEY)
}

export function writeSelectedTeamId(teamId: string | null): void {
  if (teamId) {
    localStorage.setItem(SELECTED_TEAM_STORAGE_KEY, teamId)
  } else {
    localStorage.removeItem(SELECTED_TEAM_STORAGE_KEY)
  }
}

export function navigateToTeamDashboard(navigate: NavigateFunction, teamId: string): void {
  writeSelectedTeamId(teamId)
  navigate('/')
}
