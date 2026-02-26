package com.example.comics.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.example.comics.ui.components.*
import com.example.comics.ui.theme.CuTheme
import com.example.comics.ui.viewmodels.AuthViewModel

@Composable
fun LoginScreen(
    authVm: AuthViewModel,
    onNavigateBack: () -> Unit,
    onNavigateRegister: () -> Unit,
    onLoginSuccess: () -> Unit,
    onNavigateForgotPassword: () -> Unit = {}
) {
    val isLoading by authVm.isLoading.collectAsState()
    val error by authVm.error.collectAsState()

    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

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
                Text(
                    "Вход",
                    style = MaterialTheme.typography.headlineMedium,
                    color = CuTheme.colors.ink,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    "Comic Universe",
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
                Spacer(Modifier.height(12.dp))
                CuInput(
                    value = password,
                    onValueChange = { password = it },
                    label = "Пароль",
                    placeholder = "••••••••",
                    isPassword = true,
                    leadingIcon = { Icon(Icons.Default.Lock, null, tint = CuTheme.colors.inkSoft) }
                )
                Spacer(Modifier.height(24.dp))

                CuButton(
                    text = "Войти",
                    onClick = { authVm.login(email, password) { onLoginSuccess() } },
                    isLoading = isLoading,
                    modifier = Modifier.fillMaxWidth(),
                    icon = Icons.Default.Login
                )
                Spacer(Modifier.height(12.dp))
                Text(
                    "Забыли пароль?",
                    style = MaterialTheme.typography.bodyMedium,
                    color = CuTheme.colors.inkSoft,
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onNavigateForgotPassword() }
                )
                Spacer(Modifier.height(16.dp))
                Text(
                    "Нет аккаунта? Зарегистрироваться",
                    style = MaterialTheme.typography.bodyMedium,
                    color = CuTheme.colors.accent,
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onNavigateRegister() }
                )
            }
        }
    }
}

@Composable
fun RegisterScreen(
    authVm: AuthViewModel,
    onNavigateBack: () -> Unit,
    onNavigateLogin: () -> Unit,
    onRegisterSuccess: () -> Unit
) {
    val isLoading by authVm.isLoading.collectAsState()
    val error by authVm.error.collectAsState()

    var email by remember { mutableStateOf("") }
    var nick by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var localError by remember { mutableStateOf<String?>(null) }

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
            Column(
                modifier = Modifier
                    .padding(24.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                Text(
                    "Регистрация",
                    style = MaterialTheme.typography.headlineMedium,
                    color = CuTheme.colors.ink,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(Modifier.height(24.dp))

                val displayError = localError ?: error
                if (displayError != null) {
                    Surface(
                        color = CuTheme.colors.danger.copy(alpha = 0.1f),
                        shape = MaterialTheme.shapes.small,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            displayError,
                            color = CuTheme.colors.danger,
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(12.dp)
                        )
                    }
                    Spacer(Modifier.height(12.dp))
                }

                CuInput(
                    value = email,
                    onValueChange = { email = it; localError = null },
                    label = "Email",
                    placeholder = "your@email.com",
                    leadingIcon = { Icon(Icons.Default.Email, null, tint = CuTheme.colors.inkSoft) }
                )
                Spacer(Modifier.height(12.dp))
                CuInput(
                    value = nick,
                    onValueChange = { nick = it; localError = null },
                    label = "Никнейм",
                    placeholder = "Ваш никнейм",
                    leadingIcon = { Icon(Icons.Default.Person, null, tint = CuTheme.colors.inkSoft) }
                )
                Spacer(Modifier.height(12.dp))
                CuInput(
                    value = password,
                    onValueChange = { password = it; localError = null },
                    label = "Пароль",
                    placeholder = "Мин. 8 символов",
                    isPassword = true,
                    leadingIcon = { Icon(Icons.Default.Lock, null, tint = CuTheme.colors.inkSoft) }
                )
                Spacer(Modifier.height(12.dp))
                CuInput(
                    value = confirmPassword,
                    onValueChange = { confirmPassword = it; localError = null },
                    label = "Подтверждение",
                    placeholder = "Повторите пароль",
                    isPassword = true,
                    leadingIcon = { Icon(Icons.Default.Lock, null, tint = CuTheme.colors.inkSoft) }
                )
                Spacer(Modifier.height(24.dp))

                CuButton(
                    text = "Создать аккаунт",
                    onClick = {
                        when {
                            email.isBlank() || nick.isBlank() || password.isBlank() -> localError = "Заполните все поля"
                            !nick.matches(Regex("^[a-zA-Z0-9_]{3,30}$")) -> localError = "Ник: 3-30 символов (буквы, цифры, _)"
                            password.length < 8 -> localError = "Пароль должен быть не менее 8 символов"
                            password != confirmPassword -> localError = "Пароли не совпадают"
                            else -> authVm.register(email, nick, password, confirmPassword) { onRegisterSuccess() }
                        }
                    },
                    isLoading = isLoading,
                    modifier = Modifier.fillMaxWidth(),
                    icon = Icons.Default.PersonAdd
                )
                Spacer(Modifier.height(16.dp))
                Text(
                    "Уже есть аккаунт? Войти",
                    style = MaterialTheme.typography.bodyMedium,
                    color = CuTheme.colors.accent,
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onNavigateLogin() }
                )
            }
        }
    }
}
