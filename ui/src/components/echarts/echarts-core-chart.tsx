import type { CSSProperties, FC } from 'react'

import type { EChartsReactProps } from 'echarts-for-react/lib/types'
import ReactEChartsCore from 'echarts-for-react/lib/core.js'

export type { EChartsOption } from 'echarts-for-react/lib/types'

type IEChartsCoreChartProps = {
  echarts: EChartsReactProps['echarts']
  option: EChartsReactProps['option']
  notMerge?: EChartsReactProps['notMerge']
  opts?: EChartsReactProps['opts']
  style?: CSSProperties
}

export const EChartsCoreChart: FC<IEChartsCoreChartProps> = ({
  echarts,
  option,
  style,
  notMerge,
  opts,
}) => (
  <ReactEChartsCore
    echarts={echarts}
    option={option}
    notMerge={notMerge}
    style={style}
    opts={{ locale: 'ru-RU', ...opts }}
  />
)
