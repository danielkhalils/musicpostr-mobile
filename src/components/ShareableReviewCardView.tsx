import React, { ComponentRef, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { CoverImage } from './CoverImage';
import { formatRating } from '../utils/rating';

interface ShareableReviewCardProps {
  albumTitle: string;
  artistName: string;
  albumCover?: string;
  rating: number;
  comment?: string;
  username: string;
}

export function ShareableReviewCard({
  albumTitle,
  artistName,
  albumCover,
  rating,
  comment,
  username,
}: ShareableReviewCardProps) {
  const cardRef = useRef<ComponentRef<typeof View>>(null);
  const [isExporting, setIsExporting] = useState(false);

  const formattedRating = formatRating(rating);

  const handleShareImage = async () => {
    if (!cardRef.current || isExporting) return;
    setIsExporting(true);

    try {
      const uri = await captureRef(cardRef as any, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      const canShareFile = await Sharing.isAvailableAsync();
      if (canShareFile) {
        // Abre o menu nativo do sistema (Instagram, WhatsApp, X/Twitter, etc.) com a imagem gerada
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Compartilhar card do Musicpostr',
        });
      } else {
        await Share.share({
          message: `Avaliei "${albumTitle}" (${artistName}) com nota ${formattedRating}/10 no Musicpostr!`,
        });
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <View style={{ gap: 12 }}>
      {/* Card que será transformado em imagem */}
      <View ref={cardRef} collapsable={false} style={styles.card}>
        <CoverImage uri={albumCover} style={styles.cover} fallbackType="album" />
        <Text style={styles.brand}>MUSICPOSTR</Text>
        <Text style={styles.title} numberOfLines={2}>
          {albumTitle}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {artistName}
        </Text>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreText}>{formattedRating} / 10</Text>
        </View>
        {comment ? (
          <Text style={styles.comment} numberOfLines={3}>
            &ldquo;{comment}&rdquo;
          </Text>
        ) : null}
        <Text style={styles.author}>@{username}</Text>
      </View>

      <TouchableOpacity
        onPress={handleShareImage}
        disabled={isExporting}
        style={[styles.shareBtn, { opacity: isExporting ? 0.7 : 1 }]}
        activeOpacity={0.85}
      >
        {isExporting && <ActivityIndicator size="small" color="#ffffff" />}
        <Text style={styles.shareBtnText}>
          {isExporting ? 'Gerando card...' : 'Compartilhar Card'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 300,
    alignSelf: 'center',
    borderRadius: 24,
    padding: 18,
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: '#27272a',
    gap: 6,
  },
  cover: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    marginBottom: 6,
  },
  brand: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#a855f7',
  },
  title: {
    fontSize: 19,
    fontWeight: '900',
    color: '#ffffff',
  },
  artist: {
    fontSize: 13,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  scoreBox: {
    alignSelf: 'flex-start',
    backgroundColor: '#27272a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 4,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#facc15',
  },
  comment: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#e4e4e7',
    marginTop: 4,
  },
  author: {
    fontSize: 11,
    fontWeight: '700',
    color: '#a1a1aa',
    marginTop: 4,
  },
  shareBtn: {
    alignSelf: 'center',
    backgroundColor: '#7c3aed',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shareBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
});
