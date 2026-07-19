import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { borderRadius: '12px', background: '#333', color: '#fff' },
          success: { style: { background: '#065f46', color: '#fff' } },
          error: { style: { background: '#7f1d1d', color: '#fff' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
