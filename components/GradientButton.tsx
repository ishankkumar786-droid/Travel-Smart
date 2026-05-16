import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { FontSizes, FontWeights, Radius, Shadows } from '@/constants/typography';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  colors?: readonly [string, string, ...string[]];
  textColor?: string;
  icon?: string;
  subtitle?: string;
  size?: 'large' | 'medium' | 'small';
  style?: any;
}

export default function GradientButton({
  title, onPress, colors, textColor, icon, subtitle, size = 'medium', style,
}: GradientButtonProps) {
  const gradColors = colors || Colors.gradientPrimary;
  const isLarge = size === 'large';
  const isSmall = size === 'small';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={style}>
      <LinearGradient
        colors={gradColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          isLarge && styles.large,
          isSmall && styles.small,
          Shadows.md,
        ]}
      >
        {icon && <Text style={[styles.icon, isSmall && { fontSize: 20 }, textColor ? { color: textColor } : undefined]}>{icon}</Text>}
        <View style={icon ? styles.textWithIcon : undefined}>
          <Text style={[styles.title, isLarge && styles.titleLarge, isSmall && styles.titleSmall, textColor ? { color: textColor } : undefined]}>
            {title}
          </Text>
          {subtitle && <Text style={[styles.subtitle, textColor ? { color: textColor } : undefined]}>{subtitle}</Text>}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: Radius.lg,
    gap: 10,
  },
  large: {
    paddingVertical: 22,
    paddingHorizontal: 28,
    borderRadius: Radius.xl,
  },
  small: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: Radius.md,
  },
  icon: { fontSize: 26 },
  textWithIcon: { alignItems: 'flex-start' },
  title: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.white,
  },
  titleLarge: { fontSize: FontSizes.lg },
  titleSmall: { fontSize: FontSizes.sm },
  subtitle: {
    fontSize: FontSizes.xs,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
});
