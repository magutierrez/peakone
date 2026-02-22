'use client';

import { Popup } from 'react-map-gl/maplibre';
import { useTranslations } from 'next-intl';
import type { RouteWeatherPoint } from '@/lib/types';
import { ArrowUp, Map as MapIcon, MapPinned, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface MapPopupProps {
  popupInfo: RouteWeatherPoint & { index: number; point: any; bearing?: number };
  onClose: () => void;
}

export function MapPopup({ popupInfo, onClose }: MapPopupProps) {
  const [showStreetView, setShowStreetView] = useState(false);
  const t = useTranslations('RouteMap');

  if (showStreetView) {
    return (
      <div className="bg-background animate-in fade-in absolute inset-0 z-[100] flex flex-col duration-200">
        <div className="border-border bg-card flex items-center justify-between border-b px-4 py-3 shadow-sm">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 font-bold tracking-wider uppercase"
              onClick={() => setShowStreetView(false)}
            >
              <MapIcon className="h-4 w-4" />
              {t('backToMap')}
            </Button>
            <div className="bg-border h-6 w-px" />
            <div className="text-muted-foreground flex items-center gap-4 text-xs font-medium tracking-wider uppercase">
              <span className="flex items-center gap-1">
                <span className="text-foreground font-bold">
                  {popupInfo.point.distanceFromStart.toFixed(1)}
                </span>{' '}
                km
              </span>
              <span className="flex items-center gap-1">
                <span className="text-foreground font-bold">
                  {Math.round(popupInfo.point.ele || 0)}
                </span>{' '}
                m
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-destructive/10 hover:text-destructive h-9 w-9 rounded-full transition-colors"
            onClick={() => {
              setShowStreetView(false);
              onClose();
            }}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="bg-muted relative flex-1">
          <iframe
            src={`https://www.google.com/maps?layer=c&cbll=${popupInfo.point.lat},${popupInfo.point.lon}&cbp=12,${popupInfo.bearing || 0},0,0,0&output=svembed`}
            className="h-full w-full border-0"
            allowFullScreen
            loading="lazy"
            title="Street View"
          />
        </div>
      </div>
    );
  }

  return (
    <Popup
      longitude={popupInfo.point.lon}
      latitude={popupInfo.point.lat}
      anchor="bottom"
      onClose={onClose}
      closeButton={false} // We'll implement our own custom close button for better styling
      maxWidth="220px"
      className="weather-popup"
      offset={15}
    >
      <div className="group relative">
        <Button
          variant="ghost"
          size="icon"
          className="bg-background border-border hover:bg-destructive hover:text-destructive-foreground hover:border-destructive absolute -top-3 -right-3 z-10 h-6 w-6 rounded-full border shadow-sm transition-all"
          onClick={onClose}
        >
          <X className="h-3 w-3" />
        </Button>

        <div className="text-foreground p-2 text-xs leading-relaxed">
          <div className="border-border mb-3 flex items-center justify-between border-b pb-2">
            <span className="text-muted-foreground font-mono text-[10px] font-bold tracking-wider uppercase">
              km {popupInfo.point.distanceFromStart.toFixed(1)}
            </span>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2">
            <div className="bg-secondary/50 rounded p-2 text-center">
              <span className="text-muted-foreground block text-[9px] font-bold uppercase">
                {t('elevation')}
              </span>
              <span className="font-mono text-sm font-bold">
                {Math.round(popupInfo.point.ele || 0)}
                <span className="text-muted-foreground ml-0.5 text-[10px] font-normal">m</span>
              </span>
            </div>
            <div className="bg-secondary/50 rounded p-2 text-center">
              <span className="text-muted-foreground block text-[9px] font-bold uppercase">
                {t('slope')}
              </span>
              <div className="flex items-center justify-center gap-1">
                <ArrowUp
                  className="text-muted-foreground h-3 w-3"
                  style={{
                    transform: `rotate(${Math.min(90, Math.max(-90, (popupInfo.point.slope || 0) * 4))}deg)`,
                  }}
                />
                <span className="font-mono text-sm font-bold">
                  {Math.abs(Math.round(popupInfo.point.slope || 0))}
                  <span className="text-muted-foreground ml-0.5 text-[10px] font-normal">%</span>
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="default"
            size="sm"
            className="h-8 w-full gap-2 text-[10px] font-bold uppercase shadow-sm transition-all active:scale-[0.98]"
            onClick={() => setShowStreetView(true)}
          >
            <MapPinned className="h-3.5 w-3.5" />
            {t('streetView')}
          </Button>
        </div>
      </div>
    </Popup>
  );
}
