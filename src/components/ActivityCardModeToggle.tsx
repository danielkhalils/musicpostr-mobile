import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LayoutList, Square } from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { type ActivityCardMode } from '@/services/settings.service';

interface ActivityCardModeToggleProps {
  mode: ActivityCardMode;
  onChange: (mode: ActivityCardMode) => void;
  compactLabels?: boolean;
}

export function ActivityCardModeToggle({
  mode,
  onChange,
  compactLabels = false,
}: ActivityCardModeToggleProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <TouchableOpacity
        onPress={() => onChange('full')}
        activeOpacity={0.8}
        accessibilityLabel="Visualização completa"
        style={[
          styles.btn,
          mode === 'full' && { backgroundColor: colors.primary },
        ]}
      >
        <Square
          size={12}
          color={mode === 'full' ? '#fff' : colors.mutedForeground}
        />
        {!compactLabels && (
          <Text
            style={[
              styles.label,
              { color: mode === 'full' ? '#fff' : colors.mutedForeground },
            ]}
          >
            Completo
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onChange('compact')}
        activeOpacity={0.8}
        accessibilityLabel="Visualização compacta"
        style={[
          styles.btn,
          mode === 'compact' && { backgroundColor: colors.primary },
        ]}
      >
        <LayoutList
          size={12}
          color={mode === 'compact' ? '#fff' : colors.mutedForeground}
        />
        {!compactLabels && (
          <Text
            style={[
              styles.label,
              { color: mode === 'compact' ? '#fff' : colors.mutedForeground },
            ]}
          >
            Compacto
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    padding: 2,
    gap: 2,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
});
