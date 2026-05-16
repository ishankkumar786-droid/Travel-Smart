/**
 * Smart Travel Companion — Typography System
 *
 * Consistent font sizes, weights, and line heights.
 * Uses system fonts (San Francisco on iOS, Roboto on Android).
 */

import { Platform } from 'react-native';

export const FontSizes = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 32,
  '4xl': 38,
  hero: 48,
} as const;

export const FontWeights = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const LineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
} as const;

export const LetterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1,
} as const;

/**
 * Pre-defined text styles for consistency
 */
export const TextStyles = {
  hero: {
    fontSize: FontSizes.hero,
    fontWeight: FontWeights.extrabold,
    letterSpacing: LetterSpacing.tight,
    lineHeight: FontSizes.hero * LineHeights.tight,
  },
  h1: {
    fontSize: FontSizes['3xl'],
    fontWeight: FontWeights.bold,
    letterSpacing: LetterSpacing.tight,
    lineHeight: FontSizes['3xl'] * LineHeights.tight,
  },
  h2: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
    lineHeight: FontSizes['2xl'] * LineHeights.tight,
  },
  h3: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.semibold,
    lineHeight: FontSizes.xl * LineHeights.normal,
  },
  h4: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    lineHeight: FontSizes.lg * LineHeights.normal,
  },
  body: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.regular,
    lineHeight: FontSizes.base * LineHeights.normal,
  },
  bodyMedium: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    lineHeight: FontSizes.base * LineHeights.normal,
  },
  bodySmall: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.regular,
    lineHeight: FontSizes.sm * LineHeights.normal,
  },
  caption: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.regular,
    lineHeight: FontSizes.xs * LineHeights.normal,
  },
  button: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    letterSpacing: LetterSpacing.wide,
  },
  buttonSmall: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    letterSpacing: LetterSpacing.wide,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    letterSpacing: LetterSpacing.wide,
    textTransform: 'uppercase' as const,
  },
} as const;

/**
 * Spacing scale (8-point grid)
 */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

/**
 * Border radius
 */
export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  '2xl': 28,
  full: 9999,
} as const;

/**
 * Shadows
 */
export const Shadows = Platform.select({
  ios: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 24,
    },
  },
  default: {
    sm: { elevation: 2 },
    md: { elevation: 6 },
    lg: { elevation: 12 },
  },
})!;
