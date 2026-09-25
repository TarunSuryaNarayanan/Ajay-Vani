import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { OfflineInterview } from '../types';

interface AjayVaniDB extends DBSchema {
  interviews: {
    key: string;
    value: OfflineInterview;
    indexes: { 'by-synced': number };
  };
}

const DB_NAME = 'ajay-vani-db';
const DB_VERSION = 1;

class OfflineStorageManager {
  private dbPromise: Promise<IDBPDatabase<AjayVaniDB>> | null = null;

  constructor() {
    this.initDB();
  }

  private initDB() {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return;
    }

    this.dbPromise = openDB<AjayVaniDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('interviews')) {
          const store = db.createObjectStore('interviews', { keyPath: 'id' });
          store.createIndex('by-synced', 'isSynced' as any);
        }
      }
    });
  }

  public async saveInterview(interview: OfflineInterview): Promise<void> {
    try {
      if (this.dbPromise) {
        const db = await this.dbPromise;
        await db.put('interviews', interview);
        return;
      }
    } catch (e) {
      console.warn("IndexedDB put failed, falling back to localStorage", e);
    }

    // LocalStorage fallback
    try {
      const existing = this.getLocalStorageInterviews();
      const filtered = existing.filter(i => i.id !== interview.id);
      filtered.push(interview);
      localStorage.setItem('offline_interviews', JSON.stringify(filtered));
    } catch (e) {
      console.error("Storage error:", e);
    }
  }

  public async getUnsyncedInterviews(): Promise<OfflineInterview[]> {
    try {
      if (this.dbPromise) {
        const db = await this.dbPromise;
        const all = await db.getAll('interviews');
        return all.filter(item => !item.isSynced);
      }
    } catch (e) {
      console.warn("IndexedDB getAll failed, using localStorage", e);
    }

    return this.getLocalStorageInterviews().filter(i => !i.isSynced);
  }

  public async getAllInterviews(): Promise<OfflineInterview[]> {
    try {
      if (this.dbPromise) {
        const db = await this.dbPromise;
        return await db.getAll('interviews');
      }
    } catch (e) {
      console.warn("IndexedDB getAll failed, using localStorage", e);
    }

    return this.getLocalStorageInterviews();
  }

  public async markAsSynced(ids: string[]): Promise<void> {
    try {
      if (this.dbPromise) {
        const db = await this.dbPromise;
        const tx = db.transaction('interviews', 'readwrite');
        for (const id of ids) {
          const item = await tx.store.get(id);
          if (item) {
            item.isSynced = true;
            await tx.store.put(item);
          }
        }
        await tx.done;
      }
    } catch (e) {
      console.warn("IndexedDB markAsSynced error", e);
    }

    const items = this.getLocalStorageInterviews();
    const updated = items.map(item => ids.includes(item.id) ? { ...item, isSynced: true } : item);
    localStorage.setItem('offline_interviews', JSON.stringify(updated));
  }

  private getLocalStorageInterviews(): OfflineInterview[] {
    try {
      const raw = localStorage.getItem('offline_interviews');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}

export const offlineStorage = new OfflineStorageManager();
