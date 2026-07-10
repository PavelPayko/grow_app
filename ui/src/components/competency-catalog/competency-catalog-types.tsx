import type {
  ICompetency,
  ICompetencyBlock,
  ICompetencyDomain,
  IGradeTarget,
} from 'core/types/competency'
import type { IUserGrade } from 'core/types/user'

export interface ICompetencyCatalogProps {
  className?: string
}

export interface IBlockFormValues {
  name: string
  sort_order?: number
}

export interface IDomainFormValues {
  name: string
  sort_order?: number
}

export interface ICompetencyFormValues {
  name: string
  weight: number
  level_criterion: string
  sort_order?: number
}

export interface ICatalogFormValues {
  name: string
}

export interface ICloneCatalogFormValues {
  source_team_id: string
  name?: string
}

export interface IGradeTargetFormValues {
  grade: IUserGrade
  min_score: number
  max_score: number
}

export type BlockModalState = {
  mode: 'create' | 'edit'
  block?: ICompetencyBlock
} | null

export type DomainModalState = {
  mode: 'create' | 'edit'
  blockId: string
  domain?: ICompetencyDomain
} | null

export type CompetencyModalState = {
  mode: 'create' | 'edit'
  domainId: string
  competency?: ICompetency
} | null

export type GradeTargetModalState = {
  blockId: string
  target?: IGradeTarget
} | null
