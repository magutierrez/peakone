'use client';

import { Popup } from 'react-map-gl/maplibre';
import { useTranslations } from 'next-intl';
import type { RouteWeatherPoint } from '@/lib/types';
import { ExternalLink, X, Map as MapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { createPortal } from 'react-dom';

interface MapPopupProps {
  popupInfo: RouteWeatherPoint & { index: number; point: any };
  onClose: () => void;
}

export function MapPopup({ popupInfo, onClose }: MapPopupProps) {
  const tTimeline = useTranslations('WeatherTimeline');
  const [showStreetView, setShowStreetView] = useState(false);

  const streetViewUrl = `https://www.google.com/maps/embed?pb=!4v1700000000000!6m8!1m7!1sCAoSLEFGMVFpcE...!2m2!1d${popupInfo.point.lat}!2d${popupInfo.point.lon}!3f0!4f0!5f0.7820865974627469`;

  if (showStreetView) {
    return createPortal(
      <div className="bg-background fixed inset-0 z-[100] flex flex-col">
        <div className="border-border bg-card flex items-center justify-between border-b px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 font-medium"
              onClick={() => setShowStreetView(false)}
            >
              <MapIcon className="h-4 w-4" />
              Volver al Mapa
            </Button>
            <div className="bg-border h-6 w-px" />
            <div className="flex items-center gap-4 text-sm">
              <span className="font-mono font-bold">km {popupInfo.point.distanceFromStart.toFixed(1)}</span>
              <span className="text-muted-foreground">•</span>
              <span className="font-mono font-bold">{Math.round(popupInfo.point.ele || 0)}m</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-muted h-8 w-8 rounded-full"
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
            src={`https://www.google.com/maps?layer=c&cbll=${popupInfo.point.lat},${popupInfo.point.lon}&cbp=12,0,0,0,0&output=svembed`}
            className="h-full w-full border-0"
            allowFullScreen
            loading="lazy"
            title="Street View"
          />
        </div>
      </div>,
      document.body
    );
  }

  return (
    <Popup
      longitude={popupInfo.point.lon}
      latitude={popupInfo.point.lat}
      anchor="bottom"
      onClose={onClose}
      closeButton={true}
      maxWidth="200px"
      className="weather-popup"
      offset={15}
    >
      <div className="text-foreground p-2 text-xs leading-relaxed">
        <div className="border-border mb-3 flex items-center justify-between border-b pb-2">
          <span className="text-muted-foreground font-mono text-[10px] font-bold uppercase tracking-wider">
            km {popupInfo.point.distanceFromStart.toFixed(1)}
          </span>
          <span className="font-mono font-bold text-sm">{Math.round(popupInfo.point.ele || 0)}m</span>
        </div>

        <Button
          variant="secondary"
          size="sm"
          className="hover:bg-primary hover:text-primary-foreground h-8 w-full gap-2 text-[10px] font-bold uppercase transition-colors"
          onClick={() => setShowStreetView(true)}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Street View
        </Button>
      </div>
    </Popup>
  );
}
