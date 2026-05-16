import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, getThemeColors } from '@/constants/colors';
import { FontSizes, FontWeights, Spacing, Radius } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, isGuest, logout } = useAuth();
  const isDark = useColorScheme() === 'dark';
  const theme = getThemeColors(isDark);

  const handleLogout = async () => {
    await logout();
    router.replace('/auth');
  };

  const MenuItem = ({ icon, label, onPress, color }: any) => (
    <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card }]} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={22} color={color || theme.textSecondary} />
      <Text style={[styles.menuLabel, { color: color || theme.text }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
    </TouchableOpacity>
  );

  const showAbout = () => {
    Alert.alert(
      '✈️ About TravelSmart',
      'TravelSmart is your AI-powered travel companion.\n\n' +
      '🗺️ Smart Itineraries — AI + curated local data\n' +
      '📍 Nearby Explorer — Discover places around you\n' +
      '📖 Trip Journal — Notes, expenses, memories & checklists\n' +
      '💬 Trip Chat — Ask anything about your itinerary\n' +
      '❤️ Community Tips — Contribute & earn Traveler Points\n' +
      '📥 Offline Access — Use your trips without internet\n\n' +
      'Built with ❤️ for travelers who want more than just a planner.\n\n' +
      'Version 1.0.0',
      [{ text: 'Got it!' }]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        {isAuthenticated ? (
          <View style={styles.profileCard}>
            <View style={[styles.avatar, { backgroundColor: Colors.accent }]}>  
              <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase()}</Text>
            </View>
            <Text style={[styles.name, { color: theme.text }]}>{user?.name}</Text>
            <Text style={[styles.email, { color: theme.textSecondary }]}>{user?.email}</Text>
            
            <View style={styles.pointsBadge}>
              <Ionicons name="star" size={16} color={Colors.orange} />
              <Text style={styles.pointsText}>{user?.points || 0} Traveler Points</Text>
            </View>
          </View>
        ) : (
          <View style={styles.guestCard}>
            <Ionicons name="person-circle-outline" size={64} color={theme.textSecondary} />
            <Text style={[styles.name, { color: theme.text }]}>Guest User</Text>
            <TouchableOpacity style={styles.signInBtn} onPress={() => router.push('/auth')}>
              <Text style={styles.signInText}>Sign In / Create Account</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.menu}>
          {user?.isAdmin && (
            <MenuItem icon="shield-checkmark-outline" label="Review Contributions" onPress={() => router.push('/admin/reviews')} color={Colors.accent} />
          )}
          <MenuItem icon="heart-outline" label="Contribute a Tip" onPress={() => router.push('/contribute')} />
          <MenuItem icon="information-circle-outline" label="About TravelSmart" onPress={showAbout} />
          {isAuthenticated && (
            <MenuItem icon="log-out-outline" label="Logout" onPress={handleLogout} color={Colors.error} />
          )}
        </View>
      </ScrollView>

      <Text style={[styles.version, { color: theme.textSecondary }]}>TravelSmart v1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: Platform.OS === 'ios' ? 60 : 45, paddingHorizontal: Spacing.xl, paddingBottom: 16 },
  headerTitle: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold },
  profileCard: { alignItems: 'center', paddingVertical: 24 },
  pointsBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: Colors.orange + '15', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: Radius.full,
    marginTop: 12
  },
  pointsText: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.orange },
  avatar: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.white },
  name: { fontSize: FontSizes.lg, fontWeight: FontWeights.semibold },
  email: { fontSize: FontSizes.sm, marginTop: 4 },
  guestCard: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  signInBtn: { backgroundColor: Colors.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.lg, marginTop: 4 },
  signInText: { color: Colors.white, fontWeight: FontWeights.semibold },
  menu: { paddingHorizontal: Spacing.xl, marginTop: 16, gap: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: Radius.lg },
  menuLabel: { flex: 1, fontSize: FontSizes.base, fontWeight: FontWeights.medium },
  version: { textAlign: 'center', fontSize: FontSizes.xs, marginTop: 'auto', paddingBottom: 30 },
});
