import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { adminApi } from '../services/api';

interface CommentReport {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  reporter?: { displayName: string; email: string };
  comment?: {
    id: string;
    text: string;
    hidden: boolean;
    user?: { displayName: string };
    comic?: { title: string };
  };
}

export default function AdminReportsScreen() {
  const [reports, setReports] = useState<CommentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadReports = useCallback(async () => {
    try {
      const res = await adminApi.getCommentReports('open');
      setReports(res.data.data.reports);
    } catch {
      Alert.alert('Ошибка', 'Не удалось загрузить жалобы');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadReports(); }, [loadReports]);

  const handleHide = async (commentId: string) => {
    setActionLoading(true);
    try {
      await adminApi.hideComment(commentId);
      await loadReports();
    } catch {
      Alert.alert('Ошибка', 'Не удалось скрыть комментарий');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = (commentId: string) => {
    Alert.alert(
      'Удалить комментарий',
      'Комментарий будет удалён навсегда.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await adminApi.deleteComment(commentId);
              await loadReports();
            } catch {
              Alert.alert('Ошибка', 'Не удалось удалить комментарий');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderReport = ({ item }: { item: CommentReport }) => (
    <View style={styles.card}>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Жалоба от</Text>
        <Text style={styles.sectionValue}>
          {item.reporter?.displayName || item.reporter?.email || '—'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Причина</Text>
        <Text style={styles.sectionValue}>{item.reason}</Text>
      </View>

      {item.comment && (
        <View style={styles.commentBox}>
          <Text style={styles.commentAuthor}>
            {item.comment.user?.displayName || '—'} написал:
          </Text>
          <Text style={styles.commentText}>{item.comment.text}</Text>
          {item.comment.hidden && (
            <Text style={styles.hiddenLabel}>Скрыт</Text>
          )}
        </View>
      )}

      <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString('ru-RU')}</Text>

      {item.comment && !item.comment.hidden && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.btnDanger}
            onPress={() => handleHide(item.comment!.id)}
            disabled={actionLoading}
          >
            <Text style={styles.btnText}>Скрыть</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnDanger}
            onPress={() => handleDelete(item.comment!.id)}
            disabled={actionLoading}
          >
            <Text style={styles.btnText}>Удалить</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Жалобы</Text>
        <Text style={styles.count}>{reports.length}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={reports}
          renderItem={renderReport}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Нет открытых жалоб</Text>
          }
        />
      )}
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
  section: { marginBottom: 6 },
  sectionLabel: { fontFamily: theme.fonts.medium, fontSize: 12, color: theme.colors.textSecondary },
  sectionValue: { fontFamily: theme.fonts.regular, fontSize: 14, color: theme.colors.text },
  commentBox: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 4,
  },
  commentAuthor: { fontFamily: theme.fonts.medium, fontSize: 12, color: theme.colors.textSecondary },
  commentText: { fontFamily: theme.fonts.regular, fontSize: 14, color: theme.colors.text, marginTop: 2 },
  hiddenLabel: { fontFamily: theme.fonts.medium, fontSize: 11, color: theme.colors.primary, marginTop: 4 },
  date: { fontFamily: theme.fonts.regular, fontSize: 12, color: theme.colors.textMuted, marginTop: 6 },
  actions: { flexDirection: 'row', gap: 8, marginTop: theme.spacing.sm },
  btnDanger: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  btnText: { fontFamily: theme.fonts.medium, fontSize: 13, color: '#fff' },
  emptyText: {
    fontFamily: theme.fonts.regular,
    fontSize: 16,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },
});
