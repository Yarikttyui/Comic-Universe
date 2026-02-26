import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

interface UploadedFileAttributes {
  id: string;
  ownerUserId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  publicUrl: string;
  createdAt?: Date;
}

interface UploadedFileCreationAttributes
  extends Optional<UploadedFileAttributes, 'id' | 'createdAt'> {}

export class UploadedFile
  extends Model<UploadedFileAttributes, UploadedFileCreationAttributes>
  implements UploadedFileAttributes
{
  declare id: string;
  declare ownerUserId: string;
  declare originalName: string;
  declare mimeType: string;
  declare sizeBytes: number;
  declare storagePath: string;
  declare publicUrl: string;
  declare readonly createdAt: Date;
}

UploadedFile.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    ownerUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'owner_user_id',
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    originalName: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'original_name',
    },
    mimeType: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'mime_type',
    },
    sizeBytes: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'size_bytes',
    },
    storagePath: {
      type: DataTypes.STRING(1000),
      allowNull: false,
      field: 'storage_path',
    },
    publicUrl: {
      type: DataTypes.STRING(1000),
      allowNull: false,
      field: 'public_url',
    },
  },
  {
    sequelize,
    tableName: 'uploaded_files',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    underscored: true,
    indexes: [{ fields: ['owner_user_id'] }, { fields: ['created_at'] }],
  }
);
