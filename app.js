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
const axios_1 = __importDefault(require("axios"));
const Bot = require('node-telegram-bot-api');
const express = require('express');
(0, dotenv_1.config)();
const cors = require('cors');
const token = process.env.TOKEN;
const bot = new Bot(token, { polling: true });
const webApp = 'https://web-tg-app.netlify.app';
const webAppForm = 'https://web-tg-app.netlify.app/form';
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
    const { queryId, orders = [], totalPrice } = req.body;
    try {
        if (totalPrice > 0) {
            yield bot.answerWebAppQuery(queryId, {
                type: 'article',
                id: queryId,
                title: 'Успешная покупка',
                input_message_content: {
                    message_text: ` Поздравляю с покупкой, вы приобрели товар на сумму ${totalPrice}\nВаши покупки:\n${orders.map((item) => {
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
                title: 'неудача',
                id: queryId,
                input_message_content: {
                    message_text: 'неудалось совершить покупку.так как покупка не может быть совершена на сумму 0',
                },
            });
        }
        return res.status(200).json();
    }
    catch (e) {
        return res.status(500).json({ error: 'nothing send' });
    }
}));
app.get('/pizza', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(200).send();
}));
app.listen(8080, () => console.log(`server started on address http://localhost:8080`));
const calcTime = (address) => __awaiter(void 0, void 0, void 0, function* () {
    const origin = 'Новотушинская 5';
    const baseUrl = 'https://nominatim.openstreetmap.org';
    const mode = 'driving';
    const timeToWait = 10;
    const originResponse = yield axios_1.default.get(`${baseUrl}/search?format=json&q=${origin}`);
    const originLatLong = {
        lat: originResponse.data[0].lat,
        lng: originResponse.data[0].lon,
    };
    const moscowCoords = { lat: 55.7558, lng: 37.6173 };
    const boundRadius = 50000;
    const viewboxCoords = {
        minLat: moscowCoords.lat - boundRadius / 111300,
        maxLat: moscowCoords.lat + boundRadius / 111300,
        minLng: moscowCoords.lng - boundRadius / (111300 * Math.cos(moscowCoords.lat)),
        maxLng: moscowCoords.lng + boundRadius / (111300 * Math.cos(moscowCoords.lat)),
    };
    const destinationResponse = yield axios_1.default.get(`${baseUrl}/search?format=json&street=${address.toLowerCase()}&countrycodes=RUS&viewbox=${viewboxCoords.minLng},${viewboxCoords.minLat},${viewboxCoords.maxLng},${viewboxCoords.maxLat}&bounded=1`);
    if (!destinationResponse.data.length) {
        throw new Error('Неверный адрес доставки');
    }
    const destinationLatLng = {
        lat: destinationResponse.data[0].lat,
        lng: destinationResponse.data[0].lon,
    };
    const routeResponse = yield axios_1.default.get(`https://router.project-osrm.org/route/v1/${mode}/${originLatLong.lng},${originLatLong.lat};${destinationLatLng.lng},${destinationLatLng.lat}?overview=false`);
    const routeDurationSeconds = routeResponse.data.routes[0].duration;
    const fixedTimeMinutes = 15;
    const deliveryTimePerPizzaMinutes = 15;
    const returnTimeMinutes = 15;
    const waitingTimeBetweenOrdersMinutes = timeToWait;
    const totalTimeSeconds = fixedTimeMinutes +
        (2 * deliveryTimePerPizzaMinutes + 2 * returnTimeMinutes) +
        waitingTimeBetweenOrdersMinutes +
        routeDurationSeconds;
    const hours = Math.floor(totalTimeSeconds / 3600);
    const minutes = Math.floor((totalTimeSeconds % 3600) / 60);
    const seconds = Math.floor(totalTimeSeconds % 60);
    const formattedDuration = `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    return formattedDuration;
});
