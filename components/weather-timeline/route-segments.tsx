'use client'

import { Map as MapIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { RouteWeatherPoint } from '@/lib/types'

interface RouteSegmentsProps {
  weatherPoints: RouteWeatherPoint[]
  activeFilter?: { key: 'pathType' | 'surface', value: string } | null
  onFilterChange?: (filter: { key: 'pathType' | 'surface', value: string } | null) => void
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
  trunk: '#b91c1c',
  secondary: '#f59e0b',
  secondary_link: '#f59e0b',
  tertiary: '#fbbf24',
  tertiary_link: '#fbbf24',
  service: '#d1d5db',
  unclassified: '#9ca3af',
  raceway: '#1e1b4b',
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

export function RouteSegments({ weatherPoints, activeFilter, onFilterChange }: RouteSegmentsProps) {
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
    if (activeFilter?.key === key && activeFilter.value === value) {
      onFilterChange?.(null)
    } else {
      onFilterChange?.({ key, value })
    }
  }

  const pathBreakdown = getBreakdown('pathType', PATH_TYPE_COLORS)
  const surfaceBreakdown = getBreakdown('surface', SURFACE_COLORS)

  const SegmentBar = ({ title, data, translationNamespace, typeKey }: { title: string, data: any[], translationNamespace: string, typeKey: 'pathType' | 'surface' }) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
      </div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-secondary ring-1 ring-border">
        {data.map((item, idx) => {
          const isActive = activeFilter?.key === typeKey && activeFilter.value === item.name
          const isFilteringOther = activeFilter && (activeFilter.key !== typeKey || activeFilter.value !== item.name)
          
          return (
            <button
              key={idx}
              onClick={() => handleSegmentClick(typeKey, item.name)}
              style={{ 
                width: `${item.percent}%`, 
                backgroundColor: item.color,
                opacity: isFilteringOther ? 0.3 : 1
              }}
              className={`h-full transition-all hover:brightness-110 ${isActive ? 'ring-2 ring-inset ring-white' : ''}`}
              title={`${item.name}: ${item.percent.toFixed(0)}%`}
            />
          )
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {data.map((item, idx) => {
          const isActive = activeFilter?.key === typeKey && activeFilter.value === item.name
          return (
            <button 
              key={idx} 
              onClick={() => handleSegmentClick(typeKey, item.name)}
              className={`flex items-center gap-1.5 transition-all rounded px-1.5 py-0.5 border ${
                isActive 
                  ? 'bg-primary/10 border-primary text-primary' 
                  : 'bg-secondary/50 border-transparent hover:border-border text-foreground'
              }`}
            >
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[10px] font-medium">
                {t(`${translationNamespace}.${item.name}` as any)}
              </span>
              <span className="text-[10px] text-muted-foreground">{item.percent.toFixed(0)}%</span>
            </button>
          )
        })}
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