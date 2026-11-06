import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { memoryRepository } from "./repository";
import { emptyArchive, type MemoryArchive, type PhotoAsset } from "./model";

export function usePhotoURLs(assets: PhotoAsset[]): Record<string, string> {
  const urls = useMemo(
    () =>
      Object.fromEntries(
        assets.map((asset) => [asset.id, URL.createObjectURL(asset.blob)]),
      ),
    [assets],
  );
  useEffect(
    () => () => Object.values(urls).forEach(URL.revokeObjectURL),
    [urls],
  );
  return urls;
}

/** Async loading is isolated from the game, and stale refreshes cannot replace a newer save. */
export function useMemories() {
  const [archive, setArchive] = useState(emptyArchive);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++generation.current;
    try {
      const current = await memoryRepository.load();
      if (request === generation.current) {
        setArchive(current);
        setError("");
      }
    } catch (failure) {
      if (request === generation.current)
        setError(
          failure instanceof Error ? failure.message : "无法读取本机内容",
        );
    } finally {
      if (request === generation.current) setLoaded(true);
    }
  }, []);
  useEffect(() => {
    void refresh();
    const channel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel("our-little-world:content")
        : null;
    if (channel) channel.onmessage = () => void refresh();
    return () => channel?.close();
  }, [refresh]);
  function accept(next: MemoryArchive) {
    generation.current++;
    setArchive(next);
    setLoaded(true);
    setError("");
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel("our-little-world:content");
      channel.postMessage("changed");
      channel.close();
    }
  }
  return { archive, loaded, error, refresh, accept };
}
