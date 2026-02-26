package com.example.comics.ui.screens

import androidx.compose.foundation.background
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.example.comics.data.models.User
import com.example.comics.ui.components.*
import com.example.comics.ui.theme.CuTheme
import com.example.comics.ui.viewmodels.AuthViewModel
import com.example.comics.ui.viewmodels.ProfileViewModel

@Composable
fun ProfileScreen(
    user: User,
    authVm: AuthViewModel,
    onNavigateComic: (String) -> Unit,
    onLogout: () -> Unit,
    vm: ProfileViewModel
) {
    val profile by vm.profile.collectAsState()
    val userStats by vm.userStats.collectAsState()
    val favorites by vm.favorites.collectAsState()
    val progress by vm.progress.collectAsState()
    val creatorRequest by vm.creatorRequest.collectAsState()
    val isLoading by vm.isLoading.collectAsState()
    var showEditDialog by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) { vm.load() }

    if (isLoading && profile == null) {
        LoadingScreen()
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
            CuCard {
                Column(
                    modifier = Modifier.padding(20.dp).fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    UserAvatar(
                        displayName = user.displayName ?: user.email,
                        avatarUrl = profile?.avatar,
                        size = 80
                    )
                    Spacer(Modifier.height(12.dp))
                    Text(
                        user.displayName ?: user.email,
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = CuTheme.colors.ink
                    )
                    Text(
                        user.email,
                        style = MaterialTheme.typography.bodySmall,
                        color = CuTheme.colors.inkSoft
                    )
                    Spacer(Modifier.height(4.dp))
                    CuTag(
                        when (user.role) {
                            "admin" -> "Админ"
                            "creator" -> "Создатель"
                            else -> "Читатель"
                        }
                    )
                    if (!profile?.bio.isNullOrBlank()) {
                        Spacer(Modifier.height(8.dp))
                        Text(
                            profile!!.bio!!,
                            style = MaterialTheme.typography.bodyMedium,
                            color = CuTheme.colors.inkSoft,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                    Spacer(Modifier.height(12.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        CuButton(
                            "Редактировать",
                            onClick = { showEditDialog = true },
                            variant = ButtonVariant.Secondary,
                            icon = Icons.Default.Edit
                        )
                        CuButton(
                            "Выйти",
                            onClick = {
                                authVm.logout { onLogout() }
                            },
                            variant = ButtonVariant.Danger,
                            icon = Icons.Default.Logout
                        )
                    }
                }
            }
        }

        userStats?.let { stats ->
            item {
                CuCard {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            "Статистика",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = CuTheme.colors.ink
                        )
                        Spacer(Modifier.height(12.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceEvenly
                        ) {
                            StatItem("Выборов", "${stats.totalChoicesMade}")
                            StatItem("Концовок", "${stats.endingsUnlocked}")
                            StatItem("Прочитано", "${stats.comicsRead}")
                        }
                    }
                }
            }
        }

        if (user.role == "reader") {
            item {
                CuCard {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            "Стать создателем",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = CuTheme.colors.ink
                        )
                        Spacer(Modifier.height(8.dp))
                        if (creatorRequest != null) {
                            CuStatusTag(creatorRequest!!.status ?: "pending")
                            Spacer(Modifier.height(4.dp))
                            Text(
                                "Заявка отправлена",
                                style = MaterialTheme.typography.bodySmall,
                                color = CuTheme.colors.inkSoft
                            )
                        } else {
                            Text(
                                "Отправьте заявку, чтобы создавать свои комиксы",
                                style = MaterialTheme.typography.bodySmall,
                                color = CuTheme.colors.inkSoft
                            )
                            Spacer(Modifier.height(8.dp))
                            var reason by remember { mutableStateOf("") }
                            CuInput(
                                value = reason,
                                onValueChange = { reason = it },
                                placeholder = "Почему хотите стать создателем?",
                                label = "Причина"
                            )
                            Spacer(Modifier.height(8.dp))
                            CuButton("Отправить заявку", onClick = {
                                if (reason.isNotBlank()) vm.submitCreatorRequest(reason)
                            }, icon = Icons.Default.Send)
                        }
                    }
                }
            }
        }

        if (favorites.isNotEmpty()) {
            item {
                Text(
                    "Избранное (${favorites.size})",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = CuTheme.colors.ink
                )
            }
            items(favorites.filter { it.comic != null }) { fav ->
                ComicCardCompact(
                    comic = fav.comic!!,
                    onClick = { onNavigateComic(fav.comic.id) }
                )
            }
        }

        val activeProgress = progress.filter { it.comic != null && it.unlockedEndings.isNullOrEmpty() }
        if (activeProgress.isNotEmpty()) {
            item {
                Text(
                    "Продолжить чтение (${activeProgress.size})",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = CuTheme.colors.ink
                )
            }
            items(activeProgress) { p ->
                val c = p.comic!!
                CuCard(onClick = { onNavigateComic(c.id) }) {
                    Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.AutoStories, null, tint = CuTheme.colors.accent, modifier = Modifier.size(32.dp))
                        Spacer(Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                c.title,
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = CuTheme.colors.ink
                            )
                            val visited = p.visitedPages?.size ?: 0
                            val total = c.totalPages
                            val pct = if (total > 0) (visited * 100 / total).coerceAtMost(100) else 0
                            Spacer(Modifier.height(4.dp))
                            LinearProgressIndicator(
                                progress = { pct / 100f },
                                modifier = Modifier.fillMaxWidth().height(4.dp),
                                color = CuTheme.colors.accent,
                                trackColor = CuTheme.colors.line
                            )
                            Text(
                                "$pct% · $visited/$total стр.",
                                style = MaterialTheme.typography.labelSmall,
                                color = CuTheme.colors.inkSoft
                            )
                        }
                    }
                }
            }
        }

        item {
            CuCard {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Тёмная тема", style = MaterialTheme.typography.bodyLarge, color = CuTheme.colors.ink)
                    Switch(
                        checked = authVm.isDark.collectAsState().value,
                        onCheckedChange = { authVm.toggleTheme() },
                        colors = SwitchDefaults.colors(checkedTrackColor = CuTheme.colors.accent)
                    )
                }
            }
        }

        item { Spacer(Modifier.height(16.dp)) }
    }

    if (showEditDialog) {
        EditProfileDialog(
            currentNickname = user.displayName ?: "",
            currentBio = profile?.bio ?: "",
            onDismiss = { showEditDialog = false },
            onSave = { nickname, bio ->
                vm.updateProfileFull(nickname, bio)
                authVm.refreshUser()
                showEditDialog = false
            }
        )
    }
}

