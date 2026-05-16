import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Animated, KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, getThemeColors } from '@/constants/colors';
import { FontSizes, FontWeights, Spacing, Radius, Shadows } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTrip, TripParams } from '@/contexts/TripContext';
import { INDIAN_CITIES } from '@/constants/cities';

const { width } = Dimensions.get('window');
const TOTAL_STEPS = 5;

const PREMIUM_CITIES = ['Prayagraj', 'Varanasi', 'Katra', 'Delhi', 'Jaipur', 'Manali'];

const BUDGET_OPTIONS = [
  { key: 'low', label: 'Low', emoji: '🎒', desc: 'Trains, buses, street food', color: Colors.budgetLow },
  { key: 'moderate', label: 'Moderate', emoji: '🧳', desc: 'AC trains, mid-range hotels', color: Colors.budgetModerate },
  { key: 'high', label: 'Premium', emoji: '💎', desc: 'Flights, luxury stays', color: Colors.budgetHigh },
];

const INTENT_OPTIONS = [
  { key: 'religious', label: 'Religious', emoji: '🛕', desc: 'Temples, spirituality', color: Colors.religious },
  { key: 'chill', label: 'Chill', emoji: '😌', desc: 'Relax, leisure, slow travel', color: Colors.chill },
  { key: 'explore', label: 'Explore', emoji: '🧭', desc: 'Sightseeing, culture', color: Colors.explore },
  { key: 'adventure', label: 'Adventure', emoji: '🏔️', desc: 'Trekking, thrills', color: Colors.adventure },
  { key: 'romantic', label: 'Romantic', emoji: '💕', desc: 'Couples, honeymoon vibes', color: Colors.pink },
  { key: 'cultural', label: 'Cultural', emoji: '🎭', desc: 'Art, heritage, museums', color: Colors.purple },
  { key: 'foodie', label: 'Foodie', emoji: '🍽️', desc: 'Food trails, local cuisine', color: Colors.orange },
  { key: 'other', label: 'Other', emoji: '✨', desc: 'Mix of everything', color: Colors.info },
];

