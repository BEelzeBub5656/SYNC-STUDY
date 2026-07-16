import AsyncStorage from "@react-native-async-storage/async-storage";
import { Tabs, useRouter } from "expo-router";
import type { ComponentProps } from "react";
import { useEffect, useState } from "react";
import {
  Animated,
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import {
  NewbieTaskModal,
  NewbieTaskRoute,
} from "@/components/newbie-task-modal";
import { getAuthSession } from "@/lib/auth-session";

const TAB_BAR_HEIGHT = 94;
const TAB_BAR_MAX_WIDTH = 404;
const TAB_BAR_SIDE_MARGIN = 10;
const CENTER_MASCOT_SIZE = 55;
const ACTIVE_BUBBLE_SIZE = 74;
const NEWBIE_GUIDE_SEEN_KEY_PREFIX = "newbie-guide-seen-v3";

type TabsProps = ComponentProps<typeof Tabs>;
type AnimatedTabBarProps = Parameters<NonNullable<TabsProps["tabBar"]>>[0];
type GuidedTabBarProps = AnimatedTabBarProps & {
  showNewbieGreeting: boolean;
  onOpenNewbieTasks: () => void;
};

type TabConfig = {
  label: string;
  icon: ImageSourcePropType;
  activeIcon?: ImageSourcePropType;
  activeBubbleColor: string;
  isCenter?: boolean;
};

const tabConfigs: Record<string, TabConfig> = {
  study: {
    label: "主页",
    icon: require("@/assets/images/study/button1.png"),
    activeIcon: require("@/assets/images/study/button1-active.png"),
    activeBubbleColor: "#CDEAFA",
  },
  plan: {
    label: "计划",
    icon: require("@/assets/images/study/button2.png"),
    activeIcon: require("@/assets/images/study/button2-active.png"),
    activeBubbleColor: "#E2DCF1",
  },
  ai: {
    label: "",
    icon: require("@/assets/images/study/icon2.png"),
    activeBubbleColor: "#FFFFFF",
    isCenter: true,
  },
  community: {
    label: "社区",
    icon: require("@/assets/images/study/button3.png"),
    activeIcon: require("@/assets/images/study/button3-active.png"),
    activeBubbleColor: "#DBF1CD",
  },
  profile: {
    label: "我的",
    icon: require("@/assets/images/study/button4.png"),
    activeIcon: require("@/assets/images/study/button4-active.png"),
    activeBubbleColor: "#FFE2CD",
  },
};

function AnimatedTabBar({
  state,
  navigation,
  insets,
  showNewbieGreeting,
  onOpenNewbieTasks,
}: GuidedTabBarProps) {
  const { width } = useWindowDimensions();
  const [animatedIndex] = useState(() => new Animated.Value(state.index));
  const [aiShake] = useState(() => new Animated.Value(0));
  const tabBarWidth = Math.min(
    width - TAB_BAR_SIDE_MARGIN * 2,
    TAB_BAR_MAX_WIDTH,
  );
  const tabBarLeft = (width - tabBarWidth) / 2;
  const itemWidth = tabBarWidth / state.routes.length;
  const activeRoute = state.routes[state.index];
  const shouldShowGreeting =
    showNewbieGreeting && activeRoute?.name === "study";
  const activeBubbleColor =
    tabConfigs[activeRoute?.name]?.activeBubbleColor ?? "#CDEAFA";

  useEffect(() => {
    Animated.spring(animatedIndex, {
      toValue: state.index,
      damping: 18,
      stiffness: 180,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  }, [animatedIndex, state.index]);

  useEffect(() => {
    if (!shouldShowGreeting) {
      aiShake.stopAnimation();
      aiShake.setValue(0);
      return;
    }

    const shakeLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(aiShake, {
          toValue: 1,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(aiShake, {
          toValue: -1,
          duration: 130,
          useNativeDriver: true,
        }),
        Animated.timing(aiShake, {
          toValue: 0,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.delay(900),
      ]),
    );

    shakeLoop.start();
    return () => shakeLoop.stop();
  }, [aiShake, shouldShowGreeting]);

  const aiRotation = aiShake.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-8deg", "0deg", "8deg"],
  });

  const bubbleTranslateX = animatedIndex.interpolate({
    inputRange: state.routes.map((_, index) => index),
    outputRange: state.routes.map(
      (_, index) => index * itemWidth + (itemWidth - ACTIVE_BUBBLE_SIZE) / 2,
    ),
  });

  return (
    <View
      style={[
        styles.tabBar,
        {
          width: tabBarWidth,
          left: tabBarLeft,
          bottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      <View style={styles.tabBarSurface} />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.activeBubble,
          {
            backgroundColor: activeBubbleColor,
            transform: [{ translateX: bubbleTranslateX }],
          },
        ]}
      />

      {shouldShowGreeting ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="打开新手任务"
          onPress={onOpenNewbieTasks}
          style={({ pressed }) => [
            styles.newbieGreeting,
            { left: tabBarWidth / 2 - 145 },
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.newbieGreetingTitle}>嗨，我是小汪！</Text>
          <Text style={styles.newbieGreetingText}>点击我开启新手任务吧～</Text>
          <View style={styles.newbieGreetingTail} />
        </Pressable>
      ) : null}

      <View style={styles.tabItems}>
        {state.routes.map((route, index) => {
          const config = tabConfigs[route.name];

          if (!config) return null;

          const focused = state.index === index;
          const source =
            focused && config.activeIcon ? config.activeIcon : config.icon;

          function handlePress() {
            if (config.isCenter && shouldShowGreeting) {
              onOpenNewbieTasks();
              return;
            }

            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          }

          function handleLongPress() {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          }

          const content = (
            <>
              <Image
                source={source}
                style={config.isCenter ? styles.centerTabIcon : styles.tabIcon}
                resizeMode="contain"
              />
              {config.label ? (
                <Text
                  style={[styles.tabLabel, focused && styles.tabLabelActive]}
                >
                  {config.label}
                </Text>
              ) : null}
            </>
          );

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={
                config.isCenter ? "AI 问答页面" : `${config.label}页面`
              }
              onPress={handlePress}
              onLongPress={handleLongPress}
              style={({ pressed }) => [
                styles.tabButton,
                pressed && styles.pressed,
              ]}
            >
              {config.isCenter ? (
                <Animated.View
                  style={[
                    styles.tabContent,
                    styles.centerTabContent,
                    { transform: [{ translateY: -2 }, { rotate: aiRotation }] },
                  ]}
                >
                  {content}
                </Animated.View>
              ) : (
                <View style={styles.tabContent}>{content}</View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const router = useRouter();
  const [showNewbieGreeting, setShowNewbieGreeting] = useState(false);
  const [showNewbieTasks, setShowNewbieTasks] = useState(false);
  const [newbieGuideSeenKey, setNewbieGuideSeenKey] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    getAuthSession()
      .then((session) => {
        const storageKey = `${NEWBIE_GUIDE_SEEN_KEY_PREFIX}:${session?.userId ?? "guest"}`;
        if (mounted) {
          setNewbieGuideSeenKey(storageKey);
        }
        return AsyncStorage.getItem(storageKey);
      })
      .then((seen) => {
        if (mounted && seen !== "true") {
          setShowNewbieGreeting(true);
        }
      })
      .catch(() => {
        if (mounted) {
          setShowNewbieGreeting(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  function openNewbieTasks() {
    setShowNewbieGreeting(false);
    setShowNewbieTasks(true);
  }

  function rememberGuideSeen() {
    if (newbieGuideSeenKey) {
      void AsyncStorage.setItem(newbieGuideSeenKey, "true");
    }
  }

  function dismissNewbieTasks() {
    setShowNewbieTasks(false);
    setShowNewbieGreeting(false);
    rememberGuideSeen();
  }

  function handleTaskPress(route: NewbieTaskRoute) {
    setShowNewbieTasks(false);
    setShowNewbieGreeting(false);
    rememberGuideSeen();
    requestAnimationFrame(() => router.push(route));
  }

  return (
    <>
      <Tabs
        initialRouteName="study"
        tabBar={(props) => (
          <AnimatedTabBar
            {...props}
            showNewbieGreeting={showNewbieGreeting}
            onOpenNewbieTasks={openNewbieTasks}
          />
        )}
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tabs.Screen name="study" options={{ title: "主页" }} />
        <Tabs.Screen name="plan" options={{ title: "计划" }} />
        <Tabs.Screen name="ai" options={{ title: "AI" }} />
        <Tabs.Screen name="community" options={{ title: "社区" }} />
        <Tabs.Screen name="profile" options={{ title: "我的" }} />
      </Tabs>

      <NewbieTaskModal
        visible={showNewbieTasks}
        onDismiss={dismissNewbieTasks}
        onTaskPress={handleTaskPress}
      />
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    height: TAB_BAR_HEIGHT,
  },
  tabBarSurface: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: TAB_BAR_HEIGHT / 2,
    backgroundColor: "#FFC47B",
    boxShadow: "0 7px 18px rgba(103, 69, 40, 0.17)",
  },
  activeBubble: {
    position: "absolute",
    top: (TAB_BAR_HEIGHT - ACTIVE_BUBBLE_SIZE) / 2,
    left: 0,
    width: ACTIVE_BUBBLE_SIZE,
    height: ACTIVE_BUBBLE_SIZE,
    borderRadius: ACTIVE_BUBBLE_SIZE / 2,
    backgroundColor: "#CDEAFA",
    boxShadow: "0 3px 10px rgba(120, 80, 45, 0.12)",
  },
  newbieGreeting: {
    position: "absolute",
    bottom: TAB_BAR_HEIGHT + 14,
    zIndex: 20,
    width: 290,
    minHeight: 70,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: "#FFF8F3",
    boxShadow: "0 7px 18px rgba(89, 56, 32, 0.2)",
    elevation: 8,
  },
  newbieGreetingTitle: {
    color: "#9C551F",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  newbieGreetingText: {
    marginTop: 3,
    color: "#A96C3D",
    fontSize: 13,
    textAlign: "center",
  },
  newbieGreetingTail: {
    position: "absolute",
    bottom: -14,
    left: 133,
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderTopWidth: 15,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#FFF8F3",
  },
  tabItems: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: "row",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerTabContent: {
    alignItems: "center",
  },
  centerTabIcon: {
    width: CENTER_MASCOT_SIZE,
    height: CENTER_MASCOT_SIZE,
  },
  tabIcon: {
    width: 24,
    height: 24,
  },
  tabLabel: {
    marginTop: 3,
    color: "#554B43",
    fontSize: 12,
    fontWeight: "500",
  },
  tabLabelActive: {
    color: "#F39A20",
  },
  pressed: {
    opacity: 0.68,
  },
});
