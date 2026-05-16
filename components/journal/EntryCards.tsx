import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, getThemeColors } from '@/constants/colors';
import { FontSizes, FontWeights, Spacing, Radius } from '@/constants/typography';

const EXPENSE_EMOJIS: Record<string, string> = {
  food: '🍜',
  travel: '🚆',
  hotel: '🏨',
  shopping: '🛍️',
  misc: '💸',
};

const MOOD_MAP: Record<string, { emoji: string; label: string }> = {
  amazing: { emoji: '😍', label: 'Amazing' },
  relaxed: { emoji: '😌', label: 'Relaxed' },
  tired: { emoji: '😴', label: 'Tired' },
  stressful: { emoji: '😤', label: 'Stressful' },
};

const formatTime = (date: string) => {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

// ============ NOTE CARD ============
export const NoteCard = ({ entry, theme, onLongPress }: any) => (
  <TouchableOpacity
    style={[styles.card, { backgroundColor: theme.card }]}
    onLongPress={() => onLongPress(entry)}
    activeOpacity={0.8}
  >
    <View style={styles.cardRow}>
      <View style={[styles.iconCircle, { backgroundColor: Colors.info + '15' }]}>
        <Text style={styles.iconEmoji}>📝</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.noteText, { color: theme.text }]}>{entry.content.text}</Text>
        <View style={styles.metaRow}>
          <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
            {formatTime(entry.createdAt)}
          </Text>
          {!entry.synced && (
            <View style={styles.unsyncedBadge}>
              <Ionicons name="cloud-offline-outline" size={10} color={Colors.warning} />
            </View>
          )}
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

// ============ EXPENSE CARD ============
export const ExpenseCard = ({ entry, theme, onLongPress }: any) => {
  const cat = entry.content.category || 'misc';
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.card }]}
      onLongPress={() => onLongPress(entry)}
      activeOpacity={0.8}
    >
      <View style={styles.cardRow}>
        <View style={[styles.iconCircle, { backgroundColor: Colors.orange + '15' }]}>
          <Text style={styles.iconEmoji}>{EXPENSE_EMOJIS[cat] || '💸'}</Text>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.expenseHeader}>
            <Text style={[styles.expenseAmount, { color: theme.text }]}>
              ₹{entry.content.amount}
            </Text>
            <View style={[styles.categoryBadge, { backgroundColor: Colors.orange + '15' }]}>
              <Text style={[styles.categoryText, { color: Colors.orange }]}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </View>
          </View>
          {entry.content.note ? (
            <Text style={[styles.expenseNote, { color: theme.textSecondary }]}>
              {entry.content.note}
            </Text>
          ) : null}
          <View style={styles.metaRow}>
            <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
              {formatTime(entry.createdAt)}
            </Text>
            {!entry.synced && (
              <View style={styles.unsyncedBadge}>
                <Ionicons name="cloud-offline-outline" size={10} color={Colors.warning} />
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ============ MEMORY CARD ============
export const MemoryCard = ({ entry, theme, onLongPress }: any) => {
  const mood = entry.content.mood ? MOOD_MAP[entry.content.mood] : null;
  return (
    <TouchableOpacity
      style={[styles.card, styles.memoryCard, { backgroundColor: theme.card }]}
      onLongPress={() => onLongPress(entry)}
      activeOpacity={0.8}
    >
      {entry.content.imageUrl ? (
        <Image
          source={{ uri: entry.content.imageUrl }}
          style={styles.memoryImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.memoryImagePlaceholder, { backgroundColor: theme.border }]}>
          <Ionicons name="image-outline" size={40} color={theme.textSecondary} />
        </View>
      )}
      <View style={styles.memoryBody}>
        {mood && (
          <View style={styles.moodBadge}>
            <Text style={styles.moodEmoji}>{mood.emoji}</Text>
            <Text style={[styles.moodLabel, { color: theme.textSecondary }]}>{mood.label}</Text>
          </View>
        )}
        {entry.content.caption ? (
          <Text style={[styles.memoryCaption, { color: theme.text }]}>
            {entry.content.caption}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
            {formatTime(entry.createdAt)}
          </Text>
          {!entry.synced && (
            <View style={styles.unsyncedBadge}>
              <Ionicons name="cloud-offline-outline" size={10} color={Colors.warning} />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ============ CHECKLIST CARD ============
export const ChecklistCard = ({ entry, theme, onLongPress, onToggle }: any) => {
  const done = entry.content.completed;
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.card }]}
      onPress={() => onToggle(entry)}
      onLongPress={() => onLongPress(entry)}
      activeOpacity={0.7}
    >
      <View style={styles.cardRow}>
        <TouchableOpacity
          style={[
            styles.checkbox,
            { borderColor: done ? Colors.success : theme.textSecondary },
            done && { backgroundColor: Colors.success },
          ]}
          onPress={() => onToggle(entry)}
        >
          {done && <Ionicons name="checkmark" size={14} color="#fff" />}
        </TouchableOpacity>
        <View style={styles.cardContent}>
          <Text
            style={[
              styles.checklistText,
              { color: done ? theme.textSecondary : theme.text },
              done && styles.checklistDone,
            ]}
          >
            {entry.content.text}
          </Text>
          <View style={styles.metaRow}>
            <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
              {formatTime(entry.createdAt)}
            </Text>
            {!entry.synced && (
              <View style={styles.unsyncedBadge}>
                <Ionicons name="cloud-offline-outline" size={10} color={Colors.warning} />
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: 14,
    marginBottom: 10,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: { fontSize: 20 },
  cardContent: { flex: 1 },
  noteText: {
    fontSize: FontSizes.base,
    lineHeight: 22,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timestamp: {
    fontSize: FontSizes.xs,
  },
  unsyncedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.warning + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  // Expense
  expenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  expenseAmount: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
  },
  expenseNote: {
    fontSize: FontSizes.sm,
    marginBottom: 6,
  },
  // Memory
  memoryCard: {
    padding: 0,
    overflow: 'hidden',
  },
  memoryImage: {
    width: '100%',
    height: 220,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
  },
  memoryImagePlaceholder: {
    width: '100%',
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memoryBody: {
    padding: 14,
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  moodEmoji: { fontSize: 16 },
  moodLabel: { fontSize: FontSizes.xs, fontWeight: FontWeights.medium },
  memoryCaption: {
    fontSize: FontSizes.base,
    lineHeight: 22,
    marginBottom: 6,
  },
  // Checklist
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checklistText: {
    fontSize: FontSizes.base,
    lineHeight: 22,
    marginBottom: 4,
  },
  checklistDone: {
    textDecorationLine: 'line-through',
  },
});
