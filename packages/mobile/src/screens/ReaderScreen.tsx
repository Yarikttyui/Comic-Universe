import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
} from 'react-native-reanimated';

import { theme } from '../theme';
import { comicsApi, progressApi } from '../services/api';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAuthStore } from '../store/authStore';

const { width, height } = Dimensions.get('window');

type RouteProps = RouteProp<RootStackParamList, 'Reader'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Panel {
  imageUrl?: string;
  description?: string;
  type: string;
}

interface Choice {
  choiceId: string;
  text: string;
  targetPageId: string;
}

interface ComicPage {
  pageId: string;
  pageNumber: number;
  title?: string;
  panels: Panel[];
  choices: Choice[];
  isEnding: boolean;
  endingType?: string;
  endingTitle?: string;
}

interface Comic {
  id: string;
  title: string;
  coverImage: string;
  startPageId: string;
  totalEndings: number;
}

export default function ReaderScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { comicId } = route.params;
  const { isAuthenticated } = useAuthStore();

  const [comic, setComic] = useState<Comic | null>(null);
  const [pages, setPages] = useState<ComicPage[]>([]);
  const [currentPage, setCurrentPage] = useState<ComicPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pathHistory, setPathHistory] = useState<string[]>([]);

  useEffect(() => {
    const loadComic = async () => {
      try {
        const response = await comicsApi.getPages(comicId);
        const { comic: comicData, pages: pagesData } = response.data.data;
        setComic(comicData);
        setPages(pagesData);
        
        if (!pagesData || pagesData.length === 0) {
          setError('Нет страниц для отображения');
          return;
        }

        const startPage = pagesData.find((p: ComicPage) => p.pageId === comicData.startPageId);
        setCurrentPage(startPage || pagesData[0]);
        setPathHistory([startPage?.pageId || pagesData[0]?.pageId]);
      } catch (err: any) {
        console.error('Failed to load comic:', err);
        setError(err?.response?.data?.error?.message || 'Не удалось загрузить комикс');
      } finally {
        setLoading(false);
      }
    };

    loadComic();
  }, [comicId]);

  const handleChoice = useCallback((choice: Choice) => {
    const targetPage = pages.find(p => p.pageId === choice.targetPageId);
    if (targetPage) {
      setCurrentPage(targetPage);
      setPathHistory(prev => [...prev, targetPage.pageId]);

      if (isAuthenticated && comic) {
        progressApi.recordChoice(comic.id, {
          pageId: currentPage?.pageId || '',
          choiceId: choice.choiceId,
          targetPageId: choice.targetPageId,
        }).catch(console.error);
      }
    }
  }, [pages, isAuthenticated, comic, currentPage]);

  const handleBack = useCallback(() => {
    if (pathHistory.length > 1) {
      const newHistory = [...pathHistory];
      newHistory.pop();
      const previousPageId = newHistory[newHistory.length - 1];
      setPathHistory(newHistory);
      
      const previousPage = pages.find(p => p.pageId === previousPageId);
      if (previousPage) {
        setCurrentPage(previousPage);
      }
    }
  }, [pathHistory, pages]);

  const handleRestart = useCallback(() => {
    if (comic) {
      const startPage = pages.find(p => p.pageId === comic.startPageId);
      if (startPage) {
        setCurrentPage(startPage);
        setPathHistory([startPage.pageId]);
      }
    }
  }, [comic, pages]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  if (error || !currentPage) {
    return (
      <View style={styles.loading}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.colors.textSecondary} />
        <Text style={[styles.loadingText, { marginTop: 12 }]}>{error || 'Нет страниц для отображения'}</Text>
        <TouchableOpacity
          style={{ marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 2, borderColor: theme.colors.border }}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.loadingText}>Назад</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.pageIndicator}>
            Шаг {pathHistory.length}
          </Text>
        </View>

        <View style={styles.headerRight}>
          {pathHistory.length > 1 && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleBack}
            >
              <Ionicons name="arrow-undo" size={22} color={theme.colors.text} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleRestart}
          >
            <Ionicons name="refresh" size={22} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          key={currentPage.pageId}
          entering={FadeIn.duration(300)}
        >
          {currentPage.title && (
            <Text style={styles.pageTitle}>{currentPage.title}</Text>
          )}

          {currentPage.panels.map((panel, index) => (
            <Animated.View
              key={index}
              entering={SlideInRight.delay(index * 100).duration(300)}
              style={styles.panel}
            >
              {panel.imageUrl ? (
                <Image
                  source={{ uri: panel.imageUrl }}
                  style={styles.panelImage}
                  contentFit="contain"
                  transition={200}
                />
              ) : (
                <View style={styles.panelText}>
                  <Text style={styles.panelDescription}>{panel.description}</Text>
                </View>
              )}
            </Animated.View>
          ))}

          {currentPage.isEnding ? (
            <Animated.View
              entering={FadeIn.delay(300).duration(500)}
              style={styles.endingContainer}
            >
              <LinearGradient
                colors={
                  currentPage.endingType === 'good'
                    ? [theme.colors.accentMint, '#58c6b8']
                    : currentPage.endingType === 'bad'
                    ? [theme.colors.primary, '#b83823']
                    : currentPage.endingType === 'secret'
                    ? [theme.colors.accentViolet, theme.colors.accentBlue]
                    : [theme.colors.surface, theme.colors.surfaceLight]
                }
                style={styles.endingBadge}
              >
                <Ionicons
                  name={
                    currentPage.endingType === 'good'
                      ? 'trophy'
                      : currentPage.endingType === 'bad'
                      ? 'skull'
                      : currentPage.endingType === 'secret'
                      ? 'sparkles'
                      : 'flag'
                  }
                  size={48}
                  color={theme.colors.text}
                />
              </LinearGradient>
              
              <Text style={styles.endingTitle}>
                {currentPage.endingTitle || 'Конец'}
              </Text>
              
              <Text style={styles.endingText}>
                {currentPage.endingType === 'good' && 'Поздравляем! Хорошая концовка!'}
                {currentPage.endingType === 'bad' && 'Плохая концовка... Попробуйте снова!'}
                {currentPage.endingType === 'secret' && 'Секретная концовка найдена!'}
                {currentPage.endingType === 'neutral' && 'История завершена'}
              </Text>

              <View style={styles.endingActions}>
                <TouchableOpacity
                  style={styles.endingButton}
                  onPress={handleRestart}
                >
                  <LinearGradient
                    colors={[theme.colors.primary, theme.colors.accentGold]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.endingButtonGradient}
                  >
                    <Ionicons name="refresh" size={20} color={theme.colors.text} />
                    <Text style={styles.endingButtonText}>Начать заново</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.endingButtonSecondary}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.endingButtonSecondaryText}>Выйти</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          ) : (
            <Animated.View
              entering={FadeIn.delay(200).duration(300)}
              style={styles.choicesContainer}
            >
              <Text style={styles.choicesTitle}>Что вы выберете?</Text>
              {currentPage.choices.map((choice, index) => (
                <TouchableOpacity
                  key={choice.choiceId}
                  style={styles.choiceButton}
                  onPress={() => handleChoice(choice)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.choiceText}>{choice.text}</Text>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    backgroundColor: 'rgba(246,239,226,0.94)',
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  pageIndicator: {
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  pageTitle: {
    fontFamily: theme.fonts.display,
    fontSize: 24,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  panel: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  panelImage: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: theme.borderRadius.lg,
  },
  panelText: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
  },
  panelDescription: {
    fontFamily: theme.fonts.regular,
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 24,
  },
  choicesContainer: {
    marginTop: theme.spacing.xl,
  },
  choicesTitle: {
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  choiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  choiceText: {
    flex: 1,
    fontFamily: theme.fonts.medium,
    fontSize: 16,
    color: theme.colors.text,
    marginRight: theme.spacing.md,
  },
  endingContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  endingBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  endingTitle: {
    fontFamily: theme.fonts.display,
    fontSize: 28,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  endingText: {
    fontFamily: theme.fonts.regular,
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  endingActions: {
    width: '100%',
    gap: theme.spacing.md,
  },
  endingButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  endingButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  endingButtonText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 16,
    color: theme.colors.text,
  },
  endingButtonSecondary: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  endingButtonSecondaryText: {
    fontFamily: theme.fonts.medium,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
});
