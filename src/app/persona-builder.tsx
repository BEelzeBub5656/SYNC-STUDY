import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { savePersonaAnswers, type PersonaAnswers } from "@/lib/persona-profile";

const DESIGN_WIDTH = 402;
const STAGE_WIDTH = 362;

type PersonaStep = {
  title: string;
  description?: string;
  tags: string[];
};

type TagPlacement = {
  left: number;
  top: number;
  width: number;
  rotation: number;
};

const STEPS: PersonaStep[] = [
  {
    title: "Step1:选择你当前的学习阶段\n与核心目标",
    description: "为了给您提供个性化服务，我们将为您进行分类选择",
    tags: [
      "学科知识点",
      "考试",
      "项目实践",
      "校招跳槽",
      "考研",
      "考职业证书",
      "职场提升",
      "在校大学生",
    ],
  },
  {
    title: "Step2:你更倾向于哪种学习方\n式？",
    tags: ["小组讨论", "思维导图", "时间管理", "实操练习", "互动练习", "文字阅读", "视频课程"],
  },
  {
    title: "Step3:什么因素最制约你的学习\n或职业发展？",
    tags: [
      "职业方向模糊",
      "知识体系零散",
      "缺乏资源",
      "缺乏学习氛围",
      "缺乏人脉",
      "效率不高",
      "外界因素",
      "时间碎片化",
      "缺乏动力",
      "拖延",
      "知识点难懂",
    ],
  },
  {
    title: "Step4:如果要提升自己，你觉得现\n在最大的挑战是什么？",
    tags: ["精力分散", "没有实践平台", "缺乏优质资源", "目标太杂", "基础知识薄弱", "专业技能不足", "容易被外界影响"],
  },
  {
    title: "Step5:你希望通过AI学习搭子获\n得哪些具体的帮助？",
    tags: ["进度监督", "实践指导", "习惯养成", "个性化支持", "技能提升", "规划制定", "问题解答", "职业衔接与能力匹配"],
  },
];

const TAG_COLORS = ["#F7967C", "#8AC4F3", "#B7D58A", "#FFC885", "#FFD29B", "#CEA1F5"];

const TAG_LAYOUTS: TagPlacement[][] = [
  [
    { left: 4, top: 119, width: 145, rotation: 31 },
    { left: 103, top: 105, width: 100, rotation: 3 },
    { left: 178, top: 82, width: 111, rotation: 56 },
    { left: 239, top: 111, width: 118, rotation: -67 },
    { left: 3, top: 211, width: 83, rotation: 0 },
    { left: 91, top: 143, width: 137, rotation: -35 },
    { left: 205, top: 202, width: 135, rotation: 34 },
    { left: 25, top: 260, width: 212, rotation: 0 },
  ],
  [
    { left: 5, top: 150, width: 138, rotation: -31 },
    { left: 101, top: 111, width: 112, rotation: 8 },
    { left: 182, top: 39, width: 109, rotation: 56 },
    { left: 238, top: 111, width: 118, rotation: -67 },
    { left: 112, top: 161, width: 120, rotation: -36 },
    { left: 207, top: 200, width: 136, rotation: 33 },
    { left: 24, top: 255, width: 212, rotation: 0 },
  ],
  [
    { left: 7, top: 76, width: 153, rotation: -15 },
    { left: 56, top: 124, width: 138, rotation: -14 },
    { left: 104, top: 142, width: 113, rotation: 7 },
    { left: 178, top: 27, width: 116, rotation: 57 },
    { left: 237, top: 110, width: 121, rotation: -67 },
    { left: 106, top: 178, width: 130, rotation: -35 },
    { left: 5, top: 151, width: 121, rotation: 29 },
    { left: 146, top: 205, width: 133, rotation: -34 },
    { left: 210, top: 215, width: 136, rotation: 34 },
    { left: 3, top: 245, width: 82, rotation: 0 },
    { left: 25, top: 286, width: 213, rotation: 0 },
  ],
  [
    { left: 4, top: 125, width: 141, rotation: 31 },
    { left: 107, top: 91, width: 155, rotation: -7 },
    { left: 231, top: 80, width: 122, rotation: -69 },
    { left: 3, top: 218, width: 88, rotation: 0 },
    { left: 104, top: 157, width: 137, rotation: -35 },
    { left: 207, top: 198, width: 139, rotation: 34 },
    { left: 24, top: 260, width: 212, rotation: 0 },
  ],
  [
    { left: 3, top: 137, width: 135, rotation: 31 },
    { left: 95, top: 111, width: 116, rotation: 7 },
    { left: 178, top: 42, width: 112, rotation: 57 },
    { left: 239, top: 111, width: 119, rotation: -68 },
    { left: 2, top: 226, width: 93, rotation: 0 },
    { left: 104, top: 166, width: 127, rotation: -35 },
    { left: 208, top: 207, width: 136, rotation: 34 },
    { left: 25, top: 269, width: 235, rotation: 0 },
  ],
];

