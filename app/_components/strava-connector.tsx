'use client'

import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

export function StravaConnector() {
  const t = useTranslations('Auth')

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#FC6719]/20 bg-[#FC6719]/5 p-4">
      <div className="flex flex-col gap-1">
        <h4 className="text-sm font-bold text-foreground">{t('connectStrava')}</h4>
        <p className="text-[10px] text-muted-foreground">{t('stravaDescription')}</p>
      </div>
      <Button 
        onClick={() => signIn('strava')}
        className="w-full bg-[#FC6719] text-white hover:bg-[#FC6719]/90 h-8 text-xs font-semibold"
      >
        {t('continueStrava')}
      </Button>
    </div>
  )
}
