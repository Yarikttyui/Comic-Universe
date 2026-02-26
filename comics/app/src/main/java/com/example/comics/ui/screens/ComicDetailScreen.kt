package com.example.comics.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.example.comics.data.models.Comic
import com.example.comics.data.remote.ApiClient
import com.example.comics.ui.components.*
import com.example.comics.ui.theme.CuTheme
import com.example.comics.ui.viewmodels.ComicDetailViewModel

@Composable
fun ComicDetailScreen(
    comicId: String,
    onNavigateBack: () -> Unit,
    onStartReading: () -> Unit,
    isLoggedIn: Boolean,
    vm: ComicDetailViewModel,
    onNavigateCreator: (String) -> Unit = {}
) {
    val comic by vm.comic.collectAsState()
    val comments by vm.comments.collectAsState()
    val isFavorite by vm.isFavorite.collectAsState()
    val isLoading by vm.isLoading.collectAsState()

    LaunchedEffect(comicId) { vm.load(comicId) }

    if (isLoading && comic == null) {
        LoadingScreen()
        return
    }
    val c = comic ?: run {
        ErrorScreen("Комикс не найден", onRetry = { onNavigateBack() })
        return
    }

    val coverUrl = c.coverImage?.let {
        if (it.startsWith("http")) it else "${ApiClient.baseUrl.removeSuffix("/api/v1/")}$it"
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(CuTheme.colors.bg)
    ) {
        item {
            Box {
                if (coverUrl != null) {
                    AsyncImage(
                        model = ImageRequest.Builder(LocalContext.current).data(coverUrl).crossfade(true).build(),
                        contentDescription = c.title,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxWidth().height(280.dp)
                    )
                } else {
                    Box(
                        modifier = Modifier.fillMaxWidth().height(280.dp).background(CuTheme.colors.paper),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.MenuBook, null, modifier = Modifier.size(80.dp), tint = CuTheme.colors.inkSoft)
                    }
                }
                IconButton(
                    onClick = onNavigateBack,
                    modifier = Modifier.padding(8.dp).align(Alignment.TopStart)
                ) {
                    Surface(shape = CircleShape, color = CuTheme.colors.paper.copy(alpha = 0.8f)) {
                        Icon(Icons.Default.ArrowBack, "Назад", modifier = Modifier.padding(8.dp), tint = CuTheme.colors.ink)
                    }
                }
            }
        }

        item {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(c.title, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, color = CuTheme.colors.ink)
                Spacer(Modifier.height(4.dp))
                if (c.description != null) {
                    Text(c.description, style = MaterialTheme.typography.bodyMedium, color = CuTheme.colors.inkSoft)
                    Spacer(Modifier.height(8.dp))
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    c.genres?.firstOrNull()?.let { CuTag(it) }
                    CuStatusTag(c.status ?: "draft")
                }

                if (c.authorName != null) {
                    Spacer(Modifier.height(12.dp))
                    Surface(
                        shape = MaterialTheme.shapes.small,
                        color = CuTheme.colors.surfaceSoft,
                        modifier = Modifier.clickable {
                            val nick = c.authorName
                            if (nick.isNotBlank()) onNavigateCreator(nick)
                        }
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.Person, null, tint = CuTheme.colors.accent, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(6.dp))
                            Text(
                                c.authorName,
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Medium,
                                color = CuTheme.colors.accent
                            )
                            Spacer(Modifier.width(4.dp))
                            Icon(Icons.Default.ChevronRight, null, tint = CuTheme.colors.inkFaint, modifier = Modifier.size(16.dp))
                        }
                    }
                }

                Spacer(Modifier.height(12.dp))
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Star, null, tint = CuTheme.colors.warning, modifier = Modifier.size(20.dp))
                        Spacer(Modifier.width(4.dp))
                        Text(
                            String.format("%.1f", c.rating),
                            style = MaterialTheme.typography.bodyMedium,
                            color = CuTheme.colors.ink
                        )
                        Text(" (${c.ratingCount})", style = MaterialTheme.typography.bodySmall, color = CuTheme.colors.inkSoft)
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Visibility, null, tint = CuTheme.colors.inkSoft, modifier = Modifier.size(20.dp))
                        Spacer(Modifier.width(4.dp))
                        Text("${c.readCount}", style = MaterialTheme.typography.bodyMedium, color = CuTheme.colors.ink)
                    }
                }

                Spacer(Modifier.height(16.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    CuButton(
                        text = "Читать",
                        onClick = onStartReading,
                        icon = Icons.Default.PlayArrow,
                        modifier = Modifier.weight(1f)
                    )
                    if (isLoggedIn) {
                        IconButton(onClick = { vm.toggleFavorite(comicId) }) {
                            Icon(
                                if (isFavorite) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                                "В избранное",
                                tint = if (isFavorite) CuTheme.colors.danger else CuTheme.colors.inkSoft
                            )
                        }
                    }
                }

                if (isLoggedIn) {
                    Spacer(Modifier.height(12.dp))
                    RatingBar(currentRating = vm.userRating.collectAsState().value) { rating ->
                        vm.rate(comicId, rating)
                    }
                }
            }
        }

        item {
            Divider(color = CuTheme.colors.border, modifier = Modifier.padding(horizontal = 16.dp))
            Text(
                "Комментарии (${comments.size})",
                style = MaterialTheme.typography.titleMedium,
                color = CuTheme.colors.ink,
                modifier = Modifier.padding(16.dp)
            )
        }

        if (isLoggedIn) {
            item {
                var commentText by remember { mutableStateOf("") }
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    CuInput(
                        value = commentText,
                        onValueChange = { commentText = it },
                        placeholder = "Написать комментарий...",
                        modifier = Modifier.weight(1f)
                    )
                    Spacer(Modifier.width(8.dp))
                    IconButton(onClick = {
                        if (commentText.isNotBlank()) {
                            vm.addComment(comicId, commentText)
                            commentText = ""
                        }
                    }) {
                        Icon(Icons.Default.Send, "Отправить", tint = CuTheme.colors.accent)
                    }
                }
                Spacer(Modifier.height(8.dp))
            }
        }

        if (comments.isEmpty()) {
            item {
                CuEmptyState(
                    icon = Icons.Default.ChatBubbleOutline,
                    title = "Пока нет комментариев",
                    subtitle = "Будьте первым!"
                )
            }
        } else {
            items(comments) { comment ->
                CuCard(modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            UserAvatar(
                                avatarUrl = comment.user?.avatar,
                                displayName = comment.user?.displayName ?: "Пользователь",
                                size = 28
                            )
                            Spacer(Modifier.width(8.dp))
                            Text(
                                comment.user?.displayName ?: "Пользователь",
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.Bold,
                                color = CuTheme.colors.ink
                            )
                        }
                        Spacer(Modifier.height(6.dp))
                        Text(
                            comment.body,
                            style = MaterialTheme.typography.bodyMedium,
                            color = CuTheme.colors.ink
                        )
                    }
                }
            }
        }
        item { Spacer(Modifier.height(16.dp)) }
    }
}

@Composable
private fun RatingBar(currentRating: Int, onRate: (Int) -> Unit) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Text("Ваша оценка: ", style = MaterialTheme.typography.bodyMedium, color = CuTheme.colors.inkSoft)
        (1..5).forEach { star ->
            IconButton(onClick = { onRate(star) }, modifier = Modifier.size(36.dp)) {
                Icon(
                    if (star <= currentRating) Icons.Default.Star else Icons.Default.StarBorder,
                    "Оценка $star",
                    tint = CuTheme.colors.warning
                )
            }
        }
    }
}
