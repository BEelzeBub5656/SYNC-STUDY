import { Akshar_600SemiBold } from '@expo-google-fonts/akshar/600SemiBold';
import { useFonts } from '@expo-google-fonts/akshar/useFonts';
import { router } from 'expo-router';

import {
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
    useWindowDimensions
} from 'react-native';

export default function RoleSelectScreen() {
    const { width, height } = useWindowDimensions();
    const handleGuestPress = () => {
        router.push('/guest');
    };

    const handleLoginPress = () => {
        router.push('/login');
    };
    const bottomImageHeight = width * (267 / 404);
    const [fontsLoaded] = useFonts({
        Akshar_600SemiBold
    });

    if (!fontsLoaded) {
        return null;
    }

    return (
        <View style={styles.container}>
            <Image
                source={require('@/assets/images/welcome_facing/Frame 1833.png')}
                style={styles.mascot}
                resizeMode="contain"
            />
            <Text style={styles.title}>与你的学习搭子一起智能学习</Text>
            <Text style={styles.btitle}>Smart Study with Your buddy</Text>

            <View style={styles.guestGroup}>
                <Image
                    source={require('@/assets/images/welcome_facing/icon4.png')}
                    resizeMode="contain"
                />

                <Pressable
                    onPress={handleGuestPress}
                    style={({ pressed }) => [
                        styles.button,
                        styles.guestButton,
                        pressed && styles.pressedButton
                    ]}
                >
                    <Text style={styles.buttonText}>游客</Text>
                </Pressable>
            </View>

            <View
                style={[styles.loginGroup, { bottom: bottomImageHeight - 33 }]}
            >
                <Image
                    source={require('@/assets/images/welcome_facing/icon5.png')}
                ></Image>
                <Pressable
                    onPress={handleLoginPress}
                    style={({ pressed }) => [
                        styles.button,
                        styles.loginButton,
                        pressed && styles.pressedButton
                    ]}
                >
                    <Text style={styles.buttonText}>登录</Text>
                    <Image
                        source={require('@/assets/images/welcome_facing/leaf.png')}
                        style={styles.loginLeaf}
                        resizeMode="contain"
                    ></Image>
                </Pressable>
            </View>
            <Image
                source={require('@/assets/images/welcome_facing/bottom.png')}
                style={styles.bottomIcon}
                resizeMode="cover"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
        alignItems: 'center',
        backgroundColor: '#F5F5F5'
    },

    mascot: {
        position: 'absolute',
        top: 82,
        width: 75,
        height: 75
    },

    guestGroup: {
        position: 'absolute',
        left: 20,
        top: 325,
        alignItems: 'center',
        zIndex: 1
    },

    loginGroup: {
        position: 'absolute',
        right: 24,
        alignItems: 'center',
        zIndex: 1
    },

    loginLeaf: {
        position: 'absolute',
        width: 36,
        height: 26,
        right: 0,
        top: -12,
        zIndex: 2
    },

    button: {
        position: 'relative',
        width: 170,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 66,
        overflow: 'visible',

        boxShadow: '0px 6px 12px 0px rgba(90, 55, 20, 0.16)'
    },

    guestButton: {
        marginTop: -10,
        backgroundColor: '#FFFFFF'
    },

    loginButton: {
        backgroundColor: '#FFD29B'
    },

    title: {
        position: 'absolute',
        top: 225,
        fontSize: 18,
        fontFamily: 'Akshar_600SemiBold',
        color: '#FF8D00',
        letterSpacing: 5.4
    },

    btitle: {
        position: 'absolute',
        top: 250,
        fontSize: 18,
        fontFamily: 'Akshar_600SemiBold',
        color: '#FF8D00',
        letterSpacing: 0.9
    },

    pressedButton: {
        opacity: 0.6
    },

    buttonText: {
        fontSize: 20,
        color: '#7A3C10'
    },

    bottomIcon: {
        position: 'absolute',
        left: 0,
        bottom: 0,
        width: '100%',
        aspectRatio: 404 / 267,
        zIndex: 0
    }
});
