package com.example.comics.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.comics.data.models.AppNotification
import com.example.comics.ui.components.*
import com.example.comics.ui.theme.CuTheme
import com.example.comics.ui.viewmodels.NotificationViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationScreen(
    onNavigateBack: () -> Unit,
    vm: NotificationViewModel = viewModel()
) {
    val notifications by vm.notifications.collectAsState()
    val unreadCount by vm.unreadCount.collectAsState()
    val isLoading by vm.isLoading.collectAsState()

    LaunchedEffect(Unit) { vm.loadNotifications() }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "Уведомления",
                        fontWeight = FontWeight.Bold,
                        color = CuTheme.colors.ink
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, "Назад", tint = CuTheme.colors.ink)
                    }
                },
                actions = {
                    if (unreadCount > 0) {
                        IconButton(onClick = { vm.markAllRead() }) {
                            Icon(Icons.Default.DoneAll, "Прочитать все", tint = CuTheme.colors.accent)
                        }
                    }
                    if (notifications.isNotEmpty()) {
                        IconButton(onClick = { vm.clearAll() }) {
                            Icon(Icons.Default.DeleteSweep, "Очистить все", tint = CuTheme.colors.danger)
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = CuTheme.colors.paper)
            )
        }
    ) { padding ->
        if (isLoading && notifications.isEmpty()) {
            LoadingScreen(modifier = Modifier.padding(padding))
            return@Scaffold
        }

        if (notifications.isEmpty()) {
            CuEmptyState(
                icon = Icons.Default.NotificationsNone,
                title = "Нет уведомлений",
                subtitle = "Здесь будут появляться ваши уведомления",
                modifier = Modifier.padding(padding)
            )
            return@Scaffold
        }

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(CuTheme.colors.bg),
            contentPadding = PaddingValues(12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(notifications, key = { it.id }) { notification ->
                NotificationItem(
                    notification = notification,
                    onMarkRead = { vm.markRead(notification.id) },
                    onDelete = { vm.deleteNotification(notification.id) }
                )
            }
        }
    }
}

@Composable
private fun NotificationItem(
    notification: AppNotification,
    onMarkRead: () -> Unit,
    onDelete: () -> Unit
) {
    val bgColor = if (notification.isRead) CuTheme.colors.paper else CuTheme.colors.accent.copy(alpha = 0.06f)

    CuCard {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(bgColor)
                .padding(12.dp),
            verticalAlignment = Alignment.Top,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            val icon = when (notification.type) {
                "comment" -> Icons.Default.ChatBubble
                "rating" -> Icons.Default.Star
                "subscription" -> Icons.Default.PersonAdd
                "comic_published" -> Icons.Default.MenuBook
                "revision_approved" -> Icons.Default.CheckCircle
                "revision_rejected" -> Icons.Default.Cancel
                "creator_approved" -> Icons.Default.Verified
                else -> Icons.Default.Notifications
            }
            val tint = when (notification.type) {
                "comment" -> CuTheme.colors.accent
                "rating" -> CuTheme.colors.warn
                "subscription" -> CuTheme.colors.ok
                "revision_rejected" -> CuTheme.colors.danger
                else -> CuTheme.colors.inkSoft
            }

            Icon(icon, null, tint = tint, modifier = Modifier.size(24.dp).padding(top = 2.dp))

            Column(modifier = Modifier.weight(1f)) {
                if (!notification.title.isNullOrBlank()) {
                    Text(
                        notification.title,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = if (!notification.isRead) FontWeight.Bold else FontWeight.Normal,
                        color = CuTheme.colors.ink,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                if (!notification.body.isNullOrBlank()) {
                    Text(
                        notification.body,
                        style = MaterialTheme.typography.bodySmall,
                        color = CuTheme.colors.inkSoft,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                Spacer(Modifier.height(4.dp))
                Text(
                    formatNotificationTime(notification.createdAt),
                    style = MaterialTheme.typography.labelSmall,
                    color = CuTheme.colors.inkFaint
                )
            }

            Column {
                if (!notification.isRead) {
                    IconButton(onClick = onMarkRead, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Default.Done, "Прочитано", tint = CuTheme.colors.accent, modifier = Modifier.size(18.dp))
                    }
                }
                IconButton(onClick = onDelete, modifier = Modifier.size(32.dp)) {
                    Icon(Icons.Default.Close, "Удалить", tint = CuTheme.colors.inkFaint, modifier = Modifier.size(18.dp))
                }
            }
        }
    }
}

private fun formatNotificationTime(dateStr: String?): String {
    if (dateStr == null) return ""
    return try {
        val sdf = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.getDefault())
        sdf.timeZone = java.util.TimeZone.getTimeZone("UTC")
        val date = sdf.parse(dateStr) ?: return dateStr
        val now = System.currentTimeMillis()
        val diff = now - date.time
        val minutes = diff / 60000
        val hours = minutes / 60
        val days = hours / 24
        when {
            minutes < 1 -> "сейчас"
            minutes < 60 -> "${minutes}м назад"
            hours < 24 -> "${hours}ч назад"
            days < 7 -> "${days}д назад"
            else -> {
                val outFmt = java.text.SimpleDateFormat("dd.MM.yyyy", java.util.Locale.getDefault())
                outFmt.format(date)
            }
        }
    } catch (_: Exception) { dateStr }
}
