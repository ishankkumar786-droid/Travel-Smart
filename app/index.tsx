import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/typography';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const { isLoading, isAuthenticated, isGuest } = useAuth();

  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(20)).current;
  const dotOpacity1 = useRef(new Animated.Value(0)).current;
  const dotOpacity2 = useRef(new Animated.Value(0)).current;
  const dotOpacity3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo animation
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Tagline animation (delayed)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(taglineTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }, 500);

    // Loading dots animation
    const animateDots = () => {
      const dotAnim = (dot: Animated.Value, delay: number) =>
        Animated.sequence([
          Animated.delay(delay),
          Animated.loop(
            Animated.sequence([
              Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
              Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
            ])
          ),
        ]);

      Animated.parallel([
        dotAnim(dotOpacity1, 800),
        dotAnim(dotOpacity2, 1000),
        dotAnim(dotOpacity3, 1200),
      ]).start();
    };
    animateDots();
  }, []);

  // Navigate after auth state is resolved
  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      if (isAuthenticated || isGuest) {
        router.replace('/(tabs)');
      } else {
        router.replace('/auth');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated, isGuest]);

  return (
    <LinearGradient
      colors={Colors.gradientSplash}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Decorative circles */}
      <View style={[styles.circle, styles.circle1]} />
      <View style={[styles.circle, styles.circle2]} />
      <View style={[styles.circle, styles.circle3]} />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <View style={styles.logoIcon}>
          <Text style={styles.logoEmoji}>🧭</Text>
        </View>
        <Text style={styles.appName}>TravelSmart</Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.View
        style={[
          styles.taglineContainer,
          {
            opacity: taglineOpacity,
            transform: [{ translateY: taglineTranslateY }],
          },
        ]}
      >
        <Text style={styles.tagline}>
          Plan smarter trips with local insights
        </Text>
      </Animated.View>

      {/* Loading dots */}
      <View style={styles.dotsContainer}>
        <Animated.View style={[styles.dot, { opacity: dotOpacity1 }]} />
        <Animated.View style={[styles.dot, { opacity: dotOpacity2 }]} />
        <Animated.View style={[styles.dot, { opacity: dotOpacity3 }]} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  circle1: {
    width: width * 1.5,
    height: width * 1.5,
    top: -width * 0.5,
    right: -width * 0.5,
  },
  circle2: {
    width: width * 0.8,
    height: width * 0.8,
    bottom: -width * 0.2,
    left: -width * 0.3,
  },
  circle3: {
    width: width * 0.4,
    height: width * 0.4,
    top: height * 0.3,
    left: width * 0.6,
    backgroundColor: 'rgba(24, 169, 153, 0.15)',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoIcon: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoEmoji: {
    fontSize: 50,
  },
  appName: {
    fontSize: FontSizes['4xl'],
    fontWeight: FontWeights.extrabold,
    color: Colors.white,
    letterSpacing: -1,
  },
  taglineContainer: {
    marginTop: 8,
    paddingHorizontal: 40,
  },
  tagline: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.regular,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 80,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
});
