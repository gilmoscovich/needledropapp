// components/TrackPickerModal.tsx
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SpotifyAlbum, SpotifyTrack, Bookmark } from '@/types';
import { isValidTimestamp } from '@/services/spotify';
import {
  colors, typography, spacing, radius,
  timestampBadgeStyle,
} from '@/constants/theme';

interface TrackPickerModalProps {
  visible:           boolean;
  album:             SpotifyAlbum;
  existingBookmarks?: Bookmark[];
  initialTrack?:     SpotifyTrack | null;
  onClose:           () => void;
  onSave:            (bookmark: Bookmark) => Promise<void>;
}

export function TrackPickerModal({
  visible,
  album,
  existingBookmarks = [],
  initialTrack,
  onClose,
  onSave,
}: TrackPickerModalProps) {
  const insets = useSafeAreaInsets();

  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);
  const [timestamp,     setTimestamp]     = useState('');
  const [saving,        setSaving]        = useState(false);
  const [tsError,       setTsError]       = useState('');

  // On open: pre-select initialTrack if provided, otherwise clear
  useEffect(() => {
    if (!visible) return;
    if (initialTrack) {
      setSelectedTrack(initialTrack);
      const existing = existingBookmarks.find(b => b.trackUri === initialTrack.uri);
      setTimestamp(existing?.timestamp ?? '');
      setTsError('');
    } else {
      setSelectedTrack(null);
      setTimestamp('');
      setTsError('');
    }
  }, [visible]);

  // When a track is selected, prefill its existing timestamp if one exists
  const handleSelectTrack = (track: SpotifyTrack) => {
    Haptics.selectionAsync();
    setSelectedTrack(track);
    const existing = existingBookmarks.find(b => b.trackUri === track.uri);
    setTimestamp(existing?.timestamp ?? '');
    setTsError('');
  };

  const handleTimestampChange = (text: string) => {
    setTimestamp(text);
    if (text && !isValidTimestamp(text)) {
      setTsError('Format: mm:ss or h:mm:ss');
    } else {
      setTsError('');
    }
  };

  const handleSave = async () => {
    if (!selectedTrack) {
      Alert.alert('Select a track', 'Choose which track to bookmark.');
      return;
    }
    if (timestamp && !isValidTimestamp(timestamp)) {
      setTsError('Format: mm:ss or h:mm:ss');
      return;
    }

    const trackIndex = album.tracks.items.findIndex(t => t.uri === selectedTrack.uri);

    const bookmark: Bookmark = {
      albumId:    album.id,
      albumName:  album.name,
      artist:     album.artists.map(a => a.name).join(', '),
      art:        album.images?.[0]?.url ?? '',
      albumUri:   album.uri,
      trackUri:   selectedTrack.uri,
      trackName:  selectedTrack.name,
      trackIndex: trackIndex,
      trackNum:   selectedTrack.track_number,
      timestamp:  timestamp.trim() || null,
      savedAt:    Date.now(),
    };

    setSaving(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await onSave(bookmark);
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
        style={styles.flex}
      >
        <View style={[styles.container, { paddingBottom: insets.bottom + spacing.lg }]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Bookmark</Text>
              <Text style={styles.headerAlbum} numberOfLines={1}>{album.name}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={20} color={colors.outline} />
            </Pressable>
          </View>

          {/* Timestamp input */}
          <View style={styles.tsSection}>
            <Text style={styles.sectionLabel}>TIMESTAMP (OPTIONAL)</Text>
            <View style={styles.tsInputWrapper}>
              <MaterialIcons name="schedule" size={16} color={colors.outline} />
              <TextInput
                style={styles.tsInput}
                value={timestamp}
                onChangeText={handleTimestampChange}
                placeholder="2:34 or 1:04:22"
                placeholderTextColor={colors.outline}
                keyboardType="numbers-and-punctuation"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
              {timestamp.length > 0 && (
                <Pressable onPress={() => { setTimestamp(''); setTsError(''); }}>
                  <MaterialIcons name="close" size={14} color={colors.outline} />
                </Pressable>
              )}
            </View>
            {tsError ? <Text style={styles.tsError}>{tsError}</Text> : null}
          </View>

          {/* Track list */}
          <Text style={[styles.sectionLabel, { paddingHorizontal: spacing.lg, marginBottom: spacing.sm }]}>
            SELECT TRACK
          </Text>
          <ScrollView
            style={styles.trackList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {album.tracks.items.map((track, index) => {
              const isSelected  = selectedTrack?.uri === track.uri;
              const hasBookmark = existingBookmarks.some(b => b.trackUri === track.uri);
              return (
                <Pressable
                  key={track.uri}
                  onPress={() => handleSelectTrack(track)}
                  style={[styles.trackRow, isSelected && styles.trackRowSelected]}
                >
                  {isSelected && <View style={styles.trackActiveBorder} />}
                  <Text style={[styles.trackNum, isSelected && styles.trackNumActive]}>
                    {String(index + 1).padStart(2, '0')}
                  </Text>
                  <Text
                    style={[styles.trackName, isSelected && styles.trackNameActive]}
                    numberOfLines={1}
                  >
                    {track.name}
                  </Text>
                  {hasBookmark && !isSelected && (
                    <MaterialCommunityIcons name="book-heart" size={14} color={colors.outlineVariant} />
                  )}
                  {isSelected && (
                    <MaterialCommunityIcons name="book-heart" size={16} color={colors.secondary} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Save button */}
          <Pressable
            onPress={handleSave}
            disabled={saving || !selectedTrack}
            style={({ pressed }) => [
              styles.saveBtn,
              (!selectedTrack || saving) && styles.saveBtnDisabled,
              pressed && { opacity: 0.85 },
            ]}
          >
            <MaterialCommunityIcons
              name="book-heart"
              size={18}
              color={!selectedTrack ? colors.outline : colors.onPrimary}
            />
            <Text style={[styles.saveBtnText, !selectedTrack && { color: colors.outline }]}>
              {saving ? 'Saving…' : 'Save Bookmark'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex:            1,
    backgroundColor: colors.surfaceContainerLow,
  },
  handle: {
    width:           40,
    height:          4,
    borderRadius:    2,
    backgroundColor: colors.outlineVariant,
    alignSelf:       'center',
    marginTop:       spacing.md,
    marginBottom:    spacing.sm,
  },
  header: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    ...typography.headlineSm,
    color: colors.onSurface,
  },
  headerAlbum: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  closeBtn: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems:      'center',
    justifyContent:  'center',
  },

  // Timestamp section
  tsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom:      spacing.lg,
    gap:               spacing.sm,
  },
  sectionLabel: {
    ...typography.labelSm,
    color: colors.outline,
  },
  tsInputWrapper: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             spacing.sm,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius:    radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tsInput: {
    flex:     1,
    ...typography.bodyMd,
    color:    colors.onSurface,
    padding:  0,
  },
  tsError: {
    ...typography.labelMd,
    color: colors.error,
  },

  // Track rows
  trackList: {
    flex: 1,
  },
  trackRow: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap:             spacing.md,
    position:        'relative',
  },
  trackRowSelected: {
    backgroundColor: 'rgba(92,64,51,0.15)',
  },
  trackActiveBorder: {
    position:        'absolute',
    left:            0,
    top:             '20%',
    bottom:          '20%',
    width:           3,
    borderRadius:    2,
    backgroundColor: colors.secondary,
  },
  trackNum: {
    ...typography.headlineSm,
    color:     colors.outlineVariant,
    width:     28,
    textAlign: 'right',
    fontSize:  16,
  },
  trackNumActive: {
    color: colors.secondary,
  },
  trackName: {
    ...typography.titleMd,
    color: colors.onSurface,
    flex:  1,
  },
  trackNameActive: {
    color:      colors.secondary,
    fontWeight: '700',
  },

  // Save button
  saveBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop:       spacing.md,
    backgroundColor: colors.primary,
    borderRadius:    radius.full,
    paddingVertical: spacing.lg,
  },
  saveBtnDisabled: {
    backgroundColor: colors.surfaceContainerHighest,
  },
  saveBtnText: {
    ...typography.titleMd,
    color: colors.onPrimary,
  },
});
