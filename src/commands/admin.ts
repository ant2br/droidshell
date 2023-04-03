import bot from "../index";
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();



bot.onText(/\/setwarnaction/, async (msg: any) => {
  const chatId = msg.chat.id;

  // Opções de ação para escolha do usuário
  const options = [
    { text: 'Banir usuário', value: 'ban' },
    { text: 'Expulsar usuário', value: 'kick' },
    { text: 'Remover mensagens', value: 'delete' },
  ];

  // Cria os botões para seleção da ação
  const keyboard = options.map(option => ([
    {
      text: option.text,
      callback_data: `setwarnaction:${option.value}`,
    }
  ]));

  bot.sendMessage(chatId, 'Selecione a ação a ser executada ao atingir o limite de avisos:', {
    reply_markup: {
      inline_keyboard: keyboard,
    },
  });
});


// CallbackQuery para definir a ação de aviso
bot.on('callback_query', async (query: any) => {
  const chatId = query.message?.chat.id;
  const [command, action] = query.data?.split(':');

  if (command !== 'setwarnaction' || !chatId || !action) {
    return;
  }

  try {
    // Busca o grupo no banco de dados usando Prisma
    const group = await prisma.group.findFirst({
      where: {
        chat_id: chatId,
      },
    });

    if (!group) {
      // Se o grupo não existe, cria um novo registro no banco de dados usando Prisma
      await prisma.group.create({
        data: {
          chat_id: chatId,
          warn_action: action,
        },
      });
    } else {
      // Se o grupo já existe, atualiza o registro no banco de dados usando Prisma
      await prisma.group.update({
        where: {
          id: group.id,
        },
        data: {
          warn_action: action,
        },
      });
    }

    bot.answerCallbackQuery(query.id, `Ação de aviso definida como ${action}.`);
  } catch (error) {
    console.error(error);
  }
});


bot.onText(/\/setwarnlimit (\d+)/, async (msg: any, match: any) => {
    const chatId = msg.chat.id;
    const limit = match[1];
  
    try {
      // Busca o grupo no banco de dados usando Prisma
      const group = await prisma.group.findFirst({
        where: {
          chat_id: chatId,
        },
      });
  
      if (!group) {
        // Se o grupo não existe, cria um novo registro no banco de dados usando Prisma
        await prisma.group.create({
          data: {
            chat_id: chatId,
            warns_limit: Number(limit),
          },
        });
      } else {
        // Se o grupo já existe, atualiza o registro no banco de dados usando Prisma
        await prisma.group.update({
          where: {
            id: group.id,
          },
          data: {
            warns_limit: Number(limit),
          },
        });
      }
  
      bot.sendMessage(chatId, `O limite de avisos foi definido como ${limit}.`);
    } catch (error) {
      console.error(error);
    }
  });

bot.onText(/\/warn/, async (msg: any) => {
    const chatId = msg.chat.id;
    const userId = msg.reply_to_message?.from?.id;
  
    if (!userId) {
      return bot.sendMessage(chatId, 'Você precisa responder a uma mensagem para usar este comando.');
    }
  
    try {
      // Busca o número atual de avisos para o usuário no banco de dados usando Prisma
      const userWarn = await prisma.user_warns.findFirst({
        where: {

            user_id: userId,
            chat_id: chatId,

        },
      });

      const group = await prisma.group.findFirst({
        where: {
          chat_id: chatId,
        },
      });


      if(userWarn.count === group.warns_limit) {
        bot.sendMessage(chatId, `Usuário @${msg.reply_to_message.from?.username}.  ${userWarn.count}/${group.warns_limit}`, {
            reply_markup: {
              inline_keyboard: [
                [
                    { text: 'Remover aviso', callback_data: `remove:${userId}` },
                  { text: 'Banir usuário', callback_data: `ban:${userId}` },
                ],
              ],
            },
          });

        return
      }
  
      let warnNumber = 0;
  
      if (userWarn) {
        warnNumber = userWarn.count + 1;
        // O registro já existe, precisamos atualizar o contador de avisos
        await prisma.user_warns.update({
          where: {
              id: userWarn.id,

          },
          data: {
            count: userWarn.count + 1,
          },
        });
      } else {
        warnNumber = 1;
        // O registro ainda não existe, precisamos criá-lo
        await prisma.user_warns.create({
          data: {
            user_id: userId,
            chat_id: chatId,
            count: 1,
          },
        });
      }
  
      if (warnNumber >= group.warns_limit) {
        bot.sendMessage(chatId, `Usuário @${msg.reply_to_message.from?.username} recebeu um aviso.  `, {
          reply_markup: {
            inline_keyboard: [
              [
                { text: `${warnNumber}/${group.warns_limit}`, callback_data: `warnings:${userId}` },
                { text: 'Banir usuário', callback_data: `ban:${userId}` },
              ],
            ],
          },
        });
      } else {
        bot.sendMessage(chatId, `Usuário @${msg.reply_to_message.from?.username} recebeu um aviso.  `, {
          reply_markup: {
            inline_keyboard: [
              [
                { text: `${warnNumber}/${group.warns_limit}`, callback_data: `warnings:${userId}` },
                { text: 'Remover aviso', callback_data: `remove:${userId}` },
              ],
            ],
          },
        });
      }
    } catch (error) {
      console.error(error);
    }
  });
  
  
  bot.on('callback_query', async (query: any) => {
    const chatId = query.message?.chat.id;
    const userId = query.data?.split(':')[1];
  
    if (!chatId || !userId) {
      return;
    }
  
    const userWarn = await prisma.user_warns.findFirst({
      where: {
        user_id: Number(userId),
        chat_id: chatId,
      },
    });
  
    if (!userWarn) {
      return;
    }
  
    if (query.data?.startsWith('warnings:')) {
      bot.answerCallbackQuery(query.id, `Usuário @${query.message.reply_to_message?.from?.username} recebeu ${userWarn.count} aviso(s).`);
    } else if (query.data?.startsWith('ban:')) {
      try {
  
        //await bot.kickChatMember(chatId, userId);
        bot.answerCallbackQuery(query.id, `Usuário @${query.message.reply_to_message?.from?.username} foi banido.`);
      } catch (error) {
        bot.answerCallbackQuery(query.id, `Erro ao banir o usuário.`);
        console.error(error);
      }
    }
  });
  