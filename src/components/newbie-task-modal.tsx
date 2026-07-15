import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";

export type NewbieTaskRoute =
  "/persona" | "/(tabs)/study" | "/(tabs)/plan" | "/(tabs)/community";

type NewbieTask = {
  id: string;
  title: string;
  reward: number;
  icon: string;
  iconColor: string;
  route: NewbieTaskRoute;
};

const TASKS: NewbieTask[] = [
  {
    id: "persona",
    title: "查看人物画像",
    reward: 20,
    icon: "▣",
    iconColor: "#F29A70",
    route: "/persona",
  },
  {
    id: "check-in",
    title: "完成一次学习打卡",
    reward: 10,
    icon: "◎",
    iconColor: "#F59B23",
    route: "/(tabs)/study",
  },
  {
    id: "exam",
    title: "完成一次考试冲刺",
    reward: 30,
    icon: "●",
    iconColor: "#A7CD9C",
    route: "/(tabs)/study",
  },
  {
    id: "career",
    title: "完成一次职业规划",
    reward: 20,
    icon: "▲",
    iconColor: "#A7CD9C",
    route: "/(tabs)/plan",
  },
  {
    id: "post",
    title: "完成一次社区发帖",
    reward: 30,
    icon: "■",
    iconColor: "#7DB7D9",
    route: "/(tabs)/community",
  },
  {
    id: "study-room",
    title: "自习室在线10分钟",
    reward: 10,
    icon: "⌂",
    iconColor: "#A978D7",
    route: "/(tabs)/community",
  },
];

type NewbieTaskModalProps = {
  visible: boolean;
  onDismiss: () => void;
  onTaskPress: (route: NewbieTaskRoute) => void;
};

