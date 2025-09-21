import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { I18nextProvider } from 'react-i18next';
import { initI18n } from './i18n';
import { getPreferredLanguageSync } from './utils/languageStorage';

const savedLang = getPreferredLanguageSync() ?? 'en';
const i18n = initI18n({ lng: savedLang });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </React.StrictMode>
);

const preload = document.getElementById('preload');
if (preload) {
  const joke = document.getElementById('joke');
  if (joke) {
    joke.style.opacity = '0';
  }
  preload.style.transition = 'opacity 0.5s ease';
  preload.style.opacity = '0';

  setTimeout(() => {
    preload.remove();
  }, 500);
}
