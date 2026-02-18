import { Mountain } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function EmptyState() {
  const t = useTranslations('HomePage');

  return (
    <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 p-6 text-center text-muted-foreground">
      <Mountain className="mb-4 h-12 w-12 text-muted-foreground" />
      <h2 className="mb-2 text-xl font-semibold">{t('placeholders.title')}</h2>
      <p className="max-w-md text-sm">{t('placeholders.description')}</p>
    </div>
  );
}