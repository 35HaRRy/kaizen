import type { MediaItem } from "../../shared/events.js";

export function publicMedia(
  media: MediaItem,
  origin = process.env.R2_PUBLIC_ORIGIN,
): MediaItem {
  if (!origin) return media;
  const url = new URL(origin);
  if (url.protocol !== "https:" || url.username || url.password ||
      url.pathname !== "/" || url.search || url.hash)
    throw new Error("R2_PUBLIC_ORIGIN must be an HTTPS origin");
  return { ...media, url: `${url.origin}/${media.key}` };
}
