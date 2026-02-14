'use client'

import { Mountain, Wind, Moon, Sun } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export function Header() {
  const t = useTranslations('HomePage')
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

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
        
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 md:flex">
            <Wind className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{t('header.apiVersion')}</span>
          </div>
          
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
        </div>
      </div>
    </header>
  )
}
