import { useAppTheme } from "@/context/ThemeContext";
import { Tabs } from "expo-router";
import { Home, Search, Trophy, User, Users } from "lucide-react-native";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, Platform.OS === "ios" ? 14 : 10);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.mutedForeground,
          tabBarStyle: {
            position: "absolute",
            bottom: bottomOffset,
            left: 16,
            right: 16,
            height: 62,
            borderRadius: 999,
            backgroundColor: isDark
              ? "rgba(24, 24, 27, 0.94)"
              : "rgba(255, 255, 255, 0.94)",
            borderColor: colors.border,
            borderTopColor: colors.border,
            borderWidth: 1,
            borderTopWidth: 1,
            paddingTop: 10,
            paddingBottom: 10,
            paddingHorizontal: 4,
            elevation: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isDark ? 0.4 : 0.12,
            shadowRadius: 14,
          },
          // tabBarItemStyle: {
          //   height: 48,
          //   alignItems: "center",
          //   justifyContent: "center",
          // },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Início",
            tabBarIcon: ({ color }) => (
              <Home size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="reviews"
          options={{
            title: "Comunidades",
            tabBarIcon: ({ color }) => (
              <Users size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="rankings"
          options={{
            title: "Rankings",
            tabBarIcon: ({ color }) => (
              <Trophy size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="artists"
          options={{
            title: "Buscar",
            tabBarIcon: ({ color }) => (
              <Search size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Perfil",
            tabBarIcon: ({ color }) => (
              <User size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="feed"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </View>
  );
}
