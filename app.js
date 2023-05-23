"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const ymaps_1 = __importDefault(require("ymaps"));
const Bot = require('node-telegram-bot-api');
const express = require('express');
(0, dotenv_1.config)();
const cors = require('cors');
const token = process.env.TOKEN;
const bot = new Bot(token, { polling: true });
const webApp = 'https://web-tg-app.netlify.app';
const webAppForm = 'https://web-tg-app.netlify.app/form';
let pizzaArray = [];
const app = express();
app.use(cors());
app.use(express.json());
bot.on('message', (msg) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const chatId = msg.chat.id;
    const message = msg.text;
    if (message === '/start') {
        yield bot.sendMessage(chatId, 'чтобы заказать пицце, нажмите на кнопку "перейти в магазин"', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'перейти в магазин', web_app: { url: webApp } }],
                ],
            },
        });
        setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
            yield bot.sendMessage(chatId, 'чтобы завершить заказ, нажмите "заполнить форму"', {
                reply_markup: {
                    keyboard: [
                        [{ text: 'заполнить форму', web_app: { url: webAppForm } }],
                    ],
                },
            });
        }), 2000);
    }
    if ((_a = msg === null || msg === void 0 ? void 0 : msg.web_app_data) === null || _a === void 0 ? void 0 : _a.data) {
        const data = JSON.parse((_b = msg === null || msg === void 0 ? void 0 : msg.web_app_data) === null || _b === void 0 ? void 0 : _b.data);
        const time = yield calcTime(data.address);
        try {
            console.log(data);
            yield bot.sendMessage(chatId, `Спасибо за покупку ${data.name}\nкурьер уже в пути`);
            yield bot.sendMessage(chatId, 'Время ожидания заказа: ' + time + ' минут', {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'заказать еще', web_app: { url: webApp } }],
                    ],
                },
            });
        }
        catch (e) {
            console.log(e);
        }
    }
}));
app.post('/web-data', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { queryId, products = [], totalPrice } = req.body;
    try {
        if (totalPrice > 0) {
            yield bot.answerWebAppQuery(queryId, {
                type: 'article',
                id: queryId,
                title: 'Успешная покупка',
                input_message_content: {
                    message_text: ` Поздравляю с покупкой, вы приобрели товар на сумму ${totalPrice}\nВаши покупки:\n${products.map((item) => {
                        pizzaArray.push(item);
                        return `\n🍕  ${item.type}`;
                    })}, \n\nчтобы указать данные и узнать через сколько прибудет ваш заказ,нажмите на кнопку с изображением 4 точек внизу в поле ввода сообщения и  нажмите на кнопку "заполнить форму"`,
                },
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'перейти в магазин', web_app: { url: webApp } }],
                    ],
                },
            });
        }
        else {
            yield bot.answerWebAppQuery(queryId, {
                type: 'article',
                id: queryId,
                input_message_content: {
                    message_text: 'Неудалось купить товары, попробуйте снова',
                },
            });
        }
        return res.status(200).json(pizzaArray);
    }
    catch (e) {
        return res.status(500).json({ error: 'nothing send' });
    }
}));
app.get('/pizza', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(200).send(pizzaArray);
}));
app.listen(8080, () => console.log(`server started on address http://localhost:8080`));
const calcTime = (address) => {
    const origin = 'Новотушинская, 5'; // адрес отправления
    const geocodeParams = {
        geocode: address,
        boundedBy: [
            [55.089079, 36.364133],
            [56.054863, 38.119333],
        ], // прямоугольная область поиска
    };
    const originPromise = ymaps_1.default.geocode(origin, { results: 1 }).then((res) => {
        const originCoords = res.geoObjects.get(0).geometry.getCoordinates();
        return originCoords;
    });
    const destinationPromise = ymaps_1.default.geocode(geocodeParams).then((res) => {
        const destinationCoords = res.geoObjects.get(0).geometry.getCoordinates();
        return destinationCoords;
    });
    return Promise.all([originPromise, destinationPromise]).then(([originCoords, destinationCoords]) => {
        const multiRoute = new ymaps_1.default.multiRouter.MultiRoute({
            referencePoints: [originCoords, destinationCoords],
            params: {
                routingMode: 'auto',
            },
        }, { routeActiveStrokeWidth: 6 });
        return multiRoute.model.events
            .add('requestsuccess', () => {
            const time = multiRoute.getActiveRoute().properties.get('duration');
            const durationSeconds = time ? time.value : 0; // длительность маршрута в секундах
            const fixedTimeMinutes = 15; // фиксированное время подготовки заказа
            const deliveryTimePerPizzaMinutes = 15; // время доставки одной пиццы
            const returnTimeMinutes = 15; // время возврата на базу после доставки пиццы
            const waitingTimeBetweenOrdersMinutes = 10; // время ожидания между заказами
            const totalTimeSeconds = fixedTimeMinutes * 60 +
                (2 * deliveryTimePerPizzaMinutes + 2 * returnTimeMinutes) * 60 +
                waitingTimeBetweenOrdersMinutes * 60 +
                durationSeconds;
            const minutes = Math.floor(totalTimeSeconds / 60);
            return minutes;
        })
            .catch((e) => console.error(e));
    });
};
