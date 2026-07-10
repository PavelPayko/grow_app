import type { FC } from 'react'

import { Input, Select, Space, Table, Tag, Typography, type TableProps } from 'antd'

import type { IBlockAggregates } from 'core/types/competency'
import type { IAssessmentUpsertPayload } from 'core/types/competency'

import {
  TARGET_STATUS_META,
  type IMatrixBlock,
} from '../competency-matrix-types'
import { formatRate, formatScore } from '../competency-matrix-utils'

interface MatrixRow {
  key: string
  domainName: string
  competencyId: string
  competencyName: string
  weight: number
  levelCriterion: string
  score: number | null
  evidence: string | null
}

interface MatrixCompetenciesTableProps {
  block: IMatrixBlock
  canEdit: boolean
  savingCompetencyId: string | null
  onSave: (competencyId: string, payload: IAssessmentUpsertPayload) => void
}

function buildRows(block: IMatrixBlock): MatrixRow[] {
  const rows: MatrixRow[] = []

  for (const domain of block.domains || []) {
    for (const competency of domain.competencies || []) {
      rows.push({
        key: competency.id,
        domainName: domain.name,
        competencyId: competency.id,
        competencyName: competency.name,
        weight: competency.weight,
        levelCriterion: competency.level_criterion,
        score: competency.assessment?.score ?? null,
        evidence: competency.assessment?.evidence ?? null,
      })
    }
  }

  return rows
}

export const MatrixCompetenciesTable: FC<MatrixCompetenciesTableProps> = ({
  block,
  canEdit,
  savingCompetencyId,
  onSave,
}) => {
  const columns: TableProps<MatrixRow>['columns'] = [
    { title: 'Домен', dataIndex: 'domainName', key: 'domainName', width: 160 },
    { title: 'Компетенция', dataIndex: 'competencyName', key: 'competencyName', width: 200 },
    { title: 'Вес', dataIndex: 'weight', key: 'weight', width: 70 },
    {
      title: 'Критерий',
      dataIndex: 'levelCriterion',
      key: 'levelCriterion',
      ellipsis: true,
    },
    {
      title: 'Оценка',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      render: (score: number | null, record) =>
        canEdit ? (
          <Select
            size='small'
            allowClear
            style={{ width: 72 }}
            loading={savingCompetencyId === record.competencyId}
            value={score ?? undefined}
            options={[0, 1, 2, 3].map((value) => ({ value, label: String(value) }))}
            onChange={(value) =>
              onSave(record.competencyId, {
                score: value ?? null,
                evidence: record.evidence,
              })
            }
          />
        ) : (
          score ?? '—'
        ),
    },
    {
      title: 'Доказательства',
      dataIndex: 'evidence',
      key: 'evidence',
      width: 220,
      render: (evidence: string | null, record) =>
        canEdit ? (
          <Input
            size='small'
            defaultValue={evidence ?? ''}
            placeholder='Evidence'
            onBlur={(event) => {
              const nextEvidence = event.target.value.trim() || null
              if (nextEvidence === (evidence ?? null)) return
              onSave(record.competencyId, {
                score: record.score,
                evidence: nextEvidence,
              })
            }}
          />
        ) : (
          evidence || '—'
        ),
    },
  ]

  return (
    <Table
      rowKey='key'
      size='small'
      pagination={false}
      columns={columns}
      dataSource={buildRows(block)}
      locale={{ emptyText: 'Нет компетенций в блоке' }}
    />
  )
}

interface MatrixBlockSectionProps {
  block: IMatrixBlock
  blockAggregate: IBlockAggregates | undefined
  canEdit: boolean
  savingCompetencyId: string | null
  onSave: (competencyId: string, payload: IAssessmentUpsertPayload) => void
}

export const MatrixBlockSection: FC<MatrixBlockSectionProps> = ({
  block,
  blockAggregate,
  canEdit,
  savingCompetencyId,
  onSave,
}) => {
  const targetStatus = blockAggregate?.target?.status
  const targetMeta = targetStatus ? TARGET_STATUS_META[targetStatus] : null

  return (
    <div style={{ marginBottom: 24 }}>
      <Space style={{ marginBottom: 8 }} wrap>
        <Typography.Title level={5} style={{ margin: 0 }}>
          {block.name}
        </Typography.Title>
        <Typography.Text type='secondary'>
          Итог: {formatScore(blockAggregate?.weighted_total ?? null)}
        </Typography.Text>
        {targetMeta && (
          <Tag color={targetMeta.color}>
            {targetMeta.label}
            {blockAggregate?.target
              ? ` (${blockAggregate.target.min_score}–${blockAggregate.target.max_score})`
              : ''}
          </Tag>
        )}
        <Typography.Text type='secondary'>
          Заполнено: {formatRate(blockAggregate?.fill_rate)}
        </Typography.Text>
      </Space>
      <MatrixCompetenciesTable
        block={block}
        canEdit={canEdit}
        savingCompetencyId={savingCompetencyId}
        onSave={onSave}
      />
    </div>
  )
}
