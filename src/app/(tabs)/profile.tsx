import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Ellipse,
  Line,
  Path,
  Rect,
  Text as SvgText,
} from 'react-native-svg';

import { getAccountAvatarSource } from '@/lib/account-avatar';
import { getCurrentUser } from '@/lib/auth-api';
import {
  clearAuthSession,
  getAuthSession,
  type AuthSession,
} from '@/lib/auth-session';
import {
  getStudyCheckInSummary,
  type StudyCheckInSummary,
} from '@/lib/study-check-in-api';
import {
  getTodayTaskDashboard,
  type TodayTaskDashboard,
} from '@/lib/today-task-api';

const DESIGN_WIDTH = 402;
const PAGE_BACKGROUND = '#FCF1E4';
const ACCENT = '#B35C20';

type IconName =
  | 'bookmark'
  | 'settings'
  | 'user'
  | 'star'
  | 'close'
  | 'book'
  | 'puzzle'
  | 'coins'
  | 'cv'
  | 'share'
  | 'help'
  | 'award'
  | 'video';

type HistoryItem = {
  title: string;
  detail: string;
  progress: number;
};

const courseHistory: HistoryItem[] = [
  { title: '英语影视欣赏', detail: '进度0/9 | 用时1min | 8月14日', progress: 0.08 },
  { title: '智能交互技术', detail: '进度0/9 | 用时1min | 8月14日', progress: 0.1 },
  { title: '环境设计', detail: '进度4/9 | 用时19min | 8月11日', progress: 0.45 },
];

const videoHistory: HistoryItem[] = [
  { title: '英语影视赏析', detail: '进度4/9 | 用时12min | 8月14日', progress: 0.62 },
  { title: '智能交互技术', detail: '进度9/9 | 用时24min | 8月13日', progress: 1 },
  { title: '26众和法硕', detail: '进度4/9 | 用时16min | 8月11日', progress: 0.5 },
];

type Shortcut = {
  label: string;
  icon?: IconName;
  image?: ImageSourcePropType;
  route?: '/persona';
};

const shortcuts: Shortcut[] = [
  {
    label: '人物画像',
    image: require('@/assets/images/fastuse/icon30.png'),
    route: '/persona',
  },
  { label: '我的收藏', icon: 'star' },
  { label: '错题库', icon: 'close' },
  {
    label: '知识归纳',
    image: require('@/assets/images/fastuse/icon27.png'),
  },
];

const commonActions: { label: string; image: ImageSourcePropType }[] = [
  {
    label: '任务中心',
    image: require('@/assets/images/fastuse/任务中心.png'),
  },
  {
    label: '积分兑换',
    image: require('@/assets/images/fastuse/积分兑换.png'),
  },
  {
    label: '我的简历',
    image: require('@/assets/images/fastuse/我的简历.png'),
  },
  {
    label: '分享APP',
    image: require('@/assets/images/fastuse/分享APP.png'),
  },
  {
    label: '帮助与反馈',
    image: require('@/assets/images/fastuse/帮助与反馈.png'),
  },
];

