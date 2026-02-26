import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { adminApi } from '../services/api';

interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  creatorNick: string | null;
  role: string;
  accountStatus: string;
  bannedUntil: string | null;
  banReason: string | null;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  reader: 'Читатель',
  creator: 'Создатель',
  admin: 'Администратор',
};

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [banModal, setBanModal] = useState<AdminUser | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banDays, setBanDays] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const res = await adminApi.getUsers();
      setUsers(res.data.data.users);
    } catch {
      Alert.alert('Ошибка', 'Не удалось загрузить пользователей');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleBan = async () => {
    if (!banModal || !banReason.trim()) return;
    setActionLoading(true);
    try {
      const days = banDays ? parseInt(banDays, 10) : undefined;
      await adminApi.banUser(banModal.id, banReason.trim(), days);
      setBanModal(null);
      setBanReason('');
      setBanDays('');
      await loadUsers();
    } catch {
      Alert.alert('Ошибка', 'Не удалось заблокировать');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnban = async (userId: string) => {
    setActionLoading(true);
    try {
      await adminApi.unbanUser(userId);
      await loadUsers();
    } catch {
      Alert.alert('Ошибка', 'Не удалось разблокировать');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = (user: AdminUser) => {
    Alert.alert(
      'Удаление пользователя',
      `Удалить ${user.displayName} (${user.email})? Это действие необратимо.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await adminApi.deleteUser(user.id);
              await loadUsers();
            } catch {
              Alert.alert('Ошибка', 'Не удалось удалить пользователя');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderUser = ({ item }: { item: AdminUser }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{item.displayName}</Text>
          {item.creatorNick && (
            <Text style={styles.nick}>@{item.creatorNick}</Text>
          )}
          <Text style={styles.email}>{item.email}</Text>
        </View>
        <View style={styles.badges}>
          <View style={[styles.badge, item.role === 'admin' && styles.badgeAdmin]}>
            <Text style={styles.badgeText}>{ROLE_LABELS[item.role] || item.role}</Text>
          </View>
          {item.accountStatus === 'banned' && (
            <View style={[styles.badge, styles.badgeBanned]}>
              <Text style={styles.badgeText}>Бан</Text>
            </View>
          )}
        </View>
      </View>

      {item.accountStatus === 'banned' && (
        <View style={styles.banInfo}>
          <Text style={styles.banText}>Причина: {item.banReason || '—'}</Text>
          <Text style={styles.banText}>
            До: {item.bannedUntil ? new Date(item.bannedUntil).toLocaleDateString('ru-RU') : 'Бессрочно'}
          </Text>
        </View>
      )}

      {item.role !== 'admin' && (
        <View style={styles.actions}>
          {item.accountStatus === 'banned' ? (
            <TouchableOpacity
              style={styles.btnOutline}
              onPress={() => handleUnban(item.id)}
              disabled={actionLoading}
            >
              <Text style={styles.btnOutlineText}>Разблокировать</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.btnDanger}
              onPress={() => { setBanModal(item); setBanReason(''); setBanDays(''); }}
              disabled={actionLoading}
            >
              <Text style={styles.btnDangerText}>Заблокировать</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.btnDanger}
            onPress={() => handleDelete(item)}
            disabled={actionLoading}
          >
            <Text style={styles.btnDangerText}>Удалить</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Пользователи</Text>
        <Text style={styles.count}>{users.length}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Нет пользователей</Text>
          }
        />
      )}

      <Modal visible={!!banModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Блокировка: {banModal?.displayName}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Причина блокировки"
              placeholderTextColor={theme.colors.textMuted}
              value={banReason}
              onChangeText={setBanReason}
              multiline
              numberOfLines={3}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Срок (дней, пусто = бессрочно)"
              placeholderTextColor={theme.colors.textMuted}
              value={banDays}
              onChangeText={setBanDays}
              keyboardType="numeric"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.btnDanger, { flex: 1 }]}
                onPress={handleBan}
                disabled={!banReason.trim() || actionLoading}
              >
                <Text style={styles.btnDangerText}>Заблокировать</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnOutline, { flex: 1 }]}
                onPress={() => setBanModal(null)}
              >
                <Text style={styles.btnOutlineText}>Отмена</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  title: { fontFamily: theme.fonts.display, fontSize: 28, color: theme.colors.text },
  count: { fontFamily: theme.fonts.medium, fontSize: 16, color: theme.colors.textSecondary },
  list: { padding: theme.spacing.lg, gap: theme.spacing.md },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  userName: { fontFamily: theme.fonts.semiBold, fontSize: 16, color: theme.colors.text },
  nick: { fontFamily: theme.fonts.regular, fontSize: 13, color: theme.colors.textSecondary },
  email: { fontFamily: theme.fonts.regular, fontSize: 13, color: theme.colors.textMuted, marginTop: 2 },
  badges: { flexDirection: 'row', gap: 6 },
  badge: {
    backgroundColor: theme.colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeAdmin: { backgroundColor: theme.colors.accentBlue },
  badgeBanned: { backgroundColor: theme.colors.primary },
  badgeText: { fontFamily: theme.fonts.medium, fontSize: 11, color: theme.colors.text },
  banInfo: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: 'rgba(214,69,42,0.1)',
    borderRadius: 8,
  },
  banText: { fontFamily: theme.fonts.regular, fontSize: 13, color: theme.colors.text },
  actions: { flexDirection: 'row', gap: 8, marginTop: theme.spacing.sm },
  btnDanger: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  btnDangerText: { fontFamily: theme.fonts.medium, fontSize: 13, color: '#fff' },
  btnOutline: {
    borderWidth: 2,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  btnOutlineText: { fontFamily: theme.fonts.medium, fontSize: 13, color: theme.colors.text },
  emptyText: {
    fontFamily: theme.fonts.regular,
    fontSize: 16,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    width: '100%',
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  modalTitle: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  modalInput: {
    backgroundColor: theme.colors.background,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontFamily: theme.fonts.regular,
    fontSize: 15,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  modalActions: { flexDirection: 'row', gap: 10 },
});
