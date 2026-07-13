import { Tabs } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';

function TabBarBackground() {
    return (
        <View style={styles.tabBarSurface}>
        <Image source={require('@/assets/images/study/icon2.png')} style={styles.centerMascot} resizeMode="contain" />
        </View>
    );
    }

    export default function TabsLayout() {
    return (
        <Tabs
        initialRouteName="study"
        screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#F39A20',
            tabBarInactiveTintColor: '#554B43',
            tabBarHideOnKeyboard: true,
            tabBarLabelStyle: styles.tabLabel,
            tabBarStyle: styles.tabBar,
            tabBarBackground: TabBarBackground,
        }}>
        <Tabs.Screen
            name="study"
            options={{
            title: '学习',
            tabBarIcon: ({ focused }) => (
                <Image
                source={
                    focused
                    ? require('@/assets/images/study/button1-active.png')
                    : require('@/assets/images/study/button1.png')
                }
                style={styles.tabIcon}
                resizeMode="contain"
                />
            ),
            }}
        />

        <Tabs.Screen
            name="plan"
            options={{
            title: '计划',
            tabBarIcon: ({ focused }) => (
                <Image
                source={
                    focused
                    ? require('@/assets/images/study/button2-active.png')
                    : require('@/assets/images/study/button2.png')
                }
                style={styles.tabIcon}
                resizeMode="contain"
                />
            ),
            }}
        />

        <Tabs.Screen
            name="community"
            options={{
            title: '社区',
            tabBarIcon: ({ focused }) => (
                <Image
                source={
                    focused
                    ? require('@/assets/images/study/button3-active.png')
                    : require('@/assets/images/study/button3.png')
                }
                style={styles.tabIcon}
                resizeMode="contain"
                />
            ),
            }}
        />

        <Tabs.Screen
            name="profile"
            options={{
            title: '我的',
            tabBarIcon: ({ focused }) => (
                <Image
                source={
                    focused
                    ? require('@/assets/images/study/button4-active.png')
                    : require('@/assets/images/study/button4.png')
                }
                style={styles.tabIcon}
                resizeMode="contain"
                />
            ),
            }}
        />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        width: '90%',
        maxWidth: 404,
        marginHorizontal: 'auto',
        bottom: 10,
        height: 72,
        paddingTop: 9,
        paddingBottom: 8,
        borderTopWidth: 0,
        borderRadius: 25,
        backgroundColor: 'transparent',
        elevation: 0,
        overflow: 'visible',
    },
    tabBarSurface: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        borderRadius: 25,
        backgroundColor: '#FFFFFF',
        boxShadow: '0 7px 18px rgba(103, 69, 40, 0.17)',
        pointerEvents: 'none',
    },
    centerMascot: {
        position: 'absolute',
        top: -25,
        left: '50%',
        width: 54,
        height: 54,
        marginLeft: -27,
    },
    tabIcon: {
        width: 24,
        height: 24,
    },
    tabLabel: {
        marginTop: 1,
        fontSize: 11,
        fontWeight: '500',
    },
});
