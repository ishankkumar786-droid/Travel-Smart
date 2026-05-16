/**
 * Smart Travel Companion — Color Palette
 * 
 * A premium, modern palette designed for a travel app.
 * Deep ocean blues + vibrant teals + warm accents.
 */

export const Colors = {
  // Primary palette
  primary: '#1B4965',        // Deep ocean blue
  primaryLight: '#2D6A8F',   // Lighter ocean
  primaryDark: '#0F2D3F',    // Darker ocean

  // Accent palette
  accent: '#18A999',         // Vibrant teal
  accentLight: '#2CC4B3',    // Lighter teal
  accentDark: '#0F8577',     // Darker teal

  // Warm accents
  orange: '#F4845F',         // Warm coral
  yellow: '#F6C343',         // Golden yellow
  pink: '#E84393',           // Vibrant pink
  purple: '#6C5CE7',         // Soft purple

  // Intent colors
  religious: '#F39C12',      // Warm gold
  chill: '#3498DB',          // Cool blue
  explore: '#27AE60',        // Fresh green
  adventure: '#E74C3C',      // Bold red

  // Budget colors
  budgetLow: '#27AE60',      // Green — affordable
  budgetModerate: '#F39C12', // Orange — moderate
  budgetHigh: '#E74C3C',     // Red — premium

  // Neutrals
  white: '#FFFFFF',
  offWhite: '#FAFBFC',
  gray50: '#F8F9FA',
  gray100: '#F1F3F5',
  gray200: '#E9ECEF',
  gray300: '#DEE2E6',
  gray400: '#CED4DA',
  gray500: '#ADB5BD',
  gray600: '#868E96',
  gray700: '#495057',
  gray800: '#343A40',
  gray900: '#212529',
  black: '#000000',

  // Semantic
  success: '#2ECC71',
  warning: '#F1C40F',
  error: '#E74C3C',
  info: '#3498DB',

  // Dark mode specific
  darkBg: '#0F1419',
  darkCard: '#1C2733',
  darkCardElevated: '#253341',
  darkBorder: '#38444D',
  darkText: '#E7E9EA',
  darkTextSecondary: '#8B98A5',

  // Light mode specific
  lightBg: '#FAFBFC',
  lightCard: '#FFFFFF',
  lightCardElevated: '#FFFFFF',
  lightBorder: '#E9ECEF',
  lightText: '#1A1A2E',
  lightTextSecondary: '#6B7280',

  // Gradients (as arrays for LinearGradient)
  gradientPrimary: ['#1B4965', '#18A999'] as const,
  gradientAccent: ['#18A999', '#2CC4B3'] as const,
  gradientWarm: ['#F4845F', '#F6C343'] as const,
  gradientPurple: ['#6C5CE7', '#A29BFE'] as const,
  gradientDark: ['#0F1419', '#1C2733'] as const,
  gradientSplash: ['#0F2D3F', '#1B4965', '#18A999'] as const,

  // Transparency
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  shimmer: 'rgba(255, 255, 255, 0.1)',
};

/**
 * Theme-aware color getter
 */
export const getThemeColors = (isDark: boolean) => ({
  background: isDark ? Colors.darkBg : Colors.lightBg,
  card: isDark ? Colors.darkCard : Colors.lightCard,
  cardElevated: isDark ? Colors.darkCardElevated : Colors.lightCardElevated,
  border: isDark ? Colors.darkBorder : Colors.lightBorder,
  text: isDark ? Colors.darkText : Colors.lightText,
  textSecondary: isDark ? Colors.darkTextSecondary : Colors.lightTextSecondary,
  primary: Colors.primary,
  accent: Colors.accent,
});
