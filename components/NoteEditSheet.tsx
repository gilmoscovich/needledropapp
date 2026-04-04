// components/NoteEditSheet.tsx
// Bottom sheet for reading and editing the full note on a bookmark.

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Bookmark } from '@/types';
import { colors, typography, spacing, radius } from '@/constants/theme';

interface NoteEditSheetProps {
  visible:  boolean;
  bookmark: Bookmark | null;
  onClose:  () => void;
  onSave:   (updatedBookmark: Bookmark) => Promise<void>;
}

export function NoteEditSheet({ visible, bookmark, onClose, onSave }: NoteEditSheetProps) {
  const insets = useSafeAreaInsets();
  const [text,   setText]   = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && bookmark) setText(bookmark.note ?? '');
  }, [visible, bookmark]);

  const hasChanged = text.trim() !== (bookmark?.note ?? '');

  const handleSave = async () => {
    if (!bookmark) return;
    setSaving(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await onSave({ ...bookmark, note: text.trim() || undefined });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!bookmark) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={[styles.container, { paddingBottom: insets.bottom + spacing.lg }]}>

          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerLabel}>NOTE</Text>
              <Text style={styles.headerTrack} numberOfLines={1}>{bookmark.trackName}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={20} color={colors.outline} />
            </Pressable>
          </View>

          {/* Text input */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder=""
              placeholderTextColor={colors.outline}
              multiline
              autoFocus
              textAlignVertical="top"
            />
          </View>

          {/* Save button */}
          <Pressable
            onPress={handleSave}
            disabled={saving || !hasChanged}
            style={({ pressed }) => [
              styles.saveBtn,
              (!hasChanged || saving) && styles.saveBtnDisabled,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={[styles.saveBtnText, (!hasChanged || saving) && { color: colors.outline }]}>
              {saving ? 'Saving…' : 'Save Note'}
            </Text>
          </Pressable>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: colors.surfaceContainerLow,
    gap:             spacing.lg,
  },
  handle: {
    width:           40,
    height:          4,
    borderRadius:    2,
    backgroundColor: colors.outlineVariant,
    alignSelf:       'center',
    marginTop:       spacing.md,
  },
  header: {
    flexDirection:     'row',
    alignItems:        'flex-start',
    justifyContent:    'space-between',
    paddingHorizontal: spacing.lg,
  },
  headerLabel: {
    ...typography.labelSm,
    color: colors.secondary,
  },
  headerTrack: {
    ...typography.bodyMd,
    color:     colors.onSurfaceVariant,
    marginTop: 2,
  },
  closeBtn: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems:      'center',
    justifyContent:  'center',
  },
  inputWrapper: {
    marginHorizontal:  spacing.lg,
    backgroundColor:   colors.surfaceContainerHigh,
    borderRadius:      radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.md,
    minHeight:         120,
  },
  input: {
    ...typography.bodyMd,
    color:     colors.onSurface,
    padding:   0,
    minHeight: 100,
  },
  saveBtn: {
    alignItems:        'center',
    justifyContent:    'center',
    marginHorizontal:  spacing.lg,
    backgroundColor:   colors.primary,
    borderRadius:      radius.full,
    paddingVertical:   spacing.lg,
  },
  saveBtnDisabled: {
    backgroundColor: colors.surfaceContainerHighest,
  },
  saveBtnText: {
    ...typography.titleMd,
    color: colors.onPrimary,
  },
});
