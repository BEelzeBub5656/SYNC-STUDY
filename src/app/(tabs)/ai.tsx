import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AiScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Image
          source={require('@/assets/images/study/icon2.png')}
          style={styles.mascot}
          resizeMode="contain"
        />
        <Text style={styles.title}>AI 问答</Text>
        <Text style={styles.description}>这个页面将在后续学习中继续完成</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF7EF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 94,
  },
  mascot: {
    width: 108,
    height: 108,
  },
  title: {
    marginTop: 18,
    color: '#392D24',
    fontSize: 24,
    fontWeight: '700',
  },
  description: {
    marginTop: 8,
    color: '#9A7C63',
    fontSize: 14,
  },
});
