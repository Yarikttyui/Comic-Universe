package com.example.comics.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

@Immutable
data class CuColors(
    val bg: Color,
    val bgElevated: Color,
    val paper: Color,
    val surface: Color,
    val surfaceSoft: Color,
    val surfaceMuted: Color,
    val ink: Color,
    val inkSoft: Color,
    val inkFaint: Color,
    val line: Color,
    val lineStrong: Color,
    val accent: Color,
    val accentStrong: Color,
    val accentSoft: Color,
    val ok: Color,
    val warn: Color,
    val danger: Color
) {
    val border: Color get() = line
    val warning: Color get() = warn
}

val LightCuColors = CuColors(
    bg = LightBg, bgElevated = LightBgElevated, paper = LightPaper,
    surface = LightSurface, surfaceSoft = LightSurfaceSoft, surfaceMuted = LightSurfaceMuted,
    ink = LightInk, inkSoft = LightInkSoft, inkFaint = LightInkFaint,
    line = LightLine, lineStrong = LightLineStrong,
    accent = LightAccent, accentStrong = LightAccentStrong, accentSoft = LightAccentSoft,
    ok = LightOk, warn = LightWarn, danger = LightDanger
)

val DarkCuColors = CuColors(
    bg = DarkBg, bgElevated = DarkBgElevated, paper = DarkPaper,
    surface = DarkSurface, surfaceSoft = DarkSurfaceSoft, surfaceMuted = DarkSurfaceMuted,
    ink = DarkInk, inkSoft = DarkInkSoft, inkFaint = DarkInkFaint,
    line = DarkLine, lineStrong = DarkLineStrong,
    accent = DarkAccent, accentStrong = DarkAccentStrong, accentSoft = DarkAccentSoft,
    ok = DarkOk, warn = DarkWarn, danger = DarkDanger
)

val LocalCuColors = staticCompositionLocalOf { LightCuColors }

private val DarkColorScheme = darkColorScheme(
    primary = DarkAccent,
    onPrimary = DarkBg,
    primaryContainer = DarkAccentSoft,
    secondary = DarkInkSoft,
    background = DarkBg,
    surface = DarkSurface,
    surfaceVariant = DarkSurfaceSoft,
    onBackground = DarkInk,
    onSurface = DarkInk,
    onSurfaceVariant = DarkInkSoft,
    outline = DarkLine,
    outlineVariant = DarkLineStrong,
    error = DarkDanger
)

private val LightColorScheme = lightColorScheme(
    primary = LightAccent,
    onPrimary = LightPaper,
    primaryContainer = LightAccentSoft,
    secondary = LightInkSoft,
    background = LightBg,
    surface = LightPaper,
    surfaceVariant = LightSurfaceSoft,
    onBackground = LightInk,
    onSurface = LightInk,
    onSurfaceVariant = LightInkSoft,
    outline = LightLine,
    outlineVariant = LightLineStrong,
    error = LightDanger
)

@Composable
fun ComicsTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    val cuColors = if (darkTheme) DarkCuColors else LightCuColors

    CompositionLocalProvider(LocalCuColors provides cuColors) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = Typography,
            content = content
        )
    }
}

object CuTheme {
    val colors: CuColors
        @Composable get() = LocalCuColors.current
}