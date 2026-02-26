package com.example.comics.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.grid.rememberLazyGridState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import com.example.comics.ui.components.*
import com.example.comics.ui.theme.CuTheme
import com.example.comics.ui.viewmodels.LibraryViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LibraryScreen(
    onNavigateComic: (String) -> Unit,
    isLoggedIn: Boolean = true,
    onNavigateLogin: () -> Unit = {},
    vm: LibraryViewModel = viewModel()
) {
    if (!isLoggedIn) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(CuTheme.colors.bg),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(
                    Icons.Default.Lock,
                    contentDescription = null,
                    modifier = Modifier.size(64.dp),
                    tint = CuTheme.colors.inkSoft
                )
                Spacer(Modifier.height(16.dp))
                Text(
                    "Авторизуйтесь",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    color = CuTheme.colors.ink
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    "Для доступа к библиотеке комиксов\nнеобходимо войти в аккаунт",
                    style = MaterialTheme.typography.bodyMedium,
                    color = CuTheme.colors.inkSoft,
                    textAlign = TextAlign.Center
                )
                Spacer(Modifier.height(24.dp))
                CuButton(
                    text = "Войти",
                    onClick = onNavigateLogin,
                    icon = Icons.Default.Login
                )
            }
        }
        return
    }
    val comics by vm.comics.collectAsState()
    val isLoading by vm.isLoading.collectAsState()
    val searchQuery by vm.search.collectAsState()
    val selectedGenre by vm.selectedGenre.collectAsState()
    val hasMore by vm.hasMore.collectAsState()
    val gridState = rememberLazyGridState()

    val genres = listOf("Все", "Супергерои", "Фэнтези", "Sci-Fi", "Хоррор", "Детектив", "Комедия", "Приключения", "Драма")

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(CuTheme.colors.bg)
    ) {
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = CuTheme.colors.paper,
            shadowElevation = 2.dp
        ) {
            Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)) {
                CuInput(
                    value = searchQuery,
                    onValueChange = { vm.setSearch(it) },
                    placeholder = "Поиск комиксов...",
                    leadingIcon = { Icon(Icons.Default.Search, null, tint = CuTheme.colors.inkSoft) }
                )
                Spacer(Modifier.height(8.dp))

                var expanded by remember { mutableStateOf(false) }
                ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = it }) {
                    OutlinedTextField(
                        value = selectedGenre ?: "Все жанры",
                        onValueChange = {},
                        readOnly = true,
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor(),
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = CuTheme.colors.accent,
                            unfocusedBorderColor = CuTheme.colors.border
                        ),
                        textStyle = MaterialTheme.typography.bodyMedium.copy(color = CuTheme.colors.ink)
                    )
                    ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                        genres.forEach { genre ->
                            DropdownMenuItem(
                                text = { Text(genre) },
                                onClick = {
                                    vm.setGenre(if (genre == "Все") null else genre)
                                    expanded = false
                                }
                            )
                        }
                    }
                }
            }
        }

        if (isLoading && comics.isEmpty()) {
            LoadingScreen()
        } else if (comics.isEmpty()) {
            CuEmptyState(
                icon = Icons.Default.SearchOff,
                title = "Ничего не найдено",
                subtitle = "Попробуйте изменить параметры поиска"
            )
        } else {
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                state = gridState,
                contentPadding = PaddingValues(12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(comics) { comic ->
                    ComicCardLarge(comic = comic, onClick = { onNavigateComic(comic.id) })
                }
                if (hasMore) {
                    item {
                        LaunchedEffect(Unit) { vm.loadMore() }
                        Box(
                            modifier = Modifier.fillMaxWidth().padding(16.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            CircularProgressIndicator(color = CuTheme.colors.accent, modifier = Modifier.size(24.dp))
                        }
                    }
                }
            }
        }
    }
}
