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

function getCurrentDate() {
  var today: any = new Date();
  var dd = today.getDate();
  var mm = today.getMonth() + 1;
  var yyyy = today.getFullYear();
  if (dd < 10) {
    dd = "0" + dd;
  }
  if (mm < 10) {
    mm = "0" + mm;
  }
  today = dd + "/" + mm + "/" + yyyy;
  return today;
}

bot.onText(/\/cotacao/, (msg: any, match: any) => {
  const command = match.input.split(" ")[1];
  const value = match.input.split(" ")[2];

  const currencies = getCurrencies().then((data) => {
    const usdToBrl = parseFloat(data.USDBRL.bid);
    const eurToBrl = parseFloat(data.EURBRL.bid);
    const btcToUsd = parseFloat(data.BTCUSD.bid);

    if (command && value) {
      if (command === "usd-brl") {
        const result = value * usdToBrl;
        bot.sendMessage(
          msg.chat.id,
          ` $ ${value} em reais são R$ ${result
            .toFixed(2)
            .toString()
            .replace(".", ",")}`
        );
        return;
      }
      if (command === "brl-usd") {
        const result = value / usdToBrl;
        bot.sendMessage(
          msg.chat.id,
          `R$ ${value} em dólares são $ ${result
            .toFixed(2)
            .toString()
            .replace(".", ",")}`
        );
        return;
      }

      if (command === "eur-brl") {
        const result = value * eurToBrl;
        bot.sendMessage(
          msg.chat.id,
          ` € ${value} em reais são R$ ${result
            .toFixed(2)
            .toString()
            .replace(".", ",")}`
        );
        return;
      }
      if (command === "brl-eur") {
        const result = value / eurToBrl;
        bot.sendMessage(
          msg.chat.id,
          `R$ ${value} em euros são € ${result
            .toFixed(2)
            .toString()
            .replace(".", ",")}`
        );
        return;
      }

      if (command === "help") {
        bot.sendMessage(
          msg.chat.id,
          "Comandos: \n\n /cotacao usd-brl 1 \n /cotacao brl-usd 1 \n /cotacao eur-brl 1 \n /cotacao brl-eur 1"
        );
        return;
      }
    }

    bot.sendMessage(
      msg.chat.id,
      `Cotação Atualizada: ${getCurrentDate()} \n\n` +
        "💵 Dolar: R$" +
        usdToBrl.toFixed(2).toString().replace(".", ",") +
        "\n💶 Euro: R$" +
        eurToBrl.toFixed(2).toString().replace(".", ",") +
        "\n💰 Bitcoin: " +
        btcToUsd.toLocaleString("en-us", { style: "currency", currency: "USD" })
    );
  });
});
