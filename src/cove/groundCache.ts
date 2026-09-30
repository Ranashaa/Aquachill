// Le sol de la crique est long à peindre (tout est calculé pixel par pixel) :
// on le garde dans le navigateur (IndexedDB) pour que les visites suivantes soient instantanées.
import { distanceField, renderGround, type GroundArt } from './ground';
import { MAP_ROWS, PATHS, WORLD_H, WORLD_W } from './map';

/** À incrémenter quand la peinture du sol change. */
const ART_VERSION = 3;

function mapHash(): string {
  let h = 0;
  for (const ch of MAP_ROWS.join('') + JSON.stringify(PATHS)) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return `ground-${ART_VERSION}-${h >>> 0}`;
}

function db(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('aquachill-cache', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('art');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idb<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const d = await db();
  return new Promise((resolve, reject) => {
    const req = fn(d.transaction('art', mode).objectStore('art'));
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
}

interface Stored {
  base: Blob;
  water: Blob[];
  ids: ArrayBuffer;
}

const toBlob = (c: HTMLCanvasElement) => new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('toBlob'))), 'image/png'));

async function toCanvas(b: Blob): Promise<HTMLCanvasElement> {
  const bmp = await createImageBitmap(b);
  const c = document.createElement('canvas');
  c.width = bmp.width;
  c.height = bmp.height;
  c.getContext('2d')!.drawImage(bmp, 0, 0);
  return c;
}

export async function loadGround(): Promise<GroundArt> {
  const key = mapHash();
  if (!import.meta.env.DEV) {
    try {
      const hit = await idb<Stored | undefined>('readonly', (s) => s.get(key));
      if (hit) {
        const ids = new Uint8Array(hit.ids);
        const distLand = distanceField(ids, WORLD_W, WORLD_H, (id) => id !== 4 && id !== 5);
        return { base: await toCanvas(hit.base), water: await Promise.all(hit.water.map(toCanvas)), ids, distLand };
      }
    } catch {
      /* pas de cache : on peint */
    }
  }
  // laisse le temps à l'écran de chargement de s'afficher
  await new Promise((r) => setTimeout(r, 30));
  const art = renderGround();
  if (!import.meta.env.DEV) {
    (async () => {
      const stored: Stored = { base: await toBlob(art.base), water: await Promise.all(art.water.map(toBlob)), ids: art.ids.slice().buffer };
      await idb('readwrite', (s) => s.clear());
      await idb('readwrite', (s) => s.put(stored, key));
    })().catch(() => {});
  }
  return art;
}
