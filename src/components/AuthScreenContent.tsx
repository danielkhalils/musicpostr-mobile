import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Check,
  X,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { SocialIcon } from '@/components/SocialIcon';
import { safeGoBack } from '@/utils/navigation';
import { signIn, signUp } from '@/services/auth.service';
import { supabase } from '@/services/supabase';
import { triggerTimelineIntroOnSignup } from '@/services/musicBrainz.service';
import * as WebBrowser from 'expo-web-browser';

interface AuthScreenContentProps {
  initialMode?: 'login' | 'register';
  onSuccessRedirect?: string;
}

export function AuthScreenContent({
  initialMode = 'login',
  onSuccessRedirect,
}: AuthScreenContentProps) {
  const { colors, isDark } = useAppTheme();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const isLogin = mode === 'login';

  // Form Fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Field validation
  const validateForm = (): boolean => {
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail) {
      setErrorMessage('Por favor, informe seu endereço de e-mail.');
      return false;
    }

    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Por favor, insira um endereço de e-mail válido.');
      return false;
    }

    if (!password) {
      setErrorMessage('Por favor, insira sua senha.');
      return false;
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve conter no mínimo 6 caracteres.');
      return false;
    }

    if (!isLogin) {
      if (!name.trim()) {
        setErrorMessage('Por favor, informe seu nome completo.');
        return false;
      }

      const cleanUsername = username.trim().replace(/^@/, '');
      if (!cleanUsername || cleanUsername.length < 3) {
        setErrorMessage('O username deve ter no mínimo 3 caracteres alfanuméricos.');
        return false;
      }

      if (password !== confirmPassword) {
        setErrorMessage('As senhas digitadas não coincidem. Verifique e tente novamente.');
        return false;
      }

      if (!agreeTerms) {
        setErrorMessage('Você precisa aceitar os Termos de Uso e a Política de Privacidade.');
        return false;
      }
    }

    return true;
  };

  const handleLoginSubmit = async (loginEmail: string, loginPassword: string) => {
    try {
      await signIn({
        email: loginEmail,
        password: loginPassword,
      });

      setSuccessBanner('Login realizado com sucesso! Bem-vindo(a) de volta.');

      // Se o login der certo, redireciona para a home das abas
      const target = onSuccessRedirect || '/(tabs)';
      router.replace(target as any);
    } catch (error: any) {
      const msg = error?.message || 'Não foi possível realizar o login.';
      setErrorMessage('Erro ao entrar: ' + msg);
      if (typeof alert === 'function') {
        alert('Erro ao entrar: ' + msg);
      } else {
        Alert.alert('Erro ao entrar', msg);
      }
    }
  };

  const handleSignUpSubmit = async (
    registerEmail: string,
    registerPassword: string,
    registerUsername: string,
    registerFullName: string
  ) => {
    try {
      await signUp({
        email: registerEmail,
        password: registerPassword,
        username: registerUsername,
        fullName: registerFullName,
      });

      triggerTimelineIntroOnSignup();

      setSuccessBanner('Conta criada com sucesso! Seja bem-vindo(a) ao Musicpostr.');

      const target = onSuccessRedirect || '/(tabs)';
      router.replace(target as any);
    } catch (error: any) {
      const msg = error?.message || 'Não foi possível criar a sua conta.';
      setErrorMessage('Erro ao cadastrar: ' + msg);
      if (typeof alert === 'function') {
        alert('Erro ao cadastrar: ' + msg);
      } else {
        Alert.alert('Erro ao cadastrar', msg);
      }
    }
  };

  const handleEmailAuth = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrorMessage(null);

    const trimmedEmail = email.trim().toLowerCase();

    try {
      if (isLogin) {
        await handleLoginSubmit(trimmedEmail, password);
      } else {
        const cleanUsername =
          username.trim().replace(/^@/, '') || trimmedEmail.split('@')[0];
        const cleanName = name.trim();
        await handleSignUpSubmit(trimmedEmail, password, cleanUsername, cleanName);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'apple') => {
    setErrorMessage(null);
    setSocialLoading(provider);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: 'musicpostr://auth/callback',
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        setErrorMessage(`Não foi possível autenticar com ${provider}: ${error.message}`);
      } else if (data?.url) {
        await WebBrowser.openAuthSessionAsync(data.url, 'musicpostr://auth/callback');
      } else {
        setErrorMessage(`Provedor ${provider} não configurado no Supabase.`);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || `Erro ao autenticar com ${provider}.`);
    } finally {
      setSocialLoading(null);
    }
  };

  const handleForgotPassword = () => {
    if (Alert.prompt) {
      Alert.prompt(
        'Recuperação de Senha',
        'Digite seu e-mail cadastrado para receber o link de redefinição:',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Enviar',
            onPress: (val) => {
              Alert.alert(
                'Instruções Enviadas',
                `Enviamos um link de recuperação para ${val || 'o seu e-mail'}. Verifique sua caixa de entrada.`
              );
            },
          },
        ],
        'plain-text',
        email
      );
    } else {
      Alert.alert(
        'Recuperação de Senha',
        `Enviamos as instruções de redefinição para o e-mail ${email || 'cadastrado'}. Verifique também sua caixa de spam.`
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.authCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Botão Fechar Modal */}
          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: colors.secondary }]}
            onPress={() => safeGoBack('/(tabs)/index')}
            activeOpacity={0.8}
            accessibilityLabel="Fechar tela de autenticação"
          >
            <X size={18} color={colors.foreground} />
          </TouchableOpacity>

          {/* Cabeçalho da Marca */}
          <View style={styles.headerCenter}>
            <View
              style={[
                styles.logoWrap,
                { backgroundColor: `${colors.primary}18` },
              ]}
            >
              <Image
                source={require('@/assets/icon_transparent_128x128.png')}
                style={styles.logoImg}
                contentFit="contain"
              />
            </View>

            <Text style={[styles.brandTitle, { color: colors.foreground }]}>
              MUSICPOSTR
            </Text>

            <Text
              style={[styles.brandSubtitle, { color: colors.mutedForeground }]}
            >
              {isLogin
                ? 'Conecte-se para avaliar álbuns, seguir seus ídolos e interagir com a comunidade.'
                : 'Crie sua conta gratuita e comece sua jornada de descobertas e resenhas musicais.'}
            </Text>
          </View>

          {/* Abas Alternadoras Entrar / Cadastrar */}
          <View
            style={[
              styles.tabsContainer,
              { backgroundColor: colors.secondary, borderColor: colors.border },
            ]}
          >
            <TouchableOpacity
              onPress={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              style={[
                styles.tabBtn,
                isLogin && {
                  backgroundColor: colors.primary,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.35,
                  shadowRadius: 6,
                  elevation: 3,
                },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: isLogin ? '#ffffff' : colors.mutedForeground },
                ]}
              >
                Entrar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setMode('register');
                setErrorMessage(null);
              }}
              style={[
                styles.tabBtn,
                !isLogin && {
                  backgroundColor: colors.primary,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.35,
                  shadowRadius: 6,
                  elevation: 3,
                },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: !isLogin ? '#ffffff' : colors.mutedForeground },
                ]}
              >
                Cadastrar
              </Text>
            </TouchableOpacity>
          </View>

          {/* Banner de Sucesso */}
          {successBanner && (
            <View
              style={[
                styles.alertBox,
                {
                  backgroundColor: `${colors.emerald}18`,
                  borderColor: `${colors.emerald}50`,
                },
              ]}
            >
              <Check size={18} color={colors.emerald} />
              <Text
                style={[
                  styles.alertText,
                  { color: colors.emerald, flex: 1 },
                ]}
              >
                {successBanner}
              </Text>
            </View>
          )}

          {/* Banner de Erro */}
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
              <AlertCircle size={18} color={colors.destructive} />
              <Text
                style={[
                  styles.alertText,
                  { color: colors.destructive, flex: 1 },
                ]}
              >
                {errorMessage}
              </Text>
            </View>
          )}

          {/* Seção de Cadastro / Login Social (Google e Apple) */}
          <View style={styles.socialSection}>
            {/* Botão Google */}
            <TouchableOpacity
              onPress={() => handleSocialAuth('google')}
              disabled={isLoading || socialLoading !== null}
              style={[
                styles.socialBtn,
                {
                  backgroundColor: isDark ? '#18181b' : '#ffffff',
                  borderColor: colors.border,
                },
              ]}
              activeOpacity={0.85}
            >
              {socialLoading === 'google' ? (
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
                    {isLogin
                      ? 'Continuar com o Google'
                      : 'Cadastrar com o Google'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Botão Apple */}
            <TouchableOpacity
              onPress={() => handleSocialAuth('apple')}
              disabled={isLoading || socialLoading !== null}
              style={[
                styles.socialBtn,
                styles.appleBtn,
                {
                  backgroundColor: isDark ? '#ffffff' : '#000000',
                  borderColor: isDark ? '#ffffff' : '#000000',
                },
              ]}
              activeOpacity={0.85}
            >
              {socialLoading === 'apple' ? (
                <ActivityIndicator
                  size="small"
                  color={isDark ? '#000000' : '#ffffff'}
                />
              ) : (
                <>
                  <SocialIcon
                    name="apple"
                    size={20}
                    color={isDark ? '#000000' : '#ffffff'}
                  />
                  <Text
                    style={[
                      styles.socialBtnText,
                      { color: isDark ? '#000000' : '#ffffff' },
                    ]}
                  >
                    {isLogin
                      ? 'Continuar com a Apple'
                      : 'Cadastrar com a Apple'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Divisor Visual */}
          <View style={styles.dividerRow}>
            <View
              style={[styles.dividerLine, { backgroundColor: colors.border }]}
            />
            <Text
              style={[
                styles.dividerText,
                { color: colors.mutedForeground },
              ]}
            >
              ou com seu e-mail
            </Text>
            <View
              style={[styles.dividerLine, { backgroundColor: colors.border }]}
            />
          </View>

          {/* Formulário de E-mail e Senha */}
          <View style={styles.formContainer}>
            {/* Campos exclusivos de Cadastro */}
            {!isLogin && (
              <>
                {/* Nome Completo */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: colors.foreground }]}>
                    Nome Completo
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
                    <User size={18} color={colors.mutedForeground} />
                    <TextInput
                      placeholder="Ex: Ana Beatriz"
                      placeholderTextColor={colors.mutedForeground}
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                      style={[styles.input, { color: colors.foreground }]}
                    />
                  </View>
                </View>

                {/* Nome de Usuário (@) */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: colors.foreground }]}>
                    Nome de Usuário (@)
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
                    <Text
                      style={[
                        styles.atSignPrefix,
                        { color: colors.primary },
                      ]}
                    >
                      @
                    </Text>
                    <TextInput
                      placeholder="anabeat"
                      placeholderTextColor={colors.mutedForeground}
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={[styles.input, { color: colors.foreground }]}
                    />
                  </View>
                </View>
              </>
            )}

            {/* E-mail */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Endereço de E-mail
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
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[styles.input, { color: colors.foreground }]}
                />
              </View>
            </View>

            {/* Senha */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.foreground }]}>
                  Senha
                </Text>
                {isLogin && (
                  <TouchableOpacity
                    onPress={handleForgotPassword}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.forgotPasswordText,
                        { color: colors.primary },
                      ]}
                    >
                      Esqueceu a senha?
                    </Text>
                  </TouchableOpacity>
                )}
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
                <Lock size={18} color={colors.mutedForeground} />
                <TextInput
                  secureTextEntry={!showPassword}
                  placeholder={
                    isLogin ? '••••••••' : 'Mínimo de 6 caracteres'
                  }
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  style={[styles.input, { color: colors.foreground }]}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={colors.mutedForeground} />
                  ) : (
                    <Eye size={18} color={colors.mutedForeground} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirmar Senha (Apenas Cadastro) */}
            {!isLogin && (
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>
                  Confirmar Senha
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
                  <Lock size={18} color={colors.mutedForeground} />
                  <TextInput
                    secureTextEntry={!showConfirmPassword}
                    placeholder="Repita a mesma senha"
                    placeholderTextColor={colors.mutedForeground}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    autoCapitalize="none"
                    style={[styles.input, { color: colors.foreground }]}
                  />
                  <TouchableOpacity
                    onPress={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    style={styles.eyeBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} color={colors.mutedForeground} />
                    ) : (
                      <Eye size={18} color={colors.mutedForeground} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Checkbox Termos de Uso (Apenas Cadastro) */}
            {!isLogin && (
              <TouchableOpacity
                onPress={() => setAgreeTerms(!agreeTerms)}
                style={styles.termsRow}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: agreeTerms
                        ? colors.primary
                        : colors.mutedForeground,
                      backgroundColor: agreeTerms
                        ? colors.primary
                        : 'transparent',
                    },
                  ]}
                >
                  {agreeTerms && <Check size={13} color="#ffffff" />}
                </View>
                <Text
                  style={[
                    styles.termsText,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Concordo com os{' '}
                  <Text style={{ color: colors.primary, fontWeight: '700' }}>
                    Termos de Serviço
                  </Text>{' '}
                  e a{' '}
                  <Text style={{ color: colors.primary, fontWeight: '700' }}>
                    Política de Privacidade
                  </Text>
                  .
                </Text>
              </TouchableOpacity>
            )}

            {/* Botão Principal de Submissão */}
            <TouchableOpacity
              onPress={handleEmailAuth}
              disabled={isLoading || socialLoading !== null}
              style={[
                styles.submitBtn,
                { backgroundColor: colors.primary },
              ]}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>
                    {isLogin
                      ? 'Entrar no Musicpostr'
                      : 'Criar Minha Conta Gratuita'}
                  </Text>
                  <ArrowRight size={17} color="#ffffff" />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Rodapé Alternador entre Login e Cadastro */}
          <View
            style={[
              styles.footerRow,
              { borderTopColor: colors.border },
            ]}
          >
            <Text
              style={[
                styles.footerText,
                { color: colors.mutedForeground },
              ]}
            >
              {isLogin
                ? 'Ainda não tem uma conta no Musicpostr? '
                : 'Já possui uma conta registrada? '}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setMode(isLogin ? 'register' : 'login');
                setErrorMessage(null);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.footerLinkText,
                  { color: colors.primary },
                ]}
              >
                {isLogin ? 'Cadastre-se' : 'Faça login'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
    paddingVertical: 32,
  },
  authCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 22,
    gap: 18,
    position: 'relative',
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  headerCenter: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
  },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  logoImg: {
    width: 48,
    height: 48,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  brandSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  alertText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  socialSection: {
    gap: 10,
  },
  socialBtn: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  appleBtn: {
    borderWidth: 0,
  },
  socialBtnText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formContainer: {
    gap: 14,
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
    fontSize: 12,
    fontWeight: '700',
  },
  forgotPasswordText: {
    fontSize: 12,
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 10,
  },
  atSignPrefix: {
    fontSize: 15,
    fontWeight: '800',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 13,
    fontWeight: '500',
  },
  eyeBtn: {
    padding: 4,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsText: {
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  submitBtn: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    paddingTop: 14,
    gap: 4,
  },
  footerText: {
    fontSize: 12,
  },
  footerLinkText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
