import type { FC } from 'react'

import { Form, Input, InputNumber, Modal, Select, Typography } from 'antd'
import type { UseMutationResult } from '@tanstack/react-query'

import type { ICompetencyCatalog } from 'core/types/competency'

import type {
  BlockModalState,
  CompetencyModalState,
  DomainModalState,
  GradeTargetModalState,
  IBlockFormValues,
  ICatalogFormValues,
  ICloneCatalogFormValues,
  ICompetencyFormValues,
  IDomainFormValues,
  IGradeTargetFormValues,
} from '../competency-catalog-types'

interface CatalogModalsProps {
  catalog: ICompetencyCatalog | null
  gradeTargetOptions: { value: string; label: string }[]
  catalogModalOpen: boolean
  editCatalogModalOpen: boolean
  cloneModalOpen: boolean
  blockModal: BlockModalState
  domainModal: DomainModalState
  competencyModal: CompetencyModalState
  gradeTargetModal: GradeTargetModalState
  onCloseCatalog: () => void
  onCloseEditCatalog: () => void
  onCloseClone: () => void
  onCloseBlock: () => void
  onCloseDomain: () => void
  onCloseCompetency: () => void
  onCloseGradeTarget: () => void
  createCatalogMutation: UseMutationResult<unknown, Error, ICatalogFormValues>
  updateCatalogMutation: UseMutationResult<unknown, Error, ICatalogFormValues>
  cloneCatalogMutation: UseMutationResult<unknown, Error, ICloneCatalogFormValues>
  blockMutation: UseMutationResult<unknown, Error, IBlockFormValues>
  domainMutation: UseMutationResult<unknown, Error, IDomainFormValues>
  competencyMutation: UseMutationResult<unknown, Error, ICompetencyFormValues>
  gradeTargetMutation: UseMutationResult<unknown, Error, IGradeTargetFormValues>
}

