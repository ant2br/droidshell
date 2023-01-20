import bot from "../index";
const i18next = require("../utils/i18n.ts");
import { PrismaClient } from "@prisma/client";
import { isSudo } from "../utils/adminUtils";
const archiver = require("archiver");
const fs = require("fs");
var shell_exec = require("shell_exec").shell_exec;
var escape = require("escape-html");

bot.onText(/\/stats/, async (msg: any) => {
  const chatId = msg.chat.id;

  if (!(await isSudo(msg.from.id))) {
    console.log("Not sudo");
    return;
  }

  const prisma = new PrismaClient();

  const users = await prisma.user.findMany();
  const groups = await prisma.group.findMany();

  bot.sendMessage(
    chatId,
    `<b>Bot statistics:</b>
<b>Users:</b> ${users.length}
<b>Groups:</b> ${groups.length}
    `,
    { parse_mode: "HTML", reply_to_message_id: msg.message_id }
  );
});

function formatDate(): string {
  const d: Date = new Date();
  let month: string = "" + (d.getMonth() + 1);
  let day: string = "" + d.getDate();
  const year: number = d.getFullYear();
  let hour: any = d.getHours();
  let minute: any = d.getMinutes();
  let second: any = d.getSeconds();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;
  if (hour < 2) hour = "0" + hour;
  if (minute < 2) minute = "0" + minute;
  if (second < 2) second = "0" + second;

  return [year, month, day].join("-") + "T" + [hour, minute, second].join(":");
}

bot.onText(/\/backup/, async (msg: any) => {
  const data = await formatDate();
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  console.log("Backup command");
  if (!(await isSudo(msg.from.id))) {
    console.log("Not sudo");
    return;
  }
  let msg_to_edit: any;
  bot
    .sendMessage(chatId, `<b>Backup in progress...</b>`, {
      parse_mode: "HTML",
      reply_to_message_id: msg.message_id,
    })
    .then((msg: any) => {
      msg_to_edit = msg.message_id;
    });

  console.log("Sudo");

  const root = process.cwd();
  const backupPath = `${root}/backup`;
  const backupFile = `${backupPath}/Droidshell-${data}.zip`;

  // Cria pasta de backup caso não exista
  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath);
  }

  // Cria a lista de arquivos para ignorar
  // const ig = ignore().add(['node_modules/**']);

  // Cria o arquivo zip
  const output = fs.createWriteStream(backupFile);
  const archive = archiver("zip", {
    zlib: { level: 9 }, // nível de compressão
  });

  // Adiciona arquivos ao arquivo zip
  archive.pipe(output);
  archive.glob("**/*", {
    cwd: root,
    ignore: "node_modules/**",
  });

  // Finaliza a criação do arquivo zip
  output.on("close", () => {
    console.log(
      `Arquivo zip criado com sucesso: ${backupFile} (${archive.pointer()} bytes)`
    );

    bot.sendDocument(userId, backupFile).then(() => {
      // Apaga o arquivo zip do disco depois de enviar
      fs.unlink(backupFile, (err: any) => {
        if (err) throw err;
        console.log(`Arquivo ${backupFile} excluído com sucesso.`);
      });
    });

    bot.editMessageText(`<b>Backup completed!</b>`, {
      parse_mode: "HTML",
      reply_to_message_id: msg.message_id,
      chat_id: chatId,
      message_id: msg_to_edit,
    });
  });

  archive.finalize();
});

bot.onText(/\/cmd/, async (msg: any, match: RegExpExecArray) => {
  const chatId = msg.chat.id;
  const param = match[0].split(" ")[1];

  if (await isSudo(msg.from.id)) {
    const re = /poweroff|halt|shutdown|reboot/g;
    const match = param.match(re);

    if (match) {
      bot.sendMessage(
        chatId,
        "You don't have permission to execute this command."
      );
      return;
    }

    try {
      const result = shell_exec(param);
      const retorno = escape(result);

      bot.sendMessage(chatId, `<b>Output:</b>\n<code>${retorno}</code>`, {
        reply_to_message_id: msg.message_id,
        parse_mode: "HTML",
      });
    } catch (e) {
      bot.sendMessage(chatId, `<b>Errors:</b>\n<code>${e}</code>`, {
        reply_to_message_id: msg.message_id,
        parse_mode: "HTML",
      });
    }
  } else {
    bot.sendMessage(
      chatId,
      "You don't have permission to execute this command."
    );
  }
});
