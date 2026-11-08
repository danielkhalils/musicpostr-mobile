import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAppTheme } from '@/context/ThemeContext';
import { MobileHeader } from '@/components/MobileHeader';
import { ProfileView } from '@/app/(tabs)/profile';

export default function VisitingUserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { colors } = useAppTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <MobileHeader />
      <ProfileView visitingUsername={username} />
    </View>
  );
}
