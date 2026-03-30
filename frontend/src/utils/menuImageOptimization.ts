export const SUPABASE_MENU_PUBLIC_URL =
  'https://oslhmctcqgszovthxjwx.supabase.co/storage/v1/object/public/menu-items/';
export const SUPABASE_MENU_RENDER_URL =
  'https://oslhmctcqgszovthxjwx.supabase.co/storage/v1/render/image/public/menu-items/';
export const SUPABASE_MENU_RENDER_PATH_MARKER =
  '/storage/v1/render/image/public/menu-items/';

export function getSupabaseMenuImagePath(src: string): string | undefined {
  if (!src) return undefined;

  if (src.startsWith(SUPABASE_MENU_PUBLIC_URL)) {
    return src.slice(SUPABASE_MENU_PUBLIC_URL.length);
  }

  if (!src.includes(SUPABASE_MENU_RENDER_PATH_MARKER)) {
    return undefined;
  }

  const markerIndex = src.indexOf(SUPABASE_MENU_RENDER_PATH_MARKER);
  if (markerIndex < 0) return undefined;

  const pathStart = markerIndex + SUPABASE_MENU_RENDER_PATH_MARKER.length;
  const queryStart = src.indexOf('?', pathStart);
  return queryStart === -1
    ? src.slice(pathStart)
    : src.slice(pathStart, queryStart);
}

export function buildSupabaseMenuRenderUrl(
  imagePath: string,
  width: number,
  height: number,
  quality: number,
): string {
  return `${SUPABASE_MENU_RENDER_URL}${imagePath}?width=${width}&height=${height}&resize=cover&quality=${quality}&format=webp`;
}

export function getOptimizedMenuImageUrl(
  imageUrl: string,
  width = 224,
  height = 224,
  quality = 65,
): string {
  if (!imageUrl) return imageUrl;

  const imagePath = getSupabaseMenuImagePath(imageUrl);
  if (imagePath) {
    return buildSupabaseMenuRenderUrl(imagePath, width, height, quality);
  }

  return imageUrl;
}
