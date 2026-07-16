import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import {
  ExamPlan,
  getExamPlan,
  LATEST_EXAM_PLAN_KEY,
} from "@/lib/exam-plan-api";

const DESIGN_WIDTH = 402;

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

export default function ExamPlanDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { width } = useWindowDimensions();
  const pageWidth = Math.min(width, DESIGN_WIDTH);
  const [plan, setPlan] = useState<ExamPlan | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPlan() {
      try {
        const storedId =
          params.id ?? (await AsyncStorage.getItem(LATEST_EXAM_PLAN_KEY));
        const id = Number(storedId);
        if (!Number.isInteger(id) || id <= 0) {
          throw new Error("没有找到考试规划，请先创建一份规划。");
        }
        const response = await getExamPlan(id);
        if (active) setPlan(response);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "加载失败");
        }
      }
    }

    void loadPlan();
    return () => {
      active = false;
    };
  }, [params.id]);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.page, { width: pageWidth }]}>
            <View style={styles.blueHeader}>
              <View style={styles.decorCircleOne} />
              <View style={styles.decorCircleTwo} />
              <View style={styles.decorSquareOne} />
              <View style={styles.decorSquareTwo} />
              <View style={styles.titleRow}>
                <Pressable
                  accessibilityLabel="返回"
                  hitSlop={12}
                  onPress={() => router.back()}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <BackIcon />
                </Pressable>
                <Text style={styles.title}>考试复习进度规划</Text>
                <View style={styles.headerSpacer} />
              </View>
              <View style={styles.guideRow}>
                <Image
                  resizeMode="contain"
                  source={require("@/assets/images/exam/screen-00/asset-00.png")}
                  style={styles.mascot}
                />
                <View style={styles.guideBubble}>
                  <View style={styles.guideTail} />
                  <Text style={styles.guideText}>
                    这是小汪为你生成的考试规划~
                  </Text>
                </View>
              </View>
            </View>

            <LinearGradient
              colors={["#F4E9FF", "#DDEBFF"]}
              end={{ x: 1, y: 1 }}
              start={{ x: 0, y: 0 }}
              style={styles.planCard}
            >
              {!plan && !error ? (
                <View style={styles.centerState}>
                  <ActivityIndicator size="large" color="#7A78C9" />
                  <Text style={styles.loadingText}>正在加载专属规划…</Text>
                </View>
              ) : null}
              {error ? (
                <View style={styles.centerState}>
                  <Text style={styles.errorTitle}>规划加载失败</Text>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}
              {plan ? (
                <View style={styles.planContent}>
                  <View style={styles.planHeadingRow}>
                    <View>
                      <Text style={styles.subject}>{plan.subject}</Text>
                      <Text style={styles.examDate}>
                        考试日期 {plan.examDate}
                      </Text>
                    </View>
                    <View style={styles.daysBadge}>
                      <Text style={styles.daysNumber}>
                        {plan.remainingDays}
                      </Text>
                      <Text style={styles.daysLabel}>天</Text>
                    </View>
                  </View>
                  <Text style={styles.progressLabel}>
                    当前复习进度 {plan.progressPercent}%
                  </Text>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${plan.progressPercent}%` },
                      ]}
                    />
                  </View>

                  {plan.phases.map((phase, index) => (
                    <View
                      key={`${phase.title}-${phase.startDate}`}
                      style={styles.phaseRow}
                    >
                      <View style={styles.timelineColumn}>
                        <View
                          style={[
                            styles.timelineDot,
                            index === 0 && styles.timelineDotActive,
                          ]}
                        />
                        {index < plan.phases.length - 1 ? (
                          <View style={styles.timelineLine} />
                        ) : null}
                      </View>
                      <View style={styles.phaseCard}>
                        <View style={styles.phaseHeader}>
                          <Text style={styles.phaseTitle}>{phase.title}</Text>
                          <Text style={styles.phaseStatus}>{phase.status}</Text>
                        </View>
                        <Text style={styles.phaseDate}>
                          {phase.startDate} 至 {phase.endDate}
                        </Text>
                        {phase.tasks.map((task) => (
                          <View key={task} style={styles.taskRow}>
                            <View style={styles.taskCheck} />
                            <Text style={styles.taskText}>{task}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}
            </LinearGradient>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFF8F3" },
  safeArea: { flex: 1 },
  scrollContent: { alignItems: "center" },
  page: { minHeight: 874 },
  blueHeader: {
    position: "relative",
    height: 205,
    overflow: "hidden",
    backgroundColor: "#D7EDFF",
  },
  titleRow: {
    height: 70,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 2,
  },
  title: { color: "#191919", fontSize: 19, fontWeight: "500" },
  headerSpacer: { width: 18 },
  decorCircleOne: {
    position: "absolute",
    top: -44,
    right: -24,
    width: 112,
    height: 112,
    borderWidth: 18,
    borderColor: "#91C6EB",
    borderRadius: 56,
  },
  decorCircleTwo: {
    position: "absolute",
    top: 73,
    left: -15,
    width: 55,
    height: 55,
    borderWidth: 11,
    borderColor: "#91C6EB",
    borderRadius: 28,
  },
  decorSquareOne: {
    position: "absolute",
    top: 13,
    left: 71,
    width: 20,
    height: 20,
    backgroundColor: "#91C6EB",
    transform: [{ rotate: "24deg" }],
  },
  decorSquareTwo: {
    position: "absolute",
    top: 91,
    right: 34,
    width: 26,
    height: 26,
    borderWidth: 5,
    borderColor: "#91C6EB",
    transform: [{ rotate: "18deg" }],
  },
  guideRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 2,
  },
  mascot: { width: 91, height: 91 },
  guideBubble: {
    position: "relative",
    flex: 1,
    height: 48,
    marginLeft: 18,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: "#FFF8F3",
    boxShadow: "0 4px 9px rgba(70, 65, 90, 0.15)",
  },
  guideTail: {
    position: "absolute",
    left: -10,
    top: 18,
    width: 0,
    height: 0,
    borderTopWidth: 7,
    borderBottomWidth: 7,
    borderRightWidth: 11,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderRightColor: "#FFF8F3",
  },
  guideText: { color: "#222222", fontSize: 14 },
  planCard: {
    minHeight: 620,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 30,
    paddingHorizontal: 18,
    paddingVertical: 22,
    borderRadius: 24,
    boxShadow: "0 4px 10px rgba(83, 66, 109, 0.16)",
  },
  centerState: {
    minHeight: 500,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
  },
  loadingText: { marginTop: 14, color: "#6E668A", fontSize: 15 },
  errorTitle: { color: "#824E67", fontSize: 18, fontWeight: "700" },
  errorText: {
    marginTop: 10,
    color: "#6E668A",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  planContent: { flex: 1 },
  planHeadingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subject: { color: "#28233A", fontSize: 23, fontWeight: "700" },
  examDate: { marginTop: 5, color: "#746C88", fontSize: 13 },
  daysBadge: {
    width: 64,
    height: 64,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "baseline",
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.78)",
  },
  daysNumber: { color: "#F08A36", fontSize: 26, fontWeight: "700" },
  daysLabel: { color: "#9A765C", fontSize: 12 },
  progressLabel: { marginTop: 19, color: "#625B77", fontSize: 13 },
  progressTrack: {
    height: 8,
    marginTop: 8,
    overflow: "hidden",
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.75)",
  },
  progressFill: { height: "100%", borderRadius: 4, backgroundColor: "#8A84D6" },
  phaseRow: { marginTop: 18, flexDirection: "row" },
  timelineColumn: { width: 24, alignItems: "center" },
  timelineDot: {
    width: 13,
    height: 13,
    borderWidth: 3,
    borderColor: "#AAA4D4",
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
  },
  timelineDotActive: { borderColor: "#F29B54", backgroundColor: "#FFE2B8" },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 112,
    backgroundColor: "rgba(146,139,194,0.45)",
  },
  phaseCard: {
    flex: 1,
    padding: 13,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  phaseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  phaseTitle: { color: "#302A48", fontSize: 17, fontWeight: "700" },
  phaseStatus: { color: "#F08A36", fontSize: 12 },
  phaseDate: { marginTop: 3, marginBottom: 8, color: "#8A8498", fontSize: 11 },
  taskRow: { minHeight: 25, flexDirection: "row", alignItems: "flex-start" },
  taskCheck: {
    width: 12,
    height: 12,
    marginTop: 3,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: "#9D96C8",
    borderRadius: 3,
  },
  taskText: { flex: 1, color: "#4D475E", fontSize: 13, lineHeight: 18 },
  pressed: { opacity: 0.68 },
});
