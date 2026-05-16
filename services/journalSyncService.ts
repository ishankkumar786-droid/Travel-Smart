import { journalAPI } from './api';
import { storageService } from './storageService';

/**
 * Journal Sync Service
 * Single source of truth for journal operations.
 * Abstracts online/offline logic from UI components.
 */

const generateLocalId = () =>
  `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const journalSyncService = {
  /**
   * Load entries — tries API first, falls back to cache
   */
  loadEntries: async (tripId: string): Promise<{ entries: any[]; isOffline: boolean }> => {
    try {
      const res = await journalAPI.getEntries(tripId);
      const entries = res.data.data.entries || [];
      // Cache for offline use
      await storageService.saveJournalEntries(tripId, entries);
      return { entries, isOffline: false };
    } catch {
      // Offline fallback
      const cached = await storageService.getCachedJournalEntries(tripId);
      return { entries: cached, isOffline: true };
    }
  },

  /**
   * Create a new entry — saves to API if online, otherwise locally
   */
  createEntry: async (
    tripId: string,
    type: string,
    content: any
  ): Promise<{ entry: any; synced: boolean }> => {
    const localId = generateLocalId();
    const localEntry = {
      _id: localId,
      localId,
      type,
      content,
      synced: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      // Try API first
      const res = await journalAPI.addEntry(tripId, { type, content, localId });
      const serverEntry = res.data.data.entry;

      // Update local cache with server entry
      const entries = await storageService.getCachedJournalEntries(tripId);
      entries.unshift(serverEntry);
      await storageService.saveJournalEntries(tripId, entries);

      return { entry: serverEntry, synced: true };
    } catch {
      // Save locally for later sync
      await storageService.addLocalEntry(tripId, localEntry);
      return { entry: localEntry, synced: false };
    }
  },

  /**
   * Update an existing entry
   */
  updateEntry: async (
    tripId: string,
    entryId: string,
    data: { content?: any; type?: string }
  ): Promise<boolean> => {
    try {
      await journalAPI.updateEntry(tripId, entryId, data);

      // Update local cache
      const entries = await storageService.getCachedJournalEntries(tripId);
      const updated = entries.map((e: any) => {
        if (e._id === entryId || e.localId === entryId) {
          return {
            ...e,
            content: data.content ? { ...e.content, ...data.content } : e.content,
            type: data.type || e.type,
          };
        }
        return e;
      });
      await storageService.saveJournalEntries(tripId, updated);
      return true;
    } catch {
      // Update locally anyway
      const entries = await storageService.getCachedJournalEntries(tripId);
      const updated = entries.map((e: any) => {
        if (e._id === entryId || e.localId === entryId) {
          return {
            ...e,
            content: data.content ? { ...e.content, ...data.content } : e.content,
            type: data.type || e.type,
          };
        }
        return e;
      });
      await storageService.saveJournalEntries(tripId, updated);
      return false;
    }
  },

  /**
   * Delete an entry
   */
  deleteEntry: async (tripId: string, entryId: string): Promise<boolean> => {
    // Remove from local cache immediately
    const entries = await storageService.getCachedJournalEntries(tripId);
    const filtered = entries.filter(
      (e: any) => e._id !== entryId && e.localId !== entryId
    );
    await storageService.saveJournalEntries(tripId, filtered);

    try {
      // If it's a server entry (not local-only), delete from API
      if (!entryId.startsWith('local_')) {
        await journalAPI.deleteEntry(tripId, entryId);
      }
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Sync pending offline entries to server
   */
  syncPendingEntries: async (tripId: string): Promise<number> => {
    try {
      const unsynced = await storageService.getUnsyncedEntries(tripId);
      if (unsynced.length === 0) return 0;

      const res = await journalAPI.syncEntries(tripId, unsynced);
      const syncedIds = res.data.data.syncedIds || [];

      // Mark as synced locally
      await storageService.markEntriesSynced(
        tripId,
        unsynced.map((e: any) => e.localId)
      );

      // Reload from server for consistency
      const freshRes = await journalAPI.getEntries(tripId);
      const freshEntries = freshRes.data.data.entries || [];
      await storageService.saveJournalEntries(tripId, freshEntries);

      return syncedIds.length;
    } catch {
      return 0;
    }
  },
};
