import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAppTheme } from '@/context/ThemeContext';
import { ProfileView } from '@/app/(tabs)/profile';

export default function VisitingUserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { colors } = useAppTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ProfileView visitingUsername={username} />
    </View>
  );
}
