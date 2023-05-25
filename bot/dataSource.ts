import { DataSource } from 'typeorm';
import { Pizza, Topping } from './app';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: 'sql.freedb.tech',
  port: 3306,
  username: 'freedb_test-bot',
  password: 'q456sV$Vs99*paV',
  database: 'freedb_test-bot',
  dropSchema: false,
  synchronize: false,
  entities: [Pizza, Topping],
});

AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
  })
  .catch((err) => {
    console.error('Error during Data Source initialization', err);
  });
