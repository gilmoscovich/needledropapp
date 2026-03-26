# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Start Expo dev server (opens QR code / tunnel)
npm run ios        # Start with iOS simulator
npm run android    # Start with Android emulator
npm run web        # Start in browser

npx tsc --noEmit   # TypeScript type-check (no test runner configured yet)
```

## Architecture

NeedleDrop is a React Native / Expo app for bookmarking moments in Spotify albums. Users authenticate via Spotify OAuth, browse albums, and save timestamped bookmarks to specific tracks.

### Key design decisions

- **Routing:** `expo-router` (file-based routing under `app/`). The entry point is `index.ts` → `registerRootComponent`.
- **Auth:** Spotify OAuth via `expo-auth-session` + `expo-web-browser`. Tokens stored in `expo-secure-store`.
- **Persistence:** Bookmarks stored in `@react-native-async-storage/async-storage`.
- **Dark-only UI:** `userInterfaceStyle: "dark"` in `app.json`. Never add light-mode conditionals.
- **Deep linking scheme:** `needledrop://` — used for Spotify OAuth redirect URI.

### Design tokens

`constants/theme.ts` is the **single source of truth** for all visual values. Always import from here — never hardcode colors, spacing, font sizes, or radii inline.

- `colors` — layered warm blacks for surfaces, `secondary` (`#e6bead`) for active/accent states
- `vinylGradient` — used on all play buttons via `expo-linear-gradient`
- `typography` — Manrope font family; use spread objects directly in StyleSheet (e.g. `...typography.titleMd`)
- `TAB_BAR_HEIGHT = 88` — used for scroll insets and toast positioning

### Core types (`types/index.ts`)

- `SpotifyTrack` / `SpotifyAlbum` / `SpotifyUser` — Spotify API response shapes
- `Bookmark` — persisted bookmark; `trackIndex` is 0-based, `trackNum` is 1-based display value; `timestamp` is `"mm:ss"` or `"h:mm:ss"` or `null`
- `PlaybackResult` — union returned by playback operations
- `ToastType` — controls toast appearance

### Environment

`EXPO_PUBLIC_SPOTIFY_CLIENT_ID` in `.env` — required for OAuth. `.env` is gitignored.

## Current Status

**Frontend Phase 3 complete.** All 5 backend phases done. Frontend: Login (Phase 1), Navigation Shell (Phase 2), Library & Search screens (Phase 3). Frontend Phase 4 next: Album Detail, Track Picker Modal, Bookmarks screen.
