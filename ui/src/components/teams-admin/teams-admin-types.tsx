export interface ITeamsAdminProps {
  className?: string
  readOnly?: boolean
}

export interface ICreateTeamFormValues {
  name: string
}

export interface IEditTeamFormValues {
  name: string
  catalog_id?: string | null
}
