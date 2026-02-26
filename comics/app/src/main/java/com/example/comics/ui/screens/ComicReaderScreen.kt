package com.example.comics.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.example.comics.data.models.ChoiceItem
import com.example.comics.data.models.ComicPage
import com.example.comics.data.remote.ApiClient
import com.example.comics.ui.components.*
import com.example.comics.ui.theme.CuTheme
import com.example.comics.ui.viewmodels.ComicReaderViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ComicReaderScreen(
    comicId: String,
    onNavigateBack: () -> Unit,
    vm: ComicReaderViewModel
) {
    val pages by vm.pages.collectAsState()
    val currentIndex by vm.currentPageIndex.collectAsState()
    val isLoading by vm.isLoading.collectAsState()
    val isEnding by vm.isEnding.collectAsState()
    val error by vm.error.collectAsState()

    LaunchedEffect(comicId) { vm.load(comicId) }

    if (isLoading && pages.isEmpty()) {
        LoadingScreen()
        return
    }

    if (error != null) {
        ErrorScreen(error!!, onRetry = { vm.load(comicId) })
        return
    }

    if (pages.isEmpty()) {
        ErrorScreen("Нет страниц для отображения", onRetry = { onNavigateBack() })
        return
    }

    val currentPage = pages.getOrNull(currentIndex)

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "Стр. ${currentIndex + 1} / ${pages.size}",
                        color = CuTheme.colors.ink
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, "Назад", tint = CuTheme.colors.ink)
                    }
                },
                actions = {
                    IconButton(onClick = { vm.restart(comicId) }) {
                        Icon(Icons.Default.Refresh, "Начать заново", tint = CuTheme.colors.inkSoft)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = CuTheme.colors.paper)
            )
        },
        bottomBar = {
            Surface(color = CuTheme.colors.paper, shadowElevation = 8.dp) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(
                        onClick = { vm.goBack() },
                        enabled = currentIndex > 0
                    ) {
                        Icon(
                            Icons.Default.NavigateBefore,
                            "Назад",
                            tint = if (currentIndex > 0) CuTheme.colors.accent else CuTheme.colors.border,
                            modifier = Modifier.size(32.dp)
                        )
                    }
                    LinearProgressIndicator(
                        progress = { (currentIndex + 1).toFloat() / pages.size },
                        modifier = Modifier.weight(1f).height(4.dp).padding(horizontal = 16.dp),
                        color = CuTheme.colors.accent,
                        trackColor = CuTheme.colors.border
                    )
                    IconButton(
                        onClick = { vm.nextPage() },
                        enabled = currentIndex < pages.size - 1 && currentPage?.choices.isNullOrEmpty()
                    ) {
                        Icon(
                            Icons.Default.NavigateNext,
                            "Вперёд",
                            tint = if (currentIndex < pages.size - 1 && currentPage?.choices.isNullOrEmpty())
                                CuTheme.colors.accent else CuTheme.colors.border,
                            modifier = Modifier.size(32.dp)
                        )
                    }
                }
            }
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(CuTheme.colors.bg)
                .pointerInput(currentIndex) {
                    detectHorizontalDragGestures { _, dragAmount ->
                        if (dragAmount < -50 && currentIndex < pages.size - 1 && currentPage?.choices.isNullOrEmpty()) {
                            vm.nextPage()
                        } else if (dragAmount > 50 && currentIndex > 0) {
                            vm.goBack()
                        }
                    }
                }
        ) {
            if (isEnding) {
                EndingView(onRestart = { vm.restart(comicId) }, onBack = onNavigateBack)
            } else {
                currentPage?.let { page ->
                    PageContent(page = page, onChoice = { choice -> vm.makeChoice(comicId, choice) })
                }
            }
        }
    }
}

@Composable
private fun PageContent(page: ComicPage, onChoice: (ChoiceItem) -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
    ) {
        page.panels?.forEach { panel ->
            val imageUrl = panel.imageUrl?.let {
                if (it.startsWith("http")) it else "${ApiClient.baseUrl.removeSuffix("/api/v1/")}$it"
            }
            if (imageUrl != null) {
                AsyncImage(
                    model = ImageRequest.Builder(LocalContext.current)
                        .data(imageUrl)
                        .crossfade(true)
                        .build(),
                    contentDescription = "Панель",
                    contentScale = ContentScale.FillWidth,
                    modifier = Modifier.fillMaxWidth()
                )
            }
            panel.dialogues?.forEach { dialogue ->
                Surface(
                    color = CuTheme.colors.paper,
                    shape = MaterialTheme.shapes.medium,
                    shadowElevation = 1.dp,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 4.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        if (!dialogue.character.isNullOrBlank()) {
                            Text(
                                dialogue.character,
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold,
                                color = CuTheme.colors.accent
                            )
                            Spacer(Modifier.height(2.dp))
                        }
                        Text(
                            dialogue.text ?: "",
                            style = MaterialTheme.typography.bodyMedium,
                            color = CuTheme.colors.ink
                        )
                    }
                }
            }
        }

        if (!page.choices.isNullOrEmpty()) {
            Spacer(Modifier.height(16.dp))
            Text(
                "Сделайте выбор:",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = CuTheme.colors.ink,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(Modifier.height(8.dp))
            page.choices.forEach { choice ->
                CuButton(
                    text = choice.text ?: "Вариант",
                    onClick = { onChoice(choice) },
                    variant = ButtonVariant.Secondary,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 4.dp)
                )
            }
        }
        Spacer(Modifier.height(16.dp))
    }
}

@Composable
private fun EndingView(onRestart: () -> Unit, onBack: () -> Unit) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        CuCard(modifier = Modifier.padding(32.dp)) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(
                    Icons.Default.EmojiEvents,
                    null,
                    tint = CuTheme.colors.warning,
                    modifier = Modifier.size(64.dp)
                )
                Spacer(Modifier.height(16.dp))
                Text(
                    "Конец истории!",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    color = CuTheme.colors.ink
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    "Вы достигли одной из концовок. Попробуйте другие варианты!",
                    style = MaterialTheme.typography.bodyMedium,
                    color = CuTheme.colors.inkSoft,
                    textAlign = TextAlign.Center
                )
                Spacer(Modifier.height(24.dp))
                CuButton("Начать заново", onClick = onRestart, icon = Icons.Default.Refresh)
                Spacer(Modifier.height(8.dp))
                CuButton("К списку", onClick = onBack, variant = ButtonVariant.Secondary, icon = Icons.Default.ArrowBack)
            }
        }
    }
}
