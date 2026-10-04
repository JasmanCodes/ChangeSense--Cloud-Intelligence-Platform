import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Zap, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('alex@acmecloud.io');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      await login(email, password);
      showToast({
        type: 'success',
        title: 'Authentication Successful',
        message: `Welcome back, ${email}`,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
  };

  const handleQuickDemoLogin = async () => {
    try {
      await login('alex@acmecloud.io', 'Password123!');
      showToast({
        type: 'success',
        title: 'Demo Session Active',
        message: 'Logged in as Admin (Alex Rivera). Welcome to ChangeSense!',
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0B0F19] text-white">
      {/* Left 50%: Gradient Brand Panel */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-12 flex-col justify-between border-r border-slate-800 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-glow-brand">
            <Zap className="w-6 h-6 fill-white text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">ChangeSense</h1>
            <p className="text-[11px] text-indigo-300 font-mono">Cloud Reliability Intelligence</p>
          </div>
        </div>

        <div className="z-10 max-w-lg my-auto space-y-6">
          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Know what changed <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-200 bg-clip-text text-transparent">
              before it breaks.
            </span>
          </h2>
          <p className="text-sm text-slate-300">
            ChangeSense bridges deployments, config mutations, and telemetry degradation to pinpoint probable cause in seconds.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Deterministic change-to-incident correlation algorithms</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Cross-account AWS AssumeRole with zero stored access keys</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Grounded AI incident assistant citing verified event IDs</span>
            </div>
          </div>

          {/* Animated Timeline Graphic */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-2 font-mono text-[11px]">
            <div className="flex items-center justify-between text-indigo-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                10:00:00 UTC
              </span>
              <span className="text-slate-500">DEPLOYMENT</span>
            </div>
            <p className="text-slate-400 text-xs">payment-service:v2.4 updated pool_size=5</p>
            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 animate-pulse w-3/4" />
            </div>
          </div>
        </div>

        <div className="z-10 text-xs text-slate-500">
          © 2026 ChangeSense Platform Inc. Enterprise Cloud Observability.
        </div>
      </div>

      {/* Right 50%: Form Card */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-left">
            <h2 className="text-2xl font-bold text-white tracking-tight">Sign in to ChangeSense</h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your credentials or click 1-Click Demo Login to explore.
            </p>
          </div>

          {/* 1-Click Demo Login Card */}
          <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-600/30 text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Preloaded Demo Admin</p>
                <p className="text-[11px] text-slate-400 font-mono">alex@acmecloud.io</p>
              </div>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleQuickDemoLogin}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              1-Click Sign In
            </Button>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/60 text-xs text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Work Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@acmecloud.io"
                className="w-full px-3.5 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Password
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    showToast({
                      type: 'info',
                      title: 'Demo Password',
                      message: 'Default demo password is: Password123!',
                    });
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="secondary"
              size="md"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In with Email
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            Don't have an organization account?{' '}
            <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold">
              Create Organization
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
