import React from 'react';
import ReactDOM from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App';
import CallbackPage from './Callback';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <Auth0Provider
      domain="testinganalyzer.eu.auth0.com" // Replace with your Auth0 domain
      clientId="vPQ13KCpgyD74SE6BvpbOTqnrOC5pbaa"     // Replace with your Auth0 Client ID
      authorizationParams={{
        redirect_uri: window.location.origin + '/callback',
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/callback" element={<CallbackPage />} />
        </Routes>
      </BrowserRouter>
    </Auth0Provider>
  </React.StrictMode>
);

reportWebVitals();