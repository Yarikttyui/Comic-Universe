package com.example.comics.data.remote

import com.example.comics.BuildConfig
import com.example.comics.data.local.SessionManager
import com.example.comics.data.models.ApiResponse
import com.example.comics.data.models.RefreshRequest
import com.example.comics.data.models.Tokens
import com.example.comics.data.models.TokensResponse
import com.google.gson.Gson
import kotlinx.coroutines.runBlocking
import okhttp3.Authenticator
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object ApiClient {

    private lateinit var sessionManager: SessionManager
    private var onSessionExpired: (() -> Unit)? = null

    val baseUrl: String get() = BuildConfig.API_BASE_URL

    fun init(session: SessionManager, onExpired: () -> Unit) {
        sessionManager = session
        onSessionExpired = onExpired
    }

    private val authInterceptor = Interceptor { chain ->
        val token = sessionManager.accessToken
        val request = if (!token.isNullOrBlank()) {
            chain.request().newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        } else {
            chain.request()
        }
        chain.proceed(request)
    }

    private val tokenAuthenticator = object : Authenticator {
        override fun authenticate(route: Route?, response: Response): Request? {
            val refresh = sessionManager.refreshToken ?: return null

            if (response.request.url.encodedPath.contains("auth/refresh")) {
                runBlocking { sessionManager.clearSession() }
                onSessionExpired?.invoke()
                return null
            }

            val newTokens = runBlocking {
                try {
                    val resp = refreshApi.refreshToken(RefreshRequest(refresh))
                    if (resp.isSuccessful && resp.body()?.success == true) {
                        resp.body()?.data?.tokens
                    } else null
                } catch (_: Exception) {
                    null
                }
            }

            return if (newTokens != null) {
                sessionManager.saveTokens(newTokens.accessToken, newTokens.refreshToken)
                response.request.newBuilder()
                    .header("Authorization", "Bearer ${newTokens.accessToken}")
                    .build()
            } else {
                runBlocking { sessionManager.clearSession() }
                onSessionExpired?.invoke()
                null
            }
        }
    }

    private val logging = HttpLoggingInterceptor().apply {
        level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BODY
        else HttpLoggingInterceptor.Level.NONE
    }

    private val client: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(logging)
            .authenticator(tokenAuthenticator)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(60, TimeUnit.SECONDS)
            .build()
    }

    private val refreshClient: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .addInterceptor(logging)
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .build()
    }

    private val refreshApi: ApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(refreshClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }

    val api: ApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}
