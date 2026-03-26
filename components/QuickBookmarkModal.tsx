// components/QuickBookmarkModal.tsx
// Pre-filled bookmark confirmation modal.
// Slides up with album art, track name, and timestamp ready to save.
// For currently-playing: timestamp is auto-captured and editable.
// For recently-played: timestamp is empty, user can optionally add one.

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
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CurrentTrackInfo } from '@/hooks/useCurrentlyPlaying';
import { useBookmarks } from '@/hooks/useBookmarks';
import { isValidTimestamp } from '@/services/spotify';
import { Bookmark } from '@/types';
import {
  colors,
  typography,
  spacing,
  radius,
  vinylGradient,
} from '@/constants/theme';

interface QuickBookmarkModalProps {
  visible:   boolean;
  trackInfo: CurrentTrackInfo;
  onClose:   () => void;
}

export function QuickBookmarkModal({
  visible,
  trackInfo,
  onClose,
}: QuickBookmarkModalProps) {
  const insets = useSafeAreaInsets();
  const { saveBookmark } = useBookmarks();

  const [timestamp, setTimestamp] = useState('');
  const [tsError,   setTsError]   = useState('');
  const [saving,    setSaving]    = useState(false);

  // Pre-fill timestamp from API on open (empty for recently-played)
  useEffect(() => {
    if (visible) {
      setTimestamp(trackInfo.timestamp);
      setTsError('');
    }
  }, [visible, trackInfo.timestamp]);

  const handleTimestampChange = (text: string) => {
    setTimestamp(text);
    setTsError(text && !isValidTimestamp(text) ? 'Format: mm:ss or h:mm:ss' : '');
  };

  const handleSave = async () => {
    if (timestamp && !isValidTimestamp(timestamp)) {
      setTsError('Format: mm:ss or h:mm:ss');
      return;
    }

    const bookmark: Bookmark = {
      albumId:    trackInfo.albumId,
      albumName:  trackInfo.albumName,
      artist:     trackInfo.artist,
      art:        trackInfo.art,
      albumUri:   trackInfo.albumUri,
      trackUri:   trackInfo.trackUri,
      trackName:  trackInfo.trackName,
      trackIndex: trackInfo.trackIndex,
      trackNum:   trackInfo.trackNum,
      timestamp:  timestamp.trim() || null,
      savedAt:    Date.now(),
    };

    setSaving(true);
    try {
      await saveBookmark(bookmark);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

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
              <Text style={styles.headerLabel}>
                {trackInfo.isPlaying ? 'NOW PLAYING' : 'RECENTLY PLAYED'}
              </Text>
              {!trackInfo.isPlaying && (
                <Text style={styles.headerSub}>
                  Add a timestamp to mark your spot
                </Text>
              )}
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={20} color={colors.outline} />
            </Pressable>
          </View>

          {/* Track info card */}
          <View style={styles.trackCard}>
            {trackInfo.art ? (
              <Image
                source={{ uri: trackInfo.art }}
                style={styles.art}
                contentFit="cover"
                transition={300}
              />
            ) : (
              <View style={[styles.art, styles.artPlaceholder]} />
            )}
            <View style={styles.trackMeta}>
              <Text style={styles.trackName} numberOfLines={2}>
                {trackInfo.trackName}
              </Text>
              <Text style={styles.albumName} numberOfLines={1}>
                {trackInfo.albumName}
              </Text>
              <Text style={styles.artistName} numberOfLines={1}>
                {trackInfo.artist}
              </Text>
            </View>
          </View>

          {/* Timestamp — pre-filled if currently playing, empty if recently played */}
          <View style={styles.tsSection}>
            <Text style={styles.sectionLabel}>
              {trackInfo.isPlaying
                ? 'TIMESTAMP (CAPTURED AUTOMATICALLY)'
                : 'TIMESTAMP (OPTIONAL)'}
            </Text>
            <View style={[
              styles.tsInputWrapper,
              trackInfo.isPlaying && styles.tsInputWrapperActive,
            ]}>
              <MaterialIcons
                name="schedule"
                size={16}
                color={trackInfo.isPlaying ? colors.secondary : colors.outline}
              />
              <TextInput
                style={styles.tsInput}
                value={timestamp}
                onChangeText={handleTimestampChange}
                placeholder="e.g. 2:34"
                placeholderTextColor={colors.outline}
                keyboardType="numbers-and-punctuation"
                returnKeyType="done"
              />
              {timestamp.length > 0 && (
                <Pressable onPress={() => { setTimestamp(''); setTsError(''); }}>
                  <MaterialIcons name="close" size={14} color={colors.outline} />
                </Pressable>
              )}
            </View>
            {tsError ? (
              <Text style={styles.tsError}>{tsError}</Text>
            ) : timestamp && trackInfo.isPlaying ? (
              <Text style={styles.tsHint}>You can adjust or clear this timestamp</Text>
            ) : null}
          </View>

          {/* Save button */}
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [
              styles.saveBtn,
              saving && styles.saveBtnDisabled,
              pressed && { opacity: 0.85 },
            ]}
          >
            <LinearGradient
              colors={vinylGradient.colors}
              start={vinylGradient.start}
              end={vinylGradient.end}
              style={styles.saveGradient}
            >
              {saving ? (
                <ActivityIndicator color={colors.onPrimary} size="small" />
              ) : (
                <MaterialCommunityIcons name="bookmark-music" size={18} color={colors.onPrimary} />
              )}
              <Text style={styles.saveBtnText}>
                {saving ? 'Saving…' : 'Drop the Needle'}
              </Text>
            </LinearGradient>
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
  headerSub: {
    ...typography.labelMd,
    color:     colors.outline,
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

  // Track card
  trackCard: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              spacing.lg,
    marginHorizontal: spacing.lg,
    padding:          spacing.md,
    backgroundColor:  colors.surfaceContainer,
    borderRadius:     radius.xl,
  },
  art: {
    width:        80,
    height:       80,
    borderRadius: radius.lg,
  },
  artPlaceholder: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  trackMeta: {
    flex: 1,
    gap:  4,
  },
  trackName: {
    ...typography.titleLg,
    color: colors.onSurface,
  },
  albumName: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  artistName: {
    ...typography.labelLg,
    color:         colors.outline,
    letterSpacing: 0.5,
  },

  // Timestamp
  tsSection: {
    paddingHorizontal: spacing.lg,
    gap:               spacing.sm,
  },
  sectionLabel: {
    ...typography.labelSm,
    color: colors.outline,
  },
  tsInputWrapper: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               spacing.sm,
    backgroundColor:   colors.surfaceContainerHigh,
    borderRadius:      radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.sm,
    borderWidth:       1,
    borderColor:       colors.outlineVariant,
  },
  tsInputWrapperActive: {
    borderColor: 'rgba(230, 190, 173, 0.3)',
  },
  tsInput: {
    flex:    1,
    ...typography.bodyMd,
    color:   colors.onSurface,
    padding: 0,
  },
  tsError: {
    ...typography.labelMd,
    color: colors.error,
  },
  tsHint: {
    ...typography.labelMd,
    color: colors.outline,
  },

  // Save button
  saveBtn: {
    marginHorizontal: spacing.lg,
    borderRadius:     radius.full,
    overflow:         'hidden',
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveGradient: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               spacing.sm,
    paddingVertical:   spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  saveBtnText: {
    ...typography.titleMd,
    color: colors.onPrimary,
  },
});
