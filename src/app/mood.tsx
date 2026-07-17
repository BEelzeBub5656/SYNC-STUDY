import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  AccessibilityInfo,
  Alert,
  Animated,
  Image,
  ImageSourcePropType,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

import {
  getMoodCacheScope,
  inferMoodFromText,
  isSameMoodCacheScope,
  loadMoodCache,
  MoodId,
  MOODS,
  MOOD_IDS,
  saveMoodCache,
} from "@/lib/mood";
import { createMoodAdvice, toMoodRecord } from "@/lib/mood-api";

const DESIGN_WIDTH = 402;
const MOOD_SELECTOR_DRAG_DISTANCE = 96;
const MOOD_SELECTOR_DRAG_THRESHOLD = 38;

const moodStatusImages: Record<MoodId, ImageSourcePropType> = {
  happy: require("@/assets/images/mood/status/profile1.png"),
  annoyed: require("@/assets/images/mood/status/profile2.png"),
  calm: require("@/assets/images/mood/status/profile3.png"),
  tired: require("@/assets/images/mood/status/profile4.png"),
};

function getSelectorMoods(current: MoodId) {
  const currentIndex = MOOD_IDS.indexOf(current);
  return [-2, -1, 0, 1, 2].map(
    (offset) =>
      MOOD_IDS[(currentIndex + offset + MOOD_IDS.length) % MOOD_IDS.length],
  );
}

