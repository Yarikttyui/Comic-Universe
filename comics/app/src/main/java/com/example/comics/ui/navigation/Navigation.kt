package com.example.comics.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.example.comics.ui.screens.*
import com.example.comics.ui.theme.CuTheme
import com.example.comics.ui.viewmodels.*

sealed class Route(val path: String) {
    data object Home : Route("home")
    data object Library : Route("library")
    data object Login : Route("login")
    data object Register : Route("register")
    data object Onboarding : Route("onboarding")
    data object Profile : Route("profile")
    data object CreatorStudio : Route("creator_studio")
    data object Admin : Route("admin")
    data object Notifications : Route("notifications")
    data object ForgotPassword : Route("forgot_password")
    data object ComicDetail : Route("comic/{comicId}") {
        fun build(id: String) = "comic/$id"
    }
    data object ComicReader : Route("reader/{comicId}") {
        fun build(id: String) = "reader/$id"
    }
    data object CreatorProfile : Route("creator/{creatorNick}") {
        fun build(nick: String) = "creator/$nick"
    }
}

data class BottomNavItem(
    val label: String,
    val icon: ImageVector,
    val route: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppNavigation(authVm: AuthViewModel) {
    val navController = rememberNavController()
    val user by authVm.user.collectAsState()
    val isDark by authVm.isDark.collectAsState()
    val isLoggedIn = user != null
    val role = user?.role ?: "reader"

    val notificationVm: NotificationViewModel = viewModel()

    LaunchedEffect(isLoggedIn) {
        if (isLoggedIn) notificationVm.loadUnreadCount()
    }

    val unreadCount by notificationVm.unreadCount.collectAsState()

    val bottomItems = buildList {
        add(BottomNavItem("Главная", Icons.Default.Home, Route.Home.path))
        add(BottomNavItem("Библиотека", Icons.Default.MenuBook, Route.Library.path))
        if (isLoggedIn) {
            if (role == "creator" || role == "admin") {
                add(BottomNavItem("Студия", Icons.Default.Brush, Route.CreatorStudio.path))
            }
            if (role == "admin") {
                add(BottomNavItem("Админ", Icons.Default.AdminPanelSettings, Route.Admin.path))
            }
            add(BottomNavItem("Профиль", Icons.Default.Person, Route.Profile.path))
        }
    }

    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route
    val showBottomBar = currentRoute in bottomItems.map { it.route }
            && currentRoute != Route.Login.path
            && currentRoute != Route.Register.path
            && currentRoute != Route.Onboarding.path

    Scaffold(
        topBar = {
            if (showBottomBar) {
                TopAppBar(
                    title = {
                        Text(
                            "Comic Universe",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = CuTheme.colors.accent
                        )
                    },
                    actions = {
                        if (isLoggedIn) {
                            BadgedBox(
                                badge = {
                                    if (unreadCount > 0) {
                                        Badge(
                                            containerColor = CuTheme.colors.danger,
                                            contentColor = androidx.compose.ui.graphics.Color.White
                                        ) {
                                            Text(if (unreadCount > 99) "99+" else "$unreadCount")
                                        }
                                    }
                                }
                            ) {
                                IconButton(onClick = {
                                    navController.navigate(Route.Notifications.path) {
                                        launchSingleTop = true
                                    }
                                }) {
                                    Icon(
                                        Icons.Default.Notifications,
                                        "Уведомления",
                                        tint = CuTheme.colors.inkSoft
                                    )
                                }
                            }
                        }
                        IconButton(onClick = { authVm.toggleTheme() }) {
                            Icon(
                                if (isDark) Icons.Default.LightMode else Icons.Default.DarkMode,
                                contentDescription = "Сменить тему",
                                tint = CuTheme.colors.inkSoft
                            )
                        }
                        if (!isLoggedIn) {
                            IconButton(onClick = { navController.navigate(Route.Login.path) }) {
                                Icon(Icons.Default.Login, "Войти", tint = CuTheme.colors.accent)
                            }
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = CuTheme.colors.paper)
                )
            }
        },
        bottomBar = {
            if (showBottomBar) {
                NavigationBar(containerColor = CuTheme.colors.paper) {
                    bottomItems.forEach { item ->
                        NavigationBarItem(
                            icon = { Icon(item.icon, item.label) },
                            label = { Text(item.label, style = MaterialTheme.typography.labelSmall) },
                            selected = currentRoute == item.route,
                            onClick = {
                                if (currentRoute != item.route) {
                                    navController.navigate(item.route) {
                                        popUpTo(Route.Home.path) { saveState = true }
                                        launchSingleTop = true
                                        restoreState = true
                                    }
                                }
                            },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = CuTheme.colors.accent,
                                selectedTextColor = CuTheme.colors.accent,
                                indicatorColor = CuTheme.colors.accent.copy(alpha = 0.12f),
                                unselectedIconColor = CuTheme.colors.inkSoft,
                                unselectedTextColor = CuTheme.colors.inkSoft
                            )
                        )
                    }
                }
            }
        }
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = Route.Home.path,
            modifier = Modifier.padding(padding)
        ) {
            composable(Route.Home.path) {
                HomeScreen(
                    onNavigateLibrary = {
                        navController.navigate(Route.Library.path) {
                            popUpTo(Route.Home.path) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    },
                    onNavigateLogin = { navController.navigate(Route.Login.path) },
                    onNavigateComic = { id -> navController.navigate(Route.ComicDetail.build(id)) },
                    isLoggedIn = isLoggedIn
                )
            }

            composable(Route.Library.path) {
                LibraryScreen(
                    onNavigateComic = { id -> navController.navigate(Route.ComicDetail.build(id)) },
                    isLoggedIn = isLoggedIn,
                    onNavigateLogin = { navController.navigate(Route.Login.path) }
                )
            }

            composable(Route.Login.path) {
                LoginScreen(
                    authVm = authVm,
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateRegister = {
                        navController.navigate(Route.Register.path) {
                            popUpTo(Route.Login.path) { inclusive = true }
                        }
                    },
                    onLoginSuccess = {
                        navController.navigate(Route.Home.path) {
                            popUpTo(0) { inclusive = true }
                        }
                    },
                    onNavigateForgotPassword = {
                        navController.navigate(Route.ForgotPassword.path)
                    }
                )
            }

            composable(Route.Register.path) {
                RegisterScreen(
                    authVm = authVm,
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateLogin = {
                        navController.navigate(Route.Login.path) {
                            popUpTo(Route.Register.path) { inclusive = true }
                        }
                    },
                    onRegisterSuccess = {
                        navController.navigate(Route.Onboarding.path) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }

            composable(Route.Onboarding.path) {
                OnboardingScreen(
                    authVm = authVm,
                    onComplete = {
                        navController.navigate(Route.Home.path) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }

            composable(Route.Profile.path) {
                val u = user
                if (u != null) {
                    val profileVm: ProfileViewModel = viewModel()
                    ProfileScreen(
                        user = u,
                        authVm = authVm,
                        onNavigateComic = { id -> navController.navigate(Route.ComicDetail.build(id)) },
                        onLogout = {
                            navController.navigate(Route.Home.path) {
                                popUpTo(0) { inclusive = true }
                            }
                        },
                        vm = profileVm
                    )
                }
            }

            composable(Route.CreatorStudio.path) {
                CreatorStudioScreen(
                    onNavigateComic = { id -> navController.navigate(Route.ComicDetail.build(id)) }
                )
            }

            composable(Route.Admin.path) {
                val adminVm: AdminViewModel = viewModel()
                AdminScreen(
                    vm = adminVm,
                    onNavigateComic = { id -> navController.navigate(Route.ComicDetail.build(id)) }
                )
            }

            composable(
                route = Route.ComicDetail.path,
                arguments = listOf(navArgument("comicId") { type = NavType.StringType })
            ) { backStack ->
                val comicId = backStack.arguments?.getString("comicId") ?: return@composable
                val detailVm: ComicDetailViewModel = viewModel()
                ComicDetailScreen(
                    comicId = comicId,
                    onNavigateBack = { navController.popBackStack() },
                    onStartReading = { navController.navigate(Route.ComicReader.build(comicId)) },
                    isLoggedIn = isLoggedIn,
                    vm = detailVm,
                    onNavigateCreator = { nick ->
                        navController.navigate(Route.CreatorProfile.build(nick))
                    }
                )
            }

            composable(
                route = Route.ComicReader.path,
                arguments = listOf(navArgument("comicId") { type = NavType.StringType })
            ) { backStack ->
                val comicId = backStack.arguments?.getString("comicId") ?: return@composable
                val readerVm: ComicReaderViewModel = viewModel()
                ComicReaderScreen(
                    comicId = comicId,
                    onNavigateBack = { navController.popBackStack() },
                    vm = readerVm
                )
            }

            composable(Route.Notifications.path) {
                NotificationScreen(
                    onNavigateBack = {
                        notificationVm.loadUnreadCount()
                        navController.popBackStack()
                    },
                    vm = notificationVm
                )
            }

            composable(Route.ForgotPassword.path) {
                ForgotPasswordScreen(
                    authVm = authVm,
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(
                route = Route.CreatorProfile.path,
                arguments = listOf(navArgument("creatorNick") { type = NavType.StringType })
            ) { backStack ->
                val nick = backStack.arguments?.getString("creatorNick") ?: return@composable
                CreatorProfileScreen(
                    creatorNick = nick,
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateComic = { id -> navController.navigate(Route.ComicDetail.build(id)) },
                    isLoggedIn = isLoggedIn
                )
            }
        }
    }
}
