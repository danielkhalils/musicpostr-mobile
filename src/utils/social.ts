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
function isSafeHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function resolveSocialUrl(platform: string, rawValue: string): string | null {
  const value = rawValue.trim();
  if (!value) return null;

  // Bloqueia esquemas não-HTTP (ex.: javascript:, data:, file:, tel:)
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) {
    return isSafeHttpUrl(value) ? value : null;
  }

  if (looksLikeDomain(value)) {
    const candidate = `https://${value}`;
    return isSafeHttpUrl(candidate) ? candidate : null;
  }

  const key = platform.toLowerCase().trim().replace(/[\s.-]+/g, '_');
  const rawHandle = value.replace(/^@+/, '');
  const handle = encodeURIComponent(rawHandle);

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
    case 'bandcamp': {
      const safeSubdomain = rawHandle.toLowerCase().replace(/[^a-z0-9-]/g, '');
      return safeSubdomain ? `https://${safeSubdomain}.bandcamp.com` : null;
    }
    case 'discord':
      return null;
    default: {
      const candidate = `https://${value}`;
      return isSafeHttpUrl(candidate) ? candidate : null;
    }
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
