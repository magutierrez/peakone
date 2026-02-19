'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

export function StravaConnector() {
  const t = useTranslations('Auth');

  return (
    <div className="border-border bg-muted/50 flex flex-col gap-3 rounded-xl border border-dashed p-4 text-center">
      <h3 className="text-foreground text-sm font-semibold">{t('connectStrava')}</h3>
      <p className="text-muted-foreground text-xs">{t('stravaDescription')}</p>
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
