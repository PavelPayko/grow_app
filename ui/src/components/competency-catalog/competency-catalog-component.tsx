import { type FC } from 'react'

import { Flex, Spin } from 'antd'

import type { ICompetency, ICompetencyBlock, ICompetencyDomain, IGradeTarget } from 'core/types/competency'

import { CatalogBlocksView } from './components/catalog-blocks-view'
import { CatalogEmptyState } from './components/catalog-empty-state'
import { CatalogModals } from './components/catalog-modals'
import { CatalogToolbar } from './components/catalog-toolbar'
import type { ICompetencyCatalogProps } from './competency-catalog-types'
import {
  createCompetencyModal,
  createDomainModal,
  createGradeTargetModal,
} from './catalog-tree-actions'
import { useCompetencyCatalog } from './use-competency-catalog'

export const CompetencyCatalogComponent: FC<ICompetencyCatalogProps> = () => {
  const catalog = useCompetencyCatalog()

  const treeActions = {
    onEditBlock: (block: ICompetencyBlock) => catalog.setBlockModal({ mode: 'edit', block }),
    onDeleteBlock: (blockId: string) => catalog.deleteBlockMutation.mutate(blockId),
    onCreateDomain: (blockId: string) => catalog.setDomainModal(createDomainModal(blockId)),
    onEditDomain: (blockId: string, domain: ICompetencyDomain) =>
      catalog.setDomainModal({ mode: 'edit', blockId, domain }),
    onDeleteDomain: (domainId: string) => catalog.deleteDomainMutation.mutate(domainId),
    onCreateCompetency: (domainId: string) =>
      catalog.setCompetencyModal(createCompetencyModal(domainId)),
    onEditCompetency: (competency: ICompetency) =>
      catalog.setCompetencyModal({
        mode: 'edit',
        domainId: competency.domain_id,
        competency,
      }),
    onDeleteCompetency: (competencyId: string) =>
      catalog.deleteCompetencyMutation.mutate(competencyId),
    onCreateGradeTarget: (blockId: string) =>
      catalog.setGradeTargetModal(createGradeTargetModal(blockId)),
    onEditGradeTarget: (blockId: string, target: IGradeTarget) =>
      catalog.setGradeTargetModal({ blockId, target }),
    onDeleteGradeTarget: (targetId: string) =>
      catalog.deleteGradeTargetMutation.mutate(targetId),
  }

  const hasCatalogs = catalog.catalogs.length > 0

  return (
    <Flex vertical gap={16}>
      <CatalogToolbar
        catalogs={catalog.catalogs}
        catalogsLoading={catalog.catalogsLoading}
        activeCatalogId={catalog.activeCatalogId}
        deletePending={catalog.deleteCatalogMutation.isPending}
        onCatalogChange={catalog.setSelectedCatalogId}
        onCreateClick={() => catalog.setCatalogModalOpen(true)}
        onCloneClick={() => catalog.setCloneModalOpen(true)}
        onDeleteClick={() => catalog.deleteCatalogMutation.mutate()}
      />

      <Spin spinning={catalog.isBusy}>
        {!hasCatalogs ? (
          <CatalogEmptyState onCreateCatalog={() => catalog.setCatalogModalOpen(true)} />
        ) : (
          <CatalogBlocksView
            blocks={catalog.blocks}
            onAddBlock={() => catalog.setBlockModal({ mode: 'create' })}
            {...treeActions}
          />
        )}
      </Spin>

      <CatalogModals
        catalog={catalog.catalog}
        gradeTargetOptions={catalog.gradeTargetOptions}
        catalogModalOpen={catalog.catalogModalOpen}
        cloneModalOpen={catalog.cloneModalOpen}
        blockModal={catalog.blockModal}
        domainModal={catalog.domainModal}
        competencyModal={catalog.competencyModal}
        gradeTargetModal={catalog.gradeTargetModal}
        onCloseCatalog={() => catalog.setCatalogModalOpen(false)}
        onCloseClone={() => catalog.setCloneModalOpen(false)}
        onCloseBlock={() => catalog.setBlockModal(null)}
        onCloseDomain={() => catalog.setDomainModal(null)}
        onCloseCompetency={() => catalog.setCompetencyModal(null)}
        onCloseGradeTarget={() => catalog.setGradeTargetModal(null)}
        createCatalogMutation={catalog.createCatalogMutation}
        cloneCatalogMutation={catalog.cloneCatalogMutation}
        blockMutation={catalog.blockMutation}
        domainMutation={catalog.domainMutation}
        competencyMutation={catalog.competencyMutation}
        gradeTargetMutation={catalog.gradeTargetMutation}
      />
    </Flex>
  )
}
