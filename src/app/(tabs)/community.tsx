import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Image,
  ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

const DESIGN_WIDTH = 402;

type CommunityCategory = {
  id: string;
  label: string;
  watermarkImage: ImageSourcePropType;
  backgroundColor: string;
  image: ImageSourcePropType;
  top: number;
};

const categories: CommunityCategory[] = [
  {
    id: "buddy",
    label: "我的搭子",
    watermarkImage: require("@/assets/images/fastuse/我的搭子背景.png"),
    backgroundColor: "#FBE8ED",
    image: require("@/assets/images/community/asset-12.png"),
    top: 5,
  },
  {
    id: "study-room",
    label: "自习室",
    watermarkImage: require("@/assets/images/fastuse/自习室背景.png"),
    backgroundColor: "#E8F5FD",
    image: require("@/assets/images/community/asset-00.png"),
    top: 30,
  },
  {
    id: "career",
    label: "职通车",
    watermarkImage: require("@/assets/images/fastuse/职通车背景.png"),
    backgroundColor: "#FFF0DB",
    image: require("@/assets/images/community/asset-13.png"),
    top: 5,
  },
  {
    id: "help",
    label: "互助站",
    watermarkImage: require("@/assets/images/fastuse/互助站背景.png"),
    backgroundColor: "#FFE8E1",
    image: require("@/assets/images/community/asset-14.png"),
    top: 30,
  },
];

