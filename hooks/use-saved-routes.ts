'use client';

import useSWR, { mutate } from 'swr';
import { getDb } from '@/lib/db';
import { useSession } from 'next-auth/react';

export interface SavedRoute {
  id: string;
  name: string;
  gpx_content: string;
  distance: number;
  elevation_gain: number;
  elevation_loss: number;
  created_at: string;
}

const ROUTES_CACHE_KEY = 'local-saved-routes';

export function useSavedRoutes() {
  const { data: session } = useSession();
  const userEmail = session?.user?.email;

  const {
    data: routes = [],
    isLoading,
    error,
  } = useSWR(userEmail ? [ROUTES_CACHE_KEY, userEmail] : null, async ([, email]) => {
    const db = await getDb();
    if (!db) {
      console.log('DB instance is null, returning empty routes.');
      return [];
    }

    try {
      console.log(`Fetching saved routes for user: ${email}`);
      const result = await db.query<SavedRoute>(
        `SELECT * FROM saved_routes WHERE user_email = $1 ORDER BY created_at DESC`,
        [email],
      );
      console.log('Fetched routes:', result.rows);
      return result.rows;
    } catch (e) {
      console.error('Error fetching saved routes:', e);
      return [];
    }
  });

  const saveRoute = async (name: string, content: string, activityType: 'cycling' | 'walking', distance: number, elevationGain: number, elevationLoss: number) => {
    if (!userEmail) return null;
    try {
      const db = await getDb();
      if (!db) return null;

      // Check if a route with same name and distance already exists for this user
      const existing = await db.query<SavedRoute>(
        `SELECT id FROM saved_routes 
         WHERE user_email = $1 AND name = $2 AND abs(distance - $3) < 0.01
         LIMIT 1`,
        [userEmail, name, distance]
      );

      if (existing.rows.length > 0) {
        console.log('Route already exists, returning existing ID:', existing.rows[0].id);
        return existing.rows[0].id;
      }

      let routeId: string;
      try {
        routeId = crypto.randomUUID();
      } catch (e) {
        console.error('crypto.randomUUID() failed or is not available in useSavedRoutes, falling back to Math.random UUID:', e);
        routeId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }

      if (!routeId) {
        console.error('Failed to generate a routeId in useSavedRoutes.');
        throw new Error('Failed to generate unique ID for route.');
      }

      await db.query(
        `INSERT INTO saved_routes (id, user_email, name, gpx_content, activity_type, distance, elevation_gain, elevation_loss) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [routeId, userEmail, name, content, activityType, distance, elevationGain, elevationLoss],
      );

      await mutate([ROUTES_CACHE_KEY, userEmail]);
      return routeId;
    } catch (e) {
      console.error('Failed to save route', e);
      throw e;
    }
  };

  const deleteRoute = async (id: string) => {
    if (!userEmail) return;
    try {
      const db = await getDb();
      if (!db) return;

      await db.query(`DELETE FROM saved_routes WHERE id = $1`, [id]);
      mutate([ROUTES_CACHE_KEY, userEmail]);
    } catch (e) {
      console.error('Failed to delete route', e);
    }
  };

  const updateRouteName = async (id: string, newName: string) => {
    if (!userEmail) return;
    try {
      const db = await getDb();
      if (!db) return;

      await db.query(`UPDATE saved_routes SET name = $1 WHERE id = $2`, [newName, id]);
      mutate([ROUTES_CACHE_KEY, userEmail]);
    } catch (e) {
      console.error('Failed to update route name', e);
    }
  };

  return {
    routes,
    isLoading: isLoading && !!userEmail,
    error,
    saveRoute,
    deleteRoute,
    updateRouteName,
    refresh: () => mutate([ROUTES_CACHE_KEY, userEmail]),
  };
}
