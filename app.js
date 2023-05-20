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
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const Bot = require('node-telegram-bot-api');
const express = require('express');
(0, dotenv_1.config)();
const cors = require('cors');
const token = process.env.TOKEN;
const bot = new Bot(token, { polling: true });
const webApp = 'https://tg-react-test.netlify.app';
const webAppForm = 'https://tg-react-test.netlify.app/form';
let pizzaArray = [];
const app = express();
app.use(cors());
app.use(express.json());
bot.on('message', (msg) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const chatId = msg.chat.id;
    const message = msg.text;
    if (message === '/start') {
        yield bot.sendMessage(chatId, 'заполните форму', {
            reply_markup: {
                keyboard: [[{ text: 'заполнить форму', web_app: { url: webAppForm } }]],
            },
        });
        yield bot.sendMessage(chatId, 'Нажми на кнопку ниже, чтобы заполнить форму', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'перейти в магазин', web_app: { url: webApp } }],
                ],
            },
        });
    }
    if ((_a = msg === null || msg === void 0 ? void 0 : msg.web_app_data) === null || _a === void 0 ? void 0 : _a.data) {
        const data = JSON.parse((_b = msg === null || msg === void 0 ? void 0 : msg.web_app_data) === null || _b === void 0 ? void 0 : _b.data);
        try {
            console.log(data);
            yield bot.sendMessage(chatId, 'thanks for order');
            yield bot.sendMessage(chatId, 'Ваша улица ' + data.street);
            yield bot.sendMessage(chatId, 'Номер вашего дома ' + data.house);
        }
        catch (e) {
            console.log(e);
        }
    }
}));
app.post('/web-data', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { queryId, products = [], totalPrice } = req.body;
    try {
        yield bot.answerWebAppQuery(queryId, {
            type: 'article',
            id: queryId,
            title: 'Успешная покупка',
            input_message_content: {
                message_text: ` Поздравляю с покупкой, вы приобрели товар на сумму ${totalPrice}, ${products
                    .map((item) => {
                    pizzaArray.push(item);
                    return item.name;
                })
                    .join(', ')}`,
            },
        });
        return res.status(200).json('All Done');
    }
    catch (e) {
        return res.status(500).json({ error: 'nothing send' });
    }
}));
app.get('/pizza', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(200).send(pizzaArray);
}));
app.listen(8080, () => console.log(`server started on address http://localhost:8080`));
