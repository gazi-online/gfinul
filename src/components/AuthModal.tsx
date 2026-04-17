import React, { useState } from 'react';
import { authApi } from '../api/auth';
import { EmailInput, isValidEmail } from './EmailInput';
import { PasswordInput } from './PasswordInput';
import { TextInput } from './TextInput';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!isValidEmail(email)) {
        throw new Error('Please enter a valid email address.');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }

      if (isLogin) {
        await authApi.loginUser(email, password);
      } else {
        await authApi.signUp(email, password, name);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 lg:p-6 bg-black/60 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] p-8 lg:p-10 shadow-2xl border border-gray-100 dark:border-slate-800 animate-scale-in">
        <div className="flex justify-between items-center mb-8 lg:mb-10">
          <h2 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-sm font-bold rounded-2xl animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          {!isLogin && (
            <TextInput
              label="Full Name"
              value={name}
              onChange={(nextValue) => setName(nextValue)}
              required
              disabled={loading}
              placeholder="Gazi Online"
              className="animate-fade-slide-in"
            />
          )}
          <EmailInput
            label="Email Address"
            value={email}
            onChange={(nextValue) => {
              setEmail(nextValue);
              setError(null);
            }}
            required
            disabled={loading}
            className="animate-fade-slide-in"
            placeholder="name@example.com"
          />
          <PasswordInput
            label="Password"
            value={password}
            onChange={(nextValue) => {
              setPassword(nextValue);
              setError(null);
            }}
            required
            disabled={loading}
            minLength={6}
            placeholder="Password"
          />
          <div className="hidden">
            <label className="block text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-600 rounded-2xl px-5 py-4 text-gray-900 dark:text-white placeholder:text-gray-400 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-black py-4 lg:py-5 rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-bold text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
