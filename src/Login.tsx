import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import './Login.css'; // Optional: Add if you create a separate CSS file

const auth = getAuth();

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        console.log('User signed up successfully');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        console.log('User logged in successfully');
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message);
      console.error('Authentication error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-navy to-deep-blue flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-lg p-6 w-full max-w-md border border-gray-200/20">
        <h2 className="text-2xl font-bold text-white text-center mb-6">
          {isSignUp ? 'Sign Up' : 'Log In'} to RC Testing Analyzer
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-gray-blue mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded bg-dark-blue text-white border border-light-pink/20 focus:ring-2 focus:ring-light-pink outline-none"
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm text-gray-blue mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded bg-dark-blue text-white border border-light-pink/20 focus:ring-2 focus:ring-light-pink outline-none"
              placeholder="Enter your password"
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            type="submit"
            className="w-full bg-light-pink hover:bg-bright-pink text-dark-blue font-semibold py-3 rounded transition-colors"
          >
            {isSignUp ? 'Sign Up' : 'Log In'}
          </button>
        </form>
        <p className="text-center text-gray-blue mt-4">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-light-pink hover:text-bright-pink underline"
          >
            {isSignUp ? 'Log In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;