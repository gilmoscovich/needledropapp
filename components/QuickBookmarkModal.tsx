// components/QuickBookmarkModal.tsx
// Pre-filled bookmark confirmation modal.
// Slides up with album art, track name, and timestamp ready to save.
// For currently-playing: timestamp is auto-captured and editable.
// For recently-played: timestamp is empty, user can optionally add one.

import { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CurrentTrackInfo } from '@/hooks/useCurrentlyPlaying';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useToastContext } from '@/contexts/ToastContext';
import { Bookmark } from '@/types';
import {
  colors,
  typography,
  spacing,
  radius,
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
  const { saveBookmark, deleteBookmarksForAlbum, getBookmarksForAlbum } = useBookmarks();
  const { showToast } = useToastContext();

  const albumHasBookmarks = getBookmarksForAlbum(trackInfo.albumId).length > 0;
  const [saving, setSaving] = useState(false);

  const handleAlbumFinished = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await deleteBookmarksForAlbum(trackInfo.albumId);
    showToast('Album removed from your list', 'default');
    onClose();
  };

  const handleSave = async () => {
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
      timestamp:  trackInfo.timestamp || null,
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

          {/* Timestamp — read-only badge */}
          <View style={styles.tsSection}>
            <Text style={styles.sectionLabel}>TIMESTAMP</Text>
            <View style={styles.tsBadge}>
              <MaterialIcons name="schedule" size={14} color={colors.secondary} />
              <Text style={styles.tsBadgeText}>
                {trackInfo.timestamp || 'No timestamp'}
              </Text>
            </View>
          </View>

          {/* Album Finished — only when album already has bookmarks */}
          {albumHasBookmarks && (
            <Pressable
              onPress={handleAlbumFinished}
              style={({ pressed }) => [styles.albumFinishedBtn, pressed && { opacity: 0.8 }]}
            >
              <MaterialIcons name="check-circle-outline" size={18} color={colors.error} />
              <Text style={styles.albumFinishedBtnText}>Album Finished</Text>
            </Pressable>
          )}

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
            <View style={styles.saveGradient}>
              {saving ? (
                <ActivityIndicator color={colors.onPill} size="small" />
              ) : (
                <MaterialCommunityIcons name="bookmark-music" size={18} color={colors.onPill} />
              )}
              <Text style={styles.saveBtnText}>
                {saving ? 'Saving…' : 'Save'}
              </Text>
            </View>
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
  tsBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               spacing.sm,
    alignSelf:         'flex-start',
    backgroundColor:   'rgba(230, 190, 173, 0.12)',
    borderRadius:      999,
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.sm,
    borderWidth:       1,
    borderColor:       'rgba(230, 190, 173, 0.25)',
  },
  tsBadgeText: {
    ...typography.bodyMd,
    color: colors.secondary,
  },

  // Album Finished button
  albumFinishedBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               spacing.sm,
    marginHorizontal:  spacing.lg,
    borderRadius:      radius.full,
    paddingVertical:   spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor:   colors.surfaceContainerHigh,
    borderWidth:       1,
    borderColor:       colors.errorContainer,
  },
  albumFinishedBtnText: {
    ...typography.titleMd,
    color: colors.error,
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
    backgroundColor:   colors.pillBg,
    borderRadius:      999,
  },
  saveBtnText: {
    ...typography.titleMd,
    color: colors.onPill,
  },
});
