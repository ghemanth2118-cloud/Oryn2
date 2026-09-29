import React, { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OrynLogo from '../components/common/OrynLogo';
import { 
  Lock, 
  Mail, 
  User, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Server, 
  Terminal, 
  Cpu, 
  Zap, 
  Activity,
  KeyRound
} from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, signup, demoLogin } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please provide both email and password.");
      return;
    }

    setSubmitting(true);
    try {
      if (isSignUp) {
        await signup(email, password, displayName || email.split('@')[0], role);
      } else {
        await login(email, password);
      }
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      navigate('/dashboard');
    } catch (err) {
      // Handled via toast in AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemo = (demoRole) => {
    demoLogin(demoRole);
    confetti({ particleCount: 70, spread: 50, origin: { y: 0.6 } });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col lg:flex-row relative overflow-hidden font-sans selection:bg-primary-container selection:text-on-primary-container">
      {/* Background Subtle Ambient Glow Orbs */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] bg-primary-container/20 blur-[150px] rounded-full -z-10" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-secondary-container/15 blur-[150px] rounded-full -z-10" />

      {/* LEFT PANE: CYBERNETIC SRE MISSION VISUALS (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 p-12 xl:p-16 flex-col justify-between bg-surface-container-lowest/60 border-r border-outline-variant/20 relative backdrop-blur-2xl">
        <NavLink to="/" className="flex items-center gap-3">
          <OrynLogo />
        </NavLink>

        {/* Centerpiece: SRE Mission Terminal & Memory Visualizer */}
        <div className="my-auto flex flex-col gap-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container text-primary font-mono text-xs font-semibold uppercase tracking-wider w-fit border border-primary/30">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
            <span>Autonomous Incident Response</span>
          </div>

          <h1 className="text-3xl xl:text-4xl font-bold tracking-tight text-on-surface leading-tight">
            Stop Firefighting From Scratch. <br />
            <span className="bg-gradient-to-r from-primary via-secondary to-primary-fixed bg-clip-text text-transparent">
              Power Your Fleet With Organizational Memory.
            </span>
          </h1>

          <p className="text-sm text-on-surface-variant leading-relaxed">
            ORYN correlates real-time production telemetry against years of institutional post-mortems, 
            generating verified recovery commands in under 90 seconds.
          </p>

          {/* Mini Live Terminal Widget */}
          <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-2xl font-mono text-xs flex flex-col gap-2">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20 text-on-surface-variant text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-error" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-tertiary" />
                <span className="ml-2 text-on-surface font-semibold">oryn-telemetry-stream</span>
              </div>
              <span className="text-tertiary">LIVE 42.8k/s</span>
            </div>
            <div className="text-on-surface-variant text-[11px] space-y-1">
              <p><span className="text-primary font-bold">14:02:11</span> Alert: PgBouncer pool threshold &gt; 98%</p>
              <p><span className="text-secondary font-bold">14:02:14</span> Memory Engine: Matched INC-2189 (98.4%)</p>
              <p className="text-tertiary font-bold">14:02:19 Runbook verified: Terminating idle clients...</p>
            </div>
          </div>
        </div>

        {/* Footer Hardware & Security Chips */}
        <div className="flex items-center justify-between pt-6 border-t border-outline-variant/20 text-xs text-on-surface-variant font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-tertiary" /> SOC2 Type II</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5 text-tertiary" /> ISO 27001</span>
          </div>
          <span className="text-primary font-semibold">v2.4.9·ENTERPRISE</span>
        </div>
      </div>

      {/* RIGHT PANE: LOGIN / SIGNUP FORM */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md flex flex-col gap-6">
          {/* Top navigation row with Back to Dashboard & Home */}
          <div className="flex items-center justify-between w-full mb-1">
            <NavLink
              to="/"
              className="text-xs text-on-surface-variant hover:text-on-surface flex items-center gap-1 transition-colors"
            >
              ← Back to Home
            </NavLink>
            <NavLink
              to="/dashboard"
              className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high border border-outline-variant/30 hover:border-primary/40 transition-all shadow-sm"
            >
              <span>Incident Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>

          {/* Mobile Logo View */}
          <div className="lg:hidden flex justify-center mb-2">
            <NavLink to="/">
              <OrynLogo />
            </NavLink>
          </div>

          {/* Form Header */}
          <div className="flex flex-col gap-1.5">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
              {isSignUp ? 'Create SRE Account' : 'Welcome to ORYN'}
            </h2>
            <p className="text-xs text-on-surface-variant">
              {isSignUp 
                ? 'Join your team’s autonomous reliability engineering workspace.' 
                : 'Sign in to access your incident mission control and memory engine.'}
            </p>
          </div>

          {/* Tab Switcher: Sign In vs Sign Up */}
          <div className="flex items-center p-1 rounded-xl bg-surface-container-low border border-outline-variant/20">
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                !isSignUp 
                  ? 'bg-primary-container text-on-primary-container shadow-md' 
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                isSignUp 
                  ? 'bg-primary-container text-on-primary-container shadow-md' 
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Quick 1-Click Demo Evaluation Bar */}
          <div className="p-4 rounded-2xl bg-surface-container-low border border-primary/30 shadow-md flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-bold text-primary">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instant Evaluator Demo Access</span>
              </span>
              <span className="font-mono text-[10px] text-tertiary bg-tertiary-container/20 px-2 py-0.5 rounded border border-tertiary/20">
                1-CLICK
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant">
              Skip typing credentials to test role-based access immediately:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="py-2.5 px-3 rounded-xl bg-primary text-on-primary font-mono text-xs font-bold shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
              >
                <span>Admin Lead</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('engineer')}
                className="py-2.5 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-mono text-xs font-bold border border-outline-variant/30 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
              >
                <span>Staff SRE</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-on-surface-variant font-mono">
            <div className="flex-1 h-px bg-outline-variant/20" />
            <span>OR CONTINUE WITH CREDENTIALS</span>
            <div className="flex-1 h-px bg-outline-variant/20" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isSignUp && (
              <div className="flex flex-col gap-1.5 text-xs">
                <label className="font-semibold text-on-surface">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                  <input
                    type="text"
                    required
                    placeholder="Alex Rivera"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-surface-container text-xs text-on-surface border border-outline-variant/20 focus:outline-none focus:border-primary shadow-sm"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5 text-xs">
              <label className="font-semibold text-on-surface">Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="email"
                  required
                  placeholder="alex.rivera@oryn.internal"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-surface-container text-xs text-on-surface border border-outline-variant/20 focus:outline-none focus:border-primary shadow-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-on-surface">Password</label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => toast.info("Demo mode: Use any test password or use 1-click Admin login above.")}
                    className="text-primary hover:underline text-[11px]"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface-container text-xs text-on-surface border border-outline-variant/20 focus:outline-none focus:border-primary shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div className="flex flex-col gap-1.5 text-xs">
                <label className="font-semibold text-on-surface">Role Clearance</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container text-xs text-on-surface border border-outline-variant/20 focus:outline-none focus:border-primary shadow-sm font-mono"
                >
                  <option value="admin">Platform Admin (Full Write & Manage Authority)</option>
                  <option value="engineer">Site Reliability Engineer (Triage & Runbooks)</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-container via-primary-container to-secondary-container text-on-primary-container font-semibold text-xs flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              <span>{isSignUp ? 'Create Enterprise Account' : 'Authenticate Fleet Session'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Switch Prompt */}
          <div className="text-center text-xs text-on-surface-variant pt-2">
            {isSignUp ? (
              <span>
                Already have an enterprise account?{' '}
                <button onClick={() => setIsSignUp(false)} className="text-primary hover:underline font-semibold">
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                Need enterprise access to ORYN?{' '}
                <button onClick={() => setIsSignUp(true)} className="text-primary hover:underline font-semibold">
                  Create an account
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
