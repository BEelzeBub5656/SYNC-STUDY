import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { sendAgentMessage } from "@/lib/agent-api";
import { getAuthSession } from "@/lib/auth-session";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  isError?: boolean;
  retryMessage?: string;
};

type ChatStorageKeys = {
  history: string;
  thread: string;
};

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  text: "你好，我是小汪。你可以问我知识点、复习方法，或者让我帮你梳理学习思路。",
};

const MAX_STORED_MESSAGES = 40;
const TAB_BAR_HEIGHT = 94;
const TAB_BAR_MIN_BOTTOM = 10;
const COMPOSER_TAB_BAR_GAP = 8;

function createMessageId(role: ChatMessage["role"]) {
  return `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function parseStoredMessages(value: string | null): ChatMessage[] {
  if (!value) return [WELCOME_MESSAGE];

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [WELCOME_MESSAGE];

    const messages = parsed.filter((item): item is ChatMessage => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Partial<ChatMessage>;
      return (
        typeof candidate.id === "string" &&
        (candidate.role === "assistant" || candidate.role === "user") &&
        typeof candidate.text === "string"
      );
    });

    return messages.length > 0
      ? messages.slice(-MAX_STORED_MESSAGES)
      : [WELCOME_MESSAGE];
  } catch {
    return [WELCOME_MESSAGE];
  }
}

export default function AiScreen() {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const sendingRef = useRef(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [storageKeys, setStorageKeys] = useState<ChatStorageKeys | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;

    async function restoreConversation() {
      let owner: string | number = "guest";
      try {
        const session = await getAuthSession();
        owner = session?.userId ?? "guest";
      } catch {
        // Keep a guest-scoped local conversation if auth storage is unavailable.
      }

      const keys = {
        history: `agent-chat-history-v1:${owner}`,
        thread: `agent-chat-thread-v1:${owner}`,
      };

      if (!active) return;
      setStorageKeys(keys);

      try {
        const stored = await AsyncStorage.multiGet([keys.history, keys.thread]);
        if (!active) return;
        setMessages(parseStoredMessages(stored[0][1]));
        setThreadId(stored[1][1] || null);
      } finally {
        if (active) setHydrated(true);
      }
    }

    restoreConversation().catch(() => {
      if (active) setHydrated(true);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated || !storageKeys) return;

    const serializableMessages = messages.slice(-MAX_STORED_MESSAGES);
    void AsyncStorage.setItem(
      storageKeys.history,
      JSON.stringify(serializableMessages),
    ).catch(() => undefined);

    if (threadId) {
      void AsyncStorage.setItem(storageKeys.thread, threadId).catch(
        () => undefined,
      );
    } else {
      void AsyncStorage.removeItem(storageKeys.thread).catch(() => undefined);
    }
  }, [hydrated, messages, storageKeys, threadId]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [messages, sending]);

  const canSend = hydrated && input.trim().length > 0 && !sending;

  async function submitMessage(
    message: string,
    options: { appendUser?: boolean; removeMessageId?: string } = {},
  ) {
    if (!hydrated || sendingRef.current) return;
    sendingRef.current = true;

    const { appendUser = true, removeMessageId } = options;

    const userMessage: ChatMessage = {
      id: createMessageId("user"),
      role: "user",
      text: message,
    };

    setMessages((current) => {
      const withoutRetriedError = removeMessageId
        ? current.filter((item) => item.id !== removeMessageId)
        : current;
      return appendUser
        ? [...withoutRetriedError, userMessage]
        : withoutRetriedError;
    });
    setSending(true);

    try {
      const response = await sendAgentMessage({ message, threadId });
      setThreadId(response.threadId);
      setMessages((current) => [
        ...current,
        {
          id: createMessageId("assistant"),
          role: "assistant",
          text: response.message,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: createMessageId("assistant"),
          role: "assistant",
          text: error instanceof Error ? error.message : "AI 暂时无法回答，请稍后重试。",
          isError: true,
          retryMessage: message,
        },
      ]);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  function handleSend() {
    const message = input.trim();
    if (!message || sendingRef.current || !hydrated) return;
    setInput("");
    void submitMessage(message);
  }

  function handleRetry(item: ChatMessage) {
    if (!item.retryMessage || sendingRef.current) return;
    void submitMessage(item.retryMessage, {
      appendUser: false,
      removeMessageId: item.id,
    });
  }

  function startNewConversation() {
    if (sendingRef.current) return;
    Alert.alert("开始新对话", "当前页面中的聊天记录将被清空。", [
      { text: "取消", style: "cancel" },
      {
        text: "新对话",
        onPress: () => {
          setThreadId(null);
          setMessages([WELCOME_MESSAGE]);
          setInput("");
        },
      },
    ]);
  }

  const composerBottom =
    TAB_BAR_HEIGHT +
    Math.max(insets.bottom, TAB_BAR_MIN_BOTTOM) +
    COMPOSER_TAB_BAR_GAP;

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardArea}
      >
        <View style={styles.header}>
          <Image
            resizeMode="contain"
            source={require("@/assets/images/study/icon2.png")}
            style={styles.headerMascot}
          />
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>小汪 AI</Text>
            <Text style={styles.headerStatus}>你的智能学习搭子</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={sending}
            hitSlop={8}
            onPress={startNewConversation}
            style={({ pressed }) => [
              styles.newChatButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.newChatText}>新对话</Text>
          </Pressable>
        </View>

        <FlatList
          ref={listRef}
          contentContainerStyle={styles.messageList}
          data={messages}
          keyExtractor={(item) => item.id}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          style={styles.messageListView}
          renderItem={({ item }) => {
            const isUser = item.role === "user";
            return (
              <View style={[styles.messageRow, isUser && styles.userMessageRow]}>
                {!isUser ? (
                  <Image
                    resizeMode="contain"
                    source={require("@/assets/images/study/icon2.png")}
                    style={styles.messageAvatar}
                  />
                ) : null}
                <View
                  style={[
                    styles.messageBubble,
                    isUser ? styles.userBubble : styles.assistantBubble,
                    item.isError && styles.errorBubble,
                  ]}
                >
                  <Text
                    selectable
                    style={isUser ? styles.userMessageText : styles.assistantMessageText}
                  >
                    {item.text}
                  </Text>
                  {item.isError && item.retryMessage ? (
                    <Pressable
                      accessibilityRole="button"
                      disabled={sending}
                      hitSlop={6}
                      onPress={() => handleRetry(item)}
                      style={({ pressed }) => [
                        styles.retryButton,
                        pressed && !sending && styles.pressed,
                      ]}
                    >
                      <Text style={styles.retryText}>重试</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          }}
          ListFooterComponent={
            sending ? (
              <View style={styles.messageRow}>
                <Image
                  resizeMode="contain"
                  source={require("@/assets/images/study/icon2.png")}
                  style={styles.messageAvatar}
                />
                <View style={[styles.messageBubble, styles.assistantBubble, styles.loadingBubble]}>
                  <ActivityIndicator color="#F29A2E" size="small" />
                  <Text style={styles.loadingText}>小汪正在思考…</Text>
                </View>
              </View>
            ) : null
          }
        />

        <View
          style={[
            styles.composer,
            { marginBottom: composerBottom },
          ]}
        >
          <TextInput
            maxLength={2000}
            multiline
            onChangeText={setInput}
            placeholder="问问小汪…"
            placeholderTextColor="#B7A79B"
            selectionColor="#F29A2E"
            style={styles.input}
            value={input}
          />
          <Pressable
            accessibilityLabel="发送消息"
            accessibilityRole="button"
            disabled={!canSend}
            onPress={handleSend}
            style={({ pressed }) => [
              styles.sendButton,
              !canSend && styles.sendButtonDisabled,
              pressed && canSend && styles.pressed,
            ]}
          >
            <Text style={styles.sendIcon}>↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF7EF",
  },
  keyboardArea: {
    flex: 1,
  },
  header: {
    height: 68,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F2DDCB",
    backgroundColor: "rgba(255, 250, 245, 0.96)",
  },
  headerMascot: {
    width: 48,
    height: 48,
  },
  headerCopy: {
    flex: 1,
    marginLeft: 9,
  },
  headerTitle: {
    color: "#3F3026",
    fontSize: 18,
    fontWeight: "700",
  },
  headerStatus: {
    marginTop: 2,
    color: "#A0795B",
    fontSize: 11,
  },
  newChatButton: {
    height: 32,
    paddingHorizontal: 12,
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#FFE6C7",
  },
  newChatText: {
    color: "#9A571F",
    fontSize: 12,
    fontWeight: "600",
  },
  messageList: {
    flexGrow: 1,
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 12,
  },
  messageListView: {
    flex: 1,
  },
  messageRow: {
    width: "100%",
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  userMessageRow: {
    justifyContent: "flex-end",
  },
  messageAvatar: {
    width: 34,
    height: 34,
    marginRight: 7,
  },
  messageBubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  assistantBubble: {
    borderTopLeftRadius: 7,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 18,
    backgroundColor: "#FFFFFF",
    boxShadow: "0 4px 12px rgba(105, 70, 43, 0.08)",
  },
  userBubble: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 7,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 18,
    backgroundColor: "#F7A23A",
  },
  errorBubble: {
    borderWidth: 1,
    borderColor: "#F2B6AC",
    backgroundColor: "#FFF1EE",
  },
  retryButton: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "#FFE0D8",
  },
  retryText: {
    color: "#B5533F",
    fontSize: 12,
    fontWeight: "600",
  },
  assistantMessageText: {
    color: "#45372D",
    fontSize: 14,
    lineHeight: 21,
  },
  userMessageText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 21,
  },
  loadingBubble: {
    minWidth: 142,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    color: "#9B765A",
    fontSize: 12,
  },
  composer: {
    zIndex: 10,
    flexShrink: 0,
    minHeight: 58,
    marginHorizontal: 12,
    paddingLeft: 15,
    paddingRight: 7,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "flex-end",
    borderWidth: 1,
    borderColor: "#F2D8BF",
    borderRadius: 29,
    backgroundColor: "#FFFFFF",
    boxShadow: "0 6px 18px rgba(96, 61, 35, 0.12)",
    elevation: 8,
  },
  input: {
    flex: 1,
    maxHeight: 108,
    minHeight: 42,
    paddingTop: 10,
    paddingBottom: 9,
    color: "#44362D",
    fontSize: 14,
    textAlignVertical: "top",
  },
  sendButton: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 21,
    backgroundColor: "#F59A24",
  },
  sendButtonDisabled: {
    backgroundColor: "#E8DDD3",
  },
  sendIcon: {
    marginTop: -2,
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.68,
  },
});
