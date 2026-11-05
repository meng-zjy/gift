import { useState } from "react";
import { stories } from "../content/world";

export const READING_KEY = "our-little-world:reading:v1";
export type ReadingStatus = "opened" | "skipped" | "completed";
export interface ReadingEntry {
  step: number;
  status: ReadingStatus;
}
export type ReadingProgress = Record<string, ReadingEntry>;
export interface ReadingSession {
  storyId: string;
  step: number;
  replay: boolean;
}

/** Treat local saves as untrusted and drop obsolete content references. */
export function parseReadingProgress(raw: string | null): ReadingProgress {
  try {
    const saved = JSON.parse(raw ?? "null");
    if (
      saved?.version !== 1 ||
      typeof saved.entries !== "object" ||
      !saved.entries
    )
      return {};
    const entries: ReadingProgress = {};
    for (const [id, entry] of Object.entries(saved.entries)) {
      const candidate = entry as ReadingEntry;
      if (
        !stories[id] ||
        !candidate ||
        !Number.isInteger(candidate.step) ||
        !["opened", "skipped", "completed"].includes(candidate.status)
      )
        continue;
      entries[id] = {
        step: Math.max(
          0,
          Math.min(candidate.step, stories[id].paragraphs.length - 1),
        ),
        status: candidate.status,
      };
    }
    return entries;
  } catch {
    return {};
  }
}

/** Replay is a separate session: it must never overwrite the original reading cursor. */
export function useStoryBook() {
  const [progress, setProgress] = useState<ReadingProgress>(() => {
    try {
      return parseReadingProgress(localStorage.getItem(READING_KEY));
    } catch {
      return {};
    }
  });
  const [session, setSession] = useState<ReadingSession | null>(null);
  const [storageFailed, setStorageFailed] = useState(false);

  function save(id: string, entry: ReadingEntry) {
    const next = { ...progress, [id]: entry };
    setProgress(next);
    try {
      localStorage.setItem(
        READING_KEY,
        JSON.stringify({ version: 1, entries: next }),
      );
      setStorageFailed(false);
    } catch {
      setStorageFailed(true);
    }
  }

  function open(id: string, fromStart = false) {
    if (!stories[id]) return;
    const previous = progress[id];
    const replay = Boolean(
      previous && (fromStart || previous.status === "completed"),
    );
    const step =
      fromStart || previous?.status === "completed" ? 0 : (previous?.step ?? 0);
    if (!replay) save(id, { step, status: "opened" });
    setSession({ storyId: id, step, replay });
  }

  function move(step: number) {
    if (!session) return;
    const bounded = Math.max(
      0,
      Math.min(step, stories[session.storyId].paragraphs.length - 1),
    );
    if (!session.replay)
      save(session.storyId, { step: bounded, status: "opened" });
    setSession({ ...session, step: bounded });
  }

  function close(reason: "close" | "skip" | "finish") {
    if (!session) return;
    if (!session.replay)
      save(session.storyId, {
        step: session.step,
        status:
          reason === "finish"
            ? "completed"
            : reason === "skip"
              ? "skipped"
              : "opened",
      });
    setSession(null);
  }

  return { progress, session, storageFailed, open, move, close };
}
