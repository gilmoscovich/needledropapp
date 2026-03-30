# Album Tracklist Enhancements — Design Spec

**Date:** 2026-03-30
**Status:** Approved

## Overview

Three UX improvements to the album detail screen (`app/album/[id].tsx`) and bookmark modal (`components/TrackPickerModal.tsx`):

1. Show track duration next to each track row
2. Make track rows tappable to open bookmark modal with that track pre-selected
3. Validate that an entered timestamp does not exceed the selected track's duration

---

## Feature 1 — Track Duration Display

**What:** Each row in the tracklist shows the track's duration (e.g. `3:42`) right-aligned on the far side.

**How:**
- `SpotifyTrack.duration_ms` is already returned by the Spotify API and typed.
- `msToTimestamp(duration_ms)` from `services/spotify.ts` converts ms → `"m:ss"`.
- Add the formatted duration as a right-aligned `Text` element inside `TrackRow`.

**No data changes required** — everything is already available.

---

## Feature 2 — Tappable Track Rows → Pre-selected Bookmark Modal

**What:** Tapping a track row opens `TrackPickerModal` with that track already selected, so the user only needs to enter an optional timestamp and hit Save.

**Scroll safety:** React Native's `Pressable` inside a `ScrollView` only fires `onPress` on a deliberate tap. Scroll gestures are captured by the `ScrollView` and never trigger `onPress`. No special handling needed.

**Changes:**

### `TrackRow` (in `app/album/[id].tsx`)
- Convert outer `View` → `Pressable`
- Accept an `onPress` callback prop

### `AlbumDetailScreen` (in `app/album/[id].tsx`)
- Add `pendingTrack` state (`SpotifyTrack | null`)
- On track row press: set `pendingTrack` and `setShowPicker(true)`
- On modal close: clear `pendingTrack`
- Pass `pendingTrack` as `initialTrack` to `TrackPickerModal`

### `TrackPickerModal` (in `components/TrackPickerModal.tsx`)
- Add optional prop `initialTrack?: SpotifyTrack | null`
- In the `useEffect` that runs on `visible`, if `initialTrack` is provided, call `handleSelectTrack(initialTrack)` to pre-select it

---

## Feature 3 — Timestamp Bounded by Track Duration

**What:** If the entered timestamp exceeds the selected track's duration, show an inline error and block saving.

**How:**

In `TrackPickerModal`:
- After format validation in `handleTimestampChange`, additionally check:
  `if (timestampToMs(text) > selectedTrack.duration_ms)` → error: `"Exceeds track length (X:XX)"`
- Add a `useEffect` watching `selectedTrack`: re-run the duration check on the current `timestamp` value whenever the selected track changes (user could pick a shorter track after entering a long timestamp).
- Block save in `handleSave` if `tsError` is non-empty.

**Utilities already available:** `timestampToMs` and `msToTimestamp` in `services/spotify.ts`.

---

## Files Changed

| File | Changes |
|------|---------|
| `app/album/[id].tsx` | `TrackRow`: add duration display, convert to Pressable, add `onPress` prop. `AlbumDetailScreen`: add `pendingTrack` state, wire up row press. |
| `components/TrackPickerModal.tsx` | Add `initialTrack` prop, pre-select on open, add duration validation to timestamp input. |

No new files. No type changes. No API changes.
