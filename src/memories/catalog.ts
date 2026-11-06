import { stories as examples } from "../content/world";
import type { Story } from "../game/types";
import { voiceNames, type MemoryArchive, type MemoryKind } from "./model";

export const exampleCollections: Record<MemoryKind, string[]> = {
  diary: ["first-page"],
  words: ["welcome-home"],
  album: [],
};

export function memoryStoryId(id: string, revision: string): string {
  return `memory:${id}:${revision}`;
}

/** Publishing a revision creates a fresh reading identity; old text is never marked as new text. */
export function buildCatalog(
  archive: MemoryArchive,
  urls: Record<string, string>,
) {
  const stories: Record<string, Story> = { ...examples };
  const collections: Record<MemoryKind, string[]> = {
    diary: [],
    words: [],
    album: [],
  };
  for (const entry of [...archive.entries].sort(
    (first, second) =>
      second.date.localeCompare(first.date) ||
      second.updatedAt.localeCompare(first.updatedAt),
  )) {
    if (entry.status !== "published") continue;
    const id = memoryStoryId(entry.id, entry.revision);
    stories[id] = {
      id,
      title: entry.title,
      kind:
        entry.kind === "diary"
          ? "memory"
          : entry.kind === "words"
            ? "dialogue"
            : "album",
      speaker: `${entry.date} · ${voiceNames[entry.voice]}${entry.place ? ` · ${entry.place}` : ""}`,
      paragraphs:
        entry.kind === "album"
          ? entry.photos.map(
              (photo, index) => photo.caption || `第 ${index + 1} 张照片`,
            )
          : entry.body.split(/\n\s*\n/).filter((part) => part.trim()),
      photos:
        entry.kind === "album"
          ? entry.photos.map((photo) => ({
              url: urls[photo.id],
              caption: photo.caption,
            }))
          : undefined,
      note: entry.kind === "album" ? entry.body : undefined,
    };
    collections[entry.kind].push(id);
  }
  for (const kind of Object.keys(collections) as MemoryKind[])
    collections[kind].push(...exampleCollections[kind]);
  return { stories, collections };
}
