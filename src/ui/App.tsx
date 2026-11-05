import { useEffect, useRef, useState } from "react";
import { rooms, stories } from "../content/world";
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

export function App() {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [nearby, setNearby] = useState<string | null>(null);
  const [roomId, setRoomId] = useState("living-room");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [backgroundPaused, setBackgroundPaused] = useState(false);
  const openingChecked = useRef(false);
  const book = useStoryBook();
  const room = rooms[roomId];
  const bridge = useRef<GameBridge>({
    paused: true,
    direction: null,
    interactRequested: false,
    onReady: () => setReady(true),
    onNearby: setNearby,
    onStory: () => {},
    onRoom: setRoomId,
  });

  function clearInput() {
    bridge.current.direction = null;
    bridge.current.interactRequested = false;
  }

  function openStory(id: string, fromStart = false) {
    clearInput();
    bridge.current.paused = true;
    setLibraryOpen(false);
    book.open(id, fromStart);
  }
  // Callbacks must see current reading state; the Phaser instance remains stable.
  bridge.current.onStory = (id) => openStory(id);

  useEffect(() => {
    bridge.current.paused =
      !ready || Boolean(book.session) || libraryOpen || backgroundPaused;
  }, [ready, book.session, libraryOpen, backgroundPaused]);

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
    book.close(reason);
  }

  const controlsDisabled =
    !ready || backgroundPaused || Boolean(book.session) || libraryOpen;

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="wordmark" href="#home">
          <span className="little-house" aria-hidden="true">
            ⌂
          </span>{" "}
          我们的小小世界
        </a>
        <span className="version-tag">
          <span /> 小屋与回忆 · MILESTONE 1
        </span>
      </header>
      <main id="home">
        <section className="intro">
          <p className="eyebrow">A LITTLE HOME, A LOT OF US</p>
          <h1>
            把喜欢，住成一间<span>小屋。</span>
          </h1>
          <p className="intro-note">有甜甜的偏爱，也有想和你慢慢读的故事。</p>
        </section>
        <section className="game-section" aria-label="小屋探索">
          <div className="room-bar">
            <div className="room-label">
              <span className="room-dot" />
              <strong data-testid="room-name">{room.name}</strong>
              <span className="room-subtitle">
                /{" "}
                {room.theme === "living"
                  ? "OUR LIVING ROOM"
                  : "SOMETHING SWEET"}
              </span>
            </div>
            <button
              className="library-button"
              disabled={!ready || Boolean(book.session)}
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
            {backgroundPaused && ready && !book.session && !libraryOpen && (
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
            <span className="demo-label">
              演示人物与故事 · 喜好来自你的描述
            </span>
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
        </section>
        <section className="field-notes" aria-label="小屋指南">
          <div className="notes-heading">
            <span className="eyebrow">A HOME THAT GROWS WITH US</span>
            <h2>两间房，一本回忆册</h2>
          </div>
          <article>
            <span className="note-icon">⌂</span>
            <div>
              <h3>客厅右侧的小门</h3>
              <p>去厨房，打开冰箱里的口味小本。</p>
            </div>
          </article>
          <article>
            <span className="note-icon">▤</span>
            <div>
              <h3>故事随时回来再读</h3>
              <p>暂停、跳过、回看，按你的节奏来。</p>
            </div>
          </article>
        </section>
      </main>
      <footer>
        <span>一间小屋，慢慢装下我们的每一天。</span>
        <span>BUILT FOR TWO · 2026</span>
      </footer>
      {book.session && (
        <StoryReader
          key={book.session.storyId}
          story={stories[book.session.storyId]}
          session={book.session}
          backgroundPaused={backgroundPaused}
          onResume={() => setBackgroundPaused(false)}
          onMove={book.move}
          onClose={closeStory}
        />
      )}
      {libraryOpen && (
        <MemoryLibrary
          progress={book.progress}
          onOpen={openStory}
          onClose={() => setLibraryOpen(false)}
        />
      )}
    </div>
  );
}
