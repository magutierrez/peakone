'use client';

import { useTranslations } from 'next-intl';
import { useSettings, UnitSystem, WindUnit } from '@/hooks/use-settings';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const t = useTranslations('Auth');
  const { unitSystem, windUnit, setUnitSystem, setWindUnit } = useSettings();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('settingsTitle')}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="system">{t('system')}</Label>
            <Select
              value={unitSystem}
              onValueChange={(value) => setUnitSystem(value as UnitSystem)}
            >
              <SelectTrigger id="system">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="metric">{t('metric')}</SelectItem>
                <SelectItem value="us">{t('us')}</SelectItem>
                <SelectItem value="uk">{t('uk')}</SelectItem>
                <SelectItem value="imperial">{t('imperial')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="wind">{t('windUnit')}</Label>
            <Select
              value={windUnit}
              onValueChange={(value) => setWindUnit(value as WindUnit)}
            >
              <SelectTrigger id="wind">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kmh">km/h</SelectItem>
                <SelectItem value="mph">mph</SelectItem>
                <SelectItem value="knots">knots</SelectItem>
                <SelectItem value="ms">m/s</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>{t('save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
