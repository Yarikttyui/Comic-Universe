package com.example.comics.ui.viewmodels

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.comics.data.local.SessionManager
import com.example.comics.data.models.*
import com.example.comics.data.remote.ApiClient
import com.google.gson.Gson
import com.google.gson.JsonObject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class AuthViewModel(app: Application) : AndroidViewModel(app) {

    private val session = SessionManager(app)
    private val api get() = ApiClient.api

    private val _user = MutableStateFlow<User?>(session.getUser())
    val user: StateFlow<User?> = _user

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    private val _isLoggedIn = MutableStateFlow(session.isLoggedIn)
    val isLoggedIn: StateFlow<Boolean> = _isLoggedIn

    private val _isDark = MutableStateFlow(session.isDarkTheme)
    val isDark: StateFlow<Boolean> = _isDark

    init {
        if (session.isLoggedIn) checkAuth()
    }

    fun clearError() { _error.value = null }

    fun toggleTheme() {
        _isDark.value = !_isDark.value
        session.isDarkTheme = _isDark.value
    }

    fun login(email: String, password: String, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            try {
                val resp = api.login(LoginRequest(email, password))
                if (resp.isSuccessful && resp.body()?.success == true) {
                    val data = resp.body()!!.data!!
                    session.saveTokens(data.tokens.accessToken, data.tokens.refreshToken)
                    session.saveUser(data.user)
                    _user.value = data.user
                    _isLoggedIn.value = true
                    onSuccess()
                } else {
                    _error.value = parseErrorBody(resp) ?: "Ошибка входа"
                }
            } catch (e: Exception) {
                _error.value = "Ошибка сети: ${e.localizedMessage}"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun register(email: String, nick: String, password: String, confirm: String, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            if (password != confirm) {
                _error.value = "Пароли не совпадают"
                _isLoading.value = false
                return@launch
            }
            try {
                val resp = api.register(RegisterRequest(email, nick, password, confirm))
                if (resp.isSuccessful && resp.body()?.success == true) {
                    val data = resp.body()!!.data!!
                    session.saveTokens(data.tokens.accessToken, data.tokens.refreshToken)
                    session.saveUser(data.user)
                    _user.value = data.user
                    _isLoggedIn.value = true
                    onSuccess()
                } else {
                    _error.value = parseErrorBody(resp) ?: "Ошибка регистрации"
                }
            } catch (e: Exception) {
                _error.value = "Ошибка сети: ${e.localizedMessage}"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun selectRole(role: String, onSuccess: () -> Unit) {
        viewModelScope.launch {
            try {
                val resp = api.selectRole(RoleSelectionRequest(role))
                if (resp.isSuccessful && resp.body()?.success == true) {
                    val u = resp.body()?.data?.user
                    if (u != null) { _user.value = u; session.saveUser(u) }
                    onSuccess()
                }
            } catch (_: Exception) {}
        }
    }

    fun completeOnboarding(onSuccess: () -> Unit) {
        viewModelScope.launch {
            try {
                val resp = api.completeReaderOnboarding()
                if (resp.isSuccessful && resp.body()?.success == true) {
                    val u = resp.body()?.data?.user
                    if (u != null) { _user.value = u; session.saveUser(u) }
                    onSuccess()
                }
            } catch (_: Exception) {}
        }
    }

    fun checkAuth() {
        viewModelScope.launch {
            try {
                val resp = api.getMe()
                if (resp.isSuccessful && resp.body()?.success == true) {
                    val u = resp.body()?.data?.user
                    if (u != null) { _user.value = u; session.saveUser(u) }
                    _isLoggedIn.value = true
                } else {
                    handleLogout()
                }
            } catch (_: Exception) {
                handleLogout()
            }
        }
    }

    fun logout(onDone: () -> Unit = {}) {
        viewModelScope.launch {
            try { api.logout() } catch (_: Exception) {}
            handleLogout()
            onDone()
        }
    }

    fun handleSessionExpired() {
        _user.value = null
        _isLoggedIn.value = false
        session.clearSession()
    }

    private fun handleLogout() {
        session.clearSession()
        _user.value = null
        _isLoggedIn.value = false
    }

    private fun <T> parseErrorBody(resp: retrofit2.Response<T>): String? {
        return try {
            val errorJson = resp.errorBody()?.string() ?: return resp.body()?.let {
                (it as? ApiResponse<*>)?.error
            }
            val obj = Gson().fromJson(errorJson, JsonObject::class.java)
            val errorField = obj.get("error")
            if (errorField != null && errorField.isJsonObject) {
                val errorObj = errorField.asJsonObject
                val message = errorObj.get("message")?.asString
                val details = errorObj.get("details")
                if (details != null && details.isJsonObject) {
                    val msgs = mutableListOf<String>()
                    details.asJsonObject.entrySet().forEach { (_, value) ->
                        if (value.isJsonArray) {
                            value.asJsonArray.forEach { el ->
                                el.asString?.let { msgs.add(it) }
                            }
                        }
                    }
                    if (msgs.isNotEmpty()) msgs.joinToString("\n") else message
                } else {
                    message
                }
            } else {
                errorField?.asString
            }
        } catch (_: Exception) {
            null
        }
    }

    fun refreshUser() {
        viewModelScope.launch {
            try {
                val resp = api.getMe()
                if (resp.isSuccessful && resp.body()?.success == true) {
                    val u = resp.body()?.data?.user
                    if (u != null) { _user.value = u; session.saveUser(u) }
                }
            } catch (_: Exception) {}
        }
    }

    fun forgotPassword(email: String, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            try {
                val resp = api.forgotPassword(ForgotPasswordRequest(email))
                if (resp.isSuccessful && resp.body()?.success == true) {
                    onSuccess()
                } else {
                    _error.value = parseErrorBody(resp) ?: "Ошибка отправки"
                }
            } catch (e: Exception) {
                _error.value = "Ошибка сети: ${e.localizedMessage}"
            } finally {
                _isLoading.value = false
            }
        }
    }
}
