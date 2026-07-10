import type { FC } from 'react'

import { Alert, Descriptions, Table, Typography } from 'antd'
import type { TableProps } from 'antd'

import type {
  IImportResult,
  IUnmatchedCompetencyReport,
  IUnmatchedEmployeeReport,
} from 'core/types/competency'

interface MatrixImportReportProps {
  result: IImportResult
}

export const MatrixImportReport: FC<MatrixImportReportProps> = ({ result }) => {
  const { summary } = result.report

  const employeeColumns: TableProps<IUnmatchedEmployeeReport>['columns'] = [
    { title: 'Сотрудник', dataIndex: 'name', key: 'name' },
    { title: 'Причина', dataIndex: 'reason', key: 'reason' },
  ]

  const competencyColumns: TableProps<IUnmatchedCompetencyReport>['columns'] = [
    { title: 'Строка', dataIndex: 'row', key: 'row', width: 70 },
    { title: 'Блок', dataIndex: 'block', key: 'block' },
    { title: 'Домен', dataIndex: 'domain', key: 'domain' },
    { title: 'Компетенция', dataIndex: 'competency', key: 'competency' },
  ]

  return (
    <div>
      <Alert
        type={summary.has_warnings ? 'warning' : 'success'}
        showIcon
        message={result.message}
        style={{ marginBottom: 16 }}
      />

      <Descriptions bordered size='small' column={2} style={{ marginBottom: 16 }}>
        <Descriptions.Item label='Сотрудников в файле'>
          {summary.employees_in_file}
        </Descriptions.Item>
        <Descriptions.Item label='Сопоставлено'>
          {summary.employees_matched}
        </Descriptions.Item>
        <Descriptions.Item label='Не найдено'>
          {summary.employees_unmatched}
        </Descriptions.Item>
        <Descriptions.Item label='Оценок импортировано'>
          {summary.assessments_imported}
        </Descriptions.Item>
        <Descriptions.Item label='Компетенций не сопоставлено' span={2}>
          {summary.competencies_unmatched}
        </Descriptions.Item>
      </Descriptions>

      {result.catalog && (
        <Typography.Paragraph type='secondary'>
          Каталог: +{result.catalog.created_blocks} блоков, +{result.catalog.created_domains}{' '}
          доменов, +{result.catalog.created_competencies} / ~{result.catalog.updated_competencies}{' '}
          компетенций
        </Typography.Paragraph>
      )}

      {result.report.unmatched_employees.length > 0 && (
        <>
          <Typography.Title level={5}>Несопоставленные сотрудники</Typography.Title>
          <Table
            rowKey={(row) => row.name}
            size='small'
            pagination={false}
            columns={employeeColumns}
            dataSource={result.report.unmatched_employees}
            style={{ marginBottom: 16 }}
          />
        </>
      )}

      {result.report.unmatched_competencies.length > 0 && (
        <>
          <Typography.Title level={5}>Несопоставленные компетенции</Typography.Title>
          <Table
            rowKey={(row) => `${row.row}-${row.competency}`}
            size='small'
            pagination={false}
            columns={competencyColumns}
            dataSource={result.report.unmatched_competencies}
          />
        </>
      )}
    </div>
  )
}
