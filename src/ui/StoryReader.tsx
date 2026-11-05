import { useEffect, useRef, useState } from "react";
import type { Story } from "../game/types";
import type { ReadingSession } from "./useStoryBook";
import { artworks } from "../content/artworks";
import { CakeIllustration, FoodIllustration } from "./ObjectIllustrations";

interface Props {
  story: Story;
  session: ReadingSession;
  backgroundPaused: boolean;
  onResume: () => void;
  onMove: (step: number) => void;
  onClose: (reason: "close" | "skip" | "finish") => void;
}

const labels = {
  memory: "窗边的日记",
  dialogue: "和你说说话",
  intro: "给你的开场短笺",
  collection: "冰箱里的偏爱",
  dessert: "今日份的甜",
  gallery: "小屋画廊",
};

export function StoryReader({
  story,
  session,
  backgroundPaused,
  onResume,
  onMove,
  onClose,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [pixelView, setPixelView] = useState(false);
  const last = session.step === story.paragraphs.length - 1;
  const artwork = artworks[session.step % artworks.length];

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  function close(reason: "close" | "skip" | "finish") {
    dialog.current?.close();
    onClose(reason);
  }

  return (
    <dialog
      ref={dialog}
      className={`story-dialog reader-${story.kind}`}
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
        <div className="reader-heading">
          <span className="eyebrow">{labels[story.kind]}</span>
          <span className="replay-badge">{session.replay ? "回看中" : ""}</span>
        </div>
        {story.kind === "dialogue" && (
          <div className="dialogue-portrait" aria-hidden="true">
            <span>♡</span>
            <svg viewBox="0 0 16 18">
              <path fill="#594b44" d="M4 1h8v2h2v6H2V3h2z" />
              <path fill="#edc6a0" d="M4 4h8v7H4z" />
              <path fill="#394554" d="M5 6h1v1H5zm5 0h1v1h-1z" />
              <path fill="#c3aa7d" d="M3 11h10v6H3z" />
            </svg>
          </div>
        )}
        <h2 id="story-title">{story.title}</h2>
        {story.kind === "intro" && (
          <div className="opening-vignette" aria-hidden="true">
            <span>✦</span>
            <span className="lit-house">⌂</span>
            <span>✧</span>
          </div>
        )}
        {story.kind === "gallery" ? (
          <div className="artwork-viewer">
            <figure>
              <img
                src={pixelView ? artwork.pixel : artwork.original}
                className={pixelView ? "pixel-artwork" : ""}
                alt={`${artwork.artist}《${artwork.title}》${pixelView ? "像素版" : "原画"}`}
                onError={(event) => {
                  event.currentTarget.alt = "画作暂时未加载，请关闭后重试";
                }}
              />
              <figcaption>
                <strong>《{artwork.title}》</strong>
                <span>
                  {artwork.artist} · {artwork.year}
                </span>
              </figcaption>
            </figure>
            <div className="artwork-tools">
              <button
                className="secondary-button"
                onClick={() => setPixelView(!pixelView)}
              >
                {pixelView ? "查看原画" : "查看像素版"}
              </button>
              <a href={artwork.source} target="_blank" rel="noreferrer">
                图像来源 ↗
              </a>
            </div>
            <p className="artwork-note">{artwork.note}</p>
          </div>
        ) : (
          <>
            {story.kind === "collection" && session.step === 0 && (
              <div className="food-cards">
                {[
                  {
                    kind: "strawberry",
                    name: "草莓",
                    note: "红红的，一点点酸甜",
                  },
                  { kind: "mango", name: "芒果", note: "把阳光留在冰箱里" },
                  { kind: "cake", name: "小蛋糕", note: "给普通日子加一点甜" },
                ].map((item) => (
                  <article key={item.kind}>
                    <FoodIllustration
                      kind={item.kind as "strawberry" | "mango" | "cake"}
                    />
                    <h3>{item.name}</h3>
                    <span>{item.note}</span>
                  </article>
                ))}
              </div>
            )}
            {story.kind === "dessert" && (
              <div className="dessert-plate">
                <CakeIllustration />
                <span>STRAWBERRY SHORTCAKE</span>
              </div>
            )}
            <div className="story-body story-segment" aria-live="polite">
              <p key={session.step}>{story.paragraphs[session.step]}</p>
            </div>
          </>
        )}
        {backgroundPaused && (
          <div className="return-banner">
            <span>这一页替你留着，回来后继续就好。</span>
            <button className="secondary-button" onClick={onResume}>
              继续阅读
            </button>
          </div>
        )}
        <div className="story-footer">
          <button
            className="text-button"
            disabled={backgroundPaused || session.step === 0}
            onClick={() => onMove(session.step - 1)}
          >
            ← {story.kind === "gallery" ? "上一幅" : "上一段"}
          </button>
          <span className="page-number">
            {session.step + 1} / {story.paragraphs.length}
          </span>
          <button
            className="primary-button"
            disabled={backgroundPaused}
            onClick={() => (last ? close("finish") : onMove(session.step + 1))}
          >
            {last
              ? "读完，回到小屋 →"
              : story.kind === "gallery"
                ? "下一幅 →"
                : "下一段 →"}
          </button>
        </div>
        <div className="story-tools">
          <button className="text-button" onClick={() => close("close")}>
            先离开，稍后继续
          </button>
          <button className="text-button" onClick={() => close("skip")}>
            跳过本段剧情
          </button>
        </div>
      </div>
    </dialog>
  );
}
