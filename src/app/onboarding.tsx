import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
    FlatList,
    Image,
    ImageSourcePropType,
    ListRenderItemInfo,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Pressable,
    StyleSheet,
    Text,
    View,
    useWindowDimensions
} from 'react-native';

type IntroPage = {
    id: string;
    type: 'intro';
    title: string;
    description: string;
    image: ImageSourcePropType;
    backgroundColor: string;
};

type RolePage = {
    id: string;
    type: 'role';
};

type OnboardingPage = IntroPage | RolePage;

const introPages: IntroPage[] = [
    {
        id: 'analysis',
        type: 'intro',
        title: '个性化分析',
        description: '分析你的学习情况，制定合适的学习方案',
        image: require('@/assets/images/welcome_facing/icon1.png'),
        backgroundColor: '#C6E5FF'
    },
  {
    id: 'companion',
        type: 'intro',
        title: '陪伴学习',
        description: '和你的学习搭子一起快乐成长',
        image: require('@/assets/images/welcome_facing/icon2.png'),
    backgroundColor: '#FFC5BE'
    },
  {
    id: 'mobile',
        type: 'intro',
        title: '移动便捷',
        description: '随时随地开启你的学习计划',
        image: require('@/assets/images/welcome_facing/icon3.png'),
    backgroundColor: '#FFD9AB'
    }
];

const pages: OnboardingPage[] = [
    ...introPages,
    {
        id: 'role-select',
        type: 'role'
    }
];

export default function OnboardingScreen() {
    const { width, height } = useWindowDimensions();
    const [currentIndex, setCurrentIndex] = useState(0);
    const listRef = useRef<FlatList<OnboardingPage>>(null);

    function handleSkip() {
        const rolePageIndex = pages.length - 1;

        listRef.current?.scrollToIndex({
            index: rolePageIndex,
            animated: true
        });
        setCurrentIndex(rolePageIndex);
    }

    function handleScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
        const offsetX = event.nativeEvent.contentOffset.x;
        const nextIndex = Math.round(offsetX / width);

        setCurrentIndex(nextIndex);
    }

    function renderPage({ item }: ListRenderItemInfo<OnboardingPage>) {
        if (item.type === 'role') {
            return <RoleSelectionPage width={width} height={height} />;
        }

        return (
            <View
                style={[
                    styles.introPage,
                    { width, backgroundColor: item.backgroundColor }
                ]}
            >
                <Pressable
                    onPress={handleSkip}
                    hitSlop={10}
                    style={({ pressed }) => [
                        styles.skipButton,
                        pressed && styles.pressedButton
                    ]}
                >
                    <Text style={styles.skipText}>跳过</Text>
                </Pressable>

                <View style={styles.illustrationArea}>
                    <Image
                        source={item.image}
                        style={styles.introImage}
                        resizeMode="contain"
                    />
                </View>

                <Text style={styles.introTitle}>{item.title}</Text>
                <Text style={styles.introDescription}>{item.description}</Text>

                <View style={styles.pagination}>
                    {introPages.map((page, index) => (
                        <View
                            key={page.id}
                            style={[
                                styles.dot,
                                index === currentIndex && styles.activeDot
                            ]}
                        />
                    ))}
                </View>
            </View>
        );
    }

    return (
        <FlatList
            ref={listRef}
            style={styles.list}
            data={pages}
            renderItem={renderPage}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            bounces={false}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScrollEnd}
            getItemLayout={(_, index) => ({
                length: width,
                offset: width * index,
                index
            })}
        />
    );
}

type RoleSelectionPageProps = {
    width: number;
    height: number;
};

