import { Mountain, Wind } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function Header() {
  const t = useTranslations('HomePage')

  return (
    <header className="border-b border-border bg-card">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Mountain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">
              {t('header.title')}
            </h1>
            <p className="text-xs text-muted-foreground">{t('header.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Wind className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{t('header.apiVersion')}</span>
        </div>
      </div>
    </header>
  )
}
