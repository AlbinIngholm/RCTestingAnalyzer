import React from 'react';
import ReactDOM from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <Auth0Provider
      domain="testinganalyzer.eu.auth0.com" // Replace with your Auth0 domain
      clientId="vPQ13KCpgyD74SE6BvpbOTqnrOC5pbaa"     // Replace with your Auth0 Client ID
      authorizationParams={{
        redirect_uri: window.location.origin + '/callback', // Dynamically handles localhost and Netlify
      }}
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>
);

reportWebVitals();