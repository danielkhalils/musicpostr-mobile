import React from "react";
import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
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
              return (
                <Home
                  size={20}
                  color={color}
                  fill={isFocused ? color : "transparent"}
                />
              );
            case "reviews":
              return (
                <Users
                  size={20}
                  color={color}
                  strokeWidth={isFocused ? 2.5 : 2}
                />
              );
            case "rankings":
              return (
                <Trophy
                  size={20}
                  color={color}
                  fill={isFocused ? color : "transparent"}
                />
              );
            case "artists":
              return (
                <Search
                  size={20}
                  color={color}
                  strokeWidth={isFocused ? 2.6 : 2}
                />
              );
            case "profile":
              return (
                <User
                  size={20}
                  color={color}
                  fill={isFocused ? color : "transparent"}
                />
              );
            default:
              return (
                <Home
                  size={20}
                  color={color}
                  fill={isFocused ? color : "transparent"}
                />
              );
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
            accessibilityLabel={options.tabBarAccessibilityLabel || label}
            testID={options.tabBarButtonTestID}
          >
            <View
              style={[
                styles.floatingBarIconWrap,
                isFocused && {
                  backgroundColor: isDark
                    ? "rgba(139, 92, 246, 0.22)"
                    : "rgba(139, 92, 246, 0.14)",
                },
              ]}
            >
              {renderIcon()}
            </View>
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
    borderRadius: 999,
    overflow: "hidden",
  },
  floatingBarIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