function LineIcon({
  name,
  size = 24,
  color = ACCENT,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const lineProps = {
    fill: 'none',
    stroke: color,
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'bookmark' ? <Path d="M6 3h12v18l-6-4-6 4V3Z" {...lineProps} /> : null}
      {name === 'settings' ? (
        <>
          <Circle cx="12" cy="12" r="3" {...lineProps} />
          <Path
            d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.14.38.36.72.65 1 .3.27.68.4 1.08.4H21v4h-.09a1.7 1.7 0 0 0-1.51.6Z"
            {...lineProps}
          />
        </>
      ) : null}
      {name === 'user' ? (
        <>
          <Circle cx="12" cy="8" r="4" {...lineProps} />
          <Path d="M4.5 21c.5-4.2 3-6.5 7.5-6.5s7 2.3 7.5 6.5" {...lineProps} />
        </>
      ) : null}
      {name === 'star' ? (
        <Path d="m12 2.8 2.8 5.7 6.3.9-4.6 4.4 1.1 6.3-5.6-3-5.6 3 1.1-6.3-4.6-4.4 6.3-.9L12 2.8Z" {...lineProps} />
      ) : null}
      {name === 'close' ? (
        <>
          <Circle cx="12" cy="12" r="9" {...lineProps} />
          <Line x1="8.5" y1="8.5" x2="15.5" y2="15.5" {...lineProps} />
          <Line x1="15.5" y1="8.5" x2="8.5" y2="15.5" {...lineProps} />
        </>
      ) : null}
      {name === 'book' ? (
        <>
          <Path d="M5 3h11a2 2 0 0 1 2 2v16H6a2 2 0 0 1-2-2V4a1 1 0 0 1 1-1Z" {...lineProps} />
          <Path d="M8 3v7l2-1.5 2 1.5V3M4 18.5c0-1.1.9-2 2-2h12" {...lineProps} />
        </>
      ) : null}
      {name === 'puzzle' ? (
        <Path d="M8.5 3H4a1 1 0 0 0-1 1v4.5a2.5 2.5 0 1 1 0 5V20a1 1 0 0 0 1 1h4.5a2.5 2.5 0 1 1 5 0H20a1 1 0 0 0 1-1v-6.5a2.5 2.5 0 1 1 0-5V4a1 1 0 0 0-1-1h-6.5a2.5 2.5 0 1 1-5 0Z" {...lineProps} />
      ) : null}
      {name === 'coins' ? (
        <>
          <Ellipse cx="12" cy="5.5" rx="6.5" ry="2.8" {...lineProps} />
          <Path d="M5.5 5.5v4c0 1.5 2.9 2.8 6.5 2.8s6.5-1.3 6.5-2.8v-4M5.5 10v4c0 1.5 2.9 2.8 6.5 2.8s6.5-1.3 6.5-2.8v-4M5.5 14.5v4c0 1.5 2.9 2.8 6.5 2.8s6.5-1.3 6.5-2.8v-4" {...lineProps} />
        </>
      ) : null}
      {name === 'cv' ? (
        <>
          <Rect x="5" y="2.5" width="14" height="19" rx="2" {...lineProps} />
          <Path d="M9 2.5v4h6v-4M8.5 11h7M8.5 15h7M8.5 19h4" {...lineProps} />
        </>
      ) : null}
      {name === 'share' ? (
        <>
          <Circle cx="18" cy="5" r="2.5" {...lineProps} />
          <Circle cx="6" cy="12" r="2.5" {...lineProps} />
          <Circle cx="18" cy="19" r="2.5" {...lineProps} />
          <Line x1="8.2" y1="10.8" x2="15.7" y2="6.2" {...lineProps} />
          <Line x1="8.2" y1="13.2" x2="15.7" y2="17.8" {...lineProps} />
        </>
      ) : null}
      {name === 'help' ? (
        <>
          <Circle cx="12" cy="12" r="9" {...lineProps} />
          <Path d="M9.6 9a2.6 2.6 0 1 1 4.5 1.8c-1.2 1-2.1 1.4-2.1 3" {...lineProps} />
          <Circle cx="12" cy="17.4" r=".7" fill={color} />
        </>
      ) : null}
      {name === 'award' ? (
        <>
          <Circle cx="12" cy="9" r="5" {...lineProps} />
          <Path d="m8.8 13-1.3 8 4.5-2.4 4.5 2.4-1.3-8" {...lineProps} />
        </>
      ) : null}
      {name === 'video' ? (
        <>
          <Rect x="3" y="5" width="13" height="14" rx="2" {...lineProps} />
          <Path d="m16 10 5-3v10l-5-3v-4Z" {...lineProps} />
        </>
      ) : null}
    </Svg>
  );
}

function SectionTitle({ title, underlineWidth }: { title: string; underlineWidth: number }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={[styles.sectionTitleUnderline, { width: underlineWidth }]} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function ProgressRing({ progress }: { progress: number }) {
  const radius = 7;
  const circumference = 2 * Math.PI * radius;

  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Circle cx="10" cy="10" r={radius} fill="#FFEEDB" />
      <Circle
        cx="10"
        cy="10"
        r={radius}
        fill="none"
        stroke="#FFB04F"
        strokeWidth="4"
        strokeDasharray={`${circumference * progress} ${circumference}`}
        transform="rotate(-90 10 10)"
      />
    </Svg>
  );
}

