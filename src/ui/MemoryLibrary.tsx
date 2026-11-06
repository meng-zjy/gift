import { useEffect, useRef, useState } from "react";
import { stories } from "../content/world";
import type { ReadingProgress } from "./useStoryBook";
import type { Story } from "../game/types";

const statusLabels = {
  opened: "未读完",
  skipped: "已跳过",
  completed: "已读完",
};

export function MemoryLibrary({
  progress,
  onOpen,
  onClose,
  onReset,
  catalog = stories,
}: {
  progress: ReadingProgress;
  onOpen: (id: string, fromStart: boolean) => void;
  onClose: () => void;
  onReset: () => boolean;
  catalog?: Record<string, Story>;
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetFailed, setResetFailed] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  const discovered = Object.entries(progress).filter(([id]) => catalog[id]);
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
          收藏已经遇见的故事，想念的时候再翻开。还没发现的，留在小屋里等你。
        </p>
        {discovered.length === 0 && <p>还没有打开过回忆，先去书桌旁看看吧。</p>}
        <div className="library-list">
          {discovered.map(([id, entry]) => (
            <article key={id}>
              <div>
                <h3>{catalog[id].title}</h3>
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
        <div className="library-reset">
          <p>每台设备分别记住自己的探索。这本回忆册，只属于当前浏览器。</p>
          {confirmReset ? (
            <div>
              <p>
                清空这台浏览器的阅读与探索记录，从开场重新体验？故事、照片与生活里程碑会保留。
              </p>
              <button
                className="secondary-button"
                onClick={() => setConfirmReset(false)}
              >
                取消
              </button>
              <button
                className="primary-button"
                onClick={() => setResetFailed(!onReset())}
              >
                确认重新开始
              </button>
              {resetFailed && (
                <p role="alert">
                  未能清除阅读记录，请检查浏览器的网站存储设置。
                </p>
              )}
            </div>
          ) : (
            <button
              className="text-button"
              onClick={() => setConfirmReset(true)}
            >
              重新开始体验
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}
