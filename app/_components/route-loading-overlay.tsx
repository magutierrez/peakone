'use client';

import { useTranslations } from 'next-intl';

interface RouteLoadingOverlayProps {
  isVisible: boolean;
}

export function RouteLoadingOverlay({ isVisible }: RouteLoadingOverlayProps) {
  const t = useTranslations('HomePage');

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-center text-sm text-muted-foreground">{t('obtainingData')}</p>
    </div>
  );
}
