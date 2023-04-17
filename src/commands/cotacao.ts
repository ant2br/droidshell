import bot from "../index";
const axios = require("axios");

const instance = axios.create({
  baseURL: "https://economia.awesomeapi.com.br/last/",
  timeout: 1000,
});

async function getCurrencies() {
  try {
    const response = await instance.get("USD-BRL,EUR-BRL,BTC-USD");
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

function getCurrentDate(): string {
  const today: Date = new Date();
  let dd: number | string = today.getDate();
  let mm: number | string = today.getMonth() + 1;
  const yyyy: number = today.getFullYear();
  let hh: number | string = today.getHours();
  let min: number | string = today.getMinutes();
  let ss: number | string = today.getSeconds();

  if (dd < 10) {
    dd = "0" + dd;
  }

  if (mm < 10) {
    mm = "0" + mm;
  }

  if (hh < 10) {
    hh = "0" + hh;
  }

  if (min < 10) {
    min = "0" + min;
  }

  if (ss < 10) {
    ss = "0" + ss;
  }

  const todayFormatted: string = `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
  return todayFormatted;
}

bot.onText(/\/cotacao/, async (msg: any, match: any) => {
  const input = match.input.split(" ");
  const command = input[1];
  const value = parseFloat(input[2]);

  try {
    const data = await getCurrencies();
    const usdToBrl = parseFloat(data.USDBRL.bid);
    const eurToBrl = parseFloat(data.EURBRL.bid);
    const btcToUsd = parseFloat(data.BTCUSD.bid);

    if (command && value) {
      switch (command) {
        case "usd-brl":
          const resultUsdBrl = value * usdToBrl;
          bot.sendMessage(
            msg.chat.id,
            ` $ ${value} em reais são R$ ${resultUsdBrl
              .toFixed(2)
              .toString()
              .replace(".", ",")}`
          );
          break;

        case "brl-usd":
          const resultBrlUsd = value / usdToBrl;
          bot.sendMessage(
            msg.chat.id,
            `R$ ${value} em dólares são $ ${resultBrlUsd
              .toFixed(2)
              .toString()
              .replace(".", ",")}`
          );
          break;

        case "eur-brl":
          const resultEurBrl = value * eurToBrl;
          bot.sendMessage(
            msg.chat.id,
            ` € ${value} em reais são R$ ${resultEurBrl
              .toFixed(2)
              .toString()
              .replace(".", ",")}`
          );
          break;

        case "brl-eur":
          const resultBrlEur = value / eurToBrl;
          bot.sendMessage(
            msg.chat.id,
            `R$ ${value} em euros são € ${resultBrlEur
              .toFixed(2)
              .toString()
              .replace(".", ",")}`
          );
          break;

        case "ajuda":
          bot.sendMessage(
            msg.chat.id,
            "Comandos: \n\n /cotacao usd-brl 1 \n /cotacao brl-usd 1 \n /cotacao eur-brl 1 \n /cotacao brl-eur 1"
          );
          break;

        default:
          bot.sendMessage(
            msg.chat.id,
            "Comando inválido! Digite /cotacao ajuda para ver os comandos disponíveis."
          );
          break;
      }
    } else {
      bot.sendMessage(
        msg.chat.id,
        `Cotação Atualizada: ${getCurrentDate()} \n\n` +
          "💵 Dólar: R$" +
          usdToBrl.toFixed(2).toString().replace(".", ",") +
          "\n💶 Euro: R$" +
          eurToBrl.toFixed(2).toString().replace(".", ",") +
          "\n💰 Bitcoin: " +
          btcToUsd.toLocaleString("en-us", { style: "currency", currency: "USD" })
      );
    }
  } catch (error) {
    bot.sendMessage(
      msg.chat.id,
      "Desculpe, ocorreu um erro ao buscar a cotação atualizada. Por favor, tente novamente mais tarde."
    );
  }
});

