'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

export function StravaConnector() {
  const t = useTranslations('Auth');

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border bg-muted/50 p-4 text-center">
      <h3 className="text-sm font-semibold text-foreground">{t('connectStrava')}</h3>
      <p className="text-xs text-muted-foreground">{t('stravaDescription')}</p>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => signIn('strava', { redirectTo: '/setup' })}
        className="flex items-center gap-2"
      >
        {t('connectStravaButton')}
      </Button>
    </div>
  );
}
