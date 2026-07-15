import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  Image,
  ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

const DESIGN_WIDTH = 402;

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

function RecommendationCard({ item }: { item: Recommendation }) {
  return (
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
  );
}

function AiPlanningPage() {
  const recommendationRef = useRef<ScrollView>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      recommendationRef.current?.scrollTo({ x: 138, animated: false });
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <>
      <Image
        source={require("@/assets/images/plan/ai-banner.png")}
        style={styles.aiBanner}
        resizeMode="stretch"
      />

      <Pressable
        style={({ pressed }) => [
          styles.switchButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.switchButtonText}>切换</Text>
      </Pressable>

      <Text style={styles.learningTitle}>学习推荐</Text>

      <ScrollView
        ref={recommendationRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={239}
        decelerationRate="fast"
        contentContainerStyle={styles.recommendationContent}
      >
        {recommendations.map((item) => (
          <RecommendationCard key={item.id} item={item} />
        ))}
      </ScrollView>
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
}: {
  title: string;
  value: string;
  duration: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.goalRow, pressed && styles.pressed]}
    >
      <View style={styles.goalRowHeader}>
        <View style={styles.goalRowCopy}>
          <Text style={styles.goalRowTitle}>{title}</Text>
          <View style={styles.goalValueRow}>
            <TargetIcon />
            <Text style={styles.goalValue}>{value}</Text>
          </View>
        </View>
        <Text style={styles.goalDetail}>查看详情</Text>
        <View style={styles.goalChevronUp}>
          <DownChevron />
        </View>
      </View>

      <View style={styles.goalDivider} />

      <View style={styles.goalDetailRow}>
        <DetailIcon type="time" />
        <Text style={styles.goalDetailLabel}>时间段</Text>
        <Text style={styles.goalDetailValue}>{duration}</Text>
      </View>

      <View style={[styles.goalDetailRow, styles.goalActionRow]}>
        <DetailIcon type="action" />
        <Text style={styles.goalDetailLabel}>行动</Text>
        <Text style={styles.goalActionText}>
          1.背完所有四级单词{`\n`}2.刷10套四级模拟试卷
        </Text>
      </View>
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
  return (
    <>
      <View style={styles.greetingArea}>
        <Image
          source={require("@/assets/images/plan-goal-v2/asset-00.png")}
          style={styles.greetingMascot}
          resizeMode="contain"
        />
        <View style={styles.greetingCopy}>
          <Text style={styles.greetingTitle}>Hi，Jessica</Text>
          <Text style={styles.greetingDescription}>
            快来设定你的目标吧~{`\n`}3步获取制定计划，提升4倍学习效率
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
        <GoalRow title="短期目标" value="考试" duration="当天" />
        <GoalRow title="长期目标" value="英语四级" duration="200天" />

        <LinearGradient
          colors={["#FFFFFF", "#FFD29B", "#FFFFFF"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.editGoalButton}
        >
          <Pressable
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
        <Text style={styles.quoteText}>
          计划是行动的蓝图，没有精心绘制的蓝图，{`\n`}行动就会迷失方向。
        </Text>
        <View style={styles.quoteFooter}>
          <Text style={styles.refreshText}>⟳ 换一换</Text>
          <Text style={styles.quoteAuthor}>——雷军</Text>
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
          {mode === "ai" ? <AiPlanningPage /> : <GoalSettingPage />}
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
  aiBanner: {
    width: "auto",
    height: 212,
    marginTop: 26,
    marginHorizontal: 20,
    borderRadius: 23,
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
    gap: 34,
  },
  recommendationCard: {
    position: "relative",
    width: 205,
    height: 281,
    overflow: "hidden",
    borderRadius: 22,
    boxShadow: "0 5px 9px rgba(70, 45, 24, 0.18)",
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
    top: 4,
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
    fontWeight: "500",
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
    height: 471,
    marginHorizontal: 20,
    paddingTop: 15,
    borderRadius: 24,
  },
  goalPanelIntro: {
    color: "#8D593A",
    fontSize: 15,
    textAlign: "center",
  },
  goalRow: {
    height: 165,
    marginTop: 14,
    marginHorizontal: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.88)",
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
  goalChevronUp: {
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
    justifyContent: "space-between",
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
