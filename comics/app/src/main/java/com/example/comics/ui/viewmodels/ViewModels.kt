package com.example.comics.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.comics.data.models.*
import com.example.comics.data.remote.ApiClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class HomeViewModel : ViewModel() {

    private val api get() = ApiClient.api

    private val _featured = MutableStateFlow<List<Comic>>(emptyList())
    val featured: StateFlow<List<Comic>> = _featured

    private val _stats = MutableStateFlow<PlatformStats?>(null)
    val stats: StateFlow<PlatformStats?> = _stats

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading

    init { load() }

    fun load() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val fResp = api.getFeatured()
                if (fResp.isSuccessful) _featured.value = fResp.body()?.data?.comics ?: emptyList()
                val sResp = api.getStats()
                if (sResp.isSuccessful) _stats.value = sResp.body()?.data
            } catch (_: Exception) {}
            _isLoading.value = false
        }
    }
}

class LibraryViewModel : ViewModel() {

    private val api get() = ApiClient.api

    private val _comics = MutableStateFlow<List<Comic>>(emptyList())
    val comics: StateFlow<List<Comic>> = _comics

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _search = MutableStateFlow("")
    val search: StateFlow<String> = _search

    private val _selectedGenre = MutableStateFlow<String?>(null)
    val selectedGenre: StateFlow<String?> = _selectedGenre

    private val _selectedSize = MutableStateFlow<String?>(null)
    val selectedSize: StateFlow<String?> = _selectedSize

    private val _sortBy = MutableStateFlow("createdAt")
    val sortBy: StateFlow<String> = _sortBy

    private val _page = MutableStateFlow(1)
    private val _hasMore = MutableStateFlow(true)
    val hasMore: StateFlow<Boolean> = _hasMore

    init { load() }

    fun setSearch(q: String) { _search.value = q; resetAndLoad() }
    fun setGenre(g: String?) { _selectedGenre.value = g; resetAndLoad() }
    fun setSize(s: String?) { _selectedSize.value = s; resetAndLoad() }
    fun setSortBy(s: String) { _sortBy.value = s; resetAndLoad() }

    private fun resetAndLoad() {
        _page.value = 1
        _comics.value = emptyList()
        _hasMore.value = true
        load()
    }

    fun loadMore() {
        if (!_hasMore.value || _isLoading.value) return
        _page.value++
        load(append = true)
    }

    fun load(append: Boolean = false) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val resp = api.getComics(
                    page = _page.value,
                    search = _search.value.ifBlank { null },
                    genres = _selectedGenre.value,
                    size = _selectedSize.value,
                    sortBy = _sortBy.value,
                    sortOrder = "DESC"
                )
                if (resp.isSuccessful) {
                    val data = resp.body()?.data?.comics ?: emptyList()
                    _comics.value = if (append) _comics.value + data else data
                    _hasMore.value = data.size >= 20
                }
            } catch (_: Exception) {}
            _isLoading.value = false
        }
    }
}

class ComicDetailViewModel : ViewModel() {

    private val api get() = ApiClient.api

    private val _comic = MutableStateFlow<Comic?>(null)
    val comic: StateFlow<Comic?> = _comic

    private val _comments = MutableStateFlow<List<ComicComment>>(emptyList())
    val comments: StateFlow<List<ComicComment>> = _comments

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    private val _isFavorite = MutableStateFlow(false)
    val isFavorite: StateFlow<Boolean> = _isFavorite

    private val _userRating = MutableStateFlow(0)
    val userRating: StateFlow<Int> = _userRating

    fun load(comicId: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            try {
                val resp = api.getComic(comicId)
                if (resp.isSuccessful && resp.body()?.success == true) {
                    _comic.value = resp.body()?.data?.comic
                } else {
                    _error.value = "Комикс не найден"
                }
                val cResp = api.getComments(comicId)
                if (cResp.isSuccessful) _comments.value = cResp.body()?.data?.comments ?: emptyList()
            } catch (e: Exception) {
                _error.value = "Ошибка загрузки: ${e.localizedMessage}"
            }
            _isLoading.value = false
        }
    }

    fun rate(comicId: String, rating: Int) {
        _userRating.value = rating
        viewModelScope.launch {
            try {
                val resp = api.rateComic(comicId, RatingRequest(rating))
                if (resp.isSuccessful && resp.body()?.success == true) {
                    val ratingData = resp.body()?.data
                    if (ratingData != null) {
                        _comic.value = _comic.value?.copy(
                            rating = ratingData.rating,
                            ratingCount = ratingData.ratingCount,
                            userRating = ratingData.userRating
                        )
                    }
                }
            } catch (_: Exception) {}
        }
    }

    fun addComment(comicId: String, body: String) {
        viewModelScope.launch {
            try {
                val resp = api.addComment(comicId, CommentRequest(body))
                if (resp.isSuccessful && resp.body()?.success == true) {
                    load(comicId)
                }
            } catch (_: Exception) {}
        }
    }

    fun toggleFavorite(comicId: String) {
        val wasFav = _isFavorite.value
        _isFavorite.value = !wasFav
        viewModelScope.launch {
            try {
                if (wasFav) api.removeFavorite(comicId) else api.addFavorite(comicId)
            } catch (_: Exception) {
                _isFavorite.value = wasFav
            }
        }
    }
}

