import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

export type ComicReportStatus = 'open' | 'resolved';

interface ComicReportAttributes {
  id: string;
  comicId: string;
  reporterId: string;
  reason: string;
  status: ComicReportStatus;
  resolvedBy: string | null;
  resolvedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ComicReportCreationAttributes
  extends Optional<
    ComicReportAttributes,
    'id' | 'status' | 'resolvedBy' | 'resolvedAt' | 'createdAt' | 'updatedAt'
  > {}

export class ComicReport
  extends Model<ComicReportAttributes, ComicReportCreationAttributes>
  implements ComicReportAttributes
{
  declare id: string;
  declare comicId: string;
  declare reporterId: string;
  declare reason: string;
  declare status: ComicReportStatus;
  declare resolvedBy: string | null;
  declare resolvedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ComicReport.init(
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
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'resolved_at',
    },
  },
  {
    sequelize,
    tableName: 'comic_reports',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['comic_id'] },
      { fields: ['reporter_id'] },
      { fields: ['status'] },
    ],
  }
);
