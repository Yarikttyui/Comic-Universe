package com.example.comics.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.example.comics.data.models.*
import com.example.comics.ui.components.*
import com.example.comics.ui.theme.CuTheme
import com.example.comics.ui.viewmodels.AdminViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminScreen(
    vm: AdminViewModel,
    onNavigateComic: (String) -> Unit
) {
    val tabs = listOf(
        "Ревизии" to Icons.Default.RateReview,
        "Заявки" to Icons.Default.GroupAdd,
        "Жалобы" to Icons.Default.Report,
        "Комиксы" to Icons.Default.MenuBook,
        "Пользователи" to Icons.Default.People
    )
    var selectedTab by remember { mutableIntStateOf(0) }

    Column(
        modifier = Modifier.fillMaxSize().background(CuTheme.colors.bg)
    ) {
        Surface(color = CuTheme.colors.paper, shadowElevation = 2.dp) {
            Column {
                Text(
                    "Администрирование",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    color = CuTheme.colors.ink,
                    modifier = Modifier.padding(16.dp, 12.dp, 16.dp, 8.dp)
                )
                ScrollableTabRow(
                    selectedTabIndex = selectedTab,
                    containerColor = CuTheme.colors.paper,
                    contentColor = CuTheme.colors.accent,
                    edgePadding = 8.dp,
                    divider = { HorizontalDivider(color = CuTheme.colors.border.copy(alpha = 0.3f)) }
                ) {
                    tabs.forEachIndexed { index, (title, icon) ->
                        Tab(
                            selected = selectedTab == index,
                            onClick = { selectedTab = index },
                            text = { Text(title, maxLines = 1) },
                            icon = { Icon(icon, contentDescription = title, modifier = Modifier.size(18.dp)) }
                        )
                    }
                }
            }
        }

        when (selectedTab) {
            0 -> AdminRevisionsTab(vm, onNavigateComic)
            1 -> AdminCreatorRequestsTab(vm)
            2 -> AdminCommentReportsTab(vm)
            3 -> AdminComicsTab(vm, onNavigateComic)
            4 -> AdminUsersTab(vm)
        }
    }
}

