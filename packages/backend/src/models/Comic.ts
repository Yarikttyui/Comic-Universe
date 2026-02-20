import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

interface ComicAttributes {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  authorId: string | null;
  authorName: string;
  publishedRevisionId: string | null;
  genres: string[];
  tags: string[];
  status: 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived';
  hiddenByAdmin: boolean;
  size: 'small' | 'medium' | 'large';
  startPageId: string;
  totalPages: number;
  totalEndings: number;
  rating: number;
  ratingCount: number;
  readCount: number;
  estimatedMinutes: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ComicCreationAttributes extends Optional<ComicAttributes, 'id' | 'authorId' | 'publishedRevisionId' | 'genres' | 'tags' | 'status' | 'hiddenByAdmin' | 'size' | 'totalPages' | 'totalEndings' | 'rating' | 'ratingCount' | 'readCount' | 'estimatedMinutes' | 'createdAt' | 'updatedAt'> {}

export class Comic extends Model<ComicAttributes, ComicCreationAttributes> implements ComicAttributes {
  declare id: string;
  declare title: string;
  declare description: string;
  declare coverImage: string;
  declare authorId: string | null;
  declare authorName: string;
  declare publishedRevisionId: string | null;
  declare genres: string[];
  declare tags: string[];
  declare status: 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived';
  declare hiddenByAdmin: boolean;
  declare size: 'small' | 'medium' | 'large';
  declare startPageId: string;
  declare totalPages: number;
  declare totalEndings: number;
  declare rating: number;
  declare ratingCount: number;
  declare readCount: number;
  declare estimatedMinutes: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Comic.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    coverImage: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'cover_image'
    },
    authorId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'author_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    authorName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'author_name'
    },
    publishedRevisionId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'published_revision_id'
    },
    genres: {
      type: DataTypes.JSON,
      defaultValue: [],
      get() {
        const value = this.getDataValue('genres');
        return value ? (typeof value === 'string' ? JSON.parse(value) : value) : [];
      }
    },
    tags: {
      type: DataTypes.JSON,
      defaultValue: [],
      get() {
        const value = this.getDataValue('tags');
        return value ? (typeof value === 'string' ? JSON.parse(value) : value) : [];
      }
    },
    status: {
      type: DataTypes.ENUM('draft', 'pending_review', 'published', 'rejected', 'archived'),
      defaultValue: 'draft'
    },
    hiddenByAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'hidden_by_admin'
    },
    size: {
      type: DataTypes.ENUM('small', 'medium', 'large'),
      defaultValue: 'small'
    },
    startPageId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'start_page_id'
    },
    totalPages: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_pages'
    },
    totalEndings: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_endings'
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0,
      validate: { min: 0, max: 5 }
    },
    ratingCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'rating_count'
    },
    readCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'read_count'
    },
    estimatedMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
      field: 'estimated_minutes'
    }
  },
  {
    sequelize,
    tableName: 'comics',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['status'] },
      { fields: ['author_id'] },
      { fields: ['published_revision_id'] },
      { fields: ['read_count'] },
      { fields: ['rating'] }
    ]
  }
);
