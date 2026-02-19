'use client';

import { RefreshCcw, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

interface MapOverlayControlsProps {
  isPlayerActive: boolean;
  pointsCount: number;
  selectedRange: any;
  onStartPlayer: () => void;
  onClearSelection: (() => void) | undefined;
}

export function MapOverlayControls({
  isPlayerActive,
  pointsCount,
  selectedRange,
  onStartPlayer,
  onClearSelection,
}: MapOverlayControlsProps) {
  const t = useTranslations('RouteMap');

  if (isPlayerActive) return null;

  return (
    <>
      {pointsCount > 0 && (
        <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
          <Button
            variant="secondary"
            size="sm"
            className="bg-card/90 hover:bg-card hover:text-primary border-primary/20 h-9 gap-2 rounded-full border px-4 text-[11px] font-bold uppercase shadow-lg backdrop-blur-sm transition-all"
            onClick={onStartPlayer}
          >
            <Box className="h-4 w-4" />
            {t('player.title')}
          </Button>
        </div>
      )}

      {selectedRange && onClearSelection && (
        <div className="animate-in fade-in slide-in-from-left-2 absolute top-3 left-3 z-10">
          <Button
            variant="secondary"
            size="sm"
            className="bg-card/90 hover:bg-card h-8 gap-2 shadow-md backdrop-blur-sm"
            onClick={onClearSelection}
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold tracking-wider uppercase">{t('resetView')}</span>
          </Button>
        </div>
      )}
    </>
  );
}
