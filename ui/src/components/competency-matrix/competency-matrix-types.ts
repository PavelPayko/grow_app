import type {
  ICompetencyBlock,
  ICompetencyDomain,
  ICompetencyWithAssessment,
} from 'core/types/competency'

export interface ICompetencyMatrixProps {
  userId: string
  className?: string
}

export interface IMatrixDomain extends Omit<ICompetencyDomain, 'competencies'> {
  competencies: ICompetencyWithAssessment[]
}

export interface IMatrixBlock extends Omit<ICompetencyBlock, 'domains'> {
  domains: IMatrixDomain[]
}
