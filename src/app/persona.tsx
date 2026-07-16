import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import { getAccountAvatarSource } from "@/lib/account-avatar";
import { getAuthSession } from "@/lib/auth-session";
import { derivePersonaTraits, loadPersonaAnswers } from "@/lib/persona-profile";

const DESIGN_WIDTH = 402;
const DEFAULT_TRAITS = [
  "焦虑的进取者",
  "技能饥渴型学习者",
  "群体学习",
  "时间管理",
  "多维发展需求者",
  "基础知识薄弱",
];

type PersonaBubbleProps = {
  text: string;
  colors: readonly [string, string];
  style: object;
};

function PersonaBubble({ text, colors, style }: PersonaBubbleProps) {
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={[styles.personaBubble, style]}
    >
      <Text style={styles.personaBubbleText}>{text}</Text>
    </LinearGradient>
  );
}

function SmallTrait({ text, style }: { text: string; style: object }) {
  return (
    <View style={[styles.smallTrait, style]}>
      <Text style={styles.smallTraitText}>{text}</Text>
    </View>
  );
}

function PersonaOrbit({
  traits,
  userId,
}: {
  traits: string[];
  userId?: number;
}) {
  const displayTraits = [...traits, ...DEFAULT_TRAITS]
    .filter((trait, index, all) => all.indexOf(trait) === index)
    .slice(0, 6);

  return (
    <View style={styles.personaMap}>
      <Svg
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
        viewBox="0 0 362 304"
      >
        <Circle
          cx="181"
          cy="150"
          r="128"
          fill="none"
          stroke="#FFAE5D"
          strokeWidth="1.8"
          strokeDasharray="8 8"
        />
        <Circle
          cx="73"
          cy="22"
          r="11"
          fill="none"
          stroke="#D4661C"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <Circle
          cx="221"
          cy="11"
          r="11"
          fill="none"
          stroke="#D4661C"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <Circle
          cx="226"
          cy="240"
          r="11"
          fill="none"
          stroke="#D4661C"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <Circle
          cx="101"
          cy="265"
          r="11"
          fill="none"
          stroke="#D4661C"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
      </Svg>

      <PersonaBubble
        text={displayTraits[0]}
        colors={["#F1E3FF", "#F4FFD9"]}
        style={styles.traitTop}
      />
      <PersonaBubble
        text={displayTraits[1]}
        colors={["#F1FFD5", "#FFF0D3"]}
        style={styles.traitLeftTop}
      />
      <PersonaBubble
        text={displayTraits[2]}
        colors={["#FFE6CD", "#F2E4FF"]}
        style={styles.traitRightTop}
      />
      <PersonaBubble
        text={displayTraits[3]}
        colors={["#DCEFFF", "#E8E0FF"]}
        style={styles.traitLeftBottom}
      />
      <PersonaBubble
        text={displayTraits[4]}
        colors={["#FFF0D8", "#D7EEFF"]}
        style={styles.traitRightBottom}
      />
      <PersonaBubble
        text={displayTraits[5]}
        colors={["#E8FFD7", "#D8EEFF"]}
        style={styles.traitBottom}
      />

      <SmallTrait text="职业" style={styles.smallCareer} />
      <SmallTrait text="实操" style={styles.smallPractice} />
      <SmallTrait text="资源" style={styles.smallResource} />

      <View style={styles.portraitRing}>
        <Image
          source={getAccountAvatarSource(userId)}
          style={styles.portraitImage}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

function SectionIcon({ type }: { type: "target" | "pain" | "study" }) {
  if (type === "target") {
    return (
      <Svg width={58} height={58} viewBox="0 0 58 58">
        <Circle
          cx="29"
          cy="29"
          r="20"
          fill="none"
          stroke="#84420F"
          strokeWidth="4"
        />
        <Circle
          cx="29"
          cy="29"
          r="7"
          fill="none"
          stroke="#84420F"
          strokeWidth="4"
        />
        <Path
          d="M29 8v10M29 40v10M8 29h10M40 29h10"
          stroke="#84420F"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </Svg>
    );
  }

  if (type === "pain") {
    return (
      <Svg width={58} height={58} viewBox="0 0 58 58">
        <Circle cx="20" cy="20" r="5" fill="#84420F" />
        <Circle cx="38" cy="20" r="5" fill="#84420F" />
        <Path
          d="M11 45c7-12 29-12 36 0"
          fill="none"
          stroke="#84420F"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </Svg>
    );
  }

  return (
    <Svg width={58} height={58} viewBox="0 0 58 58">
      <Path
        d="M12 17h34v15H12zM18 32v9h28M18 41h18M13 15v-4h8v4M37 15v-4h8v4"
        fill="none"
        stroke="#84420F"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InsightHeader({
  type,
  title,
  subtitle,
}: {
  type: "target" | "pain" | "study";
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.insightHeader}>
      <View style={styles.insightIconBox}>
        <SectionIcon type={type} />
      </View>
      <View style={styles.insightHeaderCopy}>
        <Text style={styles.insightTitle}>{title}</Text>
        <Text style={styles.insightSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

export default function PersonaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const { width } = useWindowDimensions();
  const pageWidth = Math.min(width, DESIGN_WIDTH);
  const [traits, setTraits] = useState<string[]>([]);
  const [userId, setUserId] = useState<number>();

  useEffect(() => {
    let active = true;
    Promise.all([loadPersonaAnswers(), getAuthSession()]).then(
      ([answers, session]) => {
        if (!active) return;
        setTraits(derivePersonaTraits(answers));
        setUserId(session?.userId);
      },
    );
    return () => {
      active = false;
    };
  }, []);

  function handleBack() {
    if (params.from === "builder") {
      router.replace("/(tabs)/study");
      return;
    }
    router.back();
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.page, { width: pageWidth }]}>
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="返回"
              onPress={handleBack}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.backIcon}>‹</Text>
            </Pressable>
            <Text style={styles.headerTitle}>人物画像</Text>
          </View>

          <PersonaOrbit traits={traits} userId={userId} />

          <View style={styles.insightPanel}>
            <View style={styles.panelHandle} />

            <InsightHeader
              type="target"
              title="定制化解决方案建议"
              subtitle="深度理解用户特征、需求和行为模式"
            />
            <View style={styles.pathDiagramBox}>
              <Image
                source={require("@/assets/images/persona/custom-solution-flow.png")}
                style={styles.pathDiagram}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.solutionText}>
              • 采用「反向学习法」：从招聘要求的技能项倒推{`\n`} 学习路径
            </Text>

            <InsightHeader
              type="pain"
              title="痛点分析"
              subtitle="用户知道自己所真正需要提升的地方"
            />
            <Text style={styles.detailText}>
              1.信息收集：高频切换学习平台、收藏远多于实践{`\n`}
              2.决策模式：容易陷入“准备陷阱”，等待“完美方{`\n`}
              案”出现{`\n`}
              3.反馈依赖：需要阶段性成就验证来维持动力
            </Text>

            <InsightHeader type="study" title="学习模式特征" subtitle="" />
            <Text style={styles.detailText}>
              1.思维可视化倾向：思维导图选择反映结构化认知{`\n`}
              偏好{`\n`}
              2.实践缺口：未选“互动练习”暴露知识应用能力薄{`\n`}弱{`\n`}
              3.时间管理需求：双重选择“效率不高”显示执行系{`\n`}
              统紊乱
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFF8F3",
  },
  scrollContent: {
    alignItems: "center",
    paddingBottom: 28,
  },
  page: {
    minHeight: 1145,
  },
  header: {
    position: "relative",
    height: 50,
    marginTop: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    left: 13,
    width: 36,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    color: "#8C481B",
    fontSize: 40,
    fontWeight: "300",
    lineHeight: 43,
  },
  headerTitle: {
    color: "#111111",
    fontSize: 19,
    fontWeight: "500",
  },
  personaMap: {
    position: "relative",
    height: 304,
    marginHorizontal: 20,
  },
  personaBubble: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 50,
    boxShadow: "0 4px 7px rgba(95, 67, 47, 0.18)",
  },
  personaBubbleText: {
    color: "#111111",
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 15,
    textAlign: "center",
  },
  traitTop: {
    top: 8,
    left: 128,
    width: 80,
    height: 80,
  },
  traitLeftTop: {
    top: 67,
    left: 68,
    width: 78,
    height: 78,
  },
  traitRightTop: {
    top: 68,
    left: 238,
    width: 79,
    height: 79,
  },
  traitLeftBottom: {
    top: 166,
    left: 68,
    width: 70,
    height: 70,
  },
  traitRightBottom: {
    top: 168,
    left: 239,
    width: 72,
    height: 72,
  },
  traitBottom: {
    top: 224,
    left: 128,
    width: 75,
    height: 75,
  },
  smallTrait: {
    position: "absolute",
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#D4661C",
    borderRadius: 25,
    backgroundColor: "#FFF8F3",
  },
  smallTraitText: {
    color: "#111111",
    fontSize: 11,
    fontWeight: "600",
  },
  smallCareer: {
    top: 76,
    left: 115,
  },
  smallPractice: {
    top: 118,
    left: 232,
  },
  smallResource: {
    top: 170,
    left: 117,
  },
  portraitRing: {
    position: "absolute",
    top: 112,
    left: 142,
    width: 78,
    height: 78,
    padding: 6,
    overflow: "hidden",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#8A3F14",
    borderRadius: 39,
    backgroundColor: "#FFF8F3",
  },
  portraitImage: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#FFEEDB",
  },
  insightPanel: {
    height: 688,
    marginHorizontal: 20,
    paddingTop: 45,
    paddingHorizontal: 21,
    borderRadius: 23,
    backgroundColor: "#FFEBD3",
    boxShadow: "0 6px 14px rgba(82, 55, 36, 0.18)",
  },
  panelHandle: {
    position: "absolute",
    top: 10,
    left: "50%",
    width: 68,
    height: 20,
    marginLeft: -34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  insightHeader: {
    minHeight: 80,
    flexDirection: "row",
    alignItems: "center",
  },
  insightIconBox: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#FFCC8E",
  },
  insightHeaderCopy: {
    marginLeft: 15,
    flex: 1,
  },
  insightTitle: {
    color: "#8A481C",
    fontSize: 15,
    fontWeight: "700",
  },
  insightSubtitle: {
    marginTop: 5,
    color: "#8E5832",
    fontSize: 11,
    lineHeight: 16,
  },
  pathDiagramBox: {
    height: 54,
    marginTop: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  pathDiagram: {
    width: 300,
    height: 54,
  },
  solutionText: {
    marginTop: 8,
    marginBottom: 22,
    color: "#7C3F18",
    fontSize: 13,
    lineHeight: 17,
  },
  detailText: {
    marginTop: 8,
    marginBottom: 20,
    color: "#7C3F18",
    fontSize: 12,
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.65,
  },
});