class ComicReaderViewModel : ViewModel() {

    private val api get() = ApiClient.api

    private val _pages = MutableStateFlow<List<ComicPage>>(emptyList())
    val pages: StateFlow<List<ComicPage>> = _pages

    private val _currentPageIndex = MutableStateFlow(0)
    val currentPageIndex: StateFlow<Int> = _currentPageIndex

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _isEnding = MutableStateFlow(false)
    val isEnding: StateFlow<Boolean> = _isEnding

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    private val _history = MutableStateFlow<List<Int>>(emptyList())
    private var comicId = ""

    fun load(id: String) {
        comicId = id
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            try {
                val resp = api.getPages(id)
                if (resp.isSuccessful && resp.body()?.success == true) {
                    val allPages = resp.body()?.data?.pages ?: emptyList()
                    if (allPages.isEmpty()) {
                        _error.value = "У этого комикса пока нет страниц"
                        _pages.value = emptyList()
                    } else {
                        _pages.value = allPages
                        _currentPageIndex.value = 0
                        _history.value = listOf(0)
                        _isEnding.value = false

                        try {
                            val progressResp = api.getProgress(id)
                            val savedPageId = progressResp.body()?.data?.progress?.currentPageId
                            if (savedPageId != null) {
                                val idx = allPages.indexOfFirst { it.pageId == savedPageId || it.id == savedPageId }
                                if (idx >= 0) {
                                    _currentPageIndex.value = idx
                                    _history.value = listOf(idx)
                                }
                            }
                        } catch (_: Exception) {}

                        try { api.startReading(id) } catch (_: Exception) {}
                    }
                } else {
                    val errorBody = resp.errorBody()?.string()
                    val msg = try {
                        val obj = com.google.gson.Gson().fromJson(errorBody, com.google.gson.JsonObject::class.java)
                        val err = obj.get("error")
                        if (err != null && err.isJsonObject) err.asJsonObject.get("message")?.asString
                        else err?.asString
                    } catch (_: Exception) { null }
                    _error.value = msg ?: "Ошибка загрузки страниц (код ${resp.code()})"
                }
            } catch (e: Exception) {
                _error.value = "Ошибка сети: ${e.localizedMessage}"
            }
            _isLoading.value = false
        }
    }

    fun nextPage() {
        val idx = _currentPageIndex.value
        if (idx < _pages.value.size - 1) {
            val newIdx = idx + 1
            _currentPageIndex.value = newIdx
            _history.value = _history.value + newIdx
            checkEnding(newIdx)
        }
    }

    fun makeChoice(comicId: String, choice: ChoiceItem) {
        val currentPage = _pages.value.getOrNull(_currentPageIndex.value) ?: return
        val targetIdx = _pages.value.indexOfFirst { it.pageId == choice.targetPageId || it.id == choice.targetPageId }
        if (targetIdx < 0) return

        _history.value = _history.value + targetIdx
        _currentPageIndex.value = targetIdx
        checkEnding(targetIdx)

        viewModelScope.launch {
            try {
                api.recordChoice(
                    comicId,
                    ChoiceRequest(
                        pageId = currentPage.pageId ?: currentPage.id,
                        choiceId = choice.choiceId ?: choice.id ?: "",
                        targetPageId = choice.targetPageId ?: ""
                    )
                )
                val targetPage = _pages.value[targetIdx]
                if (targetPage.isEnding) {
                    api.recordEnding(comicId, EndingRequest(targetPage.pageId ?: targetPage.id))
                }
            } catch (_: Exception) {}
        }
    }

    fun goBack() {
        val hist = _history.value
        if (hist.size < 2) return
        val prevIdx = hist[hist.size - 2]
        _currentPageIndex.value = prevIdx
        _history.value = hist.dropLast(1)
        _isEnding.value = false
    }

    fun restart(comicId: String) {
        _currentPageIndex.value = 0
        _history.value = listOf(0)
        _isEnding.value = false
        viewModelScope.launch {
            try { api.resetProgress(comicId) } catch (_: Exception) {}
        }
    }

    private fun checkEnding(idx: Int) {
        val page = _pages.value.getOrNull(idx)
        _isEnding.value = page?.isEnding == true
    }
}

