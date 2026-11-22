import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { supabase } from './supabase';

export type ProfileMediaKind = 'avatar' | 'banner';
export type ImageSourceMode = 'library' | 'camera';

const BUCKET_NAME = 'profile-media';

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64ToUint8Array(base64: string): Uint8Array {
  const clean = base64.replace(/[^A-Za-z0-9+/=]/g, '');
  const len = clean.length;
  let padding = 0;
  if (clean.endsWith('==')) padding = 2;
  else if (clean.endsWith('=')) padding = 1;

  const bytesLen = Math.floor((len * 3) / 4) - padding;
  const bytes = new Uint8Array(bytesLen);

  let byteIndex = 0;
  for (let i = 0; i < len; i += 4) {
    const enc1 = BASE64_CHARS.indexOf(clean[i]);
    const enc2 = BASE64_CHARS.indexOf(clean[i + 1]);
    const enc3 = BASE64_CHARS.indexOf(clean[i + 2]);
    const enc4 = BASE64_CHARS.indexOf(clean[i + 3]);

    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;

    if (byteIndex < bytesLen) bytes[byteIndex++] = chr1;
    if (enc3 !== -1 && byteIndex < bytesLen) bytes[byteIndex++] = chr2;
    if (enc4 !== -1 && byteIndex < bytesLen) bytes[byteIndex++] = chr3;
  }

  return bytes;
}

function getFileExtension(mimeType?: string | null, uri?: string): string {
  if (mimeType) {
    if (mimeType.includes('png')) return 'png';
    if (mimeType.includes('webp')) return 'webp';
    if (mimeType.includes('gif')) return 'gif';
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
  }
  const uriMatch = uri?.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  if (uriMatch?.[1]) {
    const ext = uriMatch[1].toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
      return ext === 'jpeg' ? 'jpg' : ext;
    }
  }
  return 'jpg';
}

export interface PickAndUploadResult {
  canceled?: boolean;
  url?: string;
  error?: string;
}

/**
 * Abre a galeria ou a câmera do dispositivo, permite recorte adequado
 * (1:1 para avatar, 16:9 para capa) e faz upload para o Supabase Storage.
 * Caso o bucket `profile-media` ainda não exista no Supabase, usa fallback
 * seguro em data URI comprimido para não bloquear o usuário.
 */
export async function pickAndUploadProfileMedia(
  userId: string,
  kind: ProfileMediaKind,
  source: ImageSourceMode = 'library'
): Promise<PickAndUploadResult> {
  try {
    if (source === 'camera') {
      if (Platform.OS === 'web') {
        return { error: 'A câmera direta não está disponível no navegador. Use a galeria.' };
      }
      const camPerm = await ImagePicker.requestCameraPermissionsAsync();
      if (!camPerm.granted) {
        return { error: 'Permissão de câmera negada. Habilite nas configurações do dispositivo.' };
      }
    } else if (Platform.OS !== 'web') {
      const libPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!libPerm.granted) {
        return { error: 'Permissão para acessar a galeria negada. Habilite nas configurações do dispositivo.' };
      }
    }

    const pickerOptions: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: kind === 'avatar' ? [1, 1] : [16, 9],
      quality: 0.72,
      base64: true,
    };

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(pickerOptions)
        : await ImagePicker.launchImageLibraryAsync(pickerOptions);

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { canceled: true };
    }

    const asset = result.assets[0];
    const mimeType = asset.mimeType || 'image/jpeg';
    const ext = getFileExtension(mimeType, asset.uri);
    const filePath = `${userId}/${kind}-${Date.now()}.${ext}`;

    // Prepara os bytes para upload no Supabase Storage
    let bytes: Uint8Array | null = null;
    if (asset.base64) {
      bytes = base64ToUint8Array(asset.base64);
    } else if (asset.uri) {
      const res = await fetch(asset.uri);
      const arrBuf = await res.arrayBuffer();
      bytes = new Uint8Array(arrBuf);
    }

    if (!bytes || bytes.length === 0) {
      return { error: 'Não foi possível ler o arquivo de imagem selecionado.' };
    }

    // 1. Tenta enviar para o Supabase Storage (bucket `profile-media`)
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, bytes, {
        contentType: mimeType,
        upsert: true,
      });

    if (!uploadError) {
      const { data: publicData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
      if (publicData?.publicUrl) {
        return { url: publicData.publicUrl };
      }
    } else {
      console.warn('[ProfileMedia] Upload no Supabase Storage falhou, tentando fallback:', uploadError.message);
    }

    // 2. Fallback: salva como Data URI caso o bucket `profile-media` ainda não tenha sido criado no Supabase
    if (asset.base64) {
      const dataUri = `data:${mimeType};base64,${asset.base64}`;
      if (dataUri.length <= 1_500_000) {
        return { url: dataUri };
      }
      return {
        error:
          'Imagem muito grande para fallback sem Storage. Crie o bucket "profile-media" executando supabase/04_profile_media_storage.sql no Supabase.',
      };
    }

    return {
      error: uploadError?.message || 'Não foi possível enviar a imagem para o servidor.',
    };
  } catch (err: any) {
    console.warn('[ProfileMedia] Erro inesperado ao selecionar/enviar imagem:', err);
    return { error: err?.message || 'Erro ao processar a imagem.' };
  }
}
