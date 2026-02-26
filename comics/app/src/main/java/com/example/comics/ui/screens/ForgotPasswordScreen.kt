package com.example.comics.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.example.comics.ui.components.*
import com.example.comics.ui.theme.CuTheme
import com.example.comics.ui.viewmodels.AuthViewModel

@Composable
fun ForgotPasswordScreen(
    authVm: AuthViewModel,
    onNavigateBack: () -> Unit
) {
    val isLoading by authVm.isLoading.collectAsState()
    val error by authVm.error.collectAsState()

    var email by remember { mutableStateOf("") }
    var sent by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(CuTheme.colors.bg),
        contentAlignment = Alignment.Center
    ) {
        IconButton(
            onClick = onNavigateBack,
            modifier = Modifier
                .align(Alignment.TopStart)
                .padding(8.dp)
        ) {
            Icon(Icons.Default.ArrowBack, "Назад", tint = CuTheme.colors.ink)
        }

        CuCard(
            modifier = Modifier
                .widthIn(max = 400.dp)
                .padding(24.dp)
        ) {
            Column(modifier = Modifier.padding(24.dp)) {
                if (sent) {
                    Icon(
                        Icons.Default.MarkEmailRead,
                        null,
                        modifier = Modifier
                            .size(64.dp)
                            .align(Alignment.CenterHorizontally),
                        tint = CuTheme.colors.ok
                    )
                    Spacer(Modifier.height(16.dp))
                    Text(
                        "Письмо отправлено",
                        style = MaterialTheme.typography.headlineSmall,
                        color = CuTheme.colors.ink,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "Если аккаунт с таким email существует, мы отправили ссылку для сброса пароля.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = CuTheme.colors.inkSoft,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(Modifier.height(24.dp))
                    CuButton(
                        "Вернуться ко входу",
                        onClick = onNavigateBack,
                        modifier = Modifier.fillMaxWidth(),
                        icon = Icons.Default.ArrowBack
                    )
                } else {
                    Text(
                        "Сброс пароля",
                        style = MaterialTheme.typography.headlineMedium,
                        color = CuTheme.colors.ink,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "Введите email, указанный при регистрации",
                        style = MaterialTheme.typography.bodyMedium,
                        color = CuTheme.colors.inkSoft,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(Modifier.height(24.dp))

                    if (error != null) {
                        Surface(
                            color = CuTheme.colors.danger.copy(alpha = 0.1f),
                            shape = MaterialTheme.shapes.small,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                error!!,
                                color = CuTheme.colors.danger,
                                style = MaterialTheme.typography.bodySmall,
                                modifier = Modifier.padding(12.dp)
                            )
                        }
                        Spacer(Modifier.height(12.dp))
                    }

                    CuInput(
                        value = email,
                        onValueChange = { email = it },
                        label = "Email",
                        placeholder = "your@email.com",
                        leadingIcon = { Icon(Icons.Default.Email, null, tint = CuTheme.colors.inkSoft) }
                    )
                    Spacer(Modifier.height(24.dp))

                    CuButton(
                        text = "Отправить ссылку",
                        onClick = {
                            if (email.isNotBlank()) {
                                authVm.forgotPassword(email) { sent = true }
                            }
                        },
                        isLoading = isLoading,
                        modifier = Modifier.fillMaxWidth(),
                        icon = Icons.Default.Send
                    )
                    Spacer(Modifier.height(16.dp))
                    Text(
                        "Вспомнили пароль? Войти",
                        style = MaterialTheme.typography.bodyMedium,
                        color = CuTheme.colors.accent,
                        textAlign = TextAlign.Center,
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onNavigateBack() }
                    )
                }
            }
        }
    }
}
