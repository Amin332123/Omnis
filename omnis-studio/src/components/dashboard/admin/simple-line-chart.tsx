"use client"

import React, { useMemo } from "react"

type Point = {
  label: string
  value: number
}

type SimpleLineChartProps = {
  data: Point[]
  height?: number
  ariaLabel?: string
}

const SVG_WIDTH = 600
const SVG_HEIGHT_DEFAULT = 160
const PADDING_X = 24
const PADDING_Y = 22

export function SimpleLineChart({
  data,
  height = SVG_HEIGHT_DEFAULT,
  ariaLabel = "chart",
}: SimpleLineChartProps) {
  const { points, min, max } = useMemo(() => {
    const safeData = data ?? []
    const values = safeData.map((p) => p.value)
    const minValue = values.length > 0 ? Math.min(...values) : 0
    const maxValue = values.length > 0 ? Math.max(...values) : 0

    const range = Math.max(1e-6, maxValue - minValue)

    const usableW = SVG_WIDTH - PADDING_X * 2
    const usableH = height - PADDING_Y * 2

    const mapped = safeData.map((p, i) => {
      const t = safeData.length <= 1 ? 0 : i / (safeData.length - 1)
      const x = PADDING_X + t * usableW
      const normalized = (p.value - minValue) / range
      const y = PADDING_Y + (1 - normalized) * usableH
      return { x, y, label: p.label, value: p.value }
    })

    return { points: mapped, min: minValue, max: maxValue }
  }, [data, height])

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ")
  const hasData = points.length > 0

  const horizontalGrid = 4
  const gridLines = Array.from({ length: horizontalGrid + 1 }).map((_, i) => i)

  return (
    <div className="w-full">
      <div className="h-10 flex items-center justify-between px-1 text-xs text-muted">
        <span className="truncate">{data?.[0]?.label ?? ""}</span>
        <span className="truncate">{data?.[data.length - 1]?.label ?? ""}</span>
      </div>

      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${height}`}
        role="img"
        aria-label={ariaLabel}
        className="w-full h-[160px]"
        preserveAspectRatio="none"
      >
        {/* grid */}
        {gridLines.map((i) => {
          const t = i / horizontalGrid
          const y = PADDING_Y + t * (height - PADDING_Y * 2)
          return (
            <g key={i}>
              <line x1={PADDING_X} y1={y} x2={SVG_WIDTH - PADDING_X} y2={y} stroke="rgba(0,0,0,0.08)" />
            </g>
          )
        })}

        {/* line */}
        {hasData && (
          <>
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={polyline}
              className="text-accent"
            />
            {points.map((p, idx) => (
              <g key={`${p.x}-${idx}`}>
                <circle cx={p.x} cy={p.y} r="4" className="fill-accent text-accent" />
                <circle cx={p.x} cy={p.y} r="8" className="fill-accent/15" />
              </g>
            ))}
          </>
        )}

        {/* min/max labels */}
        <text x={PADDING_X} y={PADDING_Y - 6} fontSize="12" fill="currentColor" className="text-muted">
          {max}
        </text>
        <text
          x={PADDING_X}
          y={height - PADDING_Y + 14}
          fontSize="12"
          fill="currentColor"
          className="text-muted"
        >
          {min}
        </text>
      </svg>
    </div>
  )
}
