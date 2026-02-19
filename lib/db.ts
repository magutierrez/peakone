import { PGlite } from '@electric-sql/pglite';

let dbPromise: Promise<PGlite> | null = null;

export async function getDb() {
  if (typeof window === 'undefined') return null;

  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    // Usamos idb:// para que los datos persistan en el IndexedDB del navegador
    const instance = await PGlite.create('idb://peakone-storage');

    // Inicializamos el esquema
    await instance.exec(`
      CREATE TABLE IF NOT EXISTS saved_routes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_email TEXT NOT NULL,
        name TEXT NOT NULL,
        gpx_content TEXT NOT NULL,
        activity_type TEXT NOT NULL,
        distance REAL,
        elevation_gain REAL,
        elevation_loss REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      CREATE INDEX IF NOT EXISTS idx_user_email ON saved_routes(user_email);
    `);

    // Add activity_type column if it doesn't exist (for existing databases)
    await instance.exec(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='saved_routes' AND column_name='activity_type') THEN
          ALTER TABLE saved_routes ADD COLUMN activity_type TEXT NOT NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='saved_routes' AND column_name='elevation_loss') THEN
          ALTER TABLE saved_routes ADD COLUMN elevation_loss REAL DEFAULT 0;
        END IF;
      END
      $$;
    `);

    return instance;
  })();

  return dbPromise;
}

export async function saveRouteToDb(
  userEmail: string,
  name: string,
  rawGpxContent: string,
  activityType: 'cycling' | 'walking',
  distance: number,
  elevationGain: number,
  elevationLoss: number,
): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  let routeId: string;
  try {
    routeId = crypto.randomUUID();
  } catch (e) {
    // Fallback if crypto.randomUUID is not available (e.g., in some non-secure contexts)
    routeId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  if (!routeId) {
    return null;
  }

  try {
    await db.query(
      `INSERT INTO saved_routes (id, user_email, name, gpx_content, activity_type, distance, elevation_gain, elevation_loss)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        routeId,
        userEmail,
        name,
        rawGpxContent,
        activityType,
        distance,
        elevationGain,
        elevationLoss,
      ],
    );
    return routeId;
  } catch (error) {
    return null;
  }
}

export async function getRouteFromDb(
  routeId: string,
  userEmail: string,
): Promise<{
  name: string;
  gpx_content: string;
  activity_type: 'cycling' | 'walking';
  distance: number;
  elevation_gain: number;
  elevation_loss: number;
} | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.query(
      `SELECT name, gpx_content, activity_type, distance, elevation_gain, elevation_loss FROM saved_routes WHERE id = $1 AND user_email = $2`,
      [routeId, userEmail],
    );

    if (result.rows.length > 0) {
      const row = result.rows[0];
      return {
        name: row.name,
        gpx_content: row.gpx_content,
        activity_type: row.activity_type as 'cycling' | 'walking',
        distance: row.distance || 0,
        elevation_gain: row.elevation_gain || 0,
        elevation_loss: row.elevation_loss || 0,
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}
