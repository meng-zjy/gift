import { useEffect, useRef, useState } from "react";
import {
  explorationAchievements,
  lifeMilestones,
  unlockedAt,
  type ExplorationProgress,
} from "../achievements/definitions";
import type { PublishedMilestone } from "../memories/catalog";

export function AchievementGallery({
  progress,
  milestones,
  onOpen,
  onClose,
}: {
  progress: ExplorationProgress;
  milestones: PublishedMilestone[];
  onOpen: (id: string) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<"exploration" | "life">("exploration");
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  const earned = explorationAchievements.filter((item) =>
    unlockedAt(item, progress),
  );
  return (
    <dialog
      ref={dialog}
      className="story-dialog achievement-dialog"
      aria-labelledby="achievement-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="story-paper">
        <button
          autoFocus
          className="close-story"
          aria-label="关闭成就长廊"
          onClick={onClose}
        >
          ×
        </button>
        <span className="eyebrow">把值得纪念的日子，挂在这里</span>
        <h2 id="achievement-title">成就长廊</h2>
        <div className="achievement-tabs" aria-label="成就分类">
          <button
            aria-pressed={tab === "exploration"}
            onClick={() => setTab("exploration")}
          >
            小屋探索 · {earned.length} / {explorationAchievements.length}
          </button>
          <button aria-pressed={tab === "life"} onClick={() => setTab("life")}>
            生活里程碑 · {milestones.length}
          </button>
        </div>
        {tab === "exploration" ? (
          <>
            <p className="achievement-note">
              这些印记属于当前浏览器的探索。重读和重复进出不会重复解锁。
            </p>
            <div className="achievement-grid">
              {explorationAchievements.map((item) => {
                const date = unlockedAt(item, progress);
                return (
                  <article
                    key={item.id}
                    className={date ? "badge-earned" : "badge-locked"}
                  >
                    <span className="badge-symbol" aria-hidden="true">
                      {item.symbol}
                    </span>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    <small>
                      {date ? `已点亮 · ${date.slice(0, 10)}` : "尚未点亮"}
                    </small>
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <p className="achievement-note">
              这里的每个日期，都来自你们真实的经历，由手账台记录后发布。
            </p>
            <div className="achievement-grid life-badges">
              {Object.entries(lifeMilestones).map(([key, template]) => {
                const record = milestones.find((item) => item.key === key);
                return record ? (
                  <LifeBadge
                    key={key}
                    record={record}
                    symbol={template.symbol}
                    onOpen={onOpen}
                  />
                ) : (
                  <article key={key} className="badge-locked">
                    <span className="badge-symbol" aria-hidden="true">
                      {template.symbol}
                    </span>
                    <h3>{template.title}</h3>
                    <p>故事还等你们亲手记下。</p>
                    <small>待记录</small>
                  </article>
                );
              })}
              {milestones
                .filter((item) => item.key === "custom")
                .map((item) => (
                  <LifeBadge
                    key={item.storyId}
                    record={item}
                    symbol="✦"
                    onOpen={onOpen}
                  />
                ))}
            </div>
            <a className="milestone-manage-link" href="#manage">
              去手账台记录生活里程碑 →
            </a>
          </>
        )}
      </div>
    </dialog>
  );
}

function LifeBadge({
  record,
  symbol,
  onOpen,
}: {
  record: PublishedMilestone;
  symbol: string;
  onOpen: (id: string) => void;
}) {
  return (
    <article className="badge-earned">
      <span className="badge-symbol" aria-hidden="true">
        {symbol}
      </span>
      <h3>{record.title}</h3>
      <p>{record.date}</p>
      <button className="primary-button" onClick={() => onOpen(record.storyId)}>
        读这段故事
      </button>
      {record.relatedStoryId && (
        <button
          className="text-button"
          onClick={() => onOpen(record.relatedStoryId!)}
        >
          翻开关联回忆 →
        </button>
      )}
    </article>
  );
}
