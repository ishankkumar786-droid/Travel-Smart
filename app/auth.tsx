import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import { FontSizes, FontWeights, Spacing, Radius } from '@/constants/typography';

const { width, height } = Dimensions.get('window');

export default function AuthScreen() {
  const router = useRouter();
  const { continueAsGuest } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const buttonSlide1 = useRef(new Animated.Value(60)).current;
  const buttonSlide2 = useRef(new Animated.Value(60)).current;
  const buttonSlide3 = useRef(new Animated.Value(60)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.stagger(120, [
        Animated.parallel([
          Animated.timing(buttonOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.spring(buttonSlide1, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
        ]),
        Animated.spring(buttonSlide2, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.spring(buttonSlide3, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handleGuest = () => {
    continueAsGuest();
    router.replace('/(tabs)');
  };

  return (
    <LinearGradient
      colors={Colors.gradientSplash}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Background decorations */}
      <View style={[styles.bgCircle, styles.bgCircle1]} />
      <View style={[styles.bgCircle, styles.bgCircle2]} />

      {/* Header section */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.logoEmoji}>🧭</Text>
        <Text style={styles.title}>TravelSmart</Text>
        <Text style={styles.subtitle}>
          Your AI-powered travel companion{'\n'}with real local insights
        </Text>
      </Animated.View>

      {/* Feature highlights */}
      <Animated.View style={[styles.features, { opacity: fadeAnim }]}>
        <View style={styles.featureRow}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🗺️</Text>
            <Text style={styles.featureText}>Smart{'\n'}Itineraries</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>💡</Text>
            <Text style={styles.featureText}>Local{'\n'}Insights</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>💬</Text>
            <Text style={styles.featureText}>Travel{'\n'}Chat</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📍</Text>
            <Text style={styles.featureText}>Nearby{'\n'}Places</Text>
          </View>
        </View>
      </Animated.View>

      {/* Auth buttons */}
      <View style={styles.buttonsContainer}>
        <Animated.View
          style={{
            opacity: buttonOpacity,
            transform: [{ translateY: buttonSlide1 }],
          }}
        >
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/signup')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={Colors.gradientAccent}
              style={styles.gradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.primaryButtonText}>Create Account</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={{
            opacity: buttonOpacity,
            transform: [{ translateY: buttonSlide2 }],
          }}
        >
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/login')}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryButtonText}>Login</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={{
            opacity: buttonOpacity,
            transform: [{ translateY: buttonSlide3 }],
          }}
        >
          <TouchableOpacity
            style={styles.guestButton}
            onPress={handleGuest}
            activeOpacity={0.7}
          >
            <Text style={styles.guestButtonText}>Continue as Guest →</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: height * 0.12,
    paddingBottom: height * 0.06,
    paddingHorizontal: Spacing.xl,
    overflow: 'hidden',
  },
  bgCircle: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  bgCircle1: {
    width: width * 1.2,
    height: width * 1.2,
    top: -width * 0.4,
    right: -width * 0.4,
  },
  bgCircle2: {
    width: width * 0.6,
    height: width * 0.6,
    bottom: height * 0.15,
    left: -width * 0.2,
    backgroundColor: 'rgba(24, 169, 153, 0.1)',
  },
  header: {
    alignItems: 'center',
  },
  logoEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: FontSizes['4xl'],
    fontWeight: FontWeights.extrabold,
    color: Colors.white,
    letterSpacing: -1,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: FontSizes.base,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },
  features: {
    marginVertical: Spacing['2xl'],
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  featureText: {
    fontSize: FontSizes.xs,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: FontWeights.medium,
  },
  buttonsContainer: {
    gap: 14,
  },
  primaryButton: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 17,
    alignItems: 'center',
    borderRadius: Radius.lg,
  },
  primaryButtonText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  secondaryButton: {
    paddingVertical: 17,
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  secondaryButtonText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.white,
  },
  guestButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  guestButtonText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    color: 'rgba(255,255,255,0.55)',
  },
});
