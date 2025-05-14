import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
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
