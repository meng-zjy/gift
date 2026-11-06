import { EXPLORATION_KEY } from "../achievements/useExploration";
import { READING_KEY } from "./useStoryBook";

/** Content lives in IndexedDB and is never part of a play-progress reset. */
export function resetExperience(): boolean {
  const previous = new Map<string, string | null>();
  try {
    for (const key of [READING_KEY, EXPLORATION_KEY])
      previous.set(key, localStorage.getItem(key));
    for (const key of previous.keys()) localStorage.removeItem(key);
    return true;
  } catch {
    // Restore any keys already removed if a browser rejects part of the operation.
    for (const [key, value] of previous) {
      try {
        if (value !== null) localStorage.setItem(key, value);
      } catch {
        /* Keep the failure visible to the caller. */
      }
    }
    return false;
  }
}
