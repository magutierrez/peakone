'use client';

import { useTransition } from 'react';
import { Languages } from 'lucide-react';
import { useLocale } from 'next-intl';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { setUserLocale } from '@/lib/i18n';

export function LocaleSwitcher() {
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();

  function onSelectChange(value: string) {
    startTransition(() => {
      setUserLocale(value);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9" disabled={isPending}>
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onSelectChange('es')} className={locale === 'es' ? 'bg-accent' : ''}>
          Español
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelectChange('en')} className={locale === 'en' ? 'bg-accent' : ''}>
          English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
