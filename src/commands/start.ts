import bot from "../index";
const i18next = require("../utils/i18n.ts");
import { PrismaClient } from "@prisma/client";
import { isAdmin } from "../utils/adminUtils";

const prisma = new PrismaClient();

bot.onText(/\/lang (.+)/, async (msg: any, match: any) => {
  const chatId = msg.chat.id;
  const resp = match[1];

  if (msg.chat.type === "private") {
    const user = await prisma.user.findFirst({
      where: {
        user_id: msg.chat.id,
      },
    });

    if (!user) {
      return;
    }

    const updateUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        chat_lang: resp,
      },
    });

    if (updateUser) {
      bot.sendMessage(
        chatId,
        i18next.t("language_changed", { lng: resp, replace: { lang: resp } }),
        { reply_to_message_id: msg.message_id }
      );
    }
  } else {
    const group = await prisma.group.findFirst({
      where: {
        chat_id: msg.chat.id,
      },
    });

    if (!group) {
      return;
    }

    if (!(await isAdmin(msg.from.id, msg.chat.id))) {
      bot.sendMessage(
        chatId,
        i18next.t("not_admin", { lng: group.chat_lang }),
        {
          reply_to_message_id: msg.message_id,
        }
      );
      return;
    }

    const updateGroup = await prisma.group.update({
      where: {
        id: group.id,
      },
      data: {
        chat_lang: resp,
      },
    });

    if (updateGroup) {
      bot.sendMessage(
        chatId,
        i18next.t("language_changed", { lng: resp, replace: { lang: resp } }),
        { reply_to_message_id: msg.message_id }
      );
    }
  }
});

bot.onText(/\/start/, async (msg: any) => {
  if (msg.chat.type === "private") {
    const user = await prisma.user.findFirst({
      where: {
        user_id: msg.chat.id,
      },
    });

    if (!user) {
      const newUser = await prisma.user.create({
        data: {
          user_id: msg.chat.id,
        },
      });
      console.log(newUser);
    }

    bot.sendMessage(
      msg.chat.id,
      i18next.t("welcome_message", { lng: user?.chat_lang })
    );
    return;
  }

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
  }

  const chatId = msg.chat.id;
  const opts = {
    reply_to_message_id: msg.message_id,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: i18next.t("about", { lng: group?.chat_lang }),
            callback_data: "about",
          },
        ],
        [
          {
            text: i18next.t("commands", { lng: group?.chat_lang }),
            callback_data: "commands",
          },
        ],
      ],
    },
  };
  bot.sendMessage(
    chatId,
    i18next.t("welcome_message", { lng: group?.chat_lang }),
    opts
  );
});

bot.on("callback_query", async (cb: any) => {
  if (cb.data === "about") {
    bot.editMessageText("Este bot foi desenvolvido por: \n\n <b>Brener</b> ", {
      parse_mode: "HTML",
      chat_id: cb.message.chat.id,
      message_id: cb.message.message_id,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Voltar",
              callback_data: "menu",
            },
          ],
        ],
      },
    });
  }

  if (cb.data === "comandos") {
    bot.editMessageText(
      "Comandos disponíveis: \n\n /start - Inicia o bot \n /label - Adiciona uma URL \n /list - Lista as URLs adicionadas",
      {
        parse_mode: "HTML",
        chat_id: cb.message.chat.id,
        message_id: cb.message.message_id,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Voltar",
                callback_data: "menu",
              },
            ],
          ],
        },
      }
    );
  }

  if (cb.data === "menu") {
    bot.editMessageText("Menu", {
      parse_mode: "HTML",
      chat_id: cb.message.chat.id,
      message_id: cb.message.message_id,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Sobre",
              callback_data: "sobre",
            },
            {
              text: "Comandos",
              callback_data: "comandos",
            },
          ],
        ],
      },
    });
  }
});
