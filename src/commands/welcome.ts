import * as Handlebars from "handlebars";
import TelegramBot from "node-telegram-bot-api";
import bot from "../index";
require("dotenv").config();
import { PrismaClient } from "@prisma/client";

import { getBotInfo } from "../utils/adminUtils";

const templateString = `Bem-vindo, {{nome}}!`;
const template = Handlebars.compile(templateString);
const data = { nome: "John" };
const message = template(data);

const prisma = new PrismaClient();

bot.on("new_chat_members", (msg: TelegramBot.Message) => {
  if (!msg.new_chat_members) {
    return;
  }

  msg.new_chat_members.forEach(async (member: TelegramBot.User) => {
    console.log(member);

    const botInfo = await getBotInfo();

    if (!process.env.LOG_CHANNEL) {
      console.log("LOG_CHANNEL not found in .env");
      return;
    }

    if (member.id === botInfo.id) {
      console.log(`Bot added to group ${msg.chat.title}`);
      bot.sendMessage(
        msg.chat.id,
        `Hello! I'm ${botInfo.first_name}! \n Use /start to see my commands!`
      );

      bot.sendMessage(
        process.env.LOG_CHANNEL,
        `  <b>Bot adicionado a um grupo</b>
            <b>Grupo: </b><i>${msg.chat.title}</i>
            <b>ID: </b><i>${msg.chat.id}</i>
            `,
        { parse_mode: "HTML" }
      );

      const group = await prisma.group.findFirst({
        where: {
          chat_id: msg.chat.id,
        },
      });

      if (!group) {
        const newGroup = await prisma.group.create({
          data: {
            chat_id: msg.chat.id,
          },
        });

        console.log(newGroup);
      }
    }

    if (member.is_bot) {
      return;
    }
  });
});
