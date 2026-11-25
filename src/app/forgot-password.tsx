import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { useKeyboardHeight } from '@/hooks/use-keyboard-height';
import { SocialIcon } from '@/components/SocialIcon';
import {
  sendMagicLinkRecovery,
  sendPasswordResetEmail,
  signInWithOAuthProvider,
  updateAccountPassword,
  verifyMagicLinkOtp,
  verifyPasswordRecoveryOtp,
} from '@/services/auth.service';

type RecoveryMethod = 'password_reset' | 'magic_link' | 'social';

export default function ForgotPasswordScreen() {
  const { email: initialEmail } = useLocalSearchParams<{ email?: string }>();
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 120);
  };

  const [method, setMethod] = useState<RecoveryMethod>('password_reset');
  const [email, setEmail] = useState(initialEmail || '');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [codeSent, setCodeSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [contentAnim] = useState(() => new Animated.Value(1));
  const [contentTranslateY] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const switchMethod = (next: RecoveryMethod) => {
    if (next === method) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    Animated.parallel([
      Animated.timing(contentAnim, {
        toValue: 0,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 8,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMethod(next);
      setCodeSent(false);
      setOtpCode('');
      contentTranslateY.setValue(-8);
      Animated.parallel([
        Animated.timing(contentAnim, {
          toValue: 1,
          duration: 210,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslateY, {
          toValue: 0,
          duration: 210,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const validateEmail = (): boolean => {
    const trimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmed) {
      setErrorMessage('Informe o e-mail cadastrado na sua conta.');
      return false;
    }
    if (!emailRegex.test(trimmed)) {
      setErrorMessage('Digite um endereço de e-mail válido.');
      return false;
    }
    return true;
  };

  const handleSendRecovery = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    if (!validateEmail()) return;

    setIsSubmitting(true);
    try {
      if (method === 'password_reset') {
        await sendPasswordResetEmail(email);
        setSuccessMessage(
          `Enviamos um link e código de redefinição para ${email.trim().toLowerCase()}. Verifique sua caixa de entrada e spam.`
        );
      } else {
        await sendMagicLinkRecovery(email);
        setSuccessMessage(
          `Enviamos um código de acesso único para ${email.trim().toLowerCase()}. Digite o código abaixo para entrar.`
        );
      }
      setCodeSent(true);
      setResendCooldown(45);
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Não foi possível enviar o e-mail de recuperação. Tente novamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPasswordReset = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!otpCode.trim() || otpCode.trim().length < 6) {
      setErrorMessage('Informe o código de 6 dígitos enviado para o seu e-mail.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('As senhas digitadas não coincidem.');
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyPasswordRecoveryOtp(email, otpCode);
      await updateAccountPassword(newPassword);
      setSuccessMessage('Senha redefinida com sucesso! Redirecionando...');
      router.replace('/(tabs)' as any);
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Código inválido ou expirado. Solicite um novo código.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmMagicLinkOtp = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!otpCode.trim() || otpCode.trim().length < 6) {
      setErrorMessage('Informe o código de 6 dígitos enviado para o seu e-mail.');
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyMagicLinkOtp(email, otpCode);
      setSuccessMessage('Acesso recuperado com sucesso! Redirecionando...');
      router.replace('/(tabs)' as any);
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Código inválido ou expirado. Solicite um novo código.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialRecovery = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setSocialLoading(true);

    try {
      const result = await signInWithOAuthProvider('google');
      if (result.canceled) return;
      if (!result.success) {
        setErrorMessage(
          result.error || 'Não foi possível recuperar acesso com o Google.'
        );
        return;
      }
      if (Platform.OS !== 'web') {
        router.replace('/(tabs)' as any);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao recuperar acesso com o Google.');
    } finally {
      setSocialLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={[
          styles.scrollContainer,
          {
            paddingTop: Math.max(insets.top + 12, 24),
            paddingBottom:
              keyboardHeight > 0 ? 20 : Math.max(insets.bottom + 20, 28),
            justifyContent: keyboardHeight > 0 ? 'flex-start' : 'center',
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {/* Botão Voltar */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backRow}
            activeOpacity={0.75}
          >
            <ArrowLeft size={16} color={colors.primary} />
            <Text style={[styles.backText, { color: colors.primary }]}>
              Voltar para o Login
            </Text>
          </TouchableOpacity>

          {/* Cabeçalho */}
          <View style={styles.headerCenter}>
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: `${colors.primary}18`,
                  borderColor: `${colors.primary}38`,
                },
              ]}
            >
              <ShieldCheck size={28} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Recuperar Conta
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Escolha um dos métodos disponíveis para redefinir sua senha ou recuperar o acesso à sua conta.
            </Text>
          </View>

          {/* Seletor de Métodos de Recuperação */}
          <View
            style={[
              styles.methodsBar,
              { backgroundColor: colors.secondary, borderColor: colors.border },
            ]}
          >
            {(
              [
                { key: 'password_reset', label: 'Redefinir Senha', icon: KeyRound },
                { key: 'magic_link', label: 'Código E-mail', icon: Sparkles },
                { key: 'social', label: 'Conta Google', icon: ShieldCheck },
              ] as const
            ).map((tab) => {
              const active = method === tab.key;
              const Icon = tab.icon;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => switchMethod(tab.key)}
                  activeOpacity={0.85}
                  style={[
                    styles.methodTab,
                    active && { backgroundColor: colors.primary },
                  ]}
                >
                  <Icon
                    size={13}
                    color={active ? '#ffffff' : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.methodTabText,
                      { color: active ? '#ffffff' : colors.mutedForeground },
                    ]}
                    numberOfLines={1}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Alertas */}
          {successMessage && (
            <View
              style={[
                styles.alertBox,
                {
                  backgroundColor: `${colors.emerald}18`,
                  borderColor: `${colors.emerald}50`,
                },
              ]}
            >
              <Check size={17} color={colors.emerald} />
              <Text style={[styles.alertText, { color: colors.emerald }]}>
                {successMessage}
              </Text>
            </View>
          )}

          {errorMessage && (
            <View
              style={[
                styles.alertBox,
                {
                  backgroundColor: `${colors.destructive}18`,
                  borderColor: `${colors.destructive}50`,
                },
              ]}
            >
              <AlertCircle size={17} color={colors.destructive} />
              <Text style={[styles.alertText, { color: colors.destructive }]}>
                {errorMessage}
              </Text>
            </View>
          )}

          {/* Conteúdo animado por método */}
          <Animated.View
            style={{
              gap: 14,
              opacity: contentAnim,
              transform: [{ translateY: contentTranslateY }],
            }}
          >
            {method === 'social' ? (
              <View style={{ gap: 12 }}>
                <Text
                  style={[styles.helperText, { color: colors.mutedForeground }]}
                >
                  Se você criou ou vinculou sua conta do Musicpostr com o Google, entre diretamente abaixo sem precisar de senha:
                </Text>

                <TouchableOpacity
                  onPress={handleSocialRecovery}
                  disabled={socialLoading}
                  style={[
                    styles.socialBtn,
                    {
                      backgroundColor: isDark ? '#18181b' : '#ffffff',
                      borderColor: colors.border,
                    },
                  ]}
                  activeOpacity={0.85}
                >
                  {socialLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <SocialIcon name="google" size={19} />
                      <Text
                        style={[
                          styles.socialBtnText,
                          { color: colors.foreground },
                        ]}
                      >
                        Recuperar acesso com Google
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 14 }}>
                <Text
                  style={[styles.helperText, { color: colors.mutedForeground }]}
                >
                  {method === 'password_reset'
                    ? 'Informe o e-mail da sua conta para receber um código de verificação e definir uma nova senha.'
                    : 'Informe seu e-mail cadastrado para receber um código temporário e acessar sua conta sem senha.'}
                </Text>

                {/* Campo E-mail */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: colors.foreground }]}>
                    E-mail cadastrado
                  </Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Mail size={18} color={colors.mutedForeground} />
                    <TextInput
                      placeholder="seu@email.com"
                      placeholderTextColor={colors.mutedForeground}
                      value={email}
                      onChangeText={setEmail}
                      onFocus={scrollToBottom}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isSubmitting}
                      style={[styles.input, { color: colors.foreground }]}
                    />
                  </View>
                </View>

                {!codeSent ? (
                  <TouchableOpacity
                    onPress={handleSendRecovery}
                    disabled={isSubmitting}
                    style={[
                      styles.submitBtn,
                      { backgroundColor: colors.primary },
                    ]}
                    activeOpacity={0.85}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Text style={styles.submitBtnText}>
                          {method === 'password_reset'
                            ? 'Enviar código de redefinição'
                            : 'Enviar código de acesso'}
                        </Text>
                        <ArrowRight size={17} color="#ffffff" />
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <>
                    {/* Código OTP */}
                    <View style={styles.fieldGroup}>
                      <View style={styles.labelRow}>
                        <Text style={[styles.label, { color: colors.foreground }]}>
                          Código de verificação (6 dígitos)
                        </Text>
                        <TouchableOpacity
                          onPress={handleSendRecovery}
                          disabled={resendCooldown > 0 || isSubmitting}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: '700',
                              color:
                                resendCooldown > 0
                                  ? colors.mutedForeground
                                  : colors.primary,
                            }}
                          >
                            {resendCooldown > 0
                              ? `Reenviar (${resendCooldown}s)`
                              : 'Reenviar código'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <KeyRound size={17} color={colors.mutedForeground} />
                        <TextInput
                          placeholder="000000"
                          placeholderTextColor={colors.mutedForeground}
                          value={otpCode}
                          onChangeText={setOtpCode}
                          onFocus={scrollToBottom}
                          keyboardType="number-pad"
                          maxLength={8}
                          style={[
                            styles.input,
                            {
                              color: colors.foreground,
                              letterSpacing: 3,
                              fontWeight: '800',
                            },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Campos de Nova Senha (somente no método password_reset) */}
                    {method === 'password_reset' && (
                      <>
                        <View style={styles.fieldGroup}>
                          <Text style={[styles.label, { color: colors.foreground }]}>
                            Nova Senha
                          </Text>
                          <View
                            style={[
                              styles.inputWrapper,
                              {
                                backgroundColor: colors.background,
                                borderColor: colors.border,
                              },
                            ]}
                          >
                            <Lock size={17} color={colors.mutedForeground} />
                            <TextInput
                              secureTextEntry={!showPassword}
                              placeholder="Mínimo de 6 caracteres"
                              placeholderTextColor={colors.mutedForeground}
                              value={newPassword}
                              onChangeText={setNewPassword}
                              onFocus={scrollToBottom}
                              autoCapitalize="none"
                              style={[styles.input, { color: colors.foreground }]}
                            />
                            <TouchableOpacity
                              onPress={() => setShowPassword((prev) => !prev)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              {showPassword ? (
                                <EyeOff size={17} color={colors.mutedForeground} />
                              ) : (
                                <Eye size={17} color={colors.mutedForeground} />
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View style={styles.fieldGroup}>
                          <Text style={[styles.label, { color: colors.foreground }]}>
                            Confirmar Nova Senha
                          </Text>
                          <View
                            style={[
                              styles.inputWrapper,
                              {
                                backgroundColor: colors.background,
                                borderColor: colors.border,
                              },
                            ]}
                          >
                            <Lock size={17} color={colors.mutedForeground} />
                            <TextInput
                              secureTextEntry={!showConfirmPassword}
                              placeholder="Repita a nova senha"
                              placeholderTextColor={colors.mutedForeground}
                              value={confirmPassword}
                              onChangeText={setConfirmPassword}
                              onFocus={scrollToBottom}
                              autoCapitalize="none"
                              style={[styles.input, { color: colors.foreground }]}
                            />
                            <TouchableOpacity
                              onPress={() =>
                                setShowConfirmPassword((prev) => !prev)
                              }
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              {showConfirmPassword ? (
                                <EyeOff size={17} color={colors.mutedForeground} />
                              ) : (
                                <Eye size={17} color={colors.mutedForeground} />
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>
                      </>
                    )}

                    <TouchableOpacity
                      onPress={
                        method === 'password_reset'
                          ? handleConfirmPasswordReset
                          : handleConfirmMagicLinkOtp
                      }
                      disabled={isSubmitting}
                      style={[
                        styles.submitBtn,
                        { backgroundColor: colors.primary },
                      ]}
                      activeOpacity={0.85}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <Text style={styles.submitBtnText}>
                            {method === 'password_reset'
                              ? 'Redefinir Senha e Entrar'
                              : 'Confirmar Código e Entrar'}
                          </Text>
                          <ArrowRight size={17} color="#ffffff" />
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 18,
    paddingBottom: 36,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 13,
    fontWeight: '700',
  },
  headerCenter: {
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
  },
  methodsBar: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  methodTabText: {
    fontSize: 11,
    fontWeight: '800',
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  alertText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 18,
  },
  helperText: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  fieldGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 13,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  submitBtn: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 2,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  socialBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  socialBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
