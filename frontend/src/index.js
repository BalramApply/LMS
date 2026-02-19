import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';
import App from './App';
import store from './redux/store';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0d0d1a',
              color: '#00f0ff',
              borderRadius: '2px',
              border: '1px solid #00f0ff',
              boxShadow: '0 0 12px #00f0ff55, 0 0 30px #00f0ff22, inset 0 0 12px #00f0ff0d',
              fontFamily: "'Courier New', monospace",
              fontSize: '13px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              padding: '12px 16px',
            },
            success: {
              style: {
                background: '#0d0d1a',
                color: '#00ff9f',
                border: '1px solid #00ff9f',
                boxShadow: '0 0 12px #00ff9f55, 0 0 30px #00ff9f22, inset 0 0 12px #00ff9f0d',
              },
              iconTheme: {
                primary: '#00ff9f',
                secondary: '#0d0d1a',
              },
            },
            error: {
              style: {
                background: '#0d0d1a',
                color: '#ff2a6d',
                border: '1px solid #ff2a6d',
                boxShadow: '0 0 12px #ff2a6d55, 0 0 30px #ff2a6d22, inset 0 0 12px #ff2a6d0d',
              },
              iconTheme: {
                primary: '#ff2a6d',
                secondary: '#0d0d1a',
              },
            },
          }}
        />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);