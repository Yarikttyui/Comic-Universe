import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '../theme';
import { comicsApi } from '../services/api';
import { RootStackParamList } from '../navigation/RootNavigator';

const { width, height } = Dimensions.get('window');

type RouteProps = RouteProp<RootStackParamList, 'ComicDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Comic {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  genres: string[];
  rating: number;
  ratingCount: number;
  totalEndings: number;
  totalPages: number;
  estimatedMinutes: number;
  authorName: string;
  size: string;
}

export default function ComicDetailScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { comicId } = route.params;
  
  const [comic, setComic] = useState<Comic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadComic = async () => {
      try {
        const response = await comicsApi.getById(comicId);
        setComic(response.data.data.comic);
      } catch (error) {
        console.error('Failed to load comic:', error);
      } finally {
        setLoading(false);
      }
    };

    loadComic();
  }, [comicId]);

  if (loading || !comic) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  const getSizeLabel = (size: string) => {
    switch (size) {
      case 'small': return 'Короткий';
      case 'medium': return 'Средний';
      case 'large': return 'Длинный';
      default: return size;
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: comic.coverImage }}
        style={styles.backgroundImage}
        contentFit="cover"
        blurRadius={20}
      />
      <LinearGradient
        colors={['transparent', theme.colors.background, theme.colors.background]}
        style={styles.backgroundGradient}
      />

      <SafeAreaView style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </SafeAreaView>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.coverContainer}>
        <Image
          source={{ uri: comic.coverImage }}
          style={styles.cover}
          contentFit="contain"
          transition={200}
        />
        </View>

        <View style={styles.info}>
          <View style={styles.genres}>
            {comic.genres.map((genre) => (
              <View key={genre} style={styles.genre}>
                <Text style={styles.genreText}>{genre}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.title}>{comic.title}</Text>
          <Text style={styles.author}>от {comic.authorName}</Text>

          <View style={styles.stats}>
            <View style={styles.stat}>
              <Ionicons name="star" size={20} color={theme.colors.accentGold} />
              <Text style={styles.statValue}>{comic.rating?.toFixed(1) || '—'}</Text>
              <Text style={styles.statLabel}>({comic.ratingCount || 0})</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Ionicons name="time-outline" size={20} color={theme.colors.textSecondary} />
              <Text style={styles.statValue}>{comic.estimatedMinutes}</Text>
              <Text style={styles.statLabel}>мин</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Ionicons name="git-branch" size={20} color={theme.colors.textSecondary} />
              <Text style={styles.statValue}>{comic.totalEndings}</Text>
              <Text style={styles.statLabel}>концовок</Text>
            </View>
          </View>

          <Text style={styles.description}>{comic.description}</Text>

          <View style={styles.details}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Страниц</Text>
              <Text style={styles.detailValue}>{comic.totalPages}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Размер</Text>
              <Text style={styles.detailValue}>{getSizeLabel(comic.size)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.actions}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => navigation.navigate('Reader', { comicId: comic.id })}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.accentGold]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.startButtonGradient}
          >
            <Ionicons name="play" size={24} color={theme.colors.text} />
            <Text style={styles.startButtonText}>Начать читать</Text>
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    fontFamily: theme.fonts.medium,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.5,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.5,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(34,27,20,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginTop: height * 0.15,
  },
  coverContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  cover: {
    width: width * 0.5,
    aspectRatio: 2 / 3,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.large,
  },
  info: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 100,
  },
  genres: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    justifyContent: 'center',
  },
  genre: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  genreText: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: theme.colors.text,
  },
  title: {
    fontFamily: theme.fonts.display,
    fontSize: 28,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  author: {
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  statValue: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: theme.colors.text,
  },
  statLabel: {
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: theme.colors.border,
  },
  description: {
    fontFamily: theme.fonts.regular,
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
  },
  details: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
  },
  detailLabel: {
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  detailValue: {
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    color: theme.colors.text,
  },
  actions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderTopWidth: 2,
    borderTopColor: theme.colors.border,
  },
  startButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  startButtonText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 18,
    color: theme.colors.text,
  },
});
