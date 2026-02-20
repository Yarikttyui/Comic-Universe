import { Router } from 'express';
import { Comic, User } from '../models/index.js';
import { errors } from '../middleware/errorHandler.js';

const router = Router();

router.get('/:creatorNick', async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: { creatorNick: req.params.creatorNick },
      attributes: ['id', 'displayName', 'avatar', 'creatorNick', 'bio', 'role', 'createdAt'],
    });

    if (!user || user.role !== 'creator') {
      throw errors.notFound('Создатель не найден');
    }

    const comics = await Comic.findAll({
      where: {
        authorId: user.id,
        status: 'published',
      },
      order: [['createdAt', 'DESC']],
      attributes: [
        'id',
        'title',
        'description',
        'coverImage',
        'genres',
        'size',
        'rating',
        'ratingCount',
        'readCount',
        'totalPages',
        'totalEndings',
        'createdAt',
      ],
    });

    res.json({
      success: true,
      data: {
        creator: user,
        comics,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
