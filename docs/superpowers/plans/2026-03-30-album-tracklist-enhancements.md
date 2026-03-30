# Album Tracklist Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show track durations in the album tracklist, make track rows tappable to pre-select them in the bookmark modal, and validate that entered timestamps don't exceed the selected track's length.

**Architecture:** All changes are confined to two files. `TrackRow` gains a duration display and becomes a `Pressable`. `AlbumDetailScreen` tracks a `pendingTrack` state to pass as `initialTrack` to `TrackPickerModal`. The modal gets an `initialTrack` prop for pre-selection and duration-aware timestamp validation.

**Tech Stack:** React Native, Expo, TypeScript. No test runner configured — verification is via `npx tsc --noEmit` and manual inspection.

---

## File Map

| File | Changes |
|------|---------|
| `app/album/[id].tsx` | `TrackRow`: add duration display, convert to `Pressable`, add `onPress` prop. `AlbumDetailScreen`: add `pendingTrack` state, wire row press, pass `initialTrack` + updated `onClose`/`onSave` to modal. |
| `components/TrackPickerModal.tsx` | Add `initialTrack` prop, pre-select on open, import `timestampToMs`+`msToTimestamp`, add duration validation to timestamp input and selectedTrack-change effect. |

---

## Task 1: Show Track Duration in TrackRow

**Files:**
- Modify: `app/album/[id].tsx`

- [ ] **Step 1: Import `msToTimestamp` at the top of `app/album/[id].tsx`**

`app/album/[id].tsx` has no existing import from `@/services/spotify`. Add this new import line after the `@/constants/theme` import:

```tsx
import { msToTimestamp } from '@/services/spotify';
```

- [ ] **Step 2: Add `onPress` prop to `TrackRow` and convert its root `View` to `Pressable`**

Replace the entire `TrackRow` function (lines 233–267 in `app/album/[id].tsx`):

```tsx
function TrackRow({
  track,
  index,
  isBookmarked,
  bookmarkedTimestamp,
  onPress,
}: {
  track:               SpotifyTrack;
  index:               number;
  isBookmarked:        boolean;
  bookmarkedTimestamp: string | null | undefined;
  onPress:             () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        trackStyles.row,
        isBookmarked && trackStyles.rowActive,
        pressed && { opacity: 0.7 },
      ]}
    >
      {isBookmarked && <View style={trackStyles.activeBorder} />}

      <Text style={[trackStyles.num, isBookmarked && trackStyles.numActive]}>
        {String(index + 1).padStart(2, '0')}
      </Text>

      <View style={trackStyles.meta}>
        <Text style={[trackStyles.name, isBookmarked && trackStyles.nameActive]} numberOfLines={1}>
          {track.name}
        </Text>
        {isBookmarked && bookmarkedTimestamp && (
          <View style={[trackStyles.tsBadge, timestampBadgeStyle]}>
            <MaterialIcons name="graphic-eq" size={10} color={colors.secondary} />
            <Text style={trackStyles.tsText}>
              Dropped at {bookmarkedTimestamp}
            </Text>
          </View>
        )}
      </View>

      <Text style={[trackStyles.duration, isBookmarked && trackStyles.durationActive]}>
        {msToTimestamp(track.duration_ms)}
      </Text>
    </Pressable>
  );
}
```

- [ ] **Step 3: Add `duration` and `durationActive` styles to `trackStyles`**

In the `trackStyles` StyleSheet (after the `tsText` entry), add:

```tsx
  duration: {
    ...typography.labelMd,
    color: colors.outlineVariant,
  },
  durationActive: {
    color: colors.secondary,
  },
```

- [ ] **Step 4: Add `pendingTrack` state to `AlbumDetailScreen` and wire up `TrackRow` calls**

In `AlbumDetailScreen`, add the state declaration alongside the other `useState` calls:

```tsx
const [pendingTrack, setPendingTrack] = useState<SpotifyTrack | null>(null);
```

Then update the `TrackRow` usage inside `album.tracks.items.map(...)`:

