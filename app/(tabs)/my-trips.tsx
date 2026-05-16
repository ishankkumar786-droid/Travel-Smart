import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { tripsAPI } from '@/services/api';
import { Colors, getThemeColors } from '@/constants/colors';
import { FontSizes, FontWeights, Spacing, Radius } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import TripCard from '@/components/TripCard';
import { generateItineraryPDF } from '@/utils/pdfGenerator';
import { storageService } from '@/services/storageService';

export default function MyTripsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const isDark = useColorScheme() === 'dark';
  const theme = getThemeColors(isDark);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchTrips();
      } else {
        setLoading(false);
      }
    }, [isAuthenticated])
  );

  const fetchTrips = async () => {
    try {
      const res = await tripsAPI.getAll();
      if (res.data.success) {
        const fetchedTrips = res.data.data.trips || [];
        setTrips(fetchedTrips);
        setIsOffline(false);
        // Shadow cache for offline use
        storageService.saveTrips(fetchedTrips);
      }
    } catch (err) {
      // Try to load from offline cache
      const cached = await storageService.getCachedTrips();
      if (cached.length > 0) {
        setTrips(cached);
        setIsOffline(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = async (id: string) => {
    Alert.alert(
      'Delete Trip',
      'Are you sure you want to delete this trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await tripsAPI.delete(id);
              if (res.data.success) {
                setTrips((prev) => prev.filter((t) => t._id !== id));
                Alert.alert('Deleted', 'Trip removed successfully');
              }
            } catch {
              Alert.alert('Error', 'Failed to delete trip');
            }
          }
        },
      ]
    );
  };

  const handleDownloadPDF = async (trip: any) => {
    try {
      await generateItineraryPDF(trip.itinerary);
    } catch (err) {
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <Ionicons name="briefcase-outline" size={64} color={theme.textSecondary} />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>Sign in to see your trips</Text>
        <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>Save and revisit your itineraries</Text>
        <TouchableOpacity style={styles.signInBtn} onPress={() => router.push('/auth')}>
          <Text style={styles.signInText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={16} color="#fff" />
          <Text style={styles.offlineText}>Viewing Offline Trips</Text>
        </View>
      )}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>My Trips</Text>
        <Text style={[styles.headerSub, { color: theme.textSecondary }]}>{trips.length} saved trip{trips.length !== 1 ? 's' : ''}</Text>
      </View>
      {trips.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="airplane-outline" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No trips yet</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>Plan your first adventure!</Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View style={styles.tripCardContainer}>
              <View style={styles.cardHeader}>
                <TouchableOpacity 
                  style={styles.shareBtnSmall} 
                  onPress={() => handleDownloadPDF(item)}
                >
                  <Ionicons name="share-outline" size={16} color={Colors.info} />
                  <Text style={[styles.shareText, { color: Colors.info }]}>Share Trip</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.deleteBtnSmall} 
                  onPress={() => handleDeleteTrip(item._id)}
                >
                  <Ionicons name="trash-outline" size={16} color={Colors.error} />
                  <Text style={[styles.deleteText, { color: Colors.error }]}>Delete Trip</Text>
                </TouchableOpacity>
              </View>
              <TripCard
                destination={item.destination}
                source={item.source}
                budget={item.budget}
                days={item.days}
                intent={item.intent}
                mode={item.mode}
                createdAt={item.createdAt}
                onPress={() => router.push({ pathname: '/itinerary', params: { tripId: item._id } })}
              />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  header: { paddingTop: Platform.OS === 'ios' ? 60 : 45, paddingHorizontal: Spacing.xl, paddingBottom: 16 },
  headerTitle: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold },
  headerSub: { fontSize: FontSizes.sm, marginTop: 4 },
  emptyTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.semibold, marginTop: 8 },
  emptySubtitle: { fontSize: FontSizes.base },
  signInBtn: { backgroundColor: Colors.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.lg, marginTop: 8 },
  signInText: { color: Colors.white, fontWeight: FontWeights.semibold, fontSize: FontSizes.base },
  tripCardContainer: { marginBottom: Spacing.xl },
  cardHeader: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginBottom: 8, paddingRight: 4 },
  deleteBtnSmall: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 8 },
  shareBtnSmall: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 8 },
  deleteText: { fontSize: FontSizes.xs, fontWeight: FontWeights.semibold },
  shareText: { fontSize: FontSizes.xs, fontWeight: FontWeights.semibold },
  offlineBanner: { 
    backgroundColor: Colors.warning, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    paddingVertical: 8,
    paddingTop: Platform.OS === 'ios' ? 50 : 8,
  },
  offlineText: { color: '#fff', fontSize: FontSizes.xs, fontWeight: FontWeights.bold },
});
