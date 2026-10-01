import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const SignupPage: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim()) {
      setError('Please provide both your first and last name.');
      return;
    }

    if (!email || !email.includes('@')) {
      setError('Please provide a valid work email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify and try again.');
      return;
    }

    if (!agreeTerms) {
      setError('Please accept the Terms of Service and Privacy Policy to continue.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signup(firstName, lastName, email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-6 sm:py-8 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glowing gradients */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="bg-slate-800/80 border border-slate-700/80 backdrop-blur-xl py-6 px-6 shadow-2xl rounded-2xl sm:px-8">
          {/* Brand Logo & Title */}
          <div className="flex justify-center items-center gap-2.5 mb-2">
            <img
              src="/favicon.png"
              alt="ZanCompute Logo"
              className="h-8 w-8 object-contain shrink-0"
            />
            <span className="text-xl font-bold tracking-tight text-white font-sans">
              ZanCompute <span className="text-brand-400">CRM</span>
            </span>
          </div>

          <div className="text-center mb-3">
            <h2 className="text-base font-bold text-white tracking-tight">Create your account</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Get started with your CRM workspace today</p>
          </div>

          <form className="space-y-2.5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs font-medium">
                {error}
              </div>
            )}

            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  First name
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="block w-full pl-8 pr-2.5 py-1.5 bg-slate-900/60 border border-slate-700 text-slate-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 placeholder-slate-500 transition-colors"
                    placeholder="John"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Last name
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="block w-full pl-8 pr-2.5 py-1.5 bg-slate-900/60 border border-slate-700 text-slate-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 placeholder-slate-500 transition-colors"
                    placeholder="Doe"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Work email
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="block w-full pl-8 pr-2.5 py-1.5 bg-slate-900/60 border border-slate-700 text-slate-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 placeholder-slate-500 transition-colors"
                  placeholder="john.doe@company.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="block w-full pl-8 pr-8 py-1.5 bg-slate-900/60 border border-slate-700 text-slate-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 placeholder-slate-500 transition-colors"
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Confirm password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="block w-full pl-8 pr-8 py-1.5 bg-slate-900/60 border border-slate-700 text-slate-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 placeholder-slate-500 transition-colors"
                  placeholder="Re-enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="flex items-start text-xs pt-0.5">
              <label className="flex items-start text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={e => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 rounded bg-slate-900 border-slate-700 text-brand-600 focus:ring-brand-500 focus:ring-offset-slate-900"
                />
                <span className="ml-2 font-normal text-[11px] text-slate-400">
                  I agree to the{' '}
                  <span className="text-slate-200 font-medium">Terms</span> and{' '}
                  <span className="text-slate-200 font-medium">Privacy Policy</span>
                </span>
              </label>
            </div>

            <div className="pt-1">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                className="w-full py-2 shadow-md shadow-brand-600/30 text-xs font-semibold"
              >
                Create Account
              </Button>
            </div>
          </form>

          {/* Link back to login */}
          <div className="mt-3.5 pt-3 border-t border-slate-700/60 text-center">
            <p className="text-[11px] text-slate-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-brand-400 hover:text-brand-300 font-semibold transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
