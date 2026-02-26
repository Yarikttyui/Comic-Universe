import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { theme } from '../theme';

import HomeScreen from '../screens/HomeScreen';
import LibraryScreen from '../screens/LibraryScreen';
import ComicDetailScreen from '../screens/ComicDetailScreen';
import ReaderScreen from '../screens/ReaderScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import AdminPanelScreen from '../screens/AdminPanelScreen';
import AdminUsersScreen from '../screens/AdminUsersScreen';
import AdminComicsScreen from '../screens/AdminComicsScreen';
import AdminRequestsScreen from '../screens/AdminRequestsScreen';
import AdminReviewsScreen from '../screens/AdminReviewsScreen';
import AdminReportsScreen from '../screens/AdminReportsScreen';

export type RootStackParamList = {
  Main: undefined;
  Auth: undefined;
  ComicDetail: { comicId: string };
  Reader: { comicId: string };
  AdminUsers: undefined;
  AdminComics: undefined;
  AdminRequests: undefined;
  AdminReviews: undefined;
  AdminReports: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Library: undefined;
  Admin: undefined;
  Profile: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabs() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: theme.fonts.medium,
          fontSize: 12,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Library') {
            iconName = focused ? 'library' : 'library-outline';
          } else if (route.name === 'Admin') {
            iconName = focused ? 'shield-checkmark' : 'shield-checkmark-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'ellipse';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ tabBarLabel: 'Главная' }}
      />
      <Tab.Screen 
        name="Library" 
        component={LibraryScreen}
        options={{ tabBarLabel: 'Библиотека' }}
      />
      {isAdmin ? (
        <Tab.Screen 
          name="Admin" 
          component={AdminPanelScreen}
          options={{ tabBarLabel: 'Админ' }}
        />
      ) : null}
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Профиль' }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="Auth" component={AuthNavigator} />
      <Stack.Screen 
        name="ComicDetail" 
        component={ComicDetailScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen 
        name="Reader" 
        component={ReaderScreen}
        options={{
          presentation: 'fullScreenModal',
          animation: 'fade',
        }}
      />
      <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
      <Stack.Screen name="AdminComics" component={AdminComicsScreen} />
      <Stack.Screen name="AdminRequests" component={AdminRequestsScreen} />
      <Stack.Screen name="AdminReviews" component={AdminReviewsScreen} />
      <Stack.Screen name="AdminReports" component={AdminReportsScreen} />
    </Stack.Navigator>
  );
}
