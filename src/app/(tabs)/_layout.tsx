import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Tabs } from "expo-router";
import { Home, Search, Trophy, User, Users } from "lucide-react-native";
import { useAppTheme } from "@/context/ThemeContext";

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>["tabBar"]>>[0];

function FloatingTabsBar({ state, descriptors, navigateToTab, insets }: TabBarProps) {
  const { colors, isDark } = useAppTheme();
  const bottomOffset = Math.max(insets.bottom, Platform.OS === "ios" ? 14 : 10);

  return (
    <View
      style={[
        styles.floatingBottomBar,
        {
          bottom: bottomOffset,
          backgroundColor: isDark
            ? "rgba(24, 24, 27, 0.94)"
            : "rgba(255, 255, 255, 0.94)",
          borderColor: colors.border,
          shadowColor: "#000",
          shadowOpacity: isDark ? 0.4 : 0.12,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        if ((options as any).href === null || route.name === "feed") {
          return null;
        }

        const isFocused = state.index === index;
        const color = isFocused ? colors.primary : colors.mutedForeground;

        const label =
          options.title !== undefined
            ? options.title
            : options.tabBarLabel !== undefined
            ? (options.tabBarLabel as string)
            : route.name;

        const onPress = () => {
          if (!isFocused) {
            navigateToTab(route.key);
          }
        };

        const renderIcon = () => {
          switch (route.name) {
            case "index":
              return <Home size={18} color={color} />;
            case "reviews":
              return <Users size={18} color={color} />;
            case "rankings":
              return <Trophy size={18} color={color} />;
            case "artists":
              return <Search size={18} color={color} />;
            case "profile":
              return <User size={18} color={color} />;
            default:
              return <Home size={18} color={color} />;
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.floatingBarItem}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
          >
            <View
              style={[
                styles.floatingBarIconWrap,
                isFocused && { backgroundColor: `${colors.primary}20` },
              ]}
            >
              {renderIcon()}
            </View>
            <Text
              style={[styles.floatingBarLabel, { color }]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useAppTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Tabs
        tabBar={(props) => <FloatingTabsBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.background },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Início",
          }}
        />
        <Tabs.Screen
          name="reviews"
          options={{
            title: "Comunidades",
          }}
        />
        <Tabs.Screen
          name="rankings"
          options={{
            title: "Rankings",
          }}
        />
        <Tabs.Screen
          name="artists"
          options={{
            title: "Buscar",
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Perfil",
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

const styles = StyleSheet.create({
  floatingBottomBar: {
    position: "absolute",
    left: 16,
    right: 16,
    height: 64,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 12,
    zIndex: 25,
  },
  floatingBarItem: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: 6,
  },
  floatingBarIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingBarLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
});
