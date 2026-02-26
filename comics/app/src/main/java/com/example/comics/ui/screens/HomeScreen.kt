package com.example.comics.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import com.example.comics.data.models.Comic
import com.example.comics.ui.components.*
import com.example.comics.ui.theme.CuTheme
import com.example.comics.ui.viewmodels.HomeViewModel

@Composable
fun HomeScreen(
    onNavigateLibrary: () -> Unit,
    onNavigateLogin: () -> Unit,
    onNavigateComic: (String) -> Unit,
    isLoggedIn: Boolean,
    vm: HomeViewModel = viewModel()
) {
    val featured by vm.featured.collectAsState()
    val stats by vm.stats.collectAsState()
    val isLoading by vm.isLoading.collectAsState()

    if (isLoading && featured.isEmpty()) {
        LoadingScreen()
        return
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .background(CuTheme.colors.bg)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            CuTheme.colors.accent.copy(alpha = 0.08f),
                            CuTheme.colors.bg
                        )
                    )
                )
                .padding(horizontal = 20.dp, vertical = 48.dp)
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    "Твоя история",
                    style = MaterialTheme.typography.displaySmall,
                    fontWeight = FontWeight.ExtraBold,
                    color = CuTheme.colors.ink,
                    textAlign = TextAlign.Center
                )
                Text(
                    "Твои решения",
                    style = MaterialTheme.typography.displaySmall,
                    fontWeight = FontWeight.ExtraBold,
                    color = CuTheme.colors.inkSoft,
                    textAlign = TextAlign.Center
                )
                Spacer(Modifier.height(16.dp))
                Text(
                    "Comic Universe — это платформа интерактивных комиксов с сюжетом. " +
                            "Создавайте свои истории, где каждый выбор меняет ход событий.",
                    style = MaterialTheme.typography.bodyLarge,
                    color = CuTheme.colors.inkSoft,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(horizontal = 12.dp)
                )
                Spacer(Modifier.height(28.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    CuButton("Начать читать", onClick = onNavigateLibrary, icon = Icons.Default.MenuBook)
                    if (!isLoggedIn) {
                        CuButton("Войти", onClick = onNavigateLogin, variant = ButtonVariant.Secondary, icon = Icons.Default.Login)
                    }
                }
            }
        }

        stats?.let { s ->
            Spacer(Modifier.height(8.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                KpiCard("${s.totalComics}+", "Комиксов", Icons.Default.MenuBook, Modifier.weight(1f))
                KpiCard("${s.totalReaders}+", "Читателей", Icons.Default.People, Modifier.weight(1f))
            }
            Spacer(Modifier.height(8.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                KpiCard("${s.totalPages}+", "Сцен", Icons.Default.Layers, Modifier.weight(1f))
                KpiCard("${s.totalPaths}+", "Сюжетных путей", Icons.Default.AccountTree, Modifier.weight(1f))
            }
        }

        Spacer(Modifier.height(40.dp))
        Text(
            "Почему Comic Universe?",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            color = CuTheme.colors.ink,
            textAlign = TextAlign.Center,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
        )
        Spacer(Modifier.height(20.dp))
        Column(
            modifier = Modifier.padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            FeatureCard(
                icon = Icons.Default.Bolt,
                title = "Живой сюжет",
                description = "Каждый комикс — это история, которая реагирует на ваши действия. Никаких рельсов, только ваш путь."
            )
            FeatureCard(
                icon = Icons.Default.Layers,
                title = "Выбор за вами",
                description = "В каждом комиксе вы принимаете решения, которые ведут к разным концовкам. Можно перечитывать и открывать новые сюжеты."
            )
            FeatureCard(
                icon = Icons.Default.Smartphone,
                title = "Удобно везде",
                description = "Читайте на телефоне, планшете или компьютере — интерфейс подстраивается под любой экран."
            )
        }

        if (featured.isNotEmpty()) {
            Spacer(Modifier.height(40.dp))
            Text(
                "Популярные сейчас",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = CuTheme.colors.ink,
                textAlign = TextAlign.Center,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp)
            )
            Spacer(Modifier.height(20.dp))

            val top3 = featured.take(3)
            val ordered = if (top3.size >= 3) listOf(top3[1], top3[0], top3[2]) else top3
            val ranks = if (top3.size >= 3) listOf(2, 1, 3) else top3.indices.map { it + 1 }

            Column(
                modifier = Modifier.padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                ordered.forEachIndexed { index, comic ->
                    PopularComicCard(
                        comic = comic,
                        rank = ranks[index],
                        isHero = index == 1,
                        onClick = { onNavigateComic(comic.id) }
                    )
                }
            }
        } else {
            Spacer(Modifier.height(40.dp))
            CuEmptyState(
                icon = Icons.Default.AutoStories,
                title = "Скоро здесь появятся лучшие истории",
                subtitle = "Станьте одним из первых авторов!"
            )
        }

        Spacer(Modifier.height(40.dp))
    }
}

