import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const CallbackPage: React.FC = () => {
  const { isLoading, error } = useAuth0();

  useEffect(() => {
    if (!isLoading && !error) {
      window.location.href = '/'; // Redirects to root after callback
    }
  }, [isLoading, error]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  return <div>Redirecting...</div>;
};

export default CallbackPage;