export function NewbieTaskModal({
  visible,
  onDismiss,
  onTaskPress,
}: NewbieTaskModalProps) {
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  useEffect(() => {
    if (!visible) {
      setShowSkipConfirm(false);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => setShowSkipConfirm(true)}
    >
      <View style={styles.modalRoot}>
        <View style={styles.dimBackdrop} />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="打开新手任务"
          onPress={() => undefined}
          style={styles.welcomeBubble}
        >
          <Text style={styles.welcomeText}>
            完成新手任务，快速解锁全部功能！
          </Text>
          <View style={styles.welcomeTail} />
        </Pressable>

        <LinearGradient
          colors={["#FFF8F3", "#FFF0DE", "#FFE8C8"]}
          locations={[0, 0.45, 1]}
          style={styles.taskSheet}
        >
          <Pressable
            onPress={() => setShowSkipConfirm(true)}
            style={({ pressed }) => [
              styles.skipButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.skipText}>跳过</Text>
          </Pressable>

          <View style={styles.taskList}>
            {TASKS.map((task) => (
              <View key={task.id} style={styles.taskItem}>
                <View style={styles.taskIconBox}>
                  <Text style={[styles.taskIcon, { color: task.iconColor }]}>
                    {task.icon}
                  </Text>
                </View>
                <View style={styles.taskCopy}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskReward}>
                    获得积分+
                    <Text style={styles.taskRewardNumber}>{task.reward}</Text>
                  </Text>
                </View>
                <Pressable
                  onPress={() => onTaskPress(task.route)}
                  style={({ pressed }) => [
                    styles.goButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.goButtonText}>去完成</Text>
                </Pressable>
              </View>
            ))}
          </View>

          <Image
            source={require("@/assets/images/newbie/asset-08.png")}
            style={styles.celebrationMascot}
            resizeMode="contain"
          />
          <Image
            source={require("@/assets/images/newbie/asset-09.png")}
            style={styles.celebrationBuddy}
            resizeMode="contain"
          />
          <Pressable
            onPress={() => setShowSkipConfirm(true)}
            style={({ pressed }) => [
              styles.sheetCloseButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.sheetCloseText}>×</Text>
          </Pressable>
        </LinearGradient>

        {showSkipConfirm ? (
          <View style={styles.confirmLayer}>
            <View style={styles.confirmCard}>
              <Image
                source={require("@/assets/images/newbie/asset-10.png")}
                style={styles.confirmMascot}
                resizeMode="contain"
              />
              <Pressable
                onPress={() => setShowSkipConfirm(false)}
                style={({ pressed }) => [
                  styles.confirmClose,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.confirmCloseText}>×</Text>
              </Pressable>

              <Text style={styles.confirmTitle}>确定要跳过新手任务吗？</Text>

              <View style={styles.confirmActions}>
                <Pressable
                  onPress={() => setShowSkipConfirm(false)}
                  style={({ pressed }) => [
                    styles.confirmButton,
                    styles.cancelButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.cancelText}>取消</Text>
                </Pressable>
                <Pressable
                  onPress={onDismiss}
                  style={({ pressed }) => [
                    styles.confirmButton,
                    styles.confirmButtonPrimary,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.confirmText}>确定</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  dimBackdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(44, 38, 34, 0.34)",
  },
  welcomeBubble: {
    position: "absolute",
    top: 84,
    left: "50%",
    width: 270,
    height: 57,
    marginLeft: -135,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#FFF8F3",
  },
  welcomeText: {
    color: "#9C5A2B",
    fontSize: 14,
  },
  welcomeTail: {
    position: "absolute",
    bottom: -12,
    left: 124,
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderTopWidth: 14,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#FFF8F3",
  },
  taskSheet: {
    position: "absolute",
    top: 227,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: "hidden",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  skipButton: {
    height: 49,
    paddingTop: 15,
    paddingRight: 27,
    alignItems: "flex-end",
  },
  skipText: {
    color: "#A8662D",
    fontSize: 14,
  },
  taskList: {
    gap: 14,
    paddingHorizontal: 26,
  },
  taskItem: {
    height: 61,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  taskIconBox: {
    width: 35,
    height: 35,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 5,
    backgroundColor: "#FFEEDB",
  },
  taskIcon: {
    fontSize: 22,
    fontWeight: "700",
  },
  taskCopy: {
    marginLeft: 10,
    flex: 1,
  },
  taskTitle: {
    color: "#171717",
    fontSize: 14,
  },
  taskReward: {
    marginTop: 2,
    color: "#8E5A35",
    fontSize: 10,
  },
  taskRewardNumber: {
    color: "#FF8D00",
  },
  goButton: {
    width: 70,
    height: 25,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "#FF971E",
  },
  goButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
  },
  celebrationMascot: {
    position: "absolute",
    bottom: 0,
    left: 22,
    width: 92,
    height: 122,
  },
  celebrationBuddy: {
    position: "absolute",
    bottom: 3,
    left: 116,
    width: 53,
    height: 70,
  },
  sheetCloseButton: {
    position: "absolute",
    bottom: 36,
    left: "50%",
    width: 50,
    height: 50,
    marginLeft: -25,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 25,
    backgroundColor: "#FFF8F3",
  },
  sheetCloseText: {
    color: "#A95F19",
    fontSize: 28,
    fontWeight: "300",
  },
  confirmLayer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.28)",
  },
  confirmCard: {
    position: "absolute",
    top: 337,
    width: 324,
    height: 200,
    paddingTop: 78,
    paddingHorizontal: 20,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E4B882",
    backgroundColor: "#FFF2DF",
    boxShadow: "0 10px 25px rgba(69, 43, 25, 0.24)",
  },
  confirmMascot: {
    position: "absolute",
    top: -52,
    left: 107,
    width: 110,
    height: 125,
  },
  confirmClose: {
    position: "absolute",
    top: 8,
    right: 12,
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmCloseText: {
    color: "#A95F19",
    fontSize: 28,
    fontWeight: "300",
  },
  confirmTitle: {
    color: "#8A4A20",
    fontSize: 18,
    textAlign: "center",
  },
  confirmActions: {
    position: "absolute",
    right: 19,
    bottom: 14,
    left: 19,
    flexDirection: "row",
    gap: 20,
  },
  confirmButton: {
    height: 45,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
  },
  cancelButton: {
    width: 100,
    backgroundColor: "#FFFFFF",
  },
  confirmButtonPrimary: {
    flex: 1,
    backgroundColor: "#F59622",
  },
  cancelText: {
    color: "#FF8D00",
    fontSize: 16,
  },
  confirmText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  pressed: {
    opacity: 0.68,
  },
});
