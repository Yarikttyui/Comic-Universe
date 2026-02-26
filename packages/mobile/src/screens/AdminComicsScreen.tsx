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
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { adminApi } from '../services/api';

interface Comic {
  id: string;
  title: string;
  authorName: string;
  status: string;
  hiddenByAdmin: boolean;
  readCount: number;
  rating: number;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  pending_review: 'На проверке',
  published: 'Опубликован',
  rejected: 'Отклонён',
};

export default function AdminComicsScreen() {
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadComics = useCallback(async () => {
    try {
      const res = await adminApi.getComics('all');
      setComics(res.data.data.comics);
    } catch {
      Alert.alert('Ошибка', 'Не удалось загрузить комиксы');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadComics(); }, [loadComics]);

  const toggleHide = async (comic: Comic) => {
    setActionLoading(true);
    try {
      if (comic.hiddenByAdmin) {
        await adminApi.unhideComic(comic.id);
      } else {
        await adminApi.hideComic(comic.id);
      }
      await loadComics();
    } catch {
      Alert.alert('Ошибка', 'Не удалось изменить видимость');
    } finally {
      setActionLoading(false);
    }
  };

  const renderComic = ({ item }: { item: Comic }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.comicTitle}>{item.title}</Text>
          <Text style={styles.author}>от {item.authorName}</Text>
        </View>
        <View style={styles.badges}>
          <View style={[styles.badge, item.status === 'published' && styles.badgePublished]}>
            <Text style={styles.badgeText}>{STATUS_LABELS[item.status] || item.status}</Text>
          </View>
          {item.hiddenByAdmin && (
            <View style={[styles.badge, styles.badgeHidden]}>
              <Text style={styles.badgeText}>Скрыт</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Ionicons name="eye-outline" size={14} color={theme.colors.textSecondary} />
          <Text style={styles.statText}>{item.readCount}</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="star" size={14} color={theme.colors.accentGold} />
          <Text style={styles.statText}>{item.rating?.toFixed(1) || '—'}</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="calendar-outline" size={14} color={theme.colors.textSecondary} />
          <Text style={styles.statText}>{new Date(item.createdAt).toLocaleDateString('ru-RU')}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={item.hiddenByAdmin ? styles.btnOutline : styles.btnDanger}
          onPress={() => toggleHide(item)}
          disabled={actionLoading}
        >
          <Text style={item.hiddenByAdmin ? styles.btnOutlineText : styles.btnDangerText}>
            {item.hiddenByAdmin ? 'Показать' : 'Скрыть'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Комиксы</Text>
        <Text style={styles.count}>{comics.length}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={comics}
          renderItem={renderComic}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Нет комиксов</Text>
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  comicTitle: { fontFamily: theme.fonts.semiBold, fontSize: 16, color: theme.colors.text },
  author: { fontFamily: theme.fonts.regular, fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  badge: {
    backgroundColor: theme.colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgePublished: { backgroundColor: theme.colors.accentMint },
  badgeHidden: { backgroundColor: theme.colors.primary },
  badgeText: { fontFamily: theme.fonts.medium, fontSize: 11, color: theme.colors.text },
  stats: { flexDirection: 'row', gap: 16, marginTop: theme.spacing.sm },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontFamily: theme.fonts.regular, fontSize: 13, color: theme.colors.textSecondary },
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
});
