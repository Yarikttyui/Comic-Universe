import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

interface SubscriptionAttributes {
  id: string;
  subscriberId: string;
  authorId: string;
  createdAt?: Date;
}

interface SubscriptionCreation extends Optional<SubscriptionAttributes, 'id' | 'createdAt'> {}

export class Subscription extends Model<SubscriptionAttributes, SubscriptionCreation> implements SubscriptionAttributes {
  declare id: string;
  declare subscriberId: string;
  declare authorId: string;
  declare readonly createdAt: Date;
}

Subscription.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    subscriberId: { type: DataTypes.UUID, allowNull: false, field: 'subscriber_id' },
    authorId: { type: DataTypes.UUID, allowNull: false, field: 'author_id' },
  },
  {
    sequelize,
    tableName: 'subscriptions',
    timestamps: true,
    updatedAt: false,
    underscored: true,
    indexes: [
      { unique: true, fields: ['subscriber_id', 'author_id'] },
    ],
  }
);
