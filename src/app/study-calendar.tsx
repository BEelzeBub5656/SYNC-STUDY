import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import {
  getStudyCheckInSummary,
  type StudyCheckInSummary,
} from "@/lib/study-check-in-api";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
const QUOTES = [
  "你难道不想放手一搏吗？——《盗梦空间》",
  "把今天的努力，变成明天的底气。",
  "慢慢来，但不要停下来。",
];

function formatMonth(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function buildCalendarCells(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const leadingEmptyCells = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return [
    ...Array.from({ length: leadingEmptyCells }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
}

function ordinal(value: number) {
  const lastTwoDigits = value % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) return `${value}th`;
  if (value % 10 === 1) return `${value}st`;
  if (value % 10 === 2) return `${value}nd`;
  if (value % 10 === 3) return `${value}rd`;
  return `${value}th`;
}

function StatScribble({ color, variant }: { color: string; variant: "left" | "right" }) {
  const path =
    variant === "left"
      ? "M8 80 C22 55 34 25 44 9 C40 35 35 58 38 82 C50 58 62 32 72 16 C65 43 60 66 63 84 C72 70 80 57 88 46"
      : "M9 82 C27 62 43 42 58 18 C48 47 42 66 43 84 C58 65 73 43 87 20 C76 50 70 70 71 86";
  return (
    <Svg pointerEvents="none" style={styles.statScribble} viewBox="0 0 96 92">
      <Path
        d={path}
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={15}
      />
    </Svg>
  );
}

export default function StudyCalendarScreen() {
  const router = useRouter();
  const [displayMonth, setDisplayMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [summary, setSummary] = useState<StudyCheckInSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    let active = true;

    getStudyCheckInSummary(formatMonth(displayMonth))
      .then((result) => {
        if (active) setSummary(result);
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            requestError instanceof Error ? requestError.message : "学习日历加载失败",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [displayMonth]);

  const calendarCells = useMemo(
    () => buildCalendarCells(displayMonth),
    [displayMonth],
  );
  const checkedDays = useMemo(
    () => new Set(summary?.checkedDates.map((date) => Number(date.slice(-2))) ?? []),
    [summary],
  );

  function moveMonth(offset: number) {
    setLoading(true);
    setError("");
    setDisplayMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + offset, 1),
    );
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="返回"
            hitSlop={12}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>学习日历</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <ImageBackground
            source={require("@/assets/images/check-in/calendar-quote.jpg")}
            imageStyle={styles.heroImage}
            resizeMode="cover"
            style={styles.heroCard}
          >
            <Text style={styles.streakLabel}>
              连续签到{summary?.continuousDays ?? 0}天
            </Text>
            <Text style={styles.ordinalText}>{ordinal(summary?.totalDays ?? 0)}</Text>
            <Pressable
              accessibilityLabel="分享学习日历"
              style={({ pressed }) => [styles.shareButton, pressed && styles.pressed]}
            >
              <Text style={styles.shareIcon}>↗</Text>
            </Pressable>
            <View style={styles.quoteBlock}>
              <Text style={styles.englishQuote}>Dont you want to take a leap of faith？</Text>
              <Text style={styles.chineseQuote}>{QUOTES[quoteIndex]}</Text>
            </View>
            <Pressable
              onPress={() => setQuoteIndex((current) => (current + 1) % QUOTES.length)}
              style={({ pressed }) => [styles.switchButton, pressed && styles.pressed]}
            >
              <Text style={styles.switchText}>换一换</Text>
            </Pressable>
          </ImageBackground>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, styles.streakCard]}>
              <Text style={styles.statLabel}>连续打卡</Text>
              <View style={styles.statNumberRow}>
                <Text style={styles.statNumber}>{summary?.continuousDays ?? 0}</Text>
                <Text style={styles.statUnit}>天</Text>
              </View>
              <StatScribble color="#FFB966" variant="left" />
            </View>
            <View style={[styles.statCard, styles.totalCard]}>
              <Text style={styles.statLabel}>累计打卡</Text>
              <View style={styles.statNumberRow}>
                <Text style={styles.statNumber}>{summary?.totalDays ?? 0}</Text>
                <Text style={styles.statUnit}>天</Text>
              </View>
              <StatScribble color="#8DC2EA" variant="right" />
            </View>
          </View>

          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <Pressable hitSlop={10} onPress={() => moveMonth(-1)}>
                <Text style={styles.monthArrow}>‹</Text>
              </Pressable>
              <Text style={styles.monthTitle}>
                {displayMonth.getFullYear()}年{displayMonth.getMonth() + 1}月
              </Text>
              <Pressable hitSlop={10} onPress={() => moveMonth(1)}>
                <Text style={styles.monthArrow}>›</Text>
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {WEEKDAYS.map((day) => (
                <Text key={day} style={styles.weekDay}>
                  {day}
                </Text>
              ))}
            </View>

            {loading ? (
              <ActivityIndicator color="#F4A03A" style={styles.loading} />
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              <View style={styles.daysGrid}>
                {calendarCells.map((day, index) => (
                  <View key={`${day ?? "empty"}-${index}`} style={styles.dayCell}>
                    {day ? (
                      <View
                        style={[
                          styles.dayCircle,
                          checkedDays.has(day) && styles.checkedDayCircle,
                        ]}
                      >
                        <Text style={styles.dayText}>{day}</Text>
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            )}

            <View style={styles.legend}>
              <View style={styles.legendDot} />
              <Text style={styles.legendText}>当日已打卡</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFF3E5",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    height: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  backButton: {
    width: 42,
    height: 42,
    justifyContent: "center",
  },
  backIcon: {
    color: "#7A3C10",
    fontSize: 38,
    fontWeight: "300",
    lineHeight: 40,
  },
  headerTitle: {
    color: "#111111",
    fontSize: 20,
    fontWeight: "500",
  },
  headerSpacer: {
    width: 42,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  heroCard: {
    width: "100%",
    aspectRatio: 362 / 421,
    overflow: "hidden",
    borderRadius: 24,
    boxShadow: "0 3px 8px rgba(58, 45, 31, 0.22)",
  },
  heroImage: {
    borderRadius: 24,
  },
  streakLabel: {
    position: "absolute",
    top: 20,
    left: 20,
    color: "#171717",
    fontSize: 14,
  },
  ordinalText: {
    position: "absolute",
    top: 49,
    left: 20,
    color: "#080808",
    fontSize: 46,
    lineHeight: 52,
  },
  shareButton: {
    position: "absolute",
    top: 19,
    right: 20,
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: "rgba(255, 247, 232, 0.92)",
    boxShadow: "0 3px 6px rgba(67, 48, 29, 0.25)",
  },
  shareIcon: {
    color: "#8F4B11",
    fontSize: 24,
    fontWeight: "600",
  },
  quoteBlock: {
    position: "absolute",
    top: "45%",
    left: 20,
    right: 20,
    alignItems: "center",
  },
  englishQuote: {
    color: "#121212",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  chineseQuote: {
    marginTop: 12,
    color: "#1A1A1A",
    fontSize: 14,
    textAlign: "center",
  },
  switchButton: {
    position: "absolute",
    left: "36%",
    bottom: 29,
    width: "28%",
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "rgba(255, 246, 225, 0.86)",
    boxShadow: "0 3px 5px rgba(74, 55, 36, 0.24)",
  },
  switchText: {
    color: "#C7A78A",
    fontSize: 15,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  statCard: {
    flex: 1,
    height: 111,
    overflow: "hidden",
    padding: 17,
    borderRadius: 13,
  },
  streakCard: {
    backgroundColor: "#FFD39A",
  },
  totalCard: {
    backgroundColor: "#C5E5FA",
  },
  statLabel: {
    zIndex: 1,
    color: "#1C1C1C",
    fontSize: 14,
  },
  statNumberRow: {
    zIndex: 1,
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 5,
  },
  statNumber: {
    color: "#050505",
    fontSize: 43,
    lineHeight: 48,
  },
  statUnit: {
    marginLeft: 3,
    color: "#171717",
    fontSize: 22,
  },
  statScribble: {
    position: "absolute",
    right: -7,
    bottom: -10,
    width: 105,
    height: 96,
  },
  calendarCard: {
    minHeight: 290,
    marginTop: 20,
    paddingHorizontal: 14,
    paddingTop: 11,
    paddingBottom: 10,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
  },
  calendarHeader: {
    height: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  monthArrow: {
    color: "#8B8B8B",
    fontSize: 25,
    lineHeight: 26,
  },
  monthTitle: {
    color: "#1B1B1B",
    fontSize: 13,
  },
  weekRow: {
    flexDirection: "row",
    marginTop: 5,
  },
  weekDay: {
    width: `${100 / 7}%`,
    color: "#C87526",
    fontSize: 13,
    textAlign: "center",
  },
  loading: {
    height: 175,
  },
  errorText: {
    height: 175,
    paddingHorizontal: 20,
    paddingTop: 50,
    color: "#B85E00",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 7,
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircle: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  checkedDayCircle: {
    backgroundColor: "#FFD095",
  },
  dayText: {
    color: "#191919",
    fontSize: 12,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 2,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FFD095",
  },
  legendText: {
    color: "#3D3D3D",
    fontSize: 12,
  },
  pressed: {
    opacity: 0.68,
  },
});
