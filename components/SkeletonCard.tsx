// components/SkeletonCard.tsx
// Animated shimmer skeleton for album cards.
import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { colors, spacing, radius } from '@/constants/theme';

const CARD_GAP   = spacing.md;
const CARD_WIDTH = (Dimensions.get('window').width - spacing.lg * 2 - CARD_GAP) / 2;

export function SkeletonCard() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.8] });

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={styles.art} />
      <View style={styles.titleLine} />
      <View style={styles.artistLine} />
    </Animated.View>
  );
}

export function SkeletonGrid() {
  return (
    <View style={styles.grid}>
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection:     'row',
    flexWrap:          'wrap',
    paddingHorizontal: spacing.lg,
    gap:               spacing.md,
    paddingTop:        spacing.md,
  },
  card: {
    width: CARD_WIDTH,
    gap:   spacing.sm,
  },
  art: {
    width:           '100%',
    aspectRatio:     1,
    borderRadius:    radius.xl,
    backgroundColor: colors.surfaceContainerHigh,
  },
  titleLine: {
    height:          14,
    width:           '80%',
    borderRadius:    radius.sm,
    backgroundColor: colors.surfaceContainerHigh,
  },
  artistLine: {
    height:          11,
    width:           '55%',
    borderRadius:    radius.sm,
    backgroundColor: colors.surfaceContainer,
  },
});
