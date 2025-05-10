import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { NotificationProvider } from './context/NotificationContext.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NotificationProvider>
      <App />
    </NotificationProvider>
  </React.StrictMode>
);

const preload = document.getElementById('preload');
if (preload) {
  preload.style.transition = 'opacity 0.5s ease';
  preload.style.opacity = '0';

  setTimeout(() => {
    preload.remove();
  }, 500);
}
