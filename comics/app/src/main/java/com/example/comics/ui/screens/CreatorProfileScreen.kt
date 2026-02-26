package com.example.comics.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.comics.data.remote.ApiClient
import com.example.comics.ui.components.*
import com.example.comics.ui.theme.CuTheme
import com.example.comics.ui.viewmodels.CreatorProfileViewModel

@Composable
fun CreatorProfileScreen(
    creatorNick: String,
    onNavigateBack: () -> Unit,
    onNavigateComic: (String) -> Unit,
    isLoggedIn: Boolean,
    vm: CreatorProfileViewModel = viewModel()
) {
    val creator by vm.creator.collectAsState()
    val comics by vm.comics.collectAsState()
    val stats by vm.stats.collectAsState()
    val isSubscribed by vm.isSubscribed.collectAsState()
    val isLoading by vm.isLoading.collectAsState()

    LaunchedEffect(creatorNick) { vm.load(creatorNick) }

    if (isLoading && creator == null) {
        LoadingScreen()
        return
    }

    val c = creator ?: run {
        ErrorScreen("Создатель не найден", onRetry = onNavigateBack)
        return
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(CuTheme.colors.bg),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onNavigateBack) {
                    Icon(Icons.Default.ArrowBack, "Назад", tint = CuTheme.colors.ink)
                }
                Text(
                    "Профиль создателя",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = CuTheme.colors.ink
                )
            }
        }

        item {
            CuCard {
                Column(
                    modifier = Modifier.padding(20.dp).fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    UserAvatar(
                        displayName = c.displayName ?: c.creatorNick,
                        avatarUrl = c.avatar?.let { url ->
                            if (url.startsWith("http")) url else "${ApiClient.baseUrl.removeSuffix("/api/v1/")}$url"
                        },
                        size = 80
                    )
                    Spacer(Modifier.height(12.dp))
                    Text(
                        c.displayName ?: c.creatorNick ?: "",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = CuTheme.colors.ink
                    )
                    if (c.creatorNick != null) {
                        Text(
                            "@${c.creatorNick}",
                            style = MaterialTheme.typography.bodyMedium,
                            color = CuTheme.colors.inkSoft
                        )
                    }
                    if (!c.bio.isNullOrBlank()) {
                        Spacer(Modifier.height(8.dp))
                        Text(
                            c.bio,
                            style = MaterialTheme.typography.bodyMedium,
                            color = CuTheme.colors.ink,
                            textAlign = TextAlign.Center
                        )
                    }
                    Spacer(Modifier.height(16.dp))
                    if (isLoggedIn) {
                        CuButton(
                            text = if (isSubscribed) "Отписаться" else "Подписаться",
                            onClick = { vm.toggleSubscribe() },
                            variant = if (isSubscribed) ButtonVariant.Secondary else ButtonVariant.Primary,
                            icon = if (isSubscribed) Icons.Default.PersonRemove else Icons.Default.PersonAdd
                        )
                    }
                }
            }
        }

        stats?.let { s ->
            item {
                CuCard {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        CreatorStatItem("Подписчиков", "${s.subscriberCount}")
                        CreatorStatItem("Комиксов", "${s.totalComics}")
                        CreatorStatItem("Прочтений", "${s.totalReads}")
                        CreatorStatItem("Рейтинг", String.format("%.1f", s.avgRating))
                    }
                }
            }
        }

        if (comics.isNotEmpty()) {
            item {
                Text(
                    "Комиксы (${comics.size})",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = CuTheme.colors.ink
                )
            }
            items(comics) { comic ->
                ComicCardCompact(
                    comic = comic,
                    onClick = { onNavigateComic(comic.id) }
                )
            }
        } else {
            item {
                CuEmptyState(
                    icon = Icons.Default.MenuBook,
                    title = "Пока нет комиксов",
                    subtitle = "Этот автор ещё не опубликовал комиксы"
                )
            }
        }

        item { Spacer(Modifier.height(16.dp)) }
    }
}

@Composable
private fun CreatorStatItem(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            value,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = CuTheme.colors.accent
        )
        Text(
            label,
            style = MaterialTheme.typography.labelSmall,
            color = CuTheme.colors.inkSoft
        )
    }
}
