import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Sparkles, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase.js';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');

  const [isLogin, setIsLogin] = useState(() => mode !== 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [signUpNotice, setSignUpNotice] = useState('');

  useEffect(() => {
    if (mode === 'signup') {
      setIsLogin(false);
    } else if (mode === 'login') {
      setIsLogin(true);
    }
  }, [mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSignUpNotice('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });

        if (signInError) throw signInError;
        if (data.session) {
          navigate('/dashboard');
        }
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password
        });

        if (signUpError) throw signUpError;

        if (data.session) {
          navigate('/dashboard');
        } else if (data.user) {
          setSignUpNotice('Sign up successful! If confirmation is required, please verify your email before logging in.');
          setIsLogin(true);
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream text-espresso font-sans antialiased flex flex-col items-center justify-center px-4 sm:px-6 py-12 relative overflow-hidden selection:bg-rose selection:text-espresso">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[500px] h-[340px] sm:h-[500px] bg-gradient-to-tr from-rose to-gold/20 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-cream-light rounded-3xl p-8 sm:p-10 border border-espresso/15 shadow-xl space-y-6"
      >
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-2xl font-serif tracking-widest text-espresso hover:opacity-80 transition-opacity"
          >
            <span className="font-semibold">AEVA</span>
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
          </Link>
          <h1 className="font-serif text-3xl font-normal text-espresso">
            {isLogin ? 'Welcome Back' : 'Create an Account'}
          </h1>
          <p className="text-xs text-espresso-muted font-light">
            {isLogin
              ? 'Access your proposal credits and crafted keepsakes.'
              : 'Join AEVA and receive 5 complimentary proposal credits.'}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex rounded-2xl bg-cream p-1.5 border border-espresso/10">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError('');
              setSignUpNotice('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all min-h-[44px] cursor-pointer ${
              isLogin
                ? 'bg-espresso text-cream shadow-sm'
                : 'text-espresso-muted hover:text-espresso'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setError('');
              setSignUpNotice('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all min-h-[44px] cursor-pointer ${
              !isLogin
                ? 'bg-espresso text-cream shadow-sm'
                : 'text-espresso-muted hover:text-espresso'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Notices & Errors */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {signUpNotice && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
            {signUpNotice}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-espresso/80 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-espresso-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-espresso/20 bg-cream text-espresso text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold min-h-[48px] placeholder:text-espresso-muted/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-espresso/80 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-espresso-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-espresso/20 bg-cream text-espresso text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold min-h-[48px] placeholder:text-espresso-muted/40"
              />
            </div>
            {!isLogin && (
              <p className="text-[11px] text-espresso-muted mt-1 font-light">
                Password must be at least 6 characters.
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full h-12 min-h-[48px] rounded-full font-medium text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
                isLoading
                  ? 'bg-espresso/60 text-cream cursor-not-allowed'
                  : 'bg-espresso text-cream hover:bg-espresso-pure active:scale-[0.98] cursor-pointer'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-gold" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-gold" />
                  <span>{isLogin ? 'Sign In' : 'Sign Up (5 Free Credits)'}</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Back Link */}
        <div className="pt-4 border-t border-espresso/10 text-center">
          <Link
            to="/"
            className="text-xs text-espresso-muted hover:text-espresso transition-colors inline-flex items-center gap-1 min-h-[44px]"
          >
            &larr; Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
