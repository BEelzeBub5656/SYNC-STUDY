import { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type DatePickerModalProps = {
  visible: boolean;
  value: string | null;
  onConfirm: (date: string) => void;
  onClose: () => void;
};

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR + i);

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export default function DatePickerModal({
  visible,
  value,
  onConfirm,
  onClose,
}: DatePickerModalProps) {
  const today = useMemo(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  }, []);

  const parsed = useMemo(() => {
    if (!value) return { year: today.year, month: today.month, day: today.day };
    const parts = value.split("-");
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) {
      return { year: today.year, month: today.month, day: today.day };
    }
    return { year: y, month: m, day: d };
  }, [value, today]);

  const [year, setYear] = useState(parsed.year);
  const [month, setMonth] = useState(parsed.month);
  const [day, setDay] = useState(parsed.day);

  useEffect(() => {
    setYear(parsed.year);
    setMonth(parsed.month);
    setDay(parsed.day);
  }, [parsed]);

  const maxDay = daysInMonth(year, month);
  const safeDay = Math.min(day, maxDay);
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  const yearRef = useRef<FlatList>(null);
  const monthRef = useRef<FlatList>(null);
  const dayRef = useRef<FlatList>(null);

  useEffect(() => {
    const yearIdx = YEARS.indexOf(year);
    if (yearIdx >= 0) {
      setTimeout(() => yearRef.current?.scrollToIndex({ index: yearIdx, viewPosition: 0.5 }), 80);
    }
  }, [year]);

  useEffect(() => {
    const monthIdx = month - 1;
    setTimeout(() => monthRef.current?.scrollToIndex({ index: monthIdx, viewPosition: 0.5 }), 80);
  }, [month]);

  useEffect(() => {
    const dayIdx = safeDay - 1;
    setTimeout(() => dayRef.current?.scrollToIndex({ index: dayIdx, viewPosition: 0.5 }), 80);
  }, [safeDay]);

  function handleConfirm() {
    const mm = String(month).padStart(2, "0");
    const dd = String(safeDay).padStart(2, "0");
    onConfirm(`${year}-${mm}-${dd}`);
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.card}>
          <Text style={styles.title}>选择目标日期</Text>

          <View style={styles.pickerRow}>
            {/* Year */}
            <View style={styles.column}>
              <Text style={styles.columnLabel}>年</Text>
              <FlatList
                ref={yearRef}
                data={YEARS}
                keyExtractor={(y) => String(y)}
                getItemLayout={(_, index) => ({
                  length: 36,
                  offset: 36 * index,
                  index,
                })}
                renderItem={({ item }) => {
                  const active = item === year;
                  return (
                    <Pressable
                      onPress={() => setYear(item)}
                      style={[styles.item, active && styles.itemActive]}
                    >
                      <Text style={[styles.itemText, active && styles.itemTextActive]}>
                        {item}
                      </Text>
                    </Pressable>
                  );
                }}
                showsVerticalScrollIndicator={false}
                style={styles.list}
              />
            </View>

            {/* Month */}
            <View style={styles.column}>
              <Text style={styles.columnLabel}>月</Text>
              <FlatList
                ref={monthRef}
                data={MONTHS}
                keyExtractor={(m) => String(m)}
                getItemLayout={(_, index) => ({
                  length: 36,
                  offset: 36 * index,
                  index,
                })}
                renderItem={({ item }) => {
                  const active = item === month;
                  return (
                    <Pressable
                      onPress={() => setMonth(item)}
                      style={[styles.item, active && styles.itemActive]}
                    >
                      <Text style={[styles.itemText, active && styles.itemTextActive]}>
                        {String(item).padStart(2, "0")}
                      </Text>
                    </Pressable>
                  );
                }}
                showsVerticalScrollIndicator={false}
                style={styles.list}
              />
            </View>

            {/* Day */}
            <View style={styles.column}>
              <Text style={styles.columnLabel}>日</Text>
              <FlatList
                ref={dayRef}
                data={days}
                keyExtractor={(d) => String(d)}
                getItemLayout={(_, index) => ({
                  length: 36,
                  offset: 36 * index,
                  index,
                })}
                renderItem={({ item }) => {
                  const active = item === safeDay;
                  return (
                    <Pressable
                      onPress={() => setDay(item)}
                      style={[styles.item, active && styles.itemActive]}
                    >
                      <Text style={[styles.itemText, active && styles.itemTextActive]}>
                        {String(item).padStart(2, "0")}
                      </Text>
                    </Pressable>
                  );
                }}
                showsVerticalScrollIndicator={false}
                style={styles.list}
              />
            </View>
          </View>

          <Text style={styles.preview}>
            目标日：{year}-{String(month).padStart(2, "0")}-{String(safeDay).padStart(2, "0")}
          </Text>

          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.btnCancel, pressed && styles.pressed]}
            >
              <Text style={styles.btnCancelText}>取消</Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              style={({ pressed }) => [styles.btnConfirm, pressed && styles.pressed]}
            >
              <Text style={styles.btnConfirmText}>确定</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(55, 38, 26, 0.38)",
  },
  card: {
    width: "100%",
    maxWidth: 340,
    padding: 22,
    borderRadius: 24,
    backgroundColor: "#FFF9F3",
    boxShadow: "0 12px 28px rgba(87, 53, 31, 0.24)",
    elevation: 10,
  },
  title: {
    color: "#5F351F",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 14,
  },
  pickerRow: {
    flexDirection: "row",
    gap: 10,
    height: 180,
  },
  column: {
    flex: 1,
  },
  columnLabel: {
    color: "#9A7058",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  list: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "#FFF0E0",
  },
  item: {
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginHorizontal: 4,
    marginVertical: 2,
  },
  itemActive: {
    backgroundColor: "#F59A24",
  },
  itemText: {
    color: "#6E4A30",
    fontSize: 15,
  },
  itemTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  preview: {
    marginTop: 14,
    color: "#8E4E28",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    marginTop: 14,
    gap: 12,
  },
  btnCancel: {
    flex: 1,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 21,
    backgroundColor: "#F5E8DC",
  },
  btnCancelText: {
    color: "#795844",
    fontSize: 15,
  },
  btnConfirm: {
    flex: 1,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 21,
    backgroundColor: "#F59A24",
  },
  btnConfirmText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.7,
  },
});
