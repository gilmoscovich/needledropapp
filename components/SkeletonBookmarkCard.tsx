// components/SkeletonBookmarkCard.tsx
import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '@/constants/theme';

export function SkeletonBookmarkCard() {
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
      <View style={styles.lines}>
        <View style={styles.line1} />
        <View style={styles.line2} />
        <View style={styles.line3} />
      </View>
      <View style={styles.circle} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection:    'row',
    alignItems:       'center',
    marginHorizontal: spacing.lg,
    marginBottom:     spacing.sm,
    padding:          spacing.md,
    borderRadius:     radius.xl,
    backgroundColor:  colors.surfaceContainer,
    gap:              spacing.md,
  },
  art: {
    width:           64,
    height:          64,
    borderRadius:    radius.lg,
    backgroundColor: colors.surfaceContainerHigh,
  },
  lines: {
    flex: 1,
    gap:  6,
  },
  line1: {
    height:          13,
    width:           '80%',
    borderRadius:    radius.sm,
    backgroundColor: colors.surfaceContainerHigh,
  },
  line2: {
    height:          11,
    width:           '65%',
    borderRadius:    radius.sm,
    backgroundColor: colors.surfaceContainerHigh,
  },
  line3: {
    height:          10,
    width:           '40%',
    borderRadius:    radius.sm,
    backgroundColor: colors.surfaceContainer,
  },
  circle: {
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: colors.surfaceContainerHigh,
  },
});
