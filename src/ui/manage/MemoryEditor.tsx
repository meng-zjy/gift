import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  kindNames,
  MAX_PHOTOS,
  voiceNames,
  type MemoryEntry,
  type MemoryKind,
  type PhotoAsset,
} from "../../memories/model";
import { preparePhoto } from "../../memories/images";
import { usePhotoURLs } from "../../memories/useMemories";
import {
  lifeMilestones,
  type MilestoneKey,
} from "../../achievements/definitions";

function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function newEntry(kind: MemoryKind): MemoryEntry {
  return {
    id: crypto.randomUUID(),
    revision: crypto.randomUUID(),
    kind,
    title: "",
    body: "",
    date: today(),
    place: "",
    voice: "us",
    status: "draft",
    photos: [],
    updatedAt: new Date().toISOString(),
  };
}

export function MemoryEditor({
  entry,
  kind,
  storedAssets,
  entries,
  busy,
  onSave,
  onDirty,
}: {
  entry?: MemoryEntry;
  kind: MemoryKind;
  storedAssets: PhotoAsset[];
  entries: MemoryEntry[];
  busy: boolean;
  onSave: (
    entry: MemoryEntry,
    assets: PhotoAsset[],
    expectedRevision: string | null,
  ) => Promise<void>;
  onDirty: (dirty: boolean) => void;
}) {
  const [initial] = useState(() => entry ?? newEntry(kind));
  const [draft, setDraft] = useState(initial);
  const [added, setAdded] = useState<PhotoAsset[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const assets = useMemo(
    () => [
      ...storedAssets.filter((asset) =>
        initial.photos.some((photo) => photo.id === asset.id),
      ),
      ...added,
    ],
    [storedAssets, initial, added],
  );
  const urls = usePhotoURLs(assets);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  useEffect(() => {
    onDirty(dirty || processing);
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty || processing) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, processing, onDirty]);

  function update<K extends keyof MemoryEntry>(key: K, value: MemoryEntry[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    if (draft.photos.length + files.length > MAX_PHOTOS) {
      setError(`每本相册最多 ${MAX_PHOTOS} 张照片，请减少选择数量`);
      return;
    }
    setProcessing(true);
    setError("");
    try {
      const prepared: PhotoAsset[] = [];
      for (const file of Array.from(files))
        prepared.push({
          id: crypto.randomUUID(),
          blob: await preparePhoto(file),
        });
      setAdded((previous) => [...previous, ...prepared]);
      setDraft((previous) => ({
        ...previous,
        photos: [
          ...previous.photos,
          ...prepared.map((asset) => ({ id: asset.id, caption: "" })),
        ],
      }));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "图片添加失败");
    } finally {
      setProcessing(false);
    }
  }

  function movePhoto(index: number, direction: number) {
    const photos = [...draft.photos];
    [photos[index], photos[index + direction]] = [
      photos[index + direction],
      photos[index],
    ];
    update("photos", photos);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const referenced = new Set(draft.photos.map((photo) => photo.id));
    await onSave(
      {
        ...draft,
        revision: crypto.randomUUID(),
        updatedAt: new Date().toISOString(),
      },
      added.filter((asset) => referenced.has(asset.id)),
      entry?.revision ?? null,
    );
  }

  return (
    <form className="memory-editor" onSubmit={submit} aria-label="回忆编辑器">
      <div className="editor-title">
        <div>
          <span className="eyebrow">
            {entry ? "把这页再写好一点" : "留一个新的位置"}
          </span>
          <h2>
            {entry ? "编辑" : "新建"}
            {kindNames[kind]}
          </h2>
        </div>
        <span className={`edit-state ${dirty ? "is-dirty" : ""}`}>
          {processing
            ? "正在处理照片…"
            : dirty
              ? "尚未保存"
              : entry
                ? "已保存"
                : "等待落笔"}
        </span>
      </div>
      <fieldset disabled={busy || processing}>
        <label>
          标题
          <input
            name="title"
            required
            maxLength={80}
            value={draft.title}
            onChange={(event) => update("title", event.target.value)}
            placeholder={
              kind === "album" ? "那天，我们去了哪里" : "给这段回忆起个名字"
            }
          />
        </label>
        {kind === "milestone" && (
          <div className="editor-fields">
            <label>
              里程碑类型
              <select
                value={draft.milestoneKey ?? "custom"}
                onChange={(event) =>
                  update("milestoneKey", event.target.value as MilestoneKey)
                }
              >
                <option value="custom">自定义里程碑</option>
                {Object.entries(lifeMilestones).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              关联回忆（选填）
              <select
                value={draft.relatedId ?? ""}
                onChange={(event) =>
                  update("relatedId", event.target.value || undefined)
                }
              >
                <option value="">不关联回忆</option>
                {entries
                  .filter(
                    (item) =>
                      item.status === "published" && item.kind !== "milestone",
                  )
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                {draft.relatedId &&
                  !entries.some(
                    (item) =>
                      item.id === draft.relatedId &&
                      item.status === "published",
                  ) && (
                    <option value={draft.relatedId}>
                      原关联回忆未发布或已删除
                    </option>
                  )}
              </select>
            </label>
          </div>
        )}
        <div className="editor-fields">
          <label>
            日期
            <input
              type="date"
              required
              value={draft.date}
              onChange={(event) => update("date", event.target.value)}
            />
          </label>
          <label>
            表达方
            <select
              value={draft.voice}
              onChange={(event) =>
                update("voice", event.target.value as MemoryEntry["voice"])
              }
            >
              {Object.entries(voiceNames).map(([value, name]) => (
                <option value={value} key={value}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="editor-fields">
          <label>
            地点（选填）
            <input
              maxLength={120}
              value={draft.place}
              onChange={(event) => update("place", event.target.value)}
              placeholder="一间甜品店，或一座城市"
            />
          </label>
          <label>
            发布状态
            <select
              value={draft.status}
              onChange={(event) =>
                update("status", event.target.value as MemoryEntry["status"])
              }
            >
              <option value="draft">草稿 · 只在手账台保存</option>
              <option value="published">发布 · 在小屋里展示</option>
            </select>
          </label>
        </div>
        <label>
          {kind === "album" ? "相册说明" : "正文"}
          <textarea
            aria-label={kind === "album" ? "相册说明" : "正文"}
            rows={kind === "album" ? 4 : 10}
            maxLength={20000}
            required={draft.status === "published" && kind !== "album"}
            value={draft.body}
            onChange={(event) => update("body", event.target.value)}
            placeholder={
              kind === "words"
                ? "她说过的话，或你想对她说的话。空一行可以分段。"
                : "写下那天发生的小事。空一行可以分段阅读。"
            }
          />
        </label>
        {kind === "album" && (
          <section className="photo-editor" aria-label="相册照片">
            <div className="photo-section-heading">
              <h3>
                照片{" "}
                <span>
                  {draft.photos.length} / {MAX_PHOTOS}
                </span>
              </h3>
              <label className="upload-photos">
                ＋ 添加照片
                <input
                  type="file"
                  aria-label="添加照片"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(event) => {
                    void addPhotos(event.target.files);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>
            <p className="field-note">
              JPEG、PNG、WebP，单张最多 10 MiB。会自动缩小大图，保留原始比例。
            </p>
            {!draft.photos.length && (
              <div className="photo-empty">
                ▧<p>照片可以一次选多张，再调整顺序和说明。</p>
              </div>
            )}
            <div className="photo-editor-list">
              {draft.photos.map((photo, index) => (
                <article key={photo.id}>
                  <img src={urls[photo.id]} alt={`待保存照片 ${index + 1}`} />
                  <label>
                    第 {index + 1} 张说明
                    <textarea
                      aria-label={`第 ${index + 1} 张说明`}
                      rows={2}
                      maxLength={500}
                      value={photo.caption}
                      onChange={(event) =>
                        update(
                          "photos",
                          draft.photos.map((item) =>
                            item.id === photo.id
                              ? { ...item, caption: event.target.value }
                              : item,
                          ),
                        )
                      }
                    />
                  </label>
                  <div className="photo-actions">
                    <button
                      type="button"
                      disabled={index === 0}
                      aria-label={`上移照片 ${index + 1}`}
                      onClick={() => movePhoto(index, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={index === draft.photos.length - 1}
                      aria-label={`下移照片 ${index + 1}`}
                      onClick={() => movePhoto(index, 1)}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      aria-label={`移除照片 ${index + 1}`}
                      onClick={() =>
                        update(
                          "photos",
                          draft.photos.filter((item) => item.id !== photo.id),
                        )
                      }
                    >
                      移除
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
        {error && (
          <p className="manager-error" role="alert">
            {error}
          </p>
        )}
        <div className="editor-save">
          <p>
            {draft.status === "draft"
              ? "草稿只收在手账台，发布后才会出现在小屋里。"
              : kind === "diary"
                ? "保存后，去二楼卧室书桌翻开这页日记。"
                : kind === "words"
                  ? "保存后，和客厅的小人说说话。"
                  : kind === "album"
                    ? "保存后，去二楼过道的照片展板看看。"
                    : "保存后，去负一楼成就长廊查看。"}
          </p>
          <button className="primary-button" type="submit">
            {busy ? "正在保存…" : "保存修改"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
