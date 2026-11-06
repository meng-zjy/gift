import { useEffect, useMemo, useRef, useState } from "react";
import { App } from "./App";
import { MemoryManager } from "./manage/MemoryManager";
import { useMemories, usePhotoURLs } from "../memories/useMemories";
import { buildCatalog } from "../memories/catalog";

/** Keep content loaded across the game and editor; editing never mounts a second game renderer. */
export function Root() {
  const library = useMemories();
  const urls = usePhotoURLs(library.archive.assets);
  const catalog = useMemo(
    () => buildCatalog(library.archive, urls),
    [library.archive, urls],
  );
  const [managing, setManaging] = useState(() => location.hash === "#manage");
  const unsaved = useRef(false);
  useEffect(() => {
    function route() {
      const next = location.hash === "#manage";
      if (
        !next &&
        unsaved.current &&
        !window.confirm("还有未保存的修改，确定离开手账台吗？")
      ) {
        history.replaceState(null, "", "#manage");
        return;
      }
      unsaved.current = false;
      setManaging(next);
    }
    window.addEventListener("hashchange", route);
    return () => window.removeEventListener("hashchange", route);
  }, []);
  if (!library.loaded)
    return (
      <div className="content-loading" role="status">
        正在翻开小屋里的手账…
      </div>
    );
  return managing ? (
    <MemoryManager
      library={library}
      onDirty={(dirty) => {
        unsaved.current = dirty;
      }}
    />
  ) : (
    <App catalog={catalog} contentError={library.error} />
  );
}
