package com.example.comics

import android.app.Application
import com.example.comics.data.local.SessionManager
import com.example.comics.data.remote.ApiClient

class ComicUniverseApp : Application() {

    lateinit var sessionManager: SessionManager
        private set

    override fun onCreate() {
        super.onCreate()
        sessionManager = SessionManager(this)
        ApiClient.init(sessionManager) {
            sessionManager.clearSession()
        }
    }
}
