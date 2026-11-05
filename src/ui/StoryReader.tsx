import { useEffect, useRef, useState } from "react";
import type { Story } from "../game/types";
import type { ReadingSession } from "./useStoryBook";

interface Props {
  story: Story;
  session: ReadingSession;
  backgroundPaused: boolean;
  onResume: () => void;
  onMove: (step: number) => void;
  onClose: (reason: "close" | "skip" | "finish") => void;
}

export function StoryReader({
  story,
  session,
  backgroundPaused,
  onResume,
  onMove,
  onClose,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [paused, setPaused] = useState(false);
  const isPaused = paused || backgroundPaused;
  const last = session.step === story.paragraphs.length - 1;

  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);

  function close(reason: "close" | "skip" | "finish") {
    dialog.current?.close();
    onClose(reason);
  }

  return (
    <dialog
      ref={dialog}
      className="story-dialog"
      aria-labelledby="story-title"
      onCancel={(event) => {
        event.preventDefault();
        close("close");
      }}
    >
      <div className="story-paper">
        <button
          autoFocus
          className="close-story"
          aria-label="关闭回忆"
          onClick={() => close("close")}
        >
          ×
        </button>
        <span className="eyebrow">
          {session.replay ? "A MOMENT, ONCE AGAIN" : "A PAGE FOR US"}
        </span>
        <p className="story-speaker">
          {story.speaker}
          {session.replay ? " · 回看中" : ""}
        </p>
        <h2 id="story-title">{story.title}</h2>
        {story.kind === "intro" && (
          <div className="opening-vignette" aria-hidden="true">
            <span>✦</span>
            <span className="lit-house">⌂</span>
            <span>✧</span>
          </div>
        )}
        <div className="story-position">
          <span>
            第 {session.step + 1} / {story.paragraphs.length} 段
          </span>
          <span>{session.replay ? "回看不改变原进度" : "已记住当前段落"}</span>
        </div>
        <div className="story-body story-segment" aria-live="polite">
          {isPaused ? (
            <div className="reading-paused">
              <p>这一页先替你留着。</p>
              <button
                className="primary-button"
                onClick={() => {
                  setPaused(false);
                  onResume();
                }}
              >
                继续阅读
              </button>
            </div>
          ) : (
            <p key={session.step}>{story.paragraphs[session.step]}</p>
          )}
        </div>
        <div className="story-tools">
          <button
            className="text-button"
            disabled={isPaused}
            onClick={() => setPaused(true)}
          >
            暂停阅读
          </button>
          <button className="text-button" onClick={() => close("skip")}>
            跳过本段剧情
          </button>
          <button className="text-button" onClick={() => close("close")}>
            先离开，稍后继续
          </button>
        </div>
        <div className="story-footer">
          <button
            className="text-button"
            disabled={isPaused || session.step === 0}
            onClick={() => onMove(session.step - 1)}
          >
            ← 上一段
          </button>
          <button
            className="primary-button"
            disabled={isPaused}
            onClick={() => (last ? close("finish") : onMove(session.step + 1))}
          >
            {last ? "读完，回到小屋 →" : "下一段 →"}
          </button>
        </div>
        <p className="reader-hint">
          随时跳过或离开；在「回忆册」中继续或从头回看。
        </p>
      </div>
    </dialog>
  );
}
