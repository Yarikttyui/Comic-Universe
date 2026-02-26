import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

interface ComicRatingAttributes {
  id: string;
  comicId: string;
  userId: string;
  rating: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ComicRatingCreationAttributes
  extends Optional<ComicRatingAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class ComicRating
  extends Model<ComicRatingAttributes, ComicRatingCreationAttributes>
  implements ComicRatingAttributes
{
  declare id: string;
  declare comicId: string;
  declare userId: string;
  declare rating: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ComicRating.init(
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
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5 },
    },
  },
  {
    sequelize,
    tableName: 'comic_ratings',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['comic_id', 'user_id'] },
      { fields: ['user_id'] },
    ],
  }
);
