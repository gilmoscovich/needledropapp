// constants/theme.ts
// Single source of truth for all design tokens.
// Every component imports from here — never hardcode values.

export const colors = {
  // Surfaces — layered warm blacks (darkest to lightest)
  background:              '#131313',
  surface:                 '#131313',
  surfaceContainerLowest:  '#0e0e0e',
  surfaceContainerLow:     '#1c1b1b',
  surfaceContainer:        '#201f1f',
  surfaceContainerHigh:    '#2a2a2a',
  surfaceContainerHighest: '#353534',
  surfaceBright:           '#3a3939',

  // Text — never use pure #ffffff
  onSurface:               '#e5e2e1',  // primary text
  onSurfaceVariant:        '#d4c3bd',  // secondary text
  outline:                 '#9c8e88',  // muted / placeholder
  outlineVariant:          '#504440',  // ghost borders

  // Brand — warm cream & espresso
  primary:                 '#cec5ba',  // CTA fill
  onPrimary:               '#353028',  // text ON primary buttons
  primaryContainer:        '#4b463e',
  primaryFixed:            '#ebe1d6',

  secondary:               '#e6bead',  // accent — active, timestamps, badges
  onSecondary:             '#432a1f',  // text ON secondary
  secondaryContainer:      '#5c4033',  // dark espresso — active tab pill
  onSecondaryContainer:    '#d4ad9c',

  tertiary:                '#dec1af',
  tertiaryContainer:       '#574235',

  // Semantic
  error:                   '#ffb4ab',
  errorContainer:          '#93000a',
};

// Vinyl gradient — used for all play buttons
// Apply via expo-linear-gradient as a circle
export const vinylGradient = {
  colors:  ['#e6bead', '#5c4033'] as const,
  start:   { x: 0.2, y: 0.2 },
  end:     { x: 0.8, y: 0.8 },
};

// Timestamp badge — warm brown tint
export const timestampBadgeStyle = {
  backgroundColor: 'rgba(92, 64, 51, 0.15)',
  borderColor:     'rgba(230, 190, 173, 0.2)',
  borderWidth:     1,
};

// Glass nav overlay
export const glassNavStyle = {
  backgroundColor: 'rgba(32, 31, 31, 0.9)',
};

export const typography = {
  fontFamily: 'Manrope',

  // Use these as StyleSheet spread objects
  displayLg:  { fontSize: 56, fontWeight: '800' as const, letterSpacing: -2,   lineHeight: 58 },
  displayMd:  { fontSize: 40, fontWeight: '800' as const, letterSpacing: -1.5, lineHeight: 44 },
  headlineLg: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -1,   lineHeight: 36 },
  headlineMd: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.5, lineHeight: 28 },
  headlineSm: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.3, lineHeight: 24 },
  titleLg:    { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.2, lineHeight: 22 },
  titleMd:    { fontSize: 16, fontWeight: '600' as const, letterSpacing: -0.1, lineHeight: 20 },
  bodyLg:     { fontSize: 16, fontWeight: '400' as const, lineHeight: 26 },
  bodyMd:     { fontSize: 14, fontWeight: '400' as const, lineHeight: 22 },
  labelLg:    { fontSize: 12, fontWeight: '700' as const, letterSpacing: 1.5,  textTransform: 'uppercase' as const },
  labelMd:    { fontSize: 10, fontWeight: '700' as const, letterSpacing: 2,    textTransform: 'uppercase' as const },
  labelSm:    { fontSize: 9,  fontWeight: '700' as const, letterSpacing: 2.5,  textTransform: 'uppercase' as const },
};

export const spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  xxl:  32,
  xxxl: 48,
  huge: 64,
};

export const radius = {
  sm:   4,    // tags, small badges
  md:   8,    // inputs, small elements
  lg:   12,   // cards, modal headers
  xl:   16,   // album art, large cards
  xxl:  24,   // bottom nav, modals
  full: 999,  // pills, circles
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 15,
  },
  albumArt: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  navBar: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
};

// Tab bar height — used for scroll insets and toast positioning
export const TAB_BAR_HEIGHT = 88;
