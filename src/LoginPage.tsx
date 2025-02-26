import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async () => {
    setError(null);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setEmail('');
      setPassword('');
      onLogin();
    } catch (error: any) {
      console.error(`${isSignUp ? 'Sign-up' : 'Login'} error:`, error);
      setError(error.message || 'Authentication failed. Check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-navy to-deep-blue flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-dark-blue/90 rounded-lg p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-white text-center mb-6">
          {isSignUp ? 'Sign Up for RC Testing Analyzer' : 'Log In to RC Testing Analyzer'}
        </h1>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-blue text-sm mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full p-3 rounded bg-dark-blue text-white border border-light-pink/20 focus:ring-2 focus:ring-light-pink outline-none"
            />
          </div>
          <div>
            <label className="block text-gray-blue text-sm mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full p-3 rounded bg-dark-blue text-white border border-light-pink/20 focus:ring-2 focus:ring-light-pink outline-none"
            />
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            onClick={handleAuth}
            className="w-full bg-light-pink hover:bg-bright-pink text-dark-blue font-semibold py-3 px-4 rounded transition-colors"
          >
            {isSignUp ? 'Sign Up' : 'Log In'}
          </button>
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full text-light-pink hover:text-bright-pink text-sm"
          >
            {isSignUp ? 'Already have an account? Log In' : 'Need an account? Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;