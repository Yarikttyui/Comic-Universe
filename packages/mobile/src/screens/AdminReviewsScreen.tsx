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

interface Revision {
  id: string;
  comicId: string;
  status: string;
  createdAt: string;
  comic?: { title: string };
  creator?: { displayName: string; email: string };
}

const STATUS_LABELS: Record<string, string> = {
  pending_review: 'На проверке',
  approved: 'Одобрена',
  rejected: 'Отклонена',
};

export default function AdminReviewsScreen() {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState<Revision | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadRevisions = useCallback(async () => {
    try {
      const res = await adminApi.getRevisions('pending_review');
      setRevisions(res.data.data.revisions);
    } catch {
      Alert.alert('Ошибка', 'Не удалось загрузить ревизии');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRevisions(); }, [loadRevisions]);

  const handleApprove = async (revision: Revision) => {
    setActionLoading(true);
    try {
      await adminApi.approveRevision(revision.id);
      await loadRevisions();
    } catch {
      Alert.alert('Ошибка', 'Не удалось одобрить');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await adminApi.rejectRevision(rejectModal.id, rejectReason.trim());
      setRejectModal(null);
      setRejectReason('');
      await loadRevisions();
    } catch {
      Alert.alert('Ошибка', 'Не удалось отклонить');
    } finally {
      setActionLoading(false);
    }
  };

  const renderRevision = ({ item }: { item: Revision }) => (
    <View style={styles.card}>
      <Text style={styles.comicTitle}>{item.comic?.title || 'Комикс'}</Text>
      <Text style={styles.creator}>
        от {item.creator?.displayName || item.creator?.email || '—'}
      </Text>
      <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString('ru-RU')}</Text>

      <View style={[styles.badge, item.status === 'pending_review' && styles.badgePending]}>
        <Text style={styles.badgeText}>{STATUS_LABELS[item.status] || item.status}</Text>
      </View>

      {item.status === 'pending_review' && (
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
        <Text style={styles.title}>Ревью</Text>
        <Text style={styles.count}>{revisions.length}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={revisions}
          renderItem={renderRevision}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Нет ревизий на проверке</Text>
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
  comicTitle: { fontFamily: theme.fonts.semiBold, fontSize: 16, color: theme.colors.text },
  creator: { fontFamily: theme.fonts.regular, fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  date: { fontFamily: theme.fonts.regular, fontSize: 12, color: theme.colors.textMuted, marginTop: 4 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: theme.colors.border,
    marginTop: 6,
  },
  badgePending: { backgroundColor: theme.colors.accentGold },
  badgeText: { fontFamily: theme.fonts.medium, fontSize: 11, color: theme.colors.text },
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
