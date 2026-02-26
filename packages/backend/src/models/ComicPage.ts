import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

export interface IDialogue {
  id: string;
  type: string;
  text: string;
  character?: string;
  position: { x: number; y: number };
}

export interface IPanel {
  id: string;
  order: number;
  imageUrl: string;
  layout: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  dialogues: IDialogue[];
}

export interface IChoice {
  id: string;
  choiceId?: string;
  text: string;
  targetPageId: string;
  icon?: string;
  position?: { x: number; y: number; w?: number; h?: number };
  style?: string;
}

interface ComicPageAttributes {
  id: string;
  comicId: string;
  pageId: string;
  pageNumber: number;
  title: string | null;
  panels: IPanel[];
  choices: IChoice[];
  isEnding: boolean;
  endingType: string | null;
  endingTitle: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ComicPageCreationAttributes extends Optional<ComicPageAttributes, 'id' | 'title' | 'panels' | 'choices' | 'isEnding' | 'endingType' | 'endingTitle' | 'createdAt' | 'updatedAt'> {}

export class ComicPage extends Model<ComicPageAttributes, ComicPageCreationAttributes> implements ComicPageAttributes {
  declare id: string;
  declare comicId: string;
  declare pageId: string;
  declare pageNumber: number;
  declare title: string | null;
  declare panels: IPanel[];
  declare choices: IChoice[];
  declare isEnding: boolean;
  declare endingType: string | null;
  declare endingTitle: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ComicPage.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
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
    pageId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'page_id'
    },
    pageNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'page_number'
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    panels: {
      type: DataTypes.JSON,
      defaultValue: [],
      get() {
        const value = this.getDataValue('panels');
        return value ? (typeof value === 'string' ? JSON.parse(value) : value) : [];
      }
    },
    choices: {
      type: DataTypes.JSON,
      defaultValue: [],
      get() {
        const value = this.getDataValue('choices');
        return value ? (typeof value === 'string' ? JSON.parse(value) : value) : [];
      }
    },
    isEnding: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_ending'
    },
    endingType: {
      type: DataTypes.ENUM('good', 'bad', 'neutral', 'secret'),
      allowNull: true,
      field: 'ending_type'
    },
    endingTitle: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'ending_title'
    }
  },
  {
    sequelize,
    tableName: 'comic_pages',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['comic_id', 'page_id'] },
      { fields: ['comic_id', 'page_number'] }
    ]
  }
);
