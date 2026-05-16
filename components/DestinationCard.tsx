import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { Colors, getThemeColors } from '@/constants/colors';
import { FontSizes, FontWeights, Radius, Shadows } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface DestinationCardProps {
  city: string;
  tagline: string;
  emoji: string;
  color: string;
  onPress: () => void;
}

export default function DestinationCard({ city, tagline, emoji, color, onPress }: DestinationCardProps) {
  const isDark = useColorScheme() === 'dark';
  const theme = getThemeColors(isDark);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.container}>
      <View style={[styles.card, { backgroundColor: color }, Shadows.md]}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={styles.city}>{city}</Text>
        <Text style={styles.tagline} numberOfLines={1}>{tagline}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { marginRight: 14 },
  card: {
    width: 140,
    height: 170,
    borderRadius: Radius.xl,
    padding: 16,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  emoji: { fontSize: 36, marginBottom: 8 },
  city: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.white,
  },
  tagline: {
    fontSize: FontSizes.xs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
});
