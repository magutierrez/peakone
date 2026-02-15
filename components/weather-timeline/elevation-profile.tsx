'use client'

import { TrendingUp, RefreshCcw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMemo, useRef, useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts'
import type { RouteWeatherPoint } from '@/lib/types'
import { Button } from '@/components/ui/button'

interface ElevationProfileProps {
  weatherPoints: RouteWeatherPoint[]
  selectedIndex: number | null
  onSelect: (index: number) => void
}

export function ElevationProfile({ weatherPoints, selectedIndex, onSelect }: ElevationProfileProps) {
  const t = useTranslations('WeatherTimeline')
  const lastUpdateRef = useRef<number>(0)
  
  // Estados para el zoom interactivo
  const [refAreaLeft, setRefAreaLeft] = useState<any>(null)
  const [refAreaRight, setRefAreaRight] = useState<any>(null)
  const [left, setLeft] = useState<any>('dataMin')
  const [right, setRight] = useState<any>('dataMax')
  const [top, setTop] = useState<any>('dataMax')
  const [bottom, setBottom] = useState<any>('dataMin')

  // Calcular datos y estadísticas de pendiente
  const { chartData, maxSlope } = useMemo(() => {
    let currentMaxSlope = 0
    const data = weatherPoints.map((wp, idx) => {
      let slope = 0
      if (idx > 0) {
        const prev = weatherPoints[idx - 1]
        const distDiff = (wp.point.distanceFromStart - prev.point.distanceFromStart) * 1000 // m
        const eleDiff = (wp.point.ele || 0) - (prev.point.ele || 0) // m
        if (distDiff > 0) {
          slope = (eleDiff / distDiff) * 100
        }
      }
      const absSlope = Math.abs(slope)
      if (absSlope > currentMaxSlope) currentMaxSlope = absSlope

      return {
        idx,
        distance: wp.point.distanceFromStart,
        elevation: Math.round(wp.point.ele || 0),
        slope: Math.round(slope * 10) / 10,
      }
    })
    return { chartData: data, maxSlope: currentMaxSlope }
  }, [weatherPoints])

  const getSlopeColor = (slope: number) => {
    const absSlope = Math.abs(slope)
    if (maxSlope === 0) return 'bg-primary'
    const intensity = absSlope / maxSlope
    
    if (intensity < 0.33) return 'bg-primary'
    if (intensity < 0.66) return 'bg-accent'
    return 'bg-destructive'
  }

  const handleMouseMove = (e: any) => {
    if (e && e.activePayload && e.activePayload[0]) {
      const now = Date.now()
      if (now - lastUpdateRef.current > 32) {
        onSelect(e.activePayload[0].payload.idx)
        lastUpdateRef.current = now
      }
    }
    if (refAreaLeft !== null && e) {
      setRefAreaRight(e.activeLabel)
    }
  }

  const zoom = () => {
    if (refAreaLeft === refAreaRight || refAreaRight === null || refAreaLeft === null) {
      setRefAreaLeft(null)
      setRefAreaRight(null)
      return
    }

    let [start, end] = [refAreaLeft, refAreaRight]
    if (start > end) [start, end] = [end, start]

    // Filtrar datos en el rango para ajustar el eje Y
    const filteredData = chartData.filter(d => d.distance >= start && d.distance <= end)
    
    if (filteredData.length > 0) {
      const elevations = filteredData.map(d => d.elevation)
      const minEle = Math.min(...elevations)
      const maxEle = Math.max(...elevations)

      setLeft(start)
      setRight(end)
      setBottom(minEle - 10)
      setTop(maxEle + 10)
    }

    setRefAreaLeft(null)
    setRefAreaRight(null)
  }

  const resetZoom = () => {
    setLeft('dataMin')
    setRight('dataMax')
    setTop('dataMax')
    setBottom('dataMin')
    setRefAreaLeft(null)
    setRefAreaRight(null)
  }

  const selectedData = selectedIndex !== null ? chartData[selectedIndex] : null

  return (
    <div className="rounded-xl border border-border bg-card p-4 select-none">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">{t('elevationTitle')}</h3>
          {(left !== 'dataMin' || right !== 'dataMax') && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resetZoom}
              className="h-6 gap-1 px-2 text-[10px] text-muted-foreground hover:text-foreground bg-secondary/50"
            >
              <RefreshCcw className="h-3 w-3" />
              {t('chart.resetZoom')}
            </Button>
          )}
        </div>
        {selectedData && (
          <div className="flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full animate-pulse ${getSlopeColor(selectedData.slope)}`} />
            <span className="text-xs font-bold font-mono text-foreground">
              {selectedData.slope}%
            </span>
          </div>
        )}
      </div>
      
      <div className="h-48 w-full cursor-crosshair">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={chartData} 
            onMouseDown={(e) => e && setRefAreaLeft(e.activeLabel)}
            onMouseMove={handleMouseMove}
            onMouseUp={zoom}
            onDoubleClick={resetZoom}
          >
            <defs>
              <linearGradient id="colorEle" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="distance"
              type="number"
              domain={[left, right]}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickFormatter={(val) => `${val.toFixed(1)} km`}
              minTickGap={30}
              allowDataOverflow
            />
            <YAxis
              type="number"
              domain={[bottom, top]}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickFormatter={(val) => `${Math.round(val)}m`}
              allowDataOverflow
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="rounded-lg border border-border bg-background p-2 shadow-md flex items-center gap-3">
                      <div className="flex flex-col">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">km {data.distance.toFixed(1)}</p>
                        <span className="text-sm font-bold text-foreground">{data.elevation}m</span>
                      </div>
                      <div className="flex items-center gap-1.5 border-l border-border pl-3">
                        <div className={`h-2 w-2 rounded-full ${getSlopeColor(data.slope)}`} />
                        <span className="text-xs font-bold font-mono text-foreground">{data.slope}%</span>
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
            
            {/* Indicador de posición actual */}
            {selectedIndex !== null && chartData[selectedIndex] && (
              <ReferenceLine
                x={chartData[selectedIndex].distance}
                stroke="hsl(var(--foreground))"
                strokeDasharray="3 3"
              />
            )}

            {/* Área de selección visual */}
            {refAreaLeft !== null && refAreaRight !== null && (
              <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} fill="hsl(var(--primary))" fillOpacity={0.1} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[9px] text-muted-foreground text-center italic">
        Arrastra para hacer zoom • Doble clic para restablecer
      </p>
    </div>
  )
}