/* ─── Ревизии ─── */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AdminRevisionsTab(vm: AdminViewModel, onNavigateComic: (String) -> Unit) {
    val revisions by vm.revisions.collectAsState()
    val isLoading by vm.isLoading.collectAsState()
    var rejectDialog by remember { mutableStateOf<ComicRevision?>(null) }

    LaunchedEffect(Unit) { vm.loadRevisions() }

    if (isLoading && revisions.isEmpty()) { LoadingScreen(); return }
    if (revisions.isEmpty()) {
        CuEmptyState(Icons.Default.CheckCircle, "Нет ревизий на проверке", "Все ревизии обработаны")
        return
    }

    LazyColumn(
        contentPadding = PaddingValues(12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(revisions) { rev ->
            CuCard {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text(
                        rev.comic?.title ?: "Комикс",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = CuTheme.colors.ink,
                        maxLines = 2, overflow = TextOverflow.Ellipsis
                    )
                    Spacer(Modifier.height(4.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                        rev.creator?.displayName?.let {
                            Text("Автор: $it", style = MaterialTheme.typography.bodySmall, color = CuTheme.colors.inkSoft)
                        }
                        CuStatusTag(rev.status ?: "pending_review")
                        Text("v${rev.version}", style = MaterialTheme.typography.labelSmall, color = CuTheme.colors.inkSoft)
                    }

                    if (rev.status == "pending_review" || rev.status == "pending") {
                        Spacer(Modifier.height(10.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            CuButton("Одобрить", onClick = { vm.approveRevision(rev.id) }, icon = Icons.Default.Check)
                            CuButton("Отклонить", onClick = { rejectDialog = rev }, variant = ButtonVariant.Danger, icon = Icons.Default.Close)
                        }
                        Spacer(Modifier.height(6.dp))
                        CuButton(
                            "Открыть комикс",
                            onClick = { rev.comicId?.let { onNavigateComic(it) } },
                            variant = ButtonVariant.Secondary,
                            icon = Icons.Default.Visibility,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            }
        }
    }

    rejectDialog?.let { rev ->
        ReasonDialog(
            title = "Отклонить ревизию",
            label = "Причина отклонения",
            confirmText = "Отклонить",
            onDismiss = { rejectDialog = null },
            onConfirm = { reason -> vm.rejectRevision(rev.id, reason); rejectDialog = null }
        )
    }
}

/* ─── Заявки на создателя ─── */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AdminCreatorRequestsTab(vm: AdminViewModel) {
    val requests by vm.creatorRequests.collectAsState()
    val isLoading by vm.isLoading.collectAsState()
    var rejectDialog by remember { mutableStateOf<CreatorRoleRequest?>(null) }

    LaunchedEffect(Unit) { vm.loadCreatorRequests() }

    if (isLoading && requests.isEmpty()) { LoadingScreen(); return }
    if (requests.isEmpty()) {
        CuEmptyState(Icons.Default.GroupAdd, "Нет заявок", "Нет заявок ожидающих рассмотрения")
        return
    }

    LazyColumn(
        contentPadding = PaddingValues(12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(requests) { req ->
            CuCard {
                Column(modifier = Modifier.padding(12.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                req.user?.displayName ?: "Пользователь",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = CuTheme.colors.ink
                            )
                            req.user?.email?.let {
                                Text(it, style = MaterialTheme.typography.bodySmall, color = CuTheme.colors.inkSoft)
                            }
                        }
                        CuStatusTag(req.status ?: "pending")
                    }

                    req.desiredNick?.let {
                        Spacer(Modifier.height(6.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.AlternateEmail, null, modifier = Modifier.size(16.dp), tint = CuTheme.colors.accent)
                            Spacer(Modifier.width(4.dp))
                            Text("Желаемый ник: $it", style = MaterialTheme.typography.bodySmall, color = CuTheme.colors.accent, fontWeight = FontWeight.SemiBold)
                        }
                    }

                    req.motivation?.let {
                        Spacer(Modifier.height(6.dp))
                        Surface(
                            color = CuTheme.colors.bg,
                            shape = MaterialTheme.shapes.small,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                it,
                                style = MaterialTheme.typography.bodySmall,
                                color = CuTheme.colors.inkSoft,
                                modifier = Modifier.padding(8.dp)
                            )
                        }
                    }

                    if (req.status == "pending") {
                        Spacer(Modifier.height(10.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            CuButton("Одобрить", onClick = { vm.approveCreatorRequest(req.id) }, icon = Icons.Default.Check)
                            CuButton("Отклонить", onClick = { rejectDialog = req }, variant = ButtonVariant.Danger, icon = Icons.Default.Close)
                        }
                    }
                }
            }
        }
    }

    rejectDialog?.let { req ->
        ReasonDialog(
            title = "Отклонить заявку",
            label = "Причина отклонения",
            confirmText = "Отклонить",
            onDismiss = { rejectDialog = null },
            onConfirm = { reason -> vm.rejectCreatorRequest(req.id, reason); rejectDialog = null }
        )
    }
}

/* ─── Жалобы на комментарии ─── */
@Composable
private fun AdminCommentReportsTab(vm: AdminViewModel) {
    val reports by vm.commentReports.collectAsState()
    val isLoading by vm.isLoading.collectAsState()

    LaunchedEffect(Unit) { vm.loadCommentReports() }

    if (isLoading && reports.isEmpty()) { LoadingScreen(); return }
    if (reports.isEmpty()) {
        CuEmptyState(Icons.Default.Shield, "Нет жалоб на комментарии", "Все жалобы обработаны")
        return
    }

    LazyColumn(
        contentPadding = PaddingValues(12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(reports) { report ->
            CuCard {
                Column(modifier = Modifier.padding(12.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Report, null, tint = CuTheme.colors.danger, modifier = Modifier.size(20.dp))
                        Spacer(Modifier.width(6.dp))
                        Text(
                            "Жалоба от ${report.reporter?.displayName ?: "Пользователь"}",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = CuTheme.colors.ink,
                            modifier = Modifier.weight(1f)
                        )
                        CuStatusTag(report.status ?: "open")
                    }

                    report.comment?.body?.let {
                        Spacer(Modifier.height(8.dp))
                        Surface(
                            color = CuTheme.colors.bg,
                            shape = MaterialTheme.shapes.small,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(8.dp)) {
                                report.comment.user?.displayName?.let { name ->
                                    Text(name, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = CuTheme.colors.accent)
                                    Spacer(Modifier.height(2.dp))
                                }
                                Text(
                                    "«$it»",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = CuTheme.colors.ink,
                                    maxLines = 4,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }
                    }

                    report.reason?.let {
                        Spacer(Modifier.height(6.dp))
                        Text("Причина: $it", style = MaterialTheme.typography.bodySmall, color = CuTheme.colors.danger)
                    }

                    if (report.status == "open" || report.status == "pending") {
                        Spacer(Modifier.height(10.dp))
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState())
                        ) {
                            CuButton("Скрыть", onClick = { report.commentId?.let { vm.hideComment(it) } }, variant = ButtonVariant.Danger, icon = Icons.Default.VisibilityOff)
                            CuButton("Удалить", onClick = { report.commentId?.let { vm.deleteCommentAdmin(it) } }, variant = ButtonVariant.Danger, icon = Icons.Default.Delete)
                            CuButton("Отклонить", onClick = { vm.resolveCommentReport(report.id) }, variant = ButtonVariant.Ghost, icon = Icons.Default.Close)
                        }
                    }
                }
            }
        }
    }
}

/* ─── Комиксы и жалобы на комиксы ─── */
@Composable
private fun AdminComicsTab(vm: AdminViewModel, onNavigateComic: (String) -> Unit) {
    val comics by vm.adminComics.collectAsState()
    val comicReports by vm.comicReports.collectAsState()
    val isLoading by vm.isLoading.collectAsState()
    var showReports by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        vm.loadAdminComics()
        vm.loadComicReports()
    }

    if (isLoading && comics.isEmpty() && comicReports.isEmpty()) { LoadingScreen(); return }

    LazyColumn(
        contentPadding = PaddingValues(12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FilterChip(
                    selected = !showReports,
                    onClick = { showReports = false },
                    label = { Text("Все комиксы (${comics.size})") },
                    leadingIcon = { Icon(Icons.Default.MenuBook, null, modifier = Modifier.size(16.dp)) }
                )
                FilterChip(
                    selected = showReports,
                    onClick = { showReports = true },
                    label = { Text("Жалобы (${comicReports.size})") },
                    leadingIcon = { Icon(Icons.Default.Report, null, modifier = Modifier.size(16.dp)) }
                )
            }
        }

        if (!showReports) {
            if (comics.isEmpty()) {
                item { CuEmptyState(Icons.Default.MenuBook, "Нет комиксов", "Список пуст") }
            } else {
                items(comics) { comic ->
                    CuCard {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        comic.title,
                                        style = MaterialTheme.typography.titleSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = CuTheme.colors.ink,
                                        maxLines = 2,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    Spacer(Modifier.height(4.dp))
                                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                        CuStatusTag(comic.status ?: "draft")
                                        if (comic.hiddenByAdmin) CuTag("Скрыт", color = CuTheme.colors.danger)
                                        Text("${comic.totalPages} стр.", style = MaterialTheme.typography.labelSmall, color = CuTheme.colors.inkSoft)
                                    }
                                }
                            }
                            Spacer(Modifier.height(8.dp))
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState())
                            ) {
                                CuButton("Открыть", onClick = { onNavigateComic(comic.id) }, variant = ButtonVariant.Secondary, icon = Icons.Default.Visibility)
                                if (comic.hiddenByAdmin) {
                                    CuButton("Восстановить", onClick = { vm.unhideComic(comic.id) }, icon = Icons.Default.Visibility)
                                } else {
                                    CuButton("Скрыть", onClick = { vm.hideComic(comic.id) }, variant = ButtonVariant.Danger, icon = Icons.Default.VisibilityOff)
                                }
                            }
                        }
                    }
                }
            }
        } else {
            if (comicReports.isEmpty()) {
                item { CuEmptyState(Icons.Default.Shield, "Нет жалоб на комиксы", "Все жалобы обработаны") }
            } else {
                items(comicReports) { report ->
                    CuCard {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Report, null, tint = CuTheme.colors.danger, modifier = Modifier.size(20.dp))
                                Spacer(Modifier.width(6.dp))
                                Text(
                                    report.comic?.title ?: "Комикс",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = CuTheme.colors.ink,
                                    modifier = Modifier.weight(1f),
                                    maxLines = 2,
                                    overflow = TextOverflow.Ellipsis
                                )
                                CuStatusTag(report.status ?: "open")
                            }

                            report.reporter?.displayName?.let {
                                Spacer(Modifier.height(4.dp))
                                Text("Жалоба от: $it", style = MaterialTheme.typography.bodySmall, color = CuTheme.colors.inkSoft)
                            }

                            report.reason?.let {
                                Spacer(Modifier.height(4.dp))
                                Text("Причина: $it", style = MaterialTheme.typography.bodySmall, color = CuTheme.colors.danger)
                            }

                            if (report.status == "open" || report.status == "pending") {
                                Spacer(Modifier.height(10.dp))
                                Row(
                                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                                    modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState())
                                ) {
                                    CuButton("Открыть", onClick = { report.comicId?.let { onNavigateComic(it) } }, variant = ButtonVariant.Secondary, icon = Icons.Default.Visibility)
                                    CuButton("Скрыть комикс", onClick = { report.comicId?.let { vm.hideComic(it) } }, variant = ButtonVariant.Danger, icon = Icons.Default.VisibilityOff)
                                    CuButton("Отклонить", onClick = { vm.resolveComicReport(report.id) }, variant = ButtonVariant.Ghost, icon = Icons.Default.Close)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

/* ─── Пользователи ─── */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AdminUsersTab(vm: AdminViewModel) {
    val users by vm.adminUsers.collectAsState()
    val isLoading by vm.isLoading.collectAsState()
    var banDialog by remember { mutableStateOf<AdminUser?>(null) }
    var deleteDialog by remember { mutableStateOf<AdminUser?>(null) }
    var searchQuery by remember { mutableStateOf("") }

    LaunchedEffect(Unit) { vm.loadUsers() }

    val filteredUsers = remember(users, searchQuery) {
        if (searchQuery.isBlank()) users
        else users.filter {
            (it.displayName ?: "").contains(searchQuery, ignoreCase = true) ||
            it.email.contains(searchQuery, ignoreCase = true) ||
            (it.creatorNick ?: "").contains(searchQuery, ignoreCase = true)
        }
    }

    if (isLoading && users.isEmpty()) { LoadingScreen(); return }

    LazyColumn(
        contentPadding = PaddingValues(12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        item {
            CuInput(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = "Поиск пользователей...",
                leadingIcon = { Icon(Icons.Default.Search, null, tint = CuTheme.colors.inkSoft) }
            )
            Spacer(Modifier.height(4.dp))
            Text("Всего: ${users.size}", style = MaterialTheme.typography.labelSmall, color = CuTheme.colors.inkSoft)
        }

        if (filteredUsers.isEmpty()) {
            item { CuEmptyState(Icons.Default.People, "Нет пользователей", if (searchQuery.isNotBlank()) "Никого не найдено" else "Список пуст") }
        } else {
            items(filteredUsers) { user ->
                val isBanned = user.accountStatus == "banned"
                CuCard {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    user.displayName ?: user.email,
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = CuTheme.colors.ink
                                )
                                if (user.creatorNick != null) {
                                    Text("@${user.creatorNick}", style = MaterialTheme.typography.bodySmall, color = CuTheme.colors.accent)
                                }
                                Text(user.email, style = MaterialTheme.typography.bodySmall, color = CuTheme.colors.inkSoft)
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                CuTag(
                                    when (user.role) { "admin" -> "Админ"; "creator" -> "Создатель"; else -> "Читатель" },
                                    color = when (user.role) { "admin" -> CuTheme.colors.accent; "creator" -> CuTheme.colors.ok; else -> CuTheme.colors.inkSoft }
                                )
                                Spacer(Modifier.height(4.dp))
                                if (isBanned) {
                                    CuTag("Заблокирован", color = CuTheme.colors.danger)
                                } else {
                                    CuTag("Активен", color = CuTheme.colors.ok)
                                }
                            }
                        }

                        if (isBanned) {
                            Spacer(Modifier.height(6.dp))
                            Surface(
                                color = CuTheme.colors.danger.copy(alpha = 0.1f),
                                shape = MaterialTheme.shapes.small,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(8.dp)) {
                                    user.banReason?.let { Text("Причина: $it", style = MaterialTheme.typography.bodySmall, color = CuTheme.colors.danger) }
                                    user.bannedUntil?.let {
                                        Text("До: ${it.take(10)}", style = MaterialTheme.typography.labelSmall, color = CuTheme.colors.inkSoft)
                                    } ?: Text("Бессрочно", style = MaterialTheme.typography.labelSmall, color = CuTheme.colors.inkSoft)
                                }
                            }
                        }

                        if (user.role != "admin") {
                            Spacer(Modifier.height(10.dp))
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState())
                            ) {
                                CuButton(
                                    if (user.role == "creator") "→ Читатель" else "→ Создатель",
                                    onClick = {
                                        val newRole = if (user.role == "creator") "reader" else "creator"
                                        vm.changeRole(user.id, newRole)
                                    },
                                    variant = ButtonVariant.Secondary,
                                    icon = Icons.Default.SwapHoriz
                                )
                                if (isBanned) {
                                    CuButton("Разблокировать", onClick = { vm.unbanUser(user.id) }, variant = ButtonVariant.Secondary, icon = Icons.Default.LockOpen)
                                } else {
                                    CuButton("Заблокировать", onClick = { banDialog = user }, variant = ButtonVariant.Danger, icon = Icons.Default.Block)
                                }
                                CuButton("Удалить", onClick = { deleteDialog = user }, variant = ButtonVariant.Danger, icon = Icons.Default.Delete)
                            }
                        }
                    }
                }
            }
        }
    }

    banDialog?.let { user ->
        BanUserDialog(
            userName = user.displayName ?: user.email,
            onDismiss = { banDialog = null },
            onBan = { reason, days ->
                vm.banUser(user.id, reason, days)
                banDialog = null
            }
        )
    }

    deleteDialog?.let { user ->
        AlertDialog(
            onDismissRequest = { deleteDialog = null },
            title = { Text("Удалить пользователя?", color = CuTheme.colors.ink) },
            text = {
                Text(
                    "Пользователь \"${user.displayName ?: user.email}\" будет удалён навсегда со всеми данными. Это действие нельзя отменить.",
                    color = CuTheme.colors.inkSoft
                )
            },
            confirmButton = {
                CuButton("Удалить навсегда", onClick = { vm.deleteUser(user.id); deleteDialog = null }, variant = ButtonVariant.Danger)
            },
            dismissButton = {
                CuButton("Отмена", onClick = { deleteDialog = null }, variant = ButtonVariant.Ghost)
            },
            containerColor = CuTheme.colors.paper
        )
    }
}