class ProfileViewModel : ViewModel() {

    private val api get() = ApiClient.api

    private val _profile = MutableStateFlow<UserProfile?>(null)
    val profile: StateFlow<UserProfile?> = _profile

    private val _userStats = MutableStateFlow<UserStats?>(null)
    val userStats: StateFlow<UserStats?> = _userStats

    private val _progress = MutableStateFlow<List<ReadingProgress>>(emptyList())
    val progress: StateFlow<List<ReadingProgress>> = _progress

    private val _favorites = MutableStateFlow<List<UserFavorite>>(emptyList())
    val favorites: StateFlow<List<UserFavorite>> = _favorites

    private val _creatorRequest = MutableStateFlow<CreatorRoleRequest?>(null)
    val creatorRequest: StateFlow<CreatorRoleRequest?> = _creatorRequest

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading

    fun load() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val pResp = api.getProfile()
                if (pResp.isSuccessful) {
                    val profile = pResp.body()?.data?.user
                    _profile.value = profile
                    _favorites.value = profile?.favorites ?: emptyList()
                }
                val sResp = api.getUserStats()
                if (sResp.isSuccessful) _userStats.value = sResp.body()?.data?.stats
                val prResp = api.getAllProgress()
                if (prResp.isSuccessful) _progress.value = prResp.body()?.data?.progress ?: emptyList()
                try {
                    val crResp = api.getCreatorRequest()
                    if (crResp.isSuccessful) _creatorRequest.value = crResp.body()?.data?.request
                } catch (_: Exception) {}
            } catch (_: Exception) {}
            _isLoading.value = false
        }
    }

    fun updateProfile(nickname: String) {
        viewModelScope.launch {
            try {
                val resp = api.updateProfile(ProfileUpdateRequest(displayName = nickname))
                if (resp.isSuccessful) load()
            } catch (_: Exception) {}
        }
    }

    fun updateProfileFull(nickname: String, bio: String) {
        viewModelScope.launch {
            try {
                val resp = api.updateProfile(ProfileUpdateRequest(displayName = nickname, bio = bio))
                if (resp.isSuccessful) load()
            } catch (_: Exception) {}
        }
    }

    fun submitCreatorRequest(reason: String) {
        viewModelScope.launch {
            try {
                val resp = api.submitCreatorRequest(CreatorRequest(reason = reason))
                if (resp.isSuccessful && resp.body()?.success == true) {
                    _creatorRequest.value = resp.body()?.data?.request
                }
            } catch (_: Exception) {}
        }
    }
}

class AdminViewModel : ViewModel() {

    private val api get() = ApiClient.api

    private val _revisions = MutableStateFlow<List<ComicRevision>>(emptyList())
    val revisions: StateFlow<List<ComicRevision>> = _revisions

    private val _creatorRequests = MutableStateFlow<List<CreatorRoleRequest>>(emptyList())
    val creatorRequests: StateFlow<List<CreatorRoleRequest>> = _creatorRequests

    private val _commentReports = MutableStateFlow<List<CommentReport>>(emptyList())
    val commentReports: StateFlow<List<CommentReport>> = _commentReports

    private val _adminComics = MutableStateFlow<List<Comic>>(emptyList())
    val adminComics: StateFlow<List<Comic>> = _adminComics

    private val _comicReports = MutableStateFlow<List<ComicReport>>(emptyList())
    val comicReports: StateFlow<List<ComicReport>> = _comicReports

    private val _adminUsers = MutableStateFlow<List<AdminUser>>(emptyList())
    val adminUsers: StateFlow<List<AdminUser>> = _adminUsers

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    fun loadRevisions() { viewModelScope.launch {
        _isLoading.value = true
        try { val r = api.getRevisions(); if (r.isSuccessful) _revisions.value = r.body()?.data?.revisions ?: emptyList() } catch (_: Exception) {}
        _isLoading.value = false
    } }

    fun approveRevision(id: String) { viewModelScope.launch {
        try { api.approveRevision(id); loadRevisions() } catch (_: Exception) {}
    } }

    fun rejectRevision(id: String, reason: String = "Отклонено") { viewModelScope.launch {
        try { api.rejectRevision(id, AdminActionRequest(reason = reason)); loadRevisions() } catch (_: Exception) {}
    } }

