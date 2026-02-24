import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import pt from './locales/pt.json';
import uk from './locales/uk.json';
import es from './locales/es.json';
import it from './locales/it.json';
import fr from './locales/fr.json';
import zh from './locales/zh.json';
import hi from './locales/hi.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            pt: { translation: pt },
            uk: { translation: uk },
            es: { translation: es },
            it: { translation: it },
            fr: { translation: fr },
            zh: { translation: zh },
            hi: { translation: hi },
            ja: { translation: ja },
            ko: { translation: ko }
        },
        detection: {
            order: ['localStorage', 'navigator'],
            lookupLocalStorage: 'i18nextLng',
            caches: ['localStorage']
        },
        fallbackLng: 'en',
        debug: true, // Enable debugging to see language detection logs
        interpolation: {
            escapeValue: false // not needed for react as it escapes by default
        },
        react: {
            useSuspense: false
        }
    });

export default i18n;
