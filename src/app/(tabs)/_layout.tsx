import { MobileHeader } from "@/components/MobileHeader";
import { useAppTheme } from "@/context/ThemeContext";
import { Tabs } from "expo-router";
import { Compass, Home, Search, Trophy, User } from "lucide-react-native";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, Platform.OS === "ios" ? 16 : 12);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <MobileHeader />
      <Tabs
        screenOptions={{
          headerShown: false,
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
              ? "rgba(24, 24, 27, 0.96)"
              : "rgba(255, 255, 255, 0.96)",
            borderColor: colors.border,
            borderTopColor: colors.border,
            borderWidth: 1,
            borderTopWidth: 1,
            paddingTop: 6,
            paddingBottom: 6,
            paddingHorizontal: 8,
            elevation: 14,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isDark ? 0.45 : 0.14,
            shadowRadius: 18,
          },
          tabBarItemStyle: {
            borderRadius: 999,
            marginVertical: 2,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "700",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Início",
            tabBarIcon: ({ color, size }) => (
              <Home size={size - 2} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="reviews"
          options={{
            title: "Reviews",
            tabBarIcon: ({ color, size }) => (
              <Compass size={size - 2} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="rankings"
          options={{
            title: "Rankings",
            tabBarIcon: ({ color, size }) => (
              <Trophy size={size - 2} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="artists"
          options={{
            title: "Buscar",
            tabBarIcon: ({ color, size }) => (
              <Search size={size - 2} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Perfil",
            tabBarIcon: ({ color, size }) => (
              <User size={size - 2} color={color} />
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
