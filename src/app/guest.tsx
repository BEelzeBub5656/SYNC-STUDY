import { StyleSheet, Text, View } from 'react-native';

export default function GuestScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>游客页面</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
  },
});
