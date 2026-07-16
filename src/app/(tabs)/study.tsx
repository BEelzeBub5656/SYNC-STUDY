import { Inter_800ExtraBold, useFonts } from '@expo-google-fonts/inter';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import type {
    ImageSourcePropType,
    StyleProp,
    TextStyle,
    ViewStyle
} from 'react-native';
import {
    ActivityIndicator,
    Alert,
    Image,
    ImageBackground,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    useWindowDimensions,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { StudyCheckInModal } from '@/components/study-check-in-modal';
import { getLatestExamPlan, type ExamPlan } from '@/lib/exam-plan-api';
import {
    checkInToday,
    type StudyCheckInSummary
} from '@/lib/study-check-in-api';
import {
    getTodayTaskDashboard,
    type TodayTaskDashboard
} from '@/lib/today-task-api';

type StudyMode = 'video' | 'training';
type TrapezoidVariant = 'challenge' | 'points' | 'paper' | 'mock';

type QuickAction = {
    id: string;
    title: string;
    color: string;
    stripeColor: string;
    image: ImageSourcePropType;
    badgeImage?: ImageSourcePropType;
};

type VideoItem = {
    id: string;
    title: string;
    school: string;
    image: ImageSourcePropType;
    learners: string;
    comments: string;
};

type CourseItem = {
    id: string;
    title: string;
    detail: string;
    image: ImageSourcePropType;
};

type CourseRanking = {
    id: string;
    title: string;
    tag: string;
    courses: CourseItem[];
};

const quickActions: QuickAction[] = [
    {
        id: 'book',
        title: '同步教材',
        color: '#FFE7CD',
        stripeColor: '#FFD29B',
        image: require('@/assets/images/study/icon47.png'),
        badgeImage: require('@/assets/images/InGatePng/icon54.png')

    },
    {
        id: 'course',
        title: '课程学习',
        color: '#FFE3DC',
        stripeColor: '#FCC6C6',
        image: require('@/assets/images/study/icon46.png'),
        badgeImage: require('@/assets/images/InGatePng/icon52.png')
    },
    {
        id: 'summary',
        title: '知识归纳',
        color: '#DCECF9',
        stripeColor: '#BDE3FF',
        image: require('@/assets/images/study/icon45.png'),
        badgeImage: require('@/assets/images/InGatePng/icon53.png')
    }
];

const videoItems: VideoItem[] = [
    {
        id: 'english',
        title: '学术英语读写',
        school: '华中科技大学',
        image: require('@/assets/images/study/video4.png'),
        learners: '1.3万',
        comments: '23'
    },
    {
        id: 'photo',
        title: '摄影基础',
        school: '电子科技大学',
        image: require('@/assets/images/study/video2.png'),
        learners: '1.3万',
        comments: '23'
    },
    {
        id: 'makeup',
        title: '美妆课程',
        school: '墨尔本大学',
        image: require('@/assets/images/study/video1.png'),
        learners: '9864',
        comments: '18'
    },
    {
        id: 'media',
        title: '3D动画与特效',
        school: '中国科学技术大学',
        image: require('@/assets/images/study/video3.png'),
        learners: '8276',
        comments: '16'
    }
];

const courseRankings: CourseRanking[] = [
    {
        id: 'popular',
        title: '热门排行',
        tag: 'TOP3',
        courses: [
            {
                id: 'psychology-introduction',
                title: '心理学：我知无不言，它妙不可言',
                detail: '华中师范大学',
                image: require('@/assets/images/study/course1.png')
            },
            {
                id: 'psychology-life',
                title: '心理学与生活',
                detail: '南京大学',
                image: require('@/assets/images/study/course2.png')
            },
            {
                id: 'college-english',
                title: '大学英语自学课程',
                detail: '北京科技大学',
                image: require('@/assets/images/study/course3.png')
            }
        ]
    },
    {
        id: 'new',
        title: '新课排行',
        tag: '本周新增5门',
        courses: [
            {
                id: 'mathematical-modeling',
                title: '数学建模',
                detail: '华中农业大学',
                image: require('@/assets/images/study/new-math.jpg')
            },
            {
                id: 'excel-accounting',
                title: 'Excel会计应用系列教程',
                detail: '青岛大学',
                image: require('@/assets/images/study/new-excel.jpg')
            },
            {
                id: 'counseling-theory',
                title: '心理咨询的理论与方法',
                detail: '南京大学',
                image: require('@/assets/images/study/new-counseling.jpg')
            }
        ]
    }
];

function SectionTitle({
    title,
    more = true
}: {
    title: string;
    more?: boolean;
}) {
    return (
        <View style={styles.sectionTitleRow}>
            <View>
                <Text style={styles.sectionTitle}>{title}</Text>
                <View style={styles.sectionAccent} />
            </View>
            {more && <Text style={styles.moreText}>更多 ›</Text>}
        </View>
    );
}

function QuickWaves({ color }: { color: string }) {
    const wavePath = 'M -8 8 C 7 0 22 0 37 8 S 67 16 82 8 S 112 0 127 8';

    return (
        <Svg
            pointerEvents="none"
            style={styles.quickWaves}
            viewBox="0 0 120 42"
            preserveAspectRatio="none"
        >
            <Path
                d={wavePath}
                stroke={color}
                strokeOpacity={0.42}
                strokeWidth={4}
                strokeLinecap="round"
                fill="none"
            />
            <Path
                d={wavePath}
                y={13}
                stroke={color}
                strokeOpacity={0.42}
                strokeWidth={4}
                strokeLinecap="round"
                fill="none"
            />
            <Path
                d={wavePath}
                y={26}
                stroke={color}
                strokeOpacity={0.42}
                strokeWidth={4}
                strokeLinecap="round"
                fill="none"
            />
        </Svg>
    );
}

function QuickActionCard({ action }: { action: QuickAction }) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.quickCard,
                { backgroundColor: action.color },
                pressed && styles.pressed
            ]}
        >
            <QuickWaves color={action.stripeColor} />
            {action.badgeImage ? (
                <Image
                    source={action.badgeImage}
                    style={styles.quickBadge}
                    resizeMode="contain"
                />
            ) : null}
            <Text style={styles.quickTitle}>{action.title}</Text>
            <Image
                source={action.image}
                style={[
                    styles.quickImage,
                    action.id === 'book' && styles.bookQuickImage,
                    action.id === 'course' && styles.courseQuickImage,
                    action.id === 'summary' && styles.summaryQuickImage
                ]}
                resizeMode="contain"
            />
        </Pressable>
    );
}

