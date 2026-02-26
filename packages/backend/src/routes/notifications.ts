import { Router } from 'express';
import { Notification } from '../models/Notification.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { Op } from 'sequelize';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit)) || 30, 100);
    const offset = parseInt(String(req.query.offset)) || 0;

    const { rows, count } = await Notification.findAndCountAll({
      where: { userId: req.user!.id },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    const unreadCount = await Notification.count({
      where: { userId: req.user!.id, isRead: false },
    });

    res.json({ success: true, data: { notifications: rows, total: count, unreadCount } });
  } catch (err) { next(err); }
});

router.get('/unread-count', async (req: AuthRequest, res, next) => {
  try {
    const count = await Notification.count({ where: { userId: req.user!.id, isRead: false } });
    res.json({ success: true, data: { count } });
  } catch (err) { next(err); }
});

router.post('/:id/read', async (req: AuthRequest, res, next) => {
  try {
    await Notification.update(
      { isRead: true },
      { where: { id: req.params.id, userId: req.user!.id } }
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.post('/read-all', async (req: AuthRequest, res, next) => {
  try {
    await Notification.update(
      { isRead: true },
      { where: { userId: req.user!.id, isRead: false } }
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    await Notification.destroy({ where: { id: req.params.id, userId: req.user!.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.delete('/', async (req: AuthRequest, res, next) => {
  try {
    await Notification.destroy({ where: { userId: req.user!.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
