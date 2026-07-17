import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { scheduleOnRN } from "react-native-worklets";

import {
  EXAM_PLAN_CARD_LONG_SIDE,
  EXAM_PLAN_CARD_RADIUS,
  EXAM_PLAN_CARD_SHORT_SIDE,
} from "@/constants/exam-plan-card";
import {
  createExamPlan,
  getLatestExamPlan,
  LATEST_EXAM_PLAN_KEY,
} from "@/lib/exam-plan-api";

const DESIGN_WIDTH = 402;
const PAGE_HORIZONTAL_PADDING = 20;
const HERO_WIDTH = EXAM_PLAN_CARD_LONG_SIDE;
const HERO_HEIGHT = EXAM_PLAN_CARD_SHORT_SIDE;
const TRANSITION_CARD_WIDTH = EXAM_PLAN_CARD_SHORT_SIDE;
const TRANSITION_CARD_HEIGHT = EXAM_PLAN_CARD_LONG_SIDE;
const HEADER_HEIGHT = 58;
const BACKGROUND_LEAD_IN_MS = 150;
const CONTENT_REVEAL_DURATION_MS = 520;
const CARD_SPRING_CONFIG = {
  damping: 14,
  stiffness: 90,
  mass: 1,
};
const WHEEL_ITEM_HEIGHT = 46;
const WHEEL_VISIBLE_ITEMS = 5;

type ExamPlanEntryParams = {
  entry?: string;
  sourceX?: string;
  sourceY?: string;
  sourceWidth?: string;
  sourceHeight?: string;
};

