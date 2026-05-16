import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/typography';
import { useTrip } from '@/contexts/TripContext';
import { itineraryAPI } from '@/services/api';

const { width } = Dimensions.get('window');

const LOADING_MESSAGES = [
  { text: 'Analyzing routes...', emoji: '🗺️' },
  { text: 'Finding local food spots...', emoji: '🍜' },
  { text: 'Optimizing your plan...', emoji: '⚡' },
  { text: 'Searching hidden gems...', emoji: '💎' },
  { text: 'Checking best timings...', emoji: '⏰' },
  { text: 'Curating local insights...', emoji: '💡' },
];

export default function LoadingScreen() {
  const router = useRouter();
  const { tripParams, setCurrentItinerary } = useTrip();
  const [msgIndex, setMsgIndex] = useState(0);
  const fadeMsg = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const dotAnim1 = useRef(new Animated.Value(0)).current;
  const dotAnim2 = useRef(new Animated.Value(0)).current;
  const dotAnim3 = useRef(new Animated.Value(0)).current;

  // Cycle messages
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeMsg, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
        Animated.timing(fadeMsg, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Pulse animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Spin animation
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 3000, useNativeDriver: true })
    ).start();
  }, []);

  // Bouncing dots
  useEffect(() => {
    const bounce = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: -10, duration: 300, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      );
    bounce(dotAnim1, 0).start();
    bounce(dotAnim2, 150).start();
    bounce(dotAnim3, 300).start();
  }, []);

  // API call
  useEffect(() => {
    if (!tripParams) { router.replace('/(tabs)'); return; }
    const generate = async () => {
      try {
        const res = await itineraryAPI.generate(tripParams);
        if (res.data.success) {
          const { itinerary, mode, confidenceScore } = res.data.data;
          setCurrentItinerary({ ...itinerary, mode, confidenceScore });
          router.replace('/itinerary');
        } else {
          throw new Error(res.data.message);
        }
      } catch (err: any) {
        // Fallback: create a basic placeholder itinerary with the real error message
        const errorMessage = err.message || 'Could not connect to server. Please check your connection and try again.';
        setCurrentItinerary({
          destination: tripParams.destination,
          source: tripParams.source,
          budget: tripParams.budget,
          mode: 'ai-generated',
          confidenceScore: 0,
          disclaimer: errorMessage,
          days: Array.from({ length: tripParams.days }, (_, i) => ({
            day: i + 1,
            title: `Day ${i + 1} in ${tripParams.destination}`,
            places: [],
            food: [],
            tips: ['Please retry or check your internet connection'],
            avoid: [],
          })),
        });
        router.replace('/itinerary');
      }
    };
    // Small delay so animation feels intentional
    const timer = setTimeout(generate, 1500);
    return () => clearTimeout(timer);
  }, [tripParams]);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const msg = LOADING_MESSAGES[msgIndex];

  return (
    <LinearGradient colors={Colors.gradientSplash} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <View style={styles.bgCircle} />
      <View style={styles.bgCircle2} />

      {/* Spinning compass */}
      <Animated.View style={[styles.compassWrap, { transform: [{ scale: pulseAnim }] }]}>
        <Animated.Text style={[styles.compass, { transform: [{ rotate: spin }] }]}>🧭</Animated.Text>
      </Animated.View>

      {/* Destination */}
      <Text style={styles.destLabel}>Planning your trip to</Text>
      <Text style={styles.destCity}>{tripParams?.destination || '...'}</Text>

      {/* Cycling message */}
      <Animated.View style={[styles.msgRow, { opacity: fadeMsg }]}>
        <Text style={styles.msgEmoji}>{msg.emoji}</Text>
        <Text style={styles.msgText}>{msg.text}</Text>
      </Animated.View>

      {/* Bouncing dots */}
      <View style={styles.dots}>
        <Animated.View style={[styles.dot, { transform: [{ translateY: dotAnim1 }] }]} />
        <Animated.View style={[styles.dot, { transform: [{ translateY: dotAnim2 }] }]} />
        <Animated.View style={[styles.dot, { transform: [{ translateY: dotAnim3 }] }]} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  bgCircle: { position: 'absolute', width: width * 1.5, height: width * 1.5, borderRadius: width, top: -width * 0.5, right: -width * 0.5, backgroundColor: 'rgba(255,255,255,0.03)' },
  bgCircle2: { position: 'absolute', width: width * 0.6, height: width * 0.6, borderRadius: width, bottom: -width * 0.1, left: -width * 0.2, backgroundColor: 'rgba(24,169,153,0.08)' },
  compassWrap: { marginBottom: 30 },
  compass: { fontSize: 72 },
  destLabel: { fontSize: FontSizes.sm, color: 'rgba(255,255,255,0.6)', fontWeight: FontWeights.medium, marginBottom: 6 },
  destCity: { fontSize: FontSizes['3xl'], fontWeight: FontWeights.bold, color: Colors.white, marginBottom: 40 },
  msgRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 50 },
  msgEmoji: { fontSize: 24 },
  msgText: { fontSize: FontSizes.md, color: 'rgba(255,255,255,0.8)', fontWeight: FontWeights.medium },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.5)' },
});
