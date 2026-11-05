import { useEffect, useRef } from "react";
import { stories } from "../content/world";
import type { ReadingProgress } from "./useStoryBook";

const statusLabels = {
  opened: "未读完",
  skipped: "已跳过",
  completed: "已读完",
};

export function MemoryLibrary({
  progress,
  onOpen,
  onClose,
}: {
  progress: ReadingProgress;
  onOpen: (id: string, fromStart: boolean) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  const discovered = Object.entries(progress).filter(([id]) => stories[id]);
  return (
    <dialog
      ref={dialog}
      className="story-dialog library-dialog"
      aria-labelledby="library-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="story-paper">
        <button
          autoFocus
          className="close-story"
          aria-label="关闭回忆册"
          onClick={onClose}
        >
          ×
        </button>
        <span className="eyebrow">THE MOMENTS YOU FOUND</span>
        <h2 id="library-title">回忆册</h2>
        <p className="library-note">
          只收录你已发现的故事。重看不会移动小人，也不会覆盖原阅读进度。
        </p>
        {discovered.length === 0 && <p>还没有打开过回忆，先去书桌旁看看吧。</p>}
        <div className="library-list">
          {discovered.map(([id, entry]) => (
            <article key={id}>
              <div>
                <h3>{stories[id].title}</h3>
                <span>
                  {statusLabels[entry.status]} · 停在第 {entry.step + 1} 段
                </span>
              </div>
              <div className="library-actions">
                {entry.status !== "completed" && (
                  <button
                    className="primary-button"
                    onClick={() => onOpen(id, false)}
                  >
                    继续阅读
                  </button>
                )}
                <button
                  className="text-button"
                  onClick={() => onOpen(id, true)}
                >
                  从头回看
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </dialog>
  );
}
