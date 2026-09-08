import { useId } from 'react'

import { cn } from '@/utils/cn'

export interface RadarPoint {
  label: string
  /** 0-100 */
  value: number
}

interface RadarChartProps {
  data: RadarPoint[]
  size?: number
  color?: string
  className?: string
  rings?: number
}

/** Lightweight dependency-free radar chart used for the skill profile. */
export function RadarChart({
  data,
  size = 260,
  color = '#3366ff',
  className,
  rings = 4,
}: RadarChartProps) {
  const gradientId = useId()
  const center = size / 2
  const radius = center - 34
  const count = Math.max(data.length, 3)

  const pointAt = (index: number, ratio: number) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2
    return {
      x: center + Math.cos(angle) * radius * ratio,
      y: center + Math.sin(angle) * radius * ratio,
    }
  }

  const polygon = data
    .map((point, index) => {
      const { x, y } = pointAt(index, Math.max(0.02, Math.min(1, point.value / 100)))
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn('overflow-visible', className)}
      role="img"
      aria-label={`Skill radar: ${data.map((item) => `${item.label} ${item.value}%`).join(', ')}`}
    >
      <defs>
        <radialGradient id={gradientId}>
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0.12" />
        </radialGradient>
      </defs>

      {Array.from({ length: rings }, (_, ring) => {
        const ratio = (ring + 1) / rings
        const points = Array.from({ length: count }, (_, index) => {
          const { x, y } = pointAt(index, ratio)
          return `${x.toFixed(2)},${y.toFixed(2)}`
        }).join(' ')
        return (
          <polygon
            key={ring}
            points={points}
            fill="none"
            className="stroke-slate-200 dark:stroke-slate-700"
            strokeWidth={1}
          />
        )
      })}

      {data.map((point, index) => {
        const { x, y } = pointAt(index, 1)
        return (
          <line
            key={`axis-${point.label}`}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            className="stroke-slate-200 dark:stroke-slate-700"
            strokeWidth={1}
          />
        )
      })}

      <polygon
        points={polygon}
        fill={`url(#${gradientId})`}
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {data.map((point, index) => {
        const value = Math.max(0.02, Math.min(1, point.value / 100))
        const dot = pointAt(index, value)
        const labelPoint = pointAt(index, 1.19)
        return (
          <g key={point.label}>
            <circle cx={dot.x} cy={dot.y} r={4} fill={color} />
            <text
              x={labelPoint.x}
              y={labelPoint.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-slate-500 text-[10px] font-semibold uppercase tracking-wide dark:fill-slate-400"
            >
              {point.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
