import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '../theme';
import { comicsApi } from '../services/api';
import { RootStackParamList } from '../navigation/RootNavigator';

const { width } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Comic {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  genres: string[];
  rating: number;
  totalEndings: number;
  estimatedMinutes: number;
  size: string;
}

export default function LibraryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const loadComics = async () => {
    try {
      const params: any = {};
      if (search) params.search = search;
      if (selectedSize) params.size = selectedSize;
      
      const response = await comicsApi.getAll(params);
      setComics(response.data.data.comics || []);
    } catch (error) {
      console.error('Failed to load comics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComics();
  }, [search, selectedSize]);

  const sizes = [
    { value: null, label: 'Все' },
    { value: 'small', label: 'Короткие' },
    { value: 'medium', label: 'Средние' },
    { value: 'large', label: 'Длинные' },
  ];

  const renderComic = ({ item }: { item: Comic }) => (
    <TouchableOpacity
      style={styles.comicCard}
      onPress={() => navigation.navigate('ComicDetail', { comicId: item.id })}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.coverImage }}
        style={styles.comicImage}
        contentFit="contain"
        transition={200}
      />
      <View style={styles.comicInfo}>
        <Text style={styles.comicTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.comicDescription} numberOfLines={2}>{item.description}</Text>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Ionicons name="star" size={12} color={theme.colors.accentGold} />
            <Text style={styles.statText}>{item.rating?.toFixed(1) || '—'}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="time-outline" size={12} color={theme.colors.textSecondary} />
            <Text style={styles.statText}>{item.estimatedMinutes} мин</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="git-branch" size={12} color={theme.colors.textSecondary} />
            <Text style={styles.statText}>{item.totalEndings}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Библиотека</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInput}>
          <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Поиск комиксов..."
            placeholderTextColor={theme.colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filters}>
        {sizes.map((size) => (
          <TouchableOpacity
            key={size.value || 'all'}
            style={[
              styles.filterButton,
              selectedSize === size.value && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedSize(size.value)}
          >
            <Text
              style={[
                styles.filterText,
                selectedSize === size.value && styles.filterTextActive,
              ]}
            >
              {size.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={comics}
        renderItem={renderComic}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={64} color={theme.colors.textMuted} />
            <Text style={styles.emptyText}>
              {loading ? 'Загрузка...' : 'Комиксы не найдены'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  title: {
    fontFamily: theme.fonts.display,
    fontSize: 28,
    color: theme.colors.text,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    height: 48,
    gap: theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: theme.fonts.regular,
    fontSize: 16,
    color: theme.colors.text,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.border,
  },
  filterText: {
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  filterTextActive: {
    color: theme.colors.text,
  },
  list: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  row: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  comicCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  comicImage: {
    width: '100%',
    aspectRatio: 0.75,
  },
  comicInfo: {
    padding: theme.spacing.md,
  },
  comicTitle: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  comicDescription: {
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  stats: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontFamily: theme.fonts.regular,
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    fontFamily: theme.fonts.medium,
    fontSize: 16,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.md,
  },
});
