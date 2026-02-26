import { Server } from 'socket.io';
import { Notification, NotificationType } from '../models/Notification.js';
import { Subscription } from '../models/Subscription.js';
import { User } from '../models/User.js';
import {
  sendComicApprovedEmail,
  sendComicRejectedEmail,
  sendCreatorApprovedEmail,
  sendCreatorRejectedEmail,
  sendNewCommentEmail,
  sendReportResolvedEmail,
} from './emailService.js';

let ioInstance: Server | null = null;

export function setIO(io: Server): void {
  ioInstance = io;
}

export function getIO(): Server | null {
  return ioInstance;
}

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  payload?: Record<string, any>;
}

export async function createNotification(params: CreateNotificationParams): Promise<Notification> {
  const notif = await Notification.create({
    userId: params.userId,
    type: params.type,
    title: params.title,
    body: params.body || null,
    payload: params.payload || null,
  });

  if (ioInstance) {
    ioInstance.to(`user:${params.userId}`).emit('notification:new', {
      id: notif.id,
      type: notif.type,
      title: notif.title,
      body: notif.body,
      payload: notif.payload,
      isRead: false,
      createdAt: notif.createdAt,
    });
  }

  return notif;
}

export async function notifyComicApproved(authorId: string, comicId: string, comicTitle: string): Promise<void> {
  await createNotification({
    userId: authorId,
    type: 'comic_approved',
    title: `Комикс «${comicTitle}» одобрен`,
    body: 'Ваш комикс прошёл модерацию и опубликован.',
    payload: { comicId },
  });
  try {
    const user = await User.findByPk(authorId, { attributes: ['email', 'displayName'] });
    if (user) await sendComicApprovedEmail(user.email, user.displayName, comicTitle, comicId);
  } catch (_) {}
}

export async function notifyComicRejected(authorId: string, comicId: string, comicTitle: string, reason?: string): Promise<void> {
  await createNotification({
    userId: authorId,
    type: 'comic_rejected',
    title: `Комикс «${comicTitle}» отклонён`,
    body: reason || 'Ваш комикс не прошёл модерацию.',
    payload: { comicId },
  });
  try {
    const user = await User.findByPk(authorId, { attributes: ['email', 'displayName'] });
    if (user) await sendComicRejectedEmail(user.email, user.displayName, comicTitle, reason);
  } catch (_) {}
}

export async function notifyNewComment(authorId: string, comicId: string, comicTitle: string, commenterName: string): Promise<void> {
  await createNotification({
    userId: authorId,
    type: 'new_comment',
    title: `Новый комментарий к «${comicTitle}»`,
    body: `${commenterName} оставил комментарий.`,
    payload: { comicId },
  });
  try {
    const user = await User.findByPk(authorId, { attributes: ['email', 'displayName'] });
    if (user) await sendNewCommentEmail(user.email, user.displayName, comicTitle, commenterName, comicId);
  } catch (_) {}
}

export async function notifySubscribersNewComic(authorId: string, comicId: string, comicTitle: string, authorName: string): Promise<void> {
  const subs = await Subscription.findAll({ where: { authorId }, attributes: ['subscriberId'] });
  for (const sub of subs) {
    await createNotification({
      userId: sub.subscriberId,
      type: 'new_comic_by_author',
      title: `Новый комикс от ${authorName}`,
      body: `«${comicTitle}» уже доступен для чтения.`,
      payload: { comicId, authorId },
    });
  }
}

export async function notifyCreatorRequestResult(userId: string, approved: boolean, reason?: string): Promise<void> {
  await createNotification({
    userId,
    type: approved ? 'creator_request_approved' : 'creator_request_rejected',
    title: approved ? 'Заявка на создателя одобрена' : 'Заявка на создателя отклонена',
    body: approved ? 'Теперь вы можете создавать комиксы!' : (reason || 'Ваша заявка отклонена.'),
  });
  try {
    const user = await User.findByPk(userId, { attributes: ['email', 'displayName'] });
    if (user) {
      if (approved) {
        await sendCreatorApprovedEmail(user.email, user.displayName);
      } else {
        await sendCreatorRejectedEmail(user.email, user.displayName, reason);
      }
    }
  } catch (_) {}
}

export async function notifyReportResolved(reporterId: string, comicTitle: string): Promise<void> {
  await createNotification({
    userId: reporterId,
    type: 'report_resolved',
    title: 'Жалоба рассмотрена',
    body: `Ваша жалоба на комикс «${comicTitle}» рассмотрена администрацией.`,
  });
  try {
    const user = await User.findByPk(reporterId, { attributes: ['email', 'displayName'] });
    if (user) await sendReportResolvedEmail(user.email, user.displayName, comicTitle);
  } catch (_) {}
}
