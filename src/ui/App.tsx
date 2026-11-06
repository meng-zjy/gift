import { useEffect, useRef, useState } from "react";
import { rooms } from "../content/world";
import type { buildCatalog } from "../memories/catalog";
import type { CollectionKind } from "../game/types";
import { useExploration } from "../achievements/useExploration";
import { AchievementGallery } from "./AchievementGallery";
import { resetExperience } from "./resetExperience";
import { MemoryCollection } from "./MemoryCollection";
import type { Direction, GameBridge } from "../game/types";
import { MemoryLibrary } from "./MemoryLibrary";
import { StoryReader } from "./StoryReader";
import { useStoryBook } from "./useStoryBook";

const directions: { direction: Direction; label: string; symbol: string }[] = [
  { direction: "up", label: "向上移动", symbol: "↑" },
  { direction: "left", label: "向左移动", symbol: "←" },
  { direction: "down", label: "向下移动", symbol: "↓" },
  { direction: "right", label: "向右移动", symbol: "→" },
];

export function App({
  catalog,
  contentError,
}: {
  catalog: ReturnType<typeof buildCatalog>;
  contentError: string;
}) {
  const stories = catalog.stories;
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [nearby, setNearby] = useState<string | null>(null);
  const [roomId, setRoomId] = useState("living-room");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [collection, setCollection] = useState<CollectionKind | null>(null);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [transition, setTransition] = useState<string | null>(null);
  const [backgroundPaused, setBackgroundPaused] = useState(false);
  const openingChecked = useRef(false);
  const book = useStoryBook(stories);
  const exploration = useExploration();
  const room = rooms[roomId];
  const bridge = useRef<GameBridge>({
    paused: true,
    direction: null,
    interactRequested: false,
    onReady: () => setReady(true),
    onNearby: setNearby,
    onStory: () => {},
    onCollection: () => {},
    onRoom: setRoomId,
    onTransition: setTransition,
    onAchievements: () => {},
  });

  function clearInput() {
    bridge.current.direction = null;
    bridge.current.interactRequested = false;
  }

  function openStory(id: string, fromStart = false, keepOverlay = false) {
    clearInput();
    bridge.current.paused = true;
    setLibraryOpen(false);
    if (!keepOverlay) {
      setCollection(null);
      setAchievementsOpen(false);
    }
    book.open(id, fromStart);
  }
  // Callbacks must see current reading state; the Phaser instance remains stable.
  bridge.current.onStory = (id) => openStory(id);
  bridge.current.onCollection = (kind) => {
    const ids = catalog.collections[kind];
    if (ids.length === 1 && kind !== "album") {
      openStory(ids[0]);
      return;
    }
    clearInput();
    bridge.current.paused = true;
    setCollection(kind);
  };
  bridge.current.onRoom = (id) => {
    setRoomId(id);
    exploration.visit(id);
  };
  bridge.current.onAchievements = () => {
    clearInput();
    bridge.current.paused = true;
    setAchievementsOpen(true);
  };

  useEffect(() => {
    bridge.current.paused =
      !ready ||
      Boolean(book.session) ||
      libraryOpen ||
      Boolean(collection) ||
      achievementsOpen ||
      backgroundPaused;
  }, [
    ready,
    book.session,
    libraryOpen,
    collection,
    achievementsOpen,
    backgroundPaused,
  ]);

  useEffect(() => {
    let disposed = false;
    let game: { destroy: (removeCanvas: boolean) => void } | undefined;
    import("../game/createGame")
      .then(({ createGame }) => {
        if (!disposed && host.current)
          game = createGame(host.current, bridge.current);
      })
      .catch(() => {
        if (!disposed) setFailed(true);
      });
    return () => {
      disposed = true;
      game?.destroy(true);
    };
  }, []);

  useEffect(() => {
    if (!ready || openingChecked.current) return;
    openingChecked.current = true;
    if (!book.progress.opening) openStory("opening");
  }, [ready]);

  useEffect(() => {
    const pause = () => {
      clearInput();
      bridge.current.paused = true;
      setBackgroundPaused(true);
    };
    const onVisibility = () => {
      if (document.hidden) pause();
    };
    window.addEventListener("blur", pause);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("blur", pause);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  function closeStory(reason: "close" | "skip" | "finish") {
    clearInput();
    if (reason === "finish" && book.session)
      exploration.complete(stories[book.session.storyId]?.kind ?? "");
    book.close(reason);
    // Closing and an immediate movement key can arrive before React's effect runs.
    // Keep Phaser's pause flag in step with the remaining overlays in this event.
    bridge.current.paused =
      !ready || Boolean(collection) || achievementsOpen || backgroundPaused;
  }

  const controlsDisabled =
    !ready ||
    backgroundPaused ||
    Boolean(book.session) ||
    libraryOpen ||
    Boolean(collection) ||
    achievementsOpen ||
    Boolean(transition);

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="wordmark" href="#home">
          <span className="little-house" aria-hidden="true">
            ⌂
          </span>{" "}
          我们的小小世界
        </a>
        <div className="header-actions">
          <span className="version-tag">
            <span /> 今天也一起，慢慢来
          </span>
          <a className="manage-link" href="#manage">
            手账台 ↗
          </a>
        </div>
      </header>
      <main id="home">
        <section className="game-section" aria-label="小屋探索">
          <div className="room-bar">
            <div className="room-label">
              <span className="room-dot" />
              <span className="floor-badge" data-testid="floor-name">
                {room.floor === -1 ? "B1" : `${room.floor}F`}
              </span>
              <strong data-testid="room-name">{room.name}</strong>
              <span className="room-subtitle">
                /{" "}
                {room.theme === "living"
                  ? "OUR LIVING ROOM"
                  : room.theme === "kitchen"
                    ? "SOMETHING SWEET"
                    : "A QUIET PLACE"}
              </span>
            </div>
            <button
              className="library-button"
              disabled={
                !ready ||
                Boolean(book.session) ||
                Boolean(collection) ||
                achievementsOpen ||
                Boolean(transition)
              }
              onClick={() => {
                clearInput();
                bridge.current.paused = true;
                setLibraryOpen(true);
              }}
            >
              ▤ 回忆册 <span>{Object.keys(book.progress).length}</span>
            </button>
          </div>
          <div className="game-frame">
            <div ref={host} className="game-canvas" data-testid="game-host" />
            {!ready && !failed && (
              <div className="game-message" role="status">
                正在点亮小屋里的灯…
              </div>
            )}
            {failed && (
              <div className="game-message" role="alert">
                <p>小屋暂时没有打开，请刷新重试。</p>
                <button onClick={() => location.reload()}>重新打开</button>
              </div>
            )}
            {backgroundPaused &&
              ready &&
              !book.session &&
              !libraryOpen &&
              !collection &&
              !achievementsOpen &&
              !transition && (
                <div className="game-message pause-message">
                  <span>小屋在等你</span>
                  <button
                    className="primary-button"
                    onClick={() => setBackgroundPaused(false)}
                  >
                    继续探索 →
                  </button>
                </div>
              )}
            {transition && (
              <div className="floor-transition" role="status">
                {transition}
              </div>
            )}
            {ready && !backgroundPaused && (
              <span className="room-stamp">HOME SWEET HOME</span>
            )}
          </div>
          <div className="interaction-bar" aria-live="polite">
            <div>
              <span className="sparkle">✦</span>
              <span>{nearby ? `发现了：${nearby}` : room.hint}</span>
            </div>
            <button
              className="interact-button"
              disabled={!nearby || controlsDisabled}
              onClick={() => {
                bridge.current.interactRequested = true;
              }}
            >
              <kbd>E</kbd> {nearby || "靠近后互动"} <span>↗</span>
            </button>
          </div>
          <div className="control-strip">
            <div className="keyboard-help">
              <span>
                <kbd>W A S D</kbd> / <kbd>↑ ← ↓ →</kbd> 移动
              </span>
              <span>
                <kbd>E</kbd> / <kbd>空格</kbd> 互动与进门
              </span>
              <span>
                <kbd>Esc</kbd> 离开阅读
              </span>
            </div>
          </div>
          <div className="touch-controls" aria-label="触屏方向控制">
            <div className="direction-pad">
              {directions.map(({ direction, label, symbol }) => (
                <button
                  key={direction}
                  className={`direction-button direction-${direction}`}
                  aria-label={label}
                  disabled={controlsDisabled}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.currentTarget.setPointerCapture(event.pointerId);
                    bridge.current.direction = direction;
                  }}
                  onPointerUp={() => {
                    bridge.current.direction = null;
                  }}
                  onPointerCancel={() => {
                    bridge.current.direction = null;
                  }}
                  onLostPointerCapture={() => {
                    bridge.current.direction = null;
                  }}
                >
                  {symbol}
                </button>
              ))}
              <span className="pad-center">✦</span>
            </div>
            <p>
              按住方向键走动
              <br />
              靠近物件或房门后，点击互动按钮
            </p>
          </div>
          {book.storageFailed && (
            <p className="storage-notice" role="status">
              浏览器暂时无法保存阅读进度，本次仍可继续。请允许网站存储后再次阅读以重试保存。
            </p>
          )}
          {contentError && (
            <p className="content-error" role="status">
              本机回忆暂时无法载入，可继续体验演示。
              <a href="#manage">到手账台重试</a>
            </p>
          )}
        </section>
      </main>
      {exploration.failed && (
        <p className="content-error" role="status">
          本次探索可以继续，但浏览器暂时无法保存探索印记。
        </p>
      )}
      {exploration.toast && !book.session && !transition && (
        <div className="achievement-toast" role="status">
          ✦ 探索印记已点亮 · {exploration.toast}
        </div>
      )}
      {collection && (
        <MemoryCollection
          kind={collection}
          ids={catalog.collections[collection]}
          stories={stories}
          onOpen={(id) => openStory(id, false, collection === "album")}
          onClose={() => setCollection(null)}
        />
      )}
      {achievementsOpen && (
        <AchievementGallery
          progress={exploration.progress}
          milestones={catalog.milestones}
          onOpen={(id) => openStory(id, false, true)}
          onClose={() => setAchievementsOpen(false)}
        />
      )}
      {book.session && stories[book.session.storyId] && (
        <StoryReader
          key={book.session.storyId}
          story={stories[book.session.storyId]}
          session={book.session}
          backgroundPaused={backgroundPaused}
          onResume={() => setBackgroundPaused(false)}
          onMove={book.move}
          onClose={closeStory}
          returnLabel={
            collection === "album"
              ? "照片展板"
              : achievementsOpen
                ? "成就长廊"
                : undefined
          }
        />
      )}
      {libraryOpen && (
        <MemoryLibrary
          catalog={stories}
          progress={book.progress}
          onOpen={openStory}
          onClose={() => setLibraryOpen(false)}
          onReset={() => {
            if (!resetExperience()) return false;
            window.location.reload();
            return true;
          }}
        />
      )}
    </div>
  );
}
