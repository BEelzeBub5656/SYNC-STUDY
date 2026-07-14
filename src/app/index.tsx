import { router } from 'expo-router';
import { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

export default function LaunchScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/onboarding');
    }, 1500);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.brandBlock}>
        <View style={styles.brandRow}>
          <Image
            source={require('@/assets/images/welcome_facing/Frame 1833.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.chineseBrand}>灵犀学伴</Text>
        </View>
        <Text style={styles.englishBrand}>Sync Study</Text>
      </View>

      <Image
        source={require('@/assets/images/welcome_facing/bottom.png')}
        style={styles.bottomImage}
        resizeMode="cover"
      />

      <View style={styles.sloganBlock}>
        <Text style={styles.slogan}>与你的学习搭子一起智能学习</Text>
        <Text style={styles.englishSlogan}>Smart Study with Your Buddy</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  brandBlock: {
    position: 'absolute',
    top: '22%',
    alignItems: 'center',
    zIndex: 2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
  },
  logo: {
    width: 62,
    height: 62,
  },
  chineseBrand: {
    color: '#FF921E',
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 5,
  },
  englishBrand: {
    marginTop: 8,
    color: '#FF921E',
    fontSize: 21,
    fontWeight: '600',
    letterSpacing: 11,
  },
  bottomImage: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '100%',
    aspectRatio: 404 / 267,
  },
  sloganBlock: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: '9%',
    alignItems: 'center',
    zIndex: 2,
  },
  slogan: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 2.5,
    textAlign: 'center',
  },
  englishSlogan: {
    marginTop: 2,
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.7,
    textAlign: 'center',
  },
});
