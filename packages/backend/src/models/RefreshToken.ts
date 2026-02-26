import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

interface RefreshTokenAttributes {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt?: Date;
}

interface RefreshTokenCreationAttributes extends Optional<RefreshTokenAttributes, 'id' | 'createdAt'> {}

export class RefreshToken extends Model<RefreshTokenAttributes, RefreshTokenCreationAttributes> implements RefreshTokenAttributes {
  declare id: string;
  declare userId: string;
  declare token: string;
  declare expiresAt: Date;
  declare readonly createdAt: Date;

  public isExpired(): boolean {
    return new Date() > this.expiresAt;
  }
}

RefreshToken.init(
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
    token: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at'
    }
  },
  {
    sequelize,
    tableName: 'refresh_tokens',
    timestamps: true,
    updatedAt: false,
    underscored: true,
    indexes: [
      { fields: ['token'] },
      { fields: ['user_id'] }
    ]
  }
);
