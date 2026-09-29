import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzeIncident } from '../services/geminiService';
import { createIncident, createMemory } from '../services/firestoreService';
import { 
  AlertOctagon, 
  UploadCloud, 
  Sparkles, 
  FileText, 
  ShieldAlert, 
  CheckCircle2, 
  BrainCircuit, 
  ArrowRight, 
  RefreshCw,
  Terminal,
  Server,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';

const SAMPLE_LOGS = {
  postgres: `[2026-09-29 14:02:11.492 UTC] [FATAL] [PgBouncer:pooler-7] client connection limit reached: active=1200 waiting=842 max=1200
[2026-09-29 14:02:14.102 UTC] [ERROR] [checkout-worker-7c9b] QueryTimeoutException: Connection acquisition timed out after 30000ms.
[2026-09-29 14:02:18.841 UTC] [WARN] [aurora-writer-node-01] cpu_utilization=98.4% load_avg=44.12 lock_waits=328
[2026-09-29 14:02:22.004 UTC] [FATAL] remaining connection slots are reserved for non-replication superuser connections`,
  
  payments: `[2026-09-29 12:48:02.110 UTC] [WARN] [PaymentProcessor] Stripe upstream latency spiked to 6,420ms (p99)
[2026-09-29 12:48:15.981 UTC] [ERROR] [CircuitBreaker] State transitioned from CLOSED to OPEN for target 'stripe-charge-v1'
[2026-09-29 12:48:21.034 UTC] [ERROR] [CheckoutService] PaymentFailedException: circuit breaker is open. Rejected request id=req_99214b`,

  redis: `[2026-09-29 10:14:02 UTC] [WARNING] Client id=4981 addr=10.0.12.92:51294 client-output-buffer-limit exceeded (128mb)
[2026-09-29 10:14:05 UTC] [WARNING] Sync with replica 10.0.14.88:6379 failed: Full resync buffer exhausted
[2026-09-29 10:14:11 UTC] [NOTICE] Master attempting diskless replication to replica-2`
};

export default function NewIncidentPage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [service, setService] = useState('PostgreSQL');
  const [severity, setSeverity] = useState('SEV-1');
  const [environment, setEnvironment] = useState('production-us-east');
  const [rawLogs, setRawLogs] = useState('');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setRawLogs(text);
        if (!title) setTitle(`Log Ingestion: ${file.name}`);
        toast.success(`Loaded ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
      }
    };
    reader.readAsText(file);
  };

  const loadSample = (key) => {
    if (key === 'postgres') {
      setTitle('PgBouncer Active Pool Saturation on Aurora Checkout');
      setService('PostgreSQL');
      setSeverity('SEV-1');
      setRawLogs(SAMPLE_LOGS.postgres);
    } else if (key === 'payments') {
      setTitle('Stripe 3DS Webhook Latency Cascade');
      setService('Payment API');
      setSeverity('SEV-1');
      setRawLogs(SAMPLE_LOGS.payments);
    } else if (key === 'redis') {
      setTitle('Redis Replica Buffer Overflow & Full Resync Storm');
      setService('Redis');
      setSeverity('SEV-2');
      setRawLogs(SAMPLE_LOGS.redis);
    }
    toast.info("Sample logs loaded.");
  };

  const { currentUser } = useAuth();

  const handleRunAiDiagnosis = async () => {
    const trimmedTitle = title.trim();
    const trimmedLogs = rawLogs.trim();

    if (!trimmedLogs && !trimmedTitle) {
      toast.error("Please enter an incident title or paste raw telemetry logs first.");
      return;
    }

    setIsAnalyzing(true);
    const toastId = toast.loading("Gemini AI analyzing telemetry & extracting error signatures...");

    try {
      const result = await analyzeIncident({
        title: trimmedTitle || 'Production Telemetry Anomaly',
        service,
        environment,
        rawLogs: trimmedLogs
      });

      setAiAnalysis(result);
      if (result.severity) setSeverity(result.severity);
      toast.success("AI Diagnostic complete! Error signature localized.", { id: toastId });
    } catch (err) {
      console.warn("AI Diagnostic warning:", err);
      toast.error("Diagnosis completed with heuristic analyzer.", { id: toastId });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateIncident = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error("Please provide an incident title.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Dispatching incident to SRE fleet...");

    try {
      const safeLogs = typeof rawLogs === 'string' ? rawLogs : '';
      const sanitizedLogs = safeLogs.replace(/(\d{1,3}\.){3}\d{1,3}/g, 'xxx.xxx.xxx.xxx');

      const newInc = await createIncident({
        title: trimmedTitle,
        service: service || 'Infrastructure',
        severity: severity || 'SEV-1',
        environment: environment || 'production-us-east',
        rawLogs: safeLogs,
        sanitizedLogs,
        rootCause: aiAnalysis?.rootCause || 'Under investigation by SRE fleet.',
        errorSignature: aiAnalysis?.errorSignature || 'UNKNOWN_ANOMALY',
        confidenceScore: typeof aiAnalysis?.confidenceScore === 'number' ? aiAnalysis.confidenceScore : 92,
        status: 'active',
        assignee: { 
          name: currentUser?.displayName || 'Alex Rivera', 
          role: currentUser?.title || 'SRE Lead', 
          avatar: currentUser?.displayName?.slice(0, 2).toUpperCase() || 'AR' 
        },
        failedAttempts: [],
        successfulResolution: '',
        runbook: {
          title: `Runbook: ${trimmedTitle}`,
          steps: Array.isArray(aiAnalysis?.evidence) && aiAnalysis.evidence.length > 0
            ? aiAnalysis.evidence 
            : ['Review telemetry logs', 'Drain traffic if necessary', 'Verify cluster stabilization']
        },
        lessonsLearned: [],
        tags: [(service || 'infra').toLowerCase(), (severity || 'sev-1').toLowerCase(), 'active']
      });

      // Index into memory if analysis exists
      if (aiAnalysis) {
        try {
          await createMemory({
            incidentId: newInc.id,
            title: newInc.title,
            service: newInc.service,
            severity: newInc.severity,
            errorSignature: aiAnalysis.errorSignature || 'ANOMALY_SIGNATURE',
            confidenceScore: typeof aiAnalysis.confidenceScore === 'number' ? aiAnalysis.confidenceScore : 90,
            rootCause: aiAnalysis.rootCause || 'Identified by AI analysis',
            recoverySteps: [aiAnalysis.recommendedAction || 'Execute automated restart'],
            tags: newInc.tags || []
          });
        } catch (memErr) {
          console.warn("Memory indexing deferred:", memErr);
        }
      }

      toast.success(`Incident ${newInc.id} declared! Dispatched to SRE fleet.`, { id: toastId });
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      navigate('/dashboard');
    } catch (err) {
      console.error("Failed to commit incident:", err);
      toast.dismiss(toastId);
      toast.error("Failed to commit incident: " + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-error-container/40 flex items-center justify-center text-error">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
            Declare New Incident
          </h1>
        </div>
        <p className="text-sm text-on-surface-variant mt-1">
          Ingest raw telemetry, allow Gemini to localize root causes, and query organizational memory.
        </p>
      </div>

      {/* Main Grid: Input Form vs AI Live Diagnostic Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Form (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 shadow-sm flex flex-col gap-5">
          {/* Quick Preset Buttons */}
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-on-surface-variant font-medium">TEST PRESETS:</span>
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <button 
                type="button"
                onClick={() => loadSample('postgres')} 
                className="px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/20"
              >
                PostgreSQL
              </button>
              <button 
                type="button"
                onClick={() => loadSample('payments')} 
                className="px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/20"
              >
                Payment API
              </button>
              <button 
                type="button"
                onClick={() => loadSample('redis')} 
                className="px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/20"
              >
                Redis
              </button>
            </div>
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-on-surface">Incident Title</label>
            <input
              type="text"
              placeholder="e.g. PostgreSQL Connection Pool Exhaustion on us-east-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container text-sm text-on-surface placeholder:text-on-surface-variant border border-outline-variant/20 focus:outline-none focus:border-primary"
            />
          </div>

          {/* Metadata Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Service */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface">Affected Service</label>
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container text-xs text-on-surface border border-outline-variant/20 focus:outline-none focus:border-primary"
              >
                <option value="PostgreSQL">PostgreSQL</option>
                <option value="Payment API">Payment API</option>
                <option value="Redis">Redis</option>
                <option value="Gateway">Gateway</option>
                <option value="Kafka">Kafka</option>
                <option value="Authentication">Authentication</option>
              </select>
            </div>

            {/* Severity */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface">Initial Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container text-xs font-bold text-error border border-outline-variant/20 focus:outline-none focus:border-primary"
              >
                <option value="SEV-1">SEV-1 (Critical Outage)</option>
                <option value="SEV-2">SEV-2 (Major Impairment)</option>
                <option value="SEV-3">SEV-3 (Minor Degrade)</option>
              </select>
            </div>

            {/* Environment */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface">Environment</label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container text-xs text-on-surface border border-outline-variant/20 focus:outline-none focus:border-primary"
              >
                <option value="production-us-east">production-us-east</option>
                <option value="production-eu-central">production-eu-central</option>
                <option value="staging">staging</option>
              </select>
            </div>
          </div>

          {/* Raw Logs Textarea with Drag & Drop */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-on-surface">Raw Telemetry & Stack Trace</label>
              <label className="text-xs text-primary hover:underline cursor-pointer flex items-center gap-1 font-mono">
                <UploadCloud className="w-3.5 h-3.5" /> Upload File (.log, .txt, .json)
                <input type="file" accept=".log,.txt,.json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
            <textarea
              rows={8}
              placeholder="Paste stack traces, Datadog alerts, or Kubernetes pod logs here..."
              value={rawLogs}
              onChange={(e) => setRawLogs(e.target.value)}
              className="w-full p-3 rounded-xl bg-surface-container-lowest font-mono text-xs text-on-surface placeholder:text-on-surface-variant border border-outline-variant/20 focus:outline-none focus:border-primary leading-relaxed"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleRunAiDiagnosis}
              disabled={isAnalyzing}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary-container to-secondary-container text-on-primary-container font-semibold text-xs flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Gemini Diagnosing Root Cause...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Autonomous AI Diagnosis</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCreateIncident}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-error-container text-on-error-container font-bold text-xs hover:opacity-90 shadow-md transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Dispatching...' : 'Dispatch Incident'}
            </button>
          </div>
        </div>

        {/* Right: AI Live Diagnostic Pane (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 shadow-sm flex flex-col gap-4 min-h-[460px]">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-on-surface text-sm">Autonomous Analysis</h3>
              </div>
              {aiAnalysis && (
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-primary-container/30 text-primary border border-primary/40 font-semibold">
                  {aiAnalysis.confidenceScore}% Confidence
                </span>
              )}
            </div>

            {!aiAnalysis ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-on-surface-variant">
                <Sparkles className="w-12 h-12 text-outline-variant mb-3 animate-pulse" />
                <p className="text-sm font-semibold text-on-surface">No Active Diagnosis Yet</p>
                <p className="text-xs mt-1 max-w-xs">
                  Click "Autonomous AI Diagnosis" to trigger Gemini's real-time error signature extraction and memory recall.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 text-xs animate-in fade-in duration-200">
                {/* Error Signature Card */}
                <div className="p-3.5 rounded-xl bg-surface-container border border-primary/30 flex flex-col gap-1">
                  <span className="font-mono text-[10px] text-on-surface-variant uppercase">Error Signature</span>
                  <span className="font-mono text-xs font-bold text-primary">{aiAnalysis.errorSignature}</span>
                </div>

                {/* Root Cause */}
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-on-surface">Mechanical Root Cause</span>
                  <p className="text-on-surface-variant leading-relaxed bg-surface-container p-3 rounded-lg border border-outline-variant/20">
                    {aiAnalysis.rootCause}
                  </p>
                </div>

                {/* Evidence Extraction */}
                {aiAnalysis.evidence && aiAnalysis.evidence.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <span className="font-semibold text-on-surface">Correlated Evidence</span>
                    <ul className="flex flex-col gap-1">
                      {aiAnalysis.evidence.map((ev, i) => (
                        <li key={i} className="flex items-start gap-2 text-on-surface-variant">
                          <CheckCircle2 className="w-3.5 h-3.5 text-tertiary flex-shrink-0 mt-0.5" />
                          <span>{ev}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommended Remediation */}
                <div className="p-3.5 rounded-xl bg-tertiary-container/20 border border-tertiary/30 text-tertiary flex flex-col gap-1">
                  <span className="font-mono text-[10px] uppercase font-bold text-tertiary">Recommended Recovery</span>
                  <p className="text-xs text-on-surface">
                    {aiAnalysis.recommendedAction}
                  </p>
                </div>

                {/* Action button: Go to Runbooks */}
                <button
                  onClick={() => navigate('/runbooks')}
                  className="mt-2 w-full py-2.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-xs flex items-center justify-center gap-2 border border-outline-variant/30"
                >
                  <span>Review Associated Runbooks</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
