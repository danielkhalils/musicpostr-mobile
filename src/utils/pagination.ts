import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

export const INFINITE_PAGE_SIZE = 10;

export function isNearScrollBottom(
  event: NativeSyntheticEvent<NativeScrollEvent>,
  threshold = 120
): boolean {
  const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
  return layoutMeasurement.height + contentOffset.y >= contentSize.height - threshold;
}
