'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface RouteLoadingOverlayProps {
  isVisible: boolean;
}

export function RouteLoadingOverlay({ isVisible }: RouteLoadingOverlayProps) {
  const th = useTranslations('HomePage');

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 shadow-2xl">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <div className="text-center">
          <p className="font-bold text-foreground">{th('processingRoute')}</p>
          <p className="mt-1 text-xs text-muted-foreground">{th('obtainingData')}</p>
        </div>
      </div>
    </div>
  );
}