@Composable
private fun StatItem(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = CuTheme.colors.accent)
        Text(label, style = MaterialTheme.typography.labelSmall, color = CuTheme.colors.inkSoft)
    }
}

@Composable
private fun EditProfileDialog(
    currentNickname: String,
    currentBio: String,
    onDismiss: () -> Unit,
    onSave: (String, String) -> Unit
) {
    var nickname by remember { mutableStateOf(currentNickname) }
    var bio by remember { mutableStateOf(currentBio) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Редактировать профиль", color = CuTheme.colors.ink) },
        text = {
            Column {
                CuInput(
                    value = nickname,
                    onValueChange = { nickname = it },
                    label = "Никнейм",
                    placeholder = "Ваш никнейм"
                )
                Spacer(Modifier.height(12.dp))
                CuInput(
                    value = bio,
                    onValueChange = { bio = it },
                    label = "О себе",
                    placeholder = "Расскажите о себе...",
                    singleLine = false,
                    maxLines = 4
                )
            }
        },
        confirmButton = {
            CuButton("Сохранить", onClick = { onSave(nickname, bio) })
        },
        dismissButton = {
            CuButton("Отмена", onClick = onDismiss, variant = ButtonVariant.Ghost)
        },
        containerColor = CuTheme.colors.paper
    )
}
