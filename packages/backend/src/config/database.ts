import { Sequelize } from 'sequelize';
import { config } from './index.js';

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  username: config.db.user,
  password: config.db.password,
  logging: config.isProduction ? false : console.log,
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

    if (config.db.sync) {
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
