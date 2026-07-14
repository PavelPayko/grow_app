import type { IUserMatrixResponse, ICompetencyWithAssessment } from 'core/types/competency'
import type { IUserCycleHistoryEntry } from 'core/types/competency'
import type { IUser } from 'core/types/user'

export interface IDevelopmentZone {
  competencyId: string
  competencyName: string
  blockName: string
  domainName: string
  score: number
}

export function extractDevelopmentZones(matrix: IUserMatrixResponse): IDevelopmentZone[] {
  const zones: IDevelopmentZone[] = []

  for (const block of matrix.blocks) {
    for (const domain of block.domains ?? []) {
      for (const competency of (domain.competencies ?? []) as ICompetencyWithAssessment[]) {
        const score = competency.assessment?.score
        if (score === null || score === undefined) continue

        zones.push({
          competencyId: competency.id,
          competencyName: competency.name,
          blockName: block.name,
          domainName: domain.name,
          score,
        })
      }
    }
  }

  return zones
    .sort((a, b) => a.score - b.score)
    .slice(0, 5)
}

export function computeCycleDelta(history: IUserCycleHistoryEntry[]): number | null {
  if (history.length < 2) return null
  const previous = history[history.length - 2].weighted_total
  const current = history[history.length - 1].weighted_total
  if (previous === null || current === null) return null
  return current - previous
}

export function computeTargetSummary(blocks: IUserCycleHistoryEntry['blocks']) {
  return blocks.reduce(
    (acc, block) => {
      const status = block.target?.status
      if (status === 'below') acc.below += 1
      if (status === 'in_range') acc.in_range += 1
      if (status === 'above') acc.above += 1
      return acc
    },
    { below: 0, in_range: 0, above: 0 }
  )
}

export function canLeadViewEmployee(
  targetUser: IUser | undefined,
  leadUserId: string,
  managedTeamIds: string[]
): boolean {
  if (!targetUser) return false
  if (targetUser.id === leadUserId) return true
  if (!targetUser.team_id) return false
  return managedTeamIds.includes(targetUser.team_id)
}
