import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

type CreatorRoleRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

interface CreatorRoleRequestAttributes {
  id: string;
  userId: string;
  desiredNick: string;
  motivation: string | null;
  status: CreatorRoleRequestStatus;
  adminComment: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CreatorRoleRequestCreationAttributes
  extends Optional<
    CreatorRoleRequestAttributes,
    | 'id'
    | 'motivation'
    | 'status'
    | 'adminComment'
    | 'reviewedBy'
    | 'reviewedAt'
    | 'createdAt'
    | 'updatedAt'
  > {}

export class CreatorRoleRequest
  extends Model<CreatorRoleRequestAttributes, CreatorRoleRequestCreationAttributes>
  implements CreatorRoleRequestAttributes
{
  declare id: string;
  declare userId: string;
  declare desiredNick: string;
  declare motivation: string | null;
  declare status: CreatorRoleRequestStatus;
  declare adminComment: string | null;
  declare reviewedBy: string | null;
  declare reviewedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

CreatorRoleRequest.init(
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
    },
    desiredNick: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'desired_nick',
      validate: {
        len: [3, 50],
      },
    },
    motivation: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      defaultValue: null,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    adminComment: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
      field: 'admin_comment',
    },
    reviewedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: null,
      field: 'reviewed_by',
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
      field: 'reviewed_at',
    },
  },
  {
    sequelize,
    tableName: 'creator_role_requests',
    timestamps: true,
    underscored: true,
  }
);
