import React, { type ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  rightAction?: ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  onBack,
  backLabel = 'Voltar',
  rightAction,
}: PageHeaderProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      {onBack && (
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.75}
        >
          <ArrowLeft size={15} color={colors.mutedForeground} />
          <Text style={[styles.backText, { color: colors.mutedForeground }]}>
            {backLabel}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.titleRow}>
        <Text
          style={[styles.mainPageTitle, { color: colors.foreground }]}
          numberOfLines={2}
        >
          {title}
        </Text>
        {rightAction ? <View style={styles.rightWrap}>{rightAction}</View> : null}
      </View>

      {Boolean(subtitle) && (
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 2,
    gap: 4,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  backText: {
    fontSize: 12,
    fontWeight: '700',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  mainPageTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.6,
    flexShrink: 1,
  },
  rightWrap: {
    flexShrink: 0,
  },
  subtitle: {
    fontSize: 12.5,
    lineHeight: 18,
  },
});
