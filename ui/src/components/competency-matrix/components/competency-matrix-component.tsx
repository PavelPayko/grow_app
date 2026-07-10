import { useState, type FC } from 'react'

import { Alert, Empty, Flex, Spin, Typography } from 'antd'

import type { IAssessmentUpsertPayload } from 'core/types/competency'

import { MatrixBlockSection } from './matrix-block-section'
import { MatrixCycleSelector } from './matrix-cycle-selector'
import { MatrixExcelActions } from './matrix-excel-actions'
import { MatrixSummaryBar } from './matrix-summary-bar'
import type { ICompetencyMatrixProps, IMatrixBlock } from '../competency-matrix-types'
import { useCompetencyMatrix } from '../use-competency-matrix'

export const CompetencyMatrixComponent: FC<ICompetencyMatrixProps> = ({ userId }) => {
  const matrix = useCompetencyMatrix(userId)
  const [savingCompetencyId, setSavingCompetencyId] = useState<string | null>(null)

  const handleSave = async (competencyId: string, payload: IAssessmentUpsertPayload) => {
    setSavingCompetencyId(competencyId)
    try {
      await matrix.upsertMutation.mutateAsync({ competencyId, payload })
    } finally {
      setSavingCompetencyId(null)
    }
  }

  const isBusy = matrix.cyclesLoading || matrix.matrixLoading || matrix.matrixFetching

  if (!matrix.viewedUser) {
    return <Empty description='Пользователь не найден' />
  }

  if (!matrix.teamId) {
    return (
      <Alert
        type='warning'
        showIcon
        message='У пользователя не назначена команда'
        description='Назначьте команду в настройках пользователя, чтобы открыть матрицу компетенций.'
      />
    )
  }

  return (
    <Flex vertical gap={16}>
      <Flex justify='space-between' align='center' wrap='wrap' gap={12}>
        <MatrixCycleSelector
          cycles={matrix.cycles}
          loading={matrix.cyclesLoading}
          value={matrix.selectedCycleId}
          onChange={matrix.setSelectedCycleId}
        />
        {matrix.isAdmin && (
          <MatrixExcelActions
            cycleId={matrix.selectedCycleId}
            cycle={matrix.matrix?.cycle ?? matrix.cycles.find((c) => c.id === matrix.selectedCycleId)}
            userId={userId}
          />
        )}
      </Flex>

      {matrix.isReadOnly && matrix.matrix && (
        <Alert
          type='info'
          showIcon
          message={
            matrix.matrix.cycle.status === 'closed'
              ? 'Цикл закрыт — редактирование недоступно'
              : 'Просмотр без редактирования'
          }
        />
      )}

      <Spin spinning={isBusy}>
        {!matrix.cycles.length ? (
          <Empty description='Для команды нет циклов оценки' />
        ) : !matrix.matrix ? (
          <Empty description='Выберите цикл оценки' />
        ) : (
          <Flex vertical gap={16}>
            <MatrixSummaryBar aggregates={matrix.matrix.aggregates} />

            {(matrix.matrix.blocks as IMatrixBlock[]).map((block) => (
              <MatrixBlockSection
                key={block.id}
                block={block}
                blockAggregate={matrix.matrix!.aggregates.blocks.find(
                  (item) => item.block_id === block.id
                )}
                canEdit={matrix.canEdit}
                savingCompetencyId={savingCompetencyId}
                onSave={handleSave}
              />
            ))}
          </Flex>
        )}
      </Spin>

      {matrix.matrix?.cycle.status === 'draft' && (
        <Typography.Text type='secondary'>
          Цикл в статусе «Черновик» — оценки пока не вводятся.
        </Typography.Text>
      )}
    </Flex>
  )
}
