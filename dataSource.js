"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const app_1 = require("../app");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'mysql',
    host: 'sql.freedb.tech',
    port: 3306,
    username: 'freedb_test-bot',
    password: 'q456sV$Vs99*paV',
    database: 'freedb_test-bot',
    dropSchema: false,
    synchronize: true,
    entities: [app_1.Pizza, app_1.Topping],
});
exports.AppDataSource.initialize()
    .then(() => {
    console.log('Data Source has been initialized!');
})
    .catch((err) => {
    console.error('Error during Data Source initialization', err);
});
