import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  ImageSourcePropType,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import {
  EXAM_PLAN_CARD_LONG_SIDE,
  EXAM_PLAN_CARD_SHORT_SIDE,
} from "@/constants/exam-plan-card";
import { getCurrentUser } from "@/lib/auth-api";
import {
  getLearningGoals,
  type LearningGoals,
  updateLearningGoal,
} from "@/lib/learning-goal-api";
import {
  createDefaultMoodRecord,
  getMoodCacheScope,
  isSameMoodCacheScope,
  loadMoodCache,
  saveMoodCache,
  type MoodId,
  type MoodRecord,
  MOODS,
} from "@/lib/mood";
import { getTodayMood, toMoodRecord } from "@/lib/mood-api";
import DatePickerModal from "@/components/date-picker-modal";

const DESIGN_WIDTH = 402;
const RECOMMENDATION_CARD_WIDTH = EXAM_PLAN_CARD_SHORT_SIDE;
const RECOMMENDATION_CARD_HEIGHT = EXAM_PLAN_CARD_LONG_SIDE;
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

type GoalDraft = {
  shortTitle: string;
  shortDetail: string;
  shortTargetDate: string | null;
  longTitle: string;
  longDetail: string;
  longTargetDate: string | null;
};

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

function MoodFlipCard({ mood }: { mood: MoodRecord }) {
  const [flipped, setFlipped] = useState(false);
  const [flipValue] = useState(() => new Animated.Value(0));
  const card = moodCards[mood.id];
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
        <View pointerEvents="none" style={styles.moodAdvicePanel}>
          <Text style={styles.moodAdviceTitle}>
            {MOODS[mood.id].title} · 今日行动建议
          </Text>
          <Text numberOfLines={5} style={styles.moodAdviceText}>
            {mood.advice}
          </Text>
        </View>
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
  mood,
  pageWidth,
}: {
  mood: MoodRecord;
  pageWidth: number;
}) {
  const recommendationRef = useRef<ScrollView>(null);
  const examCardRef = useRef<View>(null);
  const openingExamRef = useRef(false);
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

  useFocusEffect(
    useCallback(() => {
      openingExamRef.current = false;
    }, []),
  );

  function openExamPlan() {
    if (openingExamRef.current) return;

    openingExamRef.current = true;

    if (reduceMotionEnabled || !examCardRef.current) {
      router.push("/exam-plan");
      return;
    }

    examCardRef.current.measureInWindow((x, y, width, height) => {
      if (width <= 0 || height <= 0) {
        router.push("/exam-plan");
        return;
      }

      router.push({
        pathname: "/exam-plan",
        params: {
          entry: "recommendation-card",
          sourceX: String(x),
          sourceY: String(y),
          sourceWidth: String(width),
          sourceHeight: String(height),
        },
      });
    });
  }

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
      <MoodFlipCard key={mood.id} mood={mood} />

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
              <View
                ref={item.id === "exam" ? examCardRef : undefined}
                collapsable={item.id === "exam" ? false : undefined}
              >
                <RecommendationCard
                  item={item}
                  onPress={item.id === "exam" ? openExamPlan : undefined}
                />
              </View>
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

function GoalEditorModal({
  goals,
  visible,
  onClose,
  onSave,
}: {
  goals: LearningGoals | null;
  visible: boolean;
  onClose: () => void;
  onSave: (draft: GoalDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<GoalDraft>(() => ({
    shortTitle: goals?.shortTerm?.title ?? "",
    shortDetail: goals?.shortTerm?.detail ?? "",
    shortTargetDate: goals?.shortTerm?.targetDate ?? null,
    longTitle: goals?.longTerm?.title ?? "",
    longDetail: goals?.longTerm?.detail ?? "",
    longTargetDate: goals?.longTerm?.targetDate ?? null,
  }));
  const [saving, setSaving] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<"SHORT" | "LONG" | null>(null);

  const canSave =
    draft.shortTitle.trim().length > 0 &&
    draft.shortDetail.trim().length > 0 &&
    draft.longTitle.trim().length > 0 &&
    draft.longDetail.trim().length > 0;

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await onSave({
        shortTitle: draft.shortTitle.trim(),
        shortDetail: draft.shortDetail.trim(),
        shortTargetDate: draft.shortTargetDate,
        longTitle: draft.longTitle.trim(),
        longDetail: draft.longDetail.trim(),
        longTargetDate: draft.longTargetDate,
      });
      onClose();
    } catch (error) {
      Alert.alert(
        "保存失败",
        error instanceof Error ? error.message : "请稍后重试",
      );
    } finally {
      setSaving(false);
    }
  }

  function updateDraft(field: keyof GoalDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.goalEditorOverlay}
      >
        <Pressable style={styles.goalEditorBackdrop} onPress={onClose} />
        <View style={styles.goalEditorCard}>
          <Text style={styles.goalEditorTitle}>修改当前目标</Text>
          <Text style={styles.goalEditorHint}>
            标题会显示在主页卡片顶部，详情会随所选目标切换。
          </Text>

          <Text style={styles.goalEditorSectionTitle}>短期目标</Text>
          <TextInput
            maxLength={12}
            onChangeText={(value) => updateDraft("shortTitle", value)}
            placeholder="例如：考试"
            placeholderTextColor="#B9A99D"
            style={styles.goalEditorInput}
            value={draft.shortTitle}
          />
          <TextInput
            maxLength={32}
            onChangeText={(value) => updateDraft("shortDetail", value)}
            placeholder="例如：考研"
            placeholderTextColor="#B9A99D"
            style={[styles.goalEditorInput, styles.goalEditorDetailInput]}
            value={draft.shortDetail}
          />
          <Pressable
            onPress={() => setDatePickerTarget("SHORT")}
            style={({ pressed }) => [
              styles.goalEditorDateButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.goalEditorDateLabel}>📅 目标日期</Text>
            <Text style={styles.goalEditorDateValue}>
              {draft.shortTargetDate ?? "点击选择"}
            </Text>
          </Pressable>

          <Text style={styles.goalEditorSectionTitle}>长期目标</Text>
          <TextInput
            maxLength={12}
            onChangeText={(value) => updateDraft("longTitle", value)}
            placeholder="例如：英语四级"
            placeholderTextColor="#B9A99D"
            style={styles.goalEditorInput}
            value={draft.longTitle}
          />
          <TextInput
            maxLength={32}
            onChangeText={(value) => updateDraft("longDetail", value)}
            placeholder="例如：坚持每日听力和词汇训练"
            placeholderTextColor="#B9A99D"
            style={[styles.goalEditorInput, styles.goalEditorDetailInput]}
            value={draft.longDetail}
          />
          <Pressable
            onPress={() => setDatePickerTarget("LONG")}
            style={({ pressed }) => [
              styles.goalEditorDateButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.goalEditorDateLabel}>📅 目标日期</Text>
            <Text style={styles.goalEditorDateValue}>
              {draft.longTargetDate ?? "点击选择"}
            </Text>
          </Pressable>

          <View style={styles.goalEditorActions}>
            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={onClose}
              style={({ pressed }) => [
                styles.goalEditorCancelButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.goalEditorCancelText}>取消</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={!canSave || saving}
              onPress={handleSave}
              style={({ pressed }) => [
                styles.goalEditorSaveButton,
                (!canSave || saving) && styles.goalEditorButtonDisabled,
                pressed && canSave && styles.pressed,
              ]}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.goalEditorSaveText}>保存</Text>
              )}
            </Pressable>
          </View>
        </View>

        <DatePickerModal
          visible={datePickerTarget !== null}
          value={
            datePickerTarget === "SHORT"
              ? draft.shortTargetDate
              : datePickerTarget === "LONG"
                ? draft.longTargetDate
                : null
          }
          onConfirm={(date) => {
            if (datePickerTarget === "SHORT") {
              updateDraft("shortTargetDate", date);
            } else if (datePickerTarget === "LONG") {
              updateDraft("longTargetDate", date);
            }
            setDatePickerTarget(null);
          }}
          onClose={() => setDatePickerTarget(null)}
        />
      </KeyboardAvoidingView>
    </Modal>
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
  const [username, setUsername] = useState("Jessica");
  const [goals, setGoals] = useState<LearningGoals | null>(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.allSettled([getCurrentUser(), getLearningGoals()]).then(
        ([userResult, goalsResult]) => {
        if (!active) return;
        if (userResult.status === "fulfilled") {
          setUsername(userResult.value.username);
        }
          setGoals(goalsResult.status === "fulfilled" ? goalsResult.value : null);
        },
      );
      return () => {
        active = false;
      };
    }, []),
  );

  const shortGoal = goals?.shortTerm ?? null;
  const longGoal = goals?.longTerm ?? null;
  const quote = GOAL_QUOTES[quoteIndex];

  async function saveGoals(draft: GoalDraft) {
    const [shortTerm, longTerm] = await Promise.all([
      updateLearningGoal("SHORT", {
        title: draft.shortTitle,
        detail: draft.shortDetail,
        targetDate: draft.shortTargetDate,
        progressPercent: shortGoal?.progressPercent ?? 0,
        actions: shortGoal?.actions ?? [],
      }),
      updateLearningGoal("LONG", {
        title: draft.longTitle,
        detail: draft.longDetail,
        targetDate: draft.longTargetDate,
        progressPercent: longGoal?.progressPercent ?? 0,
        actions: longGoal?.actions ?? [],
      }),
    ]);
    setGoals({ shortTerm, longTerm });
  }

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
          <Image
            source={require("@/assets/images/fastuse/icon44.png")}
            style={styles.greetingChevronImage}
            resizeMode="contain"
          />
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
          value={shortGoal?.title ?? "暂未设置"}
          duration={shortGoal?.targetDate ? `目标日 ${shortGoal.targetDate}` : "近期"}
          actions={shortGoal ? [shortGoal.detail, ...shortGoal.actions].slice(0, 3) : ["点击下方按钮设置短期目标"]}
        />
        <GoalRow
          title="长期目标"
          value={longGoal?.title ?? "暂未设置"}
          duration={longGoal?.targetDate ? `目标日 ${longGoal.targetDate}` : "长期"}
          actions={longGoal ? [longGoal.detail, ...longGoal.actions].slice(0, 3) : ["点击下方按钮设置长期目标"]}
        />

        <LinearGradient
          colors={["#FFFFFF", "#FFD29B", "#FFFFFF"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.editGoalButton}
        >
          <Pressable
            onPress={() => setEditorVisible(true)}
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

      {editorVisible ? (
        <GoalEditorModal
          goals={goals}
          visible
          onClose={() => setEditorVisible(false)}
          onSave={saveGoals}
        />
      ) : null}
    </>
  );
}

