'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from 'next-intl';
import type { RoutePoint } from '@/lib/types';

interface RoutePlayerProps {
  points: RoutePoint[];
  onPointUpdate: (index: number) => void;
  onStop: () => void;
  map: any;
}

export function RoutePlayer({ points, onPointUpdate, onStop, map }: RoutePlayerProps) {
  const t = useTranslations('RouteMap.player');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0); // 0 to 100
  const currentIndexRef = useRef(0);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const lastUiUpdateRef = useRef<number>(0);

  const updateMapCamera = useCallback((idx: number, forceUiUpdate = false) => {
    if (!map || !points[idx]) return;
    
    const p = points[idx];
    const nextP = points[Math.min(idx + 10, points.length - 1)]; 
    const bearing = calculateBearing(p.lat, p.lon, nextP.lat, nextP.lon);
    
    // Use jumpTo for animation frames to get maximum FPS
    map.jumpTo({
      center: [p.lon, p.lat],
      bearing: bearing,
      pitch: 65,
      zoom: 16
    });
    
    const now = Date.now();
    // Only update React state (heavy) at ~20fps to keep map animation at 60fps
    if (forceUiUpdate || now - lastUiUpdateRef.current > 50) {
      onPointUpdate(idx);
      setProgress((idx / (points.length - 1)) * 100);
      lastUiUpdateRef.current = now;
    }
  }, [map, points, onPointUpdate]);

  const animate = useCallback((time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const deltaTime = time - lastTimeRef.current;
    
    const increment = (speed * deltaTime) / 150; 
    currentIndexRef.current += increment;

    if (currentIndexRef.current >= points.length - 1) {
      stopPlayback();
      return;
    }

    const idx = Math.floor(currentIndexRef.current);
    updateMapCamera(idx);

    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [points, speed, updateMapCamera]);

  const startPlayback = () => {
    setIsPlaying(true);
    lastTimeRef.current = 0;
    requestRef.current = requestAnimationFrame(animate);
  };

  const pausePlayback = () => {
    setIsPlaying(false);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  };

  const stopPlayback = () => {
    pausePlayback();
    currentIndexRef.current = 0;
    updateMapCamera(0);
    onStop();
  };

  const handleSeek = (value: number[]) => {
    const newProgress = value[0];
    const newIndex = Math.floor((newProgress / 100) * (points.length - 1));
    currentIndexRef.current = newIndex;
    updateMapCamera(newIndex, true);
  };

  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 w-[95%] max-w-lg animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-background/95 backdrop-blur-md border border-border shadow-2xl rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-black uppercase tracking-widest text-primary">{t('title')}</h4>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={speed.toString()} onValueChange={(v) => setSpeed(parseFloat(v))}>
              <SelectTrigger className="h-7 w-20 text-[10px] font-bold bg-secondary/50 border-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1" className="text-[10px] font-bold">1x</SelectItem>
                <SelectItem value="2" className="text-[10px] font-bold">2x</SelectItem>
                <SelectItem value="3" className="text-[10px] font-bold">3x</SelectItem>
                <SelectItem value="4" className="text-[10px] font-bold">4x</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            {!isPlaying ? (
              <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary transition-colors" onClick={startPlayback}>
                <Play className="h-5 w-5 fill-current" />
              </Button>
            ) : (
              <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full text-primary bg-primary/5 hover:bg-primary/20" onClick={pausePlayback}>
                <Pause className="h-5 w-5 fill-current" />
              </Button>
            )}
            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/5" onClick={stopPlayback}>
              <Square className="h-4 w-4 fill-current" />
            </Button>
          </div>

          <div className="flex-1 px-2">
            <Slider 
              value={[progress]} 
              min={0} 
              max={100} 
              step={0.1} 
              onValueChange={handleSeek}
              className="cursor-pointer"
            />
          </div>
          
          <div className="min-w-[40px] text-right">
            <span className="text-[10px] font-black font-mono text-muted-foreground">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Internal helper for camera bearing
function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLon);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}
