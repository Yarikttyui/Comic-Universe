import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  database: process.env.DB_NAME || 'comic_universe',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '12345678',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  },
});

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('MySQL connection established successfully');

    if (process.env.DB_SYNC === 'true') {
      await sequelize.sync({ alter: true });
      console.log('Database synchronized through sequelize.sync');
    }
  } catch (error) {
    console.error('Unable to connect to MySQL:', error);
    throw error;
  }
};

process.on('SIGINT', async () => {
  await sequelize.close();
  console.log('MySQL connection closed');
  process.exit(0);
});

export default sequelize;
