'use client'

import useSWR from 'swr'
import { MapPin, Calendar, Activity, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { stravaToGPXData } from '@/lib/gpx-parser'
import type { GPXData } from '@/lib/types'

interface StravaActivitiesListProps {
  onLoadGPX: (data: GPXData, fileName: string) => void
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function StravaActivitiesList({ onLoadGPX }: StravaActivitiesListProps) {
  const { data: activities, error, isLoading } = useSWR('/api/strava/activities', fetcher)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !Array.isArray(activities)) return null

  const handleSelectActivity = (activity: any) => {
    try {
      const gpxData = stravaToGPXData(activity)
      onLoadGPX(gpxData, `${activity.name}.gpx`)
    } catch (e) {
      console.error("Failed to load Strava activity", e)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 px-1">
        <Activity className="h-4 w-4 text-[#FC6719]" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mis Actividades de Strava</h3>
      </div>
      
      <ScrollArea className="h-[500px] pr-4">
        <div className="flex flex-col gap-2">
          {activities.map((activity) => (
            <button 
              key={activity.id}
              onClick={() => handleSelectActivity(activity)}
              className="group flex flex-col gap-2 rounded-lg border border-border bg-[#FC6719]/5 p-3 text-left transition-all hover:border-[#FC6719]/30 hover:bg-[#FC6719]/10"
            >
              <p className="text-sm font-semibold text-foreground line-clamp-1">{activity.name}</p>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {(activity.distance / 1000).toFixed(1)} km
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(activity.start_date).toLocaleDateString()}
                </span>
                <span className="capitalize">{activity.type}</span>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
