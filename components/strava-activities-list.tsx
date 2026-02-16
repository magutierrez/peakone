'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { MapPin, Calendar, Activity, Loader2, Route } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { stravaToGPXData, stravaRouteToGPXData } from '@/lib/gpx-parser'
import type { GPXData } from '@/lib/types'
import { useTranslations } from 'next-intl'

interface StravaActivitiesListProps {
  onLoadGPX: (data: GPXData, fileName: string) => void
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function StravaActivitiesList({ onLoadGPX }: StravaActivitiesListProps) {
  const t = useTranslations('SavedRoutes')
  const [type, setType] = useState<'activities' | 'routes'>('routes')
  
  const { data, error, isLoading } = useSWR(
    type === 'activities' ? '/api/strava/activities' : '/api/strava/routes', 
    fetcher
  )

  const handleSelect = (item: any) => {
    try {
      const gpxData = type === 'activities' ? stravaToGPXData(item) : stravaRouteToGPXData(item)
      onLoadGPX(gpxData, `${item.name}.gpx`)
    } catch (e) {
      console.error('Failed to load Strava data', e)
    }
  }

  const getActivityTypeLabel = (activityType: string) => {
    const types = t.raw('types')
    return types[activityType] || activityType
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {type === 'activities' ? (
            <Activity className="h-4 w-4 text-[#FC6719]" />
          ) : (
            <Route className="h-4 w-4 text-[#FC6719]" />
          )}
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {type === 'activities' ? t('stravaTitle') : t('stravaRoutes')}
          </h3>
        </div>
        
        <Select value={type} onValueChange={(v: any) => setType(v)}>
          <SelectTrigger className="h-7 w-[110px] text-[10px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="routes" className="text-[10px]">{t('routes')}</SelectItem>
            <SelectItem value="activities" className="text-[10px]">{t('activities')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : error || !Array.isArray(data) ? (
        <div className="p-4 text-center text-xs text-muted-foreground">
          {t('noData')}
        </div>
      ) : (
        <ScrollArea className="h-[500px] pr-4">
          <div className="flex flex-col gap-2">
            {data.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                className="group flex flex-col gap-2 rounded-lg border border-border bg-[#FC6719]/5 p-3 text-left transition-all hover:border-[#FC6719]/30 hover:bg-[#FC6719]/10"
              >
                <p className="line-clamp-1 text-sm font-semibold text-foreground">{item.name}</p>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {(item.distance / 1000).toFixed(1)} km
                  </span>
                  {item.start_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(item.start_date).toLocaleDateString()}
                    </span>
                  )}
                  {type === 'activities' && item.type && (
                    <span className="capitalize">{getActivityTypeLabel(item.type)}</span>
                  )}
                  {type === 'routes' && (item.type !== undefined || item.route_type !== undefined) && (
                    <span className="capitalize">
                      {(item.type === 1 || item.route_type === 1) ? t('ride') : 
                       (item.type === 2 || item.route_type === 2) ? t('run') : t('walk')}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}