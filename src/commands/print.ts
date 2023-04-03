import bot from "../index";
const puppeteer = require('puppeteer');
const axios = require('axios');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


bot.onText(/\/print (.+)/, async (msg:any, match:any) => {
    const chatId = msg.chat.id;
    var url = match[1];

    // Verificar se a URL já contém um protocolo
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url; // Adicionar o protocolo https:// por padrão
    }

    console.log(url)
  
    try {
      // Iniciar o navegador Puppeteer
      const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'], defaultViewport: null, ignoreHTTPSErrors: true});
      const page = await browser.newPage();


        // Definir um tamanho de viewport personalizado
        await page.setViewport({width: 1280, height: 800});
  
      // Navegar até a URL especificada
      await page.goto(url);
  
      // Capturar uma captura de tela da página
      const screenshot = await page.screenshot({fullPage: true});
  
      // Enviar a captura de tela para o chat como um arquivo
      await bot.sendPhoto(chatId, screenshot, {caption: 'Captura de tela de ' + url});
  
      // Fechar o navegador Puppeteer
      await browser.close();
    } catch (error) {
      console.error('Erro ao imprimir a página:', error);
      await bot.sendMessage(chatId, 'Não foi possível imprimir a página. Verifique se o URL está correto e tente novamente.');
    }
  });


  bot.onText(/\/traduzir\s(\w{2,3})-(\w{2,3})(?:\s([\s\S]+))?/, async (msg:any, match:any) => {
    const chatId = msg.chat.id;
    const fromLang = match[1];
    const toLang = match[2];
    let text = match[3];
    
    // Verificar se a mensagem é uma resposta a uma mensagem anterior
    if (msg.reply_to_message && msg.reply_to_message.text) {
      // Usar o texto da mensagem respondida como entrada para o comando de tradução
      text = msg.reply_to_message.text;
    }
    
    // Verificar se as línguas de origem e destino são suportadas
    const LANGS:any = {
      pt: 'Portuguese',
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      ja: 'Japanese',
      ko: 'Korean',
      zh: 'Chinese',
      ru: 'Russian',
      ar: 'Arabic',
      hi: 'Hindi',
      tr: 'Turkish',
    };
    if (!LANGS[fromLang]) {
      return bot.sendMessage(chatId, `Língua de origem ${fromLang} não suportada.`);
    }
    if (!LANGS[toLang]) {
      return bot.sendMessage(chatId, `Língua de destino ${toLang} não suportada.`);
    }
    
    try {
      // Iniciar o navegador Puppeteer
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
    
      // Navegar até o Google Tradutor
      const url = `https://translate.google.com.br/?sl=${fromLang}&tl=${toLang}&text=${text}&op=translate`;
      await page.goto(url);
    
      // Esperar um segundo para que o texto seja traduzido
      await page.waitForTimeout(1000);
    
      // Capturar a tradução resultante
      const result = await page.evaluate(() => {
        return document.getElementsByClassName('ryNqvb')[0].innerText;
      })
    
      // Enviar a tradução para o chat
      await bot.sendMessage(chatId, `Tradução de "${text}" (${LANGS[fromLang]} para ${LANGS[toLang]}):\n${result}`);
    
      // Fechar o navegador Puppeteer
      await browser.close();
    } catch (error) {
      console.error('Erro ao traduzir o texto:', error);
      await bot.sendMessage(chatId, 'Não foi possível traduzir o texto. Verifique se o texto está correto e tente novamente.');
    }
  });



  bot.onText(/\/calculadora\s([\d+\-*\/\s]+)/, async (msg, match) => {
    const input = match[1];
  
    // Verificar se a entrada possui apenas caracteres numéricos e operadores matemáticos
    if (/^[0-9+\-*\/\s]+$/.test(input)) {
      try {
        // Tratar a entrada do usuário para remover espaços extras e avaliar a expressão matemática
        const result = eval(input.replace(/\s+/g, ''));
  
        // Enviar a resposta para o chat
        await bot.sendMessage(msg.chat.id, `Resultado: ${result}`);
      } catch (error) {
        // Enviar uma mensagem de erro caso ocorra um erro durante o cálculo
        await bot.sendMessage(msg.chat.id, 'Ocorreu um erro durante o cálculo. Verifique a sintaxe da expressão matemática e tente novamente.');
      }
    } else {
      // Enviar uma mensagem de erro caso a entrada não seja válida
      await bot.sendMessage(msg.chat.id, 'A entrada não é válida. Apenas caracteres numéricos e operadores matemáticos (+, -, *, /) são permitidos.');
    }
  });
  
  

  
  
  
  
  
   