export default function PlanTripScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ prefillDest?: string }>();
  const { setTripParams } = useTrip();
  const isDark = useColorScheme() === 'dark';
  const theme = getThemeColors(isDark);

  const [step, setStep] = useState(0);
  const [destination, setDestination] = useState(params.prefillDest || '');
  const [source, setSource] = useState('');
  const [budget, setBudget] = useState<string>('');
  const [days, setDays] = useState(3);
  const [people, setPeople] = useState(2);
  const [intents, setIntents] = useState<string[]>([]);
  
  // Suggestions state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;

  const animateProgress = (toStep: number) => {
    Animated.timing(progressAnim, {
      toValue: (toStep + 1) / TOTAL_STEPS,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleCitySearch = (text: string, type: 'source' | 'dest') => {
    if (type === 'source') setSource(text);
    else setDestination(text);

    if (text.length > 1) {
      const filtered = INDIAN_CITIES.filter(city => 
        city.toLowerCase().startsWith(text.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectCity = (city: string, type: 'source' | 'dest') => {
    if (type === 'source') setSource(city);
    else setDestination(city);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const next = () => {
    if (step < TOTAL_STEPS - 1) {
      const nextStep = step + 1;
      setStep(nextStep);
      animateProgress(nextStep);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const prev = () => {
    setSuggestions([]);
    setShowSuggestions(false);
    if (step > 0) {
      const prevStep = step - 1;
      setStep(prevStep);
      animateProgress(prevStep);
    } else {
      router.back();
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return destination.trim().length > 0;
      case 1: return source.trim().length > 0;
      case 2: return budget !== '';
      case 3: return days >= 1 && people >= 1;
      case 4: return intents.length > 0;
      default: return false;
    }
  };

  const toggleIntent = (key: string) => {
    setIntents((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleGenerate = () => {
    const tripData: TripParams = {
      source: source.trim(),
      destination: destination.trim(),
      budget: budget as any,
      days,
      people,
      intent: intents.join(',') as any,
    };
    setTripParams(tripData);
    router.push('/loading');
  };

  const isPremium = PREMIUM_CITIES.some(
    (c) => c.toLowerCase() === destination.trim().toLowerCase()
  );

  const inputBg = isDark ? Colors.darkCardElevated : Colors.gray50;

  const renderSuggestions = (type: 'source' | 'dest') => {
    if (!showSuggestions || suggestions.length === 0) return null;

    return (
      <View style={[styles.suggestionsBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {suggestions.map((city, idx) => (
          <TouchableOpacity 
            key={idx} 
            style={[styles.suggestionItem, idx < suggestions.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: theme.border }]}
            onPress={() => selectCity(city, type)}
          >
            <Ionicons name="location-outline" size={16} color={theme.textSecondary} />
            <Text style={[styles.suggestionText, { color: theme.text }]}>{city}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <View style={styles.stepContent}>
          <Text style={[styles.stepTitle, { color: theme.text }]}>Where to? 🌍</Text>
          <Text style={[styles.stepDesc, { color: theme.textSecondary }]}>Enter your destination city</Text>
          <View style={[styles.inputWrap, { backgroundColor: inputBg }]}>
            <Ionicons name="location" size={22} color={Colors.accent} />
            <TextInput 
              style={[styles.input, { color: theme.text }]} 
              placeholder="e.g. Varanasi, Jaipur, Delhi" 
              placeholderTextColor={theme.textSecondary} 
              value={destination} 
              onChangeText={(t) => handleCitySearch(t, 'dest')} 
              autoFocus 
            />
          </View>
          {renderSuggestions('dest')}
          
          {isPremium && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumText}>⭐ Premium City — curated local data available!</Text>
            </View>
          )}
          {destination.trim() && !isPremium && (
            <View style={styles.aiBadge}>
              <Text style={styles.aiText}>🤖 AI-powered itinerary will be generated</Text>
            </View>
          )}
          <Text style={[styles.premiumLabel, { color: theme.textSecondary }]}>Premium cities:</Text>
          <View style={styles.cityChips}>
            {PREMIUM_CITIES.map((city) => (
              <TouchableOpacity key={city} style={[styles.chip, destination === city && styles.chipActive]} onPress={() => selectCity(city, 'dest')}>
                <Text style={[styles.chipText, destination === city && styles.chipTextActive]}>{city}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );

      case 1: return (
        <View style={styles.stepContent}>
          <Text style={[styles.stepTitle, { color: theme.text }]}>Traveling from? 🚂</Text>
          <Text style={[styles.stepDesc, { color: theme.textSecondary }]}>Your starting city</Text>
          <View style={[styles.inputWrap, { backgroundColor: inputBg }]}>
            <Ionicons name="navigate" size={22} color={Colors.orange} />
            <TextInput 
              style={[styles.input, { color: theme.text }]} 
              placeholder="e.g. Delhi, Mumbai, Lucknow" 
              placeholderTextColor={theme.textSecondary} 
              value={source} 
              onChangeText={(t) => handleCitySearch(t, 'source')} 
              autoFocus 
            />
          </View>
          {renderSuggestions('source')}
        </View>
      );

      case 2: return (
        <View style={styles.stepContent}>
          <Text style={[styles.stepTitle, { color: theme.text }]}>Select Budget 💰</Text>
          <Text style={[styles.stepDesc, { color: theme.textSecondary }]}>We'll tailor suggestions accordingly</Text>
          <View style={styles.optionList}>
            {BUDGET_OPTIONS.map((opt) => (
              <TouchableOpacity key={opt.key} style={[styles.optionCard, { backgroundColor: theme.card, borderColor: budget === opt.key ? opt.color : theme.border }, budget === opt.key && { borderWidth: 2 }]} onPress={() => setBudget(opt.key)} activeOpacity={0.8}>
                <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, { color: theme.text }]}>{opt.label}</Text>
                  <Text style={[styles.optionDesc, { color: theme.textSecondary }]}>{opt.desc}</Text>
                </View>
                {budget === opt.key && <Ionicons name="checkmark-circle" size={24} color={opt.color} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );

      case 3: return (
        <View style={styles.stepContent}>
          <Text style={[styles.stepTitle, { color: theme.text }]}>Trip Details 📋</Text>
          <Text style={[styles.stepDesc, { color: theme.textSecondary }]}>How long and how many people?</Text>
          <View style={styles.stepperSection}>
            <Text style={[styles.stepperLabel, { color: theme.text }]}>Number of Days</Text>
            <View style={styles.stepper}>
              <TouchableOpacity style={[styles.stepperBtn, { backgroundColor: theme.card }]} onPress={() => setDays(Math.max(1, days - 1))}><Text style={styles.stepperBtnText}>−</Text></TouchableOpacity>
              <Text style={[styles.stepperValue, { color: theme.text }]}>{days}</Text>
              <TouchableOpacity style={[styles.stepperBtn, { backgroundColor: theme.card }]} onPress={() => setDays(Math.min(15, days + 1))}><Text style={styles.stepperBtnText}>+</Text></TouchableOpacity>
            </View>
          </View>
          <View style={styles.stepperSection}>
            <Text style={[styles.stepperLabel, { color: theme.text }]}>Number of People</Text>
            <View style={styles.stepper}>
              <TouchableOpacity style={[styles.stepperBtn, { backgroundColor: theme.card }]} onPress={() => setPeople(Math.max(1, people - 1))}><Text style={styles.stepperBtnText}>−</Text></TouchableOpacity>
              <Text style={[styles.stepperValue, { color: theme.text }]}>{people}</Text>
              <TouchableOpacity style={[styles.stepperBtn, { backgroundColor: theme.card }]} onPress={() => setPeople(Math.min(20, people + 1))}><Text style={styles.stepperBtnText}>+</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      );

      case 4: return (
        <View style={styles.stepContent}>
          <Text style={[styles.stepTitle, { color: theme.text }]}>Travel Style? 🎯</Text>
          <Text style={[styles.stepDesc, { color: theme.textSecondary }]}>Select one or more trip types</Text>
          <View style={styles.intentGrid}>
            {INTENT_OPTIONS.map((opt) => {
              const isSelected = intents.includes(opt.key);
              return (
                <TouchableOpacity key={opt.key} style={[styles.intentCard, { backgroundColor: theme.card, borderColor: isSelected ? opt.color : theme.border }, isSelected && { borderWidth: 2 }]} onPress={() => toggleIntent(opt.key)} activeOpacity={0.8}>
                  <Text style={styles.intentEmoji}>{opt.emoji}</Text>
                  <Text style={[styles.intentLabel, { color: theme.text }]}>{opt.label}</Text>
                  <Text style={[styles.intentDesc, { color: theme.textSecondary }]}>{opt.desc}</Text>
                  {isSelected && <View style={[styles.intentCheck, { backgroundColor: opt.color }]}><Ionicons name="checkmark" size={14} color="#fff" /></View>}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      );
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={prev} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.stepIndicator, { color: theme.textSecondary }]}>Step {step + 1} of {TOTAL_STEPS}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressBg, { backgroundColor: theme.border }]}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {renderStep()}
      </ScrollView>

      {/* Bottom button */}
      <View style={[styles.bottomBar, { backgroundColor: theme.background }]}>
        {step === TOTAL_STEPS - 1 ? (
          <TouchableOpacity onPress={handleGenerate} disabled={!canProceed()} activeOpacity={0.85} style={{ width: '100%' }}>
            <LinearGradient colors={canProceed() ? Colors.gradientPrimary : [Colors.gray400, Colors.gray400]} style={styles.generateBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name="sparkles" size={22} color="#fff" />
              <Text style={styles.generateText}>Generate Smart Itinerary</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.nextBtn, { backgroundColor: canProceed() ? Colors.accent : Colors.gray400 }]} onPress={next} disabled={!canProceed()} activeOpacity={0.85}>
            <Text style={styles.nextText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'ios' ? 58 : 40, paddingHorizontal: Spacing.xl, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  stepIndicator: { fontSize: FontSizes.sm, fontWeight: FontWeights.medium },
  progressBg: { height: 4, marginHorizontal: Spacing.xl, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 2 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingTop: 24, paddingBottom: 30 },
  stepContent: {},
  stepTitle: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, marginBottom: 6 },
  stepDesc: { fontSize: FontSizes.base, marginBottom: 24, lineHeight: 22 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.lg, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 16 : 6, gap: 12 },
  input: { flex: 1, fontSize: FontSizes.md },
  premiumBadge: { marginTop: 12, backgroundColor: Colors.accent + '15', paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.md },
  premiumText: { fontSize: FontSizes.sm, color: Colors.accent, fontWeight: FontWeights.medium },
  aiBadge: { marginTop: 12, backgroundColor: Colors.purple + '15', paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.md },
  aiText: { fontSize: FontSizes.sm, color: Colors.purple, fontWeight: FontWeights.medium },
  premiumLabel: { fontSize: FontSizes.xs, fontWeight: FontWeights.semibold, marginTop: 20, marginBottom: 10, letterSpacing: 0.5 },
  cityChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.gray100, borderWidth: 1, borderColor: 'transparent' },
  chipActive: { backgroundColor: Colors.accent + '15', borderColor: Colors.accent },
  chipText: { fontSize: FontSizes.sm, color: Colors.gray600, fontWeight: FontWeights.medium },
  chipTextActive: { color: Colors.accent },
  optionList: { gap: 12 },
  optionCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: Radius.lg, gap: 14, borderWidth: 1 },
  optionEmoji: { fontSize: 30 },
  optionLabel: { fontSize: FontSizes.md, fontWeight: FontWeights.semibold },
  optionDesc: { fontSize: FontSizes.sm, marginTop: 2 },
  stepperSection: { marginBottom: 28 },
  stepperLabel: { fontSize: FontSizes.md, fontWeight: FontWeights.semibold, marginBottom: 14 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 },
  stepperBtn: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  stepperBtnText: { fontSize: 24, fontWeight: FontWeights.semibold, color: Colors.accent },
  stepperValue: { fontSize: FontSizes['3xl'], fontWeight: FontWeights.bold, minWidth: 50, textAlign: 'center' },
  intentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  intentCard: { width: (width - 60) / 2, padding: 18, borderRadius: Radius.lg, alignItems: 'center', borderWidth: 1, position: 'relative' },
  intentEmoji: { fontSize: 36, marginBottom: 8 },
  intentLabel: { fontSize: FontSizes.md, fontWeight: FontWeights.semibold },
  intentDesc: { fontSize: FontSizes.xs, textAlign: 'center', marginTop: 4 },
  intentCheck: { position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  bottomBar: { paddingHorizontal: Spacing.xl, paddingVertical: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 16 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 17, borderRadius: Radius.lg, gap: 8 },
  nextText: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: '#fff' },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: Radius.lg, gap: 10 },
  generateText: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: '#fff' },

  // Suggestions
  suggestionsBox: {
    marginTop: 4,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 10,
    ...Shadows.md,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  suggestionText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
});
