import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Modal,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, getThemeColors } from '@/constants/colors';
import { FontSizes, FontWeights, Spacing, Radius } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Props {
  visible: boolean;
  entry: any | null;
  onClose: () => void;
  onSave: (entryId: string, data: { content: any }) => void;
  onDelete: (entryId: string) => void;
}

export default function EditEntryModal({ visible, entry, onClose, onSave, onDelete }: Props) {
  const isDark = useColorScheme() === 'dark';
  const theme = getThemeColors(isDark);
  const inputBg = isDark ? Colors.darkCardElevated : Colors.gray50;

  const [text, setText] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [caption, setCaption] = useState('');

  useEffect(() => {
    if (entry) {
      switch (entry.type) {
        case 'note':
          setText(entry.content.text || '');
          break;
        case 'expense':
          setAmount(String(entry.content.amount || ''));
          setNote(entry.content.note || '');
          break;
        case 'memory':
          setCaption(entry.content.caption || '');
          break;
        case 'checklist':
          setText(entry.content.text || '');
          break;
      }
    }
  }, [entry]);

  if (!entry) return null;

  const handleSave = () => {
    let content: any = {};
    switch (entry.type) {
      case 'note':
        if (!text.trim()) { Alert.alert('Empty', 'Please write something'); return; }
        content = { text: text.trim() };
        break;
      case 'expense':
        if (!amount || isNaN(Number(amount))) { Alert.alert('Invalid', 'Enter a valid amount'); return; }
        content = { amount: Number(amount), note: note.trim() };
        break;
      case 'memory':
        content = { caption: caption.trim() };
        break;
      case 'checklist':
        if (!text.trim()) { Alert.alert('Empty', 'Enter a task'); return; }
        content = { text: text.trim() };
        break;
    }
    onSave(entry._id || entry.localId, { content });
    onClose();
  };

  const handleDelete = () => {
    Alert.alert('Delete Entry', 'Are you sure you want to delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          onDelete(entry._id || entry.localId);
          onClose();
        },
      },
    ]);
  };

  const typeLabel = entry.type.charAt(0).toUpperCase() + entry.type.slice(1);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          <View style={styles.handle} />

          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: theme.text }]}>Edit {typeLabel}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.sheetBody}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {entry.type === 'note' && (
              <TextInput
                style={[styles.textArea, { backgroundColor: inputBg, color: theme.text }]}
                value={text}
                onChangeText={setText}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                autoFocus
              />
            )}

            {entry.type === 'expense' && (
              <>
                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>AMOUNT (₹)</Text>
                <TextInput
                  style={[styles.amountInput, { backgroundColor: inputBg, color: theme.text }]}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  autoFocus
                />
                <Text style={[styles.formLabel, { color: theme.textSecondary, marginTop: 16 }]}>NOTE</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: inputBg, color: theme.text }]}
                  value={note}
                  onChangeText={setNote}
                />
              </>
            )}

            {entry.type === 'memory' && (
              <>
                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>CAPTION</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: inputBg, color: theme.text }]}
                  value={caption}
                  onChangeText={setCaption}
                  autoFocus
                />
              </>
            )}

            {entry.type === 'checklist' && (
              <TextInput
                style={[styles.inputField, { backgroundColor: inputBg, color: theme.text }]}
                value={text}
                onChangeText={setText}
                autoFocus
              />
            )}
          </ScrollView>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={18} color={Colors.error} />
              <Text style={[styles.deleteBtnText, { color: Colors.error }]}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%', paddingBottom: 34 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.gray400, alignSelf: 'center', marginTop: 10 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  sheetTitle: { flex: 1, fontSize: FontSizes.lg, fontWeight: FontWeights.bold },
  closeBtn: { width: 36, alignItems: 'flex-end' },
  sheetBody: { paddingHorizontal: 20, paddingBottom: 20 },
  formLabel: { fontSize: FontSizes.xs, fontWeight: FontWeights.bold, letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  inputField: { borderRadius: Radius.lg, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 15 : 12, fontSize: FontSizes.base },
  textArea: { borderRadius: Radius.lg, padding: 16, fontSize: FontSizes.base, minHeight: 120, lineHeight: 22 },
  amountInput: { borderRadius: Radius.lg, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 15 : 12, fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold },
  btnRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 14, paddingHorizontal: 16, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.error + '40' },
  deleteBtnText: { fontSize: FontSizes.sm, fontWeight: FontWeights.semibold },
  saveBtn: { flex: 1, backgroundColor: Colors.accent, paddingVertical: 16, borderRadius: Radius.lg, alignItems: 'center' },
  saveBtnText: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: '#fff' },
});
