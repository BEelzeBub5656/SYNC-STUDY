import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import {
  createExamPlan,
  getLatestExamPlan,
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

export default function ExamPlanScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const pageWidth = Math.min(width, DESIGN_WIDTH);
  const [examDate, setExamDate] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);

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
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.page, { width: pageWidth }]}>
            <View style={styles.header}>
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
            </View>

            <LinearGradient
              colors={["#FFE2B8", "#DDF2FF"]}
              end={{ x: 1, y: 1 }}
              start={{ x: 0, y: 0 }}
              style={styles.heroCard}
            >
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
            </LinearGradient>

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
                <TextInput
                  accessibilityLabel="考试时间"
                  autoCapitalize="none"
                  onChangeText={setExamDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#C5C5C5"
                  style={styles.input}
                  value={examDate}
                />
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
                  Alert.alert("稍后开放", "试卷重点难点分析会在下一阶段接入。")
                }
                title="查看分析考试重点难点"
                subtitle="制定专属于你的答题策略"
              />
              <View style={styles.menuDivider} />
              <MenuRow
                onPress={() =>
                  Alert.alert("稍后开放", "思维导图知识框架会在下一阶段接入。")
                }
                title="查看思维导图知识框架"
                subtitle="辅助记忆和理解"
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFF8F3" },
  safeArea: { flex: 1 },
  scrollContent: { alignItems: "center" },
  page: { minHeight: 850, paddingHorizontal: 20, paddingBottom: 28 },
  header: {
    height: 58,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroCard: {
    position: "relative",
    height: 176,
    marginHorizontal: 26,
    overflow: "hidden",
    borderRadius: 24,
    boxShadow: "0 5px 9px rgba(96, 61, 30, 0.18)",
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
