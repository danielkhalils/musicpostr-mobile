import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export type AudienceOption = 'everyone' | 'friends' | 'nobody';
export type FeedSortOption = 'for_you' | 'recent' | 'friends_only';
export type RatingScaleOption = '5_stars' | '10_points' | '100_points';
export type StreamingServiceOption = 'spotify' | 'apple_music' | 'youtube_music' | 'deezer' | 'tidal';
export type ImageQualityOption = 'auto' | 'high' | 'data_saver';
export type FontScaleOption = 'compact' | 'default' | 'large';
export type AppLanguageOption = 'pt-BR' | 'en-US' | 'es-ES';
export type DailyLimitOption = 'off' | '30m' | '1h' | '2h';

export interface ExtendedSettings {
  // Perfil extra
  pronouns: string;
  location: string;
  // Segurança
  twoFactorEnabled: boolean;
  loginAlerts: boolean;
  suspiciousLoginApproval: boolean;
  // Privacidade & Interações
  whoCanComment: AudienceOption;
  whoCanMention: AudienceOption;
  whoCanMessage: AudienceOption;
  showOnlineStatus: boolean;
  showListeningActivity: boolean;
  discoverableByContact: boolean;
  allowSearchEngineIndexing: boolean;
  // Moderação & Bem-Estar
  blockedUsers: string[];
  mutedUsers: string[];
  mutedWords: string[];
  hideExplicitContent: boolean;
  hideReleaseSpoilers: boolean;
  dailyUsageLimit: DailyLimitOption;
  // Notificações granulares
  pushNotifEnabled: boolean;
  quietHoursEnabled: boolean;
  notifLikes: boolean;
  notifComments: boolean;
  notifNewFollowers: boolean;
  notifMentions: boolean;
  notifFollowedLists: boolean;
  notifWeeklyDigest: boolean;
  // Conteúdo, Feed & Música
  defaultFeedSort: FeedSortOption;
  ratingScale: RatingScaleOption;
  showCommunityRatingBeforeReview: boolean;
  preferredStreaming: StreamingServiceOption;
  autoplayPreviews: boolean;
  imageQuality: ImageQualityOption;
  // Aparência & Acessibilidade
  language: AppLanguageOption;
  fontScale: FontScaleOption;
  reduceMotion: boolean;
  highContrast: boolean;
  hapticFeedback: boolean;
  // Conexões musicais extras
  isLinkedSpotify: boolean;
  isLinkedLastfm: boolean;
}

export const DEFAULT_EXTENDED_SETTINGS: ExtendedSettings = {
  pronouns: '',
  location: '',
  twoFactorEnabled: false,
  loginAlerts: true,
  suspiciousLoginApproval: true,
  whoCanComment: 'everyone',
  whoCanMention: 'everyone',
  whoCanMessage: 'friends',
  showOnlineStatus: true,
  showListeningActivity: true,
  discoverableByContact: false,
  allowSearchEngineIndexing: true,
  blockedUsers: [],
  mutedUsers: [],
  mutedWords: [],
  hideExplicitContent: false,
  hideReleaseSpoilers: false,
  dailyUsageLimit: 'off',
  pushNotifEnabled: true,
  quietHoursEnabled: false,
  notifLikes: true,
  notifComments: true,
  notifNewFollowers: true,
  notifMentions: true,
  notifFollowedLists: true,
  notifWeeklyDigest: false,
  defaultFeedSort: 'for_you',
  ratingScale: '5_stars',
  showCommunityRatingBeforeReview: true,
  preferredStreaming: 'spotify',
  autoplayPreviews: false,
  imageQuality: 'auto',
  language: 'pt-BR',
  fontScale: 'default',
  reduceMotion: false,
  highContrast: false,
  hapticFeedback: true,
  isLinkedSpotify: false,
  isLinkedLastfm: false,
};

const EXTENDED_SETTINGS_KEY = 'musicpostr_extended_settings_v1';
const isWebSSR = Platform.OS === 'web' && typeof window === 'undefined';

export async function loadExtendedSettings(userId?: string): Promise<ExtendedSettings> {
  if (isWebSSR) return { ...DEFAULT_EXTENDED_SETTINGS };
  try {
    const key = userId ? `${EXTENDED_SETTINGS_KEY}_${userId}` : EXTENDED_SETTINGS_KEY;
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return { ...DEFAULT_EXTENDED_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<ExtendedSettings>;
    return { ...DEFAULT_EXTENDED_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_EXTENDED_SETTINGS };
  }
}

export async function saveExtendedSettings(
  settings: ExtendedSettings,
  userId?: string
): Promise<boolean> {
  if (isWebSSR) return true;
  try {
    const key = userId ? `${EXTENDED_SETTINGS_KEY}_${userId}` : EXTENDED_SETTINGS_KEY;
    await AsyncStorage.setItem(key, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

export async function clearTemporaryCache(): Promise<number> {
  if (isWebSSR) return 0;
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(
      (k) =>
        k.includes('cache') ||
        k.includes('cover_') ||
        k.includes('artist_img_') ||
        k.includes('musicbrainz_')
    );
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
    return cacheKeys.length;
  } catch {
    return 0;
  }
}
