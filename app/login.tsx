// app/login.tsx
import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth';
import { colors, typography, spacing, radius, vinylGradient } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const { login, loading, isAuthenticated } = useSpotifyAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Vinyl spin animation
  const spinAnim  = useRef(new Animated.Value(0)).current;
  // Fade-in for content
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)/library');
      return;
    }

    // Slow spin — like a record player at rest
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();

    // Content fade-in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 900,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isAuthenticated]);

  const spin = spinAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await login();
    } catch {
      Alert.alert('Login failed', 'Could not connect to Spotify. Please try again.');
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + spacing.xl }]}>

      {/* Background vinyl circles — decorative depth */}
      <View style={styles.bgCircleOuter} />
      <View style={styles.bgCircleInner} />

      {/* The spinning vinyl record */}
      <Animated.View
        style={[
          styles.vinylWrapper,
          { transform: [{ rotate: spin }] },
        ]}
      >
        <LinearGradient
          colors={vinylGradient.colors}
          start={vinylGradient.start}
          end={vinylGradient.end}
          style={styles.vinyl}
        >
          {/* Label rings */}
          <View style={styles.vinylRing1} />
          <View style={styles.vinylRing2} />
          <View style={styles.vinylCenter} />
        </LinearGradient>
      </Animated.View>

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity:   fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Wordmark */}
        <View style={styles.wordmarkRow}>
          <View style={styles.wordmarkDot} />
          <Text style={styles.wordmark}>NEEDLE DROP</Text>
        </View>

        <Text style={styles.tagline}>
          Drop a pin.{'\n'}Pick up where you left off.
        </Text>

        <Text style={styles.sub}>
          Your Spotify moments, precisely bookmarked.
        </Text>

        {/* Login button */}
        <Pressable
          onPress={handleLogin}
          disabled={loading}
          style={({ pressed }) => [
            styles.spotifyButton,
            pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
          ]}
        >
          <SpotifyIcon />
          <Text style={styles.spotifyButtonText}>
            {loading ? 'Connecting…' : 'Continue with Spotify'}
          </Text>
        </Pressable>

        <Text style={styles.legal}>
          NeedleDrop requires a Spotify Premium account for playback.
        </Text>
      </Animated.View>
    </View>
  );
}

// Spotify logomark — simple SVG-style using View
function SpotifyIcon() {
  return (
    <View style={spotifyIconStyles.container}>
      <Text style={spotifyIconStyles.icon}>♫</Text>
    </View>
  );
}

const spotifyIconStyles = StyleSheet.create({
  container: {
    width:           20,
    height:          20,
    borderRadius:    10,
    backgroundColor: '#1DB954',
    alignItems:      'center',
    justifyContent:  'center',
  },
  icon: {
    color:    '#000',
    fontSize: 11,
    fontWeight: '900',
  },
});

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: colors.background,
    alignItems:      'center',
    justifyContent:  'flex-end',
  },

  // Background decorative circles
  bgCircleOuter: {
    position:        'absolute',
    top:             -width * 0.25,
    left:            -width * 0.25,
    width:           width * 1.5,
    height:          width * 1.5,
    borderRadius:    width * 0.75,
    backgroundColor: colors.surfaceContainerLowest,
    opacity:         0.6,
  },
  bgCircleInner: {
    position:        'absolute',
    top:             -width * 0.1,
    left:            -width * 0.1,
    width:           width * 1.2,
    height:          width * 1.2,
    borderRadius:    width * 0.6,
    backgroundColor: colors.surfaceContainerLow,
    opacity:         0.5,
  },

  // Vinyl record
  vinylWrapper: {
    position: 'absolute',
    top:      height * 0.06,
    width:    width * 0.75,
    height:   width * 0.75,
  },
  vinyl: {
    width:        '100%',
    height:       '100%',
    borderRadius: width * 0.375,
    alignItems:   'center',
    justifyContent: 'center',
  },
  vinylRing1: {
    position:     'absolute',
    width:        '75%',
    height:       '75%',
    borderRadius: width * 0.375,
    borderWidth:  1.5,
    borderColor:  'rgba(0,0,0,0.3)',
  },
  vinylRing2: {
    position:     'absolute',
    width:        '50%',
    height:       '50%',
    borderRadius: width * 0.375,
    borderWidth:  1,
    borderColor:  'rgba(0,0,0,0.25)',
  },
  vinylCenter: {
    width:           20,
    height:          20,
    borderRadius:    10,
    backgroundColor: colors.surfaceContainerHighest,
  },

  // Content block
  content: {
    width:      '100%',
    paddingHorizontal: spacing.xl,
    gap:        spacing.md,
  },

  wordmarkRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.sm,
    marginBottom:  spacing.xs,
  },
  wordmarkDot: {
    width:           8,
    height:          8,
    borderRadius:    4,
    backgroundColor: colors.secondary,
  },
  wordmark: {
    ...typography.labelLg,
    color:       colors.primary,
    letterSpacing: 4,
  },

  tagline: {
    ...typography.headlineLg,
    color:      colors.onSurface,
    marginBottom: spacing.xs,
  },

  sub: {
    ...typography.bodyMd,
    color:        colors.onSurfaceVariant,
    marginBottom: spacing.lg,
  },

  spotifyButton: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            spacing.sm,
    backgroundColor: colors.primary,
    borderRadius:   radius.full,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  spotifyButtonText: {
    ...typography.titleMd,
    color: colors.onPrimary,
  },

  legal: {
    ...typography.labelMd,
    color:     colors.outline,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
