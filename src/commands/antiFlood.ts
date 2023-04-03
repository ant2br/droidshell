import bot from "../index";
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


const userMessages = new Map();

// Tempo em segundos do intervalo para enviar mensagens
const MESSAGE_INTERVAL = 3;

// Limite de mensagens que um usuário pode enviar em MESSAGE_INTERVAL segundos
const MESSAGE_LIMIT = 3;



bot.on('message', async (msg:any) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const messageText = msg.text;


    if(msg.chat.type == 'private') return;

    const group = await prisma.group.findFirst({
        where: {
          chat_id: chatId,
        },
      });

    if(!group) return;



    if (messageText.match(/^\/antiflood (0|1)$/)) {
        // Obtém o valor a ser definido para antiflood_enabled
        const value = messageText.split(' ')[1] === '1';
    
        // Atualiza a configuração do antiflood_enabled no banco de dados
        await prisma.group.update({
            where: {
                id: group.id,
            },
            data: {
                antiflood_enabled: value,
            },
        });

        // Envia uma mensagem para confirmar se o antiflood foi ativado ou desativado
        const responseMessage = value ? 'Antiflood ativado.' : 'Antiflood desativado.';
        bot.sendMessage(chatId, responseMessage);
      }



    if (group.antiflood_enabled == 1) {


    
  
    // Verifica se o usuário já enviou uma mensagem antes
        if (userMessages.has(userId)) {
        const messages = userMessages.get(userId);
        const now = Date.now();
    
        // Filtra as mensagens que estão dentro do intervalo permitido
        const validMessages = messages.filter((time: any) => (now - time) < (MESSAGE_INTERVAL * 1000));
    
        // Se o usuário excedeu o limite permitido, envia uma mensagem de aviso
        if (validMessages.length >= MESSAGE_LIMIT) {
            bot.sendMessage(chatId, 'Você está enviando mensagens muito rapidamente, aguarde um momento para enviar mais mensagens.');
            return;
        }
        }
    
        // Adiciona a nova mensagem ao mapa de mensagens do usuário
        if (userMessages.has(userId)) {
        userMessages.get(userId).push(Date.now());
        } else {
        userMessages.set(userId, [Date.now()]);
        }

    }
  
    // Executa o restante do seu código normalmente
    // ...
  });