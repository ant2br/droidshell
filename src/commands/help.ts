import bot from "../index";



// Objeto com informações sobre os comandos disponíveis
const commandList:any = {
    '/traduzir': 'Traduz uma mensagem de um idioma para outro. Para usar, basta digitar "/traduzir [idioma de origem]-[idioma de destino] [mensagem]". Por exemplo, "/traduzir pt-en Olá, mundo!" traduzirá "Olá, mundo!" do português para o inglês.',
    '/conversor': 'Converte uma unidade de medida para outra. Para usar, basta digitar "/conversor [unidade de origem] para [unidade de destino] [valor]". Por exemplo, "/conversor Celsius para Fahrenheit 25" converterá 25 graus Celsius para Fahrenheit.',
    '/calculadora': 'Realiza cálculos matemáticos simples. Para usar, basta digitar "/calculadora [expressão matemática]". Por exemplo, "/calculadora 2 + 2" retornará 4.',
    '/google': 'Pesquisa um termo no Google e retorna os resultados. Para usar, basta digitar "/google [termo de pesquisa]". Por exemplo, "/google OpenAI" retornará os resultados da pesquisa "OpenAI" no Google.',
  }
  
  // Comando para exibir a lista de comandos disponíveis
  bot.onText(/\/comandos/, (msg:any) => {
    let commandText = 'Comandos disponíveis:\n\n';
    for (let command in commandList) {
      commandText += `${command}: ${commandList[command]}\n\n`;
    }
    bot.sendMessage(msg.chat.id, commandText);
  });
  
  // Comando para exibir ajuda específica para um comando
  bot.onText(/\/ajuda (.+)/, (msg:any, match:any) => {
    let command = match[1];
    if (commandList.hasOwnProperty(command)) {
      bot.sendMessage(msg.chat.id, commandList[command]);
    } else {
      bot.sendMessage(msg.chat.id, `O comando "${command}" não existe. Use o comando /comandos para ver a lista de comandos disponíveis.`);
    }
  });
  