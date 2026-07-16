import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import type { StudyCheckInSummary } from "@/lib/study-check-in-api";

type StudyCheckInModalProps = {
  visible: boolean;
  summary: StudyCheckInSummary | null;
  onClose: () => void;
};

export function StudyCheckInModal({
  visible,
  summary,
  onClose,
}: StudyCheckInModalProps) {
  const isNewCheckIn = summary?.newlyCheckedIn ?? true;

  return (
    <Modal
      animationType="fade"
      statusBarTranslucent
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Image
            source={require("@/assets/images/check-in/success-mascot.png")}
            style={styles.mascot}
            resizeMode="contain"
          />

          <Pressable
            accessibilityLabel="关闭打卡弹窗"
            hitSlop={12}
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.closeText}>×</Text>
          </Pressable>

          <View style={styles.titleHighlight}>
            <Text style={styles.title}>
              {isNewCheckIn ? "学习打卡成功" : "今日已经打卡"}
            </Text>
          </View>
          <Text style={styles.pointsText}>
            {isNewCheckIn ? `获得${summary?.pointsEarned ?? 10}积分` : "明天也要继续哦~"}
          </Text>
          <Text style={styles.pointsLink}>查看我的积分 ›</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    backgroundColor: "rgba(0, 0, 0, 0.34)",
  },
  card: {
    width: "100%",
    maxWidth: 322,
    height: 200,
    marginTop: 55,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 31,
    borderRadius: 23,
    backgroundColor: "#FFEBD2",
    boxShadow: "0 8px 18px rgba(80, 49, 24, 0.18)",
  },
  mascot: {
    position: "absolute",
    top: -67,
    width: 132,
    height: 132,
  },
  closeButton: {
    position: "absolute",
    top: 14,
    right: 18,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    color: "#B85E00",
    fontSize: 29,
    fontWeight: "300",
    lineHeight: 29,
  },
  titleHighlight: {
    paddingHorizontal: 7,
    backgroundColor: "#FFD094",
  },
  title: {
    color: "#9B560E",
    fontSize: 18,
    lineHeight: 24,
  },
  pointsText: {
    marginTop: 10,
    color: "#FF7F00",
    fontSize: 15,
  },
  pointsLink: {
    marginTop: 14,
    color: "#9A5611",
    fontSize: 14,
  },
  pressed: {
    opacity: 0.65,
  },
});
