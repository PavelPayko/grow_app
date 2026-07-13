import type { IUserGrade } from './user'

export type { ITeam } from './user'

export type ICycleStatus = 'draft' | 'active' | 'closed'

export type ITargetStatus = 'below' | 'in_range' | 'above' | null

export interface ICompetencyCatalog {
  id: string
  name: string
  created_at: string
}

export interface IGradeTarget {
  id: string
  block_id: string
  grade: IUserGrade
  min_score: number
  max_score: number
  created_at: string
}

export interface ICompetency {
  id: string
  domain_id: string
  name: string
  weight: number
  level_criterion: string
  sort_order: number
  created_at: string
}

export interface ICompetencyDomain {
  id: string
  block_id: string
  name: string
  sort_order: number
  created_at: string
  competencies?: ICompetency[]
}

export interface ICompetencyBlock {
  id: string
  catalog_id: string
  name: string
  sort_order: number
  created_at: string
  grade_targets?: IGradeTarget[]
  domains?: ICompetencyDomain[]
}

export interface ITeamCatalog {
  catalog: ICompetencyCatalog | null
  blocks: ICompetencyBlock[]
}

export interface IAssessmentCycle {
  id: string
  team_id: string
  catalog_id: string
  name: string
  start_date: string | null
  end_date: string | null
  status: ICycleStatus
  created_at: string
}

export interface ICompetencyAssessment {
  id: string
  cycle_id: string
  user_id: string
  competency_id: string
  score: number | null
  evidence: string | null
  assessed_by: string | null
  assessed_at: string | null
  created_at: string
}

export interface ICompetencyWithAssessment extends ICompetency {
  assessment: ICompetencyAssessment | null
}

export interface IBlockTargetSummary {
  grade: IUserGrade
  min_score: number
  max_score: number
  status: ITargetStatus
}

export interface IBlockAggregates {
  block_id: string
  block_name: string
  weighted_sum: number | null
  weight_scored: number | null
  weighted_total: number | null
  unweighted_avg: number | null
  scored_count: number
  total_count: number
  fill_rate: number | null
  target: IBlockTargetSummary | null
}

export interface IUserAggregates {
  cycle_id: string
  user_id: string
  grade: IUserGrade
  weighted_sum: number | null
  weight_scored: number | null
  weighted_total: number | null
  unweighted_avg: number | null
  scored_count: number
  total_count: number
  fill_rate: number | null
  blocks: IBlockAggregates[]
}

export interface IUserMatrixResponse {
  cycle: IAssessmentCycle
  catalog: ICompetencyCatalog | null
  blocks: ICompetencyBlock[]
  aggregates: IUserAggregates
}

export interface IAssessmentUpsertPayload {
  score: number | null
  evidence?: string | null
}

export interface IImportReportSummary {
  employees_in_file: number
  employees_matched: number
  employees_unmatched: number
  assessments_imported: number
  competencies_unmatched: number
  has_warnings: boolean
}

export interface IUnmatchedEmployeeReport {
  name: string
  reason: string
}

export interface IUnmatchedCompetencyReport {
  row: number
  block: string
  domain: string
  competency: string
}

export interface IImportReport {
  summary: IImportReportSummary
  unmatched_employees: IUnmatchedEmployeeReport[]
  unmatched_competencies: IUnmatchedCompetencyReport[]
}

export interface ICatalogImportResult {
  catalog_id: string
  created_blocks: number
  created_domains: number
  created_competencies: number
  updated_competencies: number
}

export interface IImportResult {
  cycle_id: string
  imported_count: number
  catalog: ICatalogImportResult | null
  matched_employees: string[]
  unmatched_employees: string[]
  unmatched_competencies: IUnmatchedCompetencyReport[]
  report: IImportReport
  message?: string
}

export interface ICloneCatalogPayload {
  name?: string
}

export interface ICreateCatalogPayload {
  name: string
}

export interface IUpdateCatalogPayload {
  name: string
}

export interface IBlockPayload {
  name: string
  sort_order?: number
}

export interface IDomainPayload {
  name: string
  sort_order?: number
}

export interface ICompetencyPayload {
  name: string
  weight: number
  level_criterion: string
  sort_order?: number
}

export interface IGradeTargetPayload {
  grade: IUserGrade
  min_score: number
  max_score: number
}

export interface ICreateCyclePayload {
  name: string
  start_date?: string | null
  end_date?: string | null
}

export interface IUserCycleHistoryEntry {
  cycle_id: string
  cycle_name: string
  cycle_status: ICycleStatus
  weighted_total: number | null
  fill_rate: number | null
  blocks: IBlockAggregates[]
}

export interface ITeamAggregateUser {
  user_id: string
  full_name: string
  grade: IUserGrade
  weighted_total: number | null
  unweighted_avg: number | null
  fill_rate: number | null
  scored_count: number
  total_count: number
  blocks: IBlockAggregates[]
}

export type IOrgCycleStatus = ICycleStatus | 'not_started'

export interface IOrgSummaryRow {
  team_id: string
  team_name: string
  cycle_id: string | null
  cycle_name: string | null
  cycle_status: IOrgCycleStatus
  avg_fill_rate: number | null
  member_count: number
}
