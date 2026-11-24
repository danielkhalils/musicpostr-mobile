import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface KeyboardAwareSheetModalProps {
  visible: boolean;
  onClose: () => void;
  backgroundColor: string;
  borderColor: string;
  children: (state: { isKeyboardVisible: boolean; maxSheetHeight: number }) => React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  /**
   * Fração máxima da altura disponível ocupada pelo sheet (padrão 0.9).
   */
  maxHeightRatio?: number;
}

/**
 * Bottom Sheet Modal compatível com teclado em iOS, Android (incluindo edge-to-edge) e Web.
 * Garante que inputs e botões no rodapé fiquem sempre visíveis logo acima do teclado,
 * no padrão de comentários e compositores de redes sociais.
 */
export function KeyboardAwareSheetModal({
  visible,
  onClose,
  backgroundColor,
  borderColor,
  children,
  contentStyle,
  maxHeightRatio = 0.9,
}: KeyboardAwareSheetModalProps) {
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [overlayHeight, setOverlayHeight] = useState(() => Dimensions.get('window').height);
  const [fullOverlayHeight, setFullOverlayHeight] = useState(() => Dimensions.get('window').height);

  useEffect(() => {
    if (!visible) {
      setKeyboardHeight(0);
      return;
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates?.height || 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible]);

  const isKeyboardVisible = keyboardHeight > 0;

  const handleOverlayLayout = (event: LayoutChangeEvent) => {
    const h = event.nativeEvent.layout.height;
    if (h <= 0) return;
    setOverlayHeight(h);
    if (!isKeyboardVisible) {
      setFullOverlayHeight(h);
    }
  };

  // No Android, dentro de Modal transparent + statusBarTranslucent, o sistema
  // normalmente não redimensiona a janela (adjustPan). Calculamos o quanto a janela
  // já encolheu (se encolheu) para evitar double-padding caso adjustResize esteja ativo.
  const androidAlreadyShrunk =
    Platform.OS === 'android'
      ? Math.max(0, fullOverlayHeight - overlayHeight)
      : 0;
  const androidKeyboardPadding =
    Platform.OS === 'android'
      ? Math.max(0, keyboardHeight - androidAlreadyShrunk)
      : 0;

  const availableHeight = Math.max(
    260,
    fullOverlayHeight - keyboardHeight - Math.max(insets.top, 20)
  );
  const maxSheetHeight = Math.round(availableHeight * maxHeightRatio);

  const handleDismiss = () => {
    Keyboard.dismiss();
    onClose();
  };

  const sheetBody = (
    <View
      style={[
        styles.overlay,
        Platform.OS === 'android' && androidKeyboardPadding > 0
          ? { paddingBottom: androidKeyboardPadding }
          : null,
      ]}
      onLayout={handleOverlayLayout}
    >
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={handleDismiss}
      />
      <View
        style={[
          styles.sheetContent,
          {
            backgroundColor,
            borderColor,
            maxHeight: maxSheetHeight,
            paddingBottom: isKeyboardVisible
              ? 10
              : insets.bottom > 0
                ? insets.bottom + 12
                : 18,
          },
          contentStyle,
        ]}
      >
        <View style={styles.dragIndicator} />
        {children({ isKeyboardVisible, maxSheetHeight })}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      {Platform.OS === 'ios' ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          {sheetBody}
        </KeyboardAvoidingView>
      ) : (
        sheetBody
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingHorizontal: 18,
    paddingTop: 10,
    overflow: 'hidden',
  },
  dragIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'center',
    marginBottom: 10,
  },
});
