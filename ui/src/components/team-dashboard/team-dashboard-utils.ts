import type { ITeamAggregateUser } from 'core/types/competency'
import type { IUser } from 'core/types/user'

export interface ITeamDashboardProgress {
  avgFillRate: number | null
  fullyAssessedCount: number
  lowFillCount: number
  memberCount: number
}

export interface ITeamDashboardTableRow {
  user_id: string
  full_name: string
  job_title: string | null
  grade: ITeamAggregateUser['grade']
  weighted_total: number | null
  fill_rate: number | null
  blocksBelowTarget: number
  blocks: ITeamAggregateUser['blocks']
}

export interface ITeamHeatmapBlockColumn {
  block_id: string
  block_name: string
}

export function buildTeamDashboardProgress(members: ITeamAggregateUser[]): ITeamDashboardProgress {
  if (!members.length) {
    return {
      avgFillRate: null,
      fullyAssessedCount: 0,
      lowFillCount: 0,
      memberCount: 0,
    }
  }

  let fillSum = 0
  let fillCount = 0
  let fullyAssessedCount = 0
  let lowFillCount = 0

  for (const member of members) {
    if (member.fill_rate !== null && member.fill_rate !== undefined) {
      fillSum += member.fill_rate
      fillCount += 1
      if (member.fill_rate < 0.5) {
        lowFillCount += 1
      }
    } else {
      lowFillCount += 1
    }

    if (member.total_count > 0 && member.scored_count === member.total_count) {
      fullyAssessedCount += 1
    }
  }

  return {
    avgFillRate: fillCount > 0 ? fillSum / fillCount : null,
    fullyAssessedCount,
    lowFillCount,
    memberCount: members.length,
  }
}

export function buildTeamDashboardRows(
  members: ITeamAggregateUser[],
  users: IUser[]
): ITeamDashboardTableRow[] {
  const usersById = new Map(users.map((user) => [user.id, user]))

  return members.map((member) => {
    const user = usersById.get(member.user_id)
    const blocksBelowTarget = member.blocks.filter(
      (block) => block.target?.status === 'below'
    ).length

    return {
      user_id: member.user_id,
      full_name: member.full_name,
      job_title: user?.job_title ?? null,
      grade: member.grade,
      weighted_total: member.weighted_total,
      fill_rate: member.fill_rate,
      blocksBelowTarget,
      blocks: member.blocks,
    }
  })
}

export function extractHeatmapBlocks(members: ITeamAggregateUser[]): ITeamHeatmapBlockColumn[] {
  const blockMap = new Map<string, string>()

  for (const member of members) {
    for (const block of member.blocks) {
      blockMap.set(block.block_id, block.block_name)
    }
  }

  return [...blockMap.entries()].map(([block_id, block_name]) => ({
    block_id,
    block_name,
  }))
}
