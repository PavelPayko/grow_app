import { useState, type FC } from 'react'

import {
  Alert,
  Button,
  Checkbox,
  Flex,
  Modal,
  Space,
  Typography,
  Upload,
  message,
} from 'antd'
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { UploadFile } from 'antd'

import { exportCycleExcel, importCycleExcel } from 'core/api/competency-assessment-api'
import type { IAssessmentCycle, IImportResult } from 'core/types/competency'

import { getApiError } from '../competency-matrix-utils'
import { MatrixImportReport } from './matrix-import-report'

interface MatrixExcelActionsProps {
  cycleId: string | null
  cycle: IAssessmentCycle | null | undefined
  userId: string
}

export const MatrixExcelActions: FC<MatrixExcelActionsProps> = ({
  cycleId,
  cycle,
  userId,
}) => {
  const queryClient = useQueryClient()
  const [importOpen, setImportOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [importCatalog, setImportCatalog] = useState(true)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [importResult, setImportResult] = useState<IImportResult | null>(null)

  const exportMutation = useMutation({
    mutationFn: () => exportCycleExcel(cycleId!),
    onSuccess: (blob) => {
      const name = cycle?.name?.replace(/[^\w\-]+/g, '_') || 'export'
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `competency-matrix-${name}.xlsx`
      link.click()
      URL.revokeObjectURL(url)
      message.success('Файл экспортирован')
    },
    onError: (error) => message.error(getApiError(error)),
  })

  const importMutation = useMutation({
    mutationFn: (file: File) => importCycleExcel(cycleId!, file, importCatalog),
    onSuccess: (result) => {
      setImportResult(result)
      setImportOpen(false)
      setReportOpen(true)
      setSelectedFile(null)
      setFileList([])
      queryClient.invalidateQueries({ queryKey: ['userMatrix', cycleId, userId] })
      message.success(result.message || 'Импорт выполнен')
    },
    onError: (error) => message.error(getApiError(error)),
  })

  const handleImport = () => {
    const file = selectedFile ?? fileList[0]?.originFileObj
    if (!file) {
      message.warning('Выберите файл .xlsx')
      return
    }
    importMutation.mutate(file)
  }

  const resetImportForm = () => {
    setSelectedFile(null)
    setFileList([])
  }

  const canImport = cycle?.status === 'active'
  const disabled = !cycleId || !cycle

  return (
    <>
      <Space wrap>
        <Button
          icon={<DownloadOutlined />}
          disabled={disabled}
          loading={exportMutation.isPending}
          onClick={() => exportMutation.mutate()}
        >
          Экспорт xlsx
        </Button>
        <Button
          icon={<UploadOutlined />}
          disabled={disabled || !canImport}
          onClick={() => setImportOpen(true)}
        >
          Импорт xlsx
        </Button>
      </Space>

      <Modal
        title='Импорт из Excel'
        open={importOpen}
        onCancel={() => {
          setImportOpen(false)
          resetImportForm()
        }}
        onOk={handleImport}
        okText='Импортировать'
        okButtonProps={{ disabled: !selectedFile }}
        confirmLoading={importMutation.isPending}
        destroyOnHidden
      >
        <Flex vertical gap={12}>
          {cycle && (
            <Typography.Text type='secondary'>
              Цикл: {cycle.name} ({cycle.status})
            </Typography.Text>
          )}
          <Alert
            type='warning'
            showIcon
            message='Оценки в выбранном цикле будут перезаписаны для сопоставленных сотрудников и компетенций.'
          />
          <Upload
            accept='.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            maxCount={1}
            fileList={fileList}
            beforeUpload={(file) => {
              setSelectedFile(file)
              setFileList([
                {
                  uid: file.uid,
                  name: file.name,
                  status: 'done',
                  originFileObj: file,
                },
              ])
              return false
            }}
            onRemove={() => {
              resetImportForm()
              return true
            }}
          >
            <Button icon={<UploadOutlined />}>Выбрать файл</Button>
          </Upload>
          <Checkbox
            checked={importCatalog}
            onChange={(event) => setImportCatalog(event.target.checked)}
          >
            Импортировать/обновить каталог из файла
          </Checkbox>
        </Flex>
      </Modal>

      <Modal
        title='Отчёт об импорте'
        open={reportOpen}
        onCancel={() => setReportOpen(false)}
        footer={
          <Button type='primary' onClick={() => setReportOpen(false)}>
            Закрыть
          </Button>
        }
        width={720}
        destroyOnHidden
      >
        {importResult && <MatrixImportReport result={importResult} />}
      </Modal>
    </>
  )
}
