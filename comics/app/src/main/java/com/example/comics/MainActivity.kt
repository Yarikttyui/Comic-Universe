package com.example.comics

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.comics.ui.navigation.AppNavigation
import com.example.comics.ui.theme.ComicsTheme
import com.example.comics.ui.viewmodels.AuthViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            val authVm: AuthViewModel = viewModel()
            val isDark by authVm.isDark.collectAsState()

            ComicsTheme(darkTheme = isDark) {
                AppNavigation(authVm = authVm)
            }
        }
    }
}