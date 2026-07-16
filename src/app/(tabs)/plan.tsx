import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Image,
  ImageSourcePropType,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import { getCurrentUser } from "@/lib/auth-api";
import { getLatestExamPlan, type ExamPlan } from "@/lib/exam-plan-api";
import { MOOD_STORAGE_KEY, MoodId, parseStoredMood } from "@/lib/mood";
import {
  getTodayTaskDashboard,
  type TodayTaskDashboard,
} from "@/lib/today-task-api";

const DESIGN_WIDTH = 402;
const RECOMMENDATION_CARD_WIDTH = 205;
const RECOMMENDATION_CARD_GAP = 34;
const RECOMMENDATION_SNAP_INTERVAL =
  RECOMMENDATION_CARD_WIDTH + RECOMMENDATION_CARD_GAP;

const GOAL_QUOTES = [
  {
    text: "计划是行动的蓝图，没有精心绘制的蓝图，行动就会迷失方向。",
    author: "雷军",
  },
  {
    text: "凡事预则立，不预则废。",
    author: "《礼记》",
  },
  {
    text: "不积跬步，无以至千里；不积小流，无以成江海。",
    author: "荀子",
  },
  {
    text: "知之者不如好之者，好之者不如乐之者。",
    author: "孔子",
  },
  {
    text: "业精于勤，荒于嬉；行成于思，毁于随。",
    author: "韩愈",
  },
  {
    text: "日日行，不怕千万里；常常做，不怕千万事。",
    author: "金缨",
  },
] as const;

type PlanMode = "ai" | "goal";

type Recommendation = {
  id: string;
  title: string;
  description: string;
  image: ImageSourcePropType;
  colors: readonly [string, string];
};

const recommendations: Recommendation[] = [
  {
    id: "habit",
    title: "习惯养成",
    description: "根据学习习惯\n制定每日成长任务",
    image: require("@/assets/images/plan/side-mascot-left.png"),
    colors: ["#E8F7DE", "#FFCDB7"],
  },
  {
    id: "exam",
    title: "考试规划",
    description: "根据考试时间\n安排学习计划和任务",
    image: require("@/assets/images/plan/exam-mascot.png"),
    colors: ["#FFE3BF", "#E5F5FF"],
  },
  {
    id: "study",
    title: "学习规划",
    description: "规划学习顺序和时间\n增加针对性的练习",
    image: require("@/assets/images/plan/side-mascot-right.png"),
    colors: ["#F1E2FF", "#FFE2BD"],
  },
];

function TopModeTabs({
  mode,
  onChange,
}: {
  mode: PlanMode;
  onChange: (mode: PlanMode) => void;
}) {
  return (
    <View style={styles.modeTabs}>
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: mode === "ai" }}
        onPress={() => onChange("ai")}
        style={({ pressed }) => [styles.modeTab, pressed && styles.pressed]}
      >
        <Text
          style={[styles.modeLabel, mode === "ai" && styles.modeLabelActive]}
        >
          AI路径规划
        </Text>
        {mode === "ai" ? <View style={styles.modeUnderline} /> : null}
      </Pressable>

      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: mode === "goal" }}
        onPress={() => onChange("goal")}
        style={({ pressed }) => [styles.modeTab, pressed && styles.pressed]}
      >
        <Text
          style={[styles.modeLabel, mode === "goal" && styles.modeLabelActive]}
        >
          目标设定
        </Text>
        {mode === "goal" ? <View style={styles.modeUnderline} /> : null}
      </Pressable>
    </View>
  );
}

function RecommendationCard({
  item,
  onPress,
}: {
  item: Recommendation;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.recommendationPressable,
        pressed && styles.pressed,
      ]}
    >
      <LinearGradient
        colors={item.colors}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.recommendationCard}
      >
        <Text style={styles.recommendationTitle}>{item.title}</Text>
        <Image
          source={item.image}
          style={styles.recommendationImage}
          resizeMode="contain"
        />
        <Text style={styles.recommendationDescription}>{item.description}</Text>
        <View style={styles.decorativeCircleLarge} />
        <View style={styles.decorativeCircleSmall} />
      </LinearGradient>
    </Pressable>
  );
}

const moodCards: Record<
  MoodId,
  { front: ImageSourcePropType; back: ImageSourcePropType }