function VideoCard({ item }: { item: VideoItem }) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.videoCard,
                pressed && styles.pressed
            ]}
        >
            <ImageBackground
                source={item.image}
                style={styles.videoCover}
                imageStyle={styles.videoCoverImage}
                resizeMode="cover"
            >
                <LinearGradient
                    colors={['rgba(217, 217, 217, 0)', 'rgba(0, 0, 0, 1)']}
                    locations={[0, 1]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={styles.videoCaption}
                >
                    <Text style={styles.videoTitle} numberOfLines={1}>
                        {item.title}
                    </Text>
                    <Text style={styles.videoSchool} numberOfLines={1}>
                        {item.school}/
                    </Text>
                </LinearGradient>
            </ImageBackground>
            <View style={styles.videoStats}>
                <Text style={styles.videoStat}>▣ {item.learners}</Text>
                <Text style={styles.videoStat}>▢ {item.comments}</Text>
            </View>
        </Pressable>
    );
}

function CourseRankingCard({ ranking }: { ranking: CourseRanking }) {
    return (
        <LinearGradient
            colors={['#FFD29B', '#FCF1E4', '#FCF1E4']}
            locations={[0, 0.3, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.rankingCard}
        >
            <View style={styles.rankingHeader}>
                <View style={styles.rankingTitleRow}>
                    <Text style={styles.rankingTitle}>{ranking.title}</Text>
                    <Text style={styles.rankingTag}>{ranking.tag}</Text>
                </View>
                <Text style={styles.rankingMore}>更多 ›</Text>
            </View>

            <View style={styles.rankingList}>
                {ranking.courses.map((course) => (
                    <Pressable
                        key={course.id}
                        style={({ pressed }) => [styles.rankingItem, pressed && styles.pressed]}
                    >
                        <Image
                            source={course.image}
                            style={styles.rankingCourseImage}
                            resizeMode="cover"
                        />
                        <View style={styles.rankingCourseCopy}>
                            <Text style={styles.rankingCourseTitle} numberOfLines={1}>
                                {course.title}
                            </Text>
                            <Text style={styles.rankingCourseSchool} numberOfLines={1}>
                                {course.detail}
                            </Text>
                        </View>
                    </Pressable>
                ))}
            </View>
        </LinearGradient>
    );
}

const friendRecords = [
    {
        id: 'minbie',
        name: 'Minbie',
        detail: 'Minbie今日完成了数学闯关',
        avatar: require('@/assets/images/InGatePng/icon7.png'),
        avatarBackground: '#FFD9A8'
    },
    {
        id: 'caaary',
        name: 'Caaary',
        detail: 'Caaary今日完成了英语闯关',
        avatar: require('@/assets/images/InGatePng/icon9.png'),
        avatarBackground: '#DCECF9'
    }
];

function TrapezoidBackground({
    color,
    variant
}: {
    color: string;
    variant: TrapezoidVariant;
}) {
    const challengePath =
        'M 7 0 H 93 C 97 0 100 3 99 8 L 88 92 C 87 97 85 100 80 100 H 7 C 3 100 0 97 0 93 V 7 C 0 3 3 0 7 0 Z';
    const pointsPath =
        'M 15 0 H 93 C 97 0 100 3 100 7 V 93 C 100 97 97 100 93 100 H 8 C 3 100 0 97 1 92 L 8 8 C 9 3 11 0 15 0 Z';
    const paperPath =
        'M 7 0 H 93 C 97 0 100 3 99 8 L 92 92 C 91 97 89 100 84 100 H 7 C 3 100 0 97 0 93 V 7 C 0 3 3 0 7 0 Z';
    const mockPath =
        'M 19 0 H 93 C 97 0 100 3 100 7 V 93 C 100 97 97 100 93 100 H 8 C 3 100 0 97 1 92 L 12 8 C 13 3 15 0 19 0 Z';
    const pathByVariant: Record<TrapezoidVariant, string> = {
        challenge: challengePath,
        points: pointsPath,
        paper: paperPath,
        mock: mockPath
    };

    return (
        <Svg
            pointerEvents="none"
            style={styles.trapezoidBackground}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
        >
            <Path
                d={pathByVariant[variant]}
                fill={color}
            />
        </Svg>
    );
}

function OutlinedText({
    text,
    strokeColor,
    strokeWidth = 3,
    containerStyle,
    textStyle
}: {
    text: string;
    strokeColor: string;
    strokeWidth?: number;
    containerStyle: StyleProp<ViewStyle>;
    textStyle: StyleProp<TextStyle>;
}) {
    const diagonalOffset = Math.max(1, Math.round(strokeWidth * 0.7));
    const offsets = [
        [-strokeWidth, 0],
        [strokeWidth, 0],
        [0, -strokeWidth],
        [0, strokeWidth],
        [-diagonalOffset, -diagonalOffset],
        [diagonalOffset, -diagonalOffset],
        [-diagonalOffset, diagonalOffset],
        [diagonalOffset, diagonalOffset]
    ];

    return (
        <View pointerEvents="none" style={containerStyle}>
            {offsets.map(([x, y]) => (
                <Text
                    key={`${x}-${y}`}
                    style={[
                        textStyle,
                        styles.outlinedTextLayer,
                        {
                            color: strokeColor,
                            transform: [{ translateX: x }, { translateY: y }]
                        }
                    ]}
                >
                    {text}
                </Text>
            ))}
            <Text style={[textStyle, styles.outlinedTextLayer, styles.outlinedTextFill]}>
                {text}
            </Text>
        </View>
    );
}

function TrainingHomeContent({ interLoaded }: { interLoaded: boolean }) {
    const { width: screenWidth } = useWindowDimensions();
    const trainingBoardWidth = Math.min(400, screenWidth - 40);
    const trainingBoardHeight = trainingBoardWidth / 2;
    const boardScale = trainingBoardHeight / 180;

    return (
        <View style={styles.trainingContent}>
            <View style={[styles.trainingBoard, { height: trainingBoardHeight }]}>
                <Image
                    source={require('@/assets/images/InGatePng/icon4.png')}
                    style={styles.trainingTrophyMascot}
                    resizeMode="contain"
                />

                <Pressable
                    style={({ pressed }) => [
                        styles.trainingTile,
                        styles.challengeTile,
                        {
                            width: 195 * boardScale,
                            height: 110 * boardScale
                        },
                        pressed && styles.pressed
                    ]}
                >
                    <TrapezoidBackground color="#FF8E6F" variant="challenge" />
                    <OutlinedText
                        text="学科闯关"
                        strokeColor="#FF8361"
                        containerStyle={styles.challengeTitleGraphic}
                        textStyle={styles.challengeTitle}
                    />
                    <Text style={styles.challengeDescription}>
                        AI根据近期做题为你推荐的闯关
                    </Text>
                    <View style={styles.challengeButton}>
                        <Text style={styles.challengeButtonText}>进入</Text>
                        <Text style={styles.challengeButtonArrow}>›</Text>
                    </View>
                </Pressable>

                <Pressable
                    style={({ pressed }) => [
                        styles.trainingTile,
                        styles.pointsTile,
                        {
                            width: 160 * boardScale,
                            height: 55 * boardScale
                        },
                        pressed && styles.pressed
                    ]}
                >
                    <TrapezoidBackground color="#9FD4FF" variant="points" />
                    <OutlinedText
                        text="积分排名"
                        strokeColor="#66B7F9"
                        strokeWidth={2}
                        containerStyle={styles.pointsTitleGraphic}
                        textStyle={styles.pointsTitle}
                    />
                    <Image
                        source={require('@/assets/images/InGatePng/icon29.png')}
                        style={styles.pointsCloud}
                        resizeMode="contain"
                    />
                    <View style={styles.pointsBubbleOne} />
                    <View style={styles.pointsBubbleTwo} />
                </Pressable>

                <Pressable
                    style={({ pressed }) => [
                        styles.trainingTile,
                        styles.paperTile,
                        {
                            top: 125 * boardScale,
                            width: 160 * boardScale,
                            height: 55 * boardScale
                        },
                        pressed && styles.pressed
                    ]}
                >
                    <TrapezoidBackground color="#FFB67B" variant="paper" />
                    <Image
                        source={require('@/assets/images/InGatePng/icon14.png')}
                        style={styles.paperTileIcon}
                        resizeMode="contain"
                    />
                    <OutlinedText
                        text="智能组卷"
                        strokeColor="#FF984B"
                        strokeWidth={2}
                        containerStyle={styles.paperTitleGraphic}
                        textStyle={styles.paperTileText}
                    />
                </Pressable>

                <Pressable
                    style={({ pressed }) => [
                        styles.trainingTile,
                        styles.mockTile,
                        {
                            top: 70 * boardScale,
                            width: 195 * boardScale,
                            height: 110 * boardScale
                        },
                        pressed && styles.pressed
                    ]}
                >
                    <TrapezoidBackground color="#D08ADE" variant="mock" />
                    <Text style={styles.mockDescription}>
                        考试真题训练，智能模拟测试
                    </Text>
                    <View style={styles.mockStartButton}>
                        <Text style={styles.mockStartText}>开始</Text>
                    </View>
                    <OutlinedText
                        text="真题模拟"
                        strokeColor="#C164D4"
                        containerStyle={styles.mockTitleGraphic}
                        textStyle={[
                            styles.mockTitle,
                            interLoaded && styles.mockTitleInter
                        ]}
                    />
                </Pressable>
            </View>

            <Pressable
                style={({ pressed }) => [styles.dailyChallenge, pressed && styles.pressed]}
            >
                <LinearGradient
                    colors={['#FF7881', '#FFFA98']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.dailyChallengeGradient}
                >
                    <Image
                        source={require('@/assets/images/InGatePng/icon39.png')}
                        style={styles.dailyCheckerTop}
                        resizeMode="stretch"
                    />
                    <Image
                        source={require('@/assets/images/InGatePng/icon39.png')}
                        style={styles.dailyCheckerBottom}
                        resizeMode="stretch"
                    />
                    <Text style={styles.dailyChallengeText}>
                        翻开第一页，点亮新世界！{`\n`}今天的你，是未来的开拓者
                    </Text>
                    <View style={styles.amazingBadge}>
                        <Text style={styles.amazingBadgeText}>WOW AMAZING~</Text>
                    </View>
                    <Image
                        source={require('@/assets/images/study/小艾拿火炬 1.png')}
                        style={styles.dailyMascot}
                        resizeMode="contain"
                    />
                    <Image
                        source={require('@/assets/images/InGatePng/icon21.png')}
                        style={styles.dailyFlame}
                        resizeMode="contain"
                    />
                </LinearGradient>
            </Pressable>

            <View style={styles.trainingShortcutRow}>
                <Pressable
                    style={({ pressed }) => [
                        styles.trainingShortcut,
                        styles.sprintShortcut,
                        pressed && styles.pressed
                    ]}
                >
                    <View style={styles.shortcutTitleRow}>
                        <Text style={[styles.shortcutTitle, styles.sprintTitle]}>训练冲刺</Text>
                        <Image
                            source={require('@/assets/images/InGatePng/icon24.png')}
                            style={styles.shortcutIcon}
                            resizeMode="contain"
                        />
                    </View>
                    <View style={[styles.shortcutButton, styles.sprintButton]}>
                        <Text style={styles.shortcutButtonText}>开始</Text>
                    </View>
                </Pressable>

                <Pressable
                    style={({ pressed }) => [
                        styles.trainingShortcut,
                        styles.summaryShortcut,
                        pressed && styles.pressed
                    ]}
                >
                    <View style={styles.shortcutTitleRow}>
                        <Text style={[styles.shortcutTitle, styles.summaryTitle]}>归纳推荐</Text>
                        <Image
                            source={require('@/assets/images/InGatePng/icon18.png')}
                            style={styles.shortcutIcon}
                            resizeMode="contain"
                        />
                    </View>
                    <View style={[styles.shortcutButton, styles.summaryButton]}>
                        <Text style={styles.shortcutButtonText}>查看</Text>
                    </View>
                </Pressable>
            </View>

            <Text style={styles.friendSectionTitle}>好友学习记录</Text>
            <View style={styles.friendList}>
                {friendRecords.map((friend) => (
                    <Pressable
                        key={friend.id}
                        style={({ pressed }) => [styles.friendCard, pressed && styles.pressed]}
                    >
                        <View
                            style={[
                                styles.friendAvatarRing,
                                { backgroundColor: friend.avatarBackground }
                            ]}
                        >
                            <Image
                                source={friend.avatar}
                                style={styles.friendAvatar}
                                resizeMode="contain"
                            />
                        </View>
                        <View style={styles.friendCopy}>
                            <Text style={styles.friendName}>{friend.name}</Text>
                            <Text style={styles.friendDetail}>{friend.detail}</Text>
                        </View>
                    </Pressable>
                ))}
            </View>
        </View>
    );
}

export default function StudyScreen() {
    const router = useRouter();
    const [mode, setMode] = useState<StudyMode>('training');
    const [fontsLoaded] = useFonts({ Inter_800ExtraBold });
    const [checkInVisible, setCheckInVisible] = useState(false);
    const [checkInLoading, setCheckInLoading] = useState(false);
    const [checkInSummary, setCheckInSummary] = useState<StudyCheckInSummary | null>(null);
    const [todayTaskDashboard, setTodayTaskDashboard] = useState<TodayTaskDashboard | null>(null);
    const [examPlan, setExamPlan] = useState<ExamPlan | null>(null);
    const pendingTasks = todayTaskDashboard?.pendingTasks ?? [];
    const completedTasks = todayTaskDashboard?.completedTasks ?? [];
    const displayedTasks = [...pendingTasks, ...completedTasks].slice(0, 3);
    const totalTaskCount = pendingTasks.length + completedTasks.length;
    const taskProgress = totalTaskCount
        ? Math.round((completedTasks.length / totalTaskCount) * 100)
        : 0;

    useFocusEffect(
        useCallback(() => {
            let active = true;
            Promise.allSettled([
                getTodayTaskDashboard(),
                getLatestExamPlan()
            ]).then(([dashboardResult, planResult]) => {
                if (!active) return;
                setTodayTaskDashboard(
                    dashboardResult.status === 'fulfilled' ? dashboardResult.value : null
                );
                setExamPlan(planResult.status === 'fulfilled' ? planResult.value : null);
            });
            return () => {
                active = false;
            };
        }, [])
    );

    async function handleCheckIn() {
        if (checkInLoading) return;

        setCheckInLoading(true);
        try {
            const result = await checkInToday();
            setCheckInSummary(result);
            setCheckInVisible(true);
        } catch (error) {
            Alert.alert(
                '打卡失败',
                error instanceof Error ? error.message : '请稍后重试'
            );
        } finally {
            setCheckInLoading(false);
        }
    }

    return (
        <View style={styles.screen}>
            <Image
                source={require('@/assets/images/study/bgc1.png')}
                style={styles.backgroundImage}
                resizeMode="cover"
            />

            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.scrollContent}
                >
                    <View style={styles.modeTabs}>
                        <Pressable
                            style={styles.modeTab}
                            onPress={() => setMode('video')}
                        >
                            <Text
                                style={[
                                    styles.modeText,
                                    mode === 'video' && styles.modeTextActive
                                ]}
                            >
                                视频
                            </Text>
                            {mode === 'video' && <View style={styles.modeUnderline} />}
                        </Pressable>
                        <Pressable
                            style={styles.modeTab}
                            onPress={() => setMode('training')}
                        >
                            <Text
                                style={[
                                    styles.modeText,
                                    mode === 'training' && styles.modeTextActive
                                ]}
                            >
                                训练
                            </Text>
                            {mode === 'training' && <View style={styles.modeUnderline} />}
                        </Pressable>
                    </View>

                    {mode === 'training' ? (
                        <TrainingHomeContent interLoaded={fontsLoaded} />
                    ) : (
                        <>
                    <View style={styles.searchRow}>
                        <View style={styles.searchBox}>
                            <Image
                                source={require('@/assets/images/study/icon43.png')}
                                style={styles.searchIcon}
                            />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="搜索"
                                placeholderTextColor="#B98B4B"
                                selectionColor="#F5A027"
                            />
                        </View>
                        <Image
                            source={require('@/assets/images/study/icon2.png')}
                            style={styles.searchMascot}
                            resizeMode="contain"
                        />
                    </View>

                    <View style={styles.goalPanel}>
                        <View style={styles.goalHeaderRow}>
                            <View style={styles.goalTitleRow}>
                                <Text style={styles.goalTitle}>
                                    我的学习目标
                                </Text>
                                <Text style={styles.goalSetting}>
                                    目标设定 ›
                                </Text>
                            </View>
                            <Pressable
                                accessibilityLabel="查看我的学习日历"
                                accessibilityRole="button"
                                hitSlop={8}
                                onPress={() => router.push('/study-calendar')}
                                style={({ pressed }) => [
                                    styles.calendarLink,
                                    pressed && styles.pressed
                                ]}
                            >
                                <Text style={styles.calendarLinkText}>
                                    查看我的学习日历 ›
                                </Text>
                            </Pressable>
                        </View>
                        <Text style={styles.goalHint}>
                            打卡代表你完成了相关目标的学习哦~
                        </Text>

                        <View style={styles.goalColumns}>
                            <Pressable
                                accessibilityLabel="打开今日任务"
                                onPress={() => router.push('/today-tasks')}
                                style={({ pressed }) => [
                                    styles.taskCard,
                                    pressed && styles.pressed
                                ]}
                            >
                                <View style={styles.cardTopRow}>
                                    <Text style={styles.cardTitle}>
                                        今日任务
                                    </Text>
                                    <Text style={styles.cardSetting}>
                                        设置 ›
                                    </Text>
                                </View>
                                {displayedTasks.length > 0 ? (
                                    <View style={styles.taskListContent}>
                                        <View style={styles.taskList}>
                                            {displayedTasks.map((task, index) => (
                                                <View key={task.id} style={styles.taskListItem}>
                                                    <Text
                                                        style={[
                                                            styles.taskListText,
                                                            task.completed && styles.taskListTextCompleted
                                                        ]}
                                                        numberOfLines={1}
                                                    >
                                                        {index + 1}.{task.title}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                        <View style={styles.taskProgressFooter}>
                                            <Text style={styles.taskProgressLabel}>
                                                完成进度{taskProgress}%
                                            </Text>
                                            <View style={styles.taskProgressTrack}>
                                                <View
                                                    style={[
                                                        styles.taskProgressFill,
                                                        { width: `${taskProgress}%` }
                                                    ]}
                                                />
                                            </View>
                                        </View>
                                    </View>
                                ) : (
                                    <>
                                        <Image
                                            source={require('@/assets/images/study/icon42.png')}
                                            style={styles.taskMascot}
                                            resizeMode="contain"
                                        />
                                        <Text style={styles.emptyTitle}>
                                            当前没有任务
                                        </Text>
                                        <Text style={styles.emptyHint}>
                                            快来设置今天的任务吧~
                                        </Text>
                                    </>
                                )}
                            </Pressable>

                            <View style={styles.targetCard}>
                                {examPlan ? (
                                    <>
                                        <View style={styles.targetTabs}>
                                            <View style={styles.targetTabActive}>
                                                <Text style={styles.targetTabActiveText}>考试</Text>
                                            </View>
                                            <Text style={styles.targetSubject} numberOfLines={1}>
                                                {examPlan.subject}
                                            </Text>
                                        </View>
                                        <View style={styles.targetPlanContent}>
                                            <View style={styles.targetDaysRow}>
                                                <Text style={styles.targetDays}>{examPlan.remainingDays}</Text>
                                                <Text style={styles.targetDaysUnit}>天</Text>
                                            </View>
                                            <Text style={styles.targetDate}>
                                                目标日:{examPlan.examDate}
                                            </Text>
                                            <View style={styles.targetPlanProgressTrack}>
                                                <View
                                                    style={[
                                                        styles.targetPlanProgressFill,
                                                        { width: `${examPlan.progressPercent}%` }
                                                    ]}
                                                />
                                            </View>
                                        </View>
                                    </>
                                ) : (
                                    <>
                                        <View style={styles.targetIllustration}>
                                            <View style={styles.targetProgress} />
                                        </View>
                                        <Text style={styles.targetEmptyTitle}>
                                            当前没有目标
                                        </Text>
                                        <Text style={styles.targetEmptyHint}>
                                            快来设置你的目标吧~
                                        </Text>
                                    </>
                                )}
                                <Pressable
                                    disabled={checkInLoading}
                                    onPress={handleCheckIn}
                                    style={({ pressed }) => [
                                        styles.checkInButton,
                                        pressed && styles.pressed,
                                        checkInLoading && styles.checkInButtonDisabled
                                    ]}
                                >
                                    {checkInLoading ? (
                                        <ActivityIndicator color="#FFFFFF" size="small" />
                                    ) : (
                                        <Text style={styles.checkInText}>
                                            去打卡
                                        </Text>
                                    )}
                                </Pressable>
                            </View>
                        </View>
                    </View>

                    <View style={styles.quickRow}>
                        {quickActions.map((action) => (
                            <QuickActionCard key={action.id} action={action} />
                        ))}
                    </View>

                    <SectionTitle title="视频推荐" />
                    <View style={styles.videoGrid}>
                        {videoItems.map((item) => (
                            <VideoCard key={item.id} item={item} />
                        ))}
                    </View>

                    <SectionTitle title="本周课程排行" more={false} />
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.rankingsRow}
                    >
                        {courseRankings.map((ranking) => (
                            <CourseRankingCard key={ranking.id} ranking={ranking} />
                        ))}
                    </ScrollView>

                    <SectionTitle title="精品课程" more={false} />
                    <Pressable
                        style={({ pressed }) => [
                            styles.featuredCard,
                            pressed && styles.pressed
                        ]}
                    >
                        <Image
                            source={require('@/assets/images/study/course4.png')}
                            style={styles.featuredImage}
                            resizeMode="cover"
                        />
                        <View style={styles.featuredCopy}>
                            <Text style={styles.featuredTitle}>
                                美食美课
                            </Text>
                            <Text style={styles.featuredSubtitle}>
                                山东大学 谢锡文
                            </Text>
                        </View>
                    </Pressable>
                        </>
                    )}
                </ScrollView>
            </SafeAreaView>
            <StudyCheckInModal
                visible={checkInVisible}
                summary={checkInSummary}
                onClose={() => setCheckInVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#FFF7EF'
    },
    backgroundImage: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        width: '100%',
        height: '100%'
    },
    safeArea: {
        flex: 1
    },
    scrollContent: {
        width: '100%',
        maxWidth: 440,
        alignSelf: 'center',
        paddingHorizontal: 20,
        paddingTop: 109,
        paddingBottom: 124
    },
    modeTabs: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 24,
        top: -40
    },
    modeTab: {
        minHeight: 36,
        alignItems: 'center',
    },
    modeText: {
        color: '#2D241D',
        fontSize: 20,
        lineHeight: 26,
    },
    modeTextActive: {
        fontWeight: '700'
    },
    modeUnderline: {
        width: 30,
        height: 3,
        marginTop: 2,
        borderRadius: 2,
        backgroundColor: '#2D241D'
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: -16,
        marginBottom: 12
    },
    searchBox: {
        flex: 1,
        height: 42,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 13,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.88)'
    },
    searchIcon: {
        width: 19,
        height: 19,
        marginRight: 9
    },
    searchInput: {
        flex: 1,
        height: 42,
        paddingVertical: 0,
        color: '#5C4332',
        fontSize: 15
    },
    searchMascot: {
        width: 50,
        height: 50,
        marginLeft: 5
    },
    goalPanel: {
        height: 250,
        padding: 10,
        borderRadius: 16,
        backgroundColor: '#FFD29B',
        boxShadow: '0 7px 16px rgba(207, 140, 65, 0.14)'
    },
    goalHeaderRow: {
        gap: 5
    },
    goalTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    goalTitle: {
        color: '#000000',
        fontSize: 16,
        fontWeight: '300'
    },
    goalSetting: {
        color: '#7A3C10',
        fontSize: 12
    },
    calendarLink: {
        position: 'absolute',
        right: -4,
        top: 18,
        zIndex: 3,
        minWidth: 130,
        height: 32,
        alignItems: 'flex-end',
        justifyContent: 'center'
    },
    calendarLinkText: {
        color: '#7A3C10',
        fontSize: 11
    },
    goalHint: {
        marginTop: 6,
        color: '#C4711E',
        fontSize: 11
    },
    goalColumns: {
        flex: 1,
        flexDirection: 'row',
        gap: 10,
        marginTop: 8
    },
    taskCard: {
        flex: 1,
        padding: 10,
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.93)'
    },
    targetCard: {
        flex: 1,
        paddingBottom: 10,
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.84)',
        overflow: 'hidden'
    },
    cardTopRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    cardTitle: {
        color: '#5E4330',
        fontSize: 14
    },
    cardSetting: {
        color: '#A58A73',
        fontSize: 12
    },
    taskMascot: {
        width: 58,
        height: 58,
        marginTop: 9,
        marginBottom: 2
    },
    emptyTitle: {
        color: '#98712E',
        fontSize: 14,
        textAlign: 'center'
    },
    emptyHint: {
        marginTop: 4,
        color: '#A47A35',
        fontSize: 14,
        textAlign: 'center'
    },
    taskListContent: {
        flex: 1,
        width: '100%',
        justifyContent: 'space-between',
        paddingTop: 7
    },
    taskList: {
        gap: 6
    },
    taskListItem: {
        minHeight: 24,
        justifyContent: 'center',
        paddingHorizontal: 10,
        borderRadius: 12,
        backgroundColor: '#E6F4FF'
    },
    taskListText: {
        color: '#34495A',
        fontSize: 11
    },
    taskListTextCompleted: {
        color: '#9B9B9B',
        textDecorationLine: 'line-through'
    },
    taskProgressFooter: {
        gap: 4
    },
    taskProgressLabel: {
        color: '#A58A73',
        fontSize: 9
    },
    taskProgressTrack: {
        height: 7,
        overflow: 'hidden',
        borderRadius: 4,
        backgroundColor: '#D7C8B8'
    },
    taskProgressFill: {
        height: '100%',
        borderRadius: 4,
        backgroundColor: '#F59A24'
    },
    targetIllustration: {
        width: '100%',
        height: 38,
        backgroundColor: '#FFE7CD',
        overflow: 'hidden'
    },
    targetProgress: {
        width: '50%',
        height: '100%',
        borderTopRightRadius: 16,
        backgroundColor: '#F59622'
    },
    targetTabs: {
        width: '100%',
        height: 38,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFE7CD'
    },
    targetTabActive: {
        width: '50%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        borderTopRightRadius: 16,
        backgroundColor: '#F59622'
    },
    targetTabActiveText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600'
    },
    targetSubject: {
        flex: 1,
        paddingHorizontal: 7,
        color: '#553A29',
        fontSize: 11,
        textAlign: 'center'
    },
    targetPlanContent: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center'
    },
    targetDaysRow: {
        flexDirection: 'row',
        alignItems: 'flex-end'
    },
    targetDays: {
        color: '#5C2E13',
        fontSize: 42,
        lineHeight: 45,
        fontWeight: '600'
    },
    targetDaysUnit: {
        marginBottom: 5,
        marginLeft: 4,
        color: '#5C2E13',
        fontSize: 14
    },
    targetDate: {
        marginTop: 2,
        color: '#B2A69B',
        fontSize: 9
    },
    targetPlanProgressTrack: {
        width: '72%',
        height: 4,
        marginTop: 6,
        overflow: 'hidden',
        borderRadius: 2,
        backgroundColor: '#F1D7B8'
    },
    targetPlanProgressFill: {
        height: '100%',
        borderRadius: 2,
        backgroundColor: '#F59622'
    },
    targetEmptyTitle: {
        marginTop: 34,
        color: '#B06509',
        fontSize: 14,
        lineHeight: 21,
        textAlign: 'center'
    },
    targetEmptyHint: {
        marginTop: 2,
        color: '#B06509',
        fontSize: 14,
        lineHeight: 19,
        textAlign: 'center'
    },
    checkInButton: {
        width: '86%',
        height: 42,
        marginTop: 'auto',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 22,
        backgroundColor: '#FF9F20',
        boxShadow: '0 4px 8px rgba(202, 119, 24, 0.22)'
    },
    checkInText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600'
    },
    checkInButtonDisabled: {
        opacity: 0.65
    },
    quickRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 14
    },
    quickCard: {
        flex: 1,
        height: 118,
        paddingTop: 12,
        alignItems: 'center',
        borderRadius: 24,
        overflow: 'hidden'
    },
    quickTitle: {
        zIndex: 2,
        color: '#3C3129',
        fontSize: 15,
        fontWeight: '600'
    },
    quickImage: {
        position: 'absolute',
        zIndex: 2
    },
    bookQuickImage: {
        right: 0,
        bottom: -5,
        width: 68,
        height: 68
    },
    courseQuickImage: {
        left: '50%',
        bottom: -5,
        width: 74,
        height: 74,
        transform: [{ translateX: -37 }]
    },
    summaryQuickImage: {
        left: '50%',
        bottom: -5,
        width: 70,
        height: 70,
        transform: [{ translateX: -35 }]
    },
    quickBadge: {
        position: 'absolute',
        top: 11,
        left: 9,
        zIndex: 1,
        width: 43,
        height: 52
    },
    quickWaves: {
        position: 'absolute',
        left: -8,
        bottom: -2,
        zIndex: 0,
        width: '115%',
        height: 46,
        transform: [{ rotate: '-3deg' }]
    },
    sectionTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 10
    },
    sectionTitle: {
        zIndex: 1,
        color: '#2B231D',
        fontSize: 18,
        fontWeight: '700'
    },
    sectionAccent: {
        position: 'absolute',
        left: 0,
        right: -6,
        bottom: 0,
        height: 7,
        borderRadius: 5,
        backgroundColor: '#F9C26D'
    },
    moreText: {
        color: '#332A23',
        fontSize: 13
    },
    videoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 12
    },
    videoCard: {
        width: '48.5%',
        borderRadius: 11,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        boxShadow: '0 5px 12px rgba(75, 52, 33, 0.10)'
    },
    videoCover: {
        height: 148,
        justifyContent: 'flex-end'
    },
    videoCoverImage: {
        borderTopLeftRadius: 11,
        borderTopRightRadius: 11
    },
    videoCaption: {
        paddingHorizontal: 9,
        paddingTop: 20,
        paddingBottom: 7
    },
    videoTitle: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600'
    },
    videoSchool: {
        marginTop: 2,
        color: 'rgba(255, 255, 255, 0.85)',
        fontSize: 12
    },
    videoStats: {
        height: 32,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 9
    },
    videoStat: {
        color: '#6F655D',
        fontSize: 10
    },
    rankingsRow: {
        gap: 16,
        paddingRight: 20,
        paddingBottom: 4
    },
    rankingCard: {
        width: 320,
        height: 210,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 4px 10px rgba(116, 73, 38, 0.08)'
    },
    rankingHeader: {
        height: 28,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rankingTitleRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 10
    },
    rankingTitle: {
        color: '#2F261F',
        fontSize: 17,
        fontWeight: '500'
    },
    rankingTag: {
        color: '#3F352D',
        fontSize: 12
    },
    rankingMore: {
        color: '#3F352D',
        fontSize: 12
    },
    rankingList: {
        flex: 1,
        gap: 5,
        marginTop: 4
    },
    rankingItem: {
        flex: 1,
        minHeight: 50,
        flexDirection: 'row',
        alignItems: 'center'
    },
    rankingCourseImage: {
        width: 74,
        height: 45,
        borderRadius: 11,
        backgroundColor: '#FFFFFF'
    },
    rankingCourseCopy: {
        flex: 1,
        marginLeft: 10
    },
    rankingCourseTitle: {
        color: '#382C24',
        fontSize: 13,
        lineHeight: 18
    },
    rankingCourseSchool: {
        marginTop: 2,
        color: '#B77A52',
        fontSize: 11,
        lineHeight: 15
    },
    featuredCard: {
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        boxShadow: '0 5px 12px rgba(75, 52, 33, 0.10)'
    },
    featuredImage: {
        width: '100%',
        aspectRatio: 362 / 165
    },
    featuredCopy: {
        paddingHorizontal: 13,
        paddingVertical: 11
    },
    featuredTitle: {
        color: '#352B23',
        fontSize: 15,
        fontWeight: '700'
    },
    featuredSubtitle: {
        marginTop: 4,
        color: '#8B7564',
        fontSize: 11
    },
    trainingContent: {
        marginTop: -16
    },
    trainingBoard: {
        position: 'relative',
        width: '100%',
        height: 174
    },
    trainingTile: {
        position: 'absolute',
        overflow: 'visible',
        borderRadius: 12
    },
    trapezoidBackground: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        width: '100%',
        height: '100%'
    },
    trainingTrophyMascot: {
        position: 'absolute',
        top: -50,
        right: 70,
        zIndex: 10,
        width: 58,
        height: 58
    },
    challengeTile: {
        top: 0,
        left: 0,
        zIndex: 2,
        width: '56%',
        height: 104
    },
    outlinedTextLayer: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%'
    },
    outlinedTextFill: {
        color: '#FFFFFF'
    },
    challengeTitleGraphic: {
        position: 'absolute',
        top: -20,
        left: 12,
        zIndex: 5,
        width: 160,
        height: 40
    },
    challengeTitle: {
        fontSize: 22,
        lineHeight: 36,
        fontWeight: '900',
        letterSpacing: -1
    },
    challengeDescription: {
        position: 'absolute',
        top: 22,
        left: 13,
        width: '84%',
        color: '#FFFFFF',
        fontSize: 14,
        lineHeight: 20
    },
    challengeButton: {
        position: 'absolute',
        left: 15,
        bottom: 19,
        width: 66,
        height: 25,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 13,
        backgroundColor: '#CFEFFF'
    },
    challengeButtonText: {
        color: '#FF7163',
        fontSize: 16,
        fontWeight: '700'
    },
    challengeButtonArrow: {
        marginLeft: 4,
        color: '#FF7163',
        fontSize: 18,
        lineHeight: 18
    },
    pointsTile: {
        top: 0,
        right: 0,
        width: '48%',
        height: 52,
        paddingHorizontal: 0,
        paddingTop: 0
    },
    pointsTitle: {
        fontSize: 20,
        lineHeight: 28,
        fontWeight: '800',
        letterSpacing: -0.5
    },
    pointsTitleGraphic: {
        position: 'absolute',
        top: 6,
        left: 29,
        zIndex: 5,
        width: 125,
        height: 31
    },
    pointsCloud: {
        position: 'absolute',
        left: -5,
        bottom: -4,
        width: 52,
        height: 36
    },
    pointsBubbleOne: {
        position: 'absolute',
        right: 18,
        top: -5,
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(132, 190, 240, 0.25)'
    },
    pointsBubbleTwo: {
        position: 'absolute',
        right: -4,
        bottom: -9,
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(132, 190, 240, 0.22)'
    },
    paperTile: {
        top: 112,
        left: 0,
        width: '47%',
        height: 52,
        flexDirection: 'row',
        alignItems: 'center'
    },
    paperTileIcon: {
        width: 38,
        height: 38,
        marginLeft: 8,
        marginRight: 6
    },
    paperTitleGraphic: {
        width: 100,
        height: 31
    },
    paperTileText: {
        fontSize: 18,
        lineHeight: 27,
        fontWeight: '800'
    },
    mockTile: {
        top: 60,
        right: 0,
        zIndex: 3,
        width: '55%',
        height: 104,
        padding: 0
    },
    mockDescription: {
        position: 'absolute',
        top: 18,
        left: 37,
        width: '72%',
        color: '#FFFFFF',
        fontSize: 14,
        lineHeight: 21
    },
    mockStartButton: {
        position: 'absolute',
        right: 20,
        bottom: 42,
        width: 76,
        height: 31,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 14,
        backgroundColor: '#FFF5D4'
    },
    mockStartText: {
        color: '#C96CDB',
        fontSize: 16,
        fontWeight: '700'
    },
    mockTitleGraphic: {
        position: 'absolute',
        right: -24,
        bottom: 0,
        zIndex: 5,
        width: 158,
        height: 20
    },
    mockTitle: {
        fontSize: 23,
        lineHeight: 36,
        fontWeight: '800',
        textAlign: 'center'
    },
    mockTitleInter: {
        fontFamily: 'Inter_800ExtraBold'
    },
    dailyChallenge: {
        height: 130,
        marginTop: 20,
        borderRadius: 13,
        overflow: 'hidden',
        boxShadow: '0 5px 12px rgba(180, 83, 57, 0.12)'
    },
    dailyChallengeGradient: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 20
    },
    dailyChallengeText: {
        zIndex: 3,
        width: '66%',
        color: '#FFFFFF',
        fontSize: 12,
        lineHeight: 18,
        fontWeight: '700'
    },
    amazingBadge: {
        zIndex: 3,
        width: 142,
        height: 22,
        marginTop: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: '#8F471E'
    },
    amazingBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800'
    },
    dailyCheckerTop: {
        position: 'absolute',
        top: 7,
        right: 4,
        width: 102,
        height: 11,
        opacity: 0.95
    },
    dailyCheckerBottom: {
        position: 'absolute',
        left: 0,
        bottom: 3,
        width: 103,
        height: 11,
        opacity: 0.95
    },
    dailyMascot: {
        position: 'absolute',
        left: '52.8%',
        top: 10,
        zIndex: 2,
        width: 118,
        height: 118
    },
    dailyFlame: {
        position: 'absolute',
        right: -4,
        bottom: -8,
        zIndex: 1,
        width: 78,
        height: 104,
        opacity: 1
    },
    trainingShortcutRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 20
    },
    trainingShortcut: {
        flex: 1,
        height: 68,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 17,
        overflow: 'hidden'
    },
    sprintShortcut: {
        backgroundColor: '#E2F8C9'
    },
    summaryShortcut: {
        backgroundColor: '#FFE0B7'
    },
    shortcutTitleRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    shortcutTitle: {
        fontSize: 16,
        fontWeight: '800'
    },
    sprintTitle: {
        color: '#8EB84E'
    },
    summaryTitle: {
        color: '#E87B3D'
    },
    shortcutIcon: {
        width: 20,
        height: 20,
        marginLeft: 5,
        opacity: 0.72
    },
    shortcutButton: {
        width: 54,
        height: 21,
        marginTop: 5,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 11
    },
    sprintButton: {
        backgroundColor: '#9CC94C'
    },
    summaryButton: {
        backgroundColor: '#F29B5A'
    },
    shortcutButtonText: {
        color: '#FFE7CD',
        fontSize: 11,
        fontWeight: '600'
    },
    friendSectionTitle: {
        marginTop: 18,
        marginBottom: 9,
        color: '#241F1B',
        fontSize: 15,
        fontWeight: '500'
    },
    friendList: {
        gap: 10
    },
    friendCard: {
        height: 74,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 9,
        borderTopLeftRadius: 37,
        borderBottomLeftRadius: 37,
        borderTopRightRadius: 13,
        borderBottomRightRadius: 13,
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        boxShadow: '0 4px 11px rgba(100, 68, 40, 0.07)'
    },
    friendAvatarRing: {
        width: 58,
        height: 58,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 29
    },
    friendAvatar: {
        width: 51,
        height: 51
    },
    friendCopy: {
        flex: 1,
        marginLeft: 12
    },
    friendName: {
        color: '#231F1B',
        fontSize: 13,
        fontWeight: '600'
    },
    friendDetail: {
        marginTop: 8,
        color: '#B66128',
        fontSize: 11
    },
    pressed: {
        opacity: 0.72,
        transform: [{ scale: 0.985 }]
    }
});
