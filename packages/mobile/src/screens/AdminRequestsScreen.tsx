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
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { adminApi } from '../services/api';

interface CreatorRequest {
  id: string;
  desiredNick: string;
  motivation: string | null;
  status: string;
  adminComment: string | null;
  createdAt: string;
  user?: {
    id: string;
    displayName: string;
    email: string;
    role: string;
  };
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'На рассмотрении',
  approved: 'Одобрена',
  rejected: 'Отклонена',
  cancelled: 'Отменена',
};

export default function AdminRequestsScreen() {
  const [requests, setRequests] = useState<CreatorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('pending');
  const [rejectModal, setRejectModal] = useState<CreatorRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCreatorRequests(filter);
      setRequests(res.data.data.requests);
    } catch {
      Alert.alert('Ошибка', 'Не удалось загрузить заявки');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const handleApprove = (request: CreatorRequest) => {
    Alert.alert(
      'Одобрить заявку',
      `Одобрить заявку от ${request.user?.displayName || '?'} на ник @${request.desiredNick}?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Одобрить',
          onPress: async () => {
            setActionLoading(true);
            try {
              await adminApi.approveCreatorRequest(request.id);
              await loadRequests();
            } catch {
              Alert.alert('Ошибка', 'Не удалось одобрить');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await adminApi.rejectCreatorRequest(rejectModal.id, rejectReason.trim());
      setRejectModal(null);
      setRejectReason('');
      await loadRequests();
    } catch {
      Alert.alert('Ошибка', 'Не удалось отклонить');
    } finally {
      setActionLoading(false);
    }
  };

  const filters = ['pending', 'approved', 'rejected', 'all'];
  const filterLabels: Record<string, string> = {
    pending: 'Ожидают',
    approved: 'Одобрены',
    rejected: 'Отклонены',
    all: 'Все',
  };

  const renderRequest = ({ item }: { item: CreatorRequest }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{item.user?.displayName || '—'}</Text>
          <Text style={styles.email}>{item.user?.email || '—'}</Text>
        </View>
        <View style={[styles.badge, item.status === 'pending' && styles.badgePending, item.status === 'approved' && styles.badgeApproved]}>
          <Text style={styles.badgeText}>{STATUS_LABELS[item.status] || item.status}</Text>
        </View>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Ник:</Text>
        <Text style={styles.detailValue}>@{item.desiredNick}</Text>
      </View>

      {item.motivation && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Мотивация:</Text>
          <Text style={styles.detailValue}>{item.motivation}</Text>
        </View>
      )}

      {item.adminComment && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Комментарий:</Text>
          <Text style={styles.detailValue}>{item.adminComment}</Text>
        </View>
      )}

      <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString('ru-RU')}</Text>

      {item.status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.btnSuccess}
            onPress={() => handleApprove(item)}
            disabled={actionLoading}
          >
            <Text style={styles.btnText}>Одобрить</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnDanger}
            onPress={() => { setRejectModal(item); setRejectReason(''); }}
            disabled={actionLoading}
          >
            <Text style={styles.btnText}>Отклонить</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Заявки</Text>
      </View>

      <View style={styles.filters}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {filterLabels[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={requests}
          renderItem={renderRequest}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Нет заявок</Text>
          }
        />
      )}

      <Modal visible={!!rejectModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Причина отклонения</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Укажите причину..."
              placeholderTextColor={theme.colors.textMuted}
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.btnDanger, { flex: 1 }]}
                onPress={handleReject}
                disabled={!rejectReason.trim() || actionLoading}
              >
                <Text style={styles.btnText}>Отклонить</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnOutline, { flex: 1 }]}
                onPress={() => setRejectModal(null)}
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  title: { fontFamily: theme.fonts.display, fontSize: 28, color: theme.colors.text },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  filterBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterText: { fontFamily: theme.fonts.medium, fontSize: 13, color: theme.colors.text },
  filterTextActive: { color: '#fff' },
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
  email: { fontFamily: theme.fonts.regular, fontSize: 13, color: theme.colors.textMuted },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: theme.colors.border,
  },
  badgePending: { backgroundColor: theme.colors.accentGold },
  badgeApproved: { backgroundColor: theme.colors.accentMint },
  badgeText: { fontFamily: theme.fonts.medium, fontSize: 11, color: theme.colors.text },
  detailRow: { flexDirection: 'row', marginTop: 6 },
  detailLabel: { fontFamily: theme.fonts.medium, fontSize: 13, color: theme.colors.textSecondary, marginRight: 6 },
  detailValue: { fontFamily: theme.fonts.regular, fontSize: 13, color: theme.colors.text, flex: 1 },
  date: { fontFamily: theme.fonts.regular, fontSize: 12, color: theme.colors.textMuted, marginTop: 6 },
  actions: { flexDirection: 'row', gap: 8, marginTop: theme.spacing.sm },
  btnSuccess: {
    backgroundColor: theme.colors.accentMint,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  btnDanger: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  btnText: { fontFamily: theme.fonts.medium, fontSize: 13, color: '#fff' },
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
