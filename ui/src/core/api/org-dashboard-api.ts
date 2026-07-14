import { instanceAxios } from './axios'

import type { IOrgSummaryRow } from 'core/types/competency'

export const fetchOrgSummary = async (): Promise<IOrgSummaryRow[]> => {
  const response = await instanceAxios.get<IOrgSummaryRow[]>('/api/admin/org-summary')
  return response.data
}
