import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';
import bcrypt from 'bcryptjs';

interface UserAttributes {
  id: string;
  email: string;
  emailVerified: boolean;
  verificationCode: string | null;
  verificationCodeExpires: Date | null;
  displayName: string;
  password: string;
  avatar: string | null;
  creatorNick: string | null;
  role: 'reader' | 'creator' | 'admin';
  onboardingStage: 'role_select' | 'creator_profile' | 'done';
  accountStatus: 'active' | 'banned';
  bannedUntil: Date | null;
  banReason: string | null;
  bio: string;
  isPremium: boolean;
  comicsRead: number;
  totalChoicesMade: number;
  endingsUnlocked: number;
  readingTimeMinutes: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes
  extends Optional<
    UserAttributes,
    | 'id'
    | 'emailVerified'
    | 'verificationCode'
    | 'verificationCodeExpires'
    | 'avatar'
    | 'creatorNick'
    | 'role'
    | 'onboardingStage'
    | 'accountStatus'
    | 'bannedUntil'
    | 'banReason'
    | 'bio'
    | 'isPremium'
    | 'comicsRead'
    | 'totalChoicesMade'
    | 'endingsUnlocked'
    | 'readingTimeMinutes'
    | 'createdAt'
    | 'updatedAt'
  > {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: string;
  declare email: string;
  declare emailVerified: boolean;
  declare verificationCode: string | null;
  declare verificationCodeExpires: Date | null;
  declare displayName: string;
  declare password: string;
  declare avatar: string | null;
  declare creatorNick: string | null;
  declare role: 'reader' | 'creator' | 'admin';
  declare onboardingStage: 'role_select' | 'creator_profile' | 'done';
  declare accountStatus: 'active' | 'banned';
  declare bannedUntil: Date | null;
  declare banReason: string | null;
  declare bio: string;
  declare isPremium: boolean;
  declare comicsRead: number;
  declare totalChoicesMade: number;
  declare endingsUnlocked: number;
  declare readingTimeMinutes: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  public async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  public toSafeJSON() {
    const values = this.get({ plain: true }) as any;
    delete values.password;
    values.isOnboardingCompleted = values.onboardingStage === 'done';
    return values;
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'email_verified',
    },
    verificationCode: {
      type: DataTypes.STRING(6),
      allowNull: true,
      defaultValue: null,
      field: 'verification_code',
    },
    verificationCodeExpires: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
      field: 'verification_code_expires',
    },
    displayName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'display_name',
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    avatar: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      defaultValue: null,
    },
    creatorNick: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
      field: 'creator_nick',
      validate: {
        len: [3, 50],
      },
    },
    role: {
      type: DataTypes.ENUM('reader', 'creator', 'admin'),
      defaultValue: 'reader',
    },
    onboardingStage: {
      type: DataTypes.ENUM('role_select', 'creator_profile', 'done'),
      allowNull: false,
      defaultValue: 'done',
      field: 'onboarding_stage',
    },
    accountStatus: {
      type: DataTypes.ENUM('active', 'banned'),
      allowNull: false,
      defaultValue: 'active',
      field: 'account_status',
    },
    bannedUntil: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
      field: 'banned_until',
    },
    banReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
      field: 'ban_reason',
    },
    bio: {
      type: DataTypes.STRING(500),
      defaultValue: '',
    },
    isPremium: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_premium',
    },
    comicsRead: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'comics_read',
    },
    totalChoicesMade: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_choices_made',
    },
    endingsUnlocked: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'endings_unlocked',
    },
    readingTimeMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'reading_time_minutes',
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password && !user.password.startsWith('$2')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password') && !user.password.startsWith('$2')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);
