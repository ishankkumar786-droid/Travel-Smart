import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Platform, Alert, Dimensions, TextInput,
  KeyboardAvoidingView, ActivityIndicator, Keyboard, Modal, Pressable
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
  const { currentItinerary, setCurrentItinerary, tripParams } = useTrip();
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

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingDayNum, setEditingDayNum] = useState<number>(-1);
  const [editingItemIndex, setEditingItemIndex] = useState<number>(-1);
  const [editingItemType, setEditingItemType] = useState<'place' | 'food'>('place');
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editBestTime, setEditBestTime] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editEntryFee, setEditEntryFee] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editFamousFor, setEditFamousFor] = useState('');
  const [editPriceRange, setEditPriceRange] = useState('');

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
      const { answer, action, itinerary: mutatedItinerary } = res.data.data;
      
      const assistantMsg: ChatMessage = { role: 'assistant', content: answer || 'Done!' };
      setChatMessages((prev) => [...prev, assistantMsg]);

      // If AI mutated the itinerary, apply changes dynamically
      if (action === 'update' && mutatedItinerary) {
        // 1. Unwrap nested itinerary fields if LLM wrapped them twice
        let cleanedItinerary = mutatedItinerary;
        if (mutatedItinerary.itinerary) {
          cleanedItinerary = mutatedItinerary.itinerary;
        }
        if (cleanedItinerary.itinerary) {
          cleanedItinerary = cleanedItinerary.itinerary;
        }

        // 2. Validate itinerary layout satisfies days collection structure
        if (cleanedItinerary && cleanedItinerary.days && Array.isArray(cleanedItinerary.days)) {
          if (tripId) {
            setLoadedItinerary(cleanedItinerary);
            try {
              await tripsAPI.update(tripId, cleanedItinerary);
              storageService.saveItinerary(tripId, cleanedItinerary);
            } catch (err) {
              console.error('Failed to sync chat modification:', err);
            }
          } else {
            setCurrentItinerary(cleanedItinerary);
          }
        } else {
          console.warn('AI returned update action but valid days collection was missing:', cleanedItinerary);
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I could not process your question. Please try again.' }]);
    }
    setChatLoading(false);

    // Scroll to bottom
    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const toggleDay = (dayNum: number) => {
    setExpandedDay(expandedDay === dayNum ? -1 : dayNum);
  };

  // Editing handlers
  const handleEditPlace = (dayNum: number, index: number, place: any) => {
    setEditingDayNum(dayNum);
    setEditingItemIndex(index);
    setEditingItemType('place');
    setEditName(place.name || '');
    setEditCategory(place.category || 'other');
    setEditBestTime(place.bestTime || '');
    setEditDuration(place.duration || '');
    setEditEntryFee(place.entryFee || '');
    setEditDescription(place.description || '');
    setEditModalVisible(true);
  };

  const handleAddPlace = (dayNum: number) => {
    setEditingDayNum(dayNum);
    setEditingItemIndex(-1);
    setEditingItemType('place');
    setEditName('');
    setEditCategory('other');
    setEditBestTime('');
    setEditDuration('');
    setEditEntryFee('');
    setEditDescription('');
    setEditModalVisible(true);
  };

  const handleDeletePlace = (dayNum: number, index: number) => {
    Alert.alert('Delete Attraction', 'Are you sure you want to remove this place from your itinerary?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const itineraryCopy = JSON.parse(JSON.stringify(itinerary));
          const dayObj = itineraryCopy.days.find((d: any) => d.day === dayNum);
          if (dayObj) {
            dayObj.places.splice(index, 1);
            if (tripId) {
              setLoadedItinerary(itineraryCopy);
              try {
                await tripsAPI.update(tripId, itineraryCopy);
                storageService.saveItinerary(tripId, itineraryCopy);
              } catch (err) {
                console.error('Failed to sync delete:', err);
              }
            } else {
              setCurrentItinerary(itineraryCopy);
            }
          }
        },
      },
    ]);
  };

  const handleEditFood = (dayNum: number, index: number, food: any) => {
    setEditingDayNum(dayNum);
    setEditingItemIndex(index);
    setEditingItemType('food');
    setEditName(food.name || '');
    setEditFamousFor(food.famousFor || '');
    setEditPriceRange(food.priceRange || '');
    setEditModalVisible(true);
  };

  const handleAddFood = (dayNum: number) => {
    setEditingDayNum(dayNum);
    setEditingItemIndex(-1);
    setEditingItemType('food');
    setEditName('');
    setEditFamousFor('');
    setEditPriceRange('');
    setEditModalVisible(true);
  };

  const handleDeleteFood = (dayNum: number, index: number) => {
    Alert.alert('Delete Food Suggestion', 'Are you sure you want to remove this food suggestion?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const itineraryCopy = JSON.parse(JSON.stringify(itinerary));
          const dayObj = itineraryCopy.days.find((d: any) => d.day === dayNum);
          if (dayObj) {
            dayObj.food.splice(index, 1);
            if (tripId) {
              setLoadedItinerary(itineraryCopy);
              try {
                await tripsAPI.update(tripId, itineraryCopy);
                storageService.saveItinerary(tripId, itineraryCopy);
              } catch (err) {
                console.error('Failed to sync delete:', err);
              }
            } else {
              setCurrentItinerary(itineraryCopy);
            }
          }
        },
      },
    ]);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    const itineraryCopy = JSON.parse(JSON.stringify(itinerary));
    const dayObj = itineraryCopy.days.find((d: any) => d.day === editingDayNum);
    if (!dayObj) return;

    if (editingItemType === 'place') {
      const updatedPlace = {
        name: editName.trim(),
        category: editCategory || 'other',
        bestTime: editBestTime.trim() || undefined,
        duration: editDuration.trim() || undefined,
        entryFee: editEntryFee.trim() || undefined,
        description: editDescription.trim() || undefined,
      };

      if (editingItemIndex === -1) {
        dayObj.places.push(updatedPlace);
      } else {
        dayObj.places[editingItemIndex] = updatedPlace;
      }
    } else {
      const updatedFood = {
        name: editName.trim(),
        famousFor: editFamousFor.trim() || undefined,
        priceRange: editPriceRange.trim() || undefined,
      };

      if (editingItemIndex === -1) {
        dayObj.food.push(updatedFood);
      } else {
        dayObj.food[editingItemIndex] = updatedFood;
      }
    }

    if (tripId) {
      setLoadedItinerary(itineraryCopy);
      try {
        await tripsAPI.update(tripId, itineraryCopy);
        storageService.saveItinerary(tripId, itineraryCopy);
      } catch (err) {
        console.error('Failed to sync edit:', err);
      }
    } else {
      setCurrentItinerary(itineraryCopy);
    }

    setEditModalVisible(false);
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
            {((day.places && day.places.length > 0) || isEditing) && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: Colors.explore }]}>📍 PLACES TO VISIT</Text>
                {(day.places || []).map((place, i) => (
                  <View key={i} style={[styles.placeCard, { backgroundColor: isDark ? Colors.darkCardElevated : Colors.gray50 }]}>
                    <Text style={styles.placeEmoji}>{categoryIcons[place.category] || '📍'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.placeName, { color: theme.text }]}>{place.name}</Text>
                      <View style={styles.placeMeta}>
                        {place.bestTime && <Text style={[styles.placeMetaText, { color: theme.textSecondary }]}>🕐 {place.bestTime}</Text>}
                        {place.duration && <Text style={[styles.placeMetaText, { color: theme.textSecondary }]}>⏱️ {place.duration}</Text>}
                      </View>
                      {place.entryFee && <Text style={[styles.placeMetaText, { color: theme.textSecondary }]}>🎫 {place.entryFee}</Text>}
                      {place.description && <Text style={[styles.placeMetaText, { color: theme.textSecondary, marginTop: 4, fontStyle: 'italic' }]}>{place.description}</Text>}
                    </View>
                    {isEditing && (
                      <View style={styles.editControls}>
                        <TouchableOpacity onPress={() => handleEditPlace(day.day, i, place)} style={styles.editCtrlBtn}>
                          <Ionicons name="pencil" size={16} color={Colors.accent} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeletePlace(day.day, i)} style={styles.editCtrlBtn}>
                          <Ionicons name="trash" size={16} color={Colors.error} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
                {isEditing && (
                  <TouchableOpacity style={styles.addPlaceBtn} onPress={() => handleAddPlace(day.day)}>
                    <Ionicons name="add-circle-outline" size={18} color={Colors.explore} />
                    <Text style={styles.addPlaceText}>Add Attraction</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Food */}
            {((day.food && day.food.length > 0) || isEditing) && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: Colors.orange }]}>🍜 FOOD SUGGESTIONS</Text>
                {(day.food || []).map((f, i) => (
                  <View key={i} style={[styles.foodCard, { backgroundColor: isDark ? Colors.darkCardElevated : Colors.gray50, flexDirection: 'row', alignItems: 'center' }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.placeName, { color: theme.text }]}>{f.name}</Text>
                      {f.famousFor && <Text style={[styles.placeMetaText, { color: theme.textSecondary }]}>Famous for: {f.famousFor}</Text>}
                      {f.priceRange && <Text style={[styles.placeMetaText, { color: theme.textSecondary }]}>💰 {f.priceRange}</Text>}
                    </View>
                    {isEditing && (
                      <View style={styles.editControls}>
                        <TouchableOpacity onPress={() => handleEditFood(day.day, i, f)} style={styles.editCtrlBtn}>
                          <Ionicons name="pencil" size={16} color={Colors.accent} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteFood(day.day, i)} style={styles.editCtrlBtn}>
                          <Ionicons name="trash" size={16} color={Colors.error} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
                {isEditing && (
                  <TouchableOpacity style={styles.addFoodBtn} onPress={() => handleAddFood(day.day)}>
                    <Ionicons name="add-circle-outline" size={18} color={Colors.orange} />
                    <Text style={styles.addFoodText}>Add Food Suggestion</Text>
                  </TouchableOpacity>
                )}
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
            {day.localGems && (day.localGems || []).length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: Colors.yellow }]}>🔥 LOCAL GEMS</Text>
                {(day.localGems || []).map((gem, i) => (
                  <View key={i} style={[styles.gemCard, { borderColor: Colors.yellow + '40' }]}>
                    <Text style={styles.gemBadge}>🔥 Local Favorite</Text>
                    <Text style={[styles.placeName, { color: theme.text }]}>{gem.name}</Text>
                    <Text style={[styles.placeMetaText, { color: theme.textSecondary }]}>{gem.description}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Tips */}
            {day.tips && (day.tips || []).length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: Colors.info }]}>💡 TIPS</Text>
                {(day.tips || []).map((tip, i) => (
                  <Text key={i} style={[styles.tipText, { color: theme.text }]}>• {tip}</Text>
                ))}
              </View>
            )}

            {/* Avoid */}
            {day.avoid && (day.avoid || []).length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: Colors.error }]}>⚠️ AVOID</Text>
                {(day.avoid || []).map((a, i) => (
                  <Text key={i} style={[styles.tipText, { color: theme.textSecondary }]}>• {a}</Text>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };


  // ===== Edit Place Modal =====
  const renderEditModal = () => {
    return (
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity 
            style={{ flex: 1 }} 
            activeOpacity={1} 
            onPress={() => setEditModalVisible(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editingItemIndex === -1 ? 'Add' : 'Edit'} {editingItemType === 'place' ? 'Attraction' : 'Food Suggestion'}
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm} showsVerticalScrollIndicator={false}>
              <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Name</Text>
              <TextInput
                style={[styles.formInput, { color: theme.text, backgroundColor: isDark ? Colors.darkCardElevated : Colors.gray50 }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="e.g. Taj Mahal"
                placeholderTextColor={theme.textSecondary}
              />

              {editingItemType === 'place' ? (
                <>
                  <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Category</Text>
                  <View style={styles.categoryRow}>
                    {Object.keys(categoryIcons).map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.catChip,
                          editCategory === cat && { backgroundColor: Colors.accent },
                        ]}
                        onPress={() => setEditCategory(cat)}
                      >
                        <Text style={[styles.catChipText, editCategory === cat && { color: '#fff' }]}>
                          {categoryIcons[cat]} {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Best Time to Visit</Text>
                  <TextInput
                    style={[styles.formInput, { color: theme.text, backgroundColor: isDark ? Colors.darkCardElevated : Colors.gray50 }]}
                    value={editBestTime}
                    onChangeText={setEditBestTime}
                    placeholder="e.g. 09:00 AM - 12:00 PM"
                    placeholderTextColor={theme.textSecondary}
                  />

                  <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Duration</Text>
                  <TextInput
                    style={[styles.formInput, { color: theme.text, backgroundColor: isDark ? Colors.darkCardElevated : Colors.gray50 }]}
                    value={editDuration}
                    onChangeText={setEditDuration}
                    placeholder="e.g. 2 hours"
                    placeholderTextColor={theme.textSecondary}
                  />

                  <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Entry Fee</Text>
                  <TextInput
                    style={[styles.formInput, { color: theme.text, backgroundColor: isDark ? Colors.darkCardElevated : Colors.gray50 }]}
                    value={editEntryFee}
                    onChangeText={setEditEntryFee}
                    placeholder="e.g. Free, ₹50"
                    placeholderTextColor={theme.textSecondary}
                  />

                  <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Description</Text>
                  <TextInput
                    style={[styles.formInput, styles.textArea, { color: theme.text, backgroundColor: isDark ? Colors.darkCardElevated : Colors.gray50 }]}
                    value={editDescription}
                    onChangeText={setEditDescription}
                    placeholder="Brief details about the place..."
                    placeholderTextColor={theme.textSecondary}
                    multiline
                    numberOfLines={3}
                  />
                </>
              ) : (
                <>
                  <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Famous For</Text>
                  <TextInput
                    style={[styles.formInput, { color: theme.text, backgroundColor: isDark ? Colors.darkCardElevated : Colors.gray50 }]}
                    value={editFamousFor}
                    onChangeText={setEditFamousFor}
                    placeholder="e.g. Spicy Biryani, Local Lassi"
                    placeholderTextColor={theme.textSecondary}
                  />

                  <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Price Range</Text>
                  <TextInput
                    style={[styles.formInput, { color: theme.text, backgroundColor: isDark ? Colors.darkCardElevated : Colors.gray50 }]}
                    value={editPriceRange}
                    onChangeText={setEditPriceRange}
                    placeholder="e.g. ₹200 for two, Budget-friendly"
                    placeholderTextColor={theme.textSecondary}
                  />
                </>
              )}

              <TouchableOpacity style={styles.saveModalBtn} onPress={handleSaveEdit}>
                <Text style={styles.saveModalBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.headerBtn}>
                <Ionicons name={isEditing ? "checkmark-circle" : "pencil"} size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => generateItineraryPDF(itinerary)} style={styles.headerBtn}>
                <Ionicons name="download-outline" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.headerDest}>{itinerary.destination}</Text>
          <View style={styles.headerMeta}>
            <View style={[styles.modePill, { backgroundColor: itinerary.mode === 'premium' ? 'rgba(255,255,255,0.2)' : 'rgba(108,92,231,0.3)' }]}>
              <Text style={styles.modeText}>{itinerary.mode === 'premium' ? '⭐ Premium' : '🤖 AI Generated'}</Text>
            </View>
            <Text style={styles.headerMetaText}>{(itinerary.days || []).length} days • {itinerary.budget} budget</Text>
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

              {(itinerary.days || []).map(renderDayCard)}
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
        {renderEditModal()}
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
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.headerBtn}>
            <Ionicons name={isEditing ? "checkmark-circle" : "pencil"} size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerDest}>{itinerary.destination}</Text>
        <View style={styles.headerMeta}>
          <View style={[styles.modePill, { backgroundColor: itinerary.mode === 'premium' ? 'rgba(255,255,255,0.2)' : 'rgba(108,92,231,0.3)' }]}>
            <Text style={styles.modeText}>{itinerary.mode === 'premium' ? '⭐ Premium' : '🤖 AI Generated'}</Text>
          </View>
          <Text style={styles.headerMetaText}>{(itinerary.days || []).length} days • {itinerary.budget} budget</Text>
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

          {(itinerary.days || []).map(renderDayCard)}
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
      {renderEditModal()}
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

  // Editing styling
  editControls: { flexDirection: 'row', gap: 8, marginLeft: 10, alignSelf: 'center' },
  editCtrlBtn: { padding: 6, borderRadius: Radius.sm, backgroundColor: 'rgba(0,0,0,0.03)' },
  addPlaceBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 12, borderRadius: Radius.md, borderStyle: 'dashed', borderWidth: 1, borderColor: Colors.explore, justifyContent: 'center', marginTop: 4 },
  addPlaceText: { fontSize: FontSizes.sm, color: Colors.explore, fontWeight: FontWeights.semibold },
  addFoodBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 12, borderRadius: Radius.md, borderStyle: 'dashed', borderWidth: 1, borderColor: Colors.orange, justifyContent: 'center', marginTop: 4 },
  addFoodText: { fontSize: FontSizes.sm, color: Colors.orange, fontWeight: FontWeights.semibold },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 0.5 },
  modalTitle: { fontSize: FontSizes.md, fontWeight: FontWeights.bold },
  modalForm: { padding: 20 },
  formLabel: { fontSize: FontSizes.xs, fontWeight: FontWeights.bold, marginBottom: 6, marginTop: 12 },
  formInput: { borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: FontSizes.sm, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)' },
  textArea: { height: 80, textAlignVertical: 'top' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6, marginTop: 4 },
  catChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: 'rgba(0,0,0,0.05)' },
  catChipText: { fontSize: FontSizes.xs, color: '#333' },
  saveModalBtn: { backgroundColor: Colors.accent, paddingVertical: 14, borderRadius: Radius.md, alignItems: 'center', marginTop: 24 },
  saveModalBtnText: { color: '#fff', fontSize: FontSizes.md, fontWeight: FontWeights.bold },
});
