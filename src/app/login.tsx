import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
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
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import {
  saveUserProfile,
  triggerTimelineIntroOnSignup,
} from '@/services/musicBrainz.service';

export default function AuthScreen() {
  const { colors } = useAppTheme();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSubmit = () => {
    if (!isLogin) {
      if (name.trim() || username.trim()) {
        saveUserProfile({
          name: name.trim() || 'Ana Beatriz',
          username: username.trim().replace(/^@/, '') || 'anabeat',
          email: email.trim() || 'anabeat@musicpostr.com',
        });
      }
      triggerTimelineIntroOnSignup();
    }
    setSuccessMsg(true);
    setTimeout(() => {
      router.replace(!isLogin ? ('/(tabs)/index' as any) : '/(tabs)/profile');
    }, 900);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View
        style={[
          styles.authCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => router.back()}
        >
          <X size={20} color={colors.mutedForeground} />
        </TouchableOpacity>

        {/* Cabeçalho */}
        <View style={styles.headerCenter}>
          <Image
            source={require('@/assets/icon_transparent_128x128.png')}
            style={styles.logoImg}
            contentFit="contain"
          />
          <Text style={[styles.brandTitle, { color: colors.foreground }]}>
            Musicpostr
          </Text>
          <Text
            style={[styles.brandSubtitle, { color: colors.mutedForeground }]}
          >
            {isLogin
              ? 'Entre na sua conta para avaliar e compartilhar discos.'
              : 'Crie sua conta e comece a sua jornada de críticas musicais.'}
          </Text>
        </View>

        {successMsg && (
          <View
            style={[
              styles.successBox,
              {
                backgroundColor: `${colors.emerald}20`,
                borderColor: `${colors.emerald}45`,
              },
            ]}
          >
            <Check size={15} color={colors.emerald} />
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: colors.emerald,
              }}
            >
              {isLogin
                ? 'Login realizado com sucesso!'
                : 'Conta criada com sucesso!'}
            </Text>
          </View>
        )}

        {/* Abas Entrar / Cadastrar */}
        <View
          style={[
            styles.tabsContainer,
            { backgroundColor: colors.secondary },
          ]}
        >
          <TouchableOpacity
            onPress={() => setIsLogin(true)}
            style={[
              styles.tabBtn,
              isLogin && { backgroundColor: colors.primary },
            ]}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '800',
                color: isLogin ? '#fff' : colors.mutedForeground,
              }}
            >
              Entrar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsLogin(false)}
            style={[
              styles.tabBtn,
              !isLogin && { backgroundColor: colors.primary },
            ]}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '800',
                color: !isLogin ? '#fff' : colors.mutedForeground,
              }}
            >
              Cadastrar
            </Text>
          </TouchableOpacity>
        </View>

        {/* Campos */}
        <View style={{ gap: 12 }}>
          {!isLogin && (
            <>
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
                  <User size={16} color={colors.mutedForeground} />
                  <TextInput
                    placeholder="Ana Beatriz"
                    placeholderTextColor={colors.mutedForeground}
                    value={name}
                    onChangeText={setName}
                    style={[styles.input, { color: colors.foreground }]}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>
                  Username (@)
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
                    style={{
                      fontSize: 14,
                      fontWeight: '800',
                      color: colors.mutedForeground,
                    }}
                  >
                    @
                  </Text>
                  <TextInput
                    placeholder="anabeat"
                    placeholderTextColor={colors.mutedForeground}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    style={[styles.input, { color: colors.foreground }]}
                  />
                </View>
              </View>
            </>
          )}

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              E-mail
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
              <Mail size={16} color={colors.mutedForeground} />
              <TextInput
                placeholder="seu@email.com"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.input, { color: colors.foreground }]}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Senha
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
              <Lock size={16} color={colors.mutedForeground} />
              <TextInput
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                style={[styles.input, { color: colors.foreground }]}
              />
            </View>
          </View>

          {isLogin && (
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  'Recuperação de Senha',
                  'Instruções enviadas para o seu e-mail.'
                )
              }
              style={{ alignSelf: 'flex-end' }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: colors.primary,
                }}
              >
                Esqueceu a senha?
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleSubmit}
            style={[
              styles.submitBtn,
              { backgroundColor: colors.primary },
            ]}
            activeOpacity={0.85}
          >
            <Text style={styles.submitBtnText}>
              {isLogin ? 'Entrar no Musicpostr' : 'Criar Conta Gratuita'}
            </Text>
            <ArrowRight size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.dividerRow}>
          <View
            style={[styles.dividerLine, { backgroundColor: colors.border }]}
          />
          <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
            ou continue com
          </Text>
          <View
            style={[styles.dividerLine, { backgroundColor: colors.border }]}
          />
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          style={[
            styles.googleBtn,
            {
              backgroundColor: colors.secondary,
              borderColor: colors.border,
            },
          ]}
          activeOpacity={0.85}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: '800',
              color: colors.foreground,
            }}
          >
            G • Continuar com Google
          </Text>
        </TouchableOpacity>

        <View
          style={[
            styles.footerRow,
            { borderTopColor: colors.border },
          ]}
        >
          <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
            {isLogin ? 'Ainda não tem uma conta? ' : 'Já possui uma conta? '}
          </Text>
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '800',
                color: colors.primary,
              }}
            >
              {isLogin ? 'Cadastre-se' : 'Faça login'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  authCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 16,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  headerCenter: {
    alignItems: 'center',
    gap: 6,
  },
  logoImg: {
    width: 56,
    height: 56,
    marginBottom: 4,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
  },
  brandSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldGroup: {
    gap: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  submitBtn: {
    height: 44,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  googleBtn: {
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    paddingTop: 14,
  },
});
