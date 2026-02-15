import { Mountain } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function EmptyState() {
  const t = useTranslations('HomePage')

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
        <Mountain className="h-8 w-8 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{t('placeholders.title')}</p>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground leading-relaxed">
          {t('placeholders.description')}
        </p>
      </div>
    </div>
  )
}