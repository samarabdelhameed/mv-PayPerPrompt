import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Demo Mode - Run without Privy for hackathon demonstration
const DEMO_MODE = true;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// In Demo Mode, skip Privy completely for easy demonstration
if (DEMO_MODE) {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  // Production mode with Privy - requires valid PRIVY_APP_ID
  const { PrivyProvider } = require('@privy-io/react-auth');
  root.render(
    <React.StrictMode>
      <PrivyProvider
        appId={import.meta.env.VITE_PRIVY_APP_ID || "cme9x2lzy00exgs0b3tlu9vbh"}
        config={{
          loginMethods: ['email', 'wallet', 'google', 'github'],
          appearance: {
            theme: 'dark',
            accentColor: '#39FF14',
            showWalletLoginFirst: false,
          },
        }}
      >
        <App />
      </PrivyProvider>
    </React.StrictMode>
  );
}