import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, RefreshControl, Dimensions, TextInput, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { tripsAPI } from '@/services/api';
import { Colors, getThemeColors } from '@/constants/colors';
import { FontSizes, FontWeights, Spacing, Radius, Shadows } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import GradientButton from '@/components/GradientButton';
import DestinationCard from '@/components/DestinationCard';
import TripCard from '@/components/TripCard';

const { width } = Dimensions.get('window');

const POPULAR_DESTINATIONS = [
  { city: 'Prayagraj', tagline: 'Sangam & Spirituality', emoji: '🙏', color: '#E67E22' },
  { city: 'Varanasi', tagline: 'City of Lights', emoji: '🪔', color: '#8E44AD' },
  { city: 'Katra', tagline: 'Vaishno Devi', emoji: '⛰️', color: '#2980B9' },
  { city: 'Delhi', tagline: 'Capital Heritage', emoji: '🏛️', color: '#C0392B' },
  { city: 'Jaipur', tagline: 'Pink City', emoji: '🏰', color: '#D35400' },
  { city: 'Manali', tagline: 'Mountain Paradise', emoji: '🏔️', color: '#16A085' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user, isAuthenticated, isGuest } = useAuth();
  const isDark = useColorScheme() === 'dark';
  const theme = getThemeColors(isDark);

  const [savedTrips, setSavedTrips] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
    if (isAuthenticated) fetchTrips();
  }, [isAuthenticated]);

  const fetchTrips = async () => {
    try {
      const res = await tripsAPI.getAll();
      if (res.data.success) setSavedTrips(res.data.data.trips || []);
    } catch { /* silently fail */ }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (isAuthenticated) await fetchTrips();
    setRefreshing(false);
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleDestinationPress = (city: string) => {
    router.push({ pathname: '/plan-trip', params: { prefillDest: city } });
  };

  const handleSearch = () => {
    if (searchText.trim()) {
      router.push({ pathname: '/plan-trip', params: { prefillDest: searchText.trim() } });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Header */}
          <LinearGradient colors={Colors.gradientPrimary} style={styles.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.greeting}>{greeting()} 👋</Text>
                <Text style={styles.userName}>
                  {isAuthenticated ? user?.name : 'Traveler'}
                </Text>
              </View>
              {isAuthenticated && (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase()}</Text>
                </View>
              )}
            </View>

            {/* Search Bar */}
            <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/plan-trip')}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color={Colors.gray500} />
                <Text style={styles.searchPlaceholder}>Where do you want to go?</Text>
              </View>
            </TouchableOpacity>
          </LinearGradient>

          {/* Main CTA Buttons */}
          <View style={styles.ctaSection}>
            <GradientButton
              title="Plan New Trip"
              subtitle="Create a smart itinerary"
              icon="🗺️"
              onPress={() => router.push('/plan-trip')}
              colors={Colors.gradientPrimary}
              size="large"
              style={styles.ctaBtn}
            />
            <GradientButton
              title="📍 Explore Nearby"
              onPress={() => router.push('/(tabs)/explore')}
              colors={Colors.gradientAccent}
              textColor={Colors.primaryDark}
              size="medium"
              style={styles.ctaBtn}
            />
          </View>

          {/* Saved Trips Section */}
          {isAuthenticated && savedTrips.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Trips</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/my-trips')}>
                  <Text style={styles.seeAll}>See All →</Text>
                </TouchableOpacity>
              </View>
              {savedTrips.slice(0, 3).map((trip: any) => (
                <TripCard
                  key={trip._id}
                  destination={trip.destination}
                  source={trip.source}
                  budget={trip.budget}
                  days={trip.days}
                  intent={trip.intent}
                  mode={trip.mode}
                  createdAt={trip.createdAt}
                  onPress={() => router.push({ pathname: '/itinerary', params: { tripId: trip._id } })}
                />
              ))}
            </View>
          )}

          {/* Guest Prompt */}
          {isGuest && (
            <View style={[styles.guestBanner, { backgroundColor: isDark ? Colors.darkCard : Colors.primary + '08' }]}>
              <Ionicons name="information-circle" size={22} color={Colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.guestText, { color: theme.text }]}>Sign in to save your trips</Text>
                <Text style={[styles.guestSubtext, { color: theme.textSecondary }]}>Create an account to sync across devices</Text>
              </View>
              <TouchableOpacity style={styles.guestBtn} onPress={() => router.push('/auth')}>
                <Text style={styles.guestBtnText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Popular Destinations */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Popular Destinations</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Curated with local insights ✨</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.destScroll}>
              {POPULAR_DESTINATIONS.map((dest) => (
                <DestinationCard
                  key={dest.city}
                  city={dest.city}
                  tagline={dest.tagline}
                  emoji={dest.emoji}
                  color={dest.color}
                  onPress={() => handleDestinationPress(dest.city)}
                />
              ))}
            </ScrollView>
          </View>

          {/* Quick Tips */}
          <View style={[styles.tipsCard, { backgroundColor: isDark ? Colors.darkCard : Colors.accent + '08' }]}>
            <Text style={styles.tipsEmoji}>💡</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.tipsTitle, { color: theme.text }]}>Travel Tip</Text>
              <Text style={[styles.tipsBody, { color: theme.textSecondary }]}>
                Our premium cities include curated local gems and hidden food spots that regular travel apps miss!
              </Text>
            </View>
          </View>

          <View style={{ height: 30 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingBottom: 28,
    paddingHorizontal: Spacing.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: { fontSize: FontSizes.sm, color: 'rgba(255,255,255,0.7)', fontWeight: FontWeights.medium },
  userName: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: Colors.white, marginTop: 2 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.white },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: Radius.lg,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  searchPlaceholder: { fontSize: FontSizes.base, color: Colors.gray500 },
  ctaSection: { paddingHorizontal: Spacing.xl, marginTop: 20, gap: 12 },
  ctaBtn: { width: '100%' },
  section: { paddingHorizontal: Spacing.xl, marginTop: 28 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold },
  sectionSubtitle: { fontSize: FontSizes.sm, marginTop: 2, marginBottom: 14 },
  seeAll: { fontSize: FontSizes.sm, fontWeight: FontWeights.semibold, color: Colors.accent },
  destScroll: { paddingRight: 10 },
  guestBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: Spacing.xl, marginTop: 20,
    padding: Spacing.base, borderRadius: Radius.lg,
  },
  guestText: { fontSize: FontSizes.sm, fontWeight: FontWeights.semibold },
  guestSubtext: { fontSize: FontSizes.xs, marginTop: 2 },
  guestBtn: { backgroundColor: Colors.accent, paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.md },
  guestBtnText: { fontSize: FontSizes.sm, fontWeight: FontWeights.semibold, color: Colors.white },
  tipsCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    marginHorizontal: Spacing.xl, marginTop: 24,
    padding: Spacing.base, borderRadius: Radius.lg,
  },
  tipsEmoji: { fontSize: 28 },
  tipsTitle: { fontSize: FontSizes.sm, fontWeight: FontWeights.semibold, marginBottom: 4 },
  tipsBody: { fontSize: FontSizes.sm, lineHeight: 20 },
});
