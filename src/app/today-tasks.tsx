import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AddTodayTaskModal } from "@/components/add-today-task-modal";
import { getAccountAvatarSource } from "@/lib/account-avatar";
import { getAuthSession, type AuthSession } from "@/lib/auth-session";
import {
  createTodayTask,
  deleteTodayTask,
  getTodayTaskDashboard,
  setTodayTaskCompleted,
  type RecommendedTask,
  type TodayTask,
  type TodayTaskDashboard,
} from "@/lib/today-task-api";

function formatCompletedAt(value: string | null) {
  if (!value) return "刚刚";
  const elapsedMinutes = Math.max(
    0,
    Math.round((Date.now() - new Date(value).getTime()) / 60_000),
  );
  if (elapsedMinutes < 1) return "刚刚";
  if (elapsedMinutes < 60) return `${elapsedMinutes}分钟前`;
  const hours = Math.round(elapsedMinutes / 60);
  return hours < 24 ? `${hours}小时前` : `${Math.round(hours / 24)}天前`;
}

export default function TodayTasksScreen() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<TodayTaskDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [mutatingKey, setMutatingKey] = useState<string | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    let active = true;
    void getAuthSession().then((value) => {
      if (active) setSession(value);
    });
    getTodayTaskDashboard()
      .then((result) => {
        if (active) setDashboard(result);
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            requestError instanceof Error ? requestError.message : "今日任务加载失败",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const allTasks = useMemo(
    () => [
      ...(dashboard?.pendingTasks ?? []),
      ...(dashboard?.completedTasks ?? []),
    ],
    [dashboard],
  );
  const completedCount = dashboard?.completedTasks.length ?? 0;
  const totalCount = allTasks.length;
  const progress = totalCount === 0 ? 0 : completedCount / totalCount;
  const remainingHours = Math.max(0, 24 - new Date().getHours());

  async function addRecommendation(recommendation: RecommendedTask) {
    const key = `recommendation-${recommendation.id}`;
    setMutatingKey(key);
    try {
      const result = await createTodayTask({
        title: recommendation.title,
        estimatedMinutes: recommendation.estimatedMinutes,
        source: "AI",
      });
      setDashboard(result);
    } catch (requestError) {
      Alert.alert(
        "添加失败",
        requestError instanceof Error ? requestError.message : "请稍后重试",
      );
    } finally {
      setMutatingKey(null);
    }
  }

  async function addCustomTask(title: string, estimatedMinutes: number) {
    const result = await createTodayTask({
      title,
      estimatedMinutes,
      source: "CUSTOM",
    });
    setDashboard(result);
    setAddModalVisible(false);
  }

  async function toggleTask(task: TodayTask) {
    const key = `task-${task.id}`;
    setMutatingKey(key);
    try {
      const result = await setTodayTaskCompleted(task.id, {
        completed: !task.completed,
      });
      setDashboard(result);
    } catch (requestError) {
      Alert.alert(
        "更新失败",
        requestError instanceof Error ? requestError.message : "请稍后重试",
      );
    } finally {
      setMutatingKey(null);
    }
  }

  async function removeTask(task: TodayTask) {
    setMutatingKey(`delete-${task.id}`);
    try {
      const result = await deleteTodayTask(task.id);
      setDashboard(result);
    } catch (requestError) {
      Alert.alert(
        "删除失败",
        requestError instanceof Error ? requestError.message : "请稍后重试",
      );
    } finally {
      setMutatingKey(null);
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ImageBackground
          source={require("@/assets/images/today-task/header.jpg")}
          imageStyle={styles.heroImage}
          resizeMode="cover"
          style={styles.hero}
        >
          <LinearGradient
            colors={["rgba(255,244,232,0)", "#FFF4E8"]}
            locations={[0.52, 1]}
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView edges={["top"]} style={styles.heroSafeArea}>
            <View style={styles.header}>
              <Pressable
                accessibilityLabel="返回"
                hitSlop={12}
                onPress={() => router.back()}
                style={({ pressed }) => [pressed && styles.pressed]}
              >
                <Text style={styles.backIcon}>‹</Text>
              </Pressable>
              <Text style={styles.headerTitle}>今日任务</Text>
              <View style={styles.headerSpacer} />
            </View>

            <View style={styles.profileRow}>
              <Image
                resizeMode="contain"
                source={getAccountAvatarSource(session?.userId)}
                style={styles.avatar}
              />
              <View style={styles.profileCopy}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{session?.username ?? "学习者"}</Text>
                  <View style={styles.levelTag}>
                    <Text style={styles.levelText}>♥ 19岁</Text>
                  </View>
                  <View style={styles.roleTag}>
                    <Text style={styles.roleText}>浙江理科生</Text>
                  </View>
                </View>
                <Text style={styles.signature}>个性签名 · 自由和快乐应该永远被置顶</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatLabel}>累计打卡</Text>
                <Text style={styles.heroStatValue}>
                  {dashboard?.totalCheckInDays ?? 0}
                  <Text style={styles.heroStatUnit}>天</Text>
                </Text>
              </View>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatLabel}>今天学习</Text>
                <Text style={styles.heroStatValue}>
                  {dashboard?.todayStudyMinutes ?? 0}
                  <Text style={styles.heroStatUnit}>分</Text>
                </Text>
              </View>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatLabel}>时长排名超过</Text>
                <Text style={styles.heroStatValue}>
                  {dashboard?.outperformPercent ?? 50}%
                  <Text style={styles.rankSuffix}>的同学</Text>
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </ImageBackground>

        <View style={styles.sections}>
          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color="#EE921D" />
              <Text style={styles.loadingText}>AI正在整理今天的任务...</Text>
            </View>
          ) : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.recommendationCard}>
            <Image
              source={require("@/assets/images/today-task/recommendation-mascot.png")}
              resizeMode="contain"
              style={styles.recommendationMascot}
            />
            <Text style={styles.sectionTitle}>AI推荐任务</Text>
            <Text style={styles.sectionSubtitle}>根据你的学习情况智能推荐任务</Text>
            <View style={styles.recommendationList}>
              {(dashboard?.recommendations ?? []).map((recommendation, index) => {
                const added = allTasks.some((task) => task.title === recommendation.title);
                const busy = mutatingKey === `recommendation-${recommendation.id}`;
                return (
                  <View key={recommendation.id} style={styles.recommendationRow}>
                    <Text style={styles.recommendationTitle} numberOfLines={1}>
                      {index + 1}.{recommendation.title}
                    </Text>
                    <Pressable
                      disabled={added || busy}
                      onPress={() => addRecommendation(recommendation)}
                      style={({ pressed }) => [
                        styles.addRecommendation,
                        pressed && styles.pressed,
                        added && styles.recommendationAdded,
                      ]}
                    >
                      {busy ? (
                        <ActivityIndicator color="#F0992D" size="small" />
                      ) : (
                        <Text style={styles.addRecommendationText}>
                          {added ? "已添加" : "⊕ 添加"}
                        </Text>
                      )}
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>

          <LinearGradient
            colors={["#DFF4FD", "#FFE4C8"]}
            locations={[0, 1]}
            style={styles.pendingCard}
          >
            <View style={styles.pendingHeader}>
              <Text style={styles.pendingTitle}>待完成任务</Text>
              <Image
                source={require("@/assets/images/today-task/mini-mascot.png")}
                style={styles.pendingMiniMascot}
                resizeMode="contain"
              />
              <View style={styles.remainingBadge}>
                <Text style={styles.remainingText}>
                  今日剩余时间只有{remainingHours}小时哟~
                </Text>
              </View>
              <Pressable onPress={() => setEditing((current) => !current)}>
                <Text style={styles.editText}>{editing ? "完成" : "编辑"}</Text>
              </Pressable>
            </View>

            {dashboard?.pendingTasks.length ? (
              <View style={styles.taskList}>
                {dashboard.pendingTasks.map((task) => (
                  <View key={task.id} style={styles.taskRow}>
                    <Pressable
                      disabled={mutatingKey === `task-${task.id}`}
                      hitSlop={7}
                      onPress={() => toggleTask(task)}
                      style={styles.checkbox}
                    >
                      {mutatingKey === `task-${task.id}` ? (
                        <ActivityIndicator color="#D17A16" size="small" />
                      ) : null}
                    </Pressable>
                    <Text style={styles.taskTitle} numberOfLines={1}>
                      {task.title}
                    </Text>
                    <Text style={styles.taskDuration}>{task.estimatedMinutes}分钟</Text>
                    {editing ? (
                      <Pressable onPress={() => removeTask(task)}>
                        <Text style={styles.deleteText}>删除</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyPending}>
                <Image
                  source={require("@/assets/images/today-task/empty-mascot.png")}
                  style={styles.emptyMascot}
                  resizeMode="contain"
                />
                <View>
                  <Text style={styles.emptyTitle}>当前没有任务</Text>
                  <Text style={styles.emptyHint}>快来设置今天的任务吧~</Text>
                </View>
              </View>
            )}

            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>完成进度</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                <Image
                  source={require("@/assets/images/today-task/mini-mascot.png")}
                  style={[styles.progressMascot, { left: `${progress * 92}%` }]}
                />
              </View>
              <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
            </View>

            <Pressable
              onPress={() => setAddModalVisible(true)}
              style={({ pressed }) => [styles.addTaskButton, pressed && styles.pressed]}
            >
              <Text style={styles.addTaskText}>＋ 添加任务</Text>
            </Pressable>
          </LinearGradient>

          <View style={styles.completedCard}>
            <Text style={styles.completedTitle}>已完成任务</Text>
            {dashboard?.completedTasks.length ? (
              <View style={styles.completedList}>
                {dashboard.completedTasks.map((task) => (
                  <Pressable
                    key={task.id}
                    onPress={() => toggleTask(task)}
                    style={styles.completedRow}
                  >
                    <View style={styles.completedCheck}>
                      <Text style={styles.completedCheckText}>✓</Text>
                    </View>
                    <Text style={styles.completedTaskTitle} numberOfLines={1}>
                      {task.title}
                    </Text>
                    <Text style={styles.completedTime}>{formatCompletedAt(task.completedAt)}</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={styles.completedEmpty}>暂无已完成任务，赶紧去完成今日任务吧~</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {addModalVisible ? (
        <AddTodayTaskModal
          onClose={() => setAddModalVisible(false)}
          onSubmit={addCustomTask}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFF4E8",
  },
  scrollContent: {
    paddingBottom: 24,
  },
  hero: {
    height: 255,
  },
  heroSafeArea: {
    paddingTop: 28,
  },
  heroImage: {
    opacity: 0.96,
  },
  header: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  backIcon: {
    color: "#9D570E",
    fontSize: 38,
    fontWeight: "300",
    lineHeight: 40,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "500",
    textShadowColor: "rgba(69, 45, 27, 0.28)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSpacer: {
    width: 18,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 50,
    paddingHorizontal: 38,
  },
  avatar: {
    width: 54,
    height: 54,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    borderRadius: 27,
    backgroundColor: "#FFEEDB",
  },
  profileCopy: {
    flex: 1,
    marginLeft: 14,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    color: "#211A16",
    fontSize: 18,
    fontWeight: "500",
  },
  levelTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.82)",
  },
  levelText: {
    color: "#7D4C29",
    fontSize: 9,
  },
  roleTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.68)",
  },
  roleText: {
    color: "#7C4A27",
    fontSize: 9,
  },
  signature: {
    marginTop: 5,
    color: "#A65A18",
    fontSize: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingHorizontal: 37,
  },
  heroStat: {
    minWidth: 82,
    alignItems: "center",
  },
  heroStatLabel: {
    color: "#211C18",
    fontSize: 14,
  },
  heroStatValue: {
    marginTop: 5,
    color: "#050505",
    fontSize: 27,
    lineHeight: 31,
  },
  heroStatUnit: {
    fontSize: 16,
  },
  rankSuffix: {
    fontSize: 12,
  },
  sections: {
    gap: 20,
    paddingHorizontal: 20,
  },
  loadingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    color: "#98602D",
    fontSize: 13,
  },
  errorText: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FFE1D8",
    color: "#B65336",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  recommendationCard: {
    height: 231,
    padding: 15,
    borderRadius: 14,
    backgroundColor: "#FFD7A2",
  },
  recommendationMascot: {
    position: "absolute",
    top: -25,
    right: 15,
    width: 102,
    height: 102,
  },
  sectionTitle: {
    color: "#171717",
    fontSize: 18,
    fontWeight: "600",
  },
  sectionSubtitle: {
    marginTop: 6,
    color: "#B18A62",
    fontSize: 13,
  },
  recommendationList: {
    gap: 7,
    marginTop: 12,
  },
  recommendationRow: {
    height: 45,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 13,
    paddingRight: 8,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  recommendationTitle: {
    flex: 1,
    color: "#C26A0A",
    fontSize: 13,
  },
  addRecommendation: {
    minWidth: 55,
    height: 31,
    alignItems: "center",
    justifyContent: "center",
  },
  addRecommendationText: {
    color: "#F2A451",
    fontSize: 12,
  },
  recommendationAdded: {
    opacity: 0.52,
  },
  pendingCard: {
    minHeight: 266,
    padding: 15,
    borderRadius: 14,
  },
  pendingHeader: {
    height: 29,
    flexDirection: "row",
    alignItems: "center",
  },
  pendingTitle: {
    color: "#EF850D",
    fontSize: 18,
    fontWeight: "500",
  },
  pendingMiniMascot: {
    width: 31,
    height: 31,
    marginLeft: 7,
  },
  remainingBadge: {
    flex: 1,
    height: 25,
    justifyContent: "center",
    marginLeft: 5,
    paddingHorizontal: 9,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.84)",
  },
  remainingText: {
    color: "#ED8C1E",
    fontSize: 10,
  },
  editText: {
    marginLeft: 8,
    color: "#AFAFAF",
    fontSize: 12,
  },
  taskList: {
    gap: 6,
    marginTop: 10,
  },
  taskRow: {
    height: 32,
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 21,
    height: 21,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#9A9A9A",
    borderRadius: 11,
  },
  taskTitle: {
    flex: 1,
    marginLeft: 14,
    color: "#1E1B18",
    fontSize: 14,
  },
  taskDuration: {
    color: "#A28C7A",
    fontSize: 10,
  },
  deleteText: {
    marginLeft: 9,
    color: "#E06B56",
    fontSize: 11,
  },
  emptyPending: {
    height: 112,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 15,
  },
  emptyMascot: {
    width: 90,
    height: 90,
  },
  emptyTitle: {
    color: "#C67923",
    fontSize: 14,
  },
  emptyHint: {
    marginTop: 7,
    color: "#D5852B",
    fontSize: 13,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: "auto",
  },
  progressLabel: {
    color: "#171717",
    fontSize: 13,
  },
  progressTrack: {
    flex: 1,
    height: 9,
    marginLeft: 15,
    overflow: "visible",
    borderRadius: 5,
    backgroundColor: "#BFB6AE",
  },
  progressFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: "#E77C00",
  },
  progressMascot: {
    position: "absolute",
    top: -10,
    width: 24,
    height: 24,
  },
  progressPercent: {
    width: 29,
    color: "#A79E96",
    fontSize: 10,
    textAlign: "right",
  },
  addTaskButton: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.78)",
  },
  addTaskText: {
    color: "#C16A12",
    fontSize: 17,
  },
  completedCard: {
    minHeight: 146,
    padding: 15,
    borderRadius: 14,
    backgroundColor: "#FFE2C5",
  },
  completedTitle: {
    color: "#EA7C06",
    fontSize: 18,
    fontWeight: "500",
  },
  completedList: {
    gap: 8,
    marginTop: 12,
  },
  completedRow: {
    height: 27,
    flexDirection: "row",
    alignItems: "center",
  },
  completedCheck: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#FFBB61",
  },
  completedCheckText: {
    color: "#FFFFFF",
    fontSize: 12,
  },
  completedTaskTitle: {
    flex: 1,
    marginLeft: 14,
    color: "#2B211B",
    fontSize: 14,
  },
  completedTime: {
    color: "#B7AA9F",
    fontSize: 10,
  },
  completedEmpty: {
    marginTop: 14,
    color: "#9B7660",
    fontSize: 13,
  },
  pressed: {
    opacity: 0.67,
  },
});