function parseRouteNumber(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (rawValue === undefined) return null;

  const parsedValue = Number(rawValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function BackIcon() {
  return (
    <Svg width={18} height={28} viewBox="0 0 18 28">
      <Path
        d="M14 3 4 14l10 11"
        fill="none"
        stroke="#874714"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function HistoryIcon() {
  return (
    <Svg width={29} height={29} viewBox="0 0 29 29">
      <Path
        d="M4 8v7h7M5 14a10 10 0 1 0 3-7"
        fill="none"
        stroke="#874714"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15 7v7l4 3"
        fill="none"
        stroke="#874714"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function Chevron() {
  return (
    <Svg width={12} height={20} viewBox="0 0 12 20">
      <Path
        d="m2 2 8 8-8 8"
        fill="none"
        stroke="#B9B9B9"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MenuRow({
  title,
  subtitle,
  onPress,
  loading,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
  loading?: boolean;
}) {
  return (
    <Pressable
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}
    >
      <View style={styles.menuCopy}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      {loading ? <ActivityIndicator color="#F7931E" /> : <Chevron />}
    </Pressable>
  );
}

function CalendarIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Path
        d="M4 3.5h12a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 16 17.5H4A1.5 1.5 0 0 1 2.5 16V5A1.5 1.5 0 0 1 4 3.5ZM6 2v3M14 2v3M2.5 7h15"
        fill="none"
        stroke="#A45B29"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </Svg>
  );
}

type DateParts = {
  year: number;
  month: number;
  day: number;
};

function padTwoDigits(value: number) {
  return String(value).padStart(2, "0");
}

function parseExamDate(value: string): DateParts {
  const today = new Date();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    return {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate(),
    };
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const candidate = new Date(year, month - 1, day);
  const valid =
    candidate.getFullYear() === year &&
    candidate.getMonth() === month - 1 &&
    candidate.getDate() === day;

  return valid
    ? { year, month, day }
    : {
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        day: today.getDate(),
      };
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function WheelColumn({
  values,
  value,
  suffix,
  onValueChange,
}: {
  values: number[];
  value: number;
  suffix: string;
  onValueChange: (value: number) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedIndex = Math.max(0, values.indexOf(value));

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: selectedIndex * WHEEL_ITEM_HEIGHT,
        animated: false,
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [selectedIndex]);

  useEffect(
    () => () => {
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    },
    [],
  );

  function settleOffset(offsetY: number) {
    const nextIndex = Math.max(
      0,
      Math.min(
        values.length - 1,
        Math.round(offsetY / WHEEL_ITEM_HEIGHT),
      ),
    );
    const nextValue = values[nextIndex];
    if (nextValue !== undefined && nextValue !== value) {
      onValueChange(nextValue);
    }
  }

  function settleSelection(
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) {
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    settleTimerRef.current = null;
    settleOffset(event.nativeEvent.contentOffset.y);
  }

  function scheduleSettle(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    settleTimerRef.current = setTimeout(() => settleOffset(offsetY), 90);
  }

  function cancelScheduledSettle() {
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    settleTimerRef.current = null;
  }

  return (
    <View style={styles.wheelViewport}>
      <View pointerEvents="none" style={styles.wheelSelection} />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.wheelContent}
        decelerationRate="fast"
        nestedScrollEnabled
        onMomentumScrollBegin={cancelScheduledSettle}
        onMomentumScrollEnd={settleSelection}
        onScrollEndDrag={scheduleSettle}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_HEIGHT}
      >
        {values.map((item) => (
          <View key={item} style={styles.wheelItem}>
            <Text
              style={[
                styles.wheelItemText,
                item === value && styles.wheelItemTextSelected,
              ]}
            >
              {item}
              {suffix}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function DateWheelModal({
  initialValue,
  onCancel,
  onConfirm,
}: {
  initialValue: string;
  onCancel: () => void;
  onConfirm: (value: string) => void;
}) {
  const initialDate = parseExamDate(initialValue);
  const currentYear = new Date().getFullYear();
  const firstYear = Math.min(currentYear, initialDate.year);
  const lastYear = Math.max(currentYear + 15, initialDate.year);
  const years = Array.from(
    { length: lastYear - firstYear + 1 },
    (_, index) => firstYear + index,
  );
  const months = Array.from({ length: 12 }, (_, index) => index + 1);
  const [year, setYear] = useState(initialDate.year);
  const [month, setMonth] = useState(initialDate.month);
  const [day, setDay] = useState(initialDate.day);
  const dayCount = getDaysInMonth(year, month);
  const days = Array.from({ length: dayCount }, (_, index) => index + 1);

  function changeYear(nextYear: number) {
    setYear(nextYear);
    setDay((currentDay) =>
      Math.min(currentDay, getDaysInMonth(nextYear, month)),
    );
  }

  function changeMonth(nextMonth: number) {
    setMonth(nextMonth);
    setDay((currentDay) =>
      Math.min(currentDay, getDaysInMonth(year, nextMonth)),
    );
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
      transparent
      visible
    >
      <View style={styles.dateModalRoot}>
        <Pressable
          accessibilityLabel="关闭日期选择"
          onPress={onCancel}
          style={styles.dateModalBackdrop}
        />
        <View style={styles.datePickerSheet}>
          <View style={styles.datePickerHeader}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Text style={styles.datePickerCancel}>取消</Text>
            </Pressable>
            <Text style={styles.datePickerTitle}>选择考试日期</Text>
            <Pressable
              onPress={() =>
                onConfirm(
                  `${year}-${padTwoDigits(month)}-${padTwoDigits(day)}`,
                )
              }
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Text style={styles.datePickerConfirm}>确定</Text>
            </Pressable>
          </View>

          <View style={styles.wheelsRow}>
            <WheelColumn
              onValueChange={changeYear}
              suffix="年"
              value={year}
              values={years}
            />
            <WheelColumn
              onValueChange={changeMonth}
              suffix="月"
              value={month}
              values={months}
            />
            <WheelColumn
              onValueChange={setDay}
              suffix="日"
              value={day}
              values={days}
            />
          </View>

          <Text style={styles.selectedDateText}>
            {year}年{month}月{day}日
          </Text>
        </View>
      </View>
    </Modal>
  );
}

function ExamHeroCardContent() {
  return (
    <>
      <Text style={styles.heroTitle}>考试规划</Text>
      <View style={styles.heroDots}>
        <View style={styles.heroDotRed} />
        <View style={styles.heroDotOrange} />
      </View>
      <Image
        resizeMode="contain"
        source={require("@/assets/images/exam/screen-00/asset-01.png")}
        style={styles.heroMascot}
      />
      <Text style={styles.heroDescription}>
        根据考试时间{`\n`}安排学习计划和任务
      </Text>
    </>
  );
}

export default function ExamPlanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<ExamPlanEntryParams>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const pageWidth = Math.min(width, DESIGN_WIDTH);
  const sourceX = parseRouteNumber(params.sourceX);
  const sourceY = parseRouteNumber(params.sourceY);
  const sourceWidth = parseRouteNumber(params.sourceWidth);
  const sourceHeight = parseRouteNumber(params.sourceHeight);
  const hasEntryAnimation =
    params.entry === "recommendation-card" &&
    sourceX !== null &&
    sourceY !== null &&
    sourceWidth !== null &&
    sourceHeight !== null &&
    sourceWidth > 0 &&
    sourceHeight > 0;
  const targetX = (width - HERO_WIDTH) / 2;
  const targetY = insets.top + HEADER_HEIGHT;
  const cardProgress = useSharedValue(hasEntryAnimation ? 0 : 1);
  const contentProgress = useSharedValue(hasEntryAnimation ? 0 : 1);
  const [transitionCardVisible, setTransitionCardVisible] =
    useState(hasEntryAnimation);
  const [contentInteractive, setContentInteractive] =
    useState(!hasEntryAnimation);
  const [examDate, setExamDate] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const entrySourceX = sourceX ?? targetX;
  const entrySourceY = sourceY ?? targetY;
  const entrySourceWidth = sourceWidth ?? TRANSITION_CARD_WIDTH;
  const entrySourceHeight = sourceHeight ?? TRANSITION_CARD_HEIGHT;
  const sourceCenterX = entrySourceX + entrySourceWidth / 2;
  const sourceCenterY = entrySourceY + entrySourceHeight / 2;
  const targetCenterX = targetX + HERO_WIDTH / 2;
  const targetCenterY = targetY + HERO_HEIGHT / 2;
  const initialTranslateX = hasEntryAnimation
    ? sourceCenterX - targetCenterX
    : 0;
  const initialTranslateY = hasEntryAnimation
    ? sourceCenterY - targetCenterY
    : 0;

  const transitionMoverAnimatedStyle = useAnimatedStyle(() => {
    const progress = cardProgress.value;
    const clampedProgress = Math.min(Math.max(progress, 0), 1);
    const arcOffsetX = -18 * Math.sin(Math.PI * clampedProgress);
    const translateX =
      interpolate(progress, [0, 1], [initialTranslateX, 0]) + arcOffsetX;
    const translateY = interpolate(
      progress,
      [0, 1],
      [initialTranslateY, 0],
    );

    return {
      transform: [{ translateX }, { translateY }],
    };
  });
  const transitionRotationAnimatedStyle = useAnimatedStyle(() => {
    const rotateZ = interpolate(cardProgress.value, [0, 1], [0, -90]);

    return {
      transform: [{ rotateZ: `${rotateZ}deg` }],
    };
  });
  const settledHeroAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      cardProgress.value,
      [0, 0.98, 1],
      [0, 0, 1],
      Extrapolation.CLAMP,
    ),
  }));
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      contentProgress.value,
      [0, 1],
      [0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateY: interpolate(contentProgress.value, [0, 1], [-12, 0]),
      },
    ],
  }));
  const curtainAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      contentProgress.value,
      [0, 1],
      [0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateY: interpolate(contentProgress.value, [0, 1], [-24, 0]),
      },
      {
        scaleY: interpolate(contentProgress.value, [0, 1], [0.04, 1]),
      },
    ],
  }));

  useEffect(() => {
    if (!hasEntryAnimation) return;

    let cancelled = false;

    function revealImmediately() {
      cardProgress.value = 1;
      contentProgress.value = 1;
      setTransitionCardVisible(false);
      setContentInteractive(true);
    }

    function startEntryAnimation() {
      cardProgress.value = withDelay(
        BACKGROUND_LEAD_IN_MS,
        withSpring(1, CARD_SPRING_CONFIG, (finished) => {
          if (!finished) return;

          scheduleOnRN(setTransitionCardVisible, false);
          contentProgress.value = withTiming(
            1,
            {
              duration: CONTENT_REVEAL_DURATION_MS,
              easing: Easing.out(Easing.cubic),
            },
            (contentFinished) => {
              if (contentFinished) {
                scheduleOnRN(setContentInteractive, true);
              }
            },
          );
        }),
      );
    }

    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduceMotionEnabled) => {
        if (cancelled) return;
        if (reduceMotionEnabled) {
          revealImmediately();
          return;
        }
        startEntryAnimation();
      })
      .catch(() => {
        if (!cancelled) startEntryAnimation();
      });

    return () => {
      cancelled = true;
      cancelAnimation(cardProgress);
      cancelAnimation(contentProgress);
    };
  }, [cardProgress, contentProgress, hasEntryAnimation]);

  function validateForm() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(examDate.trim())) {
      Alert.alert(
        "日期格式不正确",
        "请按照 YYYY-MM-DD 输入考试日期，例如 2026-12-20。",
      );
      return false;
    }
    if (!subject.trim()) {
      Alert.alert("还差考试科目", "请输入需要准备的考试科目。");
      return false;
    }
    return true;
  }

  async function generatePlan() {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const plan = await createExamPlan({
        subject: subject.trim(),
        examDate: examDate.trim(),
      });
      await AsyncStorage.setItem(LATEST_EXAM_PLAN_KEY, String(plan.id));
      router.push({ pathname: "/exam-plan-detail", params: { id: plan.id } });
    } catch (error) {
      Alert.alert(
        "生成失败",
        error instanceof Error ? error.message : "请稍后重试",
      );
    } finally {
      setLoading(false);
    }
  }

  async function openHistory() {
    setLoading(true);
    try {
      const plan = await getLatestExamPlan();
      await AsyncStorage.setItem(LATEST_EXAM_PLAN_KEY, String(plan.id));
      router.push({ pathname: "/exam-plan-detail", params: { id: plan.id } });
    } catch (error) {
      Alert.alert(
        "暂无历史规划",
        error instanceof Error ? error.message : "请先创建规划",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <StatusBar style="dark" />
      <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={contentInteractive}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.page, { width: pageWidth }]}>
            <Animated.View
              pointerEvents={contentInteractive ? "auto" : "none"}
              style={[styles.header, headerAnimatedStyle]}
            >
              <Pressable
                accessibilityLabel="返回"
                hitSlop={12}
                onPress={() => router.back()}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <BackIcon />
              </Pressable>
              <Pressable
                accessibilityLabel="查看历史考试规划"
                hitSlop={12}
                onPress={openHistory}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <HistoryIcon />
              </Pressable>
            </Animated.View>

            <Animated.View style={settledHeroAnimatedStyle}>
              <LinearGradient
                colors={["#FFE2B8", "#DDF2FF"]}
                end={{ x: 1, y: 1 }}
                start={{ x: 0, y: 0 }}
                style={styles.heroCard}
              >
                <ExamHeroCardContent />
              </LinearGradient>
            </Animated.View>

            <Animated.View
              pointerEvents={contentInteractive ? "auto" : "none"}
              style={[styles.curtainContent, curtainAnimatedStyle]}
            >
              <View style={styles.guideRow}>
                <Image
                  resizeMode="contain"
                  source={require("@/assets/images/exam/screen-00/asset-00.png")}
                  style={styles.guideMascot}
                />
                <View style={styles.guideBubble}>
                  <View style={styles.guideTail} />
                  <Text style={styles.guideText}>
                    快来设置你的考试时间和科目吧~
                  </Text>
                </View>
              </View>

              <View style={styles.formCard}>
                <Text style={styles.formIntro}>
                  请输入你的学习考试时间和考试科目
                </Text>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>考试时间：</Text>
                  <Pressable
                    accessibilityLabel="考试时间"
                    accessibilityRole="button"
                    onPress={() => {
                      Keyboard.dismiss();
                      setDatePickerVisible(true);
                    }}
                    style={({ pressed }) => [
                      styles.dateInput,
                      pressed && styles.dateInputPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dateInputText,
                        !examDate && styles.dateInputPlaceholder,
                      ]}
                    >
                      {examDate || "请选择考试日期"}
                    </Text>
                    <CalendarIcon />
                  </Pressable>
                </View>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>考试科目：</Text>
                  <TextInput
                    accessibilityLabel="考试科目"
                    onChangeText={setSubject}
                    placeholder="例如：英语四级"
                    placeholderTextColor="#C5C5C5"
                    style={styles.input}
                    value={subject}
                  />
                </View>
              </View>

              <Text style={styles.generatingHint}>
                小汪正在定制专属于你的考试规划……
              </Text>

              <View style={styles.menuCard}>
                <View style={styles.menuHandle} />
                <View style={styles.menuDecorationBlue} />
                <View style={styles.menuDecorationOrange} />
                <MenuRow
                  loading={loading}
                  onPress={generatePlan}
                  title="查看生成的考试复习进度规划"
                  subtitle="根据用户性格生成专属建议"
                />
                <View style={styles.menuDivider} />
                <MenuRow
                  onPress={() =>
                    Alert.alert(
                      "稍后开放",
                      "试卷重点难点分析会在下一阶段接入。",
                    )
                  }
                  title="查看分析考试重点难点"
                  subtitle="制定专属于你的答题策略"
                />
                <View style={styles.menuDivider} />
                <MenuRow
                  onPress={() =>
                    Alert.alert(
                      "稍后开放",
                      "思维导图知识框架会在下一阶段接入。",
                    )
                  }
                  title="查看思维导图知识框架"
                  subtitle="辅助记忆和理解"
                />
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {transitionCardVisible ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.transitionMover,
            {
              left: targetCenterX - TRANSITION_CARD_WIDTH / 2,
              top: targetCenterY - TRANSITION_CARD_HEIGHT / 2,
            },
            transitionMoverAnimatedStyle,
          ]}
        >
          <Animated.View
            style={[
              styles.transitionRotatingCard,
              transitionRotationAnimatedStyle,
            ]}
          >
            <View style={styles.transitionLandscapeCanvas}>
              <LinearGradient
                colors={["#FFE2B8", "#DDF2FF"]}
                end={{ x: 1, y: 1 }}
                start={{ x: 0, y: 0 }}
                style={styles.transitionFaceFill}
              >
                <ExamHeroCardContent />
              </LinearGradient>
            </View>
          </Animated.View>
        </Animated.View>
      ) : null}

      {datePickerVisible ? (
        <DateWheelModal
          initialValue={examDate}
          onCancel={() => setDatePickerVisible(false)}
          onConfirm={(value) => {
            setExamDate(value);
            setDatePickerVisible(false);
          }}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFF8F3" },
  safeArea: { flex: 1 },
  scrollContent: { alignItems: "center" },
  page: {
    minHeight: 850,
    paddingHorizontal: PAGE_HORIZONTAL_PADDING,
    paddingBottom: 28,
  },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroCard: {
    position: "relative",
    width: HERO_WIDTH,
    height: HERO_HEIGHT,
    alignSelf: "center",
    overflow: "hidden",
    borderRadius: EXAM_PLAN_CARD_RADIUS,
    boxShadow: "0 5px 9px rgba(96, 61, 30, 0.18)",
  },
  curtainContent: {
    transformOrigin: "top center",
  },
  transitionMover: {
    position: "absolute",
    width: TRANSITION_CARD_WIDTH,
    height: TRANSITION_CARD_HEIGHT,
    zIndex: 50,
    elevation: 50,
  },
  transitionRotatingCard: {
    width: TRANSITION_CARD_WIDTH,
    height: TRANSITION_CARD_HEIGHT,
    overflow: "hidden",
    backgroundColor: "#FFE3BF",
    borderRadius: EXAM_PLAN_CARD_RADIUS,
    boxShadow: "0 5px 10px rgba(70, 45, 24, 0.22)",
  },
  transitionLandscapeCanvas: {
    position: "absolute",
    left: (TRANSITION_CARD_WIDTH - HERO_WIDTH) / 2,
    top: (TRANSITION_CARD_HEIGHT - HERO_HEIGHT) / 2,
    width: HERO_WIDTH,
    height: HERO_HEIGHT,
    transform: [{ rotateZ: "90deg" }],
  },
  transitionFaceFill: {
    flex: 1,
  },
  heroTitle: {
    position: "absolute",
    top: 22,
    left: 20,
    color: "#161616",
    fontSize: 20,
    fontWeight: "500",
  },
  heroDots: { position: "absolute", top: 21, right: 22, width: 38, height: 31 },
  heroDotRed: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: "#C9363C",
  },
  heroDotOrange: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: "#FFA546",
  },
  heroMascot: {
    position: "absolute",
    left: 15,
    bottom: 9,
    width: 52,
    height: 52,
  },
  heroDescription: {
    position: "absolute",
    right: 24,
    bottom: 14,
    color: "#1B1B1B",
    fontSize: 15,
    lineHeight: 21,
  },
  guideRow: { height: 94, flexDirection: "row", alignItems: "center" },
  guideMascot: { width: 75, height: 75 },
  guideBubble: {
    position: "relative",
    flex: 1,
    height: 44,
    marginLeft: 12,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 17,
    backgroundColor: "#FFF6EB",
    boxShadow: "0 3px 8px rgba(90, 55, 26, 0.12)",
  },
  guideTail: {
    position: "absolute",
    left: -10,
    top: 17,
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderRightWidth: 11,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderRightColor: "#FFF6EB",
  },
  guideText: { color: "#1B1B1B", fontSize: 14 },
  formCard: {
    minHeight: 142,
    marginLeft: 62,
    paddingHorizontal: 15,
    paddingTop: 13,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    boxShadow: "0 4px 9px rgba(111, 72, 39, 0.14)",
  },
  formIntro: { color: "#242424", fontSize: 14 },
  fieldRow: { height: 47, flexDirection: "row", alignItems: "center" },
  fieldLabel: { width: 86, color: "#A7A7A7", fontSize: 14 },
  input: {
    flex: 1,
    height: 36,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#D8D8D8",
    borderRadius: 14,
    color: "#242424",
    fontSize: 14,
  },
  dateInput: {
    flex: 1,
    height: 36,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#D8D8D8",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },
  dateInputPressed: {
    backgroundColor: "#FFF7ED",
  },
  dateInputText: {
    color: "#242424",
    fontSize: 14,
  },
  dateInputPlaceholder: {
    color: "#C5C5C5",
  },
  dateModalRoot: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  dateModalBackdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(35, 24, 17, 0.42)",
  },
  datePickerSheet: {
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: "#FFFDFC",
    boxShadow: "0 12px 30px rgba(67, 39, 19, 0.24)",
  },
  datePickerHeader: {
    height: 58,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F0DED0",
  },
  datePickerTitle: {
    color: "#242424",
    fontSize: 17,
    fontWeight: "600",
  },
  datePickerCancel: {
    color: "#8E8E8E",
    fontSize: 15,
  },
  datePickerConfirm: {
    color: "#F28A32",
    fontSize: 15,
    fontWeight: "600",
  },
  wheelsRow: {
    height: WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_ITEMS,
    paddingHorizontal: 10,
    flexDirection: "row",
  },
  wheelViewport: {
    flex: 1,
    height: WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_ITEMS,
    overflow: "hidden",
  },
  wheelSelection: {
    position: "absolute",
    top: WHEEL_ITEM_HEIGHT * 2,
    right: 4,
    left: 4,
    height: WHEEL_ITEM_HEIGHT,
    borderRadius: 12,
    backgroundColor: "#FFF0DF",
  },
  wheelContent: {
    paddingVertical: WHEEL_ITEM_HEIGHT * 2,
  },
  wheelItem: {
    height: WHEEL_ITEM_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  wheelItemText: {
    color: "#A8A8A8",
    fontSize: 15,
  },
  wheelItemTextSelected: {
    color: "#6D3E1F",
    fontSize: 17,
    fontWeight: "600",
  },
  selectedDateText: {
    marginBottom: 18,
    color: "#A45B29",
    fontSize: 14,
    textAlign: "center",
  },
  generatingHint: {
    marginTop: 17,
    marginLeft: 50,
    color: "#A45B29",
    fontSize: 15,
  },
  menuCard: {
    position: "relative",
    minHeight: 314,
    marginTop: 16,
    overflow: "hidden",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#FFFFFF",
    paddingTop: 22,
    paddingHorizontal: 20,
  },
  menuHandle: {
    position: "absolute",
    top: 3,
    left: "50%",
    width: 42,
    height: 3,
    marginLeft: -21,
    borderRadius: 2,
    backgroundColor: "#D7D7D7",
  },
  menuDecorationBlue: {
    position: "absolute",
    top: -33,
    right: 31,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#DDF2FF",
  },
  menuDecorationOrange: {
    position: "absolute",
    top: -6,
    right: -25,
    width: 75,
    height: 75,
    borderRadius: 38,
    backgroundColor: "#FFDDAA",
  },
  menuRow: {
    minHeight: 73,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuCopy: { flex: 1, paddingRight: 16 },
  menuTitle: { color: "#222222", fontSize: 16, fontWeight: "500" },
  menuSubtitle: { marginTop: 5, color: "#A4A4A4", fontSize: 13 },
  menuDivider: { height: StyleSheet.hairlineWidth, backgroundColor: "#E0E0E0" },
  pressed: { opacity: 0.68 },
});
