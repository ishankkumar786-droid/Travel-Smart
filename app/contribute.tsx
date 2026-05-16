import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Animated, Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, getThemeColors } from '@/constants/colors';
import { FontSizes, FontWeights, Spacing, Radius } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { contributionsAPI } from '@/services/api';

const TYPES = [
  { key: 'place', label: 'Place', emoji: '📍', desc: 'A must-visit spot' },
  { key: 'food', label: 'Food', emoji: '🍜', desc: 'A food spot or dish' },
  { key: 'tip', label: 'Tip', emoji: '💡', desc: 'A useful travel tip' },
];

export default function ContributeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ city?: string }>();
  const isDark = useColorScheme() === 'dark';
  const theme = getThemeColors(isDark);

  const [city, setCity] = useState(params.city || '');
  const [type, setType] = useState('place');
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('other');
  const [budget, setBudget] = useState('moderate');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const handleSubmit = async () => {
    if (!city.trim() || !name.trim() || !content.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await contributionsAPI.submit({ 
        city: city.trim(), 
        type, 
        content: content.trim(),
        details: { 
          name: name.trim(),
          category: type === 'place' ? category : undefined,
          type: type === 'food' ? 'restaurant' : undefined,
          budgetCategory: type === 'food' ? budget : undefined,
          rating: 4.5
        }
      });
      setSubmitted(true);
      Animated.spring(successScale, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }).start();
    } catch {
      Alert.alert('Error', 'Failed to submit. Please try again.');
    }
    setLoading(false);
  };

  const inputBg = isDark ? Colors.darkCardElevated : Colors.gray50;

  if (submitted) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <Animated.View style={[styles.successCard, { transform: [{ scale: successScale }] }]}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={[styles.successTitle, { color: theme.text }]}>Thank You!</Text>
          <Text style={[styles.successDesc, { color: theme.textSecondary }]}>
            Your contribution for {city} has been submitted and will be reviewed soon.
          </Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        contentContainerStyle={styles.scroll} 
        showsVerticalScrollIndicator={false} 
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.headerEmoji}>❤️</Text>
          <Text style={[styles.title, { color: theme.text }]}>Share Local Knowledge</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Know a great place, food spot, or tip? Help fellow travelers!
          </Text>

          {/* City */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>CITY</Text>
            <View style={[styles.inputWrap, { backgroundColor: inputBg }]}>
              <Ionicons name="location-outline" size={20} color={theme.textSecondary} />
              <TextInput style={[styles.input, { color: theme.text }]} placeholder="e.g. Varanasi" placeholderTextColor={theme.textSecondary} value={city} onChangeText={setCity} />
            </View>
          </View>

          {/* Type */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>TYPE</Text>
            <View style={styles.typeRow}>
              {TYPES.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.typeCard, { backgroundColor: theme.card, borderColor: type === t.key ? Colors.accent : theme.border }, type === t.key && { borderWidth: 2 }]}
                  onPress={() => setType(t.key)}
                >
                  <Text style={styles.typeEmoji}>{t.emoji}</Text>
                  <Text style={[styles.typeLabel, { color: theme.text }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Name of Place/Food */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              {type === 'food' ? 'RESTAURANT / CAFE NAME' : `NAME OF ${type.toUpperCase()}`}
            </Text>
            <View style={[styles.inputWrap, { backgroundColor: inputBg }]}>
              <Ionicons name="bookmark-outline" size={20} color={theme.textSecondary} />
              <TextInput 
                style={[styles.input, { color: theme.text }]} 
                placeholder={type === 'food' ? "e.g. Netram Kachori or El Chico" : `What is the ${type} called?`} 
                placeholderTextColor={theme.textSecondary} 
                value={name} 
                onChangeText={setName} 
              />
            </View>
          </View>

          {/* Place Category Selector (Conditional) */}
          {type === 'place' && (
            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>CATEGORY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                {['temple', 'monument', 'nature', 'market', 'museum', 'park', 'historical', 'other'].map((cat) => (
                  <TouchableOpacity 
                    key={cat} 
                    style={[styles.chip, category === cat && styles.chipActive]} 
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Food Budget Selector (Conditional) */}
          {type === 'food' && (
            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>BUDGET LEVEL</Text>
              <View style={styles.typeRow}>
                {[
                  { key: 'low', label: 'Cheap', emoji: '🪙' },
                  { key: 'moderate', label: 'Mid-range', emoji: '💵' },
                  { key: 'high', label: 'Luxury', emoji: '💳' }
                ].map((b) => (
                  <TouchableOpacity
                    key={b.key}
                    style={[styles.typeCard, { backgroundColor: theme.card, borderColor: budget === b.key ? Colors.orange : theme.border }, budget === b.key && { borderWidth: 2 }]}
                    onPress={() => setBudget(b.key)}
                  >
                    <Text style={styles.typeEmoji}>{b.emoji}</Text>
                    <Text style={[styles.typeLabel, { color: theme.text }]}>{b.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Content / Description */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>DESCRIPTION / WHY RECOMMEND IT?</Text>
            <View style={[styles.textareaWrap, { backgroundColor: inputBg }]}>
              <TextInput
                style={[styles.textarea, { color: theme.text }]}
                placeholder="Share more details, what to see or eat there..."
                placeholderTextColor={theme.textSecondary}
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={1000}
              />
            </View>
            <Text style={[styles.charCount, { color: theme.textSecondary }]}>{content.length}/1000</Text>
          </View>

          {/* Submit */}
          <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Contribution</Text>}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },
  header: { paddingTop: Platform.OS === 'ios' ? 58 : 40, marginBottom: 10 },
  closeBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerEmoji: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: FontSizes.base, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  field: { marginBottom: 20 },
  label: { fontSize: FontSizes.xs, fontWeight: FontWeights.semibold, letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.lg, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 15 : 4, gap: 12 },
  input: { flex: 1, fontSize: FontSizes.base },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeCard: { flex: 1, alignItems: 'center', padding: 16, borderRadius: Radius.lg, borderWidth: 1, gap: 6 },
  typeEmoji: { fontSize: 24 },
  typeLabel: { fontSize: FontSizes.sm, fontWeight: FontWeights.semibold },
  chipScroll: { gap: 8, paddingLeft: 4 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.gray100, borderWidth: 1, borderColor: 'transparent' },
  chipActive: { backgroundColor: Colors.accent + '15', borderColor: Colors.accent },
  chipText: { fontSize: FontSizes.sm, color: Colors.gray600, fontWeight: FontWeights.medium },
  chipTextActive: { color: Colors.accent },
  textareaWrap: { borderRadius: Radius.lg, padding: 16, minHeight: 120 },
  textarea: { fontSize: FontSizes.base, lineHeight: 22 },
  charCount: { fontSize: FontSizes.xs, textAlign: 'right', marginTop: 4 },
  submitBtn: { backgroundColor: Colors.accent, paddingVertical: 17, borderRadius: Radius.lg, alignItems: 'center', marginTop: 8 },
  submitText: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: '#fff' },
  successCard: { alignItems: 'center', padding: 30 },
  successEmoji: { fontSize: 64, marginBottom: 16 },
  successTitle: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, marginBottom: 8 },
  successDesc: { fontSize: FontSizes.base, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  doneBtn: { backgroundColor: Colors.accent, paddingHorizontal: 40, paddingVertical: 14, borderRadius: Radius.lg },
  doneBtnText: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: '#fff' },
});
