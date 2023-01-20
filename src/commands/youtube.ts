import bot from "../index";

const ytdl = require("ytdl-core");
const fs = require("fs");

const chatId = 12345678;

bot.onText(/\/youtube/, (msg: any) => {
  //get chat id
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Aguarde, estou baixando o vídeo.");
  const videoUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

  ytdl.getInfo(videoUrl, (err: any, info: any) => {
    console.log(info);
    if (err) throw err;
    const videoTitle = `${info.title}.mp3`;
    ytdl(videoUrl, { filter: "audioonly" })
      .pipe(fs.createWriteStream(videoTitle))
      .on("finish", () => {
        bot.telegram.sendAudio(chatId, videoTitle).then(() => {
          fs.unlink(videoTitle, (err: any) => {
            if (err) throw err;
            console.log(`Arquivo ${videoTitle} excluído com sucesso.`);
          });
        });
      });
  });
});
