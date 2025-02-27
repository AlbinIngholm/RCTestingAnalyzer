import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';

const CallbackPage: React.FC = () => {
  const { isAuthenticated, error, isLoading } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return; // Wait until Auth0 finishes processing
    if (error) {
      console.error('Callback Error:', error);
      return; // Stay on callback page to show error if needed
    }
    if (isAuthenticated) {
      navigate('/'); // Redirect to home after successful login
    }
  }, [isAuthenticated, isLoading, error, navigate]);

  return (
    <div className="min-h-screen bg-dark-navy flex items-center justify-center text-gray-blue">
      {isLoading ? 'Loading...' : error ? `Error: ${error.message}` : 'Redirecting...'}
    </div>
  );
};

export default CallbackPage;