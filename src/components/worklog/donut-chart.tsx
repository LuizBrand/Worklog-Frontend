'use client'

import { useEffect, useState } from 'react'

export interface DonutSlice {
  label: string
  value: number
  color: string
}

export interface DonutChartProps {
  data: DonutSlice[]
  size?: number
  strokeWidth?: number
  trackColor?: string
  className?: string
  centerLabel?: React.ReactNode
}

export function DonutChart({
  data,
  size = 140,
  strokeWidth = 14,
  trackColor = 'var(--wl-surface-2)',
  className,
  centerLabel,
}: DonutChartProps) {
  const r = size / 2 - strokeWidth
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r
  const total = data.reduce((sum, s) => sum + s.value, 0)

  const [animatedTotal, setAnimatedTotal] = useState(0)

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setAnimatedTotal(total))
    return () => window.cancelAnimationFrame(id)
  }, [total])

  const slices = data.reduce<
    Array<DonutSlice & { dash: number; gap: number; offset: number }>
  >((acc, s) => {
    const dash =
      animatedTotal > 0 ? (s.value / animatedTotal) * circumference : 0
    const offset = acc.length === 0 ? 0 : acc[acc.length - 1].offset + acc[acc.length - 1].dash
    acc.push({ ...s, dash, gap: circumference - dash, offset })
    return acc
  }, [])

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      role="img"
      aria-label="Distribuição"
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />
      {slices.map((s, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={s.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${s.dash} ${s.gap}`}
          strokeDashoffset={-s.offset}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
          strokeLinecap="butt"
        />
      ))}
      {centerLabel && (
        <foreignObject x={0} y={0} width={size} height={size}>
          <div
            style={{
              width: size,
              height: size,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--wl-text)',
            }}
          >
            {centerLabel}
          </div>
        </foreignObject>
      )}
    </svg>
  )
}
