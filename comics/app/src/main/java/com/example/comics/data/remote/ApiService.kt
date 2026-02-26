package com.example.comics.data.remote

import com.example.comics.data.models.*
import okhttp3.MultipartBody
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    @POST("auth/login")
    suspend fun login(@Body body: LoginRequest): Response<ApiResponse<AuthPayload>>

    @POST("auth/register")
    suspend fun register(@Body body: RegisterRequest): Response<ApiResponse<AuthPayload>>

    @POST("auth/refresh")
    suspend fun refreshToken(@Body body: RefreshRequest): Response<ApiResponse<TokensResponse>>

    @GET("auth/me")
    suspend fun getMe(): Response<ApiResponse<UserResponse>>

    @POST("auth/logout")
    suspend fun logout(): Response<ApiResponse<MessageResponse>>

    @POST("auth/onboarding/role")
    suspend fun selectRole(@Body body: RoleSelectionRequest): Response<ApiResponse<UserResponse>>

    @POST("auth/onboarding/reader-complete")
    suspend fun completeReaderOnboarding(): Response<ApiResponse<UserResponse>>

    @GET("comics")
    suspend fun getComics(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("search") search: String? = null,
        @Query("genres") genres: String? = null,
        @Query("size") size: String? = null,
        @Query("sortBy") sortBy: String? = null,
        @Query("sortOrder") sortOrder: String? = null
    ): Response<ApiResponse<ComicsResponse>>

    @GET("comics/featured")
    suspend fun getFeatured(): Response<ApiResponse<ComicsResponse>>

    @GET("comics/stats")
    suspend fun getStats(): Response<ApiResponse<PlatformStats>>

    @GET("comics/{id}")
    suspend fun getComic(@Path("id") id: String): Response<ApiResponse<ComicResponse>>

    @GET("comics/{id}/pages")
    suspend fun getPages(@Path("id") id: String): Response<ApiResponse<ComicPagesResponse>>

    @POST("comics/{id}/rate")
    suspend fun rateComic(@Path("id") id: String, @Body body: RatingRequest): Response<ApiResponse<RatingResponse>>

    @GET("comics/{id}/comments")
    suspend fun getComments(
        @Path("id") id: String,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<ApiResponse<CommentsResponse>>

    @POST("comics/{id}/comments")
    suspend fun addComment(@Path("id") id: String, @Body body: CommentRequest): Response<ApiResponse<CommentResponse>>

    @DELETE("comics/{id}/comments/{commentId}")
    suspend fun deleteComment(@Path("id") id: String, @Path("commentId") commentId: String): Response<ApiResponse<MessageResponse>>

    @POST("comics/{id}/comments/{commentId}/report")
    suspend fun reportComment(
        @Path("id") id: String,
        @Path("commentId") commentId: String,
        @Body body: ReportRequest
    ): Response<ApiResponse<Unit>>

    @POST("comics/{id}/report")
    suspend fun reportComic(@Path("id") id: String, @Body body: ReportRequest): Response<ApiResponse<Unit>>

    @GET("progress")
    suspend fun getAllProgress(): Response<ApiResponse<ProgressListResponse>>

    @GET("progress/{comicId}")
    suspend fun getProgress(@Path("comicId") comicId: String): Response<ApiResponse<ProgressResponse>>

    @POST("progress/{comicId}/start")
    suspend fun startReading(@Path("comicId") comicId: String): Response<ApiResponse<ProgressResponse>>

    @POST("progress/{comicId}/choice")
    suspend fun recordChoice(@Path("comicId") comicId: String, @Body body: ChoiceRequest): Response<ApiResponse<ProgressResponse>>

    @POST("progress/{comicId}/ending")
    suspend fun recordEnding(@Path("comicId") comicId: String, @Body body: EndingRequest): Response<ApiResponse<Unit>>

    @DELETE("progress/{comicId}")
    suspend fun resetProgress(@Path("comicId") comicId: String): Response<ApiResponse<MessageResponse>>

    @GET("users/profile")
    suspend fun getProfile(): Response<ApiResponse<UserProfileResponse>>

    @PUT("users/profile")
    suspend fun updateProfile(@Body body: ProfileUpdateRequest): Response<ApiResponse<UserResponse>>

    @Multipart
    @POST("users/avatar")
    suspend fun uploadAvatar(@Part avatar: MultipartBody.Part): Response<ApiResponse<AvatarResponse>>

    @GET("users/stats")
    suspend fun getUserStats(): Response<ApiResponse<StatsUserResponse>>

    @GET("users/creator-request")
    suspend fun getCreatorRequest(): Response<ApiResponse<RequestResponse>>

    @POST("users/creator-request")
    suspend fun submitCreatorRequest(@Body body: CreatorRequest): Response<ApiResponse<RequestResponse>>

    @POST("users/favorites/{comicId}")
    suspend fun addFavorite(@Path("comicId") comicId: String): Response<ApiResponse<MessageResponse>>

    @DELETE("users/favorites/{comicId}")
    suspend fun removeFavorite(@Path("comicId") comicId: String): Response<ApiResponse<MessageResponse>>

    @GET("creators/{creatorNick}")
    suspend fun getCreatorProfile(@Path("creatorNick") nick: String): Response<ApiResponse<CreatorProfileResponse>>

    @GET("creator/comics")
    suspend fun getCreatorComics(): Response<ApiResponse<CreatorComicsResponse>>

    @GET("admin/revisions")
    suspend fun getRevisions(@Query("status") status: String? = "pending_review"): Response<ApiResponse<RevisionsResponse>>

    @GET("admin/revisions/{id}")
    suspend fun getRevision(@Path("id") id: String): Response<ApiResponse<RevisionResponse>>

    @POST("admin/revisions/{id}/approve")
    suspend fun approveRevision(@Path("id") id: String): Response<ApiResponse<Unit>>

    @POST("admin/revisions/{id}/reject")
    suspend fun rejectRevision(@Path("id") id: String, @Body body: AdminActionRequest): Response<ApiResponse<Unit>>

    @GET("admin/creator-requests")
    suspend fun getCreatorRequests(@Query("status") status: String? = "pending"): Response<ApiResponse<RequestsResponse>>

    @POST("admin/creator-requests/{id}/approve")
    suspend fun approveCreatorRequest(@Path("id") id: String, @Body body: AdminActionRequest): Response<ApiResponse<Unit>>

    @POST("admin/creator-requests/{id}/reject")
    suspend fun rejectCreatorRequest(@Path("id") id: String, @Body body: AdminActionRequest): Response<ApiResponse<Unit>>

    @GET("admin/comment-reports")
    suspend fun getCommentReports(@Query("status") status: String? = "open"): Response<ApiResponse<CommentReportsResponse>>

    @POST("admin/comments/{id}/hide")
    suspend fun hideComment(@Path("id") id: String): Response<ApiResponse<Unit>>

    @POST("admin/comments/{id}/restore")
    suspend fun restoreComment(@Path("id") id: String): Response<ApiResponse<Unit>>

    @DELETE("admin/comments/{id}")
    suspend fun adminDeleteComment(@Path("id") id: String): Response<ApiResponse<Unit>>

    @GET("admin/comics")
    suspend fun getAdminComics(@Query("status") status: String? = null): Response<ApiResponse<ComicsResponse>>

    @POST("admin/comics/{id}/hide")
    suspend fun hideComic(@Path("id") id: String): Response<ApiResponse<Unit>>

    @POST("admin/comics/{id}/unhide")
    suspend fun unhideComic(@Path("id") id: String): Response<ApiResponse<Unit>>

    @GET("admin/comic-reports")
    suspend fun getComicReports(@Query("status") status: String? = "open"): Response<ApiResponse<ComicReportsResponse>>

    @POST("admin/comic-reports/{id}/resolve")
    suspend fun resolveComicReport(@Path("id") id: String): Response<ApiResponse<Unit>>

    @GET("admin/users")
    suspend fun getAdminUsers(): Response<ApiResponse<AdminUsersResponse>>

    @PUT("admin/users/{id}/role")
    suspend fun changeUserRole(@Path("id") id: String, @Body body: ChangeRoleRequest): Response<ApiResponse<Unit>>

    @POST("admin/users/{id}/ban")
    suspend fun banUser(@Path("id") id: String, @Body body: BanRequest): Response<ApiResponse<Unit>>

    @POST("admin/users/{id}/unban")
    suspend fun unbanUser(@Path("id") id: String): Response<ApiResponse<Unit>>

    @DELETE("admin/users/{id}")
    suspend fun deleteAdminUser(@Path("id") id: String): Response<ApiResponse<Unit>>

    @Multipart
    @POST("uploads")
    suspend fun uploadFile(@Part file: MultipartBody.Part): Response<ApiResponse<UploadResponse>>

    @GET("subscriptions/count/{authorId}")
    suspend fun getSubscriberCount(@Path("authorId") authorId: String): Response<ApiResponse<SubscriberCountResponse>>

    @GET("subscriptions/check/{authorId}")
    suspend fun checkSubscription(@Path("authorId") authorId: String): Response<ApiResponse<SubscribedCheckResponse>>

    @GET("subscriptions/my")
    suspend fun getMySubscriptions(): Response<ApiResponse<MySubscriptionsResponse>>

    @POST("subscriptions/{authorId}")
    suspend fun subscribe(@Path("authorId") authorId: String): Response<ApiResponse<SubscribeActionResponse>>

    @DELETE("subscriptions/{authorId}")
    suspend fun unsubscribe(@Path("authorId") authorId: String): Response<ApiResponse<SubscribeActionResponse>>

    @GET("notifications")
    suspend fun getNotifications(
        @Query("limit") limit: Int = 30,
        @Query("offset") offset: Int = 0
    ): Response<ApiResponse<NotificationsResponse>>

    @GET("notifications/unread-count")
    suspend fun getUnreadNotificationCount(): Response<ApiResponse<UnreadCountResponse>>

    @POST("notifications/{id}/read")
    suspend fun markNotificationRead(@Path("id") id: String): Response<ApiResponse<Unit>>

    @POST("notifications/read-all")
    suspend fun markAllNotificationsRead(): Response<ApiResponse<Unit>>

    @DELETE("notifications/{id}")
    suspend fun deleteNotification(@Path("id") id: String): Response<ApiResponse<Unit>>

    @HTTP(method = "DELETE", path = "notifications/", hasBody = false)
    suspend fun deleteAllNotifications(): Response<ApiResponse<Unit>>

    @POST("auth/forgot-password")
    suspend fun forgotPassword(@Body body: ForgotPasswordRequest): Response<ApiResponse<MessageResponse>>

    @POST("auth/reset-password")
    suspend fun resetPassword(@Body body: ResetPasswordRequest): Response<ApiResponse<MessageResponse>>
}
