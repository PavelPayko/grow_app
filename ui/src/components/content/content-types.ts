export interface IContentProps {
  userId: string | null
  selectedTeamId?: string | null
  onSelectUser?: (userId: string) => void
}
