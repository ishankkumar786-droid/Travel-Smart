import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, getThemeColors } from '@/constants/colors';
import { FontSizes, FontWeights, Spacing, Radius, Shadows } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import api from '@/services/api';

export default function AdminReviewsScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const theme = getThemeColors(isDark);

  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const res = await api.get('/contributions/pending');
      if (res.data.success) {
        setReviews(res.data.data.contributions);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch pending reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActionLoading(id);
    try {
      const res = await api.post(`/contributions/${id}/${action}`);
      if (res.data.success) {
        setReviews((prev) => prev.filter((r) => r._id !== id));
      }
    } catch (err) {
      Alert.alert('Error', `Failed to ${action} contribution`);
    } finally {
      setActionLoading(null);
    }
  };

  const renderReviewItem = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeEmoji}>{item.type === 'food' ? '🍜' : item.type === 'place' ? '📍' : '💡'}</Text>
          <Text style={styles.typeText}>{item.type.toUpperCase()}</Text>
        </View>
        <Text style={[styles.cityText, { color: theme.textSecondary }]}>{item.city}</Text>
      </View>

      <Text style={[styles.itemName, { color: theme.text }]}>
        {item.details?.name || 'Untitled Suggestion'}
      </Text>
      
      <View style={styles.detailRow}>
        {item.type === 'place' && item.details?.category && (
          <View style={[styles.detailBadge, { backgroundColor: theme.border }]}>
            <Text style={[styles.detailBadgeText, { color: theme.textSecondary }]}>
              {item.details.category.toUpperCase()}
            </Text>
          </View>
        )}
        {item.type === 'food' && item.details?.budgetCategory && (
          <View style={[styles.detailBadge, { backgroundColor: Colors.orange + '20' }]}>
            <Text style={[styles.detailBadgeText, { color: Colors.orange }]}>
              {item.details.budgetCategory.toUpperCase()} BUDGET
            </Text>
          </View>
        )}
      </View>

      <Text style={[styles.content, { color: theme.textSecondary }]}>{item.content}</Text>

      <View style={styles.userInfo}>
        <Ionicons name="person-circle-outline" size={16} color={theme.textSecondary} />
        <Text style={[styles.userText, { color: theme.textSecondary }]}>
          From: {item.userId?.name || 'Guest'}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.btn, styles.rejectBtn]} 
          onPress={() => handleAction(item._id, 'reject')}
          disabled={!!actionLoading}
        >
          {actionLoading === item._id ? <ActivityIndicator color="#fff" size="small" /> : (
            <>
              <Ionicons name="close-circle-outline" size={20} color="#fff" />
              <Text style={styles.btnText}>Reject</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.btn, styles.approveBtn]} 
          onPress={() => handleAction(item._id, 'approve')}
          disabled={!!actionLoading}
        >
          {actionLoading === item._id ? <ActivityIndicator color="#fff" size="small" /> : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.btnText}>Approve & Merge</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Review Contributions</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.accent} /></View>
      ) : reviews.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="checkmark-done-circle-outline" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>All caught up! No pending reviews.</Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item._id}
          renderItem={renderReviewItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingTop: Platform.OS === 'ios' ? 60 : 45, 
    paddingHorizontal: Spacing.xl, 
    paddingBottom: 20,
    gap: 12
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },
  card: { 
    padding: 20, 
    borderRadius: Radius.lg, 
    borderWidth: 1, 
    marginBottom: 16,
    ...Shadows.sm
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.accent + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.md },
  typeEmoji: { fontSize: 14 },
  typeText: { fontSize: 10, fontWeight: FontWeights.bold, color: Colors.accent },
  cityText: { fontSize: FontSizes.sm, fontWeight: FontWeights.semibold },
  itemName: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, marginBottom: 8 },
  detailRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  detailBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm },
  detailBadgeText: { fontSize: 9, fontWeight: FontWeights.bold },
  content: { fontSize: FontSizes.sm, lineHeight: 20, marginBottom: 16 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  userText: { fontSize: FontSizes.xs },
  actions: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: Radius.md },
  approveBtn: { backgroundColor: Colors.success },
  rejectBtn: { backgroundColor: Colors.error },
  btnText: { color: '#fff', fontSize: FontSizes.sm, fontWeight: FontWeights.bold },
  emptyText: { fontSize: FontSizes.base, textAlign: 'center', marginTop: 12 },
});
