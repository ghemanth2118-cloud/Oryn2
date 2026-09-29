import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar 
} from 'recharts';
import { 
  getIncidents, 
  subscribeIncidents, 
  getMemories, 
  getServiceHealth, 
  getDeployments, 
  createIncident,
  updateIncident 
} from '../services/firestoreService';
import { 
  AlertOctagon, 
  CheckCircle2, 
  Clock, 
  BrainCircuit, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download, 
  Play, 
  Search, 
  Filter, 
  ExternalLink,
  ChevronRight,
  TrendingDown,
  Sparkles,
  Server,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

const CHART_DATA = [
  { day: 'Mon', sev1: 1, sev2: 3, sev3: 4, mttr: 28 },
  { day: 'Tue', sev1: 0, sev2: 2, sev3: 3, mttr: 22 },
  { day: 'Wed', sev1: 2, sev2: 4, sev3: 2, mttr: 25 },
  { day: 'Thu', sev1: 1, sev2: 1, sev3: 5, mttr: 19 },
  { day: 'Fri', sev1: 0, sev2: 2, sev3: 2, mttr: 16 },
  { day: 'Sat', sev1: 1, sev2: 0, sev3: 1, mttr: 14 },
  { day: 'Sun', sev1: 1, sev2: 2, sev3: 2, mttr: 18 },
];

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [memories, setMemories] = useState([]);
  const [services, setServices] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [timeFilter, setTimeFilter] = useState('weekly');
  const [searchFilter, setSearchFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    async function loadData() {
      try {
        const [inc, mem, svc, dep] = await Promise.all([
          getIncidents(),
          getMemories(),
          getServiceHealth(),
          getDeployments()
        ]);
        setIncidents(inc);
        setMemories(mem);
        setServices(svc);
        setDeployments(dep);
      } catch (e) {
        console.error("Dashboard data load error:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Subscribe to live incident updates
    const unsubscribe = subscribeIncidents((updated) => {
      setIncidents(updated);
    });

    return () => unsubscribe();
  }, []);

  // Filtered incidents
  const filteredIncidents = incidents.filter(inc => {
    const matchesSearch = inc.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          inc.service.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          inc.id.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesSev = severityFilter === 'ALL' || inc.severity === severityFilter;
    return matchesSearch && matchesSev;
  });

  const activeIncidentsCount = incidents.filter(i => i.status === 'active' || i.status === 'investigating').length;
  const criticalServicesCount = services.filter(s => s.status === 'critical' || s.status === 'degraded').length;

  const handleSimulateIncident = async () => {
    toast.loading("Simulating synthetic production outage in PostgreSQL...");
    setTimeout(async () => {
      const simulated = await createIncident({
        title: 'PgBouncer Connection Ceiling Saturation (Synthetic Alert)',
        service: 'PostgreSQL',
        severity: 'SEV-1',
        environment: 'production-us-east',
        errorSignature: 'PG_CONN_POOL_EXHAUSTION_TIMEOUT',
        confidenceScore: 97,
        assignee: { name: 'Alex Rivera', role: 'SRE Lead', avatar: 'AR' },
        rawLogs: `[FATAL] client connection limit reached: active=1200 max=1200\n[ERROR] Worker query acquisition timed out.`,
        sanitizedLogs: `[FATAL] client connection limit reached: active=1200 max=1200`,
        rootCause: 'Synthetic load injector simulated black swan thread contention.',
        failedAttempts: ['Direct worker reload without isolation.'],
        successfulResolution: 'Reclaim idle connection slots with admin socket command.',
        runbook: {
          title: 'PostgreSQL Pool Ceiling Recovery',
          steps: ['Check active connections', 'Execute admin socket kill', 'Verify latency stabilization']
        },
        lessonsLearned: ['Automated synthetic drill completed successfully.'],
        tags: ['postgres', 'simulated', 'sev-1']
      });
      toast.dismiss();
      toast.error("SEV-1 ALERT: New simulated incident triggered! Ingested into dashboard.");
    }, 1000);
  };

  const handleResolveIncident = async (id) => {
    await updateIncident(id, { status: 'resolved', resolvedAt: new Date().toISOString() });
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    toast.success(`Incident ${id} marked RESOLVED! Telemetry restored.`);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Breadcrumb & Live Ingestion Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 font-mono text-on-surface-variant">
          <span className="hover:text-on-surface cursor-pointer">FLEET OBSERVABILITY</span>
          <ChevronRight className="w-3.5 h-3.5 text-outline-variant" />
          <span className="text-primary font-semibold">PRODUCTION US-EAST</span>
          <ChevronRight className="w-3.5 h-3.5 text-outline-variant" />
          <span className="text-on-surface font-semibold">INCIDENT CONTROL DECK</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <NavLink
            to="/login"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-xs font-mono text-on-surface-variant hover:text-primary transition-all shadow-sm"
            title="Click to Switch Account or Sign In"
          >
            <KeyRound className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Session:</span>
            <span className="font-semibold text-on-surface">{currentUser?.displayName || 'Alex Rivera'}</span>
            <span className="px-1.5 py-0.2 rounded bg-primary-container text-on-primary-container text-[10px] uppercase font-bold">
              {currentUser?.role || 'ADMIN'}
            </span>
            <span className="text-primary underline text-[10px] ml-0.5">Switch</span>
          </NavLink>

          <div className="flex items-center gap-2.5 bg-surface-container px-3 py-1 rounded-full border border-outline-variant/20 shadow-sm font-mono text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary"></span>
            </span>
            <span className="text-on-surface">
              Global Ingestion: <strong className="text-tertiary">42.8k events/sec</strong>
            </span>
            <span className="text-outline-variant">•</span>
            <span className="text-on-surface-variant">Sync: live</span>
          </div>
        </div>
      </div>

      {/* Header Section */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-3">
            {activeIncidentsCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-error animate-ping"></span>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
              Incident Dashboard
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-mono text-xs font-semibold border border-outline-variant/30">
              v2.4.9 · LIVE
            </span>
          </div>
          <p className="text-sm text-on-surface-variant mt-1">
            Monitor production health, analyze outages, and leverage organizational memory.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Filter Segmented Control */}
          <div className="flex items-center p-1 rounded-lg bg-surface-container border border-outline-variant/20">
            <button
              onClick={() => setTimeFilter('today')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                timeFilter === 'today' ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeFilter('weekly')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                timeFilter === 'weekly' ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setTimeFilter('monthly')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                timeFilter === 'monthly' ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Monthly
            </button>
          </div>

          {/* Action: Login / Account Portal */}
          <NavLink
            to="/login"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-all border border-outline-variant/30 shadow-sm hover:border-primary/40"
            title="Open Authentication & Account Portal"
          >
            <KeyRound className="w-3.5 h-3.5 text-primary" />
            <span>Login / Account</span>
          </NavLink>

          {/* Action: Simulate Incident */}
          <button
            onClick={handleSimulateIncident}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium transition-all border border-outline-variant/30 shadow-sm"
          >
            <Play className="w-3.5 h-3.5 text-secondary fill-secondary" />
            <span>Simulate Incident</span>
          </button>

          {/* Action: Trigger Incident */}
          <NavLink
            to="/new-incident"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-error-container text-on-error-container hover:opacity-90 font-semibold text-xs transition-all shadow-md"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>Trigger Incident</span>
          </NavLink>
        </div>
      </header>

      {/* SRE Authentication & Session Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 px-4 rounded-xl bg-gradient-to-r from-primary-container/15 via-surface-container-low to-secondary-container/10 border border-primary/20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-container/40 flex items-center justify-center text-primary flex-shrink-0">
            <KeyRound className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <div className="font-semibold text-on-surface flex items-center gap-2">
              <span>SRE Incident Response Workspace</span>
              <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-primary font-mono text-[10px] font-bold">
                {currentUser?.email || 'alex.rivera@oryn.internal'}
              </span>
            </div>
            <p className="text-on-surface-variant text-[11px] mt-0.5">
              Active clearance: <strong className="text-primary uppercase font-mono">{currentUser?.role || 'ADMIN'}</strong>. Need to sign into a custom team workspace or test Firebase RBAC?
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
          <NavLink
            to="/login"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary font-semibold text-xs shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <span>Open Login Portal</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>
      </div>

      {/* KPI Cards Grid (4 items) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* 1. Active Incidents */}
        <div className="relative overflow-hidden rounded-xl bg-surface-container-low border border-outline-variant/20 p-5 flex flex-col justify-between shadow-sm">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-error"></div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs uppercase text-on-surface-variant tracking-wider font-semibold">
              Active Incidents
            </span>
            <div className="w-8 h-8 rounded-lg bg-error-container/40 flex items-center justify-center text-error">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-3xl font-bold text-on-surface">{activeIncidentsCount}</span>
            <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-tertiary-container/30 text-on-tertiary-container font-mono text-[11px] font-semibold">
              <TrendingDown className="w-3.5 h-3.5" /> 12% vs last week
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-outline-variant/10 text-on-surface-variant text-xs flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
            <span>{activeIncidentsCount > 0 ? `${activeIncidentsCount} active alerts requiring SRE action` : 'All systems operating within SLO'}</span>
          </div>
        </div>

        {/* 2. Critical Services */}
        <div className="relative overflow-hidden rounded-xl bg-surface-container-low border border-outline-variant/20 p-5 flex flex-col justify-between shadow-sm">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary"></div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs uppercase text-on-surface-variant tracking-wider font-semibold">
              Degraded Services
            </span>
            <div className="w-8 h-8 rounded-lg bg-secondary-container/30 flex items-center justify-center text-secondary">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-3xl font-bold text-on-surface">{criticalServicesCount}</span>
            <span className="text-on-surface-variant font-mono text-xs">of 48 monitored</span>
          </div>
          <div className="mt-3 pt-2 border-t border-outline-variant/10 flex flex-wrap gap-1 font-mono text-[10px]">
            <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface border border-outline-variant/20">PostgreSQL</span>
            <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface border border-outline-variant/20">Payment API</span>
            <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface border border-outline-variant/20">Redis</span>
          </div>
        </div>

        {/* 3. Average MTTR */}
        <div className="relative overflow-hidden rounded-xl bg-surface-container-low border border-outline-variant/20 p-5 flex flex-col justify-between shadow-sm">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-tertiary"></div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs uppercase text-on-surface-variant tracking-wider font-semibold">
              Average MTTR
            </span>
            <div className="w-8 h-8 rounded-lg bg-tertiary-container/30 flex items-center justify-center text-tertiary">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-3xl font-bold text-on-surface">18 min</span>
            <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-tertiary-container/30 text-on-tertiary-container font-mono text-[11px] font-semibold">
              <TrendingDown className="w-3.5 h-3.5" /> 23% faster
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-outline-variant/10 text-on-surface-variant text-xs flex items-center justify-between">
            <span>Target SLA: &lt; 30 min</span>
            <span className="text-tertiary font-mono text-xs font-semibold">P95: 24m</span>
          </div>
        </div>

        {/* 4. Memories Recalled */}
        <div className="relative overflow-hidden rounded-xl bg-surface-container-low border border-outline-variant/20 p-5 flex flex-col justify-between shadow-sm">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs uppercase text-on-surface-variant tracking-wider font-semibold">
              Memories Recalled
            </span>
            <div className="w-8 h-8 rounded-lg bg-primary-container/40 flex items-center justify-center text-primary">
              <BrainCircuit className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-3xl font-bold text-on-surface">{memories.length * 12 + 28}</span>
            <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-primary-container/30 text-primary font-mono text-[11px] font-semibold border border-primary/30">
              96.4% match
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-outline-variant/10 text-on-surface-variant text-xs flex items-center justify-between">
            <span>Autonomous Playbooks</span>
            <span className="text-primary font-mono text-xs font-semibold">0 repeat SEVs</span>
          </div>
        </div>
      </div>

      {/* CHARTS SECTION: Telemetry Ingestion & Resolution Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Resolution Trends Area Chart (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 shadow-sm flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-bold text-on-surface text-base">Outage & MTTR Telemetry Trend</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Daily severity breakdown and resolution duration (minutes)
              </p>
            </div>
            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary"></span> MTTR (min)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-error"></span> SEV-1</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-secondary"></span> SEV-2</span>
            </div>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMttr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#918fa1" fontSize={11} tickLine={false} />
                <YAxis stroke="#918fa1" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e1f25', 
                    borderColor: '#464555', 
                    borderRadius: '8px', 
                    fontSize: '12px',
                    color: '#e3e1e9' 
                  }} 
                />
                <Area type="monotone" dataKey="mttr" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorMttr)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Fleet Health Status Grid (4 cols) */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-on-surface text-base">Service Fleet Health</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">Live latency & error rates</p>
            </div>
            <span className="font-mono text-xs text-tertiary">99.88% SLA</span>
          </div>

          <div className="flex flex-col gap-2.5 overflow-y-auto max-h-64 pr-1">
            {services.map(svc => (
              <div 
                key={svc.id}
                className="p-3 rounded-xl bg-surface-container border border-outline-variant/20 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${
                    svc.status === 'critical' ? 'bg-error animate-ping' :
                    svc.status === 'degraded' ? 'bg-secondary' : 'bg-tertiary'
                  }`} />
                  <div>
                    <span className="font-semibold text-on-surface block">{svc.name}</span>
                    <span className="font-mono text-[10px] text-on-surface-variant">{svc.cluster}</span>
                  </div>
                </div>

                <div className="text-right font-mono text-xs">
                  <span className={svc.status === 'critical' ? 'text-error font-bold' : 'text-on-surface'}>
                    {svc.latency}
                  </span>
                  <span className="block text-[10px] text-on-surface-variant">err: {svc.errorRate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ACTIVE & RECENT INCIDENTS TABLE */}
      <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 shadow-sm flex flex-col gap-4">
        {/* Table Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-on-surface text-lg">Production Incidents</h3>
            <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-mono text-xs">
              {filteredIncidents.length} Records
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Box */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Filter by title, service, ID..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface-container text-xs text-on-surface placeholder:text-on-surface-variant border border-outline-variant/20 focus:outline-none focus:border-primary"
              />
            </div>

            {/* Severity Pill Selector */}
            <div className="flex items-center bg-surface-container p-1 rounded-lg border border-outline-variant/20 text-xs">
              {['ALL', 'SEV-1', 'SEV-2', 'SEV-3'].map(sev => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2.5 py-1 rounded font-mono text-[11px] font-semibold transition-all ${
                    severityFilter === sev 
                      ? 'bg-primary text-on-primary' 
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Incidents Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-outline-variant/20 font-mono text-[11px] uppercase text-on-surface-variant">
              <tr>
                <th className="pb-3 font-semibold">Incident</th>
                <th className="pb-3 font-semibold">Service</th>
                <th className="pb-3 font-semibold">Severity</th>
                <th className="pb-3 font-semibold">Confidence</th>
                <th className="pb-3 font-semibold">Duration</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {filteredIncidents.slice(0, 10).map((inc) => (
                <tr key={inc.id} className="hover:bg-surface-container/60 transition-colors">
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-primary">{inc.id}</span>
                      <span className="font-medium text-on-surface hover:text-primary transition-colors cursor-pointer" onClick={() => navigate(`/memory`)}>
                        {inc.title}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 pr-4 font-mono">{inc.service}</td>
                  <td className="py-3.5 pr-4">
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                      inc.severity === 'SEV-1' ? 'bg-error-container text-on-error-container' :
                      inc.severity === 'SEV-2' ? 'bg-secondary-container/40 text-secondary' :
                      'bg-surface-container-highest text-on-surface-variant'
                    }`}>
                      {inc.severity}
                    </span>
                  </td>
                  <td className="py-3.5 pr-4 font-mono text-tertiary">
                    {inc.confidenceScore}%
                  </td>
                  <td className="py-3.5 pr-4 font-mono text-on-surface-variant">
                    {inc.durationMinutes}m
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                      inc.status === 'resolved' ? 'bg-tertiary-container/30 text-on-tertiary-container' :
                      inc.status === 'investigating' ? 'bg-secondary-container/30 text-secondary' :
                      'bg-error-container/40 text-error'
                    }`}>
                      {inc.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <NavLink
                        to="/runbooks"
                        className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface text-[11px] font-medium border border-outline-variant/20 transition-all"
                      >
                        Runbook
                      </NavLink>
                      {inc.status !== 'resolved' ? (
                        <button
                          onClick={() => handleResolveIncident(inc.id)}
                          className="px-2.5 py-1 rounded bg-tertiary-container text-on-tertiary-container text-[11px] font-semibold hover:opacity-90 transition-all"
                        >
                          Resolve
                        </button>
                      ) : (
                        <NavLink
                          to="/postmortems"
                          className="px-2.5 py-1 rounded bg-surface-container-highest text-on-surface-variant text-[11px] font-medium hover:text-on-surface"
                        >
                          Postmortem
                        </NavLink>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
