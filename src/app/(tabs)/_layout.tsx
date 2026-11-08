import React from 'react';
import { View, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import {
  Home,
  Compass,
  Trophy,
  Mic,
  Sparkles,
  User,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { MobileHeader } from '@/components/MobileHeader';

export default function TabsLayout() {
  const { colors } = useAppTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <MobileHeader />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.mutedForeground,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 84 : 64,
            paddingTop: 6,
            paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '700',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Início',
            tabBarIcon: ({ color, size }) => (
              <Home size={size - 2} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="reviews"
          options={{
            title: 'Reviews',
            tabBarIcon: ({ color, size }) => (
              <Compass size={size - 2} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="rankings"
          options={{
            title: 'Rankings',
            tabBarIcon: ({ color, size }) => (
              <Trophy size={size - 2} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="artists"
          options={{
            title: 'Artistas',
            tabBarIcon: ({ color, size }) => (
              <Mic size={size - 2} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="feed"
          options={{
            title: 'Timeline',
            tabBarIcon: ({ color, size }) => (
              <Sparkles size={size - 2} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color, size }) => (
              <User size={size - 2} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