export default function MoodScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const pageWidth = Math.min(width, DESIGN_WIDTH);
  const [moodId, setMoodId] = useState<MoodId>("happy");
  const [note, setNote] = useState(MOODS.happy.description);
  const [edited, setEdited] = useState(false);
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);
  const [selectorDragX] = useState(() => new Animated.Value(0));
  const [faceAnimation] = useState(() => new Animated.Value(1));
  const mood = MOODS[moodId];
  const selectorMoods = useMemo(() => getSelectorMoods(moodId), [moodId]);

  useEffect(() => {
    let active = true;

    getMoodCacheScope()
      .then(async (scope) => {
        const storedMood = await loadMoodCache(scope);
        const currentScope = await getMoodCacheScope();
        if (active && isSameMoodCacheScope(currentScope, scope) && storedMood) {
          setMoodId(storedMood.id);
          setNote(storedMood.note);
        }
      })
      .catch(() => {
        // Keep the default mood if local storage is unavailable.
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) {
        setReduceMotionEnabled(enabled);
      }
    });
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotionEnabled,
    );

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  function selectMood(nextMood: MoodId) {
    if (nextMood !== moodId && !reduceMotionEnabled) {
      faceAnimation.setValue(0);
      Animated.spring(faceAnimation, {
        toValue: 1,
        friction: 8,
        tension: 85,
        useNativeDriver: Platform.OS !== "web",
      }).start();
    }
    setMoodId(nextMood);
    setNote(MOODS[nextMood].description);
    setEdited(false);
  }

  function resetSelectorDrag() {
    if (reduceMotionEnabled) {
      selectorDragX.setValue(0);
      return;
    }

    Animated.spring(selectorDragX, {
      toValue: 0,
      friction: 8,
      tension: 90,
      overshootClamping: true,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }

  function finishSelectorDrag(dx: number) {
    const moodOffset =
      dx <= -MOOD_SELECTOR_DRAG_THRESHOLD
        ? 1
        : dx >= MOOD_SELECTOR_DRAG_THRESHOLD
          ? -1
          : 0;

    if (moodOffset === 0) {
      resetSelectorDrag();
      return;
    }

    const currentIndex = MOOD_IDS.indexOf(moodId);
    const nextMood =
      MOOD_IDS[
        (currentIndex + moodOffset + MOOD_IDS.length) % MOOD_IDS.length
      ];
    const targetX =
      moodOffset > 0
        ? -MOOD_SELECTOR_DRAG_DISTANCE
        : MOOD_SELECTOR_DRAG_DISTANCE;
    const commitSelection = () => {
      selectorDragX.setValue(0);
      selectMood(nextMood);
    };

    if (reduceMotionEnabled) {
      commitSelection();
      return;
    }

    Animated.spring(selectorDragX, {
      toValue: targetX,
      friction: 8,
      tension: 90,
      overshootClamping: true,
      useNativeDriver: Platform.OS !== "web",
    }).start(({ finished }) => {
      if (finished) {
        commitSelection();
      }
    });
  }

  const selectorPanResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) =>
      Math.abs(gestureState.dx) > 5 &&
      Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
    onPanResponderGrant: () => selectorDragX.stopAnimation(),
    onPanResponderMove: (_, gestureState) => {
      selectorDragX.setValue(
        Math.max(
          -MOOD_SELECTOR_DRAG_DISTANCE,
          Math.min(MOOD_SELECTOR_DRAG_DISTANCE, gestureState.dx),
        ),
      );
    },
    onPanResponderRelease: (_, gestureState) =>
      finishSelectorDrag(gestureState.dx),
    onPanResponderTerminate: resetSelectorDrag,
  });

  async function saveMood(finalMood: MoodId) {
    if (saving) return;

    setSaving(true);
    const finalNote = note.trim() || MOODS[finalMood].description;
    try {
      const cacheScope = await getMoodCacheScope();
      const response = await createMoodAdvice({
        moodId: finalMood,
        description: finalNote,
      });
      const currentScope = await getMoodCacheScope();
      if (!isSameMoodCacheScope(currentScope, cacheScope)) {
        throw new Error("账号或日期已变化，请重新提交心情");
      }
      const record = toMoodRecord(response);
      setMoodId(record.id);
      setNote(record.note);
      await saveMoodCache(record, cacheScope);
      router.back();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "请检查网络后重试";
      Alert.alert("暂时无法生成学习建议", message);
    } finally {
      setSaving(false);
    }
  }

  function handleConfirm() {
    if (edited) {
      setShowGenerateConfirm(true);
      return;
    }

    void saveMood(moodId);
  }

  function handleGenerate() {
    const generatedMood = inferMoodFromText(note);
    setMoodId(generatedMood);
    setShowGenerateConfirm(false);
    void saveMood(generatedMood);
  }

  const selectorPositions = [
    { left: -20, top: 27 },
    { left: pageWidth * 0.19, top: 80 },
    { left: pageWidth * 0.5 - 21, top: 99 },
    { left: pageWidth * 0.77 - 21, top: 80 },
    { left: pageWidth - 22, top: 27 },
  ];
  const selectorMotionPositions = [
    { left: -116, top: -38 },
    ...selectorPositions,
    { left: pageWidth + 74, top: -38 },
  ];
  const selectorSlotScales = [0.68, 0.78, 0.92, 1.08, 0.92, 0.78, 0.68];
  const faceScale = faceAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.86, 1],
  });
  const faceOpacity = faceAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 1],
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.screen, { backgroundColor: mood.background }]}
    >
      <StatusBar style="dark" />
      <View style={[styles.page, { width: pageWidth }]}>
        <Text style={styles.title}>今日份心情</Text>

        <View style={styles.faceArea}>
          <Animated.Image
            resizeMode="contain"
            source={moodStatusImages[moodId]}
            style={[
              styles.moodStatusImage,
              {
                opacity: faceOpacity,
                transform: [{ scale: faceScale }],
              },
            ]}
          />
          <Text style={styles.moodTitle}>{mood.title}</Text>
          <Text style={styles.moodEnglish}>{mood.english}</Text>
        </View>

        <View
          {...selectorPanResponder.panHandlers}
          accessibilityHint="左右拖动切换心情"
          accessibilityLabel="心情颜色选择器"
          style={[styles.selector, { width: pageWidth }]}
        >
          <Svg width={pageWidth} height={140} style={styles.selectorCurve}>
            <Path
              d={`M -22 40 Q 92 126 ${pageWidth / 2} 112 Q ${pageWidth - 92} 126 ${pageWidth + 22} 40`}
              fill="none"
              stroke="#B86700"
              strokeWidth="4"
            />
          </Svg>
          {selectorMoods.map((selectorMood, index) => {
            const basePosition = selectorMotionPositions[index + 1];
            const previousPosition = selectorMotionPositions[index];
            const nextPosition = selectorMotionPositions[index + 2];
            const translateX = selectorDragX.interpolate({
              inputRange: [
                -MOOD_SELECTOR_DRAG_DISTANCE,
                0,
                MOOD_SELECTOR_DRAG_DISTANCE,
              ],
              outputRange: [
                previousPosition.left - basePosition.left,
                0,
                nextPosition.left - basePosition.left,
              ],
              extrapolate: "clamp",
            });
            const translateY = selectorDragX.interpolate({
              inputRange: [
                -MOOD_SELECTOR_DRAG_DISTANCE,
                0,
                MOOD_SELECTOR_DRAG_DISTANCE,
              ],
              outputRange: [
                previousPosition.top - basePosition.top,
                0,
                nextPosition.top - basePosition.top,
              ],
              extrapolate: "clamp",
            });
            const scale = selectorDragX.interpolate({
              inputRange: [
                -MOOD_SELECTOR_DRAG_DISTANCE,
                0,
                MOOD_SELECTOR_DRAG_DISTANCE,
              ],
              outputRange: reduceMotionEnabled
                ? [1, 1, 1]
                : [
                    selectorSlotScales[index],
                    selectorSlotScales[index + 1],
                    selectorSlotScales[index + 2],
                  ],
              extrapolate: "clamp",
            });

            return (
              <Animated.View
                key={`${selectorMood}-${index}`}
                style={[
                  styles.moodDotMotion,
                  basePosition,
                  { transform: [{ translateX }, { translateY }, { scale }] },
                ]}
              >
                <Pressable
                  accessibilityLabel={`选择${MOODS[selectorMood].title}`}
                  hitSlop={8}
                  onPress={() => selectMood(selectorMood)}
                  style={[
                    styles.moodDot,
                    { backgroundColor: MOODS[selectorMood].dot },
                  ]}
                />
              </Animated.View>
            );
          })}
          <View
            pointerEvents="none"
            style={[
              styles.moodDotFocus,
              {
                left: selectorPositions[2].left - 4,
                top: selectorPositions[2].top - 4,
                borderColor: mood.accent,
              },
            ]}
          />
        </View>

        <View style={styles.bottomArea}>
          <TextInput
            accessibilityLabel="描述今天的心情"
            multiline
            onChangeText={(value) => {
              setNote(value);
              setEdited(true);
            }}
            placeholder="也可以用文字描述你现在的心情"
            placeholderTextColor="#9A9A9A"
            style={styles.noteInput}
            textAlignVertical="top"
            value={note}
          />
          <Pressable
            disabled={saving}
            onPress={handleConfirm}
            style={({ pressed }) => [
              styles.confirmButton,
              { backgroundColor: mood.accent },
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.confirmText}>
              {saving ? "生成中…" : "确  定"}
            </Text>
          </Pressable>
        </View>
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => setShowGenerateConfirm(false)}
        statusBarTranslucent
        transparent
        visible={showGenerateConfirm}
      >
        <View style={styles.modalRoot}>
          <Pressable
            onPress={() => setShowGenerateConfirm(false)}
            style={styles.modalBackdrop}
          />
          <View style={styles.generateCard}>
            <Image
              resizeMode="contain"
              source={require("@/assets/images/mood/state-12/asset-00.png")}
              style={styles.generateMascot}
            />
            <Pressable
              hitSlop={12}
              onPress={() => setShowGenerateConfirm(false)}
              style={styles.modalClose}
            >
              <Text style={styles.modalCloseText}>×</Text>
            </Pressable>
            <Text style={styles.generateDescription}>
              可在上方选择代表心情的颜色{`\n`}或修改下方表达情绪的文字{`\n`}
              AI将综合推荐今日行动
            </Text>
            <View style={styles.generateActions}>
              <Pressable
                onPress={() => setShowGenerateConfirm(false)}
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.cancelText}>取消</Text>
              </Pressable>
              <Pressable
                onPress={handleGenerate}
                style={({ pressed }) => [
                  styles.generateButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.generateText}>确定</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
  },
  page: {
    flex: 1,
    alignItems: "center",
    paddingTop: 62,
    paddingBottom: 32,
  },
  title: {
    color: "#111111",
    fontSize: 22,
    fontWeight: "700",
  },
  faceArea: {
    marginTop: 121,
    alignItems: "center",
  },
  moodStatusImage: {
    width: 220,
    height: 136,
  },
  moodTitle: {
    marginTop: 14,
    color: "#111111",
    fontSize: 23,
    fontWeight: "400",
  },
  moodEnglish: {
    marginTop: 2,
    color: "#111111",
    fontSize: 20,
  },
  selector: {
    position: "relative",
    height: 140,
    marginTop: 28,
    overflow: "hidden",
  },
  selectorCurve: {
    position: "absolute",
  },
  moodDot: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  moodDotMotion: {
    position: "absolute",
    zIndex: 2,
    width: 42,
    height: 42,
  },
  moodDotFocus: {
    position: "absolute",
    zIndex: 3,
    width: 50,
    height: 50,
    borderWidth: 4,
    borderRadius: 25,
  },
  bottomArea: {
    width: "100%",
    marginTop: "auto",
    paddingHorizontal: 40,
  },
  noteInput: {
    height: 100,
    paddingHorizontal: 17,
    paddingTop: 15,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    color: "#222222",
    fontSize: 16,
    lineHeight: 23,
  },
  confirmButton: {
    height: 45,
    marginTop: 21,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 23,
  },
  confirmText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.72,
  },
  modalRoot: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(23, 18, 31, 0.46)",
  },
  generateCard: {
    position: "relative",
    width: "80%",
    maxWidth: 324,
    height: 245,
    marginTop: 58,
    paddingTop: 78,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    borderRadius: 24,
    backgroundColor: "#FFF1DF",
    boxShadow: "0 10px 25px rgba(46, 30, 18, 0.24)",
  },
  generateMascot: {
    position: "absolute",
    top: -72,
    left: "50%",
    width: 122,
    height: 122,
    marginLeft: -61,
  },
  modalClose: {
    position: "absolute",
    top: 12,
    right: 16,
  },
  modalCloseText: {
    color: "#B45E00",
    fontSize: 28,
    fontWeight: "400",
  },
  generateDescription: {
    color: "#9B4F20",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
    textAlign: "center",
  },
  generateActions: {
    marginTop: 22,
    flexDirection: "row",
    gap: 18,
  },
  cancelButton: {
    width: 100,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 23,
    backgroundColor: "#FFFFFF",
  },
  cancelText: {
    color: "#FF921E",
    fontSize: 16,
  },
  generateButton: {
    flex: 1,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 23,
    backgroundColor: "#FF961F",
  },
  generateText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
});
