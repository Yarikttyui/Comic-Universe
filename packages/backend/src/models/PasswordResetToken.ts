import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

interface PasswordResetTokenAttributes {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt?: Date;
}

interface PasswordResetTokenCreationAttributes
  extends Optional<PasswordResetTokenAttributes, 'id' | 'used' | 'createdAt'> {}

export class PasswordResetToken
  extends Model<PasswordResetTokenAttributes, PasswordResetTokenCreationAttributes>
  implements PasswordResetTokenAttributes
{
  declare id: string;
  declare userId: string;
  declare token: string;
  declare expiresAt: Date;
  declare used: boolean;
  declare readonly createdAt: Date;

  public isExpired(): boolean {
    return new Date() > this.expiresAt;
  }
}

PasswordResetToken.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    token: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at',
    },
    used: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'password_reset_tokens',
    timestamps: true,
    updatedAt: false,
    underscored: true,
    indexes: [{ fields: ['token'] }, { fields: ['user_id'] }],
  },
);