```tsx
{album.tracks.items.map((track, index) => {
  const bm = existingBookmarks.find(b => b.trackUri === track.uri);
  return (
    <TrackRow
      key={track.uri}
      track={track}
      index={index}
      isBookmarked={!!bm}
      bookmarkedTimestamp={bm?.timestamp ?? null}
      onPress={() => {
        setPendingTrack(track);
        setShowPicker(true);
      }}
    />
  );
})}
```

- [ ] **Step 5: Pass `initialTrack` to `TrackPickerModal` and clear `pendingTrack` on close/save**

Update the `TrackPickerModal` JSX in `AlbumDetailScreen`:

```tsx
<TrackPickerModal
  visible={showPicker}
  album={album}
  existingBookmarks={existingBookmarks}
  initialTrack={pendingTrack}
  onClose={() => {
    setShowPicker(false);
    setPendingTrack(null);
  }}
  onSave={async (bookmark) => {
    await saveBookmark(bookmark);
    setShowPicker(false);
    setPendingTrack(null);
  }}
/>
```

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit
```

Expected: errors about `initialTrack` prop not existing on `TrackPickerModal` yet (that's fine — Task 2 fixes this). All other errors should be zero.

- [ ] **Step 7: Commit**

```bash
git add app/album/[id].tsx
git commit -m "feat: show track duration in tracklist, make rows tappable"
```

---

## Task 2: Add `initialTrack` Pre-selection to `TrackPickerModal`

**Files:**
- Modify: `components/TrackPickerModal.tsx`

- [ ] **Step 1: Add `initialTrack` to `TrackPickerModalProps`**

Update the interface in `components/TrackPickerModal.tsx`:

```tsx
interface TrackPickerModalProps {
  visible:           boolean;
  album:             SpotifyAlbum;
  existingBookmarks?: Bookmark[];
  initialTrack?:     SpotifyTrack | null;
  onClose:           () => void;
  onSave:            (bookmark: Bookmark) => Promise<void>;
}
```

- [ ] **Step 2: Destructure `initialTrack` in the component**

```tsx
export function TrackPickerModal({
  visible,
  album,
  existingBookmarks = [],
  initialTrack,
  onClose,
  onSave,
}: TrackPickerModalProps) {
```

- [ ] **Step 3: Update the `useEffect` that runs on `visible` to handle `initialTrack`**

Replace the existing `useEffect` that resets state on open:

```tsx
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
```

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
git add components/TrackPickerModal.tsx
git commit -m "feat: pre-select track in bookmark modal when tapped from tracklist"
```

---

## Task 3: Validate Timestamp Against Track Duration

**Files:**
- Modify: `components/TrackPickerModal.tsx`

- [ ] **Step 1: Import `timestampToMs` and `msToTimestamp` in `TrackPickerModal`**

Update the existing import from `@/services/spotify`:

```tsx
import { isValidTimestamp, timestampToMs, msToTimestamp } from '@/services/spotify';
```

- [ ] **Step 2: Update `handleTimestampChange` to also check duration**

Replace the existing `handleTimestampChange` function:

```tsx
const handleTimestampChange = (text: string) => {
  setTimestamp(text);
  if (text && !isValidTimestamp(text)) {
    setTsError('Format: mm:ss or h:mm:ss');
  } else if (text && selectedTrack && timestampToMs(text) > selectedTrack.duration_ms) {
    setTsError(`Exceeds track length (${msToTimestamp(selectedTrack.duration_ms)})`);
  } else {
    setTsError('');
  }
};
```

- [ ] **Step 3: Add a `useEffect` to revalidate timestamp when `selectedTrack` changes**

Add this after the existing `useEffect` blocks (before `handleSelectTrack`):

```tsx
// Revalidate timestamp when the selected track changes (user may pick a shorter track)
useEffect(() => {
  if (!timestamp || !selectedTrack || !isValidTimestamp(timestamp)) return;
  if (timestampToMs(timestamp) > selectedTrack.duration_ms) {
    setTsError(`Exceeds track length (${msToTimestamp(selectedTrack.duration_ms)})`);
  } else {
    setTsError('');
  }
}, [selectedTrack]);
```

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
git add components/TrackPickerModal.tsx
git commit -m "feat: validate bookmark timestamp does not exceed track duration"
```
