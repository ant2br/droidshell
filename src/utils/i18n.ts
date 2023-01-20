const i18next = require('i18next');
const resources = {
  en: require('../locales/en.json'),
  ptBr: require('../locales/ptBr.json')
};

i18next.init({
  lng: 'en',
  resources: resources
});

module.exports = i18next;