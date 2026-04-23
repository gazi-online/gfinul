import React, { useEffect, useState } from 'react';
import { authApi } from '../api/auth';
import { EmailInput, isValidEmail } from './EmailInput';
import { PasswordInput } from './PasswordInput';
import { TextInput } from './TextInput';
import { useTranslation } from 'react-i18next';

export type AuthModalMode = 'login' | 'signup' | 'forgotPassword' | 'resetPassword';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: AuthModalMode;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess, initialMode = 'login' }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<AuthModalMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isLogin = mode === 'login';
  const isSignup = mode === 'signup';
  const isForgotPassword = mode === 'forgotPassword';
  const isResetPassword = mode === 'resetPassword';

  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setSuccessMessage(null);
    setPassword('');
    setConfirmPassword('');
  }, [initialMode]);

  const switchMode = (nextMode: AuthModalMode) => {
    setMode(nextMode);
    setError(null);
    setSuccessMessage(null);
    setPassword('');
    setConfirmPassword('');
  };

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (!isValidEmail(email)) {
        throw new Error(t('validation.emailInvalid'));
      }
      if (isSignup && !name.trim()) {
        throw new Error(t('validation.fullNameRequired'));
      }

      if (isForgotPassword) {
        await authApi.requestPasswordReset(email);
        switchMode('login');
        setSuccessMessage(t('auth.resetLinkSentMessage'));
        return;
      }

      if (isResetPassword) {
        if (password.length < 8) {
          throw new Error(t('validation.newPasswordMin'));
        }
        if (password !== confirmPassword) {
          throw new Error(t('validation.confirmPasswordMismatch'));
        }

        await authApi.updatePassword(password);
        switchMode('login');
        setSuccessMessage(t('auth.passwordResetSuccess'));
        return;
      }

      if (password.length < 6) {
        throw new Error(t('validation.passwordMin', { count: 6 }));
      }

      if (isLogin) {
        await authApi.loginUser(email, password);
      } else {
        await authApi.signUp(email, password, name.trim());
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || t('auth.authFailed'));
    } finally {
      setLoading(false);
    }
  };

  const title = isLogin
    ? t('auth.welcomeBack')
    : isSignup
      ? t('auth.createAccount')
      : isForgotPassword
        ? t('auth.resetPassword')
        : t('auth.setNewPassword');

  const subtitle = isForgotPassword
    ? t('auth.resetPasswordDescription')
    : isResetPassword
      ? t('auth.setNewPasswordDescription')
      : null;

  const submitLabel = isLogin
    ? t('auth.signIn')
    : isSignup
      ? t('auth.createAccountButton')
      : isForgotPassword
        ? t('auth.sendResetLink')
        : t('auth.saveNewPassword');

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 lg:p-6 bg-black/60 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] p-8 lg:p-10 shadow-2xl border border-gray-100 dark:border-slate-800 animate-scale-in">
        <div className="flex justify-between items-start mb-8 lg:mb-10 gap-4">
          <div className="space-y-2">
            <h2 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            aria-label={t('common.close')}
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

        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm font-bold rounded-2xl">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          {isSignup && (
            <TextInput
              label={t('auth.fullName')}
              value={name}
              onChange={(nextValue) => {
                setName(nextValue);
                setError(null);
              }}
              required
              disabled={loading}
              placeholder={t('auth.namePlaceholder')}
              className="animate-fade-slide-in"
            />
          )}
          <EmailInput
            label={t('auth.emailAddress')}
            value={email}
            onChange={(nextValue) => {
              setEmail(nextValue);
              setError(null);
              setSuccessMessage(null);
            }}
            required
            disabled={loading || isResetPassword}
            className="animate-fade-slide-in"
            placeholder={t('auth.emailPlaceholder')}
          />
          <PasswordInput
            label={t('auth.password')}
            value={password}
            onChange={(nextValue) => {
              setPassword(nextValue);
              setError(null);
            }}
            required
            disabled={loading}
            minLength={6}
            placeholder={t('auth.passwordPlaceholder')}
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
              isLogin ? t('auth.signIn') : t('auth.createAccountButton')
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => switchMode(isLogin ? 'signup' : 'login')}
            className="text-sm font-bold text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {isLogin ? t('auth.dontHaveAccount') : t('auth.alreadyHaveAccount')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
