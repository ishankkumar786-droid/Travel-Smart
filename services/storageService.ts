import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEYS = {
  TRIPS: 'STC_TRIPS_CACHE',
  ITINERARY_PREFIX: 'STC_ITINERARY_',
  JOURNAL_PREFIX: 'STC_JOURNAL_',
};

/**
 * Storage Service for Offline Access
 */
export const storageService = {
  /**
   * Cache all user trips
   */
  saveTrips: async (trips: any[]) => {
    try {
      await AsyncStorage.setItem(CACHE_KEYS.TRIPS, JSON.stringify(trips));
    } catch (error) {
      console.error('Error caching trips:', error);
    }
  },

  /**
   * Retrieve cached trips
   */
  getCachedTrips: async (): Promise<any[]> => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEYS.TRIPS);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Error getting cached trips:', error);
      return [];
    }
  },

  /**
   * Cache a specific itinerary
   */
  saveItinerary: async (id: string, itinerary: any) => {
    try {
      await AsyncStorage.setItem(`${CACHE_KEYS.ITINERARY_PREFIX}${id}`, JSON.stringify(itinerary));
    } catch (error) {
      console.error(`Error caching itinerary ${id}:`, error);
    }
  },

  /**
   * Retrieve a specific cached itinerary
   */
  getCachedItinerary: async (id: string): Promise<any | null> => {
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_KEYS.ITINERARY_PREFIX}${id}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error(`Error getting cached itinerary ${id}:`, error);
      return null;
    }
  },

  // ========== Journal Methods ==========

  /**
   * Save journal entries for a trip
   */
  saveJournalEntries: async (tripId: string, entries: any[]) => {
    try {
      await AsyncStorage.setItem(`${CACHE_KEYS.JOURNAL_PREFIX}${tripId}`, JSON.stringify(entries));
    } catch (error) {
      console.error(`Error caching journal for ${tripId}:`, error);
    }
  },

  /**
   * Retrieve cached journal entries
   */
  getCachedJournalEntries: async (tripId: string): Promise<any[]> => {
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_KEYS.JOURNAL_PREFIX}${tripId}`);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error(`Error getting cached journal for ${tripId}:`, error);
      return [];
    }
  },

  /**
   * Add a single entry locally (for offline creation)
   */
  addLocalEntry: async (tripId: string, entry: any) => {
    try {
      const entries = await storageService.getCachedJournalEntries(tripId);
      entries.unshift(entry); // Newest first
      await storageService.saveJournalEntries(tripId, entries);
    } catch (error) {
      console.error('Error adding local entry:', error);
    }
  },

  /**
   * Get entries that haven't been synced yet
   */
  getUnsyncedEntries: async (tripId: string): Promise<any[]> => {
    try {
      const entries = await storageService.getCachedJournalEntries(tripId);
      return entries.filter((e: any) => !e.synced);
    } catch (error) {
      return [];
    }
  },

  /**
   * Mark entries as synced after successful upload
   */
  markEntriesSynced: async (tripId: string, localIds: string[]) => {
    try {
      const entries = await storageService.getCachedJournalEntries(tripId);
      const updated = entries.map((e: any) =>
        localIds.includes(e.localId) ? { ...e, synced: true } : e
      );
      await storageService.saveJournalEntries(tripId, updated);
    } catch (error) {
      console.error('Error marking entries synced:', error);
    }
  },

  /**
   * Clear all cache (e.g. on logout)
   */
  clearCache: async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const stcKeys = keys.filter(key => key.startsWith('STC_'));
      await AsyncStorage.multiRemove(stcKeys);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
};
