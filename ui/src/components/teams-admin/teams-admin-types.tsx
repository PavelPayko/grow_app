export interface ITeamsAdminProps {
  className?: string
}

export interface ICreateTeamFormValues {
  name: string
}

export interface IEditTeamFormValues {
  name: string
  catalog_id?: string | null
}
