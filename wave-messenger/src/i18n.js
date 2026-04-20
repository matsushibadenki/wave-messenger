/*
File Path: wave-messenger/src/i18n.js
File Name: i18n.js
Description: i18next を使用した多言語対応（日本語・英語）の設定を行います。
*/

import i18n from '/vendor/i18next-shim.js';
import { initReactI18next } from '/vendor/react-i18next-shim.js';

import enTranslation from '/locales/en/translation.js';
import jaTranslation from '/locales/ja/translation.js';

const resources = {
  en: {
    translation: enTranslation,
  },
  ja: {
    translation: jaTranslation,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "ja",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
