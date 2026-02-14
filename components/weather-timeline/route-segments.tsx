'use client'

import { Map as MapIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { RouteWeatherPoint } from '@/lib/types'

interface RouteSegmentsProps {
  weatherPoints: RouteWeatherPoint[]
  onSelectPoint: (index: number) => void
}

const PATH_TYPE_COLORS: Record<string, string> = {
  cycleway: '#3ecf8e',
  path: '#10b981',
  footway: '#059669',
  pedestrian: '#059669',
  track: '#8b5cf6',
  residential: '#6b7280',
  living_street: '#9ca3af',
  primary: '#ef4444',
  primary_link: '#ef4444',
  secondary: '#f59e0b',
  secondary_link: '#f59e0b',
  tertiary: '#fbbf24',
  tertiary_link: '#fbbf24',
  service: '#d1d5db',
  unclassified: '#9ca3af',
  unknown: '#e5e7eb',
}

const SURFACE_COLORS: Record<string, string> = {
  asphalt: '#4b5563',
  paved: '#6b7280',
  paving_stones: '#9ca3af',
  concrete: '#d1d5db',
  gravel: '#d97706',
  fine_gravel: '#f59e0b',
  unpaved: '#b45309',
  ground: '#78350f',
  compacted: '#92400e',
  dirt: '#a16207',
  sand: '#fcd34d',
  grass: '#10b981',
  unknown: '#e5e7eb',
}

export function RouteSegments({ weatherPoints, onSelectPoint }: RouteSegmentsProps) {
  const t = useTranslations('WeatherTimeline')

  const totalPoints = weatherPoints.length
  
  const getBreakdown = (key: 'pathType' | 'surface', colorMap: Record<string, string>) => {
    const counts: Record<string, number> = {}
    weatherPoints.forEach(wp => {
      const val = wp[key] || 'unknown'
      counts[val] = (counts[val] || 0) + 1
    })

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        percent: (count / totalPoints) * 100,
        color: colorMap[name] || colorMap.unknown
      }))
      .filter(item => item.percent > 0)
      .sort((a, b) => b.percent - a.percent)
  }

  const handleSegmentClick = (key: 'pathType' | 'surface', value: string) => {
    const firstIndex = weatherPoints.findIndex(wp => (wp[key] || 'unknown') === value)
    if (firstIndex !== -1) {
      onSelectPoint(firstIndex)
    }
  }

  const pathBreakdown = getBreakdown('pathType', PATH_TYPE_COLORS)
  const surfaceBreakdown = getBreakdown('surface', SURFACE_COLORS)

  const SegmentBar = ({ title, data, translationNamespace, typeKey }: { title: string, data: any[], translationNamespace: string, typeKey: 'pathType' | 'surface' }) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
      </div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-secondary">
        {data.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleSegmentClick(typeKey, item.name)}
            style={{ width: `${item.percent}%`, backgroundColor: item.color }}
            className="h-full transition-all hover:brightness-110 hover:scale-y-125"
            title={`${item.name}: ${item.percent.toFixed(0)}%`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {data.map((item, idx) => (
          <button 
            key={idx} 
            onClick={() => handleSegmentClick(typeKey, item.name)}
            className="flex items-center gap-1.5 transition-all hover:bg-secondary rounded px-1 -ml-1 py-0.5"
          >
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-[10px] text-foreground">
              {t(`${translationNamespace}.${item.name}` as any)}
            </span>
            <span className="text-[10px] text-muted-foreground">{item.percent.toFixed(0)}%</span>
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-4 flex items-center gap-2">
        <MapIcon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">{t('segmentsTitle')}</h3>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <SegmentBar 
          title={t('pathTypes.title')} 
          data={pathBreakdown} 
          translationNamespace="pathTypes"
          typeKey="pathType"
        />
        <SegmentBar 
          title={t('surfaces.title')} 
          data={surfaceBreakdown} 
          translationNamespace="surfaces"
          typeKey="surface"
        />
      </div>
    </div>
  )
}