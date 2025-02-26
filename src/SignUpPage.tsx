import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';

interface SignUpPageProps {
  onSignUp: () => void;
  onSwitchToLogin: () => void;
}

const SignUpPage: React.FC<SignUpPageProps> = ({ onSignUp, onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setEmail('');
      setPassword('');
      onSignUp();
    } catch (error: any) {
      console.error('Sign-up error:', error);
      setError(error.message || 'Sign-up failed. Check your email/password (min 6 characters).');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-navy to-deep-blue flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-dark-blue rounded-lg p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-white text-center mb-6">Sign Up</h1>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-blue text-sm mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full p-3 rounded bg-deep-blue text-white border border-light-pink/20 focus:ring-2 focus:ring-light-pink outline-none"
            />
          </div>
          <div>
            <label className="block text-gray-blue text-sm mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full p-3 rounded bg-deep-blue text-white border border-light-pink/20 focus:ring-2 focus:ring-light-pink outline-none"
            />
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            onClick={handleSignUp}
            className="w-full bg-light-pink hover:bg-bright-pink text-dark-blue font-semibold py-3 rounded transition-colors"
          >
            Sign Up
          </button>
          <button
            onClick={onSwitchToLogin}
            className="w-full text-light-pink hover:text-bright-pink text-sm"
          >
            Already have an account? Log In
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;