/* ─── Общие диалоги ─── */
@Composable
private fun ReasonDialog(
    title: String,
    label: String,
    confirmText: String,
    onDismiss: () -> Unit,
    onConfirm: (String) -> Unit
) {
    var reason by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title, color = CuTheme.colors.ink) },
        text = {
            CuInput(
                value = reason,
                onValueChange = { reason = it },
                label = label,
                placeholder = "Введите причину..."
            )
        },
        confirmButton = {
            CuButton(confirmText, onClick = {
                if (reason.isNotBlank()) onConfirm(reason)
            }, variant = ButtonVariant.Danger)
        },
        dismissButton = {
            CuButton("Отмена", onClick = onDismiss, variant = ButtonVariant.Ghost)
        },
        containerColor = CuTheme.colors.paper
    )
}

@Composable
private fun BanUserDialog(
    userName: String,
    onDismiss: () -> Unit,
    onBan: (reason: String, days: Int?) -> Unit
) {
    var reason by remember { mutableStateOf("") }
    var daysText by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Заблокировать $userName", color = CuTheme.colors.ink) },
        text = {
            Column {
                CuInput(
                    value = reason,
                    onValueChange = { reason = it },
                    label = "Причина блокировки",
                    placeholder = "Укажите причину"
                )
                Spacer(Modifier.height(8.dp))
                CuInput(
                    value = daysText,
                    onValueChange = { daysText = it.filter { ch -> ch.isDigit() } },
                    label = "Срок в днях (пусто = бессрочно)",
                    placeholder = "0 = навсегда"
                )
            }
        },
        confirmButton = {
            CuButton("Заблокировать", onClick = {
                if (reason.isNotBlank()) onBan(reason, daysText.toIntOrNull())
            }, variant = ButtonVariant.Danger)
        },
        dismissButton = {
            CuButton("Отмена", onClick = onDismiss, variant = ButtonVariant.Ghost)
        },
        containerColor = CuTheme.colors.paper
    )
}
