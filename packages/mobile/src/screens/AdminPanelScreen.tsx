import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';
import { RootStackParamList } from '../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface AdminMenuItem {
  screen: keyof RootStackParamList;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
}

const MENU_ITEMS: AdminMenuItem[] = [
  {
    screen: 'AdminRequests',
    icon: 'people-outline',
    title: 'Заявки',
    description: 'Заявки на роль создателя',
    color: theme.colors.accentGold,
  },
  {
    screen: 'AdminReviews',
    icon: 'shield-outline',
    title: 'Ревью',
    description: 'Проверка ревизий комиксов',
    color: theme.colors.accentBlue,
  },
  {
    screen: 'AdminReports',
    icon: 'flag-outline',
    title: 'Жалобы',
    description: 'Жалобы на комментарии',
    color: theme.colors.primary,
  },
  {
    screen: 'AdminComics',
    icon: 'book-outline',
    title: 'Комиксы',
    description: 'Управление комиксами',
    color: theme.colors.accentMint,
  },
  {
    screen: 'AdminUsers',
    icon: 'people',
    title: 'Пользователи',
    description: 'Управление пользователями',
    color: theme.colors.accentViolet,
  },
];

export default function AdminPanelScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Админ-панель</Text>
          <Text style={styles.subtitle}>Управление платформой</Text>
        </View>

        <View style={styles.grid}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.screen}
              style={styles.card}
              onPress={() => navigation.navigate(item.screen as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconCircle, { backgroundColor: item.color + '22' }]}>
                <Ionicons name={item.icon} size={28} color={item.color} />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc}>{item.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
  subtitle: { fontFamily: theme.fonts.regular, fontSize: 14, color: theme.colors.textSecondary, marginTop: 4 },
  grid: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  cardTitle: { fontFamily: theme.fonts.semiBold, fontSize: 18, color: theme.colors.text },
  cardDesc: { fontFamily: theme.fonts.regular, fontSize: 13, color: theme.colors.textSecondary, marginTop: 4 },
});
