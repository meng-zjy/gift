import { useEffect, useRef } from "react";
import type { Story } from "../game/types";
import { kindNames, type MemoryKind } from "../memories/model";

export function MemoryCollection({
  kind,
  ids,
  stories,
  onOpen,
  onClose,
}: {
  kind: MemoryKind;
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
        <h2 id="collection-title">{kindNames[kind]}</h2>
        {!ids.length && (
          <div className="collection-empty">
            <span>▧</span>
            <p>这里还没有照片。以后一起去过的地方，都可以留在这本相册里。</p>
            <a href="#manage">去手账台添加相册 →</a>
          </div>
        )}
        <div className="collection-items">
          {ids.map((id) => (
            <button key={id} onClick={() => onOpen(id)}>
              {stories[id].photos?.[0] && (
                <img src={stories[id].photos[0].url} alt="" />
              )}
              <span>
                <strong>{stories[id].title}</strong>
                <small>{stories[id].speaker}</small>
              </span>
              <span aria-hidden="true">↗</span>
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
