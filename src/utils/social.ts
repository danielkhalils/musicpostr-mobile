import { Alert, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

function looksLikeDomain(value: string): boolean {
  return /^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/.*)?$/i.test(value);
}

/**
 * Converte um link, domínio sem protocolo ou @handle salvo no perfil
 * em uma URL navegável com esquema https://.
 * Retorna null quando o valor é apenas um identificador sem URL (ex.: usuário do Discord).
 */
export function resolveSocialUrl(platform: string, rawValue: string): string | null {
  const value = rawValue.trim();
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (looksLikeDomain(value)) {
    return `https://${value}`;
  }

  const key = platform.toLowerCase().trim().replace(/[\s.-]+/g, '_');
  const handle = value.replace(/^@+/, '');

  switch (key) {
    case 'instagram':
      return `https://instagram.com/${handle}`;
    case 'tiktok':
      return `https://www.tiktok.com/@${handle}`;
    case 'twitter':
    case 'x':
      return `https://x.com/${handle}`;
    case 'threads':
      return `https://www.threads.net/@${handle}`;
    case 'lastfm':
    case 'last_fm':
      return `https://www.last.fm/user/${handle}`;
    case 'youtube':
      return `https://www.youtube.com/@${handle}`;
    case 'spotify':
      return `https://open.spotify.com/user/${handle}`;
    case 'apple_music':
    case 'applemusic':
      return `https://music.apple.com/profile/${handle}`;
    case 'soundcloud':
      return `https://soundcloud.com/${handle}`;
    case 'twitch':
      return `https://www.twitch.tv/${handle}`;
    case 'github':
      return `https://github.com/${handle}`;
    case 'facebook':
      return `https://www.facebook.com/${handle}`;
    case 'bluesky':
    case 'bsky':
      return `https://bsky.app/profile/${handle}`;
    case 'bandcamp':
      return `https://${handle}.bandcamp.com`;
    case 'discord':
      return null;
    default:
      return `https://${value}`;
  }
}

export async function openSocialLink(platform: string, rawValue: string): Promise<void> {
  const value = rawValue.trim();
  if (!value) return;

  const targetUrl = resolveSocialUrl(platform, value);

  if (!targetUrl) {
    Alert.alert('Discord', `Usuário: ${value}`);
    return;
  }

  try {
    await Linking.openURL(targetUrl);
  } catch {
    try {
      await WebBrowser.openBrowserAsync(targetUrl);
    } catch {
      Alert.alert(
        'Não foi possível abrir o link',
        `Verifique o endereço informado: ${value}`
      );
    }
  }
}