function HistoryCard({
  title,
  icon,
  items,
}: {
  title: string;
  icon: 'award' | 'video';
  items: HistoryItem[];
}) {
  return (
    <LinearGradient
      colors={['#E8F2FA', '#FFF0EF', '#FFF8F3']}
      locations={[0, 0.25, 0.68]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0.32 }}
      style={styles.historyCard}
    >
      <View style={styles.historyHeader}>
        <Text style={styles.historyHeaderText}>{title}</Text>
        <LineIcon name={icon} size={20} color="#D57219" />
      </View>

      {items.map((item) => (
        <View key={item.title} style={styles.historyItem}>
          <View style={styles.historyCopy}>
            <Text style={styles.historyItemTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.historyItemDetail} numberOfLines={1}>
              {item.detail}
            </Text>
          </View>
          <View style={styles.historyProgress}>
            <ProgressRing progress={item.progress} />
            <Text style={styles.continueText}>继续学习</Text>
          </View>
        </View>
      ))}
    </LinearGradient>
  );
}

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function LearningAnalysisChart({
  summary,
  dashboard,
}: {
  summary: StudyCheckInSummary | null;
  dashboard: TodayTaskDashboard | null;
}) {
  const today = new Date();
  const points = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const dateKey = toLocalDateKey(date);
    const checkedIn = summary?.checkedDates.includes(dateKey) ?? false;
    const todayMinutes = dateKey === toLocalDateKey(today)
      ? dashboard?.todayStudyMinutes ?? 0
      : 0;
    const score = Math.min(100, (checkedIn ? 42 : 8) + Math.min(todayMinutes, 58));
    return {
      checkedIn,
      label: `周${WEEKDAY_LABELS[date.getDay()]}`,
      score,
    };
  });
  const left = 27;
  const bottom = 99;
  const step = 45;
  const linePath = points
    .map((point, index) => {
      const x = left + index * step + 8;
      const y = bottom - (point.score / 100) * 62;
      return `${index === 0 ? 'M' : 'L'}${x} ${y}`;
    })
    .join(' ');

  return (
    <View style={styles.analysisContent}>
      <View style={styles.analysisSummaryRow}>
        <Text style={styles.analysisSummaryText}>
          连续 <Text style={styles.analysisStrong}>{summary?.continuousDays ?? 0}</Text> 天
        </Text>
        <Text style={styles.analysisSummaryText}>
          今日 <Text style={styles.analysisStrong}>{dashboard?.todayStudyMinutes ?? 0}</Text> 分钟
        </Text>
        <Text style={styles.analysisSummaryText}>
          累计 <Text style={styles.analysisStrong}>{summary?.totalDays ?? 0}</Text> 次
        </Text>
      </View>
      <Svg width="100%" height={122} viewBox="0 0 342 122">
        {[37, 68, 99].map((y) => (
          <Line
            key={y}
            x1="20"
            x2="326"
            y1={y}
            y2={y}
            stroke="#F1DFCB"
            strokeWidth="1"
          />
        ))}
        {points.map((point, index) => {
          const height = Math.max(6, (point.score / 100) * 62);
          const x = left + index * step;
          return (
            <Rect
              key={point.label + index}
              x={x}
              y={bottom - height}
              width="16"
              height={height}
              rx="5"
              fill={point.checkedIn ? '#FF9A25' : '#FFE0B9'}
            />
          );
        })}
        <Path
          d={linePath}
          fill="none"
          stroke="#686BE9"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((point, index) => {
          const x = left + index * step + 8;
          const y = bottom - (point.score / 100) * 62;
          return <Circle key={`dot-${index}`} cx={x} cy={y} r="3" fill="#686BE9" />;
        })}
        {points.map((point, index) => (
          <SvgText
            key={`label-${index}`}
            x={left + index * step + 8}
            y="116"
            fill="#9A7658"
            fontSize="9"
            textAnchor="middle"
          >
            {point.label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const pageWidth = Math.min(width, DESIGN_WIDTH);
  const scale = pageWidth / DESIGN_WIDTH;
  const tabBarClearance = 94 + Math.max(insets.bottom, 10);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [checkInSummary, setCheckInSummary] = useState<StudyCheckInSummary | null>(null);
  const [todayTaskDashboard, setTodayTaskDashboard] = useState<TodayTaskDashboard | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        const value = await getAuthSession();
        if (!value) {
          if (active) {
            setSession(null);
            setCheckInSummary(null);
            setTodayTaskDashboard(null);
          }
          return;
        }

        try {
          await getCurrentUser();
          if (!active) return;
          setSession(value);

          const month = toLocalDateKey(new Date()).slice(0, 7);
          const [summaryResult, dashboardResult] = await Promise.allSettled([
            getStudyCheckInSummary(month),
            getTodayTaskDashboard(),
          ]);
          if (!active) return;
          setCheckInSummary(
            summaryResult.status === 'fulfilled' ? summaryResult.value : null,
          );
          setTodayTaskDashboard(
            dashboardResult.status === 'fulfilled' ? dashboardResult.value : null,
          );
        } catch {
          if (active) {
            setSession(null);
            setCheckInSummary(null);
            setTodayTaskDashboard(null);
          }
        }
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  function handleSettings() {
    if (!session) return;
    Alert.alert('退出登录', `确定退出账号 ${session.username} 吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '退出',
        style: 'destructive',
        onPress: () => {
          void clearAuthSession().then(() => router.replace('/login'));
        },
      },
    ]);
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarClearance },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.page, { width: pageWidth }]}>
          <View style={[styles.hero, { height: 244 * scale }]}>
            <Image
              source={require('@/assets/images/profile/hero.png')}
              style={[
                styles.heroImage,
                {
                  top: -198 * scale,
                  width: pageWidth,
                  height: 603 * scale,
                },
              ]}
              resizeMode="stretch"
            />
            <LinearGradient
              colors={['rgba(252,241,228,0)', PAGE_BACKGROUND]}
              locations={[0, 0.48]}
              style={[
                styles.heroFade,
                {
                  top: 169 * scale,
                  height: 244 * scale,
                },
              ]}
            />

            <Pressable
              accessibilityLabel="收藏入口"
              style={({ pressed }) => [
                styles.bookmarkButton,
                { left: 20 * scale, top: 42 * scale },
                pressed && styles.pressed,
              ]}
            >
              <Image
                source={require('@/assets/images/fastuse/icon28.png')}
                style={{ width: 18 * scale, height: 23 * scale }}
                resizeMode="contain"
              />
            </Pressable>

            <Image
              source={require('@/assets/images/profile/header-mascot.png')}
              style={[
                styles.headerMascot,
                {
                  left: 309 * scale,
                  top: 29 * scale,
                  width: 55 * scale,
                  height: 52 * scale,
                },
              ]}
              resizeMode="contain"
            />

            <Pressable
              accessibilityLabel={session ? "退出登录" : "设置"}
              onPress={handleSettings}
              style={({ pressed }) => [
                styles.settingsButton,
                { right: 17 * scale, top: 42 * scale },
                pressed && styles.pressed,
              ]}
            >
              <LineIcon name="settings" size={26} color="#7E3B16" />
            </Pressable>

            <Pressable
              accessibilityLabel="立即登录或注册"
              onPress={() => {
                if (!session) router.push('/login');
              }}
              style={({ pressed }) => [
                styles.loginCard,
                {
                  left: 20 * scale,
                  top: 146 * scale,
                  width: pageWidth - 40 * scale,
                  height: 88 * scale,
                },
                pressed && styles.pressed,
              ]}
            >
              {session ? (
                <Image
                  source={getAccountAvatarSource(session.userId)}
                  style={[
                    styles.accountAvatar,
                    { width: 50 * scale, height: 50 * scale },
                  ]}
                  resizeMode="contain"
                />
              ) : (
                <View style={[styles.avatarPlaceholder, { width: 50 * scale, height: 50 * scale }]}>
                  <LineIcon name="user" size={33 * scale} color="#FFFFFF" />
                </View>
              )}
              <Text style={[styles.loginText, { fontSize: 18 * scale }]}>
                {session?.username ?? '立即登录/注册'}
              </Text>
              <Text style={[styles.chevron, { fontSize: 34 * scale }]}>›</Text>
            </Pressable>
          </View>

          <LinearGradient
            colors={['#FFF1E1', '#FFEEDB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.shortcutCard}
          >
            {shortcuts.map((shortcut) => (
              <Pressable
                key={shortcut.label}
                accessibilityLabel={shortcut.label}
                onPress={() => {
                  if (shortcut.route) router.push(shortcut.route);
                }}
                style={({ pressed }) => [styles.shortcutItem, pressed && styles.pressed]}
              >
                {shortcut.image ? (
                  <Image
                    source={shortcut.image}
                    resizeMode="contain"
                    style={styles.shortcutImage}
                  />
                ) : (
                  <LineIcon
                    name={shortcut.icon ?? 'user'}
                    size={30}
                    color="#9E4F21"
                  />
                )}
                <Text style={styles.shortcutLabel}>{shortcut.label}</Text>
              </Pressable>
            ))}
          </LinearGradient>

          <SectionTitle title="学情分析" underlineWidth={72} />
          <View style={styles.chartCard}>
            <LearningAnalysisChart
              summary={checkInSummary}
              dashboard={todayTaskDashboard}
            />
          </View>

          <SectionTitle title="历史记录" underlineWidth={72} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={305}
            decelerationRate="fast"
            contentContainerStyle={styles.historyContent}
          >
            <HistoryCard title="课程" icon="award" items={courseHistory} />
            <HistoryCard title="视频" icon="video" items={videoHistory} />
          </ScrollView>

          <SectionTitle title="常用功能" underlineWidth={80} />
          <View style={styles.commonCard}>
            {commonActions.map((action, index) => (
              <Pressable
                key={action.label}
                accessibilityLabel={action.label}
                style={({ pressed }) => [styles.commonRow, pressed && styles.pressed]}
              >
                <Image
                  source={action.image}
                  resizeMode="contain"
                  style={styles.commonImage}
                />
                <Text style={styles.commonLabel}>{action.label}</Text>
                <Text style={styles.commonChevron}>›</Text>
                {index < commonActions.length - 1 ? <View style={styles.commonDivider} /> : null}
              </Pressable>
            ))}
          </View>

          <Image
            source={require('@/assets/images/profile/bottom-mascots.png')}
            style={[
              styles.bottomMascots,
              {
                width: 135 * scale,
                height: 128 * scale,
                marginRight: 73 * scale,
              },
            ]}
            resizeMode="contain"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: PAGE_BACKGROUND,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
  },
  page: {
    backgroundColor: PAGE_BACKGROUND,
  },
  hero: {
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    position: 'absolute',
    left: 0,
  },
  heroFade: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  bookmarkButton: {
    position: 'absolute',
    zIndex: 3,
  },
  headerMascot: {
    position: 'absolute',
    zIndex: 3,
  },
  settingsButton: {
    position: 'absolute',
    zIndex: 4,
  },
  loginCard: {
    position: 'absolute',
    zIndex: 5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.78)',
    boxShadow: '0 3px 8px rgba(93, 49, 22, 0.12)',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: '#9A9A9A',
  },
  accountAvatar: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFEEDB',
  },
  loginText: {
    marginLeft: 15,
    color: '#161616',
    fontWeight: '500',
  },
  chevron: {
    marginLeft: 'auto',
    marginRight: 5,
    color: '#B9B9B9',
    fontWeight: '300',
  },
  shortcutCard: {
    height: 83,
    marginHorizontal: 20,
    flexDirection: 'row',
    borderRadius: 12,
    boxShadow: '0 3px 5px rgba(93, 49, 22, 0.18)',
  },
  shortcutItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  shortcutImage: {
    width: 40,
    height: 30,
  },
  shortcutLabel: {
    color: '#191919',
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitleRow: {
    position: 'relative',
    height: 27,
    marginTop: 18,
    marginHorizontal: 20,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  sectionTitleUnderline: {
    position: 'absolute',
    left: 0,
    bottom: 1,
    height: 15,
    backgroundColor: '#FFD29B',
  },
  sectionTitle: {
    color: '#111111',
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '600',
  },
  chartCard: {
    height: 180,
    marginTop: 15,
    marginHorizontal: 20,
    overflow: 'hidden',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
  },
  analysisContent: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 12,
  },
  analysisSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  analysisSummaryText: {
    color: '#8C6A4E',
    fontSize: 11,
  },
  analysisStrong: {
    color: '#E77D18',
    fontSize: 15,
    fontWeight: '700',
  },
  historyContent: {
    gap: 20,
    paddingHorizontal: 20,
  },
  historyCard: {
    width: 285,
    height: 270,
    marginTop: 15,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderRadius: 12,
  },
  historyHeader: {
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  historyHeaderText: {
    color: '#C66121',
    fontSize: 18,
    fontWeight: '600',
  },
  historyItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyCopy: {
    flex: 1,
    paddingRight: 5,
  },
  historyItemTitle: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '500',
  },
  historyItemDetail: {
    marginTop: 8,
    color: '#979797',
    fontSize: 10,
  },
  historyProgress: {
    width: 54,
    alignItems: 'center',
    gap: 4,
  },
  continueText: {
    color: '#D97624',
    fontSize: 9,
  },
  commonCard: {
    height: 294,
    marginTop: 15,
    marginHorizontal: 20,
    paddingHorizontal: 28,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  commonRow: {
    position: 'relative',
    height: 58.8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  commonLabel: {
    marginLeft: 18,
    color: '#222222',
    fontSize: 15,
    fontWeight: '500',
  },
  commonImage: {
    width: 25,
    height: 25,
  },
  commonChevron: {
    marginLeft: 'auto',
    color: '#9A9A9A',
    fontSize: 31,
    fontWeight: '200',
  },
  commonDivider: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#D7D7D7',
  },
  bottomMascots: {
    alignSelf: 'flex-end',
    marginTop: 36,
  },
  pressed: {
    opacity: 0.72,
  },
});