export default function PlanScreen() {
  const { width } = useWindowDimensions();
  const { mode: requestedMode } = useLocalSearchParams<{ mode?: string }>();
  const pageWidth = Math.min(width, DESIGN_WIDTH);
  const [mode, setMode] = useState<PlanMode>("ai");
  const [mood, setMood] = useState<MoodRecord>(() =>
    createDefaultMoodRecord("happy"),
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const modeFrame = requestedMode === "goal"
        ? requestAnimationFrame(() => setMode("goal"))
        : null;
      setMood(createDefaultMoodRecord("happy"));

      void (async () => {
        try {
          const cacheScope = await getMoodCacheScope();
          try {
            const todayMood = toMoodRecord(await getTodayMood());
            const currentScope = await getMoodCacheScope();
            if (!isSameMoodCacheScope(currentScope, cacheScope)) {
              return;
            }
            if (todayMood.date !== cacheScope.date) {
              throw new Error("后端返回的不是设备本地今日心情");
            }
            if (active) {
              setMood(todayMood);
            }
            await saveMoodCache(todayMood, cacheScope);
          } catch {
            const currentScope = await getMoodCacheScope();
            if (!isSameMoodCacheScope(currentScope, cacheScope)) {
              return;
            }
            const storedMood = await loadMoodCache(cacheScope);
            const latestScope = await getMoodCacheScope();
            if (
              active &&
              isSameMoodCacheScope(latestScope, cacheScope) &&
              storedMood
            ) {
              setMood(storedMood);
            }
          }
        } catch {
          // Keep the reset default mood when auth or local storage is unavailable.
        }
      })();

      return () => {
        active = false;
        if (modeFrame !== null) {
          cancelAnimationFrame(modeFrame);
        }
      };
    }, [requestedMode]),
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
            <AiPlanningPage mood={mood} pageWidth={pageWidth} />
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
  moodAdvicePanel: {
    position: "absolute",
    top: 20,
    right: 17,
    width: 216,
    minHeight: 171,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255, 247, 235, 0.96)",
  },
  moodAdviceTitle: {
    color: "#9A501A",
    fontSize: 14,
    fontWeight: "700",
  },
  moodAdviceText: {
    marginTop: 9,
    color: "#5D3A24",
    fontSize: 13,
    lineHeight: 20,
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
    height: RECOMMENDATION_CARD_HEIGHT,
  },
  recommendationCard: {
    position: "relative",
    width: RECOMMENDATION_CARD_WIDTH,
    height: RECOMMENDATION_CARD_HEIGHT,
    overflow: "hidden",
    borderRadius: 22,
    boxShadow: "0 5px 9px rgba(70, 45, 24, 0.18)",
  },
  recommendationPressable: {
    width: RECOMMENDATION_CARD_WIDTH,
    height: RECOMMENDATION_CARD_HEIGHT,
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
  greetingChevronImage: {
    width: 76,
    height: 86,
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
  goalEditorOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  goalEditorBackdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(55, 38, 26, 0.38)",
  },
  goalEditorCard: {
    width: "100%",
    maxWidth: 370,
    padding: 22,
    borderRadius: 24,
    backgroundColor: "#FFF9F3",
    boxShadow: "0 12px 28px rgba(87, 53, 31, 0.24)",
    elevation: 10,
  },
  goalEditorTitle: {
    color: "#5F351F",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  goalEditorHint: {
    marginTop: 6,
    marginBottom: 14,
    color: "#9A7058",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  goalEditorSectionTitle: {
    marginTop: 10,
    marginBottom: 6,
    color: "#8E4E28",
    fontSize: 14,
    fontWeight: "700",
  },
  goalEditorInput: {
    height: 42,
    marginBottom: 8,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: "#F2C798",
    borderRadius: 12,
    color: "#4A3325",
    fontSize: 14,
    backgroundColor: "#FFFFFF",
  },
  goalEditorDetailInput: {
    borderColor: "#E5D4F0",
  },
  goalEditorDateButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 42,
    marginBottom: 8,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: "#A8D5BA",
    borderRadius: 12,
    backgroundColor: "#F7FFFA",
  },
  goalEditorDateLabel: {
    color: "#4A7C5C",
    fontSize: 14,
  },
  goalEditorDateValue: {
    color: "#6E4A30",
    fontSize: 13,
    fontWeight: "500",
  },
  goalEditorActions: {
    marginTop: 14,
    flexDirection: "row",
    gap: 12,
  },
  goalEditorCancelButton: {
    flex: 1,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 21,
    backgroundColor: "#F5E8DC",
  },
  goalEditorCancelText: {
    color: "#795844",
    fontSize: 15,
  },
  goalEditorSaveButton: {
    flex: 1,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 21,
    backgroundColor: "#F59A24",
  },
  goalEditorSaveText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  goalEditorButtonDisabled: {
    opacity: 0.45,
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
