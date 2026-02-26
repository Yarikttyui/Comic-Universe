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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.comics.ui.components.*
import com.example.comics.ui.theme.CuTheme
import com.example.comics.ui.viewmodels.CreatorViewModel

@Composable
fun CreatorStudioScreen(
    onNavigateComic: (String) -> Unit,
    vm: CreatorViewModel = viewModel()
) {
    val comics by vm.comics.collectAsState()
    val isLoading by vm.isLoading.collectAsState()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(CuTheme.colors.bg),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text(
                "Моя студия",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = CuTheme.colors.ink
            )
        }

        item {
            CuCard {
                Row(
                    modifier = Modifier.padding(16.dp).fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.Info,
                        null,
                        tint = CuTheme.colors.accent,
                        modifier = Modifier.size(32.dp)
                    )
                    Spacer(Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            "Редактор комиксов",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = CuTheme.colors.ink
                        )
                        Text(
                            "Создание и редактирование комиксов доступно только в веб и десктоп версии приложения.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = CuTheme.colors.inkSoft
                        )
                        Spacer(Modifier.height(4.dp))
                        Text(
                            "adskoekoleso.ru",
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.Bold,
                            color = CuTheme.colors.accent
                        )
                    }
                }
            }
        }

        if (isLoading && comics.isEmpty()) {
            item { LoadingScreen() }
        } else if (comics.isEmpty()) {
            item {
                CuEmptyState(
                    icon = Icons.Default.Create,
                    title = "Нет комиксов",
                    subtitle = "Создайте свой первый комикс в веб-версии"
                )
            }
        } else {
            item {
                Text(
                    "Мои комиксы (${comics.size})",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = CuTheme.colors.ink
                )
            }
            items(comics) { comic ->
                CuCard {
                    Row(
                        modifier = Modifier.padding(12.dp).fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                comic.title,
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = CuTheme.colors.ink
                            )
                            Spacer(Modifier.height(4.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                CuStatusTag(comic.status ?: "draft")
                                comic.genres?.firstOrNull()?.let { CuTag(it) }
                            }
                        }
                        IconButton(onClick = { onNavigateComic(comic.id) }) {
                            Icon(Icons.Default.Visibility, "Просмотр", tint = CuTheme.colors.accent)
                        }
                    }
                }
            }
        }
    }
}
