import { useId } from 'react'

import { cn } from '@/utils/cn'
import { formatDate } from '@/utils/time'

export interface TrendPoint {
  at: number
  score: number
}

interface TrendChartProps {
  data: TrendPoint[]
  height?: number
  color?: string
  className?: string
}

/** Score-over-time line chart with an area fill; renders a flat baseline for a single point. */
export function TrendChart({ data, height = 180, color = '#3366ff', className }: TrendChartProps) {
  const gradientId = useId()
  const width = 640
  const padding = { top: 16, right: 12, bottom: 26, left: 30 }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom

  const points = data.length === 1 ? [data[0], data[0]] : data
  const xFor = (index: number) =>
    padding.left + (points.length <= 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth)
  const yFor = (score: number) => padding.top + plotHeight - (Math.max(0, Math.min(100, score)) / 100) * plotHeight

  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${xFor(index)},${yFor(point.score)}`).join(' ')
  const area = `${line} L${xFor(points.length - 1)},${padding.top + plotHeight} L${xFor(0)},${padding.top + plotHeight} Z`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('w-full', className)}
      preserveAspectRatio="none"
      role="img"
      aria-label="Overall score trend across recent tests"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0, 25, 50, 75, 100].map((tick) => (
        <g key={tick}>
          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={yFor(tick)}
            y2={yFor(tick)}
            className="stroke-slate-200 dark:stroke-slate-800"
            strokeWidth={1}
          />
          <text
            x={padding.left - 8}
            y={yFor(tick)}
            textAnchor="end"
            dominantBaseline="middle"
            className="fill-slate-400 text-[10px]"
          >
            {tick}
          </text>
        </g>
      ))}

      <path d={area} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

      {data.map((point, index) => (
        <circle
          key={`${point.at}-${index}`}
          cx={xFor(data.length === 1 ? 0 : index)}
          cy={yFor(point.score)}
          r={4}
          fill={color}
          className="stroke-white dark:stroke-slate-900"
          strokeWidth={2}
        >
          <title>{`${formatDate(point.at)} — ${point.score}%`}</title>
        </circle>
      ))}
    </svg>
  )
}
