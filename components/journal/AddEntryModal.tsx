import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Modal,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, getThemeColors } from '@/constants/colors';
import { FontSizes, FontWeights, Spacing, Radius } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { uploadAPI } from '@/services/api';

const ENTRY_TYPES = [
  { key: 'note', label: 'Quick Note', emoji: '📝', color: Colors.info },
  { key: 'expense', label: 'Expense', emoji: '💸', color: Colors.orange },
  { key: 'memory', label: 'Memory', emoji: '📸', color: Colors.pink },
  { key: 'checklist', label: 'Checklist', emoji: '✅', color: Colors.success },
];

const EXPENSE_CATS = [
  { key: 'food', emoji: '🍜', label: 'Food' },
  { key: 'travel', emoji: '🚆', label: 'Travel' },
  { key: 'hotel', emoji: '🏨', label: 'Hotel' },
  { key: 'shopping', emoji: '🛍️', label: 'Shopping' },
  { key: 'misc', emoji: '💸', label: 'Misc' },
];

const MOODS = [
  { key: 'amazing', emoji: '😍', label: 'Amazing' },
  { key: 'relaxed', emoji: '😌', label: 'Relaxed' },
  { key: 'tired', emoji: '😴', label: 'Tired' },
  { key: 'stressful', emoji: '😤', label: 'Stressful' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (type: string, content: any) => void;
}

export default function AddEntryModal({ visible, onClose, onSubmit }: Props) {
  const isDark = useColorScheme() === 'dark';
  const theme = getThemeColors(isDark);
  const inputBg = isDark ? Colors.darkCardElevated : Colors.gray50;

  const [step, setStep] = useState<'select' | 'form'>('select');
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states
  const [noteText, setNoteText] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('food');
  const [expenseNote, setExpenseNote] = useState('');
  const [memoryCaption, setMemoryCaption] = useState('');
  const [memoryMood, setMemoryMood] = useState('amazing');
  const [memoryImageUrl, setMemoryImageUrl] = useState('');
  const [checklistText, setChecklistText] = useState('');
  const [uploading, setUploading] = useState(false);

  const resetForm = () => {
    setStep('select');
    setSelectedType('');
    setNoteText('');
    setExpenseAmount('');
    setExpenseCategory('food');
    setExpenseNote('');
    setMemoryCaption('');
    setMemoryMood('amazing');
    setMemoryImageUrl('');
    setChecklistText('');
    setUploading(false);
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSelectType = (type: string) => {
    setSelectedType(type);
    setStep('form');
  };

  const pickImage = async (source: 'gallery' | 'camera') => {
    try {
      let result;
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) { Alert.alert('Permission needed', 'Camera access is required'); return; }
        result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) { Alert.alert('Permission needed', 'Gallery access is required'); return; }
        result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
      }

      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        const asset = result.assets[0];
        const formData = new FormData();
        formData.append('image', {
          uri: asset.uri,
          type: 'image/jpeg',
          name: 'journal_memory.jpg',
        } as any);

        try {
          const res = await uploadAPI.image(formData);
          setMemoryImageUrl(res.data.data.url);
        } catch {
          Alert.alert('Upload Failed', 'Could not upload image. It will be saved locally.');
          setMemoryImageUrl(asset.uri); // Fallback to local URI
        }
        setUploading(false);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSubmit = () => {
    setLoading(true);
    let content: any = {};

    switch (selectedType) {
      case 'note':
        if (!noteText.trim()) { Alert.alert('Empty', 'Please write something'); setLoading(false); return; }
        content = { text: noteText.trim() };
        break;
      case 'expense':
        if (!expenseAmount || isNaN(Number(expenseAmount))) { Alert.alert('Invalid', 'Enter a valid amount'); setLoading(false); return; }
        content = { amount: Number(expenseAmount), category: expenseCategory, note: expenseNote.trim() };
        break;
      case 'memory':
        if (!memoryImageUrl && !memoryCaption.trim()) { Alert.alert('Empty', 'Add a photo or caption'); setLoading(false); return; }
        content = { imageUrl: memoryImageUrl, caption: memoryCaption.trim(), mood: memoryMood };
        break;
      case 'checklist':
        if (!checklistText.trim()) { Alert.alert('Empty', 'Enter a task'); setLoading(false); return; }
        content = { text: checklistText.trim(), completed: false };
        break;
    }

    onSubmit(selectedType, content);
    resetForm();
  };

  const renderTypeSelector = () => (
    <View style={styles.typeGrid}>
      {ENTRY_TYPES.map((t) => (
        <TouchableOpacity
          key={t.key}
          style={[styles.typeBtn, { backgroundColor: t.color + '10', borderColor: t.color + '30' }]}
          onPress={() => handleSelectType(t.key)}
          activeOpacity={0.7}
        >
          <Text style={styles.typeEmoji}>{t.emoji}</Text>
          <Text style={[styles.typeLabel, { color: theme.text }]}>{t.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderNoteForm = () => (
    <View style={styles.formSection}>
      <Text style={[styles.formLabel, { color: theme.textSecondary }]}>WHAT'S ON YOUR MIND?</Text>
      <TextInput
        style={[styles.textArea, { backgroundColor: inputBg, color: theme.text }]}
        placeholder="e.g. Need to wake up early tomorrow..."
        placeholderTextColor={theme.textSecondary}
        value={noteText}
        onChangeText={setNoteText}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        autoFocus
      />
    </View>
  );

  const renderExpenseForm = () => (
    <View style={styles.formSection}>
      <Text style={[styles.formLabel, { color: theme.textSecondary }]}>AMOUNT (₹)</Text>
      <TextInput
        style={[styles.amountInput, { backgroundColor: inputBg, color: theme.text }]}
        placeholder="250"
        placeholderTextColor={theme.textSecondary}
        value={expenseAmount}
        onChangeText={setExpenseAmount}
        keyboardType="numeric"
        autoFocus
      />
      <Text style={[styles.formLabel, { color: theme.textSecondary, marginTop: 16 }]}>CATEGORY</Text>
      <View style={styles.catRow}>
        {EXPENSE_CATS.map((c) => (
          <TouchableOpacity
            key={c.key}
            style={[
              styles.catChip,
              { backgroundColor: expenseCategory === c.key ? Colors.orange + '20' : inputBg },
              expenseCategory === c.key && { borderColor: Colors.orange, borderWidth: 1.5 },
            ]}
            onPress={() => setExpenseCategory(c.key)}
          >
            <Text style={styles.catEmoji}>{c.emoji}</Text>
            <Text style={[styles.catLabel, { color: theme.text }]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[styles.formLabel, { color: theme.textSecondary, marginTop: 16 }]}>NOTE (optional)</Text>
      <TextInput
        style={[styles.inputField, { backgroundColor: inputBg, color: theme.text }]}
        placeholder="e.g. Dinner at local cafe"
        placeholderTextColor={theme.textSecondary}
        value={expenseNote}
        onChangeText={setExpenseNote}
      />
    </View>
  );

  const renderMemoryForm = () => (
    <View style={styles.formSection}>
      <Text style={[styles.formLabel, { color: theme.textSecondary }]}>PHOTO</Text>
      <View style={styles.imagePickRow}>
        <TouchableOpacity style={[styles.imagePickBtn, { backgroundColor: inputBg }]} onPress={() => pickImage('gallery')}>
          <Ionicons name="images-outline" size={24} color={Colors.accent} />
          <Text style={[styles.imagePickLabel, { color: theme.text }]}>Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.imagePickBtn, { backgroundColor: inputBg }]} onPress={() => pickImage('camera')}>
          <Ionicons name="camera-outline" size={24} color={Colors.accent} />
          <Text style={[styles.imagePickLabel, { color: theme.text }]}>Camera</Text>
        </TouchableOpacity>
      </View>
      {uploading && (
        <View style={styles.uploadingRow}>
          <ActivityIndicator size="small" color={Colors.accent} />
          <Text style={{ color: theme.textSecondary, fontSize: FontSizes.sm }}>Uploading...</Text>
        </View>
      )}
      {memoryImageUrl ? (
        <Text style={[styles.imageReady, { color: Colors.success }]}>✅ Image ready</Text>
      ) : null}

      <Text style={[styles.formLabel, { color: theme.textSecondary, marginTop: 16 }]}>CAPTION</Text>
      <TextInput
        style={[styles.inputField, { backgroundColor: inputBg, color: theme.text }]}
        placeholder="Sunset at Sangam 🌅"
        placeholderTextColor={theme.textSecondary}
        value={memoryCaption}
        onChangeText={setMemoryCaption}
      />

      <Text style={[styles.formLabel, { color: theme.textSecondary, marginTop: 16 }]}>MOOD</Text>
      <View style={styles.moodRow}>
        {MOODS.map((m) => (
          <TouchableOpacity
            key={m.key}
            style={[
              styles.moodChip,
              { backgroundColor: memoryMood === m.key ? Colors.pink + '20' : inputBg },
              memoryMood === m.key && { borderColor: Colors.pink, borderWidth: 1.5 },
            ]}
            onPress={() => setMemoryMood(m.key)}
          >
            <Text style={styles.moodEmoji}>{m.emoji}</Text>
            <Text style={[styles.moodLabel, { color: theme.text }]}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderChecklistForm = () => (
    <View style={styles.formSection}>
      <Text style={[styles.formLabel, { color: theme.textSecondary }]}>TASK</Text>
      <TextInput
        style={[styles.inputField, { backgroundColor: inputBg, color: theme.text }]}
        placeholder="e.g. Pack charger, Download tickets..."
        placeholderTextColor={theme.textSecondary}
        value={checklistText}
        onChangeText={setChecklistText}
        autoFocus
      />
    </View>
  );

  const renderForm = () => {
    switch (selectedType) {
      case 'note': return renderNoteForm();
      case 'expense': return renderExpenseForm();
      case 'memory': return renderMemoryForm();
      case 'checklist': return renderChecklistForm();
      default: return null;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleClose} />
        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            {step === 'form' && (
              <TouchableOpacity onPress={() => setStep('select')} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={22} color={theme.text} />
              </TouchableOpacity>
            )}
            <Text style={[styles.sheetTitle, { color: theme.text }]}>
              {step === 'select' ? 'Add to Journal' : ENTRY_TYPES.find(t => t.key === selectedType)?.label}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetBody}
            keyboardShouldPersistTaps="handled"
          >
            {step === 'select' ? renderTypeSelector() : renderForm()}
          </ScrollView>

          {/* Submit button */}
          {step === 'form' && (
            <TouchableOpacity
              style={[styles.submitBtn, (loading || uploading) && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={loading || uploading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Save Entry</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', paddingBottom: 34 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.gray400, alignSelf: 'center', marginTop: 10 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  sheetTitle: { flex: 1, fontSize: FontSizes.lg, fontWeight: FontWeights.bold, textAlign: 'center' },
  backBtn: { width: 36 },
  closeBtn: { width: 36, alignItems: 'flex-end' },
  sheetBody: { paddingHorizontal: 20, paddingBottom: 20 },

  // Type selector
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  typeBtn: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: 22,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 8,
  },
  typeEmoji: { fontSize: 32 },
  typeLabel: { fontSize: FontSizes.sm, fontWeight: FontWeights.semibold },

  // Form
  formSection: { gap: 0 },
  formLabel: { fontSize: FontSizes.xs, fontWeight: FontWeights.bold, letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  inputField: { borderRadius: Radius.lg, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 15 : 12, fontSize: FontSizes.base },
  textArea: { borderRadius: Radius.lg, padding: 16, fontSize: FontSizes.base, minHeight: 120, lineHeight: 22 },
  amountInput: { borderRadius: Radius.lg, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 15 : 12, fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold },

  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.lg, borderWidth: 1, borderColor: 'transparent' },
  catEmoji: { fontSize: 16 },
  catLabel: { fontSize: FontSizes.sm, fontWeight: FontWeights.medium },

  imagePickRow: { flexDirection: 'row', gap: 12 },
  imagePickBtn: { flex: 1, alignItems: 'center', paddingVertical: 20, borderRadius: Radius.lg, gap: 6 },
  imagePickLabel: { fontSize: FontSizes.sm, fontWeight: FontWeights.medium },
  uploadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  imageReady: { fontSize: FontSizes.sm, fontWeight: FontWeights.semibold, marginTop: 8 },

  moodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  moodChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.lg, borderWidth: 1, borderColor: 'transparent' },
  moodEmoji: { fontSize: 18 },
  moodLabel: { fontSize: FontSizes.sm, fontWeight: FontWeights.medium },

  submitBtn: { backgroundColor: Colors.accent, marginHorizontal: 20, paddingVertical: 16, borderRadius: Radius.lg, alignItems: 'center' },
  submitText: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: '#fff' },
});
