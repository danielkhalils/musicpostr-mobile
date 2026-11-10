import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

interface StreamingIconProps {
  name: string;
  size?: number;
}

export function StreamingIcon({ name, size = 26 }: StreamingIconProps) {
  const norm = name.toLowerCase().trim();

  switch (norm) {
    case 'spotify':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect width="24" height="24" rx="12" fill="#1DB954" />
          <Path
            d="M17.433 16.745a.75.75 0 0 1-1.033.248c-2.827-1.728-6.386-2.119-10.578-1.162a.75.75 0 1 1-.334-1.462c4.593-1.05 8.528-.604 11.697 1.343.344.21.455.66.248 1.033zm1.39-3.084a.938.938 0 0 1-1.29.31c-3.235-1.99-8.167-2.565-11.994-1.403a.938.938 0 1 1-.548-1.792c4.372-1.328 9.805-.684 13.522 1.596a.938.938 0 0 1 .31 1.289zm.12-3.22c-3.878-2.303-10.28-2.516-13.99-1.39a1.125 1.125 0 0 1-.655-2.152c4.258-1.293 11.31-1.043 15.78 1.611a1.125 1.125 0 1 1-1.135 1.932z"
            fill="#ffffff"
          />
        </Svg>
      );

    case 'apple music':
    case 'apple':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect width="24" height="24" rx="12" fill="#FA2D48" />
          <Path
            d="M16.5 6.45c0-.1-.08-.18-.18-.18h-6.64c-.1 0-.18.08-.18.18v8.66a2.63 2.63 0 1 1-1.5-2.38V5.37c0-.15.12-.27.27-.27h7.96c.15 0 .27.12.27.27v7.54a2.63 2.63 0 1 1-1.5-2.38V6.45z"
            fill="#ffffff"
          />
        </Svg>
      );

    case 'youtube music':
    case 'youtube':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect width="24" height="24" rx="12" fill="#FF0000" />
          <Path
            d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm-1.8 11.4V8.6L15.4 12l-5.2 3.4z"
            fill="#ffffff"
          />
        </Svg>
      );

    case 'tidal':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect width="24" height="24" rx="12" fill="#000000" />
          <Path
            d="M8.2 9.1L6 6.9 3.8 9.1 6 11.3 8.2 9.1zm4.4 4.4l-2.2-2.2-2.2 2.2 2.2 2.2 2.2-2.2zm0-8.8L10.4 2.5 8.2 4.7l2.2 2.2 2.2-2.2zm4.4 4.4L14.8 6.9 12.6 9.1l2.2 2.2 2.2-2.2zm4.4 0l-2.2-2.2-2.2 2.2 2.2 2.2 2.2-2.2z"
            fill="#00FFFF"
          />
        </Svg>
      );

    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect width="24" height="24" rx="12" fill="#7C3AED" />
          <Path
            d="M12 6v12M6 12h12"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </Svg>
      );
  }
}
