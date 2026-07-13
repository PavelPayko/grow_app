import type { FC } from 'react'

import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { theme } from 'antd'

import { EChartsCoreChart, type EChartsOption } from 'components/echarts'
import type { IBlockAggregates } from 'core/types/competency'
import { getTargetStatusColor } from 'core/constants/target-status'
import { formatScore } from 'components/competency-matrix/competency-matrix-utils'

echarts.use([BarChart, GridComponent, TooltipComponent, CanvasRenderer])

interface IBlockTargetChartProps {
  blocks: IBlockAggregates[]
}

export const BlockTargetChart: FC<IBlockTargetChartProps> = ({ blocks }) => {
  const { token } = theme.useToken()

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown) => {
        const item = Array.isArray(params) ? params[0] : params
        if (!item || typeof item !== 'object' || !('dataIndex' in item)) return ''
        const dataIndex = item.dataIndex as number
        const block = blocks[dataIndex]
        const target = block?.target
        const targetText = target
          ? `Target: ${target.min_score}–${target.max_score}`
          : 'Target не задан'
        const name = 'name' in item ? String(item.name) : block?.block_name
        return `${name}<br/>Итог: ${formatScore(block?.weighted_total ?? null)}<br/>${targetText}`
      },
    },
    xAxis: {
      type: 'category',
      data: blocks.map((block) => block.block_name),
      axisLabel: { interval: 0, rotate: 30 },
    },
    yAxis: { type: 'value', min: 0, max: 3 },
    series: [{
      type: 'bar',
      data: blocks.map((block) => ({
        value: block.weighted_total,
        itemStyle: {
          color: getTargetStatusColor(block.target?.status ?? null, token.colorPrimary),
        },
      })),
    }],
  }

  return (
    <EChartsCoreChart
      echarts={echarts}
      option={option}
      style={{ height: 320, width: '100%' }}
    />
  )
}
