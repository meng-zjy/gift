import { useEffect, useRef } from "react";
import type { CollectionKind, Story } from "../game/types";
import { kindNames } from "../memories/model";

export function MemoryCollection({
  kind,
  ids,
  stories,
  onOpen,
  onClose,
}: {
  kind: CollectionKind;
  ids: string[];
  stories: Record<string, Story>;
  onOpen: (id: string) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className={`story-dialog collection-dialog collection-${kind}`}
      aria-labelledby="collection-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="story-paper">
        <button
          autoFocus
          className="close-story"
          aria-label="关闭收藏"
          onClick={onClose}
        >
          ×
        </button>
        <span className="eyebrow">
          {kind === "album" ? "把那天装进相册" : "一页一页，慢慢翻"}
        </span>
        <h2 id="collection-title">
          {kind === "album" ? "一起去过的地方" : kindNames[kind]}
        </h2>
        {kind === "album" && (
          <p className="exhibition-intro">
            每张封面，都是一次出发。点开照片，把那天再走一遍。
          </p>
        )}
        {!ids.length && (
          <div className="collection-empty">
            <span>▧</span>
            <p>这里还没有照片。以后一起去过的地方，都可以留在这本相册里。</p>
            <a href="#manage">去手账台添加相册 →</a>
          </div>
        )}
        <div
          className={`collection-items ${kind === "album" ? "photo-exhibition" : ""}`}
        >
          {ids.map((id) => (
            <button key={id} onClick={() => onOpen(id)}>
              {stories[id].photos?.[0] && (
                <img src={stories[id].photos[0].url} alt="" />
              )}
              <span>
                <strong>{stories[id].title}</strong>
                <small>{stories[id].speaker}</small>
              </span>
              <span className="cover-photo-count">
                {kind === "album"
                  ? `${stories[id].photos?.length ?? 0} 张照片 · 打开 →`
                  : "↗"}
              </span>
            </button>
          ))}
        </div>
        <p className="collection-footnote">
          这里收好物品里的内容；右上角的回忆册帮你记住读到了哪里。
        </p>
      </div>
    </dialog>
  );
}
