import bot from "../index";
const i18next = require("../utils/i18n.ts");
import { PrismaClient } from "@prisma/client";
import { isAdmin } from "../utils/adminUtils";

const prisma = new PrismaClient();

bot.onText(/\/addnote(?: #(.+))?/, async (msg: any, match: any) => {
  const noteTitle = match.input.split(" ")[1];

  if(msg.chat.type === "private") {
    return;
  }

  const group = await prisma.group.findFirst({
    where: {
      chat_id: msg.chat.id,
    },
  });

  if ((await isAdmin(msg.from.id, msg.chat.id)) !== true) {
    bot.sendMessage(
      msg.chat.id,
      i18next.t("no_permissions", { lng: group?.chat_lang }),
      {
        reply_to_message_id: msg.message_id,
      }
    );
    return;
  }

  if(noteTitle === undefined) {
    bot.sendMessage(msg.chat.id, i18next.t("note_empty", { lng: group?.chat_lang }), {
      reply_to_message_id: msg.message_id,
    });
    return;
  }

  if (noteTitle[0] !== "#") {
    bot.sendMessage(msg.chat.id, i18next.t("note_title_error", { lng: group?.chat_lang }), {
      reply_to_message_id: msg.message_id,
    });
    return;
  }

  if (!msg.reply_to_message) {
    bot.sendMessage(
      msg.chat.id,
      i18next.t("note_reply_error", { lng: group?.chat_lang }),
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
        i18next.t("note_type_error", { lng: group?.chat_lang }),
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
        bot.sendMessage(msg.chat.id, i18next.t("note_saved", { lng: group?.chat_lang }), {
          reply_to_message_id: msg.message_id,
        });
      })
      .catch((err: any) => {
        console.log(err);
      });
  } else {
    bot.sendMessage(msg.chat.id, i18next.t("note_already_exists", { lng: group?.chat_lang }), {
      reply_to_message_id: msg.message_id,
    });
  }
});

bot.onText(/\/rmnote(?: #(.+))?/, async (msg: any, match: any) => {
  const noteTitle = match.input.split(" ")[1];

  if(msg.chat.type === "private") {
    return;
  }

  const group = await prisma.group.findFirst({
    where: {
      chat_id: msg.chat.id,
    },
  });

  if (!(await isAdmin(msg.from.id, msg.chat.id))) {
    bot.sendMessage(
      msg.chat.id,
      i18next.t("no_permissions", { lng: group?.chat_lang }),
      {
        reply_to_message_id: msg.message_id,
      }
    );
    return;
  }

  try {
    const note = await prisma.note.findFirst({
      where: {
        chat_id: msg.chat.id,
        note_name: noteTitle,
      },
    });
    if (!note) {
      bot.sendMessage(msg.chat.id, i18next.t("note_not_found", { lng: group?.chat_lang }), {
        reply_to_message_id: msg.message_id,
      });
      return;
    }
    await prisma.note.delete({
      where: {
        id: note.id,
      },
    });
    bot.sendMessage(msg.chat.id, i18next.t("note_deleted", { lng: group?.chat_lang }), {
      reply_to_message_id: msg.message_id,
    });
  } catch (err) {
    console.error(err);
  }
});

bot.onText(/\/notes/, async (msg: any, match: any) => {
  if(msg.chat.type === "private") {
    return;
  }

  const group = await prisma.group.findFirst({
    where: {
      chat_id: msg.chat.id,
    },
  });

  const Note = await prisma.note.findMany({
    where: {
      chat_id: msg.chat.id,
    },
  });

  if (!Note) {
    return;
  } else {
    if (Note.length > 0) {
      const noteTitles: string[] = Note.map((note: any) => note.note_name);
      bot.sendMessage(
        msg.chat.id,
        `Notas cadastradas nesse chat: ${Note.length}\n\n${noteTitles.join(
          "\n"
        )}
        `,
        {
          reply_to_message_id: msg.message_id,
        }
      );
    } else {
      bot.sendMessage(msg.chat.id, i18next.t("notes_not_found", { lng: group?.chat_lang }), {
        reply_to_message_id: msg.message_id,
      });
    }
  }
});

bot.onText(/\/getnote(?: #(.+))?/, async (msg: any, match: any) => {
  if(msg.chat.type === "private") {
    return;
  }

  const group = await prisma.group.findFirst({
    where: {
      chat_id: msg.chat.id,
    },
  });

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
    bot.sendMessage(msg.chat.id, i18next.t("note_not_found", { lng: group?.chat_lang }), {
      reply_to_message_id: msg.message_id,
    });
  }
});
