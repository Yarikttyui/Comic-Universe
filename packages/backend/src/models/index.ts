import { User } from './User.js';
import { Comic } from './Comic.js';
import { ComicPage } from './ComicPage.js';
import { ReadingProgress } from './ReadingProgress.js';
import { UserFavorite } from './UserFavorite.js';
import { RefreshToken } from './RefreshToken.js';
import { ComicRevision } from './ComicRevision.js';
import { ComicRating } from './ComicRating.js';
import { ComicComment } from './ComicComment.js';
import { CommentReport } from './CommentReport.js';
import { ComicReport } from './ComicReport.js';
import { UploadedFile } from './UploadedFile.js';
import { CreatorRoleRequest } from './CreatorRoleRequest.js';
import { Subscription } from './Subscription.js';
import { Notification } from './Notification.js';
import { PasswordResetToken } from './PasswordResetToken.js';

User.hasMany(Comic, { foreignKey: 'authorId', as: 'comics' });
Comic.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

Comic.hasMany(ComicPage, { foreignKey: 'comicId', as: 'pages' });
ComicPage.belongsTo(Comic, { foreignKey: 'comicId', as: 'comic' });

Comic.hasMany(ComicRevision, { foreignKey: 'comicId', as: 'revisions' });
ComicRevision.belongsTo(Comic, { foreignKey: 'comicId', as: 'comic' });

Comic.belongsTo(ComicRevision, {
  foreignKey: 'publishedRevisionId',
  as: 'publishedRevision',
  constraints: false,
});

User.hasMany(ComicRevision, { foreignKey: 'createdBy', as: 'createdRevisions' });
ComicRevision.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
ComicRevision.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });

User.hasMany(ReadingProgress, { foreignKey: 'userId', as: 'readingProgress' });
ReadingProgress.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Comic.hasMany(ReadingProgress, { foreignKey: 'comicId', as: 'readers' });
ReadingProgress.belongsTo(Comic, { foreignKey: 'comicId', as: 'comic' });

User.hasMany(UserFavorite, { foreignKey: 'userId', as: 'favorites' });
UserFavorite.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Comic.hasMany(UserFavorite, { foreignKey: 'comicId', as: 'favoritedBy' });
UserFavorite.belongsTo(Comic, { foreignKey: 'comicId', as: 'comic' });

User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Comic.hasMany(ComicRating, { foreignKey: 'comicId', as: 'ratings' });
ComicRating.belongsTo(Comic, { foreignKey: 'comicId', as: 'comic' });
User.hasMany(ComicRating, { foreignKey: 'userId', as: 'comicRatings' });
ComicRating.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Comic.hasMany(ComicComment, { foreignKey: 'comicId', as: 'comments' });
ComicComment.belongsTo(Comic, { foreignKey: 'comicId', as: 'comic' });
User.hasMany(ComicComment, { foreignKey: 'userId', as: 'comicComments' });
ComicComment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

ComicComment.hasMany(CommentReport, { foreignKey: 'commentId', as: 'reports' });
CommentReport.belongsTo(ComicComment, { foreignKey: 'commentId', as: 'comment' });
User.hasMany(CommentReport, { foreignKey: 'reporterId', as: 'commentReports' });
CommentReport.belongsTo(User, { foreignKey: 'reporterId', as: 'reporter' });
CommentReport.belongsTo(User, { foreignKey: 'resolvedBy', as: 'resolver' });

User.hasMany(UploadedFile, { foreignKey: 'ownerUserId', as: 'uploadedFiles' });
UploadedFile.belongsTo(User, { foreignKey: 'ownerUserId', as: 'owner' });

Comic.hasMany(ComicReport, { foreignKey: 'comicId', as: 'comicReports' });
ComicReport.belongsTo(Comic, { foreignKey: 'comicId', as: 'comic' });
User.hasMany(ComicReport, { foreignKey: 'reporterId', as: 'filedComicReports' });
ComicReport.belongsTo(User, { foreignKey: 'reporterId', as: 'reporter' });
ComicReport.belongsTo(User, { foreignKey: 'resolvedBy', as: 'resolver' });

User.hasMany(CreatorRoleRequest, { foreignKey: 'userId', as: 'creatorRoleRequests' });
CreatorRoleRequest.belongsTo(User, { foreignKey: 'userId', as: 'user' });
CreatorRoleRequest.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });

User.hasMany(Subscription, { foreignKey: 'subscriberId', as: 'subscriptions' });
Subscription.belongsTo(User, { foreignKey: 'subscriberId', as: 'subscriber' });
User.hasMany(Subscription, { foreignKey: 'authorId', as: 'subscribers' });
Subscription.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(PasswordResetToken, { foreignKey: 'userId', as: 'passwordResetTokens' });
PasswordResetToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export {
  User,
  Comic,
  ComicPage,
  ComicRevision,
  ComicRating,
  ComicComment,
  CommentReport,
  ComicReport,
  ReadingProgress,
  UserFavorite,
  RefreshToken,
  UploadedFile,
  CreatorRoleRequest,
  Subscription,
  Notification,
  PasswordResetToken,
};
