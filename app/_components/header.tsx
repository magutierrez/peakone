'use client';

import { Mountain, Moon, Sun, Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Session } from 'next-auth';
import { UserMenu } from './user-menu';
import { LocaleSwitcher } from './locale-switcher';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/ui/sheet';

interface HeaderProps {
  session: Session | null;
  mobileMenuContent?: React.ReactNode;
}

export function Header({ session, mobileMenuContent }: HeaderProps) {
  const t = useTranslations('HomePage');
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          {mobileMenuContent && (
            <div className="lg:hidden">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-80" onClick={() => setOpen(false)}>
                  <SheetHeader className="sr-only">
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  {mobileMenuContent}
                </SheetContent>
              </Sheet>
            </div>
          )}
          
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Mountain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-foreground">{t('header.title')}</h1>
              <p className="hidden sm:block text-[10px] text-muted-foreground">{t('header.subtitle')}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 pl-4">
            <LocaleSwitcher />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              title="Cambiar tema"
            >
              {mounted ? (
                resolvedTheme === 'dark' ? (
                  <Sun className="h-5 w-5 text-orange-400" />
                ) : (
                  <Moon className="h-5 w-5 text-slate-700" />
                )
              ) : (
                <div className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>

            {session?.user && <UserMenu user={session.user} />}
          </div>
        </div>
      </div>
    </header>
  );
}
