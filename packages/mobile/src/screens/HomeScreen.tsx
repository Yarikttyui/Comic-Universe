import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
}

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [featuredComics, setFeaturedComics] = useState<Comic[]>([]);
  const [recentComics, setRecentComics] = useState<Comic[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [featuredRes, recentRes] = await Promise.all([
        comicsApi.getFeatured(),
        comicsApi.getAll({ limit: 10 }),
      ]);
      setFeaturedComics(featuredRes.data.data.comics || []);
      setRecentComics(recentRes.data.data.comics || []);
    } catch (error) {
      console.error('Failed to load comics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderComicCard = (comic: Comic, isFeatured = false) => (
    <TouchableOpacity
      key={comic.id}
      style={[styles.comicCard, isFeatured && styles.featuredCard]}
      onPress={() => navigation.navigate('ComicDetail', { comicId: comic.id })}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: comic.coverImage }}
        style={[styles.comicImage, isFeatured && styles.featuredImage]}
        contentFit="contain"
        transition={200}
      />
      <LinearGradient
        colors={['transparent', 'rgba(34,27,20,0.9)']}
        style={styles.gradient}
      />
      <View style={styles.comicInfo}>
        <View style={styles.badges}>
          {comic.genres.slice(0, 2).map((genre) => (
            <View key={genre} style={styles.badge}>
              <Text style={styles.badgeText}>{genre}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.comicTitle} numberOfLines={2}>{comic.title}</Text>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Ionicons name="star" size={14} color={theme.colors.accentGold} />
            <Text style={styles.statText}>{comic.rating?.toFixed(1) || '—'}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="git-branch" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.statText}>{comic.totalEndings} концовок</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Добро пожаловать в</Text>
            <Text style={styles.title}>Comic Universe</Text>
          </View>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => navigation.navigate('Main', { screen: 'Library' } as any)}
          >
            <Ionicons name="search" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Популярное</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {loading ? (
              [...Array(3)].map((_, i) => (
                <View key={i} style={[styles.comicCard, styles.featuredCard, styles.skeleton]} />
              ))
            ) : (
              featuredComics.map((comic) => renderComicCard(comic, true))
            )}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Все комиксы</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Library' } as any)}>
              <Text style={styles.seeAll}>Смотреть все</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.grid}>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <View key={i} style={[styles.comicCard, styles.skeleton]} />
              ))
            ) : (
              recentComics.slice(0, 6).map((comic) => renderComicCard(comic))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  greeting: {
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  title: {
    fontFamily: theme.fonts.display,
    fontSize: 28,
    color: theme.colors.text,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontFamily: theme.fonts.displaySemiBold,
    fontSize: 20,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  seeAll: {
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    color: theme.colors.primary,
  },
  horizontalScroll: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  comicCard: {
    width: (width - theme.spacing.lg * 2 - theme.spacing.md) / 2,
    aspectRatio: 2 / 3,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  featuredCard: {
    width: width * 0.7,
  },
  comicImage: {
    width: '100%',
    height: '100%',
  },
  featuredImage: {
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  comicInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.md,
  },
  badges: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  badge: {
    backgroundColor: 'rgba(214, 69, 42, 0.85)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
  },
  badgeText: {
    fontFamily: theme.fonts.medium,
    fontSize: 10,
    color: theme.colors.text,
  },
  comicTitle: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
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
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  skeleton: {
    backgroundColor: theme.colors.surfaceLight,
  },
});