> = {
  happy: {
    front: require("@/assets/images/mood/cards/happy-front.png"),
    back: require("@/assets/images/mood/cards/happy-back.png"),
  },
  annoyed: {
    front: require("@/assets/images/mood/cards/annoyed-front.png"),
    back: require("@/assets/images/mood/cards/annoyed-back.png"),
  },
  calm: {
    front: require("@/assets/images/mood/cards/calm-front.png"),
    back: require("@/assets/images/mood/cards/calm-back.png"),
  },
  tired: {
    front: require("@/assets/images/mood/cards/tired-front.png"),
    back: require("@/assets/images/mood/cards/tired-back.png"),
  },
};

function MoodFlipCard({ moodId }: { moodId: MoodId }) {
  const [flipped, setFlipped] = useState(false);
  const [flipValue] = useState(() => new Animated.Value(0));
  const card = moodCards[moodId];
  const frontRotation = flipValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });
  const backRotation = flipValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  });

  function toggleCard() {
    const nextFlipped = !flipped;
    setFlipped(nextFlipped);
    Animated.spring(flipValue, {
      toValue: nextFlipped ? 1 : 0,
      friction: 8,
      tension: 65,
      useNativeDriver: true,
    }).start();
  }

  return (
    <Pressable
      accessibilityHint="翻转查看心情卡片的另一面"
      accessibilityLabel="今日心情行动卡片"
      onPress={toggleCard}
      style={styles.moodCard}
    >
      <Animated.View
        style={[
          styles.moodCardSide,
          { transform: [{ perspective: 1000 }, { rotateY: frontRotation }] },
        ]}
      >
        <Image
          source={card.front}
          resizeMode="stretch"
          style={styles.moodCardImage}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.moodCardSide,
          { transform: [{ perspective: 1000 }, { rotateY: backRotation }] },
        ]}
      >
        <Image
          source={card.back}
          resizeMode="stretch"
          style={styles.moodCardImage}
        />
      </Animated.View>
    </Pressable>
  );
}

function AiPlanningPage({
  moodId,
  pageWidth,
}: {
  moodId: MoodId;
  pageWidth: number;
}) {
  const recommendationRef = useRef<ScrollView>(null);
  const [recommendationScrollX] = useState(
    () => new Animated.Value(RECOMMENDATION_SNAP_INTERVAL),
  );
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);
  const router = useRouter();

  const recommendationSidePadding = Math.max(
    0,
    (pageWidth - RECOMMENDATION_CARD_WIDTH) / 2,
  );

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotionEnabled);
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotionEnabled,
    );

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      recommendationRef.current?.scrollTo({
        x: RECOMMENDATION_SNAP_INTERVAL,
        animated: false,
      });
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <>
      <MoodFlipCard key={moodId} moodId={moodId} />

      <Pressable
        onPress={() => router.push("/mood")}
        style={({ pressed }) => [
          styles.switchButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.switchButtonText}>切换</Text>
      </Pressable>

      <Text style={styles.learningTitle}>学习推荐</Text>

      <Animated.ScrollView
        ref={recommendationRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={RECOMMENDATION_SNAP_INTERVAL}
        snapToAlignment="start"
        disableIntervalMomentum
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [
            {
              nativeEvent: {
                contentOffset: { x: recommendationScrollX },
              },
            },
          ],
          { useNativeDriver: Platform.OS !== "web" },
        )}
        contentContainerStyle={[
          styles.recommendationContent,
          { paddingHorizontal: recommendationSidePadding },
        ]}
      >
        {recommendations.map((item, index) => {
          const cardCenterOffset = index * RECOMMENDATION_SNAP_INTERVAL;
          const scale = recommendationScrollX.interpolate({
            inputRange: [
              cardCenterOffset - RECOMMENDATION_SNAP_INTERVAL,
              cardCenterOffset,
              cardCenterOffset + RECOMMENDATION_SNAP_INTERVAL,
            ],
            outputRange: reduceMotionEnabled ? [1, 1, 1] : [0.84, 1, 0.84],
            extrapolate: "clamp",
          });
          const rotate = recommendationScrollX.interpolate({
            inputRange: [
              cardCenterOffset - RECOMMENDATION_SNAP_INTERVAL,
              cardCenterOffset,
              cardCenterOffset + RECOMMENDATION_SNAP_INTERVAL,
            ],
            outputRange: reduceMotionEnabled
              ? ["0deg", "0deg", "0deg"]
              : ["5deg", "0deg", "-5deg"],
            extrapolate: "clamp",
          });

          return (
            <Animated.View
              key={item.id}
              style={[
                styles.recommendationCardMotion,
                { transform: [{ rotate }, { scale }] },
              ]}
            >
              <RecommendationCard
                item={item}
                onPress={
                  item.id === "exam"
                    ? () => router.push("/exam-plan")
                    : undefined
                }
              />
            </Animated.View>
          );
        })}
      </Animated.ScrollView>
    </>
  );
}

