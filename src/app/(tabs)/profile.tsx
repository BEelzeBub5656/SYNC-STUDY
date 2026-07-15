import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';

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

const shortcuts: { label: string; icon: IconName }[] = [
  { label: '人物画像', icon: 'user' },
  { label: '我的收藏', icon: 'star' },
  { label: '错题库', icon: 'close' },
  { label: '知识归纳', icon: 'book' },
];

const commonActions: { label: string; icon: IconName }[] = [
  { label: '任务中心', icon: 'puzzle' },
  { label: '积分兑换', icon: 'coins' },
  { label: '我的简历', icon: 'cv' },
  { label: '分享APP', icon: 'share' },
  { label: '帮助与反馈', icon: 'help' },
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
        rotation="-90"
        origin="10, 10"
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

export default function ProfileScreen() {
  const { width } = useWindowDimensions();
  const pageWidth = Math.min(width, DESIGN_WIDTH);
  const scale = pageWidth / DESIGN_WIDTH;

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
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
              <LineIcon name="bookmark" size={25} color="#934519" />
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
              accessibilityLabel="设置"
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
              <View style={[styles.avatarPlaceholder, { width: 50 * scale, height: 50 * scale }]}>
                <LineIcon name="user" size={33 * scale} color="#FFFFFF" />
              </View>
              <Text style={[styles.loginText, { fontSize: 18 * scale }]}>立即登录/注册</Text>
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
                style={({ pressed }) => [styles.shortcutItem, pressed && styles.pressed]}
              >
                <LineIcon name={shortcut.icon} size={30} color="#9E4F21" />
                <Text style={styles.shortcutLabel}>{shortcut.label}</Text>
              </Pressable>
            ))}
          </LinearGradient>

          <SectionTitle title="学情分析" underlineWidth={72} />
          <View style={styles.chartCard}>
            <Image
              source={require('@/assets/images/profile/analysis-chart.png')}
              style={styles.chartImage}
              resizeMode="cover"
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
                <LineIcon name={action.icon} size={25} color="#747474" />
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
    paddingBottom: 118,
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
  chartImage: {
    width: '100%',
    height: '100%',
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
