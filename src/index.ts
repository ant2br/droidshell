import TelegramBot from "node-telegram-bot-api";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

let bot: any;

const startBot = async () => {
  if (process.env.TELEGRAM_TOKEN == undefined) {
    console.log("TELEGRAM_TOKEN não encontrado no .env");
    return;
  }

  if (process.env.DATABASE_URL == undefined) {
    console.log("DATABASE_URL não encontrado no .env");
    return;
  }

  if (process.env.LOG_CHANNEL == undefined) {
    console.log("LOG_CHANNEL não encontrado no .env");
    return;
  }

  bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
  bot.on("polling_error", (error:any) => {
    console.log(error);
  });
};

async function load() {
  console.log("Iniciando bot\n");
  await startBot();

  let counter = 0;
  let errores = 0;

  const commandsPath = path.resolve(__dirname, "commands");

  const walkSync = (dir: string, ext: string) => {
    fs.readdirSync(dir).forEach((file: string) => {
      const filePath = path.join(dir, file);
      const stat = fs.lstatSync(filePath);
      if (stat.isDirectory()) {
        walkSync(filePath, ext);
      } else if (file.endsWith(ext)) {
        try {
          require(filePath);
          counter++;
        } catch (err) {
          errores++;
          console.log(err);
        }
      }
    });
  };

  walkSync(commandsPath, ".ts");

  console.log(
    `Iniciado com sucesso! ${counter} módulos carregados.\n ${errores} módulos com erro.`
  );
}

load();

export default bot;
