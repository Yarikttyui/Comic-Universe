package com.example.comics.data.local

import android.content.Context
import android.content.SharedPreferences
import com.example.comics.data.models.User
import com.google.gson.Gson

class SessionManager(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("comic_universe_session", Context.MODE_PRIVATE)
    private val gson = Gson()

    companion object {
        private const val KEY_ACCESS = "access_token"
        private const val KEY_REFRESH = "refresh_token"
        private const val KEY_USER = "user_json"
        private const val KEY_THEME = "theme"
    }

    var accessToken: String?
        get() = prefs.getString(KEY_ACCESS, null)
        private set(value) = prefs.edit().putString(KEY_ACCESS, value).apply()

    var refreshToken: String?
        get() = prefs.getString(KEY_REFRESH, null)
        private set(value) = prefs.edit().putString(KEY_REFRESH, value).apply()

    val isLoggedIn: Boolean get() = !accessToken.isNullOrBlank()

    fun saveTokens(access: String, refresh: String) {
        prefs.edit()
            .putString(KEY_ACCESS, access)
            .putString(KEY_REFRESH, refresh)
            .apply()
    }

    fun saveUser(user: User) {
        prefs.edit().putString(KEY_USER, gson.toJson(user)).apply()
    }

    fun getUser(): User? {
        val json = prefs.getString(KEY_USER, null) ?: return null
        return try {
            gson.fromJson(json, User::class.java)
        } catch (_: Exception) {
            null
        }
    }

    fun clearSession() {
        prefs.edit()
            .remove(KEY_ACCESS)
            .remove(KEY_REFRESH)
            .remove(KEY_USER)
            .apply()
    }

    var isDarkTheme: Boolean
        get() = prefs.getBoolean(KEY_THEME, false)
        set(value) = prefs.edit().putBoolean(KEY_THEME, value).apply()
}
