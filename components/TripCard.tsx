import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, getThemeColors } from '@/constants/colors';
import { FontSizes, FontWeights, Radius, Shadows, Spacing } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

interface TripCardProps {
  destination: string;
  source: string;
  budget: string;
  days: number;
  intent: string;
  mode: 'premium' | 'ai-generated';
  createdAt: string;
  onPress: () => void;
}

const budgetColors: Record<string, string> = {
  low: Colors.budgetLow,
  moderate: Colors.budgetModerate,
  high: Colors.budgetHigh,
};

const intentEmoji: Record<string, string> = {
  religious: '🛕',
  chill: '😌',
  explore: '🧭',
  adventure: '🏔️',
};

export default function TripCard({ destination, source, budget, days, intent, mode, createdAt, onPress }: TripCardProps) {
  const isDark = useColorScheme() === 'dark';
  const theme = getThemeColors(isDark);

  const date = new Date(createdAt);
  const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.card, { backgroundColor: theme.card }, Shadows.sm]}>
        <View style={styles.header}>
          <View style={styles.destRow}>
            <Text style={styles.emoji}>{intentEmoji[intent] || '✈️'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.destination, { color: theme.text }]}>{destination}</Text>
              <Text style={[styles.source, { color: theme.textSecondary }]}>from {source}</Text>
            </View>
            <View style={[styles.modeBadge, { backgroundColor: mode === 'premium' ? Colors.accent + '20' : Colors.purple + '20' }]}>
              <Text style={[styles.modeText, { color: mode === 'premium' ? Colors.accent : Colors.purple }]}>
                {mode === 'premium' ? '⭐ Premium' : '🤖 AI'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
            <Text style={[styles.metaText, { color: theme.textSecondary }]}>{days} days</Text>
          </View>
          <View style={[styles.budgetPill, { backgroundColor: budgetColors[budget] + '20' }]}>
            <Text style={[styles.budgetText, { color: budgetColors[budget] }]}>
              {budget.charAt(0).toUpperCase() + budget.slice(1)}
            </Text>
          </View>
          <Text style={[styles.dateText, { color: theme.textSecondary }]}>{dateStr}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: 12,
  },
  header: { marginBottom: 10 },
  destRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emoji: { fontSize: 32 },
  destination: { fontSize: FontSizes.lg, fontWeight: FontWeights.semibold },
  source: { fontSize: FontSizes.sm, marginTop: 2 },
  modeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  modeText: { fontSize: FontSizes.xs, fontWeight: FontWeights.semibold },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: FontSizes.sm },
  budgetPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full },
  budgetText: { fontSize: FontSizes.xs, fontWeight: FontWeights.semibold },
  dateText: { fontSize: FontSizes.xs, marginLeft: 'auto' },
});