export const CatalogModals: FC<CatalogModalsProps> = ({
  catalog,
  gradeTargetOptions,
  catalogModalOpen,
  editCatalogModalOpen,
  cloneModalOpen,
  blockModal,
  domainModal,
  competencyModal,
  gradeTargetModal,
  onCloseCatalog,
  onCloseEditCatalog,
  onCloseClone,
  onCloseBlock,
  onCloseDomain,
  onCloseCompetency,
  onCloseGradeTarget,
  createCatalogMutation,
  updateCatalogMutation,
  cloneCatalogMutation,
  blockMutation,
  domainMutation,
  competencyMutation,
  gradeTargetMutation,
}) => (
  <>
    <Modal
      title='Создать каталог'
      open={catalogModalOpen}
      onCancel={onCloseCatalog}
      okButtonProps={{
        htmlType: 'submit',
        form: 'create-catalog',
        loading: createCatalogMutation.isPending,
      }}
      destroyOnHidden
    >
      <Form<ICatalogFormValues>
        name='create-catalog'
        layout='vertical'
        onFinish={(values) => createCatalogMutation.mutate(values)}
        initialValues={{ name: 'Каталог компетенций' }}
      >
        <Form.Item
          name='name'
          label='Название'
          rules={[{ required: true, message: 'Введите название' }]}
        >
          <Input />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      title='Переименовать каталог'
      open={editCatalogModalOpen}
      onCancel={onCloseEditCatalog}
      okButtonProps={{
        htmlType: 'submit',
        form: 'edit-catalog',
        loading: updateCatalogMutation.isPending,
      }}
      destroyOnHidden
    >
      <Form<ICatalogFormValues>
        key={catalog?.id || 'edit-catalog'}
        name='edit-catalog'
        layout='vertical'
        onFinish={(values) => updateCatalogMutation.mutate(values)}
        initialValues={{ name: catalog?.name || '' }}
      >
        <Form.Item
          name='name'
          label='Название'
          rules={[{ required: true, message: 'Введите название' }]}
        >
          <Input />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      title='Дублировать каталог'
      open={cloneModalOpen}
      onCancel={onCloseClone}
      okButtonProps={{
        htmlType: 'submit',
        form: 'clone-catalog',
        loading: cloneCatalogMutation.isPending,
      }}
      destroyOnHidden
    >
      <Form<ICloneCatalogFormValues>
        name='clone-catalog'
        layout='vertical'
        onFinish={(values) => cloneCatalogMutation.mutate(values)}
      >
        {catalog && (
          <Typography.Paragraph type='secondary'>
            Будет создан новый независимый каталог на основе «{catalog.name}».
          </Typography.Paragraph>
        )}
        <Form.Item
          name='name'
          label='Название нового каталога'
          extra='Если не указано — «{название источника} (копия)»'
        >
          <Input placeholder='Необязательно' />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      title={blockModal?.mode === 'edit' ? 'Изменить блок' : 'Добавить блок'}
      open={Boolean(blockModal)}
      onCancel={onCloseBlock}
      okButtonProps={{
        htmlType: 'submit',
        form: 'block-form',
        loading: blockMutation.isPending,
      }}
      destroyOnHidden
    >
      <Form<IBlockFormValues>
        key={blockModal?.block?.id || 'new-block'}
        name='block-form'
        layout='vertical'
        onFinish={(values) => blockMutation.mutate(values)}
        initialValues={{
          name: blockModal?.block?.name || '',
          sort_order: blockModal?.block?.sort_order ?? 0,
        }}
      >
        <Form.Item
          name='name'
          label='Название'
          rules={[{ required: true, message: 'Введите название' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name='sort_order' label='Порядок сортировки'>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      title={domainModal?.mode === 'edit' ? 'Изменить домен' : 'Добавить домен'}
      open={Boolean(domainModal)}
      onCancel={onCloseDomain}
      okButtonProps={{
        htmlType: 'submit',
        form: 'domain-form',
        loading: domainMutation.isPending,
      }}
      destroyOnHidden
    >
      <Form<IDomainFormValues>
        key={domainModal?.domain?.id || domainModal?.blockId || 'new-domain'}
        name='domain-form'
        layout='vertical'
        onFinish={(values) => domainMutation.mutate(values)}
        initialValues={{
          name: domainModal?.domain?.name || '',
          sort_order: domainModal?.domain?.sort_order ?? 0,
        }}
      >
        <Form.Item
          name='name'
          label='Название'
          rules={[{ required: true, message: 'Введите название' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name='sort_order' label='Порядок сортировки'>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      title={
        competencyModal?.mode === 'edit' ? 'Изменить компетенцию' : 'Добавить компетенцию'
      }
      open={Boolean(competencyModal)}
      onCancel={onCloseCompetency}
      okButtonProps={{
        htmlType: 'submit',
        form: 'competency-form',
        loading: competencyMutation.isPending,
      }}
      destroyOnHidden
    >
      <Form<ICompetencyFormValues>
        key={competencyModal?.competency?.id || competencyModal?.domainId || 'new-comp'}
        name='competency-form'
        layout='vertical'
        onFinish={(values) => competencyMutation.mutate(values)}
        initialValues={{
          name: competencyModal?.competency?.name || '',
          weight: competencyModal?.competency?.weight ?? 1,
          level_criterion: competencyModal?.competency?.level_criterion || '',
          sort_order: competencyModal?.competency?.sort_order ?? 0,
        }}
      >
        <Form.Item
          name='name'
          label='Название'
          rules={[{ required: true, message: 'Введите название' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name='weight'
          label='Вес'
          rules={[{ required: true, message: 'Укажите вес' }]}
        >
          <InputNumber min={0.01} step={0.1} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name='level_criterion'
          label='Критерий уровня'
          rules={[{ required: true, message: 'Введите критерий' }]}
        >
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name='sort_order' label='Порядок сортировки'>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      title={gradeTargetModal?.target ? 'Изменить target' : 'Добавить target'}
      open={Boolean(gradeTargetModal)}
      onCancel={onCloseGradeTarget}
      okButtonProps={{
        htmlType: 'submit',
        form: 'grade-target-form',
        loading: gradeTargetMutation.isPending,
      }}
      destroyOnHidden
    >
      <Form<IGradeTargetFormValues>
        key={gradeTargetModal?.target?.id || gradeTargetModal?.blockId || 'new-target'}
        name='grade-target-form'
        layout='vertical'
        onFinish={(values) => gradeTargetMutation.mutate(values)}
        initialValues={{
          grade: gradeTargetModal?.target?.grade || gradeTargetOptions[0]?.value,
          min_score: gradeTargetModal?.target?.min_score ?? 0,
          max_score: gradeTargetModal?.target?.max_score ?? 3,
        }}
      >
        <Form.Item
          name='grade'
          label='Грейд'
          rules={[{ required: true, message: 'Выберите грейд' }]}
        >
          <Select
            disabled={Boolean(gradeTargetModal?.target)}
            options={gradeTargetOptions}
          />
        </Form.Item>
        <Form.Item
          name='min_score'
          label='Min score'
          rules={[{ required: true, message: 'Укажите min' }]}
        >
          <InputNumber min={0} max={3} step={0.1} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name='max_score'
          label='Max score'
          rules={[
            { required: true, message: 'Укажите max' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                const min = getFieldValue('min_score')
                if (value === undefined || min === undefined || value >= min) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error('Max должен быть ≥ min'))
              },
            }),
          ]}
        >
          <InputNumber min={0} max={3} step={0.1} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  </>
)
