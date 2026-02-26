import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

export type ComicRevisionStatus = 'draft' | 'pending_review' | 'approved' | 'rejected';

interface ComicRevisionAttributes {
  id: string;
  comicId: string;
  version: number;
  status: ComicRevisionStatus;
  payloadJson: Record<string, any>;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ComicRevisionCreationAttributes
  extends Optional<
    ComicRevisionAttributes,
    | 'id'
    | 'version'
    | 'status'
    | 'payloadJson'
    | 'submittedAt'
    | 'reviewedAt'
    | 'reviewedBy'
    | 'rejectionReason'
    | 'createdAt'
    | 'updatedAt'
  > {}

export class ComicRevision
  extends Model<ComicRevisionAttributes, ComicRevisionCreationAttributes>
  implements ComicRevisionAttributes
{
  declare id: string;
  declare comicId: string;
  declare version: number;
  declare status: ComicRevisionStatus;
  declare payloadJson: Record<string, any>;
  declare submittedAt: Date | null;
  declare reviewedAt: Date | null;
  declare reviewedBy: string | null;
  declare rejectionReason: string | null;
  declare createdBy: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ComicRevision.init(
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
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    status: {
      type: DataTypes.ENUM('draft', 'pending_review', 'approved', 'rejected'),
      defaultValue: 'draft',
    },
    payloadJson: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      field: 'payload_json',
      get() {
        const value = this.getDataValue('payloadJson');
        return value ? (typeof value === 'string' ? JSON.parse(value) : value) : {};
      },
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'submitted_at',
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'reviewed_at',
    },
    reviewedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'reviewed_by',
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'rejection_reason',
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'created_by',
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  },
  {
    sequelize,
    tableName: 'comic_revisions',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['comic_id', 'version'] },
      { fields: ['status'] },
      { fields: ['created_by'] },
    ],
  }
);
