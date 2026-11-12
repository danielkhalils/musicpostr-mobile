import React, { useState, useEffect } from 'react';
import {
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
import { ListMusic, ArrowLeft, Plus, X } from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { MobileHeader } from '@/components/MobileHeader';
import {
  type UserListRecord,
  getUserLists,
  addUserList,
  subscribeAlbumsUpdated,
} from '@/services/musicBrainz.service';

export default function ListsScreen() {
  const { username } = useLocalSearchParams<{ username?: string }>();
  const isVisiting = Boolean(username);
  const { colors } = useAppTheme();

  const [lists, setLists] = useState<UserListRecord[]>(() => getUserLists());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeAlbumsUpdated(() => {
      setLists(getUserLists());
    });
    return unsubscribe;
  }, []);

  const handleCreateList = () => {
    if (!newTitle.trim()) return;
    const updated = addUserList(newTitle, newDesc);
    setLists(updated);
    setNewTitle('');
    setNewDesc('');
    setIsModalOpen(false);
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

        <View style={styles.headerRow}>
          <View style={{ flex: 1, gap: 4 }}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <ListMusic size={24} color={colors.emerald} />
              <Text style={[styles.pageTitle, { color: colors.foreground }]}>
                {isVisiting ? `Listas de @${username}` : 'Minhas Listas'}
              </Text>
            </View>
            <Text
              style={[styles.pageSubtitle, { color: colors.mutedForeground }]}
            >
              Coletâneas temáticas de álbuns organizadas.
            </Text>
          </View>

          {!isVisiting && (
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
          )}
        </View>

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
              style={[
                styles.createBtn,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>
                Salvar Lista
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
