import type { FC } from 'react'

import { BarChart, LineChart, PieChart } from 'echarts/charts'
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  ToolboxComponent,
  TooltipComponent,
} from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { Flex } from 'antd'
import { useQuery } from '@tanstack/react-query'

import { EChartsCoreChart, type EChartsOption } from 'components/echarts'
import { fetchUsersPoints } from 'core/api/points-api'
import type { IPoint } from 'core/types/points'

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  LegendComponent,
  TooltipComponent,
  GridComponent,
  MarkLineComponent,
  CanvasRenderer,
  DataZoomComponent,
  ToolboxComponent,
])

const statusDict: Record<string, string> = {
  new: 'Новые',
  in_progress: 'Назначенные',
  completed: 'Выполненные',
}

interface IIprSectionProps {
  userId: string
}

export const IprSection: FC<IIprSectionProps> = ({ userId }) => {
  const { data } = useQuery<IPoint[]>({
    queryKey: ['userPoints', userId],
    queryFn: () => fetchUsersPoints(userId),
  })

  const lineData = data?.reduce(
    (acc, item) => {
      const lastPoint = acc.point[acc.point.length - 1] || 0
      const lastAchievement = acc.achievement[acc.achievement.length - 1] || 0

      if (item.type === 'achievement') {
        acc.achievement.push(lastAchievement + 1)
        acc.point.push(lastPoint)
        return acc
      }

      acc.point.push(lastPoint + 1)
      acc.achievement.push(lastAchievement)
      return acc
    },
    { point: [] as number[], achievement: [] as number[] }
  ) || { point: [], achievement: [] }

  const pieAchievementValues =
    data?.filter((item) => item.type === 'achievement')?.reduce(
      (acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    ) || {}

  const piePointValues =
    data?.filter((item) => item.type === 'point')?.reduce(
      (acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    ) || {}

  const lineOption: EChartsOption = {
    xAxis: {
      type: 'category',
      data: data?.map((item) => new Date(item.deadline).toLocaleDateString()) || [],
    },
    yAxis: { type: 'value' },
    tooltip: { trigger: 'item' },
    series: [
      { name: 'Цели', data: lineData.point, type: 'line' },
      { name: 'Достижения', data: lineData.achievement, type: 'line' },
    ],
  }

  const pointPieOption: EChartsOption = {
    title: { text: 'Цели', left: 'center' },
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: 100,
      center: ['50%', '50%'],
      data: Object.entries(piePointValues).map(([key, value]) => ({
        name: `${statusDict[key]} цели`,
        value,
      })),
    }],
  }

  const achievementPieOption: EChartsOption = {
    title: { text: 'Достижения', left: 'center' },
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: 100,
      center: ['50%', '50%'],
      data: Object.entries(pieAchievementValues).map(([key, value]) => ({
        name: `${statusDict[key]} достижения`,
        value,
      })),
    }],
  }

  return (
    <Flex vertical gap={8}>
      <EChartsCoreChart
        echarts={echarts}
        option={lineOption}
        notMerge
        style={{ height: 300, width: '100%' }}
      />
      <Flex>
        <EChartsCoreChart
          echarts={echarts}
          option={pointPieOption}
          style={{ height: 300, width: '50%' }}
        />
        <EChartsCoreChart
          echarts={echarts}
          option={achievementPieOption}
          style={{ height: 300, width: '50%' }}
        />
      </Flex>
    </Flex>
  )
}
