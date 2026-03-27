import { useEffect, useMemo, useState } from 'react';

const CACHE_VERSION = import.meta.env.VITE_MENU_IMAGE_CACHE_VERSION || 'v1';
const IMAGE_CACHE_NAME = `orderly-menu-images-${CACHE_VERSION}`;
const IMAGE_CACHE_PREFIX = 'orderly-menu-images-';
const IMAGE_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const MAX_IN_MEMORY_OBJECT_URLS = 200;

const objectUrlMemory = new Map<string, string>();
const inFlightLoads = new Map<string, Promise<string | null>>();
let didRunCacheCleanup = false;

function storeObjectUrl(cacheKey: string, objectUrl: string): void {
  if (objectUrlMemory.has(cacheKey)) {
    objectUrlMemory.delete(cacheKey);
  }

  objectUrlMemory.set(cacheKey, objectUrl);

  if (objectUrlMemory.size > MAX_IN_MEMORY_OBJECT_URLS) {
    const oldestKey = objectUrlMemory.keys().next().value as string | undefined;
    if (!oldestKey) return;

    const oldestUrl = objectUrlMemory.get(oldestKey);
    if (oldestUrl) {
      URL.revokeObjectURL(oldestUrl);
    }
    objectUrlMemory.delete(oldestKey);
  }
}

async function cleanupOutdatedCaches(): Promise<void> {
  if (
    didRunCacheCleanup ||
    typeof window === 'undefined' ||
    !('caches' in window)
  ) {
    return;
  }

  didRunCacheCleanup = true;
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter(
        (name) =>
          name.startsWith(IMAGE_CACHE_PREFIX) && name !== IMAGE_CACHE_NAME,
      )
      .map((name) => caches.delete(name)),
  );
}

function buildCacheRequest(cacheKey: string): Request {
  return new Request(
    `https://orderly.local/cache/${encodeURIComponent(cacheKey)}`,
  );
}

async function readCachedBlob(cacheKey: string): Promise<Blob | null> {
  const cache = await caches.open(IMAGE_CACHE_NAME);
  const cached = await cache.match(buildCacheRequest(cacheKey));
  if (!cached) return null;

  const cachedAt = Number(cached.headers.get('x-cached-at') || 0);
  if (!cachedAt || Date.now() - cachedAt > IMAGE_CACHE_TTL_MS) {
    await cache.delete(buildCacheRequest(cacheKey));
    return null;
  }

  return cached.blob();
}

async function writeCachedBlob(cacheKey: string, blob: Blob): Promise<void> {
  const cache = await caches.open(IMAGE_CACHE_NAME);
  const response = new Response(blob, {
    headers: {
      'content-type': blob.type || 'image/jpeg',
      'x-cached-at': String(Date.now()),
    },
  });
  await cache.put(buildCacheRequest(cacheKey), response);
}

async function resolveCachedObjectUrl(
  cacheKey: string,
  src: string,
): Promise<string | null> {
  if (objectUrlMemory.has(cacheKey)) {
    return objectUrlMemory.get(cacheKey) || null;
  }

  if (inFlightLoads.has(cacheKey)) {
    return inFlightLoads.get(cacheKey) || null;
  }

  const promise = (async () => {
    try {
      const cachedBlob = await readCachedBlob(cacheKey);
      if (cachedBlob) {
        const objectUrl = URL.createObjectURL(cachedBlob);
        storeObjectUrl(cacheKey, objectUrl);
        return objectUrl;
      }

      const response = await fetch(src, { cache: 'force-cache' });
      if (!response.ok) return null;

      const blob = await response.blob();
      await writeCachedBlob(cacheKey, blob);

      const objectUrl = URL.createObjectURL(blob);
      storeObjectUrl(cacheKey, objectUrl);
      return objectUrl;
    } catch {
      return null;
    } finally {
      inFlightLoads.delete(cacheKey);
    }
  })();

  inFlightLoads.set(cacheKey, promise);
  return promise;
}

interface CachedMenuImageProps {
  src: string;
  alt: string;
  className?: string;
  cacheKey?: string;
}

export function CachedMenuImage({
  src,
  alt,
  className,
  cacheKey,
}: CachedMenuImageProps) {
  const stableKey = useMemo(() => cacheKey || src, [cacheKey, src]);
  const [resolvedSrc, setResolvedSrc] = useState<string>(src);

  useEffect(() => {
    let mounted = true;
    setResolvedSrc(src);

    if (typeof window === 'undefined' || !('caches' in window)) {
      return;
    }

    cleanupOutdatedCaches().catch(() => {
      // Best-effort cleanup only.
    });

    resolveCachedObjectUrl(stableKey, src).then((cachedObjectUrl) => {
      if (mounted && cachedObjectUrl) {
        setResolvedSrc(cachedObjectUrl);
      }
    });

    return () => {
      mounted = false;
    };
  }, [src, stableKey]);

  return (
    <img src={resolvedSrc} alt={alt} className={className} loading="lazy" />
  );
}