function RoleSelectionPage({ width, height }: RoleSelectionPageProps) {
    const bottomImageHeight = width * (267 / 404);
    const roleImageWidth = Math.min(150, width * 0.37);
    const buttonWidth = Math.min(170, width * 0.43);

    return (
        <View style={[styles.rolePage, { width }]}>
            <Image
                source={require('@/assets/images/welcome_facing/Frame 1833.png')}
                style={[styles.logo, { top: Math.max(60, height * 0.09) }]}
                resizeMode="contain"
            />

            <View style={[styles.sloganArea, { top: height * 0.255 }]}>
                <Text style={styles.slogan}>与你的学习搭子一起智能学习</Text>
                <Text style={styles.englishSlogan}>
                    Smart Study with Your buddy
                </Text>
            </View>

            <View style={[styles.guestGroup, { top: height * 0.37 }]}>
                <Image
                    source={require('@/assets/images/welcome_facing/icon4.png')}
                    style={{
                        width: roleImageWidth,
                        height: roleImageWidth * 1.12
                    }}
                    resizeMode="contain"
                />

                <Pressable
                    style={({ pressed }) => [
                        styles.roleButton,
                        styles.guestButton,
                        { width: buttonWidth },
                        pressed && styles.pressedButton
                    ]}
                >
                    <Text style={styles.roleButtonText}>游客</Text>
                </Pressable>
            </View>

            <View
                style={[
                    styles.loginGroup,
                    {
                        bottom: bottomImageHeight - 33
                    }
                ]}
            >
                <Image
                    source={require('@/assets/images/welcome_facing/icon5.png')}
                    style={[
                        styles.loginMascot,
                        { width: roleImageWidth, height: roleImageWidth * 1.12 }
                    ]}
                    resizeMode="contain"
                />

                <Pressable
                    onPress={() => router.push('/login')}
                    style={({ pressed }) => [
                        styles.roleButton,
                        styles.loginButton,
                        { width: buttonWidth },
                        pressed && styles.pressedButton
                    ]}
                >
                    <Text style={styles.roleButtonText}>登录</Text>
                    <Image
                        source={require('@/assets/images/welcome_facing/leaf.png')}
                        style={styles.loginLeaf}
                        resizeMode="contain"
                    />
                </Pressable>
            </View>

            <Image
                source={require('@/assets/images/welcome_facing/bottom.png')}
                style={styles.bottomImage}
                resizeMode="cover"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    list: {
        flex: 1,
        backgroundColor: '#F5F5F5'
    },
    introPage: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 42
    },
    skipButton: {
        position: 'absolute',
        top: 50,
        right: 24,
        zIndex: 5,
        minWidth: 58,
        height: 34,
        paddingHorizontal: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.45)'
    },
    skipText: {
        color: '#000000',
        fontSize: 15,
        fontWeight: '300'
    },
    illustrationArea: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center'
    },
    introImage: {
        width: '88%',
        height: '88%',
        maxWidth: 360,
        maxHeight: 430
    },
    introTitle: {
        color: '#FF8D00',
        fontSize: 28,
        fontWeight: '700',
        textAlign: 'center'
    },
    introDescription: {
        minHeight: 48,
        marginTop: 12,
        paddingHorizontal: 16,
        color: '#6F625A',
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center'
    },
    pagination: {
        height: 18,
        marginTop: 28,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10
    },
    dot: {
        width: 9,
        height: 9,
        borderRadius: 5,
        backgroundColor: '#E1D5CC'
    },
    activeDot: {
        backgroundColor: '#FF8D00'
    },
    rolePage: {
        flex: 1,
        position: 'relative',
        alignItems: 'center',
        overflow: 'hidden',
        backgroundColor: '#F5F5F5'
    },
    logo: {
        position: 'absolute',
        width: 75,
        height: 75
    },
    sloganArea: {
        position: 'absolute',
        alignItems: 'center',
        zIndex: 2
    },
    slogan: {
        color: '#FF8D00',
        fontSize: 18,
        fontWeight: '600',
        letterSpacing: 4,
        textAlign: 'center'
    },
    englishSlogan: {
        marginTop: 2,
        color: '#FF8D00',
        fontSize: 18,
        fontWeight: '600',
        letterSpacing: 0.8
    },
    guestGroup: {
        position: 'absolute',
        left: 20,
        alignItems: 'center',
        zIndex: 2
    },
    loginGroup: {
        position: 'absolute',
        right: 24,
        alignItems: 'center',
        zIndex: 2
    },
    loginMascot: {
        zIndex: 0,
        transform: [{ translateY: 16 }]
    },
    roleButton: {
        position: 'relative',
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 25,
        shadowColor: '#5A3714',
        shadowOffset: {
            width: 0,
            height: 6
        },
        shadowOpacity: 0.16,
        shadowRadius: 6,
        elevation: 5
    },
    guestButton: {
        marginTop: -10,
        backgroundColor: '#FFFFFF'
    },
    loginButton: {
        backgroundColor: '#FFD29B'
    },
    roleButtonText: {
        color: '#7A3C10',
        fontSize: 20
    },
    loginLeaf: {
        position: 'absolute',
        top: -12,
        right: 0,
        width: 36,
        height: 26
    },
    pressedButton: {
        opacity: 0.65
    },
    bottomImage: {
        position: 'absolute',
        left: 0,
        bottom: 0,
        width: '100%',
        aspectRatio: 404 / 267,
        zIndex: 1
    }
});
