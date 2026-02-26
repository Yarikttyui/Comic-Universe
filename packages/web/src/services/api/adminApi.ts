import api from './client';

export const adminApi = {
  getRevisions: (status = 'pending_review') => api.get('/admin/revisions', { params: { status } }),
  getRevision: (revisionId: string) => api.get(`/admin/revisions/${revisionId}`),
  approveRevision: (revisionId: string) => api.post(`/admin/revisions/${revisionId}/approve`),
  rejectRevision: (revisionId: string, reason: string) =>
    api.post(`/admin/revisions/${revisionId}/reject`, { reason }),
  getCreatorRequests: (status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'all' = 'pending') =>
    api.get('/admin/creator-requests', { params: { status } }),
  approveCreatorRequest: (requestId: string, comment?: string) =>
    api.post(`/admin/creator-requests/${requestId}/approve`, { comment }),
  rejectCreatorRequest: (requestId: string, reason: string) =>
    api.post(`/admin/creator-requests/${requestId}/reject`, { reason }),
  getCommentReports: (status = 'open') => api.get('/admin/comment-reports', { params: { status } }),
  hideComment: (commentId: string) => api.post(`/admin/comments/${commentId}/hide`),
  restoreComment: (commentId: string) => api.post(`/admin/comments/${commentId}/restore`),
  deleteComment: (commentId: string) => api.delete(`/admin/comments/${commentId}`),
  getComics: (status = 'all') => api.get('/admin/comics', { params: { status } }),
  hideComic: (comicId: string) => api.post(`/admin/comics/${comicId}/hide`),
  unhideComic: (comicId: string) => api.post(`/admin/comics/${comicId}/unhide`),
  getComicReports: (status = 'open') => api.get('/admin/comic-reports', { params: { status } }),
  resolveComicReport: (reportId: string) => api.post(`/admin/comic-reports/${reportId}/resolve`),
  getUsers: () => api.get('/admin/users'),
  banUser: (userId: string, reason: string, days?: number) =>
    api.post(`/admin/users/${userId}/ban`, { reason, days }),
  unbanUser: (userId: string) => api.post(`/admin/users/${userId}/unban`),
  deleteUser: (userId: string) => api.delete(`/admin/users/${userId}`),
  changeRole: (userId: string, role: string) => api.put(`/admin/users/${userId}/role`, { role }),
};