export default function PersonaBuilderScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const pageWidth = Math.min(width, DESIGN_WIDTH);
  const stageScale = Math.min((pageWidth - 40) / STAGE_WIDTH, 1);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<PersonaAnswers>(() => STEPS.map(() => []));
  const [saving, setSaving] = useState(false);
  const step = STEPS[stepIndex];
  const selectedTags = answers[stepIndex];
  const canContinue = selectedTags.length > 0 && !saving;

  function toggleTag(tag: string) {
    setAnswers((current) =>
      current.map((answer, index) =>
        index === stepIndex
          ? answer.includes(tag)
            ? answer.filter((item) => item !== tag)
            : [...answer, tag]
          : answer,
      ),
    );
  }

  function goBack() {
    if (stepIndex > 0) {
      setStepIndex((current) => current - 1);
      return;
    }
    router.back();
  }

  async function continueFlow() {
    if (!canContinue) return;
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((current) => current + 1);
      return;
    }

    setSaving(true);
    try {
      await savePersonaAnswers(answers);
      router.replace({ pathname: "/persona", params: { from: "builder" } });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />
      <View style={[styles.page, { width: pageWidth }]}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel={stepIndex === 0 ? "返回注册" : "上一步"}
            hitSlop={12}
            onPress={goBack}
            style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="跳过人物画像构建"
            hitSlop={10}
            onPress={() => router.replace("/(tabs)/study")}
            style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}
          >
            <Text style={styles.skipText}>跳过</Text>
          </Pressable>
        </View>

        <View style={styles.intro}>
          <Text style={styles.title}>{step.title}</Text>
          <View style={styles.descriptionSlot}>
            {step.description ? <Text style={styles.description}>{step.description}</Text> : null}
          </View>
        </View>

        <View style={styles.progressRow}>
          {STEPS.map((_, index) => (
            <View
              key={index}
              style={[styles.progressSegment, index <= stepIndex && styles.progressSegmentActive]}
            />
          ))}
        </View>

        <View style={[styles.tagStage, { width: STAGE_WIDTH * stageScale }]}>
          {step.tags.map((tag, index) => {
            const placement = TAG_LAYOUTS[stepIndex][index];
            const selected = selectedTags.includes(tag);
            return (
              <Pressable
                key={tag}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={tag}
                onPress={() => toggleTag(tag)}
                style={({ pressed }) => [
                  styles.tag,
                  {
                    left: placement.left * stageScale,
                    top: placement.top * stageScale,
                    width: placement.width * stageScale,
                    height: 47 * stageScale,
                    borderRadius: 24 * stageScale,
                    backgroundColor: TAG_COLORS[index % TAG_COLORS.length],
                    transform: [{ rotate: `${placement.rotation}deg` }],
                    zIndex: selected ? 20 : index + 1,
                  },
                  selected && styles.tagSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.tagText, { fontSize: 16 * stageScale }]}>{tag}</Text>
                {selected ? (
                  <View style={styles.selectedMark}>
                    <Text style={styles.selectedMarkText}>✓</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.footer}>
          {stepIndex > 0 && stepIndex < STEPS.length - 1 ? (
            <Pressable
              accessibilityLabel="上一步"
              onPress={() => setStepIndex((current) => current - 1)}
              style={({ pressed }) => [styles.previousButton, pressed && styles.pressed]}
            >
              <Text style={styles.previousText}>上一步</Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityLabel={stepIndex === STEPS.length - 1 ? "生成并进入人物画像" : "下一步"}
            disabled={!canContinue}
            onPress={continueFlow}
            style={({ pressed }) => [
              styles.nextButton,
              stepIndex > 0 && stepIndex < STEPS.length - 1 && styles.nextButtonWithPrevious,
              !canContinue && styles.buttonDisabled,
              pressed && canContinue && styles.pressed,
            ]}
          >
            {saving ? (
              <ActivityIndicator color="#7A3C10" size="small" />
            ) : (
              <Text style={styles.nextText}>{stepIndex === STEPS.length - 1 ? "进入" : "下一张"}</Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#FCF1E4",
  },
  page: {
    flex: 1,
    alignItems: "center",
  },
  header: {
    width: "100%",
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  headerButton: {
    width: 40,
    height: 44,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  backText: {
    color: "#333333",
    fontSize: 39,
    lineHeight: 42,
    fontWeight: "300",
  },
  skipButton: {
    minWidth: 44,
    height: 40,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  skipText: {
    color: "#727272",
    fontSize: 15,
  },
  intro: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 58,
  },
  title: {
    minHeight: 52,
    color: "#7A3C10",
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "700",
    textAlign: "center",
  },
  descriptionSlot: {
    height: 73,
    alignItems: "center",
    justifyContent: "center",
  },
  description: {
    color: "#88817D",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  progressRow: {
    width: 322,
    height: 8,
    flexDirection: "row",
    gap: 5,
  },
  progressSegment: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  progressSegmentActive: {
    backgroundColor: "#F59622",
  },
  tagStage: {
    position: "relative",
    height: 382,
    transform: [{ translateY: 74 }],
  },
  tag: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  tagSelected: {
    borderColor: "#FFFFFF",
    boxShadow: "0 5px 12px rgba(109, 61, 24, 0.24)",
    elevation: 5,
  },
  tagText: {
    paddingHorizontal: 8,
    color: "#FFFFFF",
    fontWeight: "700",
    textAlign: "center",
  },
  selectedMark: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 19,
    height: 19,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#F59622",
  },
  selectedMarkText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  footer: {
    position: "absolute",
    right: 40,
    bottom: 136,
    left: 40,
    height: 45,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  previousButton: {
    width: 102,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
    backgroundColor: "#FFFFFF",
  },
  previousText: {
    color: "#FFC885",
    fontSize: 16,
  },
  nextButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
    backgroundColor: "#FFD29B",
  },
  nextButtonWithPrevious: {
    flex: 0,
    width: 200,
  },
  nextText: {
    color: "#7A3C10",
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.52,
  },
  pressed: {
    opacity: 0.7,
  },
});
