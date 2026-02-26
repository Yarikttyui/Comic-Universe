package com.example.comics.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.example.comics.ui.components.*
import com.example.comics.ui.theme.CuTheme
import com.example.comics.ui.viewmodels.AuthViewModel

@Composable
fun OnboardingScreen(
    authVm: AuthViewModel,
    onComplete: () -> Unit
) {
    val isLoading by authVm.isLoading.collectAsState()
    var selectedRole by remember { mutableStateOf<String?>(null) }
    var nickname by remember { mutableStateOf("") }
    var step by remember { mutableIntStateOf(0) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(CuTheme.colors.bg),
        contentAlignment = Alignment.Center
    ) {
        CuCard(modifier = Modifier.widthIn(max = 420.dp).padding(24.dp)) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                when (step) {
                    0 -> {
                        Text(
                            "Добро пожаловать!",
                            style = MaterialTheme.typography.headlineMedium,
                            fontWeight = FontWeight.Bold,
                            color = CuTheme.colors.ink
                        )
                        Spacer(Modifier.height(8.dp))
                        Text(
                            "Выберите вашу роль",
                            style = MaterialTheme.typography.bodyLarge,
                            color = CuTheme.colors.inkSoft,
                            textAlign = TextAlign.Center
                        )
                        Spacer(Modifier.height(24.dp))

                        RoleOption(
                            title = "Читатель",
                            description = "Читайте комиксы, ставьте оценки",
                            icon = Icons.Default.MenuBook,
                            isSelected = selectedRole == "reader",
                            onClick = { selectedRole = "reader" }
                        )
                        Spacer(Modifier.height(8.dp))
                        RoleOption(
                            title = "Создатель",
                            description = "Создавайте свои комиксы",
                            icon = Icons.Default.Brush,
                            isSelected = selectedRole == "creator",
                            onClick = { selectedRole = "creator" }
                        )
                        Spacer(Modifier.height(24.dp))
                        CuButton(
                            text = "Далее",
                            onClick = {
                                selectedRole?.let { role ->
                                    authVm.selectRole(role) { step = 1 }
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            isLoading = isLoading
                        )
                    }
                    1 -> {
                        Text(
                            "Готово!",
                            style = MaterialTheme.typography.headlineMedium,
                            fontWeight = FontWeight.Bold,
                            color = CuTheme.colors.ink
                        )
                        Spacer(Modifier.height(24.dp))
                        Text(
                            "Добро пожаловать в Comic Universe!",
                            style = MaterialTheme.typography.bodyLarge,
                            color = CuTheme.colors.inkSoft,
                            textAlign = TextAlign.Center
                        )
                        Spacer(Modifier.height(24.dp))
                        CuButton(
                            text = "Начать",
                            onClick = { authVm.completeOnboarding { onComplete() } },
                            isLoading = isLoading,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun RoleOption(
    title: String,
    description: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val bg = if (isSelected) CuTheme.colors.accent.copy(alpha = 0.1f) else CuTheme.colors.paper
    val border = if (isSelected) CuTheme.colors.accent else CuTheme.colors.border

    Surface(
        onClick = onClick,
        shape = MaterialTheme.shapes.medium,
        color = bg,
        border = androidx.compose.foundation.BorderStroke(2.dp, border),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(icon, null, tint = CuTheme.colors.accent, modifier = Modifier.size(32.dp))
            Spacer(Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(title, style = MaterialTheme.typography.titleMedium, color = CuTheme.colors.ink)
                Text(description, style = MaterialTheme.typography.bodySmall, color = CuTheme.colors.inkSoft)
            }
            if (isSelected) {
                Icon(Icons.Default.CheckCircle, null, tint = CuTheme.colors.accent)
            }
        }
    }
}