@Composable
private fun KpiCard(
    value: String,
    label: String,
    icon: ImageVector,
    modifier: Modifier = Modifier
) {
    CuCard(modifier = modifier) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                icon, null,
                tint = CuTheme.colors.accent,
                modifier = Modifier.size(28.dp)
            )
            Spacer(Modifier.height(8.dp))
            Text(
                value,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = CuTheme.colors.ink,
                textAlign = TextAlign.Center
            )
            Text(
                label,
                style = MaterialTheme.typography.labelMedium,
                color = CuTheme.colors.inkSoft,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
private fun FeatureCard(
    icon: ImageVector,
    title: String,
    description: String
) {
    CuCard {
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.Top) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .background(CuTheme.colors.accentSoft, RoundedCornerShape(10.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    icon, null,
                    tint = CuTheme.colors.accent,
                    modifier = Modifier.size(24.dp)
                )
            }
            Spacer(Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = CuTheme.colors.ink
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    description,
                    style = MaterialTheme.typography.bodyMedium,
                    color = CuTheme.colors.inkSoft
                )
            }
        }
    }
}

@Composable
private fun PopularComicCard(
    comic: Comic,
    rank: Int,
    isHero: Boolean,
    onClick: () -> Unit
) {
    CuCard(onClick = onClick) {
        Box {
            Column {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(if (isHero) 220.dp else 180.dp)
                ) {
                    AsyncImage(
                        model = comic.coverImage,
                        contentDescription = comic.title,
                        modifier = Modifier
                            .fillMaxSize()
                            .clip(RoundedCornerShape(topStart = 12.dp, topEnd = 12.dp)),
                        contentScale = ContentScale.Crop
                    )
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(
                                Brush.verticalGradient(
                                    colors = listOf(
                                        CuTheme.colors.paper.copy(alpha = 0f),
                                        CuTheme.colors.paper.copy(alpha = 0.6f)
                                    ),
                                    startY = 100f
                                )
                            )
                    )
                }
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        comic.title,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                        color = CuTheme.colors.ink
                    )
                    if (!comic.description.isNullOrBlank()) {
                        Spacer(Modifier.height(6.dp))
                        Text(
                            comic.description,
                            style = MaterialTheme.typography.bodyMedium,
                            maxLines = 3,
                            overflow = TextOverflow.Ellipsis,
                            color = CuTheme.colors.inkSoft
                        )
                    }
                    Spacer(Modifier.height(10.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        CuTag("${comic.readCount} чтений", color = CuTheme.colors.inkFaint)
                        CuTag("Рейтинг ${String.format("%.1f", comic.rating)}")
                    }
                }
            }

            Box(
                modifier = Modifier
                    .padding(12.dp)
                    .size(36.dp)
                    .background(CuTheme.colors.accent, CircleShape)
                    .align(Alignment.TopStart),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    "#$rank",
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Bold,
                    color = CuTheme.colors.paper
                )
            }
        }
    }
}