    fun loadCreatorRequests() { viewModelScope.launch {
        _isLoading.value = true
        try { val r = api.getCreatorRequests(); if (r.isSuccessful) _creatorRequests.value = r.body()?.data?.requests ?: emptyList() } catch (_: Exception) {}
        _isLoading.value = false
    } }

    fun approveCreatorRequest(id: String) { viewModelScope.launch {
        try { api.approveCreatorRequest(id, AdminActionRequest()); loadCreatorRequests() } catch (_: Exception) {}
    } }

    fun rejectCreatorRequest(id: String, reason: String = "Отклонено") { viewModelScope.launch {
        try { api.rejectCreatorRequest(id, AdminActionRequest(reason = reason)); loadCreatorRequests() } catch (_: Exception) {}
    } }

    fun loadCommentReports() { viewModelScope.launch {
        _isLoading.value = true
        try { val r = api.getCommentReports(); if (r.isSuccessful) _commentReports.value = r.body()?.data?.reports ?: emptyList() } catch (_: Exception) {}
        _isLoading.value = false
    } }

    fun hideComment(id: String) { viewModelScope.launch {
        try { api.hideComment(id); loadCommentReports() } catch (_: Exception) {}
    } }

    fun resolveCommentReport(id: String) { viewModelScope.launch {
        try { api.restoreComment(id); loadCommentReports() } catch (_: Exception) {}
    } }

    fun deleteCommentAdmin(id: String) { viewModelScope.launch {
        try { api.adminDeleteComment(id); loadCommentReports() } catch (_: Exception) {}
    } }

    fun restoreComment(id: String) { viewModelScope.launch {
        try { api.restoreComment(id); loadCommentReports() } catch (_: Exception) {}
    } }

    fun loadAdminComics() { viewModelScope.launch {
        _isLoading.value = true
        try { val r = api.getAdminComics(); if (r.isSuccessful) _adminComics.value = r.body()?.data?.comics ?: emptyList() } catch (_: Exception) {}
        _isLoading.value = false
    } }

    fun hideComic(id: String) { viewModelScope.launch {
        try { api.hideComic(id); loadAdminComics() } catch (_: Exception) {}
    } }

    fun restoreComic(id: String) { viewModelScope.launch {
        try { api.unhideComic(id); loadAdminComics() } catch (_: Exception) {}
    } }

    fun unhideComic(id: String) { viewModelScope.launch {
        try { api.unhideComic(id); loadAdminComics() } catch (_: Exception) {}
    } }

    fun loadComicReports() { viewModelScope.launch {
        _isLoading.value = true
        try { val r = api.getComicReports(); if (r.isSuccessful) _comicReports.value = r.body()?.data?.reports ?: emptyList() } catch (_: Exception) {}
        _isLoading.value = false
    } }

    fun resolveComicReport(id: String) { viewModelScope.launch {
        try { api.resolveComicReport(id); loadComicReports() } catch (_: Exception) {}
    } }

    fun loadUsers() { viewModelScope.launch {
        _isLoading.value = true
        try { val r = api.getAdminUsers(); if (r.isSuccessful) _adminUsers.value = r.body()?.data?.users ?: emptyList() } catch (_: Exception) {}
        _isLoading.value = false
    } }

    fun changeRole(id: String, role: String) { viewModelScope.launch {
        try { api.changeUserRole(id, ChangeRoleRequest(role)); loadUsers() } catch (_: Exception) {}
    } }

    fun banUser(id: String, reason: String, days: Int?) { viewModelScope.launch {
        try { api.banUser(id, BanRequest(reason, days)); loadUsers() } catch (_: Exception) {}
    } }

    fun unbanUser(id: String) { viewModelScope.launch {
        try { api.unbanUser(id); loadUsers() } catch (_: Exception) {}
    } }

    fun deleteUser(id: String) { viewModelScope.launch {
        try { api.deleteAdminUser(id); loadUsers() } catch (_: Exception) {}
    } }
}

class CreatorViewModel : ViewModel() {

    private val api get() = ApiClient.api

    private val _comics = MutableStateFlow<List<CreatorComic>>(emptyList())
    val comics: StateFlow<List<CreatorComic>> = _comics

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading

    init { load() }

