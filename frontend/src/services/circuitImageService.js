import { getCircuitFallbackUrl } from '@/lib/imageFallbacks';

const RAPIDAPI_KEY  = import.meta.env.VITE_RAPIDAPI_KEY;
const RAPIDAPI_HOST = import.meta.env.VITE_RAPIDAPI_HOST ?? 'f1-motorsport-data.p.rapidapi.com';

const cache = new Map();
let rapidFetchPromise = null;

async function batchFetchFromRapidApi() {
  if (rapidFetchPromise) return rapidFetchPromise;

  rapidFetchPromise = (async () => {
    try {
      const res = await fetch(`https://${RAPIDAPI_HOST}/circuits?season=2026`, {
        headers: {
          'x-rapidapi-key':  RAPIDAPI_KEY,
          'x-rapidapi-host': RAPIDAPI_HOST,
        },
      });
      if (!res.ok) return;
      const data = await res.json();
      // NOTE: Adjust the path below if the actual API response shape differs.
      // Common variants: data.circuits, data.Circuits.Circuit, data.data
      const list = data.circuits ?? data?.Circuits?.Circuit ?? [];
      for (const c of list) {
        const id  = (c.circuitId ?? c.Circuit_ID ?? c.id ?? '').toLowerCase();
        const url = c.image ?? c.Image ?? c.imageUrl ?? '';
        if (id && url) cache.set(id, url);
      }
    } catch {
      // silently fall through to formula1.com CDN
    }
  })();

  return rapidFetchPromise;
}

export async function getCircuitImage(circuitId) {
  if (!circuitId) return null;
  const id = circuitId.toLowerCase();
  if (cache.has(id)) return cache.get(id);

  if (RAPIDAPI_KEY) {
    await batchFetchFromRapidApi();
    if (cache.has(id)) return cache.get(id);
  }

  const url = getCircuitFallbackUrl(id);
  cache.set(id, url);
  return url;
}
