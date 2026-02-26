package com.example.comics.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.comics.ui.theme.CuTheme

@Composable
fun CuButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    isLoading: Boolean = false,
    icon: ImageVector? = null,
    variant: ButtonVariant = ButtonVariant.Primary
) {
    val colors = when (variant) {
        ButtonVariant.Primary -> ButtonDefaults.buttonColors(
            containerColor = CuTheme.colors.accent,
            contentColor = Color.White
        )
        ButtonVariant.Secondary -> ButtonDefaults.buttonColors(
            containerColor = CuTheme.colors.surfaceSoft,
            contentColor = CuTheme.colors.ink
        )
        ButtonVariant.Danger -> ButtonDefaults.buttonColors(
            containerColor = CuTheme.colors.danger,
            contentColor = Color.White
        )
        ButtonVariant.Ghost -> ButtonDefaults.buttonColors(
            containerColor = Color.Transparent,
            contentColor = CuTheme.colors.accent
        )
    }

    Button(
        onClick = onClick,
        modifier = modifier.height(48.dp),
        enabled = enabled && !isLoading,
        colors = colors,
        shape = RoundedCornerShape(12.dp),
        contentPadding = PaddingValues(horizontal = 20.dp)
    ) {
        if (isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.size(20.dp),
                color = LocalContentColor.current,
                strokeWidth = 2.dp
            )
        } else {
            if (icon != null) {
                Icon(icon, null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
            }
            Text(text, fontWeight = FontWeight.Medium, fontSize = 14.sp)
        }
    }
}

enum class ButtonVariant { Primary, Secondary, Danger, Ghost }

@Composable
fun CuCard(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit
) {
    val shape = RoundedCornerShape(12.dp)
    if (onClick != null) {
        Card(
            onClick = onClick,
            modifier = modifier,
            shape = shape,
            colors = CardDefaults.cardColors(containerColor = CuTheme.colors.paper),
            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
        ) {
            content()
        }
    } else {
        Card(
            modifier = modifier,
            shape = shape,
            colors = CardDefaults.cardColors(containerColor = CuTheme.colors.paper),
            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
        ) {
            content()
        }
    }
}

@Composable
fun CuInput(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    label: String? = null,
    placeholder: String? = null,
    isPassword: Boolean = false,
    isError: Boolean = false,
    errorText: String? = null,
    singleLine: Boolean = true,
    leadingIcon: @Composable (() -> Unit)? = null,
    maxLines: Int = if (singleLine) 1 else 5
) {
    Column(modifier = modifier) {
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier.fillMaxWidth(),
            label = label?.let { { Text(it) } },
            placeholder = placeholder?.let { { Text(it, color = CuTheme.colors.inkFaint) } },
            isError = isError,
            singleLine = singleLine,
            maxLines = maxLines,
            leadingIcon = leadingIcon,
            shape = RoundedCornerShape(12.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = CuTheme.colors.accent,
                unfocusedBorderColor = CuTheme.colors.line,
                focusedContainerColor = CuTheme.colors.paper,
                unfocusedContainerColor = CuTheme.colors.paper,
                cursorColor = CuTheme.colors.accent
            ),
            visualTransformation = if (isPassword)
                androidx.compose.ui.text.input.PasswordVisualTransformation()
            else androidx.compose.ui.text.input.VisualTransformation.None
        )
        if (isError && errorText != null) {
            Text(
                errorText,
                color = CuTheme.colors.danger,
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(start = 4.dp, top = 4.dp)
            )
        }
    }
}

@Composable
fun CuTag(
    text: String,
    modifier: Modifier = Modifier,
    color: Color = CuTheme.colors.accent
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(6.dp),
        color = color.copy(alpha = 0.12f)
    ) {
        Text(
            text,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            color = color,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Medium
        )
    }
}

@Composable
fun CuStatusTag(status: String, modifier: Modifier = Modifier) {
    val (color, label) = when (status) {
        "published" -> CuTheme.colors.ok to "Опубликован"
        "draft" -> CuTheme.colors.inkFaint to "Черновик"
        "pending_review" -> CuTheme.colors.warn to "На проверке"
        "rejected" -> CuTheme.colors.danger to "Отклонён"
        "approved" -> CuTheme.colors.ok to "Одобрен"
        "pending" -> CuTheme.colors.warn to "Ожидает"
        "open" -> CuTheme.colors.warn to "Открыт"
        "resolved" -> CuTheme.colors.ok to "Решён"
        else -> CuTheme.colors.inkFaint to status
    }
    CuTag(text = label, color = color, modifier = modifier)
}

@Composable
fun CuEmptyState(
    icon: ImageVector = Icons.Default.Inbox,
    title: String,
    subtitle: String? = null,
    modifier: Modifier = Modifier,
    action: @Composable (() -> Unit)? = null
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(48.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            icon, null,
            modifier = Modifier.size(48.dp),
            tint = CuTheme.colors.inkFaint
        )
        Spacer(Modifier.height(16.dp))
        Text(
            title,
            style = MaterialTheme.typography.titleMedium,
            color = CuTheme.colors.ink
        )
        if (subtitle != null) {
            Spacer(Modifier.height(8.dp))
            Text(
                subtitle,
                style = MaterialTheme.typography.bodyMedium,
                color = CuTheme.colors.inkSoft
            )
        }
        if (action != null) {
            Spacer(Modifier.height(16.dp))
            action()
        }
    }
}

