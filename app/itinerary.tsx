import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Platform, Alert, Dimensions, TextInput,
  KeyboardAvoidingView, ActivityIndicator, Keyboard,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, getThemeColors } from '@/constants/colors';
import { FontSizes, FontWeights, Spacing, Radius, Shadows } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTrip, DayItinerary, Itinerary } from '@/contexts/TripContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tripsAPI, chatAPI } from '@/services/api';
import { generateItineraryPDF } from '@/utils/pdfGenerator';
import { storageService } from '@/services/storageService';
import JournalTab from '@/components/journal/JournalTab';

const { width } = Dimensions.get('window');

const categoryIcons: Record<string, string> = {
  temple: '🛕', monument: '🏛️', nature: '🌿', market: '🛒', museum: '🏛️',
  park: '🌳', lake: '🏞️', fort: '🏰', palace: '👑', beach: '🏖️',
  adventure: '🧗', viewpoint: '👁️', religious: '🙏', historical: '📜', other: '📍',
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function ItineraryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();
  const { currentItinerary, tripParams } = useTrip();
  const { isAuthenticated } = useAuth();
  const isDark = useColorScheme() === 'dark';
  const theme = getThemeColors(isDark);
  const [expandedDay, setExpandedDay] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [activeTab, setActiveTab] = useState<'itinerary' | 'chat' | 'journal' | 'contribute'>('itinerary');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Trip loaded from API (for My Trips) or from context
  const [loadedItinerary, setLoadedItinerary] = useState<Itinerary | null>(null);
  const [loadingTrip, setLoadingTrip] = useState(false);

  // Chat state — temporary, in-memory only
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<ScrollView>(null);

  // Load trip from API when tripId is provided (coming from My Trips)
  useEffect(() => {
    if (tripId) {
      setLoadingTrip(true);
      setSaved(true); // Already saved since it came from My Trips
      tripsAPI.getById(tripId)
        .then((res) => {
          if (res.data.success && res.data.data.trip) {
            const trip = res.data.data.trip;
            setLoadedItinerary(trip.itinerary);
            setIsOffline(false);
            // Cache individual itinerary
            storageService.saveItinerary(tripId, trip.itinerary);
          }
        })
        .catch(async () => {
          // Try offline cache
          const cached = await storageService.getCachedItinerary(tripId);
          if (cached) {
            setLoadedItinerary(cached);
            setIsOffline(true);
          } else {
            Alert.alert('Offline', 'This trip is not available offline. Please connect to internet once to download it.');
          }
        })
        .finally(() => setLoadingTrip(false));
    }
  }, [tripId]);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  // Use loaded trip data if tripId was provided, otherwise use context
  const itinerary = tripId ? loadedItinerary : currentItinerary;

  if (loadingTrip) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={{ color: theme.textSecondary, marginTop: 12, fontSize: FontSizes.base }}>Loading trip...</Text>
      </View>
    );
  }

  if (!itinerary) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text, fontSize: FontSizes.lg }}>No itinerary found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.retryBtn}>
          <Text style={{ color: Colors.white, fontWeight: FontWeights.semibold }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSave = async () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Sign in to save your trips', [
        { text: 'Cancel' },
        { text: 'Sign In', onPress: () => router.push('/auth') },
      ]);
      return;
    }
    setSaving(true);
    try {
      await tripsAPI.save({ ...tripParams, itinerary, mode: itinerary.mode, confidenceScore: itinerary.confidenceScore });
      setSaved(true);
      Alert.alert('Saved!', 'Trip saved to My Trips');
    } catch { Alert.alert('Error', 'Failed to save trip'); }
    setSaving(false);
  };

  // ===== Chat (temporary, in-memory only) =====
  const handleSendChat = async () => {
    const question = chatInput.trim();
    if (!question || chatLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: question };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await chatAPI.ask(question, itinerary);
      const assistantMsg: ChatMessage = { role: 'assistant', content: res.data.data.answer };
      setChatMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I could not process your question. Please try again.' }]);
    }
    setChatLoading(false);

    // Scroll to bottom
    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const toggleDay = (dayNum: number) => {
    setExpandedDay(expandedDay === dayNum ? -1 : dayNum);
  };

  const renderDayCard = (day: DayItinerary) => {
    const isExpanded = expandedDay === day.day;
    return (
      <View key={day.day} style={[styles.dayCard, { backgroundColor: theme.card }]}>
        <TouchableOpacity onPress={() => toggleDay(day.day)} style={styles.dayHeader} activeOpacity={0.7}>
          <View style={styles.dayBadge}>
            <Text style={styles.dayBadgeText}>Day {day.day}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.dayTitle, { color: theme.text }]}>{day.title}</Text>
          </View>
          <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={22} color={theme.textSecondary} />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.dayBody}>
            {/* Travel */}
            {day.travel && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: Colors.accent }]}>🚆 TRAVEL</Text>
                <View style={[styles.infoCard, { backgroundColor: isDark ? Colors.darkCardElevated : Colors.gray50 }]}>
                  <Text style={[styles.infoText, { color: theme.text }]}>Mode: {day.travel.mode}</Text>
                  <Text style={[styles.infoText, { color: theme.text }]}>Duration: {day.travel.duration}</Text>
                  <Text style={[styles.infoText, { color: theme.text }]}>Cost: {day.travel.costRange}</Text>
                  {day.travel.distance && <Text style={[styles.infoText, { color: theme.text }]}>Distance: {day.travel.distance}</Text>}
                </View>
              </View>
            )}

            {/* Places */}
            {day.places.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: Colors.explore }]}>📍 PLACES TO VISIT</Text>
                {day.places.map((place, i) => (
                  <View key={i} style={[styles.placeCard, { backgroundColor: isDark ? Colors.darkCardElevated : Colors.gray50 }]}>
                    <Text style={styles.placeEmoji}>{categoryIcons[place.category] || '📍'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.placeName, { color: theme.text }]}>{place.name}</Text>
                      <View style={styles.placeMeta}>
                        {place.bestTime && <Text style={[styles.placeMetaText, { color: theme.textSecondary }]}>🕐 {place.bestTime}</Text>}
                        {place.duration && <Text style={[styles.placeMetaText, { color: theme.textSecondary }]}>⏱️ {place.duration}</Text>}
                      </View>
                      {place.entryFee && <Text style={[styles.placeMetaText, { color: theme.textSecondary }]}>🎫 {place.entryFee}</Text>}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Food */}
            {day.food.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: Colors.orange }]}>🍜 FOOD SUGGESTIONS</Text>
                {day.food.map((f, i) => (
                  <View key={i} style={[styles.foodCard, { backgroundColor: isDark ? Colors.darkCardElevated : Colors.gray50 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.placeName, { color: theme.text }]}>{f.name}</Text>
                      {f.famousFor && <Text style={[styles.placeMetaText, { color: theme.textSecondary }]}>Famous for: {f.famousFor}</Text>}
                      {f.priceRange && <Text style={[styles.placeMetaText, { color: theme.textSecondary }]}>💰 {f.priceRange}</Text>}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Stay */}
            {day.stay && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: Colors.purple }]}>🏨 STAY</Text>
                <View style={[styles.infoCard, { backgroundColor: isDark ? Colors.darkCardElevated : Colors.gray50 }]}>
                  <Text style={[styles.infoText, { color: theme.text }]}>Category: {day.stay.category}</Text>
                  <Text style={[styles.infoText, { color: theme.text }]}>Range: {day.stay.priceRange}</Text>
                </View>
              </View>
            )}

            {/* Local Gems */}
            {day.localGems && day.localGems.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: Colors.yellow }]}>🔥 LOCAL GEMS</Text>
                {day.localGems.map((gem, i) => (
                  <View key={i} style={[styles.gemCard, { borderColor: Colors.yellow + '40' }]}>
                    <Text style={styles.gemBadge}>🔥 Local Favorite</Text>
                    <Text style={[styles.placeName, { color: theme.text }]}>{gem.name}</Text>
                    <Text style={[styles.placeMetaText, { color: theme.textSecondary }]}>{gem.description}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Tips */}
            {day.tips.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: Colors.info }]}>💡 TIPS</Text>
                {day.tips.map((tip, i) => (
                  <Text key={i} style={[styles.tipText, { color: theme.text }]}>• {tip}</Text>
                ))}
              </View>
            )}

            {/* Avoid */}
            {day.avoid.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: Colors.error }]}>⚠️ AVOID</Text>
                {day.avoid.map((a, i) => (
                  <Text key={i} style={[styles.tipText, { color: theme.textSecondary }]}>• {a}</Text>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };


  // ===== Chat Panel =====
  const renderChatPanel = () => {
    if (!chatOpen) return null;

    return (
      <KeyboardAvoidingView
        style={styles.chatOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <TouchableOpacity 
          style={{ flex: 1 }} 
          activeOpacity={1} 
          onPress={() => {
            Keyboard.dismiss();
            setChatOpen(false);
          }}
        />
        <View style={[styles.chatPanel, { backgroundColor: theme.background }]}>
          {/* Chat Header */}
          <View style={[styles.chatHeader, { borderBottomColor: theme.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="chatbubbles" size={22} color={Colors.accent} />
              <Text style={[styles.chatHeaderTitle, { color: theme.text }]}>Trip Assistant</Text>
            </View>
            <TouchableOpacity onPress={() => setChatOpen(false)} style={styles.chatCloseBtn}>
              <Ionicons name="close" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Chat Messages */}
          <ScrollView
            ref={chatScrollRef}
            style={styles.chatMessages}
            contentContainerStyle={styles.chatMessagesContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
          >
            {chatMessages.length === 0 && (
              <View style={styles.chatEmpty}>
                <Text style={{ fontSize: 40 }}>💬</Text>
                <Text style={[styles.chatEmptyTitle, { color: theme.text }]}>Ask about your trip</Text>
                <Text style={[styles.chatEmptySubtitle, { color: theme.textSecondary }]}>
                  I can help with questions about your itinerary, suggest changes, or provide travel tips!
                </Text>
              </View>
            )}
            {chatMessages.map((msg, i) => (
              <View
                key={i}
                style={[
                  styles.chatBubble,
                  msg.role === 'user' ? styles.chatBubbleUser : [styles.chatBubbleAssistant, { backgroundColor: isDark ? Colors.darkCardElevated : Colors.gray50 }],
                ]}
              >
                <Text
                  style={[
                    styles.chatBubbleText,
                    { color: msg.role === 'user' ? '#fff' : theme.text },
                  ]}
                >
                  {msg.content}
                </Text>
              </View>
            ))}
            {chatLoading && (
              <View style={[styles.chatBubble, styles.chatBubbleAssistant, { backgroundColor: isDark ? Colors.darkCardElevated : Colors.gray50 }]}>
                <ActivityIndicator size="small" color={Colors.accent} />
              </View>
            )}
          </ScrollView>

          {/* Chat Input */}
          <View style={[styles.chatInputBar, { backgroundColor: theme.card, borderTopColor: theme.border, paddingBottom: insets.bottom > 0 ? insets.bottom : 12 }]}>
            <TextInput
              style={[styles.chatTextInput, { color: theme.text, backgroundColor: isDark ? Colors.darkCardElevated : Colors.gray50 }]}
              placeholder="Ask about your trip..."
              placeholderTextColor={theme.textSecondary}
              value={chatInput}
              onChangeText={setChatInput}
              multiline
              maxLength={500}
              onSubmitEditing={handleSendChat}
              onFocus={() => setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100)}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[styles.chatSendBtn, { opacity: chatInput.trim() && !chatLoading ? 1 : 0.4 }]}
              onPress={handleSendChat}
              disabled={!chatInput.trim() || chatLoading}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  };

  // Determine if this is a saved trip (tabs mode) or fresh trip (legacy mode)
  const isSavedTrip = !!tripId;

  // ===== SAVED TRIP: Tab-based layout =====
  if (isSavedTrip) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <LinearGradient colors={Colors.gradientPrimary} style={styles.headerGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Your Itinerary</Text>
            <TouchableOpacity onPress={() => generateItineraryPDF(itinerary)} style={styles.headerBtn}>
              <Ionicons name="download-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerDest}>{itinerary.destination}</Text>
          <View style={styles.headerMeta}>
            <View style={[styles.modePill, { backgroundColor: itinerary.mode === 'premium' ? 'rgba(255,255,255,0.2)' : 'rgba(108,92,231,0.3)' }]}>
              <Text style={styles.modeText}>{itinerary.mode === 'premium' ? '⭐ Premium' : '🤖 AI Generated'}</Text>
            </View>
            <Text style={styles.headerMetaText}>{itinerary.days.length} days • {itinerary.budget} budget</Text>
          </View>
        </LinearGradient>

        {/* Tab Bar */}
        <View style={[styles.tabBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          {[
            { key: 'itinerary' as const, label: 'Itinerary', icon: 'map-outline' },
            { key: 'chat' as const, label: 'Chat', icon: 'chatbubble-ellipses-outline' },
            { key: 'journal' as const, label: 'Journal', icon: 'book-outline' },
            { key: 'contribute' as const, label: 'Contribute', icon: 'heart-outline' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons
                name={tab.icon as any}
                size={20}
                color={activeTab === tab.key ? Colors.accent : theme.textSecondary}
              />
              <Text style={[styles.tabLabel, { color: activeTab === tab.key ? Colors.accent : theme.textSecondary }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'itinerary' && (
          <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Travel Overview Card */}
              {itinerary.travelOverview && (
                <View style={[styles.overviewCard, { backgroundColor: theme.card }]}>
                  <View style={styles.overviewHeader}>
                    <Ionicons name="airplane" size={20} color={Colors.accent} />
                    <Text style={[styles.overviewTitle, { color: theme.text }]}>Travel Overview</Text>
                  </View>
                  <View style={styles.overviewGrid}>
                    <View style={styles.overviewItem}>
                      <Text style={styles.overviewLabel}>Distance</Text>
                      <Text style={[styles.overviewValue, { color: theme.text }]}>{itinerary.travelOverview.distance}</Text>
                    </View>
                    <View style={styles.overviewItem}>
                      <Text style={styles.overviewLabel}>Duration</Text>
                      <Text style={[styles.overviewValue, { color: theme.text }]}>{itinerary.travelOverview.duration}</Text>
                    </View>
                    <View style={styles.overviewItem}>
                      <Text style={styles.overviewLabel}>Best Mode</Text>
                      <Text style={[styles.overviewValue, { color: theme.text }]}>{itinerary.travelOverview.mode}</Text>
                    </View>
                    <View style={styles.overviewItem}>
                      <Text style={styles.overviewLabel}>Est. Cost</Text>
                      <Text style={[styles.overviewValue, { color: theme.text }]}>{itinerary.travelOverview.costRange}</Text>
                    </View>
                  </View>
                </View>
              )}

              {itinerary.days.map(renderDayCard)}
              <View style={{ height: 30 }} />
            </ScrollView>
          </Animated.View>
        )}

        {activeTab === 'chat' && (
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            <ScrollView
              ref={chatScrollRef}
              style={styles.chatMessages}
              contentContainerStyle={styles.chatMessagesContent}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
              keyboardShouldPersistTaps="handled"
            >
              {chatMessages.length === 0 && (
                <View style={styles.chatEmpty}>
                  <Text style={{ fontSize: 40 }}>💬</Text>
                  <Text style={[styles.chatEmptyTitle, { color: theme.text }]}>Ask about your trip</Text>
                  <Text style={[styles.chatEmptySubtitle, { color: theme.textSecondary }]}>
                    I can help with questions about your itinerary, suggest changes, or provide travel tips!
                  </Text>
                </View>
              )}
              {chatMessages.map((msg, i) => (
                <View
                  key={i}
                  style={[
                    styles.chatBubble,
                    msg.role === 'user' ? styles.chatBubbleUser : [styles.chatBubbleAssistant, { backgroundColor: isDark ? Colors.darkCardElevated : Colors.gray50 }],
                  ]}
                >
                  <Text style={[styles.chatBubbleText, { color: msg.role === 'user' ? '#fff' : theme.text }]}>
                    {msg.content}
                  </Text>
                </View>
              ))}
              {chatLoading && (
                <View style={[styles.chatBubble, styles.chatBubbleAssistant, { backgroundColor: isDark ? Colors.darkCardElevated : Colors.gray50 }]}>
                  <ActivityIndicator size="small" color={Colors.accent} />
                </View>
              )}
            </ScrollView>
            <View style={[styles.chatInputBar, { backgroundColor: theme.card, borderTopColor: theme.border, paddingBottom: insets.bottom > 0 ? insets.bottom : 12 }]}>
              <TextInput
                style={[styles.chatTextInput, { color: theme.text, backgroundColor: isDark ? Colors.darkCardElevated : Colors.gray50 }]}
                placeholder="Ask about your trip..."
                placeholderTextColor={theme.textSecondary}
                value={chatInput}
                onChangeText={setChatInput}
                multiline
                maxLength={500}
                onSubmitEditing={handleSendChat}
                onFocus={() => setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 200)}
                blurOnSubmit={false}
              />
              <TouchableOpacity
                style={[styles.chatSendBtn, { opacity: chatInput.trim() && !chatLoading ? 1 : 0.4 }]}
                onPress={handleSendChat}
                disabled={!chatInput.trim() || chatLoading}
              >
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}

        {activeTab === 'journal' && (
          <JournalTab tripId={tripId} />
        )}

        {activeTab === 'contribute' && (
          <View style={[styles.contributeTab, { flex: 1 }]}>
            <ScrollView contentContainerStyle={styles.contributeContent} showsVerticalScrollIndicator={false}>
              <View style={styles.contributeEmptyState}>
                <Text style={{ fontSize: 56 }}>❤️</Text>
                <Text style={[styles.contributeTitle, { color: theme.text }]}>Share Local Knowledge</Text>
                <Text style={[styles.contributeSubtitle, { color: theme.textSecondary }]}>
                  Know a hidden gem in {itinerary.destination}? Help fellow travelers discover it!
                </Text>
                <TouchableOpacity
                  style={styles.contributeCTA}
                  onPress={() => router.push({ pathname: '/contribute', params: { city: itinerary.destination } })}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add-circle-outline" size={22} color="#fff" />
                  <Text style={styles.contributeCTAText}>Contribute a Tip</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
      </View>
    );
  }

  // ===== FRESH TRIP: Legacy layout (unchanged) =====
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <LinearGradient colors={Colors.gradientPrimary} style={styles.headerGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Itinerary</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerDest}>{itinerary.destination}</Text>
        <View style={styles.headerMeta}>
          <View style={[styles.modePill, { backgroundColor: itinerary.mode === 'premium' ? 'rgba(255,255,255,0.2)' : 'rgba(108,92,231,0.3)' }]}>
            <Text style={styles.modeText}>{itinerary.mode === 'premium' ? '⭐ Premium' : '🤖 AI Generated'}</Text>
          </View>
          <Text style={styles.headerMetaText}>{itinerary.days.length} days • {itinerary.budget} budget</Text>
        </View>
      </LinearGradient>

      {/* Disclaimer */}
      {itinerary.disclaimer && (
        <View style={styles.disclaimer}>
          <Ionicons name="information-circle" size={18} color={Colors.warning} />
          <Text style={styles.disclaimerText}>{itinerary.disclaimer}</Text>
        </View>
      )}

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Travel Overview Card (Instant) */}
          {itinerary.travelOverview && (
            <View style={[styles.overviewCard, { backgroundColor: theme.card }]}>
              <View style={styles.overviewHeader}>
                <Ionicons name="airplane" size={20} color={Colors.accent} />
                <Text style={[styles.overviewTitle, { color: theme.text }]}>Travel Overview</Text>
              </View>
              <View style={styles.overviewGrid}>
                <View style={styles.overviewItem}>
                  <Text style={styles.overviewLabel}>Distance</Text>
                  <Text style={[styles.overviewValue, { color: theme.text }]}>{itinerary.travelOverview.distance}</Text>
                </View>
                <View style={styles.overviewItem}>
                  <Text style={styles.overviewLabel}>Duration</Text>
                  <Text style={[styles.overviewValue, { color: theme.text }]}>{itinerary.travelOverview.duration}</Text>
                </View>
                <View style={styles.overviewItem}>
                  <Text style={styles.overviewLabel}>Best Mode</Text>
                  <Text style={[styles.overviewValue, { color: theme.text }]}>{itinerary.travelOverview.mode}</Text>
                </View>
                <View style={styles.overviewItem}>
                  <Text style={styles.overviewLabel}>Est. Cost</Text>
                  <Text style={[styles.overviewValue, { color: theme.text }]}>{itinerary.travelOverview.costRange}</Text>
                </View>
              </View>
            </View>
          )}

          {itinerary.days.map(renderDayCard)}
          <View style={{ height: 100 }} />
        </ScrollView>
      </Animated.View>

      {/* Action Bar */}
      <View style={[styles.actionBar, { backgroundColor: theme.card, borderTopColor: theme.border, paddingBottom: insets.bottom > 0 ? insets.bottom : 12 }]}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleSave} disabled={saving || saved}>
          <Ionicons name={saved ? 'checkmark-circle' : 'bookmark-outline'} size={24} color={saved ? Colors.success : Colors.accent} />
          <Text style={[styles.actionText, { color: saved ? Colors.success : theme.text }]}>{saved ? 'Saved' : 'Save'}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionBtn, isOffline && { opacity: 0.5 }]} 
          onPress={() => !isOffline && setChatOpen(true)}
          disabled={isOffline}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={24} color={isOffline ? theme.textSecondary : Colors.info} />
          <Text style={[styles.actionText, { color: theme.text }]}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push({ pathname: '/contribute', params: { city: itinerary.destination } })}>
          <Ionicons name="heart-outline" size={24} color={Colors.orange} />
          <Text style={[styles.actionText, { color: theme.text }]}>Contribute</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => generateItineraryPDF(itinerary)}>
          <Ionicons name="download-outline" size={24} color={Colors.accent} />
          <Text style={[styles.actionText, { color: theme.text }]}>Export</Text>
        </TouchableOpacity>
      </View>

      {/* Chat Panel Overlay */}
      {renderChatPanel()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  retryBtn: { backgroundColor: Colors.accent, paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radius.md, marginTop: 12 },
  headerGrad: { paddingTop: Platform.OS === 'ios' ? 58 : 40, paddingBottom: 22, paddingHorizontal: Spacing.xl },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headerBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: FontSizes.md, fontWeight: FontWeights.semibold, color: 'rgba(255,255,255,0.8)' },
  headerDest: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: '#fff', marginBottom: 8 },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modePill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.full },
  modeText: { fontSize: FontSizes.xs, fontWeight: FontWeights.semibold, color: '#fff' },
  headerMetaText: { fontSize: FontSizes.sm, color: 'rgba(255,255,255,0.7)' },
  disclaimer: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: Spacing.base, padding: 12, backgroundColor: Colors.warning + '15', borderRadius: Radius.md },
  disclaimerText: { flex: 1, fontSize: FontSizes.sm, color: Colors.warning },
  overviewCard: { margin: 16, padding: 16, borderRadius: Radius.lg, ...Shadows.sm },
  overviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  overviewTitle: { fontSize: FontSizes.md, fontWeight: FontWeights.bold },
  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  overviewItem: { width: (width - 72) / 2, backgroundColor: 'rgba(0,0,0,0.03)', padding: 10, borderRadius: Radius.md },
  overviewLabel: { fontSize: FontSizes.xs, color: '#888', marginBottom: 4, fontWeight: FontWeights.medium },
  overviewValue: { fontSize: FontSizes.sm, fontWeight: FontWeights.semibold },
  scrollContent: { padding: Spacing.base },
  dayCard: { borderRadius: Radius.lg, marginBottom: 14, overflow: 'hidden' },
  dayHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  dayBadge: { backgroundColor: Colors.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.md },
  dayBadgeText: { fontSize: FontSizes.xs, fontWeight: FontWeights.bold, color: '#fff' },
  dayTitle: { fontSize: FontSizes.md, fontWeight: FontWeights.semibold },
  dayBody: { paddingHorizontal: 16, paddingBottom: 16 },
  section: { marginBottom: 18 },
  sectionLabel: { fontSize: FontSizes.xs, fontWeight: FontWeights.bold, letterSpacing: 1, marginBottom: 8 },
  infoCard: { padding: 12, borderRadius: Radius.md, gap: 4 },
  infoText: { fontSize: FontSizes.sm },
  placeCard: { flexDirection: 'row', alignItems: 'flex-start', padding: 12, borderRadius: Radius.md, gap: 10, marginBottom: 8 },
  placeEmoji: { fontSize: 24, marginTop: 2 },
  placeName: { fontSize: FontSizes.base, fontWeight: FontWeights.semibold },
  placeMeta: { flexDirection: 'row', gap: 12, marginTop: 4, flexWrap: 'wrap' },
  placeMetaText: { fontSize: FontSizes.xs },
  foodCard: { padding: 12, borderRadius: Radius.md, marginBottom: 8 },
  gemCard: { padding: 12, borderRadius: Radius.md, borderWidth: 1, marginBottom: 8, borderStyle: 'dashed' },
  gemBadge: { fontSize: FontSizes.xs, fontWeight: FontWeights.bold, color: Colors.yellow, marginBottom: 4 },
  tipText: { fontSize: FontSizes.sm, marginBottom: 4, lineHeight: 20 },
  actionBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, borderTopWidth: 0.5 },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionText: { fontSize: FontSizes.xs, fontWeight: FontWeights.medium },

  // Chat overlay styles
  chatOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, justifyContent: 'flex-end' },
  chatContainer: { flex: 1, justifyContent: 'flex-end' },
  chatPanel: { height: '75%', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 0.5 },
  chatHeaderTitle: { fontSize: FontSizes.md, fontWeight: FontWeights.semibold },
  chatCloseBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  chatMessages: { flex: 1 },
  chatMessagesContent: { padding: 16, gap: 10 },
  chatEmpty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 8 },
  chatEmptyTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.semibold },
  chatEmptySubtitle: { fontSize: FontSizes.sm, textAlign: 'center', paddingHorizontal: 30, lineHeight: 20 },
  chatBubble: { maxWidth: '82%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  chatBubbleUser: { alignSelf: 'flex-end', backgroundColor: Colors.accent, borderBottomRightRadius: 4 },
  chatBubbleAssistant: { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  chatBubbleText: { fontSize: FontSizes.sm, lineHeight: 20 },
  chatInputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 10, gap: 8, borderTopWidth: 0.5 },
  chatVoiceBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  chatTextInput: { flex: 1, fontSize: FontSizes.sm, borderRadius: Radius.lg, paddingHorizontal: 16, paddingVertical: 10, maxHeight: 100 },
  chatSendBtn: { backgroundColor: Colors.accent, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },

  // Tab bar
  tabBar: { flexDirection: 'row', borderBottomWidth: 0.5, paddingTop: 4 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 3 },
  tabItemActive: { borderBottomWidth: 2, borderBottomColor: Colors.accent },
  tabLabel: { fontSize: FontSizes.xs, fontWeight: FontWeights.medium },

  // Contribute tab
  contributeTab: {},
  contributeContent: { paddingHorizontal: Spacing.xl, paddingTop: 40 },
  contributeEmptyState: { alignItems: 'center', gap: 12 },
  contributeTitle: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold },
  contributeSubtitle: { fontSize: FontSizes.base, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
  contributeCTA: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.orange, paddingHorizontal: 24, paddingVertical: 14, borderRadius: Radius.lg, marginTop: 8 },
  contributeCTAText: { color: '#fff', fontSize: FontSizes.md, fontWeight: FontWeights.bold },
});
