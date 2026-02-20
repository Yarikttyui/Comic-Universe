import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

interface ChoiceHistory {
  pageId: string;
  choiceId: string;
  timestamp: Date;
}

interface ReadingProgressAttributes {
  id: string;
  userId: string;
  comicId: string;
  currentPageId: string;
  visitedPages: string[];
  choicesHistory: ChoiceHistory[];
  variables: Record<string, any>;
  inventory: string[];
  unlockedEndings: string[];
  startedAt: Date;
  totalTimeSeconds: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ReadingProgressCreationAttributes extends Optional<ReadingProgressAttributes, 'id' | 'visitedPages' | 'choicesHistory' | 'variables' | 'inventory' | 'unlockedEndings' | 'startedAt' | 'totalTimeSeconds' | 'createdAt' | 'updatedAt'> {}

export class ReadingProgress extends Model<ReadingProgressAttributes, ReadingProgressCreationAttributes> implements ReadingProgressAttributes {
  declare id: string;
  declare userId: string;
  declare comicId: string;
  declare currentPageId: string;
  declare visitedPages: string[];
  declare choicesHistory: ChoiceHistory[];
  declare variables: Record<string, any>;
  declare inventory: string[];
  declare unlockedEndings: string[];
  declare startedAt: Date;
  declare totalTimeSeconds: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ReadingProgress.init(
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
    comicId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'comic_id',
      references: {
        model: 'comics',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    currentPageId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'current_page_id'
    },
    visitedPages: {
      type: DataTypes.JSON,
      defaultValue: [],
      field: 'visited_pages',
      get() {
        const value = this.getDataValue('visitedPages');
        return value ? (typeof value === 'string' ? JSON.parse(value) : value) : [];
      }
    },
    choicesHistory: {
      type: DataTypes.JSON,
      defaultValue: [],
      field: 'choices_history',
      get() {
        const value = this.getDataValue('choicesHistory');
        return value ? (typeof value === 'string' ? JSON.parse(value) : value) : [];
      }
    },
    variables: {
      type: DataTypes.JSON,
      defaultValue: {},
      get() {
        const value = this.getDataValue('variables');
        return value ? (typeof value === 'string' ? JSON.parse(value) : value) : {};
      }
    },
    inventory: {
      type: DataTypes.JSON,
      defaultValue: [],
      get() {
        const value = this.getDataValue('inventory');
        return value ? (typeof value === 'string' ? JSON.parse(value) : value) : [];
      }
    },
    unlockedEndings: {
      type: DataTypes.JSON,
      defaultValue: [],
      field: 'unlocked_endings',
      get() {
        const value = this.getDataValue('unlockedEndings');
        return value ? (typeof value === 'string' ? JSON.parse(value) : value) : [];
      }
    },
    startedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'started_at'
    },
    totalTimeSeconds: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_time_seconds'
    }
  },
  {
    sequelize,
    tableName: 'reading_progress',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['user_id', 'comic_id'] }
    ]
  }
);
