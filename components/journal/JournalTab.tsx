import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, ScrollView, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, getThemeColors } from '@/constants/colors';
import { FontSizes, FontWeights, Spacing, Radius } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { journalSyncService } from '@/services/journalSyncService';
import { NoteCard, ExpenseCard, MemoryCard, ChecklistCard } from './EntryCards';
import AddEntryModal from './AddEntryModal';
import EditEntryModal from './EditEntryModal';

const FILTERS = [
  { key: 'all', label: 'All', emoji: '📖' },
  { key: 'note', label: 'Notes', emoji: '📝' },
  { key: 'expense', label: 'Expenses', emoji: '💸' },
  { key: 'memory', label: 'Memories', emoji: '📸' },
  { key: 'checklist', label: 'Checklist', emoji: '✅' },
];

interface Props {
  tripId: string;
}

export default function JournalTab({ tripId }: Props) {
  const isDark = useColorScheme() === 'dark';
  const theme = getThemeColors(isDark);

  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [filter, setFilter] = useState('all');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editEntry, setEditEntry] = useState<any>(null);

  const loadEntries = useCallback(async () => {
    const result = await journalSyncService.loadEntries(tripId);
    setEntries(result.entries);
    setIsOffline(result.isOffline);

    // Sync pending entries if online
    if (!result.isOffline) {
      const synced = await journalSyncService.syncPendingEntries(tripId);
      if (synced > 0) {
        // Reload after sync
        const fresh = await journalSyncService.loadEntries(tripId);
        setEntries(fresh.entries);
      }
    }
  }, [tripId]);

  useEffect(() => {
    setLoading(true);
    loadEntries().finally(() => setLoading(false));
  }, [loadEntries]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEntries();
    setRefreshing(false);
  };

  const handleAddEntry = async (type: string, content: any) => {
    setAddModalVisible(false);
    const result = await journalSyncService.createEntry(tripId, type, content);
    setEntries((prev) => [result.entry, ...prev]);
  };

  const handleEditSave = async (entryId: string, data: { content: any }) => {
    await journalSyncService.updateEntry(tripId, entryId, data);
    setEntries((prev) =>
      prev.map((e) =>
        (e._id === entryId || e.localId === entryId)
          ? { ...e, content: { ...e.content, ...data.content } }
          : e
      )
    );
  };

  const handleDelete = async (entryId: string) => {
    await journalSyncService.deleteEntry(tripId, entryId);
    setEntries((prev) => prev.filter((e) => e._id !== entryId && e.localId !== entryId));
  };

  const handleToggleChecklist = async (entry: any) => {
    const newCompleted = !entry.content.completed;
    const entryId = entry._id || entry.localId;
    await journalSyncService.updateEntry(tripId, entryId, {
      content: { completed: newCompleted },
    });
    setEntries((prev) =>
      prev.map((e) =>
        (e._id === entryId || e.localId === entryId)
          ? { ...e, content: { ...e.content, completed: newCompleted } }
          : e
      )
    );
  };

  // ===== Computed Stats =====
  const totalExpenses = entries
    .filter((e) => e.type === 'expense')
    .reduce((sum, e) => sum + (e.content.amount || 0), 0);
  const memoryCount = entries.filter((e) => e.type === 'memory').length;
  const noteCount = entries.filter((e) => e.type === 'note').length;
  const checklistItems = entries.filter((e) => e.type === 'checklist');
  const checklistDone = checklistItems.filter((e) => e.content.completed).length;

  const filteredEntries = filter === 'all' ? entries : entries.filter((e) => e.type === filter);

  // ===== Render Cards =====
  const renderEntry = ({ item }: { item: any }) => {
    switch (item.type) {
      case 'note':
        return <NoteCard entry={item} theme={theme} onLongPress={setEditEntry} />;
      case 'expense':
        return <ExpenseCard entry={item} theme={theme} onLongPress={setEditEntry} />;
      case 'memory':
        return <MemoryCard entry={item} theme={theme} onLongPress={setEditEntry} />;
      case 'checklist':
        return (
          <ChecklistCard
            entry={item}
            theme={theme}
            onLongPress={setEditEntry}
            onToggle={handleToggleChecklist}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={{ color: theme.textSecondary, marginTop: 12 }}>Loading journal...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Offline banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={14} color="#fff" />
          <Text style={styles.offlineText}>Offline Mode — entries will sync later</Text>
        </View>
      )}

      <FlatList
        data={filteredEntries}
        keyExtractor={(item) => item._id || item.localId}
        renderItem={renderEntry}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.accent} />
        }
        ListHeaderComponent={
          <>
            {/* Summary Cards */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.summaryScroll}>
              <View style={[styles.summaryCard, { backgroundColor: Colors.orange + '12' }]}>
                <Text style={styles.summaryEmoji}>💸</Text>
                <Text style={[styles.summaryValue, { color: theme.text }]}>₹{totalExpenses}</Text>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Spent</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: Colors.pink + '12' }]}>
                <Text style={styles.summaryEmoji}>📸</Text>
                <Text style={[styles.summaryValue, { color: theme.text }]}>{memoryCount}</Text>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Memories</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: Colors.info + '12' }]}>
                <Text style={styles.summaryEmoji}>📝</Text>
                <Text style={[styles.summaryValue, { color: theme.text }]}>{noteCount}</Text>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Notes</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: Colors.success + '12' }]}>
                <Text style={styles.summaryEmoji}>✅</Text>
                <Text style={[styles.summaryValue, { color: theme.text }]}>
                  {checklistDone}/{checklistItems.length}
                </Text>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Tasks</Text>
              </View>
            </ScrollView>

            {/* Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              {FILTERS.map((f) => (
                <TouchableOpacity
                  key={f.key}
                  style={[
                    styles.filterChip,
                    { backgroundColor: filter === f.key ? Colors.accent + '15' : theme.card },
                    filter === f.key && { borderColor: Colors.accent },
                  ]}
                  onPress={() => setFilter(f.key)}
                >
                  <Text style={styles.filterEmoji}>{f.emoji}</Text>
                  <Text
                    style={[
                      styles.filterLabel,
                      { color: filter === f.key ? Colors.accent : theme.textSecondary },
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>✨</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Your Journal Awaits</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Capture moments, track expenses, and create lasting memories from your trip.
            </Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: 80 }} />}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setAddModalVisible(true)} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modals */}
      <AddEntryModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSubmit={handleAddEntry}
      />
      <EditEntryModal
        visible={!!editEntry}
        entry={editEntry}
        onClose={() => setEditEntry(null)}
        onSave={handleEditSave}
        onDelete={handleDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: Spacing.base },

  // Offline
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    backgroundColor: Colors.warning,
  },
  offlineText: { color: '#fff', fontSize: FontSizes.xs, fontWeight: FontWeights.semibold },

  // Summary
  summaryScroll: { gap: 10, paddingVertical: 16, paddingHorizontal: 4 },
  summaryCard: {
    width: 100,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: Radius.lg,
    alignItems: 'center',
    gap: 4,
  },
  summaryEmoji: { fontSize: 22 },
  summaryValue: { fontSize: FontSizes.md, fontWeight: FontWeights.bold },
  summaryLabel: { fontSize: FontSizes.xs },

  // Filters
  filterScroll: { gap: 8, paddingBottom: 16, paddingHorizontal: 4 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterEmoji: { fontSize: 14 },
  filterLabel: { fontSize: FontSizes.sm, fontWeight: FontWeights.medium },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 30 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, marginBottom: 8 },
  emptySubtitle: { fontSize: FontSizes.base, textAlign: 'center', lineHeight: 22 },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
