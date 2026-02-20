import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

export type ComicCommentStatus = 'visible' | 'hidden' | 'deleted';

interface ComicCommentAttributes {
  id: string;
  comicId: string;
  userId: string;
  body: string;
  status: ComicCommentStatus;
  deletedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ComicCommentCreationAttributes
  extends Optional<
    ComicCommentAttributes,
    'id' | 'status' | 'deletedAt' | 'createdAt' | 'updatedAt'
  > {}

export class ComicComment
  extends Model<ComicCommentAttributes, ComicCommentCreationAttributes>
  implements ComicCommentAttributes
{
  declare id: string;
  declare comicId: string;
  declare userId: string;
  declare body: string;
  declare status: ComicCommentStatus;
  declare deletedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ComicComment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    comicId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'comic_id',
      references: {
        model: 'comics',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [1, 5000],
      },
    },
    status: {
      type: DataTypes.ENUM('visible', 'hidden', 'deleted'),
      allowNull: false,
      defaultValue: 'visible',
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at',
    },
  },
  {
    sequelize,
    tableName: 'comic_comments',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['comic_id', 'status'] },
      { fields: ['user_id'] },
    ],
  }
);