function BookmarkIcon() {
  return (
    <Svg width={22} height={24} viewBox="0 0 22 24">
      <Path
        d="M5 3.5h12v16l-6-3.5-6 3.5v-16Z"
        fill="none"
        stroke="#994912"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SocialIcon({ type }: { type: "like" | "comment" }) {
  if (type === "comment") {
    return (
      <Svg width={27} height={25} viewBox="0 0 27 25">
        <Path
          d="M4 3.5h16.5a2.5 2.5 0 0 1 2.5 2.5v9.5a2.5 2.5 0 0 1-2.5 2.5h-7L8 22v-4H4a2.5 2.5 0 0 1-2.5-2.5V6A2.5 2.5 0 0 1 4 3.5Z"
          fill="none"
          stroke="#9B9B9B"
          strokeWidth="1.45"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  return (
    <Svg width={27} height={25} viewBox="0 0 27 25">
      <Path
        d="M8 10.5 11.4 3c.6-1.3 2.5-.9 2.5.6v5.1h6.3c1.5 0 2.6 1.4 2.2 2.8l-2 8.2a2.3 2.3 0 0 1-2.2 1.8H8m0-11v11H3.5A1.5 1.5 0 0 1 2 20V12a1.5 1.5 0 0 1 1.5-1.5H8Z"
        fill="none"
        stroke="#9B9B9B"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FollowButton({ followed = false }: { followed?: boolean }) {
  const [isFollowed, setIsFollowed] = useState(followed);

  return (
    <Pressable
      onPress={() => setIsFollowed((current) => !current)}
      style={({ pressed }) => [
        styles.followButton,
        {
          backgroundColor: isFollowed ? "#FFEEDB" : "#FFD29B",
        },
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.followButtonText}>
        {isFollowed ? "已关注" : "关注"}
      </Text>
    </Pressable>
  );
}

function Avatar({
  source,
  backgroundColor,
}: {
  source: ImageSourcePropType;
  backgroundColor: string;
}) {
  return (
    <View style={[styles.avatar, { backgroundColor }]}>
      <Image source={source} style={styles.avatarImage} resizeMode="contain" />
    </View>
  );
}

function PostHeader({
  avatar,
  avatarColor,
  name,
  time,
  followed,
}: {
  avatar: ImageSourcePropType;
  avatarColor: string;
  name: string;
  time: string;
  followed?: boolean;
}) {
  return (
    <View style={styles.postHeader}>
      <Avatar source={avatar} backgroundColor={avatarColor} />
      <View style={styles.authorCopy}>
        <Text style={styles.authorName}>{name}</Text>
        <Text style={styles.postTime}>{time}</Text>
      </View>
      <FollowButton followed={followed} />
    </View>
  );
}

function SocialActions() {
  return (
    <View style={styles.socialActions}>
      <View style={styles.socialMetric}>
        <SocialIcon type="like" />
        <Text style={styles.socialCount}>92</Text>
      </View>
      <View style={styles.socialMetric}>
        <SocialIcon type="comment" />
        <Text style={styles.socialCount}>11</Text>
      </View>
      <Text style={styles.ellipsis}>•••</Text>
    </View>
  );
}

function SleepPost() {
  return (
    <View style={[styles.postCard, styles.sleepPost]}>
      <PostHeader
        avatar={require("@/assets/images/community/asset-10.png")}
        avatarColor="#DCECF9"
        name="Jessica"
        time="三小时前"
      />
      <Text style={styles.shortPostText}>Study or sleep？</Text>
      <Image
        source={require("@/assets/images/community/asset-09.jpg")}
        style={styles.sleepPhoto}
        resizeMode="cover"
      />
      <SocialActions />
    </View>
  );
}

const tripImages = [
  require("@/assets/images/community/asset-02.jpg"),
  require("@/assets/images/community/asset-04.jpg"),
  require("@/assets/images/community/asset-06.jpg"),
  require("@/assets/images/community/asset-03.jpg"),
  require("@/assets/images/community/asset-05.jpg"),
];

function TripPost() {
  return (
    <View style={[styles.postCard, styles.tripPost]}>
      <PostHeader
        avatar={require("@/assets/images/community/asset-08.png")}
        avatarColor="#FFE4BC"
        name="Minbie"
        time="昨天"
        followed
      />
      <Text style={styles.tripText}>
        《爱因斯坦的梦》住在山上的人{`\n`}在过去，曾有一天，科学家发现：离地...
        <Text style={styles.moreText}>展示更多</Text>
      </Text>
      <View style={styles.tripGrid}>
        {tripImages.map((source, index) => (
          <Image
            key={index}
            source={source}
            style={styles.tripImage}
            resizeMode="cover"
          />
        ))}
      </View>
      <SocialActions />
    </View>
  );
}

function BookPost() {
  return (
    <View style={[styles.postCard, styles.bookPost]}>
      <PostHeader
        avatar={require("@/assets/images/community/asset-07.png")}
        avatarColor="#F1E2FF"
        name="Caaary"
        time="三小时前"
      />
      <Text style={styles.bookPostText}>
        从方法论的角度来讨论外语！{`\n`}在学习的过程中你是如何调整心态的...
        <Text style={styles.moreText}>展示更多</Text>
      </Text>
      <Image
        source={require("@/assets/images/community/asset-01.jpg")}
        style={styles.bookCover}
        resizeMode="cover"
      />
      <SocialActions />
    </View>
  );
}

export default function CommunityScreen() {
  const { width } = useWindowDimensions();
  const pageWidth = Math.min(width, DESIGN_WIDTH);
  const [selectedCategory, setSelectedCategory] = useState("help");
  const selectedLabel =
    selectedCategory === "all"
      ? "全部"
      : (categories.find((item) => item.id === selectedCategory)?.label ??
        "互助站");

  return (
    <LinearGradient
      colors={["#F7FAFF", "#FFF5EE", "#FFF8F3"]}
      locations={[0, 0.34, 1]}
      style={styles.screen}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.page, { width: pageWidth }]}>
          <View pointerEvents="none" style={styles.topGlowOrange} />
          <View pointerEvents="none" style={styles.topGlowBlue} />

          <View style={styles.header}>
            <Pressable
              style={({ pressed }) => [
                styles.headerButton,
                pressed && styles.pressed,
              ]}
            >
              <BookmarkIcon />
            </Pressable>
            <Text style={styles.headerTitle}>社区</Text>
            <Pressable
              style={({ pressed }) => [
                styles.headerButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.plus}>＋</Text>
            </Pressable>
          </View>

          <View style={styles.categoryArea}>
            {categories.map((item, index) => {
              const selected = item.id === selectedCategory;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setSelectedCategory(item.id)}
                  style={({ pressed }) => [
                    styles.categoryCard,
                    {
                      top: item.top,
                      left: index * 93,
                      backgroundColor: item.backgroundColor,
                    },
                    selected && styles.categoryCardSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.categoryLabel}>{item.label}</Text>
                  <Image
                    source={item.watermarkImage}
                    style={styles.categoryWatermarkImage}
                    resizeMode="contain"
                  />
                  <Image
                    source={item.image}
                    style={styles.categoryImage}
                    resizeMode="contain"
                  />
                </Pressable>
              );
            })}
          </View>

          <View style={styles.filterBar}>
            <Text style={styles.filterText}>当前显示：{selectedLabel}</Text>
            <Pressable onPress={() => setSelectedCategory("all")}>
              <Text style={styles.showAll}>显示全部</Text>
            </Pressable>
          </View>

          <SleepPost />
          <TripPost />
          <BookPost />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    alignItems: "center",
    paddingBottom: 135,
  },
  page: {
    position: "relative",
    minHeight: 1375,
    overflow: "hidden",
  },
  topGlowOrange: {
    position: "absolute",
    top: -75,
    right: -52,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "rgba(255, 190, 113, 0.22)",
  },
  topGlowBlue: {
    position: "absolute",
    top: -68,
    left: -80,
    width: 235,
    height: 235,
    borderRadius: 118,
    backgroundColor: "rgba(189, 218, 255, 0.18)",
  },
  header: {
    height: 50,
    marginTop: 28,
    marginHorizontal: 19,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerButton: {
    width: 34,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#111111",
    fontSize: 20,
    fontWeight: "500",
  },
  plus: {
    color: "#994912",
    fontSize: 35,
    fontWeight: "300",
    lineHeight: 38,
  },
  categoryArea: {
    position: "relative",
    height: 145,
    marginHorizontal: 20,
  },
  categoryCard: {
    position: "absolute",
    width: 83,
    height: 110,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 12,
    boxShadow: "0 5px 10px rgba(125, 79, 52, 0.13)",
  },
  categoryCardSelected: {
    borderColor: "rgba(237, 145, 104, 0.35)",
  },
  categoryLabel: {
    position: "absolute",
    top: 18,
    left: 12,
    zIndex: 2,
    color: "#171717",
    fontSize: 15,
    fontWeight: "500",
  },
  categoryWatermarkImage: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 42,
    height: 42,
  },
  categoryImage: {
    position: "absolute",
    bottom: -3,
    left: 4,
    width: 73,
    height: 65,
  },
  filterBar: {
    height: 40,
    marginTop: 5,
    marginHorizontal: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.88)",
  },
  filterText: {
    color: "#8A4B29",
    fontSize: 14,
  },
  showAll: {
    color: "#FF842B",
    fontSize: 14,
  },
  postCard: {
    position: "relative",
    marginHorizontal: 12,
    paddingTop: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  sleepPost: {
    height: 289,
    marginTop: 10,
  },
  tripPost: {
    height: 382,
    marginTop: 18,
  },
  bookPost: {
    height: 373,
    marginTop: 11,
  },
  postHeader: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    overflow: "hidden",
    borderRadius: 25,
  },
  avatarImage: {
    width: 50,
    height: 50,
  },
  authorCopy: {
    marginLeft: 10,
    flex: 1,
  },
  authorName: {
    color: "#0F0F0F",
    fontSize: 14,
    fontWeight: "500",
  },
  postTime: {
    marginTop: 3,
    color: "#B8B8B8",
    fontSize: 12,
  },
  followButton: {
    width: 69,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D26A16",
    borderRadius: 17,
    backgroundColor: "#FFD29B",
  },
  followButtonText: {
    color: "#98551F",
    fontSize: 14,
  },
  shortPostText: {
    marginTop: 10,
    color: "#151515",
    fontSize: 13,
  },
  sleepPhoto: {
    width: 211,
    height: 134,
    marginTop: 7,
    borderRadius: 11,
  },
  socialActions: {
    position: "absolute",
    right: 18,
    bottom: 12,
    left: 18,
    height: 30,
    flexDirection: "row",
    alignItems: "center",
  },
  socialMetric: {
    marginRight: 41,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  socialCount: {
    color: "#111111",
    fontSize: 12,
  },
  ellipsis: {
    marginLeft: "auto",
    color: "#969696",
    fontSize: 15,
    letterSpacing: 2,
  },
  tripText: {
    marginTop: 10,
    color: "#171717",
    fontSize: 13,
    lineHeight: 19,
  },
  moreText: {
    color: "#B2B2B2",
  },
  tripGrid: {
    width: 320,
    marginTop: 7,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tripImage: {
    width: 100,
    height: 100,
  },
  bookPostText: {
    marginTop: 10,
    color: "#171717",
    fontSize: 13,
    lineHeight: 18,
  },
  bookCover: {
    width: 100,
    height: 200,
    marginTop: 7,
    borderRadius: 8,
  },
  pressed: {
    opacity: 0.68,
  },
});
