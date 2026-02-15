import { PGlite } from '@electric-sql/pglite'

let dbPromise: Promise<PGlite> | null = null

export async function getDb() {
  if (typeof window === 'undefined') return null

  if (dbPromise) return dbPromise

  dbPromise = (async () => {
    // Usamos idb:// para que los datos persistan en el IndexedDB del navegador
    const instance = await PGlite.create('idb://peakone-storage')
    
    // Inicializamos el esquema
    await instance.exec(`
      CREATE TABLE IF NOT EXISTS saved_routes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_email TEXT NOT NULL,
        name TEXT NOT NULL,
        gpx_content TEXT NOT NULL,
        distance DECIMAL,
        elevation_gain DECIMAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_user_email ON saved_routes(user_email);
    `)
    
    return instance
  })()

  return dbPromise
}