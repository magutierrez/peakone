'use client'

import { TrendingUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRef } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { RouteWeatherPoint } from '@/lib/types'

interface ElevationProfileProps {
  weatherPoints: RouteWeatherPoint[]
  selectedIndex: number | null
  onSelect: (index: number) => void
}

export function ElevationProfile({ weatherPoints, selectedIndex, onSelect }: ElevationProfileProps) {
  const t = useTranslations('WeatherTimeline')
  const lastUpdateRef = useRef<number>(0)

  // Preparar datos y calcular pendiente (%)
  const chartData = weatherPoints.map((wp, idx) => {
    let slope = 0
    if (idx > 0) {
      const prev = weatherPoints[idx - 1]
      const distDiff = (wp.point.distanceFromStart - prev.point.distanceFromStart) * 1000 // m
      const eleDiff = (wp.point.ele || 0) - (prev.point.ele || 0) // m
      if (distDiff > 0) {
        slope = (eleDiff / distDiff) * 100
      }
    }

    return {
      idx,
      distance: wp.point.distanceFromStart,
      elevation: Math.round(wp.point.ele || 0),
      slope: Math.round(slope * 10) / 10, // 1 decimal
    }
  })

  const handleMouseMove = (e: any) => {
    if (e.activePayload && e.activePayload[0]) {
      const now = Date.now()
      if (now - lastUpdateRef.current > 32) {
        onSelect(e.activePayload[0].payload.idx)
        lastUpdateRef.current = now
      }
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">{t('elevationTitle')}</h3>
        </div>
        {selectedIndex !== null && chartData[selectedIndex] && (
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Pendiente: 
              <span className={`ml-1 font-bold ${chartData[selectedIndex].slope > 0 ? 'text-destructive' : 'text-primary'}`}>
                {chartData[selectedIndex].slope}%
              </span>
            </span>
          </div>
        )}
      </div>
      
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} onMouseMove={handleMouseMove}>
            <defs>
              <linearGradient id="colorEle" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="distance"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickFormatter={(val) => `${val.toFixed(0)} km`}
              minTickGap={30}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickFormatter={(val) => `${val}m`}
              domain={['dataMin - 50', 'dataMax + 50']}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="rounded-lg border border-border bg-background p-2 shadow-md space-y-1">
                      <p className="text-[10px] font-bold text-foreground">km {data.distance.toFixed(1)}</p>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-primary">{data.elevation}m</span>
                        <span className={`text-[10px] font-bold ${data.slope > 0 ? 'text-destructive' : 'text-primary'}`}>
                          {data.slope}% incl.
                        </span>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Area
              type="monotone"
              dataKey="elevation"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorEle)"
              isAnimationActive={false}
            />
            {selectedIndex !== null && (
              <ReferenceLine
                x={chartData[selectedIndex].distance}
                stroke="hsl(var(--foreground))"
                strokeDasharray="3 3"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}