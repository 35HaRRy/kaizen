export const categories = [
  "Seminerler",
  "Kyu sınavları",
  "Çocuk etkinlikleri",
  "Dojo yaşamı",
] as const;
export type EventCategory = (typeof categories)[number];
export interface MediaItem {
  id: string;
  key: string;
  kind: "image" | "video";
  mime: string;
  size: number;
  originalName: string;
  url: string;
}
export interface EventItem {
  id: string;
  category: EventCategory;
  date: string;
  title: string;
  description: string;
  location: string;
  media: MediaItem[];
  coverMediaId: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}
export interface EventInput {
  category: EventCategory;
  date: string;
  title: string;
  description: string;
  location: string;
  mediaIds: string[];
  coverMediaId: string | null;
}
