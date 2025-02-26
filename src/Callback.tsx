import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';

const CallbackPage: React.FC = () => {
  const { isLoading, error, isAuthenticated } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Callback - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'error:', error);
    if (!isLoading) {
      if (error) {
        console.error('Callback error:', error);
      } else if (isAuthenticated) {
        console.log('Callback successful, navigating to root...');
        navigate('/'); // Redirect to root after successful auth
      } else {
        console.log('Callback: Not authenticated, unexpected state');
      }
    }
  }, [isLoading, error, isAuthenticated, navigate]);

  if (isLoading) return <div className="min-h-screen bg-dark-navy flex items-center justify-center text-gray-blue">Loading...</div>;
  if (error) return <div className="min-h-screen bg-dark-navy flex items-center justify-center text-red-400">Error: {error.message}</div>;
  return <div className="min-h-screen bg-dark-navy flex items-center justify-center text-gray-blue">Redirecting...</div>;
};

export default CallbackPage;