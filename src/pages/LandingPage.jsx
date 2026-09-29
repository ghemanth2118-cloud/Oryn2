import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import OrynLogo from '../components/common/OrynLogo';
import { 
  ArrowRight, 
  Play, 
  Terminal, 
  BrainCircuit, 
  ShieldCheck, 
  Zap, 
  Layers, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  Activity, 
  TrendingDown, 
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Server,
  Database,
  Lock,
  Cpu,
  XCircle,
  Check,
  Rocket,
  Calendar,
  Users,
  GitBranch,
  FileCode,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const headlineRef = useRef(null);
  const ctaRef = useRef(null);
  const deckRef = useRef(null);

  // Live simulation interactive state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simTimer, setSimTimer] = useState('00:42.8s');
  const [simProgress, setSimProgress] = useState(3); // 1, 2, 3
  const [activeTab, setActiveTab] = useState('diagnostic');

  useEffect(() => {
    // GSAP Hero Entrance
    const ctx = gsap.context(() => {
      gsap.from(headlineRef.current, {
        opacity: 0,
        y: 40,
        duration: 1,
        ease: 'power3.out'
      });
      gsap.from(ctaRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.8,
        delay: 0.25,
        ease: 'power3.out'
      });
      gsap.from(deckRef.current, {
        opacity: 0,
        y: 50,
        scale: 0.98,
        duration: 1.1,
        delay: 0.45,
        ease: 'power3.out'
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  // Run interactive live simulation
  const handleTriggerSimulation = () => {
    setIsSimulating(true);
    setSimProgress(1);
    setSimTimer('00:04.1s');

    setTimeout(() => {
      setSimProgress(2);
      setSimTimer('00:15.3s');
    }, 1200);

    setTimeout(() => {
      setSimProgress(3);
      setSimTimer('00:42.8s');
      setIsSimulating(false);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    }, 2400);
  };

  return (
    <div ref={heroRef} className="min-h-screen bg-background text-on-surface font-sans selection:bg-primary-container selection:text-on-primary-container overflow-x-hidden relative">
      {/* Ambient Glow Orbs */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-primary-container/25 via-secondary-container/10 to-transparent blur-[140px] rounded-full -z-10" />
      <div className="pointer-events-none absolute top-[1100px] -left-48 w-[700px] h-[500px] bg-secondary-container/10 blur-[150px] rounded-full -z-10" />
      <div className="pointer-events-none absolute top-[2200px] -right-48 w-[600px] h-[450px] bg-tertiary-container/10 blur-[140px] rounded-full -z-10" />

      {/* TOP NAVIGATION */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-md">
        <div className="h-16 w-full max-w-[1780px] mx-auto px-6 lg:px-12 flex items-center justify-between gap-6">
          <NavLink to="/" className="flex items-center gap-3">
            <OrynLogo />
          </NavLink>

          <nav className="hidden xl:flex items-center gap-1 text-sm font-medium text-on-surface-variant">
            <a href="#product" className="px-3.5 py-1.5 rounded-lg hover:text-on-surface hover:bg-surface-container transition-colors">Product</a>
            <a href="#architecture" className="px-3.5 py-1.5 rounded-lg hover:text-on-surface hover:bg-surface-container transition-colors">Architecture</a>
            <a href="#memory-engine" className="px-3.5 py-1.5 rounded-lg hover:text-on-surface hover:bg-surface-container transition-colors">Memory Engine</a>
            <a href="#runbooks" className="px-3.5 py-1.5 rounded-lg hover:text-on-surface hover:bg-surface-container transition-colors">Runbooks</a>
            <a href="#comparison" className="px-3.5 py-1.5 rounded-lg hover:text-on-surface hover:bg-surface-container transition-colors">Why Memory</a>
            <a href="#pricing" className="px-3.5 py-1.5 rounded-lg hover:text-on-surface hover:bg-surface-container transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-3.5">
            <NavLink 
              to="/login" 
              className="text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors px-3 py-1.5"
            >
              Sign In
            </NavLink>
            <NavLink
              to="/dashboard"
              className="inline-flex items-center justify-center text-sm font-semibold text-on-primary-container bg-gradient-to-r from-primary-container to-secondary-container rounded-xl px-4 py-2 border border-primary/40 shadow-[0_0_16px_rgba(79,70,229,0.35)] hover:shadow-[0_0_24px_rgba(79,70,229,0.55)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Open Live Deck
            </NavLink>
          </div>
        </div>
      </header>

      {/* SECTION 1: HERO */}
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-24 max-w-[1780px] mx-auto px-6 lg:px-12 flex flex-col items-center text-center">
        {/* Announcement Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-surface-container-low/90 backdrop-blur-md border border-outline-variant/30 shadow-[0_0_20px_rgba(79,70,229,0.18)] mb-8">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-80" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary" />
          </span>
          <span className="font-mono text-xs text-on-surface-variant font-medium">
            Announcing ORYN Memory Engine 2.0 • Autonomous Outage Prevention
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-primary" />
        </div>

        {/* Main Title */}
        <div ref={headlineRef} className="max-w-5xl">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-on-surface leading-[1.08]">
            AI Incident Response That{' '}
            <span className="bg-gradient-to-r from-primary via-secondary to-primary-fixed bg-clip-text text-transparent">
              Learns From Every Outage
            </span>
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg lg:text-xl text-on-surface-variant leading-relaxed">
            Analyze production failures, recall organizational knowledge, generate recovery runbooks, 
            and continuously improve site reliability through long-term semantic memory.
          </p>
        </div>

        {/* CTAs */}
        <div ref={ctaRef} className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <NavLink
            to="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-primary-container via-primary-container to-secondary-container text-on-primary-container font-semibold shadow-[0_0_24px_rgba(79,70,229,0.45)] hover:shadow-[0_0_36px_rgba(79,70,229,0.65)] hover:scale-[1.02] active:scale-[0.98] transition-all text-sm"
          >
            <span>Launch Incident Deck</span>
            <ArrowRight className="w-4 h-4" />
          </NavLink>
          
          <button
            onClick={handleTriggerSimulation}
            type="button"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-surface-container-high/80 backdrop-blur-md text-on-surface font-medium hover:bg-surface-container-highest border border-outline-variant/30 shadow-sm transition-all text-sm group"
          >
            <Play className={`w-4 h-4 text-secondary fill-secondary transition-transform ${isSimulating ? 'animate-spin' : 'group-hover:scale-110'}`} />
            <span>{isSimulating ? 'Simulating Remediation...' : 'Watch Live Simulation'}</span>
          </button>
        </div>

        {/* Social Proof & Integrations Banner */}
        <div className="mt-16 pt-8 w-full max-w-4xl flex flex-col items-center gap-4">
          <span className="font-mono text-xs text-on-surface-variant uppercase tracking-widest text-center font-medium">
            Trusted by tier-1 engineering organizations maintaining 99.999% uptime
          </span>
          <div className="flex flex-wrap items-center justify-center gap-3 text-on-surface-variant font-mono text-xs">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/20 shadow-sm">
              <Server className="w-3.5 h-3.5 text-primary" /> AWS EKS
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/20 shadow-sm">
              <Cpu className="w-3.5 h-3.5 text-secondary" /> Kubernetes
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/20 shadow-sm">
              <Activity className="w-3.5 h-3.5 text-tertiary" /> Datadog
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/20 shadow-sm">
              <ShieldAlert className="w-3.5 h-3.5 text-error" /> PagerDuty
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/20 shadow-sm">
              <Terminal className="w-3.5 h-3.5 text-on-surface" /> GitHub Actions
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/20 shadow-sm">
              <Zap className="w-3.5 h-3.5 text-primary" /> Slack Enterprise
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 2: HERO INTERACTIVE INCIDENT & MEMORY VISUALIZATION (Linear/Mission-Control Glass Deck) */}
      <section ref={deckRef} className="w-full max-w-[1780px] mx-auto px-6 lg:px-12 mb-28" id="product">
        <div className="w-full rounded-2xl bg-surface-container-lowest/90 backdrop-blur-2xl border border-outline-variant/30 shadow-[0_24px_64px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Deck Top Bar */}
          <div className="px-6 py-4 bg-surface-container-low border-b border-outline-variant/20 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-error-container text-on-error-container font-mono text-xs font-semibold tracking-wide animate-pulse">
                <span className="h-2 w-2 rounded-full bg-error inline-block" />
                CRITICAL • SEV-1
              </div>
              <span className="font-bold text-on-surface text-base">Incident #4092</span>
              <span className="hidden md:inline text-on-surface-variant font-mono text-xs">
                — PostgreSQL Connection Pool Exhaustion on us-east-1 checkout cluster
              </span>
            </div>

            <div className="flex items-center gap-4 font-mono text-xs">
              <div className="flex items-center gap-1.5 text-on-surface-variant bg-surface-container-high px-2.5 py-1 rounded border border-outline-variant/20">
                <Clock className="w-3.5 h-3.5 text-tertiary" />
                <span>TTR: <strong className="text-tertiary font-semibold">{simTimer}</strong></span>
              </div>
              <button
                onClick={handleTriggerSimulation}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-tertiary-container/30 text-on-tertiary-container font-semibold border border-tertiary/40 hover:bg-tertiary-container/50 transition-colors"
              >
                <RotateCcw className="w-3 h-3 text-tertiary" />
                <span>Auto-Synthesis Active</span>
              </button>
            </div>
          </div>

          {/* Main Deck Body: 3-Column Tactical Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-outline-variant/20 bg-surface-container-lowest">
            {/* Column 1: Autonomous Diagnostic Stream */}
            <div className="lg:col-span-4 p-6 flex flex-col gap-4 bg-surface-container-low/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-secondary" />
                  <h3 className="font-semibold text-on-surface text-sm">Autonomous Diagnostic Stream</h3>
                </div>
                <span className="font-mono text-[11px] text-secondary bg-secondary-container/30 px-2 py-0.5 rounded">
                  Live Feed
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                Correlating real-time Kubernetes pods, PgBouncer latency, and checkout queue backlog.
              </p>

              {/* Terminal Flow */}
              <div className="flex flex-col gap-2 font-mono text-xs bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/20 shadow-inner">
                <div className="flex items-start gap-2 text-on-surface-variant">
                  <span className="text-primary font-bold">14:02:11</span>
                  <span>Alert trigger: PgBouncer active pool exceeded 98.2% max limit.</span>
                </div>
                <div className="flex items-start gap-2 text-error">
                  <span className="text-error font-bold">14:02:14</span>
                  <span>Cascading lock: Redis replica timeout in worker <code className="bg-surface-container-high px-1 rounded text-on-surface">checkout-worker-7c</code></span>
                </div>
                <div className="flex items-start gap-2 text-tertiary">
                  <span className="text-tertiary font-bold">14:02:19</span>
                  <span>Root localized: Leaked idle-in-transaction connections under thread surge.</span>
                </div>
              </div>

              {/* Sparkline Graph */}
              <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20 flex flex-col gap-2">
                <div className="flex items-center justify-between font-mono text-[11px] text-on-surface-variant">
                  <span>DB Connection Pool Saturation</span>
                  <span className="text-error font-bold">99.4% ↑</span>
                </div>
                <svg className="w-full h-12" fill="none" viewBox="0 0 300 50">
                  <defs>
                    <linearGradient id="streamGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d="M0 40 Q 40 38, 80 34 T 160 26 T 220 12 T 300 4 L 300 50 L 0 50 Z" fill="url(#streamGrad)" />
                  <path d="M0 40 Q 40 38, 80 34 T 160 26 T 220 12 T 300 4" stroke="#ffb4ab" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Column 2: Memory Recall & Similarity Synapse */}
            <div className="lg:col-span-4 p-6 flex flex-col gap-4 bg-surface-container-low/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-on-surface text-sm">Memory Recall Synapse</h3>
                </div>
                <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-tertiary-container/30 text-on-tertiary-container border border-tertiary/30 font-semibold">
                  98.4% Match
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                ORYN queried 4,218 past organizational post-mortems and PR discussions to pinpoint prior remediation patterns.
              </p>

              {/* Matched Historical Incidents */}
              <div className="flex flex-col gap-3">
                <div className="p-3.5 rounded-xl bg-surface-container border border-primary/40 shadow-sm flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-primary">INC-2189 • 8 months ago</span>
                    <span className="text-[11px] font-mono text-tertiary font-bold">98.4% similarity</span>
                  </div>
                  <p className="text-xs font-semibold text-on-surface">
                    "PgBouncer leak following Black Friday cart spike"
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-mono text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-tertiary" />
                    <span>Fixed by @sarah.m via pool ceiling dynamic increase</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surface-container/60 border border-outline-variant/20 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-primary">INC-3104 • 3 months ago</span>
                    <span className="text-[11px] font-mono text-tertiary font-bold">91.2% similarity</span>
                  </div>
                  <p className="text-xs text-on-surface">
                    "Checkout service Aurora lock cascade during node recycle"
                  </p>
                </div>
              </div>

              {/* Graph Node Sync */}
              <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-between font-mono text-xs text-on-surface-variant">
                <span className="flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-secondary" />
                  <span>Graph Node Sync: <strong className="text-on-surface">1.2M vectors</strong></span>
                </span>
                <span className="text-tertiary font-semibold">Synced</span>
              </div>
            </div>

            {/* Column 3: Autonomous Runbook Execution */}
            <div className="lg:col-span-4 p-6 flex flex-col gap-4 bg-surface-container-low/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-tertiary" />
                  <h3 className="font-semibold text-on-surface text-sm">Generated Recovery Runbook</h3>
                </div>
                <span className="font-mono text-[11px] text-on-surface bg-surface-container-high px-2 py-0.5 rounded">
                  v4.2-auto
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                Automated playbook verified against active cluster topology; executed with zero human intervention.
              </p>

              {/* Steps Progress */}
              <div className="flex flex-col gap-2.5">
                <div className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                  simProgress >= 1 ? 'bg-surface-container border-tertiary/40' : 'bg-surface-container-lowest opacity-50'
                }`}>
                  <span className="flex h-5 w-5 rounded-full bg-tertiary-container items-center justify-center text-on-tertiary font-mono text-xs font-bold shrink-0 mt-0.5">
                    1
                  </span>
                  <div className="flex flex-col gap-0.5 text-xs">
                    <span className="font-semibold text-on-surface">Drain stale worker connections</span>
                    <span className="font-mono text-[11px] text-on-surface-variant">Terminated 142 orphaned TCP sessions • Completed in 4.1s</span>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                  simProgress >= 2 ? 'bg-surface-container border-tertiary/40' : 'bg-surface-container-lowest opacity-50'
                }`}>
                  <span className="flex h-5 w-5 rounded-full bg-tertiary-container items-center justify-center text-on-tertiary font-mono text-xs font-bold shrink-0 mt-0.5">
                    2
                  </span>
                  <div className="flex flex-col gap-0.5 text-xs">
                    <span className="font-semibold text-on-surface">Bump max pool ceiling to 850</span>
                    <span className="font-mono text-[11px] text-on-surface-variant">Config patch applied hot via envoy-sidecar • Completed in 11.2s</span>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                  simProgress >= 3 ? 'bg-surface-container border-tertiary/40' : 'bg-surface-container-lowest opacity-50'
                }`}>
                  <span className="flex h-5 w-5 rounded-full bg-tertiary-container items-center justify-center text-on-tertiary font-mono text-xs font-bold shrink-0 mt-0.5">
                    3
                  </span>
                  <div className="flex flex-col gap-0.5 text-xs">
                    <span className="font-semibold text-on-surface">Deploy connection proxy hotfix</span>
                    <span className="font-mono text-[11px] text-on-surface-variant">Canary rolled to 100% with 0% dropped transactions • Done</span>
                  </div>
                </div>
              </div>

              {/* Remediation Metric Callout */}
              <div className="mt-auto p-3.5 rounded-xl bg-tertiary-container/20 text-on-tertiary-container flex items-center justify-between border border-tertiary/30">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-tertiary" />
                  <span className="text-sm font-bold text-tertiary">Remediated in 42s</span>
                </div>
                <span className="font-mono text-xs font-semibold text-on-surface">Saved 38 mins MTTR</span>
              </div>
            </div>
          </div>

          {/* Integrated Visual Telemetry & Architecture Reference Image from Stitch */}
          <div className="p-6 bg-surface-container-lowest border-t border-outline-variant/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <span className="font-mono text-xs text-secondary uppercase font-semibold">
                  Cybernetic Incident Response Architecture
                </span>
                <h4 className="text-xl font-bold text-on-surface mt-0.5">
                  Live Autonomous Memory Engine Graph
                </h4>
              </div>
              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="flex items-center gap-1.5 text-on-surface-variant">
                  <span className="h-2 w-2 rounded-full bg-tertiary" /> System Status: Optimal
                </span>
                <span className="text-on-surface-variant/40">•</span>
                <span className="text-secondary font-mono">Active Threats: 0</span>
              </div>
            </div>

            <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl bg-surface-container-low max-h-[460px] border border-outline-variant/20">
              <img 
                alt="Cybernetic Incident Response Architecture Graph" 
                className="w-full h-full object-cover object-center filter saturate-[1.1] contrast-[1.05]" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAUgDAzyoFWm4RSt9pFuaMVixrYpAVpLWG_zQboaaTsCp0lrpq5N-27JF7sBtiyyijAKSNGti7aRF_2if_5I2CBcF_-sNgsx_7mQCwpiPubW7ubTODU_T0x35DlQJ4bw0WQAKyXXdZ6ps1AZ3zAsRPCjApenEP2gkoUy_P1CtIzmT93BQ-u5S6WgyVjAREniXuxPpnXvl0yu8_79pS8vfNGwk7wt39PQDrnGayFgd6gQtO3gy-dsQLT"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent pointer-events-none opacity-80" />
              <div className="absolute bottom-4 left-4 right-4 md:right-auto md:left-6 flex flex-wrap items-center gap-3 bg-surface-container-high/90 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-lg border border-outline-variant/30">
                <BrainCircuit className="w-5 h-5 text-primary" />
                <span className="font-mono text-xs text-on-surface">
                  Memory Synthesis Pipeline: <strong>4.8M continuous cluster vectors</strong> evaluated in 28ms
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: CORE CAPABILITIES (Bento Grid) */}
      <section className="w-full max-w-[1780px] mx-auto px-6 lg:px-12 py-20" id="architecture">
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high text-primary font-mono text-xs font-semibold uppercase tracking-wider mb-3">
            Core Capabilities
          </div>
          <h2 className="text-3xl sm:text-5xl text-on-surface font-bold tracking-tight max-w-3xl">
            Built for Modern SREs Under Extreme Operational Pressure
          </h2>
          <p className="mt-4 text-base text-on-surface-variant max-w-2xl">
            Every incident makes the next one easier to solve. Move from reactive fire-fighting to self-healing resilience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Card 1 */}
          <div className="group relative rounded-2xl bg-surface-container-low/70 backdrop-blur-xl p-8 hover:bg-surface-container-low transition-all border border-outline-variant/20 shadow-md hover:shadow-xl flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 w-44 h-44 bg-primary-container/10 rounded-full blur-3xl -z-10 group-hover:scale-125 transition-transform duration-500" />
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
                  <Activity className="w-6 h-6" />
                </div>
                <span className="font-mono text-xs text-on-surface-variant bg-surface-container-high px-2.5 py-1 rounded">
                  01 // INGESTION
                </span>
              </div>
              <h3 className="text-xl font-bold text-on-surface group-hover:text-primary transition-colors">
                Continuous Telemetry Ingestion
              </h3>
              <p className="mt-3 text-sm text-on-surface-variant leading-relaxed">
                Real-time ingestion across logs, metrics, traces, and alert streams without sampling. High-throughput zero-drop pipeline parsing 10M+ events per second with sub-50ms processing latency.
              </p>
            </div>
            <div className="mt-8 pt-5 bg-surface-container-lowest/50 rounded-xl p-3 flex flex-wrap items-center gap-2 font-mono text-xs text-on-surface-variant">
              <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface">OpenTelemetry native</span>
              <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface">Zero sampling</span>
              <span className="px-2 py-0.5 rounded bg-surface-container-high text-tertiary">50ms SLA</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="group relative rounded-2xl bg-surface-container-low/70 backdrop-blur-xl p-8 hover:bg-surface-container-low transition-all border border-outline-variant/20 shadow-md hover:shadow-xl flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 w-44 h-44 bg-secondary-container/10 rounded-full blur-3xl -z-10 group-hover:scale-125 transition-transform duration-500" />
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-secondary group-hover:bg-secondary-container group-hover:text-on-secondary-container transition-colors">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <span className="font-mono text-xs text-on-surface-variant bg-surface-container-high px-2.5 py-1 rounded">
                  02 // MEMORY
                </span>
              </div>
              <h3 className="text-xl font-bold text-on-surface group-hover:text-secondary transition-colors">
                Organizational Memory Recall
              </h3>
              <p className="mt-3 text-sm text-on-surface-variant leading-relaxed">
                Synthesizes tribal knowledge from Slack threads, previous post-mortems, Jira tickets, and GitHub PRs into a self-updating knowledge graph that never loses institutional experience.
              </p>
            </div>
            <div className="mt-8 pt-5 bg-surface-container-lowest/50 rounded-xl p-3 flex flex-wrap items-center gap-2 font-mono text-xs text-on-surface-variant">
              <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface">Slack Threads Indexer</span>
              <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface">GitHub Commits RAG</span>
              <span className="px-2 py-0.5 rounded bg-surface-container-high text-secondary">Neural Synapse</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="group relative rounded-2xl bg-surface-container-low/70 backdrop-blur-xl p-8 hover:bg-surface-container-low transition-all border border-outline-variant/20 shadow-md hover:shadow-xl flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 w-44 h-44 bg-tertiary-container/10 rounded-full blur-3xl -z-10 group-hover:scale-125 transition-transform duration-500" />
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-tertiary group-hover:bg-tertiary-container group-hover:text-on-tertiary-container transition-colors">
                  <Zap className="w-6 h-6" />
                </div>
                <span className="font-mono text-xs text-on-surface-variant bg-surface-container-high px-2.5 py-1 rounded">
                  03 // REMEDIATION
                </span>
              </div>
              <h3 className="text-xl font-bold text-on-surface group-hover:text-tertiary transition-colors">
                Automated Recovery Runbooks
              </h3>
              <p className="mt-3 text-sm text-on-surface-variant leading-relaxed">
                Dynamically generated execution playbooks verified against current cluster topology with single-click automated rollback, pool expansion, or safe connection draining.
              </p>
            </div>
            <div className="mt-8 pt-5 bg-surface-container-lowest/50 rounded-xl p-3 flex flex-wrap items-center gap-2 font-mono text-xs text-on-surface-variant">
              <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface">Cluster Sandboxing</span>
              <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface">1-Click Dry Run</span>
              <span className="px-2 py-0.5 rounded bg-surface-container-high text-tertiary">Safe Rollback</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="group relative rounded-2xl bg-surface-container-low/70 backdrop-blur-xl p-8 hover:bg-surface-container-low transition-all border border-outline-variant/20 shadow-md hover:shadow-xl flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 w-44 h-44 bg-primary-container/10 rounded-full blur-3xl -z-10 group-hover:scale-125 transition-transform duration-500" />
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary-fixed group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="font-mono text-xs text-on-surface-variant bg-surface-container-high px-2.5 py-1 rounded">
                  04 // SYNTHESIS
                </span>
              </div>
              <h3 className="text-xl font-bold text-on-surface group-hover:text-primary transition-colors">
                Self-Authoring Post-Mortems
              </h3>
              <p className="mt-3 text-sm text-on-surface-variant leading-relaxed">
                Auto-generates exhaustive, audit-ready incident reports with timeline reconstruction, root cause analysis, telemetry snapshots, and preventative action items in seconds.
              </p>
            </div>
            <div className="mt-8 pt-5 bg-surface-container-lowest/50 rounded-xl p-3 flex flex-wrap items-center gap-2 font-mono text-xs text-on-surface-variant">
              <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface">SOC2 Compliant</span>
              <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface">Confluence & Notion Sync</span>
              <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary">Zero Manual Effort</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: ARCHITECTURE PIPELINE */}
      <section className="w-full max-w-[1780px] mx-auto px-6 lg:px-12 py-20 bg-surface-container-lowest/50 border-y border-outline-variant/20" id="memory-engine">
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high text-secondary font-mono text-xs font-semibold uppercase tracking-wider mb-3">
            Engineered Architecture
          </div>
          <h2 className="text-3xl sm:text-5xl text-on-surface font-bold tracking-tight max-w-3xl">
            The ORYN Incident Intelligence Pipeline
          </h2>
          <p className="mt-4 text-base text-on-surface-variant max-w-2xl">
            How incoming chaos transforms into verified operational recovery within seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Phase 1 */}
          <div className="flex flex-col p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 shadow-sm relative group hover:bg-surface-container transition-colors">
            <div className="flex items-center justify-between mb-4">
              <span className="w-9 h-9 rounded-lg bg-surface-container-high text-primary font-mono text-xs font-bold flex items-center justify-center">
                01
              </span>
              <span className="font-mono text-xs text-on-surface-variant uppercase">Phase 1</span>
            </div>
            <h4 className="font-bold text-on-surface text-base mb-2">Telemetry & Ingestion</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              OpenTelemetry pipelines ingest logs, APM events, traces, and metrics from CloudWatch, Datadog, Grafana, and Prometheus without sampling overhead.
            </p>
            <div className="mt-6 pt-4 border-t border-outline-variant/20 flex flex-col gap-1.5 font-mono text-xs">
              <span className="text-on-surface-variant">Throughput: <strong className="text-on-surface">10M+ events/s</strong></span>
              <span className="text-on-surface-variant">Ingress Latency: <strong className="text-tertiary">&lt; 50ms</strong></span>
            </div>
          </div>

          {/* Phase 2 */}
          <div className="flex flex-col p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 shadow-sm relative group hover:bg-surface-container transition-colors">
            <div className="flex items-center justify-between mb-4">
              <span className="w-9 h-9 rounded-lg bg-surface-container-high text-secondary font-mono text-xs font-bold flex items-center justify-center">
                02
              </span>
              <span className="font-mono text-xs text-on-surface-variant uppercase">Phase 2</span>
            </div>
            <h4 className="font-bold text-on-surface text-base mb-2">Neuro-Symbolic Correlation</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Graph neural networks parse cluster topology to isolate the root anomaly and isolate collateral noise from downstream cascading error traces.
            </p>
            <div className="mt-6 pt-4 border-t border-outline-variant/20 flex flex-col gap-1.5 font-mono text-xs">
              <span className="text-on-surface-variant">Inference Speed: <strong className="text-on-surface">&lt; 12ms</strong></span>
              <span className="text-on-surface-variant">Precision: <strong className="text-secondary">99.98%</strong></span>
            </div>
          </div>

          {/* Phase 3 */}
          <div className="flex flex-col p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 shadow-sm relative group hover:bg-surface-container transition-colors">
            <div className="flex items-center justify-between mb-4">
              <span className="w-9 h-9 rounded-lg bg-surface-container-high text-tertiary font-mono text-xs font-bold flex items-center justify-center">
                03
              </span>
              <span className="font-mono text-xs text-on-surface-variant uppercase">Phase 3</span>
            </div>
            <h4 className="font-bold text-on-surface text-base mb-2">Organizational Memory Layer</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              RAG engine searches historical outages, post-mortems, Git commits, and engineer Slack chats to retrieve prior proven resolutions and exact command fixes.
            </p>
            <div className="mt-6 pt-4 border-t border-outline-variant/20 flex flex-col gap-1.5 font-mono text-xs">
              <span className="text-on-surface-variant">Search Space: <strong className="text-on-surface">All Past Years</strong></span>
              <span className="text-on-surface-variant">Recall Accuracy: <strong className="text-tertiary">98.4%</strong></span>
            </div>
          </div>

          {/* Phase 4 */}
          <div className="flex flex-col p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 shadow-sm relative group hover:bg-surface-container transition-colors">
            <div className="flex items-center justify-between mb-4">
              <span className="w-9 h-9 rounded-lg bg-surface-container-high text-primary font-mono text-xs font-bold flex items-center justify-center">
                04
              </span>
              <span className="font-mono text-xs text-on-surface-variant uppercase">Phase 4</span>
            </div>
            <h4 className="font-bold text-on-surface text-base mb-2">Active Remediation Engine</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Executes non-destructive dry-runs in an isolated cluster sandbox, produces dynamic runbooks, and triggers autonomous remediation or interactive SRE approvals.
            </p>
            <div className="mt-6 pt-4 border-t border-outline-variant/20 flex flex-col gap-1.5 font-mono text-xs">
              <span className="text-on-surface-variant">Verification: <strong className="text-on-surface">Topology Safe</strong></span>
              <span className="text-on-surface-variant">Automated MTTR: <strong className="text-primary">&lt; 90s</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: "WHY MEMORY MATTERS" (Side-by-Side Comparison) */}
      <section className="w-full max-w-[1780px] mx-auto px-6 lg:px-12 py-20" id="comparison">
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high text-error font-mono text-xs font-semibold uppercase tracking-wider mb-3">
            Paradigm Shift
          </div>
          <h2 className="text-3xl sm:text-5xl text-on-surface font-bold tracking-tight max-w-3xl">
            Why Memory Changes Everything
          </h2>
          <p className="mt-4 text-base text-on-surface-variant max-w-2xl">
            Traditional incident management treats every failure like day one. ORYN treats every failure as an evolutionary leap forward.
          </p>
        </div>

        {/* Comparison Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Traditional */}
          <div className="rounded-2xl bg-surface-container-low border border-outline-variant/20 p-8 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-outline-variant/20">
                <span className="font-mono text-xs text-error uppercase font-bold tracking-widest">
                  Traditional Incident Response
                </span>
                <XCircle className="w-6 h-6 text-error" />
              </div>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <XCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-on-surface text-base">Panic in Slack War Rooms</h4>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">20+ engineers frantically guessing in disjointed channels while customers experience degradation.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <XCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-on-surface text-base">Tribal Knowledge Brain Drain</h4>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">When senior staff leave, the rationale behind critical cluster limits and recovery tricks disappears forever.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <XCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-on-surface text-base">Duplicate Outages Solved From Scratch</h4>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">The exact same database saturation triggers identical multi-hour debugging marathons quarter after quarter.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <XCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-on-surface text-base">Prolonged MTTR of 45+ Minutes</h4>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">Manual query inspection, slow rollback validation, and high blast-radius misconfigurations.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-outline-variant/20 flex items-center justify-between font-mono text-xs">
              <span className="text-on-surface-variant">Average Outage Duration</span>
              <span className="text-error font-bold">45 - 90 Minutes</span>
            </div>
          </div>

          {/* ORYN Memory-Driven Response */}
          <div className="rounded-2xl bg-surface-container border-2 border-primary/50 p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary-container/15 rounded-full blur-3xl -z-10" />
            <div>
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-primary/30">
                <span className="font-mono text-xs text-tertiary uppercase font-bold tracking-widest">
                  ORYN Memory-Driven Response
                </span>
                <CheckCircle2 className="w-6 h-6 text-tertiary" />
              </div>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-5 h-5 text-tertiary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-on-surface text-base">Instant Contextual Recall</h4>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">Within 10 seconds of alert fires, ORYN correlates the exact historical blueprint and root trigger.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-5 h-5 text-tertiary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-on-surface text-base">Institutional Memory Retained Forever</h4>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">Every resolved incident, pull request note, and runbook step is indexed into a persistent organizational brain.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-5 h-5 text-tertiary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-on-surface text-base">Automated Runbooks Ready Pre-Response</h4>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">Verified mitigation steps are staged and simulated before an on-call human even acknowledges the pager.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-5 h-5 text-tertiary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-on-surface text-base">Autonomous MTTR Under 90 Seconds</h4>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">Surgical connection draining, memory expansion, and canary fallback completed in sub-minute bounds.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-primary/20 flex items-center justify-between font-mono text-xs">
              <span className="text-on-surface-variant">Average Outage Duration</span>
              <span className="text-tertiary font-bold">&lt; 90 Seconds (Autonomous)</span>
            </div>
          </div>
        </div>

        {/* 4 Impact Numbers Display */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 shadow-sm flex flex-col items-center text-center">
            <span className="text-5xl font-bold text-primary tracking-tight">78%</span>
            <span className="mt-2 text-base font-semibold text-on-surface">Reduction in MTTR</span>
            <span className="mt-1 text-xs text-on-surface-variant">Measured across 1.4M enterprise incident cycles</span>
          </div>
          <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 shadow-sm flex flex-col items-center text-center">
            <span className="text-5xl font-bold text-secondary tracking-tight">94%</span>
            <span className="mt-2 text-base font-semibold text-on-surface">Recurrent Outage Elimination</span>
            <span className="mt-1 text-xs text-on-surface-variant">Repeated architectural failures trapped and mitigated</span>
          </div>
          <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 shadow-sm flex flex-col items-center text-center">
            <span className="text-5xl font-bold text-tertiary tracking-tight">$3.4M</span>
            <span className="mt-2 text-base font-semibold text-on-surface">Avg. Annual Downtime Savings</span>
            <span className="mt-1 text-xs text-on-surface-variant">Calculated per Fortune 500 infrastructure tier</span>
          </div>
          <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 shadow-sm flex flex-col items-center text-center">
            <span className="text-5xl font-bold text-primary tracking-tight">100%</span>
            <span className="mt-2 text-base font-semibold text-on-surface">Auto Post-Mortem Docs</span>
            <span className="mt-1 text-xs text-on-surface-variant">Comprehensive timeline generation without manual toil</span>
          </div>
        </div>
      </section>

      {/* SECTION 6: HIGH-CONVERSION BOTTOM CTA */}
      <section className="w-full max-w-[1780px] mx-auto px-6 lg:px-12 py-20 pb-28">
        <div className="relative w-full rounded-3xl bg-gradient-to-b from-surface-container-high via-surface-container to-surface-container-low p-8 md:p-16 lg:p-20 shadow-[0_32px_80px_rgba(0,0,0,0.8)] border border-outline-variant/30 overflow-hidden flex flex-col items-center text-center">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-primary-container/30 blur-[130px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-32 right-1/4 w-[500px] h-[250px] bg-secondary-container/20 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-highest text-primary font-mono text-xs font-semibold uppercase tracking-wider mb-6">
            Ready For Production Deployment
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl text-on-surface font-bold tracking-tight max-w-4xl leading-[1.12]">
            Transform Every Outage Into Enterprise Resilience
          </h2>

          <p className="mt-6 max-w-2xl text-base text-on-surface-variant leading-relaxed">
            Join modern engineering teams resolving SEV-1 incidents before users notice. Stop firefighting from scratch and power your SRE fleet with autonomous memory.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <NavLink
              to="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-primary-container to-secondary-container text-on-primary-container font-semibold shadow-[0_0_28px_rgba(79,70,229,0.5)] hover:shadow-[0_0_40px_rgba(79,70,229,0.7)] hover:scale-[1.02] active:scale-[0.98] transition-all text-sm"
            >
              <span>Deploy in 15 Minutes</span>
              <Rocket className="w-5 h-5" />
            </NavLink>
            <NavLink
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-surface-container-highest text-on-surface font-medium hover:bg-surface-bright shadow-sm transition-all text-sm border border-outline-variant/30"
            >
              <Calendar className="w-5 h-5 text-secondary" />
              <span>Sign In / Demo Access</span>
            </NavLink>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 font-mono text-xs text-on-surface-variant">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-tertiary" /> No agent installation required
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-tertiary" /> OpenTelemetry native
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-tertiary" /> SOC2 Type II Certified
            </span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/30 py-16">
        <div className="w-full max-w-[1780px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
            <div className="lg:col-span-2 flex flex-col gap-4 pr-6">
              <OrynLogo />
              <p className="text-xs text-on-surface-variant leading-relaxed max-w-sm">
                Every incident makes the next one easier to solve. Autonomous diagnostic intelligence and continuous telemetry memory for modern SRE teams.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="px-2.5 py-1 rounded bg-surface-container-high border border-outline-variant/30 font-mono text-[11px] text-on-surface-variant flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-tertiary" /> SOC2 Type II
                </span>
                <span className="px-2.5 py-1 rounded bg-surface-container-high border border-outline-variant/30 font-mono text-[11px] text-on-surface-variant flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-tertiary" /> ISO 27001
                </span>
                <span className="px-2.5 py-1 rounded bg-surface-container-high border border-outline-variant/30 font-mono text-[11px] text-on-surface-variant flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-secondary" /> 99.999% SLA
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 text-xs">
              <h3 className="font-mono text-[11px] text-on-surface-variant uppercase font-semibold">Platform</h3>
              <a href="#memory-engine" className="text-on-surface-variant hover:text-on-surface transition-colors">Memory Engine</a>
              <NavLink to="/dashboard" className="text-on-surface-variant hover:text-on-surface transition-colors">Incident Copilot</NavLink>
              <NavLink to="/runbooks" className="text-on-surface-variant hover:text-on-surface transition-colors">Runbook Generation</NavLink>
              <NavLink to="/postmortems" className="text-on-surface-variant hover:text-on-surface transition-colors">Post-Mortem AI</NavLink>
              <NavLink to="/reflection" className="text-on-surface-variant hover:text-on-surface transition-colors">Telemetry Graph</NavLink>
            </div>

            <div className="flex flex-col gap-2.5 text-xs">
              <h3 className="font-mono text-[11px] text-on-surface-variant uppercase font-semibold">Solutions</h3>
              <span className="text-on-surface-variant">Site Reliability Engineers</span>
              <span className="text-on-surface-variant">DevSecOps</span>
              <span className="text-on-surface-variant">Enterprise Cloud</span>
              <span className="text-on-surface-variant">Kubernetes Outages</span>
              <span className="text-on-surface-variant">Microservice Fleets</span>
            </div>

            <div className="flex flex-col gap-2.5 text-xs">
              <h3 className="font-mono text-[11px] text-on-surface-variant uppercase font-semibold">Resources</h3>
              <a href="https://github.com/google-labs-code/stitch-skills" target="_blank" rel="noreferrer" className="text-on-surface-variant hover:text-on-surface transition-colors">Documentation</a>
              <span className="text-on-surface-variant">API Reference</span>
              <span className="text-on-surface-variant">Architecture Whitepaper</span>
              <span className="text-on-surface-variant">SRE Playbooks</span>
              <span className="text-tertiary">System Status (Optimal)</span>
            </div>

            <div className="flex flex-col gap-2.5 text-xs">
              <h3 className="font-mono text-[11px] text-on-surface-variant uppercase font-semibold">Company</h3>
              <span className="text-on-surface-variant">About ORYN</span>
              <span className="text-on-surface-variant">Security Whitepaper</span>
              <span className="text-on-surface-variant">Customer Stories</span>
              <span className="text-on-surface-variant">Careers (We're Hiring)</span>
              <NavLink to="/login" className="text-primary hover:underline font-semibold">Sign In / Register</NavLink>
            </div>
          </div>

          <div className="pt-8 border-t border-outline-variant/20 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant">
            <span>© 2026 ORYN Technologies, Inc. All rights reserved.</span>
            <div className="flex items-center gap-6">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Security Disclosures</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/30 font-mono text-[11px] text-on-surface">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary" />
              </span>
              <span>All Systems Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
