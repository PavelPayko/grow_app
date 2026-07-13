import type { FC } from 'react'

import { LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'

import { EChartsCoreChart, type EChartsOption } from 'components/echarts'
import type { IUserCycleHistoryEntry } from 'core/types/competency'
import { formatScore } from 'components/competency-matrix/competency-matrix-utils'

echarts.use([LineChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer])

interface ICycleHistoryChartProps {
  history: IUserCycleHistoryEntry[]
}

export const CycleHistoryChart: FC<ICycleHistoryChartProps> = ({ history }) => {
  const option: EChartsOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['Итог', 'Заполненность'] },
    xAxis: {
      type: 'category',
      data: history.map((entry) => entry.cycle_name),
    },
    yAxis: [
      { type: 'value', name: 'Итог', min: 0, max: 3 },
      { type: 'value', name: '%', min: 0, max: 100 },
    ],
    series: [
      {
        name: 'Итог',
        type: 'line',
        data: history.map((entry) => entry.weighted_total),
        tooltip: {
          valueFormatter: (value: number | null) => formatScore(value),
        },
      },
      {
        name: 'Заполненность',
        type: 'line',
        yAxisIndex: 1,
        data: history.map((entry) =>
          entry.fill_rate !== null && entry.fill_rate !== undefined
            ? Math.round(entry.fill_rate * 100)
            : null
        ),
        tooltip: {
          valueFormatter: (value: number | null) => `${value}%`,
        },
      },
    ],
  }

  return (
    <EChartsCoreChart
      echarts={echarts}
      option={option}
      style={{ height: 300, width: '100%' }}
    />
  )
}
