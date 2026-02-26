import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

export type NotificationType =
  | 'comic_approved'
  | 'comic_rejected'
  | 'new_comment'
  | 'new_comic_by_author'
  | 'report_resolved'
  | 'creator_request_approved'
  | 'creator_request_rejected';

interface NotificationAttributes {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string | null;
  payload: Record<string, any> | null;
  isRead: boolean;
  createdAt?: Date;
}

interface NotificationCreation extends Optional<NotificationAttributes, 'id' | 'body' | 'payload' | 'isRead' | 'createdAt'> {}

export class Notification extends Model<NotificationAttributes, NotificationCreation> implements NotificationAttributes {
  declare id: string;
  declare userId: string;
  declare type: NotificationType;
  declare title: string;
  declare body: string | null;
  declare payload: Record<string, any> | null;
  declare isRead: boolean;
  declare readonly createdAt: Date;
}

Notification.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
    type: {
      type: DataTypes.ENUM(
        'comic_approved', 'comic_rejected', 'new_comment',
        'new_comic_by_author', 'report_resolved',
        'creator_request_approved', 'creator_request_rejected'
      ),
      allowNull: false,
    },
    title: { type: DataTypes.STRING(255), allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
    payload: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
      get() {
        const v = this.getDataValue('payload');
        return v ? (typeof v === 'string' ? JSON.parse(v) : v) : null;
      },
    },
    isRead: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_read' },
  },
  {
    sequelize,
    tableName: 'notifications',
    timestamps: true,
    updatedAt: false,
    underscored: true,
    indexes: [
      { fields: ['user_id', 'is_read'] },
    ],
  }
);
