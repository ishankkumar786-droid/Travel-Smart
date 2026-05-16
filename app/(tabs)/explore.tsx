import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, ActivityIndicator, Platform, Alert, Linking,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { Colors, getThemeColors } from '@/constants/colors';
import { FontSizes, FontWeights, Spacing, Radius, Shadows } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { nearbyAPI } from '@/services/api';

const CATEGORIES = [
  { key: 'food', label: 'Food', emoji: '🍜' },
  { key: 'hotels', label: 'Hotels', emoji: '🏨' },
  { key: 'attractions', label: 'Attractions', emoji: '🏛️' },
  { key: 'cafes', label: 'Cafes', emoji: '☕' },
  { key: 'local-gems', label: 'Local Gems', emoji: '💎' },
];

const DISTANCES = [
  { key: 1000, label: '1 km' },
  { key: 3000, label: '3 km' },
  { key: 5000, label: '5 km' },
];

export default function ExploreScreen() {
  const isDark = useColorScheme() === 'dark';
  const theme = getThemeColors(isDark);

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [category, setCategory] = useState('attractions');
  const [radius, setRadius] = useState(3000);
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [permDenied, setPermDenied] = useState(false);

  useEffect(() => {
    requestLocation();
  }, []);

  useEffect(() => {
    if (location) fetchNearby();
  }, [location, category, radius]);

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermDenied(true);
        // Fallback: use Delhi coordinates
        setLocation({ lat: 28.6139, lng: 77.2090 });
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch (error) {
      console.warn('Location error:', error);
      setPermDenied(true);
      setLocation({ lat: 28.6139, lng: 77.2090 });
    }
  };

  const fetchNearby = async () => {
    if (!location) return;
    setLoading(true);
    try {
      const res = await nearbyAPI.search({
        latitude: location.lat,
        longitude: location.lng,
        category,
        radius,
      });
      setPlaces(res.data?.data?.places || []);
    } catch {
      setPlaces([]);
    }
    setLoading(false);
  };

  const openDirections = (lat: number, lng: number, name: string) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${name}&ll=${lat},${lng}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${name}`,
    });
    Linking.openURL(url!);
  };

  const renderPlace = ({ item }: { item: any }) => (
    <View style={[styles.placeCard, { backgroundColor: theme.card }, Shadows.sm]}>
      <View style={styles.placeHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.placeName, { color: theme.text }]}>{item.name}</Text>
          {item.address && <Text style={[styles.placeAddr, { color: theme.textSecondary }]} numberOfLines={1}>{item.address}</Text>}
        </View>
        {item.rating > 0 && (
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={14} color={Colors.yellow} />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.dirBtn}
        onPress={() => openDirections(item.location?.lat, item.location?.lng, item.name)}
      >
        <Ionicons name="navigate-outline" size={16} color={Colors.accent} />
        <Text style={styles.dirText}>Get Directions</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>📍 Explore Nearby</Text>
        {permDenied && <Text style={[styles.permWarn, { color: Colors.warning }]}>Using default location (Delhi)</Text>}
      </View>

      {/* Category chips */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.chip, category === cat.key && styles.chipActive]}
              onPress={() => setCategory(cat.key)}
            >
              <Text style={styles.chipEmoji}>{cat.emoji}</Text>
              <Text style={[styles.chipLabel, category === cat.key && styles.chipLabelActive]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Distance filter */}
      <View style={styles.distRow}>
        {DISTANCES.map((d) => (
          <TouchableOpacity
            key={d.key}
            style={[styles.distBtn, radius === d.key && { backgroundColor: Colors.accent }]}
            onPress={() => setRadius(d.key)}
          >
            <Text style={[styles.distText, radius === d.key && { color: '#fff' }]}>{d.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Map View */}
      {location && (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={{
              latitude: location.lat,
              longitude: location.lng,
              latitudeDelta: (radius / 111000) * 2, // Approx zoom based on radius
              longitudeDelta: (radius / 111000) * 2,
            }}
            mapType="none" // Hides Google/Apple base maps
          >
            {/* OpenStreetMap Tiles (via CartoDB to avoid 403 blocks) */}
            <UrlTile
              urlTemplate="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
              maximumZ={19}
              flipY={false}
            />
            {/* You Are Here Marker */}
            <Marker coordinate={{ latitude: location.lat, longitude: location.lng }} pinColor={Colors.accent} title="You are here" />
            
            {/* Place Markers */}
            {places.map((p, i) => (
              p.location ? (
                <Marker
                  key={i}
                  coordinate={{ latitude: p.location.lat, longitude: p.location.lng }}
                  title={p.name}
                  description={p.address}
                  pinColor={Colors.error}
                />
              ) : null
            ))}
          </MapView>
        </View>
      )}

      {/* Results */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.accent} /></View>
      ) : places.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 48 }}>🔍</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No places found nearby</Text>
          <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>Try a different category or increase distance</Text>
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderPlace}
          contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: Platform.OS === 'ios' ? 60 : 45, paddingHorizontal: Spacing.xl, paddingBottom: 8 },
  title: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold },
  permWarn: { fontSize: FontSizes.xs, marginTop: 4 },
  chips: { paddingHorizontal: Spacing.base, paddingVertical: 10, gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.full, backgroundColor: Colors.gray100 },
  chipActive: { backgroundColor: Colors.accent + '20' },
  chipEmoji: { fontSize: 18 },
  chipLabel: { fontSize: FontSizes.sm, fontWeight: FontWeights.medium, color: Colors.gray600 },
  chipLabelActive: { color: Colors.accent, fontWeight: FontWeights.semibold },
  distRow: { flexDirection: 'row', paddingHorizontal: Spacing.xl, gap: 8, marginBottom: 10 },
  distBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.gray100 },
  distText: { fontSize: FontSizes.sm, fontWeight: FontWeights.medium, color: Colors.gray600 },
  mapContainer: { height: 250, marginHorizontal: Spacing.base, marginBottom: 10, borderRadius: Radius.lg, overflow: 'hidden' },
  map: { width: '100%', height: '100%' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  placeCard: { borderRadius: Radius.lg, padding: Spacing.base, marginBottom: 10 },
  placeHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  placeName: { fontSize: FontSizes.base, fontWeight: FontWeights.semibold },
  placeAddr: { fontSize: FontSizes.xs, marginTop: 2 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.yellow + '15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
  ratingText: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.yellow },
  badges: { flexDirection: 'row', gap: 6, marginTop: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  badgeText: { fontSize: FontSizes.xs, fontWeight: FontWeights.semibold },
  dirBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingVertical: 6 },
  dirText: { fontSize: FontSizes.sm, fontWeight: FontWeights.medium, color: Colors.accent },
  emptyText: { fontSize: FontSizes.md, fontWeight: FontWeights.medium, marginTop: 8 },
  emptySubtext: { fontSize: FontSizes.sm },
});
