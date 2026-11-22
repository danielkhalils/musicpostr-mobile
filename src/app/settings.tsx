import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  BackHandler,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { safeGoBack } from '@/utils/navigation';
import { router } from 'expo-router';
import {
  User,
  Shield,
  Lock,
  Bell,
  Info,
  Globe,
  Save,
  Moon,
  Sun,
  LogOut,
  UserPlus,
  Search,
  X,
  Sliders,
  EyeOff,
  Smartphone,
  Database,
  Trash2,
  Download,
  HelpCircle,
  FileText,
  AlertTriangle,
  Plus,
  Music,
  Palette,
  KeyRound,
  UserX,
  MessageSquareOff,
  CheckCircle2,
  ChevronRight,
  Camera,
  Image as ImageIcon,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import {
  pickAndUploadProfileMedia,
  type ImageSourceMode,
  type ProfileMediaKind,
} from '@/services/profileMedia.service';
import { supabase } from '@/services/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageHeader } from '@/components/PageHeader';
import {
  DEFAULT_EXTENDED_SETTINGS,
  type ExtendedSettings,
  loadExtendedSettings,
  saveExtendedSettings,
  clearTemporaryCache,
} from '@/services/settings.service';
import {
  SettingsSectionCard,
  SettingsSubHeader,
  SettingsMenuRow,
  SettingsToggleRow,
  SettingsChoiceGroup,
  SettingsInputField,
  SettingsDivider,
} from '@/components/settings/SettingsPrimitives';

type SettingsSection =
  | 'hub'
  | 'profile'
  | 'account'
  | 'security'
  | 'privacy'
  | 'moderation'
  | 'notifications'
  | 'content'
  | 'appearance'
  | 'data_about';

interface HubItemDef {
  id: Exclude<SettingsSection, 'hub'>;
  group: 'account' | 'privacy' | 'experience';
  title: string;
  subtitle: string;
  keywords: string;
}

const HUB_ITEMS: HubItemDef[] = [
  {
    id: 'profile',
    group: 'account',
    title: 'Perfil & Identidade Pública',
    subtitle: 'Nome, @username, bio, pronomes, avatar, banner e redes sociais',
    keywords: 'perfil nome username bio pronomes localizacao avatar banner instagram tiktok twitter lastfm youtube threads discord spotify site',
  },
  {
    id: 'account',
    group: 'account',
    title: 'Conta & Conexões',
    subtitle: 'E-mail, telefone, Google, Apple, Spotify e Last.fm',
    keywords: 'conta email telefone google apple spotify lastfm vinculada login provedor',
  },
  {
    id: 'security',
    group: 'account',
    title: 'Segurança & Sessões',
    subtitle: 'Alterar senha, 2FA, alertas de login e dispositivos conectados',
    keywords: 'seguranca senha password 2fa dois fatores autenticacao dispositivos sessoes ativas alertas',
  },
  {
    id: 'privacy',
    group: 'privacy',
    title: 'Privacidade & Interações',
    subtitle: 'Conta pública/privada, comentários, menções, mensagens e status',
    keywords: 'privacidade publico privado comentarios mencoes mensagens online atividade musical busca indexacao',
  },
  {
    id: 'moderation',
    group: 'privacy',
    title: 'Moderação & Bem-Estar',
    subtitle: 'Contas bloqueadas, silenciadas, palavras ocultas e limite de uso',
    keywords: 'moderacao bloqueados silenciados palavras ocultas filtro explicito nsfw spoilers bem estar limite tempo',
  },
  {
    id: 'notifications',
    group: 'privacy',
    title: 'Notificações',
    subtitle: 'Push, e-mail, não perturbe, curtidas, comentários e lançamentos',
    keywords: 'notificacoes push email nao perturbe curtidas comentarios seguidores mencoes lancamentos listas resumo',
  },
  {
    id: 'content',
    group: 'experience',
    title: 'Feed, Avaliações & Música',
    subtitle: 'Ordenação do feed, escala de notas, streaming e qualidade de mídia',
    keywords: 'feed ordenacao algoritmo cronologico avaliacoes estrelas nota escala streaming spotify apple deezer tidal previas qualidade capas',
  },
  {
    id: 'appearance',
    group: 'experience',
    title: 'Aparência, Idioma & Acessibilidade',
    subtitle: 'Tema escuro/claro, idioma, tamanho de texto, contraste e vibração',
    keywords: 'aparencia tema escuro claro dark light idioma portugues ingles espanhol fonte texto acessibilidade contraste animacoes vibracao tatil',
  },
  {
    id: 'data_about',
    group: 'experience',
    title: 'Dados, Armazenamento & Sobre',
    subtitle: 'Cache, exportação LGPD, suporte, termos, versão e zona de perigo',
    keywords: 'dados armazenamento cache limpar lgpd exportar suporte ajuda termos privacidade diretrizes versao sobre desativar excluir conta',
  },
];

export default function SettingsScreen() {
  const { colors, isDark, setDarkMode } = useAppTheme();
  const { user, profile: authProfile, updateProfileData, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  const [activeSection, setActiveSection] = useState<SettingsSection>('hub');
  const [searchQuery, setSearchQuery] = useState('');

  // Campos sincronizados com Supabase (profiles)
  const [name, setName] = useState(authProfile?.full_name || '');
  const [username, setUsername] = useState(authProfile?.username || '');
  const [bio, setBio] = useState(authProfile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(authProfile?.avatar_url || '');
  const [bannerUrl, setBannerUrl] = useState(authProfile?.banner_url || '');

  const initialSocials = (authProfile?.socials || {}) as Record<string, string>;
  const [instagram, setInstagram] = useState(initialSocials.instagram || '');
  const [tiktok, setTiktok] = useState(initialSocials.tiktok || '');
  const [twitter, setTwitter] = useState(initialSocials.twitter || '');
  const [lastfm, setLastfm] = useState(initialSocials.lastfm || '');
  const [youtube, setYoutube] = useState(initialSocials.youtube || '');
  const [threads, setThreads] = useState(initialSocials.threads || '');
  const [discord, setDiscord] = useState(initialSocials.discord || '');
  const [spotifyUrl, setSpotifyUrl] = useState(initialSocials.spotify || '');
  const [appleMusicUrl, setAppleMusicUrl] = useState(initialSocials.apple_music || '');
  const [website, setWebsite] = useState(initialSocials.website || '');

  const [email, setEmail] = useState(authProfile?.email || user?.email || '');
  const [phone, setPhone] = useState(authProfile?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLinkedGoogle, setIsLinkedGoogle] = useState(authProfile?.is_linked_google ?? false);
  const [isLinkedApple, setIsLinkedApple] = useState(authProfile?.is_linked_apple ?? false);

  const [profileVisibility, setProfileVisibility] = useState<'public' | 'private'>(
    authProfile?.profile_visibility || 'public'
  );
  const [emailNotif, setEmailNotif] = useState(authProfile?.email_notif ?? true);
  const [communityNotif, setCommunityNotif] = useState(authProfile?.community_notif ?? true);
  const [releasesNotif, setReleasesNotif] = useState(authProfile?.releases_notif ?? false);

  // Configurações estendidas persistidas em AsyncStorage
  const [ext, setExt] = useState<ExtendedSettings>(DEFAULT_EXTENDED_SETTINGS);
  const [newBlockedInput, setNewBlockedInput] = useState('');
  const [newMutedUserInput, setNewMutedUserInput] = useState('');
  const [newMutedWordInput, setNewMutedWordInput] = useState('');

  // Estados de feedback
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState<ProfileMediaKind | null>(null);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authProfile && !user) return;
    const socials = (authProfile?.socials || {}) as Record<string, string>;
    setName(authProfile?.full_name || '');
    setUsername(authProfile?.username || '');
    setBio(authProfile?.bio || '');
    setAvatarUrl(authProfile?.avatar_url || '');
    setBannerUrl(authProfile?.banner_url || '');
    setInstagram(socials.instagram || '');
    setTiktok(socials.tiktok || '');
    setTwitter(socials.twitter || '');
    setLastfm(socials.lastfm || '');
    setYoutube(socials.youtube || '');
    setThreads(socials.threads || '');
    setDiscord(socials.discord || '');
    setSpotifyUrl(socials.spotify || '');
    setAppleMusicUrl(socials.apple_music || '');
    setWebsite(socials.website || '');
    setEmail(authProfile?.email || user?.email || '');
    setPhone(authProfile?.phone || '');
    setIsLinkedGoogle(authProfile?.is_linked_google ?? false);
    setIsLinkedApple(authProfile?.is_linked_apple ?? false);
    setProfileVisibility(authProfile?.profile_visibility || 'public');
    setEmailNotif(authProfile?.email_notif ?? true);
    setCommunityNotif(authProfile?.community_notif ?? true);
    setReleasesNotif(authProfile?.releases_notif ?? false);
  }, [authProfile, user]);

  useEffect(() => {
    let active = true;
    loadExtendedSettings(user?.id).then((loaded) => {
      if (active) setExt(loaded);
    });
    return () => {
      active = false;
    };
  }, [user?.id]);

  // Rola para o topo ao trocar de sub-seção
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [activeSection]);

  // Botão voltar do Android retorna ao hub quando estiver em uma sub-seção
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (activeSection !== 'hub') {
        setActiveSection('hub');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [activeSection]);

  const openSection = (section: SettingsSection) => {
    setErrorMessage(null);
    setActiveSection(section);
  };

  const updateExt = <K extends keyof ExtendedSettings>(key: K, value: ExtendedSettings[K]) => {
    setExt((prev) => {
      const next = { ...prev, [key]: value };
      saveExtendedSettings(next, user?.id).catch(() => {});
      return next;
    });
  };

  const showToast = (msg: string) => {
    setSavedSuccess(msg);
    setTimeout(() => setSavedSuccess(null), 3500);
  };

  const handleUploadProfilePhoto = async (
    kind: ProfileMediaKind,
    source: ImageSourceMode
  ) => {
    if (!user) {
      setErrorMessage('Faça login para enviar fotos de avatar e capa.');
      return;
    }
    setErrorMessage(null);
    setUploadingMedia(kind);
    try {
      const result = await pickAndUploadProfileMedia(user.id, kind, source);
      if (result.canceled) return;
      if (result.error || !result.url) {
        setErrorMessage(result.error || 'Não foi possível enviar a imagem.');
        return;
      }

      if (kind === 'avatar') {
        setAvatarUrl(result.url);
      } else {
        setBannerUrl(result.url);
      }

      const saved = await updateProfileData(
        kind === 'avatar' ? { avatar_url: result.url } : { banner_url: result.url }
      );
      if (saved.success) {
        showToast(
          kind === 'avatar'
            ? 'Foto de avatar atualizada com sucesso!'
            : 'Foto de capa atualizada com sucesso!'
        );
      } else {
        setErrorMessage('Imagem enviada, mas houve erro ao salvar no perfil.');
      }
    } finally {
      setUploadingMedia(null);
    }
  };

  const handleSaveProfileAndAccount = async () => {
    setIsSaving(true);
    setErrorMessage(null);

    await saveExtendedSettings(ext, user?.id);

    if (!user) {
      setIsSaving(false);
      showToast('Preferências locais salvas com sucesso!');
      return;
    }

    if (newPassword.trim().length > 0) {
      if (newPassword.trim().length < 6) {
        setErrorMessage('A nova senha deve ter pelo menos 6 caracteres.');
        setIsSaving(false);
        return;
      }
      if (newPassword.trim() !== confirmPassword.trim()) {
        setErrorMessage('A confirmação da nova senha não coincide.');
        setIsSaving(false);
        return;
      }
    }

    const mergedSocials = {
      ...authProfile?.socials,
      instagram: instagram.trim(),
      tiktok: tiktok.trim(),
      twitter: twitter.trim(),
      lastfm: lastfm.trim(),
      youtube: youtube.trim(),
      threads: threads.trim(),
      discord: discord.trim(),
      spotify: spotifyUrl.trim(),
      apple_music: appleMusicUrl.trim(),
      website: website.trim(),
    };

    const result = await updateProfileData({
      full_name: name.trim(),
      username: username.trim(),
      bio: bio.trim(),
      avatar_url: avatarUrl.trim(),
      banner_url: bannerUrl.trim(),
      email: email.trim(),
      phone: phone.trim(),
      is_linked_google: isLinkedGoogle,
      is_linked_apple: isLinkedApple,
      profile_visibility: profileVisibility,
      email_notif: emailNotif,
      community_notif: communityNotif,
      releases_notif: releasesNotif,
      theme_preference: isDark ? 'dark' : 'light',
      socials: mergedSocials,
    });

    if (!result.success) {
      setErrorMessage('Houve um erro ao salvar suas alterações no servidor.');
      setIsSaving(false);
      return;
    }

    if (newPassword.trim().length >= 6) {
      const { error: passError } = await supabase.auth.updateUser({
        password: newPassword.trim(),
      });
      if (passError) {
        setErrorMessage(
          'Configurações salvas, mas houve erro ao atualizar a senha: ' + passError.message
        );
        setIsSaving(false);
        return;
      }
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
    }

    setIsSaving(false);
    showToast('Todas as configurações foram salvas com sucesso!');
  };

  const handleSignOutOtherSessions = async () => {
    if (!user) {
      Alert.alert('Sessão', 'Faça login para gerenciar sessões ativas.');
      return;
    }
    const { error } = await supabase.auth.signOut({ scope: 'others' });
    if (error) {
      Alert.alert('Erro', 'Não foi possível encerrar outras sessões: ' + error.message);
    } else {
      showToast('Outras sessões conectadas foram encerradas.');
    }
  };

  const handleClearCache = async () => {
    setIsClearingCache(true);
    const removed = await clearTemporaryCache();
    setIsClearingCache(false);
    showToast(
      removed > 0
        ? `Cache limpo (${removed} itens temporários removidos).`
        : 'Cache verificado: nenhum arquivo temporário pendente.'
    );
  };

  const handleAddListTag = (
    raw: string,
    listKey: 'blockedUsers' | 'mutedUsers' | 'mutedWords',
    clearInput: () => void,
    prefixAt = false
  ) => {
    const cleaned = raw.trim().replace(/^@+/, '');
    if (!cleaned) return;
    const formatted = prefixAt ? `@${cleaned}` : cleaned.toLowerCase();
    const current = ext[listKey];
    if (!current.includes(formatted)) {
      updateExt(listKey, [...current, formatted]);
    }
    clearInput();
  };

  const handleRemoveListTag = (
    item: string,
    listKey: 'blockedUsers' | 'mutedUsers' | 'mutedWords'
  ) => {
    updateExt(
      listKey,
      ext[listKey].filter((x) => x !== item)
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Exportar Seus Dados (LGPD)',
      'Prepararemos um arquivo JSON contendo seu perfil, avaliações, favoritos, listas e configurações. Quando estiver pronto, enviaremos o link para o e-mail cadastrado.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Solicitar Exportação',
          onPress: () => showToast('Solicitação de exportação registrada!'),
        },
      ]
    );
  };

  const handleDangerAction = (type: 'deactivate' | 'delete') => {
    const isDelete = type === 'delete';
    Alert.alert(
      isDelete ? 'Excluir Conta Permanentemente' : 'Desativar Conta Temporariamente',
      isDelete
        ? 'Esta ação remove seu perfil, reviews, listas e conexões de forma irreversível. Deseja prosseguir?'
        : 'Seu perfil e avaliações ficarão ocultos até que você faça login novamente. Deseja desativar agora?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: isDelete ? 'Solicitar Exclusão' : 'Desativar',
          style: 'destructive',
          onPress: async () => {
            if (isDelete) {
              showToast('Solicitação de exclusão enviada. Verifique seu e-mail para confirmar.');
            } else {
              await signOut();
              router.replace('/login' as any);
            }
          },
        },
      ]
    );
  };

  const filteredHubItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return HUB_ITEMS;
    return HUB_ITEMS.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.keywords.includes(q)
    );
  }, [searchQuery]);

  const appVersion = Constants.expoConfig?.version || '1.2.0';
  const deviceLabel =
    [Device.brand, Device.modelName].filter(Boolean).join(' ') ||
    (Platform.OS === 'web' ? 'Navegador Web' : 'Dispositivo Atual');
  const osLabel = [Device.osName, Device.osVersion].filter(Boolean).join(' ') || Platform.OS;

  const getBadgeForItem = (id: Exclude<SettingsSection, 'hub'>): string | undefined => {
    switch (id) {
      case 'privacy':
        return profileVisibility === 'public' ? 'Público' : 'Privado';
      case 'security':
        return ext.twoFactorEnabled ? '2FA Ativo' : undefined;
      case 'moderation': {
        const total = ext.blockedUsers.length + ext.mutedUsers.length + ext.mutedWords.length;
        return total > 0 ? `${total}` : undefined;
      }
      case 'appearance':
        return isDark ? 'Escuro' : 'Claro';
      case 'notifications':
        return ext.pushNotifEnabled ? 'Ativas' : 'Pausadas';
      default:
        return undefined;
    }
  };

  const getIconForItem = (id: Exclude<SettingsSection, 'hub'>) => {
    switch (id) {
      case 'profile':
        return { icon: <User size={17} color={colors.primary} />, bg: `${colors.primary}18` };
      case 'account':
        return { icon: <KeyRound size={17} color={colors.emerald} />, bg: `${colors.emerald}18` };
      case 'security':
        return { icon: <Shield size={17} color={colors.amber} />, bg: `${colors.amber}18` };
      case 'privacy':
        return { icon: <Lock size={17} color={colors.primary} />, bg: `${colors.primary}18` };
      case 'moderation':
        return { icon: <EyeOff size={17} color={colors.rose} />, bg: `${colors.rose}18` };
      case 'notifications':
        return { icon: <Bell size={17} color={colors.amber} />, bg: `${colors.amber}18` };
      case 'content':
        return { icon: <Music size={17} color={colors.emerald} />, bg: `${colors.emerald}18` };
      case 'appearance':
        return { icon: <Palette size={17} color={colors.primary} />, bg: `${colors.primary}18` };
      case 'data_about':
        return { icon: <Info size={17} color={colors.mutedForeground} />, bg: colors.secondary };
    }
  };

  const renderFeedbackBanners = () => (
    <>
      {savedSuccess && (
        <View
          style={[
            styles.feedbackBanner,
            {
              backgroundColor: `${colors.emerald}18`,
              borderColor: `${colors.emerald}45`,
            },
          ]}
        >
          <CheckCircle2 size={16} color={colors.emerald} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.emerald, flex: 1 }}>
            {savedSuccess}
          </Text>
        </View>
      )}

      {errorMessage && (
        <View
          style={[
            styles.feedbackBanner,
            {
              backgroundColor: `${colors.destructive}18`,
              borderColor: `${colors.destructive}45`,
            },
          ]}
        >
          <AlertTriangle size={16} color={colors.destructive} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.destructive, flex: 1 }}>
            {errorMessage}
          </Text>
        </View>
      )}
    </>
  );

  const renderSaveButton = (label = 'Salvar Alterações') => (
    <TouchableOpacity
      onPress={handleSaveProfileAndAccount}
      disabled={isSaving}
      style={[
        styles.saveBtn,
        { backgroundColor: isSaving ? colors.muted : colors.primary },
      ]}
      activeOpacity={0.85}
    >
      {isSaving ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Save size={16} color="#fff" />
      )}
      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>
        {isSaving ? 'Salvando...' : label}
      </Text>
    </TouchableOpacity>
  );

  // ==========================
  // HUB PRINCIPAL
  // ==========================
  const renderHub = () => {
    const groups: { key: HubItemDef['group']; label: string }[] = [
      { key: 'account', label: 'Sua Conta' },
      { key: 'privacy', label: 'Privacidade, Segurança & Comunidade' },
      { key: 'experience', label: 'Experiência & Aplicativo' },
    ];

    return (
      <>
        <PageHeader
          title="Configurações"
          subtitle="Central de conta, privacidade, moderação, notificações e preferências do Musicpostr."
          onBack={() => safeGoBack('/(tabs)/profile')}
          backLabel="Voltar ao Perfil"
        />

        {renderFeedbackBanners()}

        {/* Barra de busca nas configurações */}
        <View
          style={[
            styles.searchBox,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Search size={16} color={colors.mutedForeground} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar configurações (ex: senha, privacidade, 2FA, tema)..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {/* Card de resumo da conta */}
        {!searchQuery && (
          <TouchableOpacity
            onPress={() => openSection('profile')}
            activeOpacity={0.8}
            style={[
              styles.profileSummaryCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.summaryAvatar} contentFit="cover" />
            ) : (
              <View
                style={[
                  styles.summaryAvatar,
                  {
                    backgroundColor: `${colors.primary}25`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                ]}
              >
                <User size={22} color={colors.primary} />
              </View>
            )}
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text
                  style={{ fontSize: 15, fontWeight: '800', color: colors.foreground }}
                  numberOfLines={1}
                >
                  {name || 'Visitante'}
                </Text>
                <View
                  style={[
                    styles.miniPill,
                    {
                      backgroundColor:
                        profileVisibility === 'public'
                          ? `${colors.emerald}20`
                          : `${colors.amber}20`,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 9.5,
                      fontWeight: '800',
                      color: profileVisibility === 'public' ? colors.emerald : colors.amber,
                    }}
                  >
                    {profileVisibility === 'public' ? 'PÚBLICO' : 'PRIVADO'}
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, color: colors.mutedForeground }} numberOfLines={1}>
                @{username || 'sem-username'} • {email || 'Não autenticado'}
              </Text>
              <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700', marginTop: 2 }}>
                Editar perfil público e redes sociais
              </Text>
            </View>
            <ChevronRight size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}

        {/* Grupos de menu */}
        {filteredHubItems.length === 0 ? (
          <SettingsSectionCard>
            <Text style={{ fontSize: 13, color: colors.mutedForeground, textAlign: 'center', paddingVertical: 12 }}>
              Nenhuma configuração encontrada para &ldquo;{searchQuery}&rdquo;.
            </Text>
          </SettingsSectionCard>
        ) : (
          groups.map((grp) => {
            const items = filteredHubItems.filter((i) => i.group === grp.key);
            if (items.length === 0) return null;
            return (
              <View key={grp.key} style={{ gap: 8 }}>
                <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>
                  {grp.label}
                </Text>
                <View
                  style={[
                    styles.menuCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  {items.map((item, idx) => {
                    const visual = getIconForItem(item.id);
                    return (
                      <SettingsMenuRow
                        key={item.id}
                        icon={visual.icon}
                        iconBg={visual.bg}
                        title={item.title}
                        subtitle={item.subtitle}
                        badge={getBadgeForItem(item.id)}
                        showDivider={idx < items.length - 1}
                        onPress={() => openSection(item.id)}
                      />
                    );
                  })}
                </View>
              </View>
            );
          })
        )}

        {/* Ações rápidas de sessão */}
        {!searchQuery && (
          <View style={{ gap: 8 }}>
            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>
              Sessão
            </Text>
            <View
              style={[
                styles.menuCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <SettingsMenuRow
                icon={<User size={17} color={colors.primary} />}
                title="Trocar de Conta / Fazer Login"
                subtitle="Entrar com outro perfil no Musicpostr"
                onPress={() => router.push('/login' as any)}
              />
              <SettingsMenuRow
                icon={<UserPlus size={17} color={colors.emerald} />}
                iconBg={`${colors.emerald}18`}
                title="Cadastrar Nova Conta"
                subtitle="Criar um novo perfil na comunidade"
                onPress={() => router.push('/register' as any)}
              />
              <SettingsMenuRow
                icon={<LogOut size={17} color={colors.destructive} />}
                title="Desconectar da Conta"
                subtitle="Encerrar sua sessão neste dispositivo"
                destructive
                showDivider={false}
                onPress={async () => {
                  await signOut();
                  router.replace('/login' as any);
                }}
              />
            </View>
          </View>
        )}

        <Text style={[styles.footerNote, { color: colors.mutedForeground }]}>
          Musicpostr v{appVersion} • {deviceLabel}
        </Text>
      </>
    );
  };

  // ==========================
  // 1. PERFIL & IDENTIDADE
  // ==========================
  const renderProfileSection = () => (
    <>
      <SettingsSubHeader
        title="Perfil & Identidade Pública"
        subtitle="Personalize como outros melômanos veem seu perfil, sua biografia e seus links sociais."
        icon={<User size={20} color={colors.primary} />}
        onBack={() => openSection('hub')}
      />
      {renderFeedbackBanners()}

      <SettingsSectionCard title="Informações Básicas">
        <SettingsInputField
          label="Nome de Exibição"
          value={name}
          onChangeText={setName}
          placeholder="Seu nome público"
          maxLength={60}
        />
        <SettingsInputField
          label="Username (@)"
          value={username}
          onChangeText={setUsername}
          placeholder="seunome"
          autoCapitalize="none"
          maxLength={30}
        />
        <SettingsInputField
          label="Pronomes"
          value={ext.pronouns}
          onChangeText={(val) => updateExt('pronouns', val)}
          placeholder="Ex: ele/dele, ela/dela, elu/delu"
          maxLength={30}
        />
        <SettingsInputField
          label="Localização"
          value={ext.location}
          onChangeText={(val) => updateExt('location', val)}
          placeholder="Ex: São Paulo, BR"
          maxLength={60}
        />
        <SettingsInputField
          label="Biografia"
          value={bio}
          onChangeText={setBio}
          placeholder="Fale sobre seus gêneros, artistas e álbuns favoritos..."
          multiline
          maxLength={240}
        />
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Mídia do Perfil"
        subtitle="Escolha fotos da galeria ou câmera para seu avatar e capa, ou informe uma URL."
      >
        {/* Pré-visualização interativa de Capa e Avatar */}
        <View style={{ gap: 12, marginBottom: 6 }}>
          <View
            style={{
              height: 112,
              borderRadius: 14,
              overflow: 'hidden',
              backgroundColor: colors.secondary,
              borderWidth: 1,
              borderColor: colors.border,
              position: 'relative',
            }}
          >
            {bannerUrl ? (
              <Image
                source={{ uri: bannerUrl }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
            ) : null}
            <View
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.28)',
              }}
            />
            {uploadingMedia === 'banner' ? (
              <View
                style={{
                  position: 'absolute',
                  inset: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0,0,0,0.45)',
                }}
              >
                <ActivityIndicator size="small" color="#fff" />
              </View>
            ) : (
              <View
                style={{
                  position: 'absolute',
                  right: 10,
                  bottom: 10,
                  flexDirection: 'row',
                  gap: 6,
                }}
              >
                <TouchableOpacity
                  onPress={() => handleUploadProfilePhoto('banner', 'library')}
                  disabled={!user || uploadingMedia !== null}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: 'rgba(9,9,11,0.78)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.2)',
                  }}
                >
                  <ImageIcon size={12} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
                    Capa (Galeria)
                  </Text>
                </TouchableOpacity>
                {Platform.OS !== 'web' && (
                  <TouchableOpacity
                    onPress={() => handleUploadProfilePhoto('banner', 'camera')}
                    disabled={!user || uploadingMedia !== null}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 999,
                      backgroundColor: 'rgba(9,9,11,0.78)',
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.2)',
                    }}
                  >
                    <Camera size={12} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                overflow: 'hidden',
                backgroundColor: colors.secondary,
                borderWidth: 2,
                borderColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              ) : (
                <User size={24} color={colors.mutedForeground} />
              )}
              {uploadingMedia === 'avatar' && (
                <View
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.55)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              )}
            </View>

            <View style={{ flex: 1, gap: 6 }}>
              <Text style={{ fontSize: 12.5, fontWeight: '800', color: colors.foreground }}>
                Foto de Avatar
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => handleUploadProfilePhoto('avatar', 'library')}
                  disabled={!user || uploadingMedia !== null}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    paddingHorizontal: 11,
                    paddingVertical: 7,
                    borderRadius: 10,
                    backgroundColor: colors.primary,
                  }}
                >
                  <ImageIcon size={13} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 11.5, fontWeight: '800' }}>
                    Galeria
                  </Text>
                </TouchableOpacity>
                {Platform.OS !== 'web' && (
                  <TouchableOpacity
                    onPress={() => handleUploadProfilePhoto('avatar', 'camera')}
                    disabled={!user || uploadingMedia !== null}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      paddingHorizontal: 11,
                      paddingVertical: 7,
                      borderRadius: 10,
                      backgroundColor: colors.secondary,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Camera size={13} color={colors.foreground} />
                    <Text style={{ color: colors.foreground, fontSize: 11.5, fontWeight: '800' }}>
                      Câmera
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>

        <SettingsInputField
          label="URL da Foto de Perfil (Avatar)"
          value={avatarUrl}
          onChangeText={setAvatarUrl}
          placeholder="https://exemplo.com/avatar.jpg"
          autoCapitalize="none"
        />
        <SettingsInputField
          label="URL do Banner de Fundo"
          value={bannerUrl}
          onChangeText={setBannerUrl}
          placeholder="https://exemplo.com/banner.jpg"
          autoCapitalize="none"
        />
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Redes Sociais & Streaming"
        subtitle="Adicione links públicos exibidos no seu perfil."
      >
        {[
          { label: 'Instagram', val: instagram, set: setInstagram, ph: 'https://instagram.com/seuuser' },
          { label: 'TikTok', val: tiktok, set: setTiktok, ph: 'https://tiktok.com/@seuuser' },
          { label: 'X (Twitter)', val: twitter, set: setTwitter, ph: 'https://x.com/seuuser' },
          { label: 'Threads', val: threads, set: setThreads, ph: 'https://threads.net/@seuuser' },
          { label: 'Last.fm', val: lastfm, set: setLastfm, ph: 'https://last.fm/user/seuuser' },
          { label: 'Spotify', val: spotifyUrl, set: setSpotifyUrl, ph: 'https://open.spotify.com/user/...' },
          { label: 'Apple Music', val: appleMusicUrl, set: setAppleMusicUrl, ph: 'https://music.apple.com/profile/...' },
          { label: 'YouTube', val: youtube, set: setYoutube, ph: 'https://youtube.com/@seucanal' },
          { label: 'Discord', val: discord, set: setDiscord, ph: 'seuuser#0000 ou link' },
          { label: 'Site Pessoal / Portfólio', val: website, set: setWebsite, ph: 'https://seusite.com' },
        ].map((item) => (
          <SettingsInputField
            key={item.label}
            label={item.label}
            value={item.val}
            onChangeText={item.set}
            placeholder={item.ph}
            autoCapitalize="none"
          />
        ))}
      </SettingsSectionCard>

      {renderSaveButton('Salvar Perfil e Links')}
    </>
  );

  // ==========================
  // 2. CONTA & CONEXÕES
  // ==========================
  const renderAccountSection = () => (
    <>
      <SettingsSubHeader
        title="Conta & Conexões"
        subtitle="Dados cadastrais, provedores de login e integrações com serviços musicais."
        icon={<KeyRound size={20} color={colors.emerald} />}
        onBack={() => openSection('hub')}
      />
      {renderFeedbackBanners()}

      <SettingsSectionCard title="Dados de Contato">
        <SettingsInputField
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="voce@exemplo.com"
        />
        <SettingsInputField
          label="Telefone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="+55 (11) 99999-9999"
        />
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Contas Vinculadas"
        subtitle="Conecte provedores de login rápido e plataformas de música."
      >
        {[
          {
            title: 'Google',
            desc: 'Login rápido com sua conta Google.',
            linked: isLinkedGoogle,
            onToggle: () => setIsLinkedGoogle(!isLinkedGoogle),
          },
          {
            title: 'Apple ID',
            desc: 'Autenticação segura com Sign in with Apple.',
            linked: isLinkedApple,
            onToggle: () => setIsLinkedApple(!isLinkedApple),
          },
          {
            title: 'Spotify',
            desc: 'Importe favoritos e sincronize álbuns ouvidos.',
            linked: ext.isLinkedSpotify,
            onToggle: () => updateExt('isLinkedSpotify', !ext.isLinkedSpotify),
          },
          {
            title: 'Last.fm',
            desc: 'Sincronize scrobbles e estatísticas de audição.',
            linked: ext.isLinkedLastfm,
            onToggle: () => updateExt('isLinkedLastfm', !ext.isLinkedLastfm),
          },
        ].map((provider, idx) => (
          <View
            key={provider.title}
            style={[
              styles.linkedRow,
              idx > 0 && { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.foreground }}>
                {provider.title}
              </Text>
              <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
                {provider.desc}
              </Text>
            </View>
            <TouchableOpacity
              onPress={provider.onToggle}
              style={[
                styles.outlineBtn,
                {
                  backgroundColor: provider.linked ? `${colors.emerald}18` : colors.secondary,
                  borderColor: provider.linked ? `${colors.emerald}45` : colors.border,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 11.5,
                  fontWeight: '700',
                  color: provider.linked ? colors.emerald : colors.foreground,
                }}
              >
                {provider.linked ? 'Conectado' : 'Conectar'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </SettingsSectionCard>

      <SettingsSectionCard title="Detalhes da Conta">
        <View style={styles.infoRow}>
          <Text style={[styles.infoKey, { color: colors.mutedForeground }]}>ID da Conta</Text>
          <Text style={[styles.infoVal, { color: colors.foreground }]}>
            {user?.id ? `${user.id.slice(0, 8)}...${user.id.slice(-4)}` : 'Visitante'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoKey, { color: colors.mutedForeground }]}>Provedor Principal</Text>
          <Text style={[styles.infoVal, { color: colors.foreground }]}>
            {authProfile?.auth_provider || 'email'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoKey, { color: colors.mutedForeground }]}>Membro desde</Text>
          <Text style={[styles.infoVal, { color: colors.foreground }]}>
            {authProfile?.created_at
              ? new Date(authProfile.created_at).toLocaleDateString('pt-BR')
              : '—'}
          </Text>
        </View>
      </SettingsSectionCard>

      {renderSaveButton('Salvar Dados da Conta')}
    </>
  );

  // ==========================
  // 3. SEGURANÇA & SESSÕES
  // ==========================
  const renderSecuritySection = () => (
    <>
      <SettingsSubHeader
        title="Segurança & Sessões"
        subtitle="Proteja sua conta com senha forte, verificação em duas etapas e controle de dispositivos."
        icon={<Shield size={20} color={colors.amber} />}
        onBack={() => openSection('hub')}
      />
      {renderFeedbackBanners()}

      <SettingsSectionCard title="Alterar Senha">
        <SettingsInputField
          label="Senha Atual"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          placeholder="••••••••"
        />
        <SettingsInputField
          label="Nova Senha"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          placeholder="Mínimo 6 caracteres"
        />
        <SettingsInputField
          label="Confirmar Nova Senha"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          placeholder="Repita a nova senha"
        />
        {renderSaveButton('Atualizar Senha')}
      </SettingsSectionCard>

      <SettingsSectionCard title="Proteção Adicional">
        <SettingsToggleRow
          title="Autenticação em Dois Fatores (2FA)"
          subtitle="Exigir código adicional de aplicativo autenticador ou SMS ao entrar em novos dispositivos."
          value={ext.twoFactorEnabled}
          onValueChange={(v) => updateExt('twoFactorEnabled', v)}
          showDivider
        />
        <SettingsToggleRow
          title="Alertas de Novo Login"
          subtitle="Receber aviso por e-mail sempre que sua conta for acessada em um novo aparelho."
          value={ext.loginAlerts}
          onValueChange={(v) => updateExt('loginAlerts', v)}
          showDivider
        />
        <SettingsToggleRow
          title="Aprovação de Logins Suspeitos"
          subtitle="Bloquear temporariamente acessos de localizações incomuns até sua confirmação."
          value={ext.suspiciousLoginApproval}
          onValueChange={(v) => updateExt('suspiciousLoginApproval', v)}
        />
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Dispositivos Conectados"
        icon={<Smartphone size={16} color={colors.primary} />}
      >
        <View
          style={[
            styles.deviceCard,
            { backgroundColor: colors.secondary, borderColor: colors.border },
          ]}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.foreground }}>
              {deviceLabel}
            </Text>
            <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
              {osLabel} • Sessão atual ativa agora
            </Text>
          </View>
          <View style={[styles.miniPill, { backgroundColor: `${colors.emerald}22` }]}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: colors.emerald }}>ATIVO</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSignOutOtherSessions}
          style={[
            styles.outlineBtn,
            {
              backgroundColor: `${colors.destructive}14`,
              borderColor: `${colors.destructive}40`,
              height: 40,
            },
          ]}
        >
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.destructive }}>
            Encerrar Todas as Outras Sessões
          </Text>
        </TouchableOpacity>
      </SettingsSectionCard>
    </>
  );

  // ==========================
  // 4. PRIVACIDADE & INTERAÇÕES
  // ==========================
  const renderPrivacySection = () => (
    <>
      <SettingsSubHeader
        title="Privacidade & Interações"
        subtitle="Controle quem pode ver seu perfil, interagir com suas reviews e encontrar você."
        icon={<Lock size={20} color={colors.primary} />}
        onBack={() => openSection('hub')}
      />
      {renderFeedbackBanners()}

      <SettingsSectionCard title="Visibilidade da Conta" icon={<Globe size={16} color={colors.primary} />}>
        <SettingsChoiceGroup
          value={profileVisibility}
          onChange={setProfileVisibility}
          options={[
            {
              value: 'public',
              label: 'Perfil Público',
              description: 'Qualquer pessoa pode ver suas avaliações, notas, listas e redes sociais.',
            },
            {
              value: 'private',
              label: 'Perfil Privado',
              description: 'Apenas amigos aprovados podem visualizar suas avaliações, favoritos e listas.',
            },
          ]}
        />
      </SettingsSectionCard>

      <SettingsSectionCard title="Controles de Interação">
        <SettingsChoiceGroup
          label="Quem pode comentar nas minhas reviews"
          layout="pills"
          value={ext.whoCanComment}
          onChange={(v) => updateExt('whoCanComment', v)}
          options={[
            { value: 'everyone', label: 'Todos' },
            { value: 'friends', label: 'Apenas Amigos' },
            { value: 'nobody', label: 'Ninguém' },
          ]}
        />
        <SettingsDivider />
        <SettingsChoiceGroup
          label="Quem pode me mencionar (@)"
          layout="pills"
          value={ext.whoCanMention}
          onChange={(v) => updateExt('whoCanMention', v)}
          options={[
            { value: 'everyone', label: 'Todos' },
            { value: 'friends', label: 'Apenas Amigos' },
            { value: 'nobody', label: 'Ninguém' },
          ]}
        />
        <SettingsDivider />
        <SettingsChoiceGroup
          label="Quem pode enviar solicitações e mensagens"
          layout="pills"
          value={ext.whoCanMessage}
          onChange={(v) => updateExt('whoCanMessage', v)}
          options={[
            { value: 'everyone', label: 'Todos' },
            { value: 'friends', label: 'Apenas Amigos' },
            { value: 'nobody', label: 'Ninguém' },
          ]}
        />
      </SettingsSectionCard>

      <SettingsSectionCard title="Presença & Descoberta">
        <SettingsToggleRow
          title="Exibir Status Online"
          subtitle="Mostrar quando você está ativo ou esteve online recentemente."
          value={ext.showOnlineStatus}
          onValueChange={(v) => updateExt('showOnlineStatus', v)}
          showDivider
        />
        <SettingsToggleRow
          title="Compartilhar Atividade Musical"
          subtitle="Exibir álbuns favoritados e avaliações recentes no feed de amigos."
          value={ext.showListeningActivity}
          onValueChange={(v) => updateExt('showListeningActivity', v)}
          showDivider
        />
        <SettingsToggleRow
          title="Encontrar por E-mail ou Telefone"
          subtitle="Permitir que pessoas com seu contato encontrem seu perfil."
          value={ext.discoverableByContact}
          onValueChange={(v) => updateExt('discoverableByContact', v)}
          showDivider
        />
        <SettingsToggleRow
          title="Indexação em Buscadores"
          subtitle="Permitir que mecanismos de busca externos exibam seu perfil público."
          value={ext.allowSearchEngineIndexing}
          onValueChange={(v) => updateExt('allowSearchEngineIndexing', v)}
        />
      </SettingsSectionCard>

      {renderSaveButton('Salvar Privacidade')}
    </>
  );

  // ==========================
  // 5. MODERAÇÃO & BEM-ESTAR
  // ==========================
  const renderModerationSection = () => (
    <>
      <SettingsSubHeader
        title="Moderação & Bem-Estar"
        subtitle="Gerencie bloqueios, contas silenciadas, filtros de palavras e tempo de uso."
        icon={<EyeOff size={20} color={colors.rose} />}
        onBack={() => openSection('hub')}
      />
      {renderFeedbackBanners()}

      {/* Contas Bloqueadas */}
      <SettingsSectionCard
        title="Contas Bloqueadas"
        icon={<UserX size={16} color={colors.destructive} />}
        subtitle="Usuários bloqueados não podem ver seu perfil nem interagir com você."
      >
        <View style={styles.addTagRow}>
          <TextInput
            value={newBlockedInput}
            onChangeText={setNewBlockedInput}
            placeholder="Adicionar @username para bloquear"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            style={[
              styles.addTagInput,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
          />
          <TouchableOpacity
            onPress={() =>
              handleAddListTag(newBlockedInput, 'blockedUsers', () => setNewBlockedInput(''), true)
            }
            style={[styles.addTagBtn, { backgroundColor: colors.primary }]}
          >
            <Plus size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        {ext.blockedUsers.length === 0 ? (
          <Text style={{ fontSize: 11.5, color: colors.mutedForeground }}>
            Nenhuma conta bloqueada no momento.
          </Text>
        ) : (
          <View style={styles.tagWrap}>
            {ext.blockedUsers.map((u) => (
              <TouchableOpacity
                key={u}
                onPress={() => handleRemoveListTag(u, 'blockedUsers')}
                style={[
                  styles.tagChip,
                  { backgroundColor: `${colors.destructive}15`, borderColor: `${colors.destructive}40` },
                ]}
              >
                <Text style={{ fontSize: 11.5, fontWeight: '700', color: colors.destructive }}>
                  {u}
                </Text>
                <X size={12} color={colors.destructive} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </SettingsSectionCard>

      {/* Contas Silenciadas */}
      <SettingsSectionCard
        title="Contas Silenciadas"
        subtitle="Oculte publicações e reviews do seu feed sem deixar de seguir."
      >
        <View style={styles.addTagRow}>
          <TextInput
            value={newMutedUserInput}
            onChangeText={setNewMutedUserInput}
            placeholder="Adicionar @username para silenciar"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            style={[
              styles.addTagInput,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
          />
          <TouchableOpacity
            onPress={() =>
              handleAddListTag(
                newMutedUserInput,
                'mutedUsers',
                () => setNewMutedUserInput(''),
                true
              )
            }
            style={[styles.addTagBtn, { backgroundColor: colors.primary }]}
          >
            <Plus size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        {ext.mutedUsers.length === 0 ? (
          <Text style={{ fontSize: 11.5, color: colors.mutedForeground }}>
            Nenhuma conta silenciada.
          </Text>
        ) : (
          <View style={styles.tagWrap}>
            {ext.mutedUsers.map((u) => (
              <TouchableOpacity
                key={u}
                onPress={() => handleRemoveListTag(u, 'mutedUsers')}
                style={[
                  styles.tagChip,
                  { backgroundColor: colors.secondary, borderColor: colors.border },
                ]}
              >
                <Text style={{ fontSize: 11.5, fontWeight: '700', color: colors.foreground }}>
                  {u}
                </Text>
                <X size={12} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </SettingsSectionCard>

      {/* Palavras Ocultas */}
      <SettingsSectionCard
        title="Palavras e Termos Ocultos"
        icon={<MessageSquareOff size={16} color={colors.amber} />}
        subtitle="Ocultar automaticamente comentários e reviews que contenham estes termos."
      >
        <View style={styles.addTagRow}>
          <TextInput
            value={newMutedWordInput}
            onChangeText={setNewMutedWordInput}
            placeholder="Ex: spoiler, vazamento..."
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            style={[
              styles.addTagInput,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
          />
          <TouchableOpacity
            onPress={() =>
              handleAddListTag(
                newMutedWordInput,
                'mutedWords',
                () => setNewMutedWordInput(''),
                false
              )
            }
            style={[styles.addTagBtn, { backgroundColor: colors.primary }]}
          >
            <Plus size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        {ext.mutedWords.length === 0 ? (
          <Text style={{ fontSize: 11.5, color: colors.mutedForeground }}>
            Nenhum termo silenciado.
          </Text>
        ) : (
          <View style={styles.tagWrap}>
            {ext.mutedWords.map((w) => (
              <TouchableOpacity
                key={w}
                onPress={() => handleRemoveListTag(w, 'mutedWords')}
                style={[
                  styles.tagChip,
                  { backgroundColor: `${colors.amber}18`, borderColor: `${colors.amber}45` },
                ]}
              >
                <Text style={{ fontSize: 11.5, fontWeight: '700', color: colors.amber }}>{w}</Text>
                <X size={12} color={colors.amber} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </SettingsSectionCard>

      <SettingsSectionCard title="Filtros de Conteúdo & Bem-Estar Digital">
        <SettingsToggleRow
          title="Ocultar Conteúdo Explícito"
          subtitle="Aplicar filtro em capas sensíveis e reviews com linguagem explícita."
          value={ext.hideExplicitContent}
          onValueChange={(v) => updateExt('hideExplicitContent', v)}
          showDivider
        />
        <SettingsToggleRow
          title="Ocultar Spoilers de Lançamentos"
          subtitle="Esconder textos longos de reviews de álbuns lançados nos últimos 7 dias."
          value={ext.hideReleaseSpoilers}
          onValueChange={(v) => updateExt('hideReleaseSpoilers', v)}
          showDivider
        />
        <SettingsChoiceGroup
          label="Lembrete de Limite Diário de Uso"
          layout="pills"
          value={ext.dailyUsageLimit}
          onChange={(v) => updateExt('dailyUsageLimit', v)}
          options={[
            { value: 'off', label: 'Desativado' },
            { value: '30m', label: '30 min' },
            { value: '1h', label: '1 hora' },
            { value: '2h', label: '2 horas' },
          ]}
        />
      </SettingsSectionCard>
    </>
  );

  // ==========================
  // 6. NOTIFICAÇÕES
  // ==========================
  const renderNotificationsSection = () => (
    <>
      <SettingsSubHeader
        title="Notificações"
        subtitle="Escolha quais alertas você deseja receber por push e por e-mail."
        icon={<Bell size={20} color={colors.amber} />}
        onBack={() => openSection('hub')}
      />
      {renderFeedbackBanners()}

      <SettingsSectionCard title="Canais Principais">
        <SettingsToggleRow
          title="Notificações Push"
          subtitle="Ativar ou pausar todos os alertas push neste dispositivo."
          value={ext.pushNotifEnabled}
          onValueChange={(v) => updateExt('pushNotifEnabled', v)}
          showDivider
        />
        <SettingsToggleRow
          title="Notificações por E-mail"
          subtitle="Boletins semanais de álbuns avaliados e resumo da sua conta."
          value={emailNotif}
          onValueChange={setEmailNotif}
          showDivider
        />
        <SettingsToggleRow
          title="Modo Não Perturbe (22h – 08h)"
          subtitle="Silenciar alertas push automaticamente durante a madrugada."
          value={ext.quietHoursEnabled}
          onValueChange={(v) => updateExt('quietHoursEnabled', v)}
        />
      </SettingsSectionCard>

      <SettingsSectionCard title="Interações Sociais">
        <SettingsToggleRow
          title="Atividade da Comunidade"
          subtitle="Controle geral para curtidas, comentários e interações sociais."
          value={communityNotif}
          onValueChange={setCommunityNotif}
          showDivider
        />
        <SettingsToggleRow
          title="Curtidas nas Minhas Reviews"
          subtitle="Avisar quando alguém curtir uma avaliação sua."
          value={ext.notifLikes}
          onValueChange={(v) => updateExt('notifLikes', v)}
          disabled={!communityNotif}
          showDivider
        />
        <SettingsToggleRow
          title="Comentários e Respostas"
          subtitle="Avisar quando responderem suas reviews ou posts."
          value={ext.notifComments}
          onValueChange={(v) => updateExt('notifComments', v)}
          disabled={!communityNotif}
          showDivider
        />
        <SettingsToggleRow
          title="Novos Amigos e Seguidores"
          subtitle="Avisar sobre solicitações de amizade aceitas ou recebidas."
          value={ext.notifNewFollowers}
          onValueChange={(v) => updateExt('notifNewFollowers', v)}
          disabled={!communityNotif}
          showDivider
        />
        <SettingsToggleRow
          title="Menções (@)"
          subtitle="Avisar quando mencionarem seu username em uma publicação."
          value={ext.notifMentions}
          onValueChange={(v) => updateExt('notifMentions', v)}
          disabled={!communityNotif}
        />
      </SettingsSectionCard>

      <SettingsSectionCard title="Música, Listas & Destaques">
        <SettingsToggleRow
          title="Lançamentos Musicais"
          subtitle="Alertas de novos álbuns de artistas que você segue."
          value={releasesNotif}
          onValueChange={setReleasesNotif}
          showDivider
        />
        <SettingsToggleRow
          title="Atualizações em Listas Seguidas"
          subtitle="Avisar quando novos discos forem adicionados às listas que você acompanha."
          value={ext.notifFollowedLists}
          onValueChange={(v) => updateExt('notifFollowedLists', v)}
          showDivider
        />
        <SettingsToggleRow
          title="Rankings e Destaques da Semana"
          subtitle="Resumo semanal com os álbuns mais bem avaliados pela comunidade."
          value={ext.notifWeeklyDigest}
          onValueChange={(v) => updateExt('notifWeeklyDigest', v)}
        />
      </SettingsSectionCard>

      {renderSaveButton('Salvar Preferências de Notificação')}
    </>
  );

  // ==========================
  // 7. FEED, AVALIAÇÕES & MÚSICA
  // ==========================
  const renderContentSection = () => (
    <>
      <SettingsSubHeader
        title="Feed, Avaliações & Música"
        subtitle="Personalize a forma como você descobre, ouve e avalia álbuns."
        icon={<Music size={20} color={colors.emerald} />}
        onBack={() => openSection('hub')}
      />
      {renderFeedbackBanners()}

      <SettingsSectionCard title="Feed Social" icon={<Sliders size={16} color={colors.primary} />}>
        <SettingsChoiceGroup
          label="Visualização dos Cards de Atividade"
          helper="Aplica-se à Timeline, Perfil, Comunidades e Minhas Avaliações."
          value={ext.activityCardMode}
          onChange={(v) => updateExt('activityCardMode', v)}
          options={[
            {
              value: 'full',
              label: 'Completo (Estilo Feed)',
              description: 'Capa grande em destaque, selo de nota e visualização completa igual à timeline.',
            },
            {
              value: 'compact',
              label: 'Compacto',
              description: 'Layout condensado em linha com miniatura da capa para navegar mais rápido.',
            },
          ]}
        />
        <SettingsDivider />
        <SettingsChoiceGroup
          label="Ordenação Padrão do Feed"
          value={ext.defaultFeedSort}
          onChange={(v) => updateExt('defaultFeedSort', v)}
          options={[
            {
              value: 'for_you',
              label: 'Para Você (Recomendado)',
              description: 'Combina reviews de amigos, artistas seguidos e destaques da comunidade.',
            },
            {
              value: 'recent',
              label: 'Cronológico (Mais recentes)',
              description: 'Exibe todas as avaliações estritamente por ordem de publicação.',
            },
            {
              value: 'friends_only',
              label: 'Apenas Amigos',
              description: 'Mostra somente publicações da sua rede de amigos.',
            },
          ]}
        />
      </SettingsSectionCard>

      <SettingsSectionCard title="Sistema de Avaliações">
        <SettingsChoiceGroup
          label="Escala de Nota Preferida"
          layout="pills"
          value={ext.ratingScale}
          onChange={(v) => updateExt('ratingScale', v)}
          options={[
            { value: '5_stars', label: '5 Estrelas (0.5)' },
            { value: '10_points', label: '0 a 10' },
            { value: '100_points', label: '0 a 100' },
          ]}
        />
        <SettingsDivider />
        <SettingsToggleRow
          title="Exibir Média da Comunidade Antes de Avaliar"
          subtitle="Desative para evitar viés e ver a nota geral apenas após publicar sua review."
          value={ext.showCommunityRatingBeforeReview}
          onValueChange={(v) => updateExt('showCommunityRatingBeforeReview', v)}
        />
      </SettingsSectionCard>

      <SettingsSectionCard title="Streaming & Mídia">
        <SettingsChoiceGroup
          label="Serviço de Streaming Preferido"
          helper="Usado como atalho principal ao abrir álbuns e faixas."
          layout="pills"
          value={ext.preferredStreaming}
          onChange={(v) => updateExt('preferredStreaming', v)}
          options={[
            { value: 'spotify', label: 'Spotify' },
            { value: 'apple_music', label: 'Apple Music' },
            { value: 'youtube_music', label: 'YouTube Music' },
            { value: 'deezer', label: 'Deezer' },
            { value: 'tidal', label: 'Tidal' },
          ]}
        />
        <SettingsDivider />
        <SettingsToggleRow
          title="Reprodução Automática de Prévias"
          subtitle="Tocar trechos curtos automaticamente ao abrir um álbum no Wi-Fi."
          value={ext.autoplayPreviews}
          onValueChange={(v) => updateExt('autoplayPreviews', v)}
          showDivider
        />
        <SettingsChoiceGroup
          label="Qualidade de Capas e Imagens"
          layout="pills"
          value={ext.imageQuality}
          onChange={(v) => updateExt('imageQuality', v)}
          options={[
            { value: 'auto', label: 'Automática' },
            { value: 'high', label: 'Alta (HD)' },
            { value: 'data_saver', label: 'Economia de Dados' },
          ]}
        />
      </SettingsSectionCard>
    </>
  );

  // ==========================
  // 8. APARÊNCIA & ACESSIBILIDADE
  // ==========================
  const renderAppearanceSection = () => (
    <>
      <SettingsSubHeader
        title="Aparência, Idioma & Acessibilidade"
        subtitle="Ajuste tema visual, idioma e recursos de leitura e conforto."
        icon={<Palette size={20} color={colors.primary} />}
        onBack={() => openSection('hub')}
      />
      {renderFeedbackBanners()}

      <SettingsSectionCard title="Tema do Aplicativo">
        <View style={styles.themeRow}>
          <TouchableOpacity
            onPress={() => setDarkMode(true)}
            activeOpacity={0.8}
            style={[
              styles.themeOption,
              {
                backgroundColor: isDark ? `${colors.primary}18` : colors.secondary,
                borderColor: isDark ? colors.primary : colors.border,
              },
            ]}
          >
            <Moon size={18} color={isDark ? colors.primary : colors.mutedForeground} />
            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.foreground }}>
              Modo Escuro
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setDarkMode(false)}
            activeOpacity={0.8}
            style={[
              styles.themeOption,
              {
                backgroundColor: !isDark ? `${colors.primary}18` : colors.secondary,
                borderColor: !isDark ? colors.primary : colors.border,
              },
            ]}
          >
            <Sun size={18} color={!isDark ? colors.amber : colors.mutedForeground} />
            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.foreground }}>
              Modo Claro
            </Text>
          </TouchableOpacity>
        </View>
      </SettingsSectionCard>

      <SettingsSectionCard title="Idioma & Tipografia">
        <SettingsChoiceGroup
          label="Idioma da Interface"
          layout="pills"
          value={ext.language}
          onChange={(v) => updateExt('language', v)}
          options={[
            { value: 'pt-BR', label: 'Português (BR)' },
            { value: 'en-US', label: 'English' },
            { value: 'es-ES', label: 'Español' },
          ]}
        />
        <SettingsDivider />
        <SettingsChoiceGroup
          label="Tamanho do Texto"
          layout="pills"
          value={ext.fontScale}
          onChange={(v) => updateExt('fontScale', v)}
          options={[
            { value: 'compact', label: 'Compacto' },
            { value: 'default', label: 'Padrão' },
            { value: 'large', label: 'Grande' },
          ]}
        />
      </SettingsSectionCard>

      <SettingsSectionCard title="Acessibilidade & Conforto">
        <SettingsToggleRow
          title="Reduzir Animações e Movimentos"
          subtitle="Minimiza transições e efeitos visuais de movimento na navegação."
          value={ext.reduceMotion}
          onValueChange={(v) => updateExt('reduceMotion', v)}
          showDivider
        />
        <SettingsToggleRow
          title="Alto Contraste"
          subtitle="Aumenta a legibilidade de textos secundários e bordas."
          value={ext.highContrast}
          onValueChange={(v) => updateExt('highContrast', v)}
          showDivider
        />
        <SettingsToggleRow
          title="Feedback Tátil (Vibração)"
          subtitle="Resposta háptica sutil ao curtir, avaliar álbuns e alternar abas."
          value={ext.hapticFeedback}
          onValueChange={(v) => updateExt('hapticFeedback', v)}
        />
      </SettingsSectionCard>
    </>
  );

  // ==========================
  // 9. DADOS, ARMAZENAMENTO & SOBRE
  // ==========================
  const renderDataAboutSection = () => (
    <>
      <SettingsSubHeader
        title="Dados, Armazenamento & Sobre"
        subtitle="Gerencie cache local, privacidade de dados (LGPD), suporte e informações da versão."
        icon={<Database size={20} color={colors.primary} />}
        onBack={() => openSection('hub')}
      />
      {renderFeedbackBanners()}

      <SettingsSectionCard title="Armazenamento & Seus Dados">
        <SettingsMenuRow
          icon={
            isClearingCache ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Trash2 size={16} color={colors.primary} />
            )
          }
          title="Limpar Cache Temporário"
          subtitle="Remove capas e consultas temporárias sem apagar sua conta."
          onPress={handleClearCache}
        />
        <SettingsMenuRow
          icon={<Download size={16} color={colors.emerald} />}
          iconBg={`${colors.emerald}18`}
          title="Exportar Meus Dados (LGPD)"
          subtitle="Solicitar cópia das suas avaliações, listas e favoritos em JSON."
          showDivider={false}
          onPress={handleExportData}
        />
      </SettingsSectionCard>

      <SettingsSectionCard title="Ajuda, Suporte & Legal">
        <SettingsMenuRow
          icon={<HelpCircle size={16} color={colors.primary} />}
          title="Central de Ajuda & Suporte"
          subtitle="Dúvidas frequentes ou reportar um problema técnico"
          onPress={() =>
            Alert.alert(
              'Central de Ajuda',
              'Precisa de ajuda ou encontrou um bug? Entre em contato com nossa equipe em suporte@musicpostr.app.'
            )
          }
        />
        <SettingsMenuRow
          icon={<FileText size={16} color={colors.mutedForeground} />}
          iconBg={colors.secondary}
          title="Termos de Uso"
          subtitle="Regras de utilização da plataforma Musicpostr"
          onPress={() =>
            Alert.alert(
              'Termos de Uso',
              'Ao utilizar o Musicpostr, você concorda em respeitar direitos autorais, publicar avaliações genuínas e seguir nossas diretrizes comunitárias.'
            )
          }
        />
        <SettingsMenuRow
          icon={<Shield size={16} color={colors.mutedForeground} />}
          iconBg={colors.secondary}
          title="Política de Privacidade"
          subtitle="Como coletamos, protegemos e utilizamos seus dados"
          onPress={() =>
            Alert.alert(
              'Política de Privacidade',
              'Seus dados são protegidos com autenticação segura e controle de visibilidade. Você pode exportar ou excluir sua conta a qualquer momento.'
            )
          }
        />
        <SettingsMenuRow
          icon={<Info size={16} color={colors.mutedForeground} />}
          iconBg={colors.secondary}
          title="Diretrizes da Comunidade"
          subtitle="Boas práticas de convivência e respeito nas reviews"
          showDivider={false}
          onPress={() =>
            Alert.alert(
              'Diretrizes da Comunidade',
              'Valorize críticas construtivas sobre música. Assédio, discurso de ódio, spam e spoilers sem aviso não são permitidos.'
            )
          }
        />
      </SettingsSectionCard>

      <SettingsSectionCard title="Sobre o Musicpostr" icon={<Info size={16} color={colors.primary} />}>
        <View style={styles.infoRow}>
          <Text style={[styles.infoKey, { color: colors.mutedForeground }]}>Versão</Text>
          <Text style={[styles.infoVal, { color: colors.foreground }]}>
            {appVersion} (Mobile)
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoKey, { color: colors.mutedForeground }]}>Plataforma</Text>
          <Text style={[styles.infoVal, { color: colors.foreground }]}>{osLabel}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoKey, { color: colors.mutedForeground }]}>Dispositivo</Text>
          <Text style={[styles.infoVal, { color: colors.foreground }]}>{deviceLabel}</Text>
        </View>
        <Text style={{ fontSize: 11.5, color: colors.mutedForeground, lineHeight: 17, marginTop: 4 }}>
          O Musicpostr é uma rede social interativa para catalogar, avaliar e descobrir álbuns musicais com a comunidade.
        </Text>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Zona de Perigo"
        icon={<AlertTriangle size={16} color={colors.destructive} />}
        subtitle="Ações sensíveis que afetam o acesso à sua conta."
      >
        <SettingsMenuRow
          icon={<EyeOff size={16} color={colors.amber} />}
          iconBg={`${colors.amber}18`}
          title="Desativar Conta Temporariamente"
          subtitle="Oculta seu perfil até o próximo login"
          onPress={() => handleDangerAction('deactivate')}
        />
        <SettingsMenuRow
          icon={<Trash2 size={16} color={colors.destructive} />}
          title="Excluir Conta Permanentemente"
          subtitle="Remove definitivamente seu perfil, reviews e listas"
          destructive
          showDivider={false}
          onPress={() => handleDangerAction('delete')}
        />
      </SettingsSectionCard>
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.container,
          { paddingTop: Math.max(insets.top, 16) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {activeSection === 'hub' && renderHub()}
        {activeSection === 'profile' && renderProfileSection()}
        {activeSection === 'account' && renderAccountSection()}
        {activeSection === 'security' && renderSecuritySection()}
        {activeSection === 'privacy' && renderPrivacySection()}
        {activeSection === 'moderation' && renderModerationSection()}
        {activeSection === 'notifications' && renderNotificationsSection()}
        {activeSection === 'content' && renderContentSection()}
        {activeSection === 'appearance' && renderAppearanceSection()}
        {activeSection === 'data_about' && renderDataAboutSection()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
    paddingBottom: 44,
    gap: 16,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  profileSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  summaryAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  miniPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 4,
  },
  menuCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  linkedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  outlineBtn: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoKey: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  addTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addTagInput: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  addTagBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  saveBtn: {
    height: 46,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footerNote: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
});
