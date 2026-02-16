'use client';

import { useTranslations } from 'next-intl';

export function MapLegend() {
  const t = useTranslations('RouteMap');

  return (
    <div className="absolute bottom-6 left-3 z-10 rounded-lg border border-border bg-card/95 p-3 shadow-xl backdrop-blur-sm">
      <p className="mb-2 text-xs font-semibold text-foreground">{t('legend.title')}</p>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#22c55e' }} />
          <span className="text-xs text-muted-foreground">{t('legend.tailwind')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#ef4444' }} />
          <span className="text-xs text-muted-foreground">{t('legend.headwind')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
          <span className="text-xs text-muted-foreground">{t('legend.crosswind')}</span>
        </div>
      </div>
    </div>
  );
}
