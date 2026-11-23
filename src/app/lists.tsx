import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { safeGoBack } from '@/utils/navigation';
import { Plus, X } from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageHeader } from '@/components/PageHeader';
import { notifyCatalogUpdated, type UserListRecord } from '@/services/musicBrainz.service';
import { getUserListsFromSupabase } from '@/services/profile.service';
import { supabase } from '@/services/supabase';

export default function ListsScreen() {
  const { username } = useLocalSearchParams<{ username?: string }>();
  const isVisiting = Boolean(username);
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [lists, setLists] = useState<UserListRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isSavingList, setIsSavingList] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (isVisiting && username) {
        const data = await getUserListsFromSupabase({ username });
        if (active) setLists(data);
      } else if (user) {
        const data = await getUserListsFromSupabase({ userId: user.id });
        if (active) setLists(data);
      } else {
        setLists([]);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [isVisiting, username, user]);

  const handleCreateList = async () => {
    if (!newTitle.trim() || !user || isSavingList) return;
    setIsSavingList(true);
    try {
      const { data, error } = await supabase
        .from('user_lists')
        .insert({
          user_id: user.id,
          title: newTitle.trim(),
          description: newDesc.trim() || 'Nova coleção musical.',
          items_count: 0,
          is_default: false,
          created_label: 'Agora mesmo',
        })
        .select('*')
        .single();

      if (!error && data) {
        setLists((prev) => [
          {
            id: data.id,
            title: data.title,
            count: data.items_count || 0,
            description: data.description || '',
            createdAt: data.created_label || data.created_at,
            isDefault: Boolean(data.is_default),
          },
          ...prev,
        ]);
        notifyCatalogUpdated();
      }
      setNewTitle('');
      setNewDesc('');
      setIsModalOpen(false);
    } finally {
      setIsSavingList(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.container,
          { paddingTop: Math.max(insets.top, 16) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader
          title={isVisiting ? `Listas de @${username}` : 'Listas'}
          subtitle="Coletâneas temáticas de álbuns organizadas."
          onBack={() => safeGoBack('/(tabs)/profile')}
          backLabel="Voltar ao Perfil"
          rightAction={
            !isVisiting ? (
              <TouchableOpacity
                onPress={() => setIsModalOpen(true)}
                style={[
                  styles.newBtn,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Plus size={15} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>
                  Nova Lista
                </Text>
              </TouchableOpacity>
            ) : undefined
          }
        />

        <View style={{ gap: 12 }}>
          {lists.map((list) => (
            <TouchableOpacity
              key={list.id}
              style={[
                styles.listCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => router.push(`/list/${list.id}` as any)}
              activeOpacity={0.85}
            >
              <View style={styles.cardTopRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <Text
                    style={[styles.listTitle, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {list.title}
                  </Text>
                  {(list.id === 'want-to-listen' || list.isDefault) && (
                    <View
                      style={{
                        backgroundColor: `${colors.primary}20`,
                        paddingHorizontal: 6,
                        paddingVertical: 1,
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 9.5,
                          fontWeight: '900',
                          color: colors.primary,
                        }}
                      >
                        Padrão
                      </Text>
                    </View>
                  )}
                </View>
                <View
                  style={[
                    styles.countBadge,
                    {
                      backgroundColor: colors.secondary,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: colors.mutedForeground,
                    }}
                  >
                    {list.count} álbuns
                  </Text>
                </View>
              </View>

              <Text
                style={{
                  fontSize: 12,
                  color: colors.mutedForeground,
                  lineHeight: 18,
                }}
              >
                {list.description}
              </Text>

              <View
                style={[
                  styles.cardFooter,
                  { borderTopColor: colors.border },
                ]}
              >
                <Text
                  style={{ fontSize: 11, color: colors.mutedForeground }}
                >
                  {list.createdAt}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '800',
                    color: colors.primary,
                  }}
                >
                  Ver lista →
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={isModalOpen}
        animationType="fade"
        transparent
        statusBarTranslucent
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '800',
                  color: colors.foreground,
                }}
              >
                Criar Nova Lista
              </Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <X size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Título da lista (ex: Melhores de 2026)"
              placeholderTextColor={colors.mutedForeground}
              value={newTitle}
              onChangeText={setNewTitle}
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
            />

            <TextInput
              multiline
              placeholder="Descrição da coletânea..."
              placeholderTextColor={colors.mutedForeground}
              value={newDesc}
              onChangeText={setNewDesc}
              style={[
                styles.textarea,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
            />

            <TouchableOpacity
              onPress={handleCreateList}
              disabled={!newTitle.trim() || isSavingList}
              style={[
                styles.createBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: !newTitle.trim() || isSavingList ? 0.7 : 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                },
              ]}
            >
              {isSavingList && <ActivityIndicator size="small" color="#fff" />}
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>
                {isSavingList ? 'Salvando...' : 'Salvar Lista'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
    paddingBottom: 36,
    gap: 14,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  pageSubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 12,
  },
  listCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  listTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  textarea: {
    minHeight: 80,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  createBtn: {
    height: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
