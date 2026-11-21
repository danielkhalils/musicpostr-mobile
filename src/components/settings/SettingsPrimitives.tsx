import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  TextInput,
  StyleSheet,
  type KeyboardTypeOptions,
} from 'react-native';
import { ArrowLeft, ChevronRight, Check } from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';

export function SettingsSectionCard({
  title,
  icon,
  subtitle,
  children,
}: {
  title?: string;
  icon?: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        styles.sectionCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {title && (
        <View style={{ gap: 2 }}>
          <View style={styles.sectionTitleRow}>
            {icon}
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {title}
            </Text>
          </View>
          {subtitle ? (
            <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      )}
      {children}
    </View>
  );
}

export function SettingsSubHeader({
  title,
  subtitle,
  icon,
  onBack,
}: {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  onBack: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.subHeaderBox, { borderBottomColor: colors.border }]}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
        <ArrowLeft size={15} color={colors.mutedForeground} />
        <Text style={[styles.backBtnText, { color: colors.mutedForeground }]}>
          Todas as Configurações
        </Text>
      </TouchableOpacity>
      <View style={styles.subHeaderTitleRow}>
        {icon}
        <Text style={[styles.subHeaderTitle, { color: colors.foreground }]}>
          {title}
        </Text>
      </View>
      <Text style={[styles.subHeaderSubtitle, { color: colors.mutedForeground }]}>
        {subtitle}
      </Text>
    </View>
  );
}

export function SettingsMenuRow({
  icon,
  iconBg,
  title,
  subtitle,
  badge,
  onPress,
  destructive,
  showDivider = true,
}: {
  icon: React.ReactNode;
  iconBg?: string;
  title: string;
  subtitle?: string;
  badge?: string;
  onPress: () => void;
  destructive?: boolean;
  showDivider?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.72}
      style={[
        styles.menuRow,
        showDivider && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      <View
        style={[
          styles.iconBadge,
          {
            backgroundColor:
              iconBg || (destructive ? `${colors.destructive}18` : `${colors.primary}18`),
          },
        ]}
      >
        {icon}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={[
            styles.menuTitle,
            { color: destructive ? colors.destructive : colors.foreground },
          ]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[styles.menuSubtitle, { color: colors.mutedForeground }]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {badge ? (
        <View
          style={[
            styles.valueBadge,
            { backgroundColor: colors.secondary, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.valueBadgeText, { color: colors.mutedForeground }]}>
            {badge}
          </Text>
        </View>
      ) : null}
      <ChevronRight size={16} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

export function SettingsToggleRow({
  title,
  subtitle,
  value,
  onValueChange,
  disabled,
  showDivider = false,
}: {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  disabled?: boolean;
  showDivider?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        styles.switchRow,
        showDivider && {
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          paddingBottom: 12,
        },
      ]}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '700',
            color: disabled ? colors.mutedForeground : colors.foreground,
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ fontSize: 11, color: colors.mutedForeground, lineHeight: 15 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.secondary, true: colors.primary }}
      />
    </View>
  );
}

export function SettingsChoiceGroup<T extends string>({
  label,
  helper,
  options,
  value,
  onChange,
  layout = 'stack',
}: {
  label?: string;
  helper?: string;
  options: { value: T; label: string; description?: string }[];
  value: T;
  onChange: (val: T) => void;
  layout?: 'stack' | 'pills';
}) {
  const { colors } = useAppTheme();

  if (layout === 'pills') {
    return (
      <View style={styles.fieldGroup}>
        {label ? (
          <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
        ) : null}
        {helper ? (
          <Text style={{ fontSize: 11, color: colors.mutedForeground, marginBottom: 4 }}>
            {helper}
          </Text>
        ) : null}
        <View style={styles.pillWrap}>
          {options.map((opt) => {
            const active = value === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => onChange(opt.value)}
                activeOpacity={0.75}
                style={[
                  styles.pillBtn,
                  {
                    backgroundColor: active ? `${colors.primary}20` : colors.secondary,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: active ? '800' : '600',
                    color: active ? colors.primary : colors.foreground,
                  }}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fieldGroup}>
      {label ? (
        <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      ) : null}
      {helper ? (
        <Text style={{ fontSize: 11, color: colors.mutedForeground, marginBottom: 4 }}>
          {helper}
        </Text>
      ) : null}
      <View style={{ gap: 8 }}>
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onChange(opt.value)}
              activeOpacity={0.78}
              style={[
                styles.radioCard,
                {
                  backgroundColor: active ? `${colors.primary}15` : colors.secondary,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
            >
              <View style={styles.radioHeader}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '800',
                    color: colors.foreground,
                    flex: 1,
                  }}
                >
                  {opt.label}
                </Text>
                {active ? <Check size={15} color={colors.primary} /> : null}
              </View>
              {opt.description ? (
                <Text
                  style={{
                    fontSize: 11,
                    color: colors.mutedForeground,
                    marginTop: 2,
                    lineHeight: 15,
                  }}
                >
                  {opt.description}
                </Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export function SettingsInputField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  secureTextEntry,
  keyboardType,
  maxLength,
  autoCapitalize,
  helper,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  helper?: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.fieldGroup}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
        {maxLength ? (
          <Text style={{ fontSize: 10, color: colors.mutedForeground }}>
            {value.length}/{maxLength}
          </Text>
        ) : null}
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        style={[
          multiline ? styles.textarea : styles.input,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
            color: colors.foreground,
          },
        ]}
      />
      {helper ? (
        <Text style={{ fontSize: 10, color: colors.mutedForeground }}>{helper}</Text>
      ) : null}
    </View>
  );
}

export function SettingsDivider() {
  const { colors } = useAppTheme();
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

const styles = StyleSheet.create({
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  subHeaderBox: {
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 6,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  subHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  subHeaderTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  subHeaderSubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  menuSubtitle: {
    fontSize: 11,
    lineHeight: 15,
  },
  valueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  valueBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 3,
  },
  fieldGroup: {
    gap: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    height: 41,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  textarea: {
    minHeight: 80,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  radioCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  radioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  divider: {
    height: 1,
    marginVertical: 2,
  },
});
