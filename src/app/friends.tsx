import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { safeGoBack } from '@/utils/navigation';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageHeader } from '@/components/PageHeader';
import { CoverImage } from '@/components/CoverImage';
import {
  type FriendProfileRecord,
  getUserFriends,
} from '@/services/profile.service';

export default function FriendsScreen() {
  const { username } = useLocalSearchParams<{ username?: string }>();
  const isVisiting = Boolean(username);
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [friends, setFriends] = useState<FriendProfileRecord[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (isVisiting && username) {
        const data = await getUserFriends({ username });
        if (active) setFriends(data);
      } else if (user) {
        const data = await getUserFriends({ userId: user.id });
        if (active) setFriends(data);
      } else {
        setFriends([]);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [isVisiting, username, user]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.container,
          { paddingTop: Math.max(insets.top, 16) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader
          title={isVisiting ? `Amigos de @${username}` : 'Amigos'}
          subtitle="Críticos e entusiastas musicais conectados."
          onBack={() => safeGoBack('/(tabs)/profile')}
          backLabel="Voltar ao Perfil"
        />

        <View style={{ gap: 12 }}>
          {friends.map((friend) => (
            <View
              key={friend.id}
              style={[
                styles.friendCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <CoverImage
                uri={friend.avatar}
                style={styles.avatar}
                fallbackType="artist"
              />
              <View style={{ flex: 1, gap: 2 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '800',
                    color: colors.foreground,
                  }}
                >
                  {friend.name}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: colors.primary,
                  }}
                >
                  @{friend.username}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: colors.mutedForeground,
                  }}
                >
                  {friend.reviewsCount} avaliações publicadas
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push(`/user/${friend.username}` as any)}
                style={[
                  styles.profileBtn,
                  {
                    backgroundColor: colors.secondary,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: colors.foreground,
                  }}
                >
                  Ver Perfil
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
    paddingBottom: 36,
    gap: 14,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerBlock: {
    gap: 4,
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  pageSubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 999,
  },
  profileBtn: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
