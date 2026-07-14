import { LinearGradient } from 'expo-linear-gradient';
import type { ImageSourcePropType } from 'react-native';
import {
    Image,
    ImageBackground,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

function QuickActionCard({ action }: { action: QuickAction }) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.quickCard,
                { backgroundColor: action.color },
                pressed && styles.pressed
            ]}
        >
            <Text
                pointerEvents="none"
                style={[styles.quickWave, styles.quickWaveOne, { color: action.stripeColor }]}
            >
                ～～
            </Text>
            <Text
                pointerEvents="none"
                style={[styles.quickWave, styles.quickWaveTwo, { color: action.stripeColor }]}
            >
                ～～
            </Text>
            <Text
                pointerEvents="none"
                style={[styles.quickWave, styles.quickWaveThree, { color: action.stripeColor }]}
            >
                ～～
            </Text>
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
        <View style={styles.rankingCard}>
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
        </View>
    );
}

export default function StudyScreen() {
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
                        <Pressable style={styles.modeTab}>
                            <Text
                                style={[styles.modeText, styles.modeTextActive]}
                            >
                                视频
                            </Text>
                            <View style={styles.modeUnderline} />
                        </Pressable>
                        <Pressable style={styles.modeTab}>
                            <Text style={styles.modeText}>训练</Text>
                        </Pressable>
                    </View>

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
                            <Text style={styles.calendarLink}>
                                查看我的学习日历 ›
                            </Text>
                        </View>
                        <Text style={styles.goalHint}>
                            打卡代表你完成了相关目标的学习哦~
                        </Text>

                        <View style={styles.goalColumns}>
                            <View style={styles.taskCard}>
                                <View style={styles.cardTopRow}>
                                    <Text style={styles.cardTitle}>
                                        今日任务
                                    </Text>
                                    <Text style={styles.cardSetting}>
                                        设置 ›
                                    </Text>
                                </View>
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
                            </View>

                            <View style={styles.targetCard}>
                                <View style={styles.targetIllustration}>
                                    <View style={styles.targetProgress} />
                                </View>
                                <Text style={styles.targetEmptyTitle}>
                                    当前没有目标
                                </Text>
                                <Text style={styles.targetEmptyHint}>
                                    快来设置你的目标吧~
                                </Text>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.checkInButton,
                                        pressed && styles.pressed
                                    ]}
                                >
                                    <Text style={styles.checkInText}>
                                        去打卡
                                    </Text>
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
                </ScrollView>
            </SafeAreaView>
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
        paddingTop: 8,
        paddingBottom: 124
    },
    modeTabs: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 24
    },
    modeTab: {
        minHeight: 36,
        alignItems: 'center'
    },
    modeText: {
        color: '#2D241D',
        fontSize: 20,
        lineHeight: 26
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
        marginTop: 8,
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
        right: 0,
        top: 25,
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
        right: -4,
        bottom: -8,
        width: 78,
        height: 78
    },
    courseQuickImage: {
        left: '50%',
        bottom: -7,
        width: 84,
        height: 84,
        transform: [{ translateX: -42 }]
    },
    summaryQuickImage: {
        left: '50%',
        bottom: -7,
        width: 78,
        height: 78,
        transform: [{ translateX: -39 }]
    },
    quickBadge: {
        position: 'absolute',
        top: 11,
        left: 9,
        zIndex: 1,
        width: 43,
        height: 52
    },
    quickWave: {
        position: 'absolute',
        right: -14,
        left: -14,
        zIndex: 0,
        fontSize: 42,
        lineHeight: 42,
        fontWeight: '900',
        letterSpacing: 10,
        textAlign: 'center',
        opacity: 1,
        transform: [{ scaleX: 1.25 }, { scaleY: 0.5 }, { rotate: '-3deg' }]
    },
    quickWaveOne: {
        bottom: -11
    },
    quickWaveTwo: {
        bottom: 0
    },
    quickWaveThree: {
        bottom: 11
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
        paddingBottom: 7,
        backgroundColor: 'rgba(31, 26, 22, 0.60)'
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
        backgroundColor: '#FFE7CD',
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
    pressed: {
        opacity: 0.72,
        transform: [{ scale: 0.985 }]
    }
});
