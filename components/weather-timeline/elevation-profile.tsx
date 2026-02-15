'use client'

import { TrendingUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import type { RouteWeatherPoint } from '@/lib/types'

interface ElevationProfileProps {
  weatherPoints: RouteWeatherPoint[]
  selectedIndex: number | null
  onSelect: (index: number) => void
}

export function ElevationProfile({ weatherPoints, selectedIndex, onSelect }: ElevationProfileProps) {
  const t = useTranslations('WeatherTimeline')

  const chartData = weatherPoints.map((wp, idx) => ({
    idx,
    distance: wp.point.distanceFromStart,
    elevation: wp.point.ele || 0,
  }))

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">{t('elevationTitle')}</h3>
      </div>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={chartData} 
            onMouseMove={(e) => {
              if (e.activePayload && e.activePayload[0]) {
                onSelect(e.activePayload[0].payload.idx)
              }
            }}
          >
            <defs>
              <linearGradient id="colorEle" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
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
                            tickFormatter={(val) => `${Math.round(val)}m`}
                          />
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload
                                return (
                                  <div className="rounded-lg border border-border bg-background p-2 shadow-md">
                                    <p className="text-[10px] font-bold text-foreground">km {data.distance.toFixed(1)}</p>
                                    <p className="text-xs font-bold text-primary">{Math.round(data.elevation)} {t('chart.m')}</p>
                                  </div>
                                )
                              }
                              return null
                            }}
                          />            <Area 
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
                x={weatherPoints[selectedIndex].point.distanceFromStart} 
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
