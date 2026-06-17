const RAWG_API_KEY =
  process.env.NEXT_PUBLIC_RAWG_API_KEY || '754a38d2419a4aee8924fd13b8193b0f';

const imageCache = new Map<string, string | null>();
const inFlightRequests = new Map<string, Promise<string | null>>();

export const getGameImage = async (gameName: string): Promise<string | null> => {
  const key = gameName.trim().toLowerCase();
  if (!key) return null;
  if (imageCache.has(key)) return imageCache.get(key) ?? null;
  if (inFlightRequests.has(key)) return inFlightRequests.get(key)!;

  const request = (async () => {
    try {
      const url = new URL('https://api.rawg.io/api/games');
      url.searchParams.set('key', RAWG_API_KEY);
      url.searchParams.set('page_size', '1');
      url.searchParams.set('search', gameName);

      const response = await fetch(url.toString());
      if (!response.ok) return null;

      const data = await response.json();
      const imageUrl = data?.results?.[0]?.background_image ?? null;
      imageCache.set(key, imageUrl);
      return imageUrl;
    } catch {
      imageCache.set(key, null);
      return null;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, request);
  return request;
};
