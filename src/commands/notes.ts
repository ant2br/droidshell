import bot from "../index";
const i18next = require("../utils/i18n.ts");
import { PrismaClient } from "@prisma/client";
import { isAdmin } from "../utils/adminUtils";

const prisma = new PrismaClient();

bot.onText(/\/addnote(?: #(.+))?/, async (msg: any, match: any) => {
  const noteTitle = match.input.split(" ")[1];

  if ((await isAdmin(msg.from.id, msg.chat.id)) !== true) {
    bot.sendMessage(
      msg.chat.id,
      "Você não tem permissão para usar este comando",
      {
        reply_to_message_id: msg.message_id,
      }
    );
    return;
  }

  if (noteTitle[0] !== "#") {
    bot.sendMessage(msg.chat.id, "O título da nota deve começar com #", {
      reply_to_message_id: msg.message_id,
    });
    return;
  }

  if (!msg.reply_to_message) {
    bot.sendMessage(
      msg.chat.id,
      "Você precisa responder a uma mensagem para criar uma nota",
      {
        reply_to_message_id: msg.message_id,
      }
    );
    return;
  }

  const note = await prisma.note.findFirst({
    where: {
      chat_id: msg.chat.id,
      note_name: noteTitle,
    },
  });

  console.log(note);

  if (!note) {
    let type: string | undefined;
    let file: any;

    if (msg.reply_to_message.text) {
      type = "text";
      file = msg.reply_to_message.text;
    } else if (msg.reply_to_message.sticker) {
      type = "sticker";
      file = msg.reply_to_message.sticker.file_id;
    } else if (msg.reply_to_message.photo) {
      type = "photo";
      file = msg.reply_to_message.photo[0].file_id;
    } else if (msg.reply_to_message.video) {
      type = "video";
      file = msg.reply_to_message.video.file_id;
    } else if (msg.reply_to_message.audio) {
      type = "audio";
      file = msg.reply_to_message.audio.file_id;
    } else if (msg.reply_to_message.document) {
      type = "document";
      file = msg.reply_to_message.document.file_id;
    }

    if (!type) {
      bot.sendMessage(
        msg.chat.id,
        "Este tipo de mensagem não pode ser adicionado como nota",
        {
          reply_to_message_id: msg.message_id,
        }
      );
      return;
    }

    await prisma.note
      .create({
        data: {
          chat_id: msg.chat.id,
          note_name: noteTitle,
          note_type: type,
          raw_data: file,
          file_id: "0",
        },
      })
      .then((note: any) => {
        bot.sendMessage(msg.chat.id, "Nota criada com sucesso", {
          reply_to_message_id: msg.message_id,
        });
      })
      .catch((err: any) => {
        console.log(err);
      });
  } else {
    bot.sendMessage(msg.chat.id, "Já existe uma nota com este título", {
      reply_to_message_id: msg.message_id,
    });
  }
});

bot.onText(/\/rmnote(?: #(.+))?/, async (msg: any, match: any) => {
  const noteTitle = match.input.split(" ")[1];

  if (!(await isAdmin(msg.from.id, msg.chat.id))) {
    bot.sendMessage(
      msg.chat.id,
      "Você não tem permissão para usar este comando",
      {
        reply_to_message_id: msg.message_id,
      }
    );
    return;
  }

  try {
    console.log(noteTitle);
    const note = await prisma.note.findFirst({
      where: {
        chat_id: msg.chat.id,
        note_name: noteTitle,
      },
    });
    if (!note) {
      bot.sendMessage(msg.chat.id, "Não há uma nota com este título", {
        reply_to_message_id: msg.message_id,
      });
      return;
    }
    await prisma.note.delete({
      where: {
        id: note.id,
      },
    });
    bot.sendMessage(msg.chat.id, "Nota deletada com sucesso", {
      reply_to_message_id: msg.message_id,
    });
  } catch (err) {
    console.error(err);
  }
});

bot.onText(/\/notes/, async (msg: any, match: any) => {
  const Note = await prisma.note.findMany({
    where: {
      chat_id: msg.chat.id,
    },
  });

  if (!Note) {
    return;
  } else {
    if (Note.length > 0) {
      const noteTitles: string[] = Note.map((note: any) => note.note_title);
      bot.sendMessage(
        msg.chat.id,
        `Notas cadastradas nesse chat: ${Note.length}\n\n${noteTitles.join(
          "\n"
        )}`,
        {
          reply_to_message_id: msg.message_id,
        }
      );
    } else {
      bot.sendMessage(msg.chat.id, "Não há notas cadastradas nesse chat", {
        reply_to_message_id: msg.message_id,
      });
    }
  }
});

bot.onText(/\/getnote(?: #(.+))?/, async (msg: any, match: any) => {
  const noteTitle = match.input.split(" ")[1];

  const note = await prisma.note.findFirst({
    where: {
      chat_id: msg.chat.id,
      note_name: noteTitle,
    },
  });

  if (note) {
    switch (note.note_type) {
      case "text":
        bot.sendMessage(msg.chat.id, note.raw_data, {
          reply_to_message_id: msg.message_id,
        });
        break;
      case "sticker":
        bot.sendSticker(msg.chat.id, note.raw_data, {
          reply_to_message_id: msg.message_id,
        });
        break;
      case "photo":
        bot.sendPhoto(msg.chat.id, note.raw_data, {
          reply_to_message_id: msg.message_id,
        });
        break;
      case "video":
        bot.sendVideo(msg.chat.id, note.raw_data, {
          reply_to_message_id: msg.message_id,
        });
        break;
      case "audio":
        bot.sendAudio(msg.chat.id, note.raw_data, {
          reply_to_message_id: msg.message_id,
        });
        break;
      case "document":
        bot.sendDocument(msg.chat.id, note.raw_data, {
          reply_to_message_id: msg.message_id,
        });
        break;
    }
  } else {
    bot.sendMessage(msg.chat.id, "Nota não encontrada", {
      reply_to_message_id: msg.message_id,
    });
  }
});