    fun load() { viewModelScope.launch {
        _isLoading.value = true
        try {
            val r = api.getCreatorComics()
            if (r.isSuccessful) {
                _comics.value = r.body()?.data?.items?.mapNotNull { item ->
                    item.comic?.let { c ->
                        CreatorComic(
                            id = c.id, title = c.title, description = c.description,
                            coverImage = c.coverImage, status = c.status, genres = c.genres,
                            tags = c.tags, totalPages = c.totalPages, rating = c.rating,
                            readCount = c.readCount, createdAt = c.createdAt,
                            latestRevision = item.latestRevision
                        )
                    }
                } ?: emptyList()
            }
        } catch (_: Exception) {}
        _isLoading.value = false
    } }
}

class NotificationViewModel : ViewModel() {

    private val api get() = ApiClient.api

    private val _notifications = MutableStateFlow<List<AppNotification>>(emptyList())
    val notifications: StateFlow<List<AppNotification>> = _notifications

    private val _unreadCount = MutableStateFlow(0)
    val unreadCount: StateFlow<Int> = _unreadCount

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    fun loadNotifications() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val resp = api.getNotifications()
                if (resp.isSuccessful) {
                    val data = resp.body()?.data
                    _notifications.value = data?.notifications ?: emptyList()
                    _unreadCount.value = data?.unreadCount ?: 0
                }
            } catch (_: Exception) {}
            _isLoading.value = false
        }
    }

    fun loadUnreadCount() {
        viewModelScope.launch {
            try {
                val resp = api.getUnreadNotificationCount()
                if (resp.isSuccessful) _unreadCount.value = resp.body()?.data?.count ?: 0
            } catch (_: Exception) {}
        }
    }

    fun markRead(id: String) {
        viewModelScope.launch {
            try {
                api.markNotificationRead(id)
                _notifications.value = _notifications.value.map {
                    if (it.id == id) it.copy(isRead = true) else it
                }
                _unreadCount.value = (_unreadCount.value - 1).coerceAtLeast(0)
            } catch (_: Exception) {}
        }
    }

    fun markAllRead() {
        viewModelScope.launch {
            try {
                api.markAllNotificationsRead()
                _notifications.value = _notifications.value.map { it.copy(isRead = true) }
                _unreadCount.value = 0
            } catch (_: Exception) {}
        }
    }

    fun deleteNotification(id: String) {
        val was = _notifications.value.find { it.id == id }
        _notifications.value = _notifications.value.filter { it.id != id }
        if (was != null && !was.isRead) _unreadCount.value = (_unreadCount.value - 1).coerceAtLeast(0)
        viewModelScope.launch {
            try { api.deleteNotification(id) } catch (_: Exception) {}
        }
    }

    fun clearAll() {
        _notifications.value = emptyList()
        _unreadCount.value = 0
        viewModelScope.launch {
            try { api.deleteAllNotifications() } catch (_: Exception) {}
        }
    }
}

class CreatorProfileViewModel : ViewModel() {

    private val api get() = ApiClient.api

    private val _creator = MutableStateFlow<User?>(null)
    val creator: StateFlow<User?> = _creator

    private val _comics = MutableStateFlow<List<Comic>>(emptyList())
    val comics: StateFlow<List<Comic>> = _comics

    private val _stats = MutableStateFlow<CreatorStats?>(null)
    val stats: StateFlow<CreatorStats?> = _stats

    private val _isSubscribed = MutableStateFlow(false)
    val isSubscribed: StateFlow<Boolean> = _isSubscribed

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading

    fun load(nick: String) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val resp = api.getCreatorProfile(nick)
                if (resp.isSuccessful && resp.body()?.success == true) {
                    val data = resp.body()?.data
                    _creator.value = data?.creator
                    _comics.value = data?.comics ?: emptyList()
                    _stats.value = data?.stats
                    data?.creator?.id?.let { authorId ->
                        try {
                            val chk = api.checkSubscription(authorId)
                            if (chk.isSuccessful) _isSubscribed.value = chk.body()?.data?.subscribed ?: false
                        } catch (_: Exception) {}
                    }
                }
            } catch (_: Exception) {}
            _isLoading.value = false
        }
    }

    fun toggleSubscribe() {
        val authorId = _creator.value?.id ?: return
        val wasSub = _isSubscribed.value
        _isSubscribed.value = !wasSub
        val currentStats = _stats.value
        if (currentStats != null) {
            _stats.value = currentStats.copy(subscriberCount = currentStats.subscriberCount + if (wasSub) -1 else 1)
        }
        viewModelScope.launch {
            try {
                if (wasSub) api.unsubscribe(authorId) else api.subscribe(authorId)
            } catch (_: Exception) {
                _isSubscribed.value = wasSub
                _stats.value = currentStats
            }
        }
    }
}