function TargetIcon() {
  return (
    <Svg width={25} height={25} viewBox="0 0 25 25">
      <Circle
        cx="11"
        cy="14"
        r="7.5"
        fill="none"
        stroke="#B7632D"
        strokeWidth="1.7"
      />
      <Circle
        cx="11"
        cy="14"
        r="3.5"
        fill="none"
        stroke="#B7632D"
        strokeWidth="1.7"
      />
      <Path
        d="M11 14 21 4M16 4h5v5"
        fill="none"
        stroke="#B7632D"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DownChevron() {
  return (
    <Svg width={16} height={10} viewBox="0 0 16 10">
      <Path
        d="m2 2 6 6 6-6"
        fill="none"
        stroke="#BEBEBE"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DetailIcon({ type }: { type: "time" | "action" }) {
  if (type === "time") {
    return (
      <Svg width={20} height={20} viewBox="0 0 20 20">
        <Circle
          cx="10"
          cy="10"
          r="7.2"
          fill="none"
          stroke="#A94F1D"
          strokeWidth="1.4"
        />
        <Path
          d="M10 5.6v4.8l3 2"
          fill="none"
          stroke="#A94F1D"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Circle cx="5" cy="6" r="1.5" fill="#A94F1D" />
      <Circle cx="15" cy="6" r="1.5" fill="#A94F1D" />
      <Circle cx="10" cy="14" r="1.5" fill="#A94F1D" />
      <Path
        d="M6.4 6.8 9 12.6m4.6-5.8L11 12.6M6.5 6h7"
        fill="none"
        stroke="#A94F1D"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function GreetingChevrons() {
  return (
    <Svg width={76} height={86} viewBox="0 0 76 86">
      <Path
        d="M8 36 38 6l30 30"
        fill="none"
        stroke="#FFD9A8"
        strokeWidth="11"
      />
      <Path
        d="m8 66 30-30 30 30"
        fill="none"
        stroke="#FFE9CC"
        strokeWidth="11"
      />
    </Svg>
  );
}

function GoalRow({
  title,
  value,
  duration,
  actions,
}: {
  title: string;
  value: string;
  duration: string;
  actions: string[];
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      onPress={() => setExpanded((current) => !current)}
      style={({ pressed }) => [
        styles.goalRow,
        expanded ? styles.goalRowExpanded : styles.goalRowCollapsed,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.goalRowHeader}>
        <View style={styles.goalRowCopy}>
          <Text style={styles.goalRowTitle}>{title}</Text>
          <View style={styles.goalValueRow}>
            <TargetIcon />
            <Text style={styles.goalValue}>{value}</Text>
          </View>
        </View>
        <Text style={styles.goalDetail}>{expanded ? "收起详情" : "查看详情"}</Text>
        <View style={expanded && styles.goalChevronExpanded}>
          <DownChevron />
        </View>
      </View>

      {expanded ? (
        <>
          <View style={styles.goalDivider} />

          <View style={styles.goalDetailRow}>
            <DetailIcon type="time" />
            <Text style={styles.goalDetailLabel}>时间段</Text>
            <Text style={styles.goalDetailValue}>{duration}</Text>
          </View>

          <View style={[styles.goalDetailRow, styles.goalActionRow]}>
            <DetailIcon type="action" />
            <Text style={styles.goalDetailLabel}>行动</Text>
            <Text style={styles.goalActionText} numberOfLines={3}>
              {actions.map((action, index) => `${index + 1}.${action}`).join("\n")}
            </Text>
          </View>
        </>
      ) : null}
    </Pressable>
  );
}

function InfoCard({
  backgroundWord,
  title,
  description,
}: {
  backgroundWord: string;
  title: string;
  description: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.infoCard, pressed && styles.pressed]}
    >
      <View style={styles.infoArrowCircle}>
        <Text style={styles.infoArrow}>↗</Text>
      </View>
      <Text style={styles.infoBackgroundWord}>{backgroundWord}</Text>
      <View style={styles.infoCopy}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoDescription} numberOfLines={2}>
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

function GoalSettingPage() {
  const router = useRouter();
  const [username, setUsername] = useState("Jessica");
  const [examPlan, setExamPlan] = useState<ExamPlan | null>(null);
  const [todayDashboard, setTodayDashboard] = useState<TodayTaskDashboard | null>(null);
  const [quoteIndex, setQuoteIndex] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.allSettled([
        getCurrentUser(),
        getTodayTaskDashboard(),
        getLatestExamPlan(),
      ]).then(([userResult, dashboardResult, planResult]) => {
        if (!active) return;
        if (userResult.status === "fulfilled") {
          setUsername(userResult.value.username);
        }
        setTodayDashboard(
          dashboardResult.status === "fulfilled" ? dashboardResult.value : null,
        );
        setExamPlan(planResult.status === "fulfilled" ? planResult.value : null);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const todayActions = todayDashboard
    ? [...todayDashboard.pendingTasks, ...todayDashboard.completedTasks]
        .slice(0, 3)
        .map((task) => task.title)
    : [];
  const examActions = examPlan?.phases
    .flatMap((phase) => phase.tasks)
    .slice(0, 3) ?? [];
  const quote = GOAL_QUOTES[quoteIndex];

  function changeQuote() {
    setQuoteIndex((currentIndex) => {
      const offset = Math.floor(Math.random() * (GOAL_QUOTES.length - 1)) + 1;
      return (currentIndex + offset) % GOAL_QUOTES.length;
    });
  }

  return (
    <>
      <View style={styles.greetingArea}>
        <Image
          source={require("@/assets/images/plan-goal-v2/Group 1054.png")}
          style={styles.greetingMascot}
          resizeMode="contain"
        />
        <View style={styles.greetingCopy}>
          <Text style={styles.greetingTitle}>Hi，{username}</Text>
          <Text style={styles.greetingDescription}>
            快来设定你的目标吧~{`\n`}3步获取制定计划，提升3倍学习效率
          </Text>
        </View>
        <View style={styles.greetingChevrons}>
          <GreetingChevrons />
        </View>
      </View>

      <LinearGradient
        colors={["#FFEAD6", "#F7E1F6", "#DEEBF9"]}
        locations={[0, 0.54, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.goalPanel}
      >
        <Text style={styles.goalPanelIntro}>
          小汪根据你的选择为你定制了个性化目标
        </Text>
        <GoalRow
          title="短期目标"
          value={todayActions.length > 0 ? `今日任务 ${todayActions.length}项` : "今日任务"}
          duration="当天"
          actions={todayActions.length > 0 ? todayActions : ["前往今日任务添加学习安排"]}
        />
        <GoalRow
          title="长期目标"
          value={examPlan?.subject ?? "暂未设置"}
          duration={examPlan ? `${examPlan.remainingDays}天` : "待设置"}
          actions={examActions.length > 0 ? examActions : ["创建考试计划后自动生成行动清单"]}
        />

        <LinearGradient
          colors={["#FFFFFF", "#FFD29B", "#FFFFFF"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.editGoalButton}
        >
          <Pressable
            onPress={() => router.push("/exam-plan")}
            style={({ pressed }) => [
              styles.editGoalPressable,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.editGoalText}>修改当前目标</Text>
          </Pressable>
        </LinearGradient>
      </LinearGradient>

      <View style={styles.quoteCard}>
        <Text style={styles.quoteText} numberOfLines={2}>
          {quote.text}
        </Text>
        <View style={styles.quoteFooter}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="换一条名人名言"
            hitSlop={8}
            onPress={changeQuote}
            style={({ pressed }) => [
              styles.refreshButton,
              pressed && styles.pressed,
            ]}
          >
            <Image
              source={require("@/assets/images/fastuse/icon50.png")}
              style={styles.refreshIcon}
              resizeMode="contain"
            />
            <Text style={styles.refreshText}>换一换</Text>
          </Pressable>
          <Text style={styles.quoteAuthor}>——{quote.author}</Text>
        </View>
      </View>

      <View style={styles.infoCardsRow}>
        <InfoCard
          backgroundWord="TARGET"
          title="目标案例参考"
          description="期中考试英语作文提升计划"
        />
        <InfoCard
          backgroundWord="RESULT"
          title="成果展示"
          description="上周80%用户靠目标计划完成任务"
        />
      </View>
    </>
  );
}

export default function PlanScreen() {
  const { width } = useWindowDimensions();
  const pageWidth = Math.min(width, DESIGN_WIDTH);
  const [mode, setMode] = useState<PlanMode>("ai");
  const [moodId, setMoodId] = useState<MoodId>("happy");

  useFocusEffect(
    useCallback(() => {
      let active = true;

      AsyncStorage.getItem(MOOD_STORAGE_KEY).then((value) => {
        const storedMood = parseStoredMood(value);
        if (active && storedMood) {
          setMoodId(storedMood.id);
        }
      });

      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <LinearGradient
      colors={mode === "ai" ? ["#FFF8F3", "#FFEEDB"] : ["#FFF8F3", "#FFF8F3"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.screen}
    >
      <ScrollView
        style={styles.pageScroll}
        contentContainerStyle={styles.pageScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.page, { width: pageWidth }]}>
          <TopModeTabs mode={mode} onChange={setMode} />
          {mode === "ai" ? (
            <AiPlanningPage moodId={moodId} pageWidth={pageWidth} />
          ) : (
            <GoalSettingPage />
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  pageScroll: {
    flex: 1,
  },
  pageScrollContent: {
    alignItems: "center",
    paddingBottom: 120,
  },
  page: {
    minHeight: 874,
  },
  modeTabs: {
    height: 54,
    marginTop: 38,
    marginHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 35,
  },
  modeTab: {
    position: "relative",
    height: 42,
    justifyContent: "center",
  },
  modeLabel: {
    color: "#181818",
    fontSize: 18,
    fontWeight: "400",
  },
  modeLabelActive: {
    fontWeight: "700",
  },
  modeUnderline: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#111111",
  },
  moodCard: {
    position: "relative",
    height: 212,
    marginTop: 26,
    marginHorizontal: 20,
    borderRadius: 23,
  },
  moodCardSide: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: "hidden",
    borderRadius: 23,
    backfaceVisibility: "hidden",
  },
  moodCardImage: {
    width: "100%",
    height: "100%",
  },
  switchButton: {
    width: 76,
    height: 31,
    marginTop: 12,
    marginRight: 20,
    alignSelf: "flex-end",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: "#F7931E",
  },
  switchButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
  learningTitle: {
    marginTop: 32,
    marginHorizontal: 20,
    color: "#131313",
    fontSize: 22,
    fontWeight: "500",
  },
  recommendationContent: {
    height: 296,
    marginTop: 18,
    gap: RECOMMENDATION_CARD_GAP,
  },
  recommendationCardMotion: {
    width: RECOMMENDATION_CARD_WIDTH,
    height: 281,
  },
  recommendationCard: {
    position: "relative",
    width: RECOMMENDATION_CARD_WIDTH,
    height: 281,
    overflow: "hidden",
    borderRadius: 22,
    boxShadow: "0 5px 9px rgba(70, 45, 24, 0.18)",
  },
  recommendationPressable: {
    width: RECOMMENDATION_CARD_WIDTH,
    height: 281,
  },
  recommendationTitle: {
    position: "absolute",
    top: 18,
    left: 15,
    zIndex: 2,
    color: "#111111",
    fontSize: 18,
    fontWeight: "600",
  },
  recommendationImage: {
    position: "absolute",
    top: 84,
    left: 44,
    width: 118,
    height: 118,
  },
  recommendationDescription: {
    position: "absolute",
    right: 14,
    bottom: 14,
    left: 14,
    zIndex: 2,
    color: "#161616",
    fontSize: 13,
    lineHeight: 19,
  },
  decorativeCircleLarge: {
    position: "absolute",
    right: 21,
    bottom: 17,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#C43F3F",
  },
  decorativeCircleSmall: {
    position: "absolute",
    right: 11,
    bottom: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFAB3D",
  },
  pressed: {
    opacity: 0.72,
  },
  greetingArea: {
    position: "relative",
    height: 110,
    marginTop: 0,
    marginHorizontal: 20,
  },
  greetingMascot: {
    position: "absolute",
    top: 16,
    left: 15,
    width: 77,
    height: 77,
  },
  greetingCopy: {
    position: "absolute",
    top: 17,
    left: 107,
    zIndex: 2,
  },
  greetingTitle: {
    color: "#111111",
    fontSize: 21,
    fontWeight: "600",
  },
  greetingDescription: {
    marginTop: 4,
    color: "#111111",
    fontSize: 14,
    lineHeight: 20,
  },
  greetingChevrons: {
    position: "absolute",
    top: 1,
    right: -3,
  },
  goalPanel: {
    minHeight: 270,
    marginHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
    borderRadius: 24,
  },
  goalPanelIntro: {
    color: "#8D593A",
    fontSize: 15,
    textAlign: "center",
  },
  goalRow: {
    marginTop: 14,
    marginHorizontal: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.88)",
  },
  goalRowCollapsed: {
    height: 68,
  },
  goalRowExpanded: {
    height: 165,
  },
  goalRowHeader: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
  },
  goalRowCopy: {
    flex: 1,
  },
  goalRowTitle: {
    color: "#F07C19",
    fontSize: 17,
    fontWeight: "700",
  },
  goalValueRow: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  goalValue: {
    color: "#6E3F27",
    fontSize: 13,
  },
  goalDetail: {
    marginRight: 10,
    color: "#BDBDBD",
    fontSize: 12,
  },
  goalChevronExpanded: {
    transform: [{ rotate: "180deg" }],
  },
  goalDivider: {
    height: 1,
    marginBottom: 7,
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderColor: "#D69A7D",
  },
  goalDetailRow: {
    minHeight: 25,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  goalActionRow: {
    alignItems: "flex-start",
  },
  goalDetailLabel: {
    width: 42,
    color: "#A94F1D",
    fontSize: 13,
  },
  goalDetailValue: {
    marginLeft: "auto",
    color: "#A94F1D",
    fontSize: 12,
  },
  goalActionText: {
    color: "#9B4B22",
    fontSize: 11,
    lineHeight: 15,
  },
  editGoalButton: {
    width: 196,
    height: 39,
    marginTop: 18,
    alignSelf: "center",
    overflow: "hidden",
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#F2A34F",
    boxShadow: "0 4px 8px rgba(125, 71, 34, 0.22)",
  },
  editGoalPressable: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  editGoalText: {
    color: "#6C422A",
    fontSize: 16,
  },
  quoteCard: {
    height: 70,
    marginTop: 20,
    marginHorizontal: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  quoteText: {
    color: "#1F1F1F",
    fontSize: 14,
    lineHeight: 20,
  },
  quoteFooter: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  refreshIcon: {
    width: 14,
    height: 15,
  },
  refreshText: {
    color: "#9B4B22",
    fontSize: 13,
  },
  quoteAuthor: {
    color: "#111111",
    fontSize: 13,
  },
  infoCardsRow: {
    height: 230,
    marginTop: 20,
    marginHorizontal: 20,
    flexDirection: "row",
    gap: 19,
  },
  infoCard: {
    position: "relative",
    flex: 1,
    overflow: "hidden",
    borderRadius: 22,
    backgroundColor: "#FFE4C3",
  },
  infoArrowCircle: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 2,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.88)",
  },
  infoArrow: {
    color: "#9B4B22",
    fontSize: 22,
  },
  infoBackgroundWord: {
    position: "absolute",
    top: 92,
    left: -8,
    color: "rgba(255,255,255,0.48)",
    fontSize: 54,
    fontWeight: "800",
  },
  infoCopy: {
    position: "absolute",
    top: 125,
    right: 15,
    left: 15,
  },
  infoTitle: {
    color: "#6F3C22",
    fontSize: 17,
    fontWeight: "700",
  },
  infoDescription: {
    marginTop: 5,
    color: "#F07C19",
    fontSize: 12,
    lineHeight: 17,
  },
});
