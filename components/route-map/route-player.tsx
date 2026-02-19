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
  const [progress, setProgress] = useState(0); 
  const currentIndexRef = useRef(0);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const lastUiUpdateRef = useRef<number>(0);

  const updateMapCamera = useCallback((fractionalIdx: number, forceUiUpdate = false) => {
    if (!map || points.length < 2) return;
    
    const idx = Math.floor(fractionalIdx);
    const nextIdx = Math.min(idx + 1, points.length - 1);
    const ratio = fractionalIdx - idx;

    const p1 = points[idx];
    const p2 = points[nextIdx];

    // 1. Interpolate Position
    const interpolatedLat = p1.lat + (p2.lat - p1.lat) * ratio;
    const interpolatedLon = p1.lon + (p2.lon - p1.lon) * ratio;

    // 2. Update Dynamic Marker Layer directly for maximum performance
    const source = map.getSource('player-position');
    if (source) {
      source.setData({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [interpolatedLon, interpolatedLat] },
        properties: {}
      });
    }

    // 3. Smooth Bearing: average multiple look-ahead points
    const lookAheadPoints = 20;
    const targetIdx = Math.min(idx + lookAheadPoints, points.length - 1);
    const targetPoint = points[targetIdx];
    const bearing = calculateBearing(interpolatedLat, interpolatedLon, targetPoint.lat, targetPoint.lon);
    
    // 4. Ultra-smooth Camera movement
    map.easeTo({
      center: [interpolatedLon, interpolatedLat],
      bearing: bearing,
      pitch: 65,
      zoom: 16,
      duration: 50, 
      easing: (t: number) => t 
    });
    
    const now = Date.now();
    // Throttle React state updates to 15fps to keep 60fps on map
    if (forceUiUpdate || now - lastUiUpdateRef.current > 64) {
      onPointUpdate(idx);
      setProgress((idx / (points.length - 1)) * 100);
      lastUiUpdateRef.current = now;
    }
  }, [map, points, onPointUpdate]);

  const animate = useCallback((time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const deltaTime = time - lastTimeRef.current;
    
    // Smooth speed-based increment
    const increment = (speed * deltaTime) / 250; 
    currentIndexRef.current += increment;

    if (currentIndexRef.current >= points.length - 1) {
      currentIndexRef.current = points.length - 1;
      updateMapCamera(currentIndexRef.current, true);
      setIsPlaying(false);
      return;
    }

    updateMapCamera(currentIndexRef.current);

    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [points, speed, updateMapCamera]);

  const startPlayback = () => {
    if (currentIndexRef.current >= points.length - 1) {
      currentIndexRef.current = 0;
    }
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
    updateMapCamera(0, true);
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
              <SelectTrigger className="h-7 w-20 text-[10px] font-bold bg-secondary/50 border-none focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1" className="text-[10px] font-bold cursor-pointer">1x</SelectItem>
                <SelectItem value="2" className="text-[10px] font-bold cursor-pointer">2x</SelectItem>
                <SelectItem value="3" className="text-[10px] font-bold cursor-pointer">3x</SelectItem>
                <SelectItem value="4" className="text-[10px] font-bold cursor-pointer">4x</SelectItem>
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

function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLon);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}
