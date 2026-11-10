import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
} from 'react-native';
import { safeGoBack } from '@/utils/navigation';
import {
  Settings,
  User,
  Shield,
  Bell,
  Info,
  Globe,
  Save,
  ArrowLeft,
  Moon,
  Sun,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { MobileHeader } from '@/components/MobileHeader';
import { getUserProfile, saveUserProfile } from '@/services/musicBrainz.service';

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useAppTheme();
  const initial = getUserProfile();

  const [name, setName] = useState(initial.name);
  const [username, setUsername] = useState(initial.username);
  const [bio, setBio] = useState(initial.bio);
  const [bannerUrl, setBannerUrl] = useState(initial.bannerUrl);

  const [instagram, setInstagram] = useState(initial.socials.instagram || '');
  const [tiktok, setTiktok] = useState(initial.socials.tiktok || '');
  const [twitter, setTwitter] = useState(initial.socials.twitter || '');
  const [lastfm, setLastfm] = useState(initial.socials.lastfm || '');
  const [youtube, setYoutube] = useState(initial.socials.youtube || '');
  const [threads, setThreads] = useState(initial.socials.threads || '');
  const [website, setWebsite] = useState(initial.socials.website || '');

  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLinkedGoogle, setIsLinkedGoogle] = useState(initial.isLinkedGoogle);

  const [profileVisibility, setProfileVisibility] = useState<
    'public' | 'private'
  >(initial.profileVisibility);
  const [emailNotif, setEmailNotif] = useState(initial.emailNotif);
  const [communityNotif, setCommunityNotif] = useState(initial.communityNotif);
  const [releasesNotif, setReleasesNotif] = useState(initial.releasesNotif);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveAll = () => {
    saveUserProfile({
      name,
      username,
      bio,
      bannerUrl,
      email,
      phone,
      isLinkedGoogle,
      profileVisibility,
      emailNotif,
      communityNotif,
      releasesNotif,
      socials: {
        ...initial.socials,
        instagram,
        tiktok,
        twitter,
        lastfm,
        youtube,
        threads,
        website,
      },
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3200);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <MobileHeader />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => safeGoBack('/(tabs)/profile')}
        >
          <ArrowLeft size={15} color={colors.mutedForeground} />
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: colors.mutedForeground,
            }}
          >
            Voltar ao Perfil
          </Text>
        </TouchableOpacity>

        <View
          style={[
            styles.headerBox,
            { borderBottomColor: colors.border },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Settings size={24} color={colors.foreground} />
            <Text style={[styles.pageTitle, { color: colors.foreground }]}>
              Configurações
            </Text>
          </View>
          <Text
            style={[styles.pageSubtitle, { color: colors.mutedForeground }]}
          >
            Gerencie centralizadamente as informações do seu perfil, redes
            sociais, dados de acesso e privacidade.
          </Text>
        </View>

        {savedSuccess && (
          <View
            style={[
              styles.successBanner,
              {
                backgroundColor: `${colors.emerald}20`,
                borderColor: `${colors.emerald}45`,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: colors.emerald,
              }}
            >
              ✨ Todas as alterações e redes sociais foram salvas com sucesso!
            </Text>
          </View>
        )}

        {/* 1. Perfil & Redes Sociais */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.sectionTitleRow}>
            <User size={16} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Informações de Perfil & Redes Sociais
            </Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Nome de Exibição
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Username (@)
            </Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              URL do Banner de Fundo
            </Text>
            <TextInput
              value={bannerUrl}
              onChangeText={setBannerUrl}
              placeholder="https://exemplo.com/banner.jpg"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Biografia
            </Text>
            <TextInput
              multiline
              value={bio}
              onChangeText={setBio}
              style={[
                styles.textarea,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
            />
          </View>

          <View
            style={[
              styles.divider,
              { backgroundColor: colors.border },
            ]}
          />

          <Text
            style={{
              fontSize: 11,
              fontWeight: '800',
              color: colors.mutedForeground,
              textTransform: 'uppercase',
            }}
          >
            Links para Redes Sociais e Streaming
          </Text>

          {[
            { label: 'Instagram', val: instagram, set: setInstagram },
            { label: 'TikTok', val: tiktok, set: setTiktok },
            { label: 'Twitter (X)', val: twitter, set: setTwitter },
            { label: 'Last.fm', val: lastfm, set: setLastfm },
            { label: 'YouTube', val: youtube, set: setYoutube },
            { label: 'Threads', val: threads, set: setThreads },
            { label: 'Site Pessoal', val: website, set: setWebsite },
          ].map((item) => (
            <View key={item.label} style={styles.fieldGroup}>
              <Text
                style={[styles.sublabel, { color: colors.mutedForeground }]}
              >
                {item.label}
              </Text>
              <TextInput
                value={item.val}
                onChangeText={item.set}
                placeholder={`https://...`}
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
              />
            </View>
          ))}
        </View>

        {/* 2. Conta & Segurança */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.sectionTitleRow}>
            <Shield size={16} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Informações da Conta & Segurança
            </Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              E-mail
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Telefone
            </Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Senha Atual
            </Text>
            <TextInput
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={colors.mutedForeground}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Nova Senha
            </Text>
            <TextInput
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={colors.mutedForeground}
              value={newPassword}
              onChangeText={setNewPassword}
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
            />
          </View>

          <View
            style={[
              styles.googleRow,
              { borderTopColor: colors.border },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: colors.foreground,
                }}
              >
                Conta Google Vinculada
              </Text>
              <Text
                style={{ fontSize: 11, color: colors.mutedForeground }}
              >
                Sua conta está conectada para login rápido.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsLinkedGoogle(!isLinkedGoogle)}
              style={[
                styles.outlineBtn,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: colors.foreground,
                }}
              >
                {isLinkedGoogle ? 'Desvincular' : 'Vincular Google'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Privacidade */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.sectionTitleRow}>
            <Globe size={16} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Privacidade da Conta
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setProfileVisibility('public')}
            style={[
              styles.radioCard,
              {
                backgroundColor:
                  profileVisibility === 'public'
                    ? `${colors.primary}15`
                    : colors.secondary,
                borderColor:
                  profileVisibility === 'public'
                    ? colors.primary
                    : colors.border,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '800',
                color: colors.foreground,
              }}
            >
              Perfil Público {profileVisibility === 'public' ? '✓' : ''}
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: colors.mutedForeground,
                marginTop: 2,
              }}
            >
              Qualquer usuário pode ver suas avaliações, notas e redes sociais.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setProfileVisibility('private')}
            style={[
              styles.radioCard,
              {
                backgroundColor:
                  profileVisibility === 'private'
                    ? `${colors.primary}15`
                    : colors.secondary,
                borderColor:
                  profileVisibility === 'private'
                    ? colors.primary
                    : colors.border,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '800',
                color: colors.foreground,
              }}
            >
              Perfil Privado {profileVisibility === 'private' ? '✓' : ''}
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: colors.mutedForeground,
                marginTop: 2,
              }}
            >
              Suas avaliações, favoritos e redes sociais ficam ocultos.
            </Text>
          </TouchableOpacity>
        </View>

        {/* 4. Notificações & Aparência */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.sectionTitleRow}>
            <Bell size={16} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Notificações & Aparência
            </Text>
          </View>

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: colors.foreground,
                }}
              >
                Tema Escuro
              </Text>
              <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
                Alternar entre modo escuro e claro do aplicativo.
              </Text>
            </View>
            <TouchableOpacity
              onPress={toggleTheme}
              style={[
                styles.outlineBtn,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                },
              ]}
            >
              {isDark ? (
                <Moon size={14} color={colors.primary} />
              ) : (
                <Sun size={14} color={colors.amber} />
              )}
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: colors.foreground,
                }}
              >
                {isDark ? 'Escuro' : 'Claro'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: colors.foreground,
                }}
              >
                Notificações por E-mail
              </Text>
              <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
                Boletins semanais de álbuns avaliados.
              </Text>
            </View>
            <Switch
              value={emailNotif}
              onValueChange={setEmailNotif}
              trackColor={{ false: colors.secondary, true: colors.primary }}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: colors.foreground,
                }}
              >
                Atividade da Comunidade
              </Text>
              <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
                Avisos de curtidas e comentários em suas reviews.
              </Text>
            </View>
            <Switch
              value={communityNotif}
              onValueChange={setCommunityNotif}
              trackColor={{ false: colors.secondary, true: colors.primary }}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: colors.foreground,
                }}
              >
                Lançamentos Musicais
              </Text>
              <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
                Alertas de novos álbuns.
              </Text>
            </View>
            <Switch
              value={releasesNotif}
              onValueChange={setReleasesNotif}
              trackColor={{ false: colors.secondary, true: colors.primary }}
            />
          </View>
        </View>

        {/* 5. Sobre */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.sectionTitleRow}>
            <Info size={16} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Sobre o Musicpostr
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
            Versão da Aplicação: 1.2.0-mobile (Google Play & App Store Ready)
          </Text>
          <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
            O Musicpostr é uma plataforma interativa de crítica e avaliação de
            álbuns musicais.
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleSaveAll}
          style={[
            styles.saveBtn,
            { backgroundColor: colors.primary },
          ]}
          activeOpacity={0.85}
        >
          <Save size={16} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>
            Salvar Todas as Alterações
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
    paddingBottom: 40,
    gap: 16,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerBox: {
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 4,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  pageSubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  successBanner: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  fieldGroup: {
    gap: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
  sublabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  input: {
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  textarea: {
    minHeight: 74,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  googleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  outlineBtn: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 4,
  },
  saveBtn: {
    height: 46,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
