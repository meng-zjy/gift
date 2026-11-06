import { useCallback, useState } from "react";
import { MemoryEditor } from "./MemoryEditor";
import {
  kindNames,
  type MemoryArchive,
  type MemoryEntry,
  type MemoryKind,
  type PhotoAsset,
} from "../../memories/model";
import { memoryRepository } from "../../memories/repository";
import { exportBackup, importBackup } from "../../memories/backup";
import type { useMemories } from "../../memories/useMemories";

export function MemoryManager({
  library,
  onDirty,
}: {
  library: ReturnType<typeof useMemories>;
  onDirty: (dirty: boolean) => void;
}) {
  const [selected, setSelected] = useState<{
    entry?: MemoryEntry;
    kind: MemoryKind;
    key: string;
  } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [pending, setPending] = useState<{
    archive: MemoryArchive;
    expectedRevision: string;
  } | null>(null);
  const changed = useCallback(
    (value: boolean) => {
      setDirty(value);
      onDirty(value);
    },
    [onDirty],
  );
  const entries = [...library.archive.entries].sort(
    (a, b) =>
      b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt),
  );
  const visible = entries.filter(
    (entry) =>
      (filter === "all" || entry.kind === filter || entry.status === filter) &&
      `${entry.title} ${entry.body} ${entry.place}`.includes(query),
  );

  function canLeave() {
    return !dirty || window.confirm("还有未保存的修改，确定放弃这次编辑吗？");
  }
  function select(entry?: MemoryEntry, kind: MemoryKind = "diary") {
    if (busy || !canLeave()) return;
    changed(false);
    setSelected({ entry, kind: entry?.kind ?? kind, key: crypto.randomUUID() });
    setError("");
    setNotice("");
  }

  async function save(
    entry: MemoryEntry,
    assets: PhotoAsset[],
    expectedRevision: string | null,
  ) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const next = await memoryRepository.save(entry, assets, expectedRevision);
      library.accept(next);
      changed(false);
      setSelected({
        entry: next.entries.find((item) => item.id === entry.id),
        kind: entry.kind,
        key: crypto.randomUUID(),
      });
      setNotice(
        entry.status === "published"
          ? "已保存并发布到小屋。"
          : "草稿已保存在这台浏览器。",
      );
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "保存失败，请重试");
    } finally {
      setBusy(false);
    }
  }

  async function remove(entry: MemoryEntry) {
    if (
      busy ||
      !canLeave() ||
      !window.confirm(
        `确定删除「${entry.title}」和它不再使用的照片吗？此操作无法直接撤销，请先保留备份。`,
      )
    )
      return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      library.accept(await memoryRepository.remove(entry.id, entry.revision));
      setSelected(null);
      changed(false);
      setNotice("已删除这条内容。");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "删除失败");
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      // Read the committed database so a stale tab cannot export an outdated in-memory snapshot.
      const blob = await exportBackup(await memoryRepository.load());
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `小屋回忆-${new Date().toISOString().slice(0, 10)}.memory-backup.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice(
        "已生成内容备份，请确认下载文件已保存。未保存的编辑不包含在备份里。",
      );
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "备份失败");
    } finally {
      setBusy(false);
    }
  }

  async function prepareImport(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    setNotice("");
    setPending(null);
    try {
      const archive = await importBackup(file);
      const current = await memoryRepository.load();
      setPending({ archive, expectedRevision: current.revision });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "无法读取备份");
    } finally {
      setBusy(false);
    }
  }

  async function confirmImport() {
    if (!pending || !canLeave()) return;
    setBusy(true);
    setError("");
    try {
      library.accept(
        await memoryRepository.replace(
          pending.archive,
          pending.expectedRevision,
        ),
      );
      setPending(null);
      setSelected(null);
      changed(false);
      setNotice("内容与照片已恢复。阅读进度仍由当前浏览器分别记录。");
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "恢复失败，原内容未改变",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="manager-shell">
      <header className="manager-header">
        <a className="wordmark" href="#home">
          <span className="little-house">⌂</span> 我们的小小世界
        </a>
        <a className="back-to-game" href="#home">
          回到小屋 →
        </a>
      </header>
      <main className="manager-main">
        <section className="manager-intro">
          <div>
            <span className="eyebrow">属于我们的一本手账</span>
            <h1>把日子，慢慢收好。</h1>
            <p>记下你对她的喜欢，也收藏她给你的回应。</p>
          </div>
          <div className="manager-count">
            <strong>{entries.length}</strong>
            <span>
              段回忆 ·{" "}
              {entries.filter((entry) => entry.status === "published").length}{" "}
              段已发布
            </span>
          </div>
        </section>
        <div className="manager-toolbar">
          <div className="new-memory-buttons">
            {(Object.keys(kindNames) as MemoryKind[]).map((kind) => (
              <button
                key={kind}
                disabled={busy || Boolean(pending)}
                onClick={() => select(undefined, kind)}
              >
                ＋ 新建{kindNames[kind]}
              </button>
            ))}
          </div>
          <div className="backup-buttons">
            <button
              disabled={busy || Boolean(pending)}
              onClick={() => void download()}
            >
              导出备份
            </button>
            <label
              className={`import-backup ${busy || pending ? "is-disabled" : ""}`}
            >
              导入备份
              <input
                type="file"
                accept=".json,application/json"
                aria-label="导入备份"
                disabled={busy || Boolean(pending)}
                onChange={(event) => {
                  void prepareImport(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </label>
          </div>
        </div>
        <p className="manager-storage-note">
          内容保存在当前浏览器。更换设备、清理网站数据或正式上线前，请先导出备份；其他设备可通过导入恢复。
        </p>
        {(error || library.error) && (
          <div className="manager-error" role="alert">
            <p>{error || library.error}</p>
            <button
              disabled={busy}
              onClick={() => {
                void library.refresh();
                setError("");
              }}
            >
              重新载入内容库
            </button>
          </div>
        )}
        {notice && (
          <p className="manager-notice" role="status">
            {notice}
          </p>
        )}
        {busy && (
          <p className="manager-working" role="status">
            正在处理，请稍候…
          </p>
        )}
        {pending && (
          <section
            className="import-review"
            aria-labelledby="import-review-title"
          >
            <h2 id="import-review-title">确认恢复这份备份？</h2>
            <p>
              备份包含 {pending.archive.entries.length} 条内容、
              {pending.archive.assets.length} 张照片，其中{" "}
              {
                pending.archive.entries.filter(
                  (entry) => entry.status === "published",
                ).length
              }{" "}
              条已发布。
            </p>
            <p>
              确认后会替换本机现有的 {entries.length}{" "}
              条内容。请先导出需要保留的内容；阅读进度不会导入或清空。
            </p>
            <button
              className="secondary-button"
              disabled={busy}
              onClick={() => setPending(null)}
            >
              取消导入
            </button>
            <button
              className="primary-button"
              disabled={busy}
              onClick={() => void confirmImport()}
            >
              确认替换本机内容
            </button>
          </section>
        )}
        <div className="manager-workspace" inert={pending ? true : undefined}>
          <aside className="memory-index" aria-label="内容列表">
            <div className="index-filters">
              <label>
                搜索回忆
                <input
                  type="search"
                  placeholder="标题、正文、地点"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <label>
                筛选内容
                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                >
                  <option value="all">全部内容</option>
                  {Object.entries(kindNames).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                  <option value="draft">仅草稿</option>
                  <option value="published">仅已发布</option>
                </select>
              </label>
            </div>
            {!visible.length && (
              <p className="index-empty">
                {entries.length
                  ? "没有找到匹配的回忆。"
                  : "手账还是空的。先新建一篇日记，或留一本相册的位置。"}
              </p>
            )}
            <div className="memory-index-list">
              {visible.map((entry) => (
                <article
                  key={entry.id}
                  className={selected?.entry?.id === entry.id ? "selected" : ""}
                >
                  <button
                    className="entry-select"
                    disabled={busy}
                    onClick={() => select(entry)}
                  >
                    <span className="entry-type">
                      {kindNames[entry.kind]}{" "}
                      <span>
                        {entry.status === "draft" ? "草稿" : "已发布"}
                      </span>
                    </span>
                    <strong>{entry.title}</strong>
                    <small>
                      {entry.date}
                      {entry.place ? ` · ${entry.place}` : ""}
                    </small>
                  </button>
                  <button
                    className="delete-entry"
                    disabled={busy}
                    aria-label={`删除 ${entry.title}`}
                    onClick={() => void remove(entry)}
                  >
                    删除
                  </button>
                </article>
              ))}
            </div>
          </aside>
          {selected ? (
            <MemoryEditor
              key={selected.key}
              entry={selected.entry}
              kind={selected.kind}
              storedAssets={library.archive.assets}
              entries={library.archive.entries}
              busy={busy}
              onSave={save}
              onDirty={changed}
            />
          ) : (
            <section className="editor-welcome">
              <div className="notebook-mark" aria-hidden="true">
                ▤<span>♡</span>
              </div>
              <h2>有些小事，值得一页。</h2>
              <p>
                选择左边的回忆继续编辑，
                <br />
                或从上方新建一篇日记、一句话、一组照片。
              </p>
              <div className="placement-guide">
                <span>日记 → 二楼卧室书桌</span>
                <span>说过的话 → 屋里的小人</span>
                <span>出游相册 → 二楼照片展板</span>
                <span>生活里程碑 → 负一楼成就长廊</span>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
