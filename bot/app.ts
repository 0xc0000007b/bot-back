import { Message } from 'node-telegram-bot-api';
import { config } from 'dotenv';
import { Request, Response } from 'express';

import axios from 'axios';
import {BaseEntity, Column, createConnection, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn} from 'typeorm';
import {Pizza} from "./entities/Pizza";
import {Topping} from "./entities/Topping";

const Bot = require('node-telegram-bot-api');
const express = require('express');
config();
const cors = require('cors');
const token: unknown = process.env.TOKEN;
const bot = new Bot(token, { polling: true });
const webApp: string = 'https://web-tg-app.netlify.app';
const webAppForm: string = 'https://web-tg-app.netlify.app/form';

const app = express();
app.use(cors());
app.use(express.json());
let pizzaArray: PizzaInterface[] = [];

const createDb = async () => {
  await createConnection({
    type: 'mysql',
    host: 'sql.freedb.tech',
    port: 3306,
    username: 'freedb_test-bot',
    password: 'q456sV$Vs99*paV',
    database: 'freedb_test-bot',
    dropSchema: false,
    entities: [Pizza, Topping],
    synchronize: false,
  });
};

createDb()


bot.on('message', async (msg: Message) => {
  const chatId: number = msg.chat.id;
  const message: string | unknown = msg.text;
  if (message === '/start') {
    await bot.sendMessage(
      chatId,
      'чтобы заказать пицце, нажмите на кнопку "перейти в магазин"',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'перейти в магазин', web_app: { url: webApp } }],
          ],
        },
      }
    );
    setTimeout(async () => {
      await bot.sendMessage(
        chatId,
        'чтобы завершить заказ, нажмите "заполнить форму"',
        {
          reply_markup: {
            keyboard: [
              [{ text: 'заполнить форму', web_app: { url: webAppForm } }],
            ],
          },
        }
      );
    }, 2000);
  }
  if (msg?.web_app_data?.data) {
    const data = JSON.parse(msg?.web_app_data?.data);
    const time = await calcTime(data.address);
    try {
      console.log(data);
      await bot.sendMessage(
        chatId,
        `Спасибо за покупку ${data.name}\nкурьер уже в пути`
      );
      await bot.sendMessage(
        chatId,
        'Время ожидания заказа: ' + time + ' минут',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'заказать еще', web_app: { url: webApp } }],
            ],
          },
        }
      );
    } catch (e) {
      console.log(e);
    }
  }
});

app.post('/web-data', async (req, res) => {
  const { queryId, pizzas, totalPrice } = req.body;


  const pizza = new Pizza();

  console.log(pizzaArray + 'pizza array after pushing');
  try {
    if (totalPrice > 0) {
      await bot.answerWebAppQuery(queryId, {
        type: 'article',
        id: queryId,
        title: 'Успешная покупка',
        input_message_content: {
          message_text: ` Поздравляю с покупкой, вы приобрели товар на сумму ${totalPrice}\nВаши покупки:\n${pizzas.map(
            (item) => {
              pizza.type = item.type;
              pizza.orderDate = item.orderDate;
              pizza.toppings = item.toppings;
              pizza.orderTime = item.orderTime;
              Pizza.save(pizza);
              return `\n🍕  ${item.type}`;
            }
          )}, \n\nчтобы указать данные и узнать через сколько прибудет ваш заказ,нажмите на кнопку с изображением 4 точек внизу в поле ввода сообщения и  нажмите на кнопку "заполнить форму"`,
        },
        reply_markup: {
          inline_keyboard: [
            [{ text: 'перейти в магазин', web_app: { url: webApp } }],
          ],
        },
      });
      console.log(
        (await Pizza.getRepository().find()) + ' pizzas from database'
      );
    } else {
      await bot.answerWebAppQuery(queryId, {
        type: 'article',
        id: queryId,
        title: 'неудача',
        input_message_content: {
          message_text: `неудалось купить продукты`,
        },
        reply_markup: {
          inline_keyboard: [
            [{ text: 'перейти в магазин', web_app: { url: webApp } }],
          ],
        },
      });
    }
    return res.status(200).json(pizzas);
  } catch (e) {
    return res.status(500).json({ error: 'nothing send' });
  }
});
app.get('/', async (res: Response, req: Request) => {
  const pizzas = await Pizza.getRepository().find();
  return pizzas
});
app.listen(8080, () =>
  console.log(`server started on address http://localhost:8080`)
);
const calcTime = async (address: string) => {
  const origin: string = 'Новотушинская 5';
  const baseUrl: string = 'https://nominatim.openstreetmap.org';
  const mode: string = 'driving';

  const timeToWait: number = 10;
  const originResponse = await axios.get(
    `${baseUrl}/search?format=json&q=${origin}`
  );
  const originLatLong = {
    lat: originResponse.data[0].lat,
    lng: originResponse.data[0].lon,
  };

  const moscowCoords = { lat: 55.7558, lng: 37.6173 };
  const boundRadius = 50000;
  const viewboxCoords = {
    minLat: moscowCoords.lat - boundRadius / 111300,
    maxLat: moscowCoords.lat + boundRadius / 111300,
    minLng:
      moscowCoords.lng - boundRadius / (111300 * Math.cos(moscowCoords.lat)),
    maxLng:
      moscowCoords.lng + boundRadius / (111300 * Math.cos(moscowCoords.lat)),
  };

  const destinationResponse = await axios.get(
    `${baseUrl}/search?format=json&street=${address.toLowerCase()}&countrycodes=RUS&viewbox=${
      viewboxCoords.minLng
    },${viewboxCoords.minLat},${viewboxCoords.maxLng},${
      viewboxCoords.maxLat
    }&bounded=1`
  );
  if (!destinationResponse.data.length) {
    throw new Error('Неверный адрес доставки');
  }
  const destinationLatLng = {
    lat: destinationResponse.data[0].lat,
    lng: destinationResponse.data[0].lon,
  };
  const routeResponse = await axios.get(
    `https://router.project-osrm.org/route/v1/${mode}/${originLatLong.lng},${originLatLong.lat};${destinationLatLng.lng},${destinationLatLng.lat}?overview=false`
  );
  const routeDurationSeconds = routeResponse.data.routes[0].duration;
  const fixedTimeMinutes = 15;
  const deliveryTimePerPizzaMinutes = 15;
  const returnTimeMinutes = 15;
  const waitingTimeBetweenOrdersMinutes = timeToWait;
  const totalTimeSeconds =
    fixedTimeMinutes +
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
};

interface ToppingInterface {
  type: string;
}


export interface PizzaInterface {
  type: string;
  orderDate: string;
  orderTime: string;
  toppings: ToppingInterface[];
}




