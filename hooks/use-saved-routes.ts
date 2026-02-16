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
  created_at: string;
}

const ROUTES_CACHE_KEY = 'local-saved-routes';

export function useSavedRoutes() {
  const { data: session } = useSession();
  const userId = session?.user?.id || session?.user?.email;

  const {
    data: routes = [],
    isLoading,
    error,
  } = useSWR(userId ? [ROUTES_CACHE_KEY, userId] : null, async ([, uid]) => {
    const db = await getDb();
    if (!db) return [];

    const result = await db.query<SavedRoute>(
      `SELECT * FROM saved_routes WHERE user_email = $1 ORDER BY created_at DESC`,
      [uid],
    );
    return result.rows;
  });

  const saveRoute = async (name: string, content: string, distance: number, elevation: number) => {
    if (!userId) return;
    try {
      const db = await getDb();
      if (!db) return;

      await db.query(
        `INSERT INTO saved_routes (user_email, name, gpx_content, distance, elevation_gain) 
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, name, content, distance, elevation],
      );

      mutate([ROUTES_CACHE_KEY, userId]);
    } catch (e) {
      console.error('Failed to save route', e);
      throw e;
    }
  };

  const deleteRoute = async (id: string) => {
    if (!userId) return;
    try {
      const db = await getDb();
      if (!db) return;

      await db.query(`DELETE FROM saved_routes WHERE id = $1`, [id]);
      mutate([ROUTES_CACHE_KEY, userId]);
    } catch (e) {
      console.error('Failed to delete route', e);
    }
  };

  const updateRouteName = async (id: string, newName: string) => {
    if (!userId) return;
    try {
      const db = await getDb();
      if (!db) return;

      await db.query(`UPDATE saved_routes SET name = $1 WHERE id = $2`, [newName, id]);
      mutate([ROUTES_CACHE_KEY, userId]);
    } catch (e) {
      console.error('Failed to update route name', e);
    }
  };

  return {
    routes,
    isLoading: isLoading && !!userId,
    error,
    saveRoute,
    deleteRoute,
    updateRouteName,
    refresh: () => mutate([ROUTES_CACHE_KEY, userId]),
  };
}
