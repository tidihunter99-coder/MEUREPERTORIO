import { initialWorkspace, loadWorkspace, withBuiltInSongs, type Workspace } from "@/lib/repertoire";

const DB_NAME = "meurepertorio-offline";
const STORE_NAME = "documents";
const WORKSPACE_KEY = "workspace";
let pendingDatabaseWrite: Promise<void> = Promise.resolve();
let localStorageFull = false;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readDatabase(): Promise<Workspace | null> {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(WORKSPACE_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
}

async function writeDatabase(workspace: Workspace): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(workspace, WORKSPACE_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally { db.close(); }
}

export async function loadOfflineWorkspace(): Promise<{ workspace: Workspace; hasSaved: boolean }> {
  const local = loadWorkspace();
  let hasLocal = false;
  try { hasLocal = Boolean(localStorage.getItem("mr-workspace-v2")); } catch { /* Browser storage may be restricted. */ }
  try {
    const stored = await readDatabase();
    if (stored && Array.isArray(stored.songs) && Array.isArray(stored.bands) && Array.isArray(stored.setlists)) {
      if (!hasLocal || stored.updatedAt >= local.updatedAt) return { workspace: withBuiltInSongs(stored), hasSaved: true };
    }
  } catch { /* Private browsing may disable IndexedDB. */ }
  return { workspace: hasLocal ? local : initialWorkspace, hasSaved: hasLocal };
}

export async function saveOfflineWorkspace(workspace: Workspace): Promise<void> {
  const databaseWrite = pendingDatabaseWrite.then(() => writeDatabase(workspace));
  pendingDatabaseWrite = databaseWrite.catch(() => {});
  const results = await Promise.allSettled([
    databaseWrite,
    Promise.resolve().then(() => {
      if (localStorageFull) throw new Error("Local storage quota reached");
      try { localStorage.setItem("mr-workspace-v2", JSON.stringify(workspace)); }
      catch (error) { localStorageFull = true; throw error; }
    }),
  ]);
  if (results.every(result => result.status === "rejected")) throw new Error("No browser storage available");
}
