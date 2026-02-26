import { Router } from 'express';
import { Subscription } from '../models/Subscription.js';
import { User } from '../models/User.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/count/:authorId', async (_req, res, next) => {
  try {
    const count = await Subscription.count({ where: { authorId: _req.params.authorId } });
    res.json({ success: true, data: { count } });
  } catch (err) { next(err); }
});

router.use(authenticate);

router.get('/my', async (req: AuthRequest, res, next) => {
  try {
    const subs = await Subscription.findAll({
      where: { subscriberId: req.user!.id },
      include: [{ model: User, as: 'author', attributes: ['id', 'displayName', 'creatorNick', 'avatar'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: { subscriptions: subs } });
  } catch (err) { next(err); }
});

router.post('/:authorId', async (req: AuthRequest, res, next) => {
  try {
    const { authorId } = req.params;
    if (authorId === req.user!.id) {
      return res.status(400).json({ success: false, error: { message: 'Нельзя подписаться на себя' } });
    }
    const author = await User.findByPk(authorId);
    if (!author) return res.status(404).json({ success: false, error: { message: 'Пользователь не найден' } });

    const [sub, created] = await Subscription.findOrCreate({
      where: { subscriberId: req.user!.id, authorId },
      defaults: { subscriberId: req.user!.id, authorId },
    });

    res.json({ success: true, data: { subscribed: true, subscription: sub } });
  } catch (err) { next(err); }
});

router.delete('/:authorId', async (req: AuthRequest, res, next) => {
  try {
    const deleted = await Subscription.destroy({
      where: { subscriberId: req.user!.id, authorId: req.params.authorId },
    });
    res.json({ success: true, data: { subscribed: false, deleted: deleted > 0 } });
  } catch (err) { next(err); }
});

router.get('/check/:authorId', async (req: AuthRequest, res, next) => {
  try {
    const sub = await Subscription.findOne({
      where: { subscriberId: req.user!.id, authorId: req.params.authorId },
    });
    res.json({ success: true, data: { subscribed: !!sub } });
  } catch (err) { next(err); }
});

export default router;
