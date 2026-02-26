import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

export type CommentReportStatus = 'open' | 'resolved';

interface CommentReportAttributes {
  id: string;
  commentId: string;
  reporterId: string;
  reason: string;
  status: CommentReportStatus;
  resolvedBy: string | null;
  resolvedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CommentReportCreationAttributes
  extends Optional<
    CommentReportAttributes,
    'id' | 'status' | 'resolvedBy' | 'resolvedAt' | 'createdAt' | 'updatedAt'
  > {}

export class CommentReport
  extends Model<CommentReportAttributes, CommentReportCreationAttributes>
  implements CommentReportAttributes
{
  declare id: string;
  declare commentId: string;
  declare reporterId: string;
  declare reason: string;
  declare status: CommentReportStatus;
  declare resolvedBy: string | null;
  declare resolvedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

CommentReport.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    commentId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'comment_id',
      references: {
        model: 'comic_comments',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    reporterId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'reporter_id',
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    reason: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        len: [3, 500],
      },
    },
    status: {
      type: DataTypes.ENUM('open', 'resolved'),
      defaultValue: 'open',
    },
    resolvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'resolved_by',
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'resolved_at',
    },
  },
  {
    sequelize,
    tableName: 'comment_reports',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['comment_id', 'reporter_id'] },
      { fields: ['status'] },
    ],
  }
);
