import type {
  CompetencyModalState,
  DomainModalState,
  GradeTargetModalState,
} from './competency-catalog-types'
import type { ICompetency, ICompetencyBlock, ICompetencyDomain, IGradeTarget } from 'core/types/competency'

export interface CatalogTreeActions {
  onEditBlock: (block: ICompetencyBlock) => void
  onDeleteBlock: (blockId: string) => void
  onCreateDomain: (blockId: string) => void
  onEditDomain: (blockId: string, domain: ICompetencyDomain) => void
  onDeleteDomain: (domainId: string) => void
  onCreateCompetency: (domainId: string) => void
  onEditCompetency: (competency: ICompetency) => void
  onDeleteCompetency: (competencyId: string) => void
  onCreateGradeTarget: (blockId: string) => void
  onEditGradeTarget: (blockId: string, target: IGradeTarget) => void
  onDeleteGradeTarget: (targetId: string) => void
}

export function createDomainModal(blockId: string): DomainModalState {
  return { mode: 'create', blockId }
}

export function createCompetencyModal(domainId: string): CompetencyModalState {
  return { mode: 'create', domainId }
}

export function createGradeTargetModal(blockId: string): GradeTargetModalState {
  return { blockId }
}
