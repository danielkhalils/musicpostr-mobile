import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useAppTheme } from '@/context/ThemeContext';
import { useHeaderVisibility } from '@/context/HeaderVisibilityContext';

export function MobileHeader() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { isHeaderVisible } = useHeaderVisibility();
  const anim = useRef(new Animated.Value(1)).current;

  const headerHeight = Math.max(insets.top, 10) + 40;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: isHeaderVisible ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [isHeaderVisible, anim]);

  const height = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, headerHeight],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Animated.View
      style={[
        styles.headerContainer,
        {
          height,
          opacity,
          paddingTop: Math.max(insets.top, 10),
          backgroundColor: colors.background,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.brandRow}
          onPress={() => router.push('/(tabs)/index' as any)}
          activeOpacity={0.8}
        >
          <Image
            source={require('@/assets/icon_transparent_96x96.png')}
            style={styles.brandLogoImg}
            contentFit="contain"
          />
          <Text style={[styles.brandText, { color: colors.foreground }]}>
            MUSICPOSTR
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingBottom: 6,
    paddingHorizontal: 14,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  brandLogoImg: {
    width: 28,
    height: 28,
  },
  brandText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
