'use client';

import { Session } from 'next-auth';
import { signOut } from 'next-auth/react';
import { Mountain, Settings, LogOut, Menu, Sun, Moon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';
import { SettingsModal } from './settings-modal';
import { LocaleSwitcher } from './locale-switcher';
import Link from 'next/link';

interface HeaderProps {
  session: Session | null;
  mobileMenuContent?: React.ReactNode;
}

export function Header({ session, mobileMenuContent }: HeaderProps) {
  const t = useTranslations('Auth');
  const isMobile = useIsMobile();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const userInitial = session?.user?.name
    ? session.user.name.charAt(0).toUpperCase()
    : (session?.user?.email || session?.user?.id || 'U').charAt(0).toUpperCase();

  return (
    <header className="border-border bg-background sticky top-0 z-40 flex h-14 items-center justify-between border-b px-4 lg:px-6">
      <Link href="/setup" className="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
          <defs>
            <linearGradient id="zustrack-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#3B82F6" />{' '}
              <stop offset="100%" stop-color="#1D4ED8" />{' '}
            </linearGradient>
          </defs>

          <path d="M15 25 h 45 l -15 20 h -30 z" fill="url(#zustrack-grad)" />

          <path d="M40 40 h 30 l -45 60 h -10 l 15 -20 h -20 z" fill="url(#zustrack-grad)" />

          <path d="M85 40 l -15 20 h -30 l 15 -20 z" fill="#2563EB" />
        </svg>
        <span className="font-heading text-lg font-bold">zusTrack</span>
      </Link>

      <div className="flex items-center gap-2">
        <LocaleSwitcher />

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span className="sr-only">Toggle theme</span>
        </Button>

        {isMobile && mobileMenuContent && (
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
              {mobileMenuContent}
            </SheetContent>
          </Sheet>
        )}

        {session?.user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={session.user.image || undefined}
                    alt={session.user.name || 'User'}
                  />
                  <AvatarFallback>{userInitial}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
                <Settings className="mr-2 h-4 w-4" />
                <span>{t('settings')}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t('logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild>
            <Link href="/login">{t('loginDescription')}</Link>
          </Button>
        )}
      </div>

      <SettingsModal isOpen={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </header>
  );
}
