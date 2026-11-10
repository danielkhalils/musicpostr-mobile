import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';

interface TabHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
}

export function TabHeader({ title, subtitle, rightAction }: TabHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.headerContainer,
        {
          paddingTop: Math.max(insets.top, 14),
          backgroundColor: colors.background,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.titleText,
              { color: colors.foreground },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {Boolean(subtitle) && (
            <Text
              style={[
                styles.subtitleText,
                { color: colors.mutedForeground },
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {rightAction && (
          <View style={styles.rightActionContainer}>{rightAction}</View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 12,
    marginTop: 2,
  },
  rightActionContainer: {
    marginLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
