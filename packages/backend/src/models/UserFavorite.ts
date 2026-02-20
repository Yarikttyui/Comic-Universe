import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

interface UserFavoriteAttributes {
  id: string;
  userId: string;
  comicId: string;
  createdAt?: Date;
}

interface UserFavoriteCreationAttributes extends Optional<UserFavoriteAttributes, 'id' | 'createdAt'> {}

export class UserFavorite extends Model<UserFavoriteAttributes, UserFavoriteCreationAttributes> implements UserFavoriteAttributes {
  declare id: string;
  declare userId: string;
  declare comicId: string;
  declare readonly createdAt: Date;
}

UserFavorite.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    comicId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'comic_id',
      references: {
        model: 'comics',
        key: 'id'
      },
      onDelete: 'CASCADE'
    }
  },
  {
    sequelize,
    tableName: 'user_favorites',
    timestamps: true,
    updatedAt: false,
    underscored: true,
    indexes: [
      { unique: true, fields: ['user_id', 'comic_id'] }
    ]
  }
);
