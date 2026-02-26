package com.example.comics.data.models

import com.google.gson.annotations.SerializedName

data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val error: String? = null,
    val meta: ApiMeta? = null
)

data class ApiMeta(
    val page: Int? = null,
    val limit: Int? = null,
    val total: Int? = null,
    val totalPages: Int? = null
)

data class User(
    val id: String,
    val email: String,
    val displayName: String?,
    val creatorNick: String? = null,
    val avatar: String? = null,
    val role: String,
    val onboardingStage: String? = null,
    val bio: String? = null,
    val isPremium: Boolean = false,
    val comicsRead: Int = 0,
    val totalChoicesMade: Int = 0,
    val endingsUnlocked: Int = 0,
    val readingTimeMinutes: Int = 0,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

data class Tokens(
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: Int? = null
)

data class AuthPayload(
    val user: User,
    val tokens: Tokens
)

data class Comic(
    val id: String,
    val title: String,
    val description: String? = null,
    val coverImage: String? = null,
    val authorId: String? = null,
    val authorName: String? = null,
    val genres: List<String>? = null,
    val tags: List<String>? = null,
    val status: String? = null,
    val size: String? = null,
    val startPageId: String? = null,
    val totalPages: Int = 0,
    val totalEndings: Int = 0,
    val rating: Double = 0.0,
    val ratingCount: Int = 0,
    val readCount: Int = 0,
    val estimatedMinutes: Int = 5,
    val hiddenByAdmin: Boolean = false,
    val isFavorite: Boolean = false,
    val userRating: Int? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

data class PanelLayout(
    val x: Double = 0.0,
    val y: Double = 0.0,
    val width: Double = 0.0,
    val height: Double = 0.0
)

data class DialoguePosition(
    val x: Double = 0.0,
    val y: Double = 0.0
)

data class PanelDialogue(
    val id: String? = null,
    val type: String? = null,
    val character: String? = null,
    val text: String? = null,
    val position: DialoguePosition? = null
)

data class PanelItem(
    val id: String? = null,
    val order: Int = 0,
    val imageUrl: String? = null,
    val layout: PanelLayout? = null,
    val dialogues: List<PanelDialogue>? = null
)

data class ChoicePosition(
    val x: Double = 0.0,
    val y: Double = 0.0,
    val w: Double? = null,
    val h: Double? = null
)

data class ChoiceItem(
    val id: String? = null,
    val choiceId: String? = null,
    val text: String? = null,
    val targetPageId: String? = null,
    val position: ChoicePosition? = null,
    val style: Any? = null,
    val icon: String? = null
)

data class ComicPage(
    val id: String,
    val comicId: String? = null,
    val pageId: String? = null,
    val pageNumber: Int = 0,
    val title: String? = null,
    val panels: List<PanelItem>? = null,
    val choices: List<ChoiceItem>? = null,
    val isEnding: Boolean = false,
    val endingType: String? = null,
    val endingTitle: String? = null
)

data class ComicComment(
    val id: String,
    val comicId: String? = null,
    val userId: String? = null,
    val body: String,
    val status: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null,
    @SerializedName("User")
    val user: CommentUser? = null
)

data class CommentUser(
    val id: String? = null,
    val displayName: String? = null,
    val avatar: String? = null,
    val creatorNick: String? = null,
    val email: String? = null,
    val role: String? = null
)

data class ComicRevision(
    val id: String,
    val comicId: String? = null,
    val version: Int = 1,
    val status: String? = null,
    val submittedAt: String? = null,
    val reviewedAt: String? = null,
    val rejectionReason: String? = null,
    val createdAt: String? = null,
    @SerializedName("Comic")
    val comic: Comic? = null,
    @SerializedName("Creator")
    val creator: CommentUser? = null
)

data class CommentReport(
    val id: String,
    val commentId: String? = null,
    val reporterId: String? = null,
    val reason: String? = null,
    val status: String? = null,
    val createdAt: String? = null,
    @SerializedName("Comment")
    val comment: ComicComment? = null,
    @SerializedName("Reporter")
    val reporter: CommentUser? = null
)

data class ComicReport(
    val id: String,
    val comicId: String? = null,
    val reporterId: String? = null,
    val reason: String? = null,
    val status: String? = null,
    val createdAt: String? = null,
    @SerializedName("Comic")
    val comic: Comic? = null,
    @SerializedName("Reporter")
    val reporter: CommentUser? = null
)

data class ReadingProgress(
    val id: String? = null,
    val userId: String? = null,
    val comicId: String? = null,
    val currentPageId: String? = null,
    val visitedPages: List<String>? = null,
    val choicesHistory: List<ChoiceHistoryItem>? = null,
    val unlockedEndings: List<String>? = null,
    val startedAt: String? = null,
    val totalTimeSeconds: Int = 0,
    @SerializedName("Comic")
    val comic: Comic? = null
)

data class ChoiceHistoryItem(
    val pageId: String? = null,
    val choiceId: String? = null,
    val timestamp: String? = null
)

data class PlatformStats(
    val totalComics: Int = 0,
    val totalPages: Int = 0,
    val totalEndings: Int = 0,
    val totalReaders: Int = 0,
    val totalPaths: Int = 0
)

data class UserStats(
    val comicsRead: Int = 0,
    val totalChoicesMade: Int = 0,
    val endingsUnlocked: Int = 0,
    val readingTimeMinutes: Int = 0
)

data class CreatorRoleRequest(
    val id: String,
    val userId: String? = null,
    val desiredNick: String? = null,
    val motivation: String? = null,
    val status: String? = null,
    val adminComment: String? = null,
    val createdAt: String? = null,
    val reviewedAt: String? = null,
    @SerializedName("User")
    val user: CommentUser? = null
)

data class UploadedFile(
    val id: String,
    val publicUrl: String? = null,
    val originalName: String? = null,
    val mimeType: String? = null,
    val sizeBytes: Long = 0
)

data class CreatorComic(
    val id: String,
    val title: String,
    val description: String? = null,
    val coverImage: String? = null,
    val status: String? = null,
    val genres: List<String>? = null,
    val tags: List<String>? = null,
    val totalPages: Int = 0,
    val rating: Double = 0.0,
    val readCount: Int = 0,
    val createdAt: String? = null,
    val latestRevision: ComicRevision? = null
)

data class LoginRequest(val email: String, val password: String)

data class RegisterRequest(
    val email: String,
    val nick: String,
    val password: String,
    val confirmPassword: String
)

data class RefreshRequest(val refreshToken: String)

data class RoleSelectionRequest(val role: String)

data class RatingRequest(val rating: Int)

data class CommentRequest(val body: String)

data class ReportRequest(val reason: String)

data class ChoiceRequest(
    val pageId: String,
    val choiceId: String,
    val targetPageId: String,
    val timeSpentSeconds: Int = 0
)

data class EndingRequest(val endingPageId: String)

data class ProfileUpdateRequest(
    val displayName: String? = null,
    val bio: String? = null,
    val creatorNick: String? = null,
    val avatarFileId: String? = null
)

data class CreatorRequest(
    val desiredNick: String? = null,
    val motivation: String? = null,
    val reason: String? = null
)

data class AdminActionRequest(
    val reason: String? = null,
    val comment: String? = null
)

data class BanRequest(
    val reason: String,
    val days: Int? = null
)

data class ChangeRoleRequest(
    val role: String
)

data class AdminUser(
    val id: String,
    val email: String,
    val displayName: String? = null,
    val creatorNick: String? = null,
    val role: String,
    val accountStatus: String? = null,
    val bannedUntil: String? = null,
    val banReason: String? = null,
    val createdAt: String? = null
)

data class UserFavorite(
    val id: String,
    val comicId: String? = null,
    @SerializedName("Comic")
    val comic: Comic? = null
)

data class UserProfile(
    val id: String,
    val email: String,
    val displayName: String?,
    val creatorNick: String? = null,
    val avatar: String? = null,
    val role: String,
    val bio: String? = null,
    val comicsRead: Int = 0,
    val totalChoicesMade: Int = 0,
    val endingsUnlocked: Int = 0,
    val readingTimeMinutes: Int = 0,
    @SerializedName("Favorites")
    val favorites: List<UserFavorite>? = null
)

data class ComicsResponse(val comics: List<Comic> = emptyList())
data class ComicResponse(val comic: Comic? = null)
data class ComicPagesResponse(val comic: Comic? = null, val pages: List<ComicPage> = emptyList())
data class CommentsResponse(val comments: List<ComicComment> = emptyList())
data class CommentResponse(val comment: ComicComment? = null)
data class UserResponse(val user: User? = null)
data class UserProfileResponse(val user: UserProfile? = null)
data class StatsUserResponse(val stats: UserStats? = null)
data class ProgressResponse(val progress: ReadingProgress? = null, val startPageId: String? = null, val isNew: Boolean? = null)
data class ProgressListResponse(val progress: List<ReadingProgress> = emptyList())
data class RevisionsResponse(val revisions: List<ComicRevision> = emptyList())
data class RevisionResponse(val revision: ComicRevision? = null)
data class RequestsResponse(val requests: List<CreatorRoleRequest> = emptyList())
data class RequestResponse(val request: CreatorRoleRequest? = null)
data class CommentReportsResponse(val reports: List<CommentReport> = emptyList())
data class ComicReportsResponse(val reports: List<ComicReport> = emptyList())
data class TokensResponse(val tokens: Tokens? = null)
data class RatingResponse(val rating: Double = 0.0, val ratingCount: Int = 0, val userRating: Int = 0)
data class AvatarResponse(val file: UploadedFile? = null, val avatar: String? = null, val user: User? = null)
data class UploadResponse(val file: UploadedFile? = null)
data class CreatorComicsResponse(val items: List<CreatorComicItem> = emptyList())
data class CreatorComicItem(val comic: Comic? = null, val latestRevision: ComicRevision? = null)
data class CreatorProfileResponse(val creator: User? = null, val comics: List<Comic> = emptyList(), val stats: CreatorStats? = null)
data class MessageResponse(val message: String? = null)
data class AdminUsersResponse(val users: List<AdminUser> = emptyList())

data class CreatorStats(
    val subscriberCount: Int = 0,
    val totalReads: Int = 0,
    val totalComics: Int = 0,
    val avgRating: Double = 0.0
)

data class AppNotification(
    val id: String,
    val userId: String? = null,
    val type: String? = null,
    val title: String? = null,
    val body: String? = null,
    val isRead: Boolean = false,
    val payload: Any? = null,
    val createdAt: String? = null
)

data class SubscriptionItem(
    val id: String,
    val subscriberId: String? = null,
    val authorId: String? = null,
    val createdAt: String? = null,
    val author: CommentUser? = null
)

data class NotificationsResponse(
    val notifications: List<AppNotification> = emptyList(),
    val total: Int = 0,
    val unreadCount: Int = 0
)
data class UnreadCountResponse(val count: Int = 0)
data class SubscriberCountResponse(val count: Int = 0)
data class SubscribedCheckResponse(val subscribed: Boolean = false)
data class SubscribeActionResponse(val subscribed: Boolean = false, val subscription: SubscriptionItem? = null)
data class MySubscriptionsResponse(val subscriptions: List<SubscriptionItem> = emptyList())

data class ForgotPasswordRequest(val email: String)
data class ResetPasswordRequest(val token: String, val newPassword: String, val confirmPassword: String)
