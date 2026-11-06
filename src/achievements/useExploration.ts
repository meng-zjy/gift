import { useEffect, useRef, useState } from "react";
import { rooms } from "../content/world";
import {
  explorationAchievements,
  unlockedAt,
  type ExplorationProgress,
} from "./definitions";

export const EXPLORATION_KEY = "our-little-world:exploration:v1";
const empty = (): ExplorationProgress => ({
  version: 1,
  rooms: {},
  reading: {},
});

export function parseExploration(raw: string | null): ExplorationProgress {
  try {
    const source = JSON.parse(raw ?? "null");
    if (source?.version !== 1) return empty();
    const validDates = (value: unknown, allowed: string[]) =>
      Object.fromEntries(
        Object.entries(value && typeof value === "object" ? value : {}).filter(
          ([key, date]) =>
            allowed.includes(key) &&
            typeof date === "string" &&
            Number.isFinite(Date.parse(date)),
        ),
      ) as Record<string, string>;
    return {
      version: 1,
      rooms: validDates(source.rooms, Object.keys(rooms)),
      reading: validDates(source.reading, ["memory", "album", "dialogue"]),
    };
  } catch {
    return empty();
  }
}

/** An event only earns an exploration badge once; real relationship milestones use published content. */
export function useExploration() {
  const [progress, setProgress] = useState(() => {
    try {
      return parseExploration(localStorage.getItem(EXPLORATION_KEY));
    } catch {
      return empty();
    }
  });
  const current = useRef(progress);
  const [failed, setFailed] = useState(false);
  const [toast, setToast] = useState("");
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);
  function record(group: "rooms" | "reading", key: string) {
    const previous = current.current;
    if (previous[group][key]) return;
    const next = {
      ...previous,
      [group]: { ...previous[group], [key]: new Date().toISOString() },
    };
    current.current = next;
    setProgress(next);
    const earned = explorationAchievements.filter(
      (achievement) =>
        !unlockedAt(achievement, previous) && unlockedAt(achievement, next),
    );
    if (earned.length)
      setToast(earned.map((achievement) => achievement.title).join(" · "));
    try {
      localStorage.setItem(EXPLORATION_KEY, JSON.stringify(next));
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }
  return {
    progress,
    failed,
    toast,
    visit: (roomId: string) => record("rooms", roomId),
    complete: (kind: string) => {
      if (["memory", "album", "dialogue"].includes(kind))
        record("reading", kind);
    },
  };
}
