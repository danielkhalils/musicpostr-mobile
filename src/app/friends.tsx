import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { safeGoBack } from '@/utils/navigation';
import { Users, ArrowLeft } from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { MobileHeader } from '@/components/MobileHeader';
import { CoverImage } from '@/components/CoverImage';

interface Friend {
  id: string;
  name: string;
  username: string;
  avatar: string;
  reviewsCount: number;
}

export default function FriendsScreen() {
  const { username } = useLocalSearchParams<{ username?: string }>();
  const isVisiting = Boolean(username);
  const { colors } = useAppTheme();

  const [friends] = useState<Friend[]>([
    {
      id: '1',
      name: 'Lucas Sound',
      username: 'lucas_snd',
      avatar:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=65&w=150',
      reviewsCount: 34,
    },
    {
      id: '2',
      name: 'Beat Critic',
      username: 'beatcritic',
      avatar:
        'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=65&w=150',
      reviewsCount: 51,
    },
  ]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <MobileHeader />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => safeGoBack('/(tabs)/profile')}
        >
          <ArrowLeft size={15} color={colors.mutedForeground} />
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: colors.mutedForeground,
            }}
          >
            Voltar ao Perfil
          </Text>
        </TouchableOpacity>

        <View style={styles.headerBlock}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Users size={24} color={colors.primary} />
            <Text style={[styles.pageTitle, { color: colors.foreground }]}>
              {isVisiting ? `Amigos de @${username}` : 'Minha Rede de Amigos'}
            </Text>
          </View>
          <Text
            style={[styles.pageSubtitle, { color: colors.mutedForeground }]}
          >
            Críticos e entusiastas musicais conectados.
          </Text>
        </View>

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
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 999,
  },
  profileBtn: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
