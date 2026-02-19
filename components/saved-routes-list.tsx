'use client';

import { useSavedRoutes, SavedRoute } from '@/hooks/use-saved-routes';
import {
  MapPin,
  Trash2,
  Calendar,
  Route,
  Pencil,
  Check,
  X,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { useTranslations } from 'next-intl';

interface SavedRoutesListProps {
  onLoadRoute: (content: string, fileName: string) => void;
}

export function SavedRoutesList({ onLoadRoute }: SavedRoutesListProps) {
  const t = useTranslations('SavedRoutes');
  const { routes, isLoading, deleteRoute, updateRouteName } = useSavedRoutes();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const stripExtension = (name: string) => name.replace(/\.gpx$/i, '');

  const handleStartEdit = (e: React.MouseEvent, route: SavedRoute) => {
    e.stopPropagation();
    setEditingId(route.id);
    setEditName(stripExtension(route.name));
  };

  const handleSaveEdit = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (editName.trim()) {
      await updateRouteName(id, `${editName.trim()}.gpx`);
    }
    setEditingId(null);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  if (isLoading)
    return (
      <div className="text-muted-foreground animate-pulse p-4 text-center text-xs">
        {t('loading')}
      </div>
    );
  if (routes.length === 0) return null;

  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      <div className="flex items-center gap-2 px-1">
        <Route className="text-primary h-4 w-4" />
        <h3 className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
          {t('title')}
        </h3>
      </div>

      <ScrollArea className="h-[350px] w-full pr-4">
        <div className="flex w-full flex-col gap-2">
          {routes.map((route) => (
            <div
              key={route.id}
              className="group border-border bg-secondary/30 hover:border-primary/30 hover:bg-secondary/50 relative flex min-w-0 flex-col rounded-lg border p-3 transition-all"
            >
              {editingId === route.id ? (
                <div
                  className="flex w-full min-w-0 items-start gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="border-primary/50 bg-background h-8 min-w-0 flex-1 text-xs focus-visible:ring-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(e as any, route.id);
                      if (e.key === 'Escape') handleCancelEdit(e as any);
                    }}
                  />
                  <div className="flex shrink-0 items-center">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-primary hover:bg-primary/10 h-8 w-8"
                      onClick={(e) => handleSaveEdit(e, route.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:bg-muted h-8 w-8"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex w-full items-start justify-between gap-3">
                  <button
                    className="block min-w-0 flex-1 text-left"
                    onClick={() => onLoadRoute(route.gpx_content, route.name)}
                  >
                    <p className="text-foreground text-sm leading-tight font-semibold break-words whitespace-normal">
                      {stripExtension(route.name)}
                    </p>
                    <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px]">
                      <span className="flex shrink-0 items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {Number(route.distance).toFixed(1)} km
                      </span>
                      <span className="flex shrink-0 items-center gap-1">
                        <ArrowUp className="h-3 w-3 text-emerald-500" />
                        {Math.round(route.elevation_gain)}m
                      </span>
                      <span className="flex shrink-0 items-center gap-1">
                        <ArrowDown className="h-3 w-3 text-rose-500" />
                        {Math.round(route.elevation_loss || 0)}m
                      </span>
                      <span className="flex shrink-0 items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(route.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </button>

                  <div className="flex shrink-0 items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:bg-primary/5 hover:text-primary h-8 w-8 transition-colors"
                      onClick={(e) => handleStartEdit(e, route)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:bg-destructive/5 hover:text-destructive h-8 w-8 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRoute(route.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
