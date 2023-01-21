import bot from "../index";
const i18next = require("../utils/i18n.ts");
import { PrismaClient } from "@prisma/client";
import { isAdmin } from "../utils/adminUtils";

const prisma = new PrismaClient();

bot.onText(/\/rules/, async (msg: any) => {
  if (msg.chat.type === "private") {
    return;
  }
  const rules = await prisma.group.findFirst({
    where: {
      chat_id: msg.chat.id,
    },
  });

  if (rules === null) {
    bot.sendMessage(msg.chat.id, i18next.t("no_rules"), {
      parse_mode: "HTML",
      reply_to_message_id: msg.message_id,
    });
    return;
  }

  console.log(rules);
  if (rules.rules) {
    bot.sendMessage(msg.chat.id, rules.rules, {
      parse_mode: "HTML",
      reply_to_message_id: msg.message_id,
    });
  } else {
    bot.sendMessage(msg.chat.id, i18next.t("no_rules"), {
      parse_mode: "HTML",
      reply_to_message_id: msg.message_id,
    });
  }
});

bot.onText(/\/addrules (.+)/, async (msg: any, match:any) => {
  const rulesText: string = match[1];
  if (msg.chat.type === "private") {
    return;
  }
  const rules = await prisma.group.findFirst({
    where: {
      chat_id: msg.chat.id,
    },
  });

  if(rules === null) {
    return;
  }

  await prisma.group.update({
    where: {
      id: rules.id,
    },
    data: {
      rules: msg.text.substring(10),
    },
  }).then((data) => {
    bot.sendMessage(msg.chat.id, i18next.t("rules_updated"), {
      parse_mode: "HTML",
      reply_to_message_id: msg.message_id,
    });
  }).catch((err) => {
    console.log(err);
  });
});

bot.onText(/\/rmrules/, async (msg: any, match:any) => {
  if (msg.chat.type === "private") {
    return;
  }
  const rules = await prisma.group.findFirst({
    where: {
      chat_id: msg.chat.id,
    },
  });

  if(rules === null) {
    return;
  }

  await prisma.group.update({
    where: {
      id: rules.id,
    },
    data: {
      rules: null,
    },
  }).then((data) => {
    bot.sendMessage(msg.chat.id, i18next.t("rules_removed"), {
      parse_mode: "HTML",
      reply_to_message_id: msg.message_id,
    });
  }).catch((err) => {
    console.log(err);
  });
});
