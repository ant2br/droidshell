import bot from "../index";

const fs = require("fs");
const ytdl = require("ytdl-core");
const path = require("path");

bot.onText(
  /\/youtube (.+)/,
  (msg: Telegram.Message, match: RegExpExecArray) => {
    let totalSize = 0;
    let downloadedSize = 0;
    let interval: NodeJS.Timeout;
    let msg_to_edit: any;
    //get chat id
    const chatId: number = msg.chat.id;
    bot
      .sendMessage(chatId, "Aguarde, estou baixando o vídeo.")
      .then((msg: any) => {
        msg_to_edit = msg.message_id;
      });

    const videoUrl: string = match[1];

    console.log(videoUrl);

    ytdl
      .getInfo(videoUrl)
      .then((info: any) => {
        const videoTitle: string = `${info.videoDetails.title}.mp3`;
        totalSize = info.videoDetails.contentLength;
        let stream = ytdl
          .downloadFromInfo(info, { filter: "audioonly" })
          .on(
            "progress",
            (chunkLength: number, downloaded: number, total: number) => {
              downloadedSize = downloaded;
              totalSize = total;
            }
          )
          .pipe(fs.createWriteStream(videoTitle))
          .on("finish", () => {
            clearInterval(interval);
            console.log("Finished!");
            bot.editMessageText(`Download concluído !`, {
              chat_id: chatId,
              message_id: msg_to_edit,
            });
            const root = process.cwd();
            let fileName = path.join(root, videoTitle);
            console.log(fileName);
            bot.sendAudio(chatId, fileName).then(() => {
              fs.unlink(fileName, (err: any) => {
                if (err) throw err;
                console.log(`File ${fileName} deleted successfully.`);
              });
            });
          });
        interval = setInterval(() => {
          let percent = (downloadedSize / totalSize) * 100;
          if (percent >= 0) {
            bot.editMessageText(
              `${Math.round(percent)}% de download concluído`,
              { chat_id: chatId, message_id: msg_to_edit }
            );
          }
        }, 300);
      })
      .catch((err: any) => {
        bot.sendMessage(chatId, "An error occurred. Please try again later.");
      });
  }
);
