// components/BottomNav.tsx
// Glass-morphic bottom navigation bar.
// Rendered as a custom tabBar inside the tab layout.

import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radius, TAB_BAR_HEIGHT, glassNavStyle } from '@/constants/theme';

interface BottomNavProps {
  state:       any;
  descriptors: any;
  navigation:  any;
}

export function BottomNav({ state, descriptors, navigation }: BottomNavProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: glassNavStyle.backgroundColor }]} />
      )}

      <View style={styles.row}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;

          const onPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.tab}
              accessibilityRole="button"
              accessibilityLabel={route.name}
            >
              <View style={[styles.iconWrapper, isFocused && styles.iconWrapperActive]}>
                <TabIcon name={route.name} active={isFocused} />
              </View>
              <Text style={[styles.label, isFocused && styles.labelActive]}>
                {route.name.charAt(0).toUpperCase() + route.name.slice(1)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function TabIcon({ name, active }: { name: string; active: boolean }) {
  const color = active ? colors.secondary : colors.outline;
  const size  = 22;

  switch (name) {
    case 'bookmarks':
      return <MaterialCommunityIcons name="book-heart" size={size} color={color} />;
    case 'search':
      return <MaterialIcons name="search" size={size} color={color} />;
    default:
      return <MaterialIcons name="radio" size={size} color={color} />;
  }
}

const styles = StyleSheet.create({
  container: {
    position:        'absolute',
    bottom:          0,
    left:            0,
    right:           0,
    height:          TAB_BAR_HEIGHT,
    overflow:        'hidden',
    borderTopWidth:  1,
    borderTopColor:  'rgba(80, 68, 64, 0.15)',
  },
  row: {
    flex:           1,
    flexDirection:  'row',
    alignItems:     'center',
    paddingTop:     spacing.sm,
    paddingHorizontal: spacing.md,
  },
  tab: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            4,
    paddingVertical: spacing.xs,
  },
  iconWrapper: {
    width:          44,
    height:         32,
    borderRadius:   radius.full,
    alignItems:     'center',
    justifyContent: 'center',
  },
  iconWrapperActive: {
    backgroundColor: colors.secondaryContainer,
  },
  label: {
    ...typography.labelMd,
    color:       colors.outline,
    letterSpacing: 0.5,
  },
  labelActive: {
    color: colors.secondary,
  },
});