@Composable
fun ComicCardCompact(
    comic: com.example.comics.data.models.Comic,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    CuCard(onClick = onClick, modifier = modifier.fillMaxWidth()) {
        Row(modifier = Modifier.padding(12.dp)) {
            AsyncImage(
                model = comic.coverImage,
                contentDescription = comic.title,
                modifier = Modifier
                    .size(80.dp, 100.dp)
                    .clip(RoundedCornerShape(8.dp)),
                contentScale = ContentScale.Crop
            )
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    comic.title,
                    style = MaterialTheme.typography.titleMedium,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    color = CuTheme.colors.ink
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    comic.authorName ?: "",
                    style = MaterialTheme.typography.bodySmall,
                    color = CuTheme.colors.inkSoft
                )
                Spacer(Modifier.height(8.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Default.Star, null,
                        modifier = Modifier.size(14.dp),
                        tint = CuTheme.colors.warn
                    )
                    Spacer(Modifier.width(4.dp))
                    Text(
                        String.format("%.1f", comic.rating),
                        style = MaterialTheme.typography.labelSmall,
                        color = CuTheme.colors.inkSoft
                    )
                    Spacer(Modifier.width(12.dp))
                    Icon(
                        Icons.Default.Visibility, null,
                        modifier = Modifier.size(14.dp),
                        tint = CuTheme.colors.inkFaint
                    )
                    Spacer(Modifier.width(4.dp))
                    Text(
                        "${comic.readCount}",
                        style = MaterialTheme.typography.labelSmall,
                        color = CuTheme.colors.inkSoft
                    )
                }
                Spacer(Modifier.height(6.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    comic.genres?.take(2)?.forEach { genre ->
                        CuTag(genre)
                    }
                }
            }
        }
    }
}

@Composable
fun ComicCardLarge(
    comic: com.example.comics.data.models.Comic,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    CuCard(onClick = onClick, modifier = modifier.fillMaxWidth()) {
        AsyncImage(
            model = comic.coverImage,
            contentDescription = comic.title,
            modifier = Modifier
                .fillMaxWidth()
                .height(200.dp)
                .clip(RoundedCornerShape(topStart = 12.dp, topEnd = 12.dp)),
            contentScale = ContentScale.Crop
        )
        Column(modifier = Modifier.padding(12.dp)) {
            Text(
                comic.title,
                style = MaterialTheme.typography.titleSmall,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                color = CuTheme.colors.ink,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(Modifier.height(6.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Default.Star, null,
                    modifier = Modifier.size(14.dp),
                    tint = CuTheme.colors.warn
                )
                Spacer(Modifier.width(4.dp))
                Text(
                    String.format("%.1f", comic.rating),
                    style = MaterialTheme.typography.labelSmall,
                    color = CuTheme.colors.inkSoft
                )
                Spacer(Modifier.width(8.dp))
                Icon(
                    Icons.Default.Visibility, null,
                    modifier = Modifier.size(14.dp),
                    tint = CuTheme.colors.inkFaint
                )
                Spacer(Modifier.width(4.dp))
                Text(
                    "${comic.readCount}",
                    style = MaterialTheme.typography.labelSmall,
                    color = CuTheme.colors.inkSoft
                )
            }
        }
    }
}

@Composable
fun LoadingScreen(modifier: Modifier = Modifier) {
    Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator(color = CuTheme.colors.accent)
    }
}

@Composable
fun ErrorScreen(
    message: String,
    onRetry: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxSize().padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            Icons.Default.ErrorOutline, null,
            modifier = Modifier.size(48.dp),
            tint = CuTheme.colors.danger
        )
        Spacer(Modifier.height(16.dp))
        Text(message, style = MaterialTheme.typography.bodyLarge, color = CuTheme.colors.ink)
        if (onRetry != null) {
            Spacer(Modifier.height(16.dp))
            CuButton("Повторить", onClick = onRetry, variant = ButtonVariant.Secondary)
        }
    }
}

@Composable
fun UserAvatar(
    avatarUrl: String?,
    displayName: String?,
    size: Int = 40,
    modifier: Modifier = Modifier
) {
    if (avatarUrl != null) {
        AsyncImage(
            model = avatarUrl,
            contentDescription = displayName,
            modifier = modifier
                .size(size.dp)
                .clip(CircleShape),
            contentScale = ContentScale.Crop
        )
    } else {
        Box(
            modifier = modifier
                .size(size.dp)
                .clip(CircleShape)
                .background(CuTheme.colors.accentSoft),
            contentAlignment = Alignment.Center
        ) {
            Text(
                (displayName?.firstOrNull() ?: '?').uppercase(),
                color = CuTheme.colors.accent,
                fontWeight = FontWeight.Bold,
                fontSize = (size / 2.5).sp
            )
        }
    }
}
