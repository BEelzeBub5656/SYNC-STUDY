import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const DURATION_OPTIONS = [15, 30, 45, 60];

type AddTodayTaskModalProps = {
  onClose: () => void;
  onSubmit: (title: string, estimatedMinutes: number) => Promise<void>;
};

export function AddTodayTaskModal({ onClose, onSubmit }: AddTodayTaskModalProps) {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(30);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert("还差一步", "请输入任务名称");
      return;
    }

    setSaving(true);
    try {
      await onSubmit(trimmedTitle, duration);
    } catch (error) {
      Alert.alert(
        "添加失败",
        error instanceof Error ? error.message : "请稍后重试",
      );
      setSaving(false);
    }
  }

  return (
    <Modal
      animationType="slide"
      statusBarTranslucent
      transparent
      visible
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>添加个性化任务</Text>
            <Pressable hitSlop={12} onPress={onClose}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>今天想完成什么？</Text>
          <TextInput
            autoFocus
            maxLength={120}
            onChangeText={setTitle}
            placeholder="例如：复习第三章知识点"
            placeholderTextColor="#B79B82"
            selectionColor="#EF8B19"
            style={styles.input}
            value={title}
          />

          <Text style={styles.label}>预计学习时长</Text>
          <View style={styles.durationRow}>
            {DURATION_OPTIONS.map((minutes) => (
              <Pressable
                key={minutes}
                onPress={() => setDuration(minutes)}
                style={[
                  styles.durationChip,
                  duration === minutes && styles.durationChipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.durationText,
                    duration === minutes && styles.durationTextSelected,
                  ]}
                >
                  {minutes}分钟
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            disabled={saving}
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.submitButton,
              pressed && styles.pressed,
              saving && styles.disabled,
            ]}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>添加到今日任务</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  sheet: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 34,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#FFF4E8",
  },
  handle: {
    width: 46,
    height: 5,
    alignSelf: "center",
    borderRadius: 3,
    backgroundColor: "#D8BDA2",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },
  title: {
    color: "#2A211B",
    fontSize: 21,
    fontWeight: "600",
  },
  closeText: {
    color: "#A8692E",
    fontSize: 30,
    lineHeight: 32,
  },
  label: {
    marginTop: 22,
    marginBottom: 9,
    color: "#6E4A2E",
    fontSize: 14,
  },
  input: {
    height: 52,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#FFD09B",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    color: "#2B211A",
    fontSize: 15,
  },
  durationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  durationChip: {
    width: "23%",
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F1C592",
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
  },
  durationChipSelected: {
    borderColor: "#F19222",
    backgroundColor: "#FFCF96",
  },
  durationText: {
    color: "#8A6546",
    fontSize: 12,
  },
  durationTextSelected: {
    color: "#A85600",
    fontWeight: "600",
  },
  submitButton: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
    borderRadius: 26,
    backgroundColor: "#F49A25",
    boxShadow: "0 4px 9px rgba(181, 99, 15, 0.22)",
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.6,
  },
});
