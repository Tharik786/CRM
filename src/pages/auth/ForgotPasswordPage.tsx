import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { crmService } from '../../api/services/crmService';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please provide a valid work email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await crmService.requestPasswordReset(email);
      setIsSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to send reset instructions. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await crmService.requestPasswordReset(email);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glowing gradients */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="bg-slate-800/80 border border-slate-700/80 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl sm:px-8">
          {/* Brand Logo & Title */}
          <div className="flex justify-center items-center gap-3 mb-6">
            <img
              src="/favicon.png"
              alt="ZanCompute Logo"
              className="h-10 w-10 object-contain shrink-0"
            />
            <span className="text-2xl font-black tracking-tight text-white font-sans">
              ZanCompute <span className="text-brand-400">CRM</span>
            </span>
          </div>

          {!isSubmitted ? (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-white tracking-tight">Forgot password?</h2>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  No worries! Enter your registered work email and we'll send you instructions to reset your password.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                {error && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-medium">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email address
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-900/60 border border-slate-700 text-slate-100 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 placeholder-slate-500 transition-colors"
                      placeholder="name@company.com"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isSubmitting}
                    className="w-full shadow-lg shadow-brand-600/30"
                  >
                    Send Reset Link
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Check your email</h2>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  We've sent a password reset link to:
                </p>
                <p className="text-xs font-semibold text-brand-300 mt-0.5 bg-slate-900/50 py-1.5 px-3 rounded-lg border border-slate-700/60 inline-block max-w-full truncate">
                  {email}
                </p>
                <p className="text-[11px] text-slate-400 mt-2">
                  Didn't receive the email? Check your spam folder or try resending.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-medium text-left">
                  {error}
                </div>
              )}

              <div className="pt-2 space-y-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={handleResend}
                  isLoading={isSubmitting}
                  className="w-full"
                >
                  Resend Email
                </Button>
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="text-xs text-slate-400 hover:text-slate-200 font-medium py-1 transition-colors block w-full"
                >
                  Use a different email address
                </button>
              </div>
            </div>
          )}

          {/* Back to Login link */}
          <div className="mt-6 pt-5 border-t border-slate-700/60 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
