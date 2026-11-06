import {
  emptyArchive,
  validateArchive,
  validateEntry,
  type MemoryArchive,
  type MemoryEntry,
  type PhotoAsset,
} from "./model";

export interface MemoryRepository {
  load(): Promise<MemoryArchive>;
  save(
    entry: MemoryEntry,
    assets: PhotoAsset[],
    expectedRevision: string | null,
  ): Promise<MemoryArchive>;
  remove(id: string, expectedRevision: string): Promise<MemoryArchive>;
  replace(
    archive: MemoryArchive,
    expectedRevision: string,
  ): Promise<MemoryArchive>;
}

const DATABASE_NAME = "our-little-world:content";
const STORE = "library";
const KEY = "current";

function connect(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let blocked = false;
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => {
      if (blocked) {
        request.result.close();
        return;
      }
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () =>
      reject(new Error("无法打开本机内容库，请允许网站存储后重试"));
    request.onblocked = () => {
      blocked = true;
      reject(new Error("内容库被另一个页面占用，请关闭其他小屋页面后重试"));
    };
  });
}

/** Read and write in one transaction: concurrent tabs cannot silently overwrite an edit. */
async function transaction(
  mode: IDBTransactionMode,
  change?: (current: MemoryArchive) => MemoryArchive,
): Promise<MemoryArchive> {
  const database = await connect();
  return new Promise((resolve, reject) => {
    let result: MemoryArchive;
    let failure: Error | undefined;
    const task = database.transaction(STORE, mode);
    const store = task.objectStore(STORE);
    const request = store.get(KEY);
    request.onsuccess = () => {
      try {
        const current = request.result
          ? validateArchive(request.result)
          : emptyArchive();
        result = change ? validateArchive(change(current)) : current;
        if (change) store.put(result, KEY);
      } catch (error) {
        failure =
          error instanceof DOMException && error.name === "QuotaExceededError"
            ? new Error("内容未保存：存储空间不足，请导出备份后重试")
            : error instanceof Error
              ? error
              : new Error("内容保存失败");
        task.abort();
      }
    };
    task.oncomplete = () => {
      database.close();
      resolve(result);
    };
    task.onabort = task.onerror = () => {
      database.close();
      reject(
        failure ??
          new Error(
            "内容未保存：可能是存储空间不足或浏览器禁止写入，请导出备份后重试",
          ),
      );
    };
  });
}

export const memoryRepository: MemoryRepository = {
  load: () => transaction("readonly"),
  save: (value, addedAssets, expectedRevision) => {
    const entry = validateEntry(value);
    return transaction("readwrite", (current) => {
      const previous = current.entries.find((item) => item.id === entry.id);
      if ((previous?.revision ?? null) !== expectedRevision)
        throw new Error("这条内容已在其他页面修改或删除，请先重新载入再编辑");
      const assets = new Map(current.assets.map((asset) => [asset.id, asset]));
      for (const asset of addedAssets) {
        if (assets.has(asset.id))
          throw new Error("图片编号冲突，请重新添加图片");
        assets.set(asset.id, asset);
      }
      return {
        version: 1,
        revision: crypto.randomUUID(),
        entries: [
          ...current.entries.filter((item) => item.id !== entry.id),
          entry,
        ],
        assets: [...assets.values()],
      };
    });
  },
  remove: (id, expectedRevision) =>
    transaction("readwrite", (current) => {
      if (
        current.entries.find((entry) => entry.id === id)?.revision !==
        expectedRevision
      )
        throw new Error("这条内容已变化，请重新载入后再删除");
      return {
        ...current,
        revision: crypto.randomUUID(),
        entries: current.entries.filter((entry) => entry.id !== id),
      };
    }),
  replace: (archive, expectedRevision) =>
    transaction("readwrite", (current) => {
      if (current.revision !== expectedRevision)
        throw new Error("准备导入时内容库已变化，请重新选择备份文件");
      return { ...archive, revision: crypto.randomUUID() };
    }),
};
