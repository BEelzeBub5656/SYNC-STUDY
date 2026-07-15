import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { useEffect, useState } from 'react';
import {
  Animated,
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

const TAB_BAR_HEIGHT = 94;
const TAB_BAR_MAX_WIDTH = 404;
const TAB_BAR_SIDE_MARGIN = 10;
const CENTER_MASCOT_SIZE = 55;
const ACTIVE_BUBBLE_SIZE = 74;

type TabsProps = ComponentProps<typeof Tabs>;
type AnimatedTabBarProps = Parameters<NonNullable<TabsProps['tabBar']>>[0];

type TabConfig = {
  label: string;
  icon: ImageSourcePropType;
  activeIcon?: ImageSourcePropType;
  activeBubbleColor: string;
  isCenter?: boolean;
};

const tabConfigs: Record<string, TabConfig> = {
  study: {
    label: '主页',
    icon: require('@/assets/images/study/button1.png'),
    activeIcon: require('@/assets/images/study/button1-active.png'),
    activeBubbleColor: '#CDEAFA',
  },
  plan: {
    label: '计划',
    icon: require('@/assets/images/study/button2.png'),
    activeIcon: require('@/assets/images/study/button2-active.png'),
    activeBubbleColor: '#E2DCF1',
  },
  ai: {
    label: '',
    icon: require('@/assets/images/study/icon2.png'),
    activeBubbleColor: '#FFFFFF',
    isCenter: true,
  },
  community: {
    label: '社区',
    icon: require('@/assets/images/study/button3.png'),
    activeIcon: require('@/assets/images/study/button3-active.png'),
    activeBubbleColor: '#DBF1CD',
  },
  profile: {
    label: '我的',
    icon: require('@/assets/images/study/button4.png'),
    activeIcon: require('@/assets/images/study/button4-active.png'),
    activeBubbleColor: '#FFE2CD',
  },
};

function AnimatedTabBar({ state, navigation, insets }: AnimatedTabBarProps) {
  const { width } = useWindowDimensions();
  const [animatedIndex] = useState(() => new Animated.Value(state.index));
  const tabBarWidth = Math.min(width - TAB_BAR_SIDE_MARGIN * 2, TAB_BAR_MAX_WIDTH);
  const tabBarLeft = (width - tabBarWidth) / 2;
  const itemWidth = tabBarWidth / state.routes.length;
  const activeRoute = state.routes[state.index];
  const activeBubbleColor =
    tabConfigs[activeRoute?.name]?.activeBubbleColor ?? '#CDEAFA';

  useEffect(() => {
    Animated.spring(animatedIndex, {
      toValue: state.index,
      damping: 18,
      stiffness: 180,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  }, [animatedIndex, state.index]);

  const bubbleTranslateX = animatedIndex.interpolate({
    inputRange: state.routes.map((_, index) => index),
    outputRange: state.routes.map(
      (_, index) => index * itemWidth + (itemWidth - ACTIVE_BUBBLE_SIZE) / 2
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
      ]}>
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

      <View style={styles.tabItems}>
        {state.routes.map((route, index) => {
          const config = tabConfigs[route.name];

          if (!config) return null;

          const focused = state.index === index;
          const source = focused && config.activeIcon ? config.activeIcon : config.icon;

          function handlePress() {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          }

          function handleLongPress() {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          }

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={config.isCenter ? 'AI 问答页面' : `${config.label}页面`}
              onPress={handlePress}
              onLongPress={handleLongPress}
              style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
              <View style={[styles.tabContent, config.isCenter && styles.centerTabContent]}>
                <Image
                  source={source}
                  style={config.isCenter ? styles.centerTabIcon : styles.tabIcon}
                  resizeMode="contain"
                />
                {config.label ? (
                  <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
                    {config.label}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="study"
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}>
      <Tabs.Screen name="study" options={{ title: '主页' }} />
      <Tabs.Screen name="plan" options={{ title: '计划' }} />
      <Tabs.Screen name="ai" options={{ title: 'AI' }} />
      <Tabs.Screen name="community" options={{ title: '社区' }} />
      <Tabs.Screen name="profile" options={{ title: '我的' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    height: TAB_BAR_HEIGHT,
  },
  tabBarSurface: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: TAB_BAR_HEIGHT / 2,
    backgroundColor: '#FFC47B',
    boxShadow: '0 7px 18px rgba(103, 69, 40, 0.17)',
  },
  activeBubble: {
    position: 'absolute',
    top: (TAB_BAR_HEIGHT - ACTIVE_BUBBLE_SIZE) / 2,
    left: 0,
    width: ACTIVE_BUBBLE_SIZE,
    height: ACTIVE_BUBBLE_SIZE,
    borderRadius: ACTIVE_BUBBLE_SIZE / 2,
    backgroundColor: '#CDEAFA',
    boxShadow: '0 3px 10px rgba(120, 80, 45, 0.12)',
  },
  tabItems: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: 'row',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTabContent: {
    transform: [{ translateY: -2 }],
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
    color: '#554B43',
    fontSize: 12,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#F39A20',
  },
  pressed: {
    opacity: 0.68,
  },
});
