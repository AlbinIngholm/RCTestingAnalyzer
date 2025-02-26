import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';

const CallbackPage: React.FC = () => {
  const { isLoading, error, handleRedirectCallback } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    const processCallback = async () => {
      try {
        console.log('Callback - Processing redirect...');
        await handleRedirectCallback(); // Validates state and code
        console.log('Callback successful, navigating to root...');
        navigate('/');
      } catch (err) {
        console.error('Callback error:', err);
      }
    };

    if (!isLoading) {
      processCallback();
    }
  }, [isLoading, handleRedirectCallback, navigate]);

  if (isLoading) return <div className="min-h-screen bg-dark-navy flex items-center justify-center text-gray-blue">Loading...</div>;
  if (error) return <div className="min-h-screen bg-dark-navy flex items-center justify-center text-red-400">Error: {error.message}</div>;
  return <div className="min-h-screen bg-dark-navy flex items-center justify-center text-gray-blue">Redirecting...</div>;
};

export default CallbackPage;