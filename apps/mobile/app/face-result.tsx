import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

// TODO: replace with FaceResultScreen once implemented
export default function FaceResultRoute() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Face Result — Coming Soon</Text>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0a2e',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  text: { color: '#fff', fontSize: 18 },
  back: { paddingVertical: 12, paddingHorizontal: 24 },
  backText: { color: '#a78bfa', fontSize: 16, fontWeight: '600' },
});
