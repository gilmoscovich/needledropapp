// app/album/[id].tsx — placeholder
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/constants/theme';

export default function AlbumDetailScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
      </Pressable>
      <View style={styles.center}>
        <Text style={styles.text}>Album Detail — coming in Phase 4</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  back:      { padding: spacing.lg },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text:      { ...typography.bodyMd, color: colors.outline },
});
