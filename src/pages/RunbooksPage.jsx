import React, { useState, useEffect } from 'react';
import { getRunbooks, createRunbook, deleteRunbook } from '../services/firestoreService';
import { generateRunbook } from '../services/geminiService';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { 
  BookOpenCheck, 
  Download, 
  CheckCircle2, 
  Play, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  Terminal, 
  Copy, 
  Check, 
  Plus, 
  FileText, 
  AlertTriangle, 
  Search, 
  User, 
  Users, 
  Tag, 
  Shield, 
  RotateCcw,
  Trash2,
  ListPlus,
  BookmarkPlus,
  CopyPlus
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

const PRESET_TEMPLATES = [
  {
    name: 'PostgreSQL Connection Starvation & Pool Flush',
    service: 'PostgreSQL',
    severity: 'SEV-1',
    duration: '6 mins',
    steps: [
      { title: 'Inspect Active PgBouncer Pool Slots', cmd: 'psql -h pgbouncer-vip -p 6432 -U pgbouncer -c "SHOW POOLS;"', desc: 'Verify if active connections == max_client_conn' },
      { title: 'Terminate Leaked Idle Client Threads', cmd: 'psql -h rds-master -U admin -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = \'idle in transaction\' AND now() - state_change > interval \'30 seconds\';"', desc: 'Reclaims frozen connections instantly without killing active queries' },
      { title: 'Validate Connection Headroom', cmd: 'curl -s https://metrics.internal/v1/db/connections | jq .utilization_percent', desc: 'Ensures pool saturation normalizes < 70%' }
    ],
    checklist: [
      'Active connections drop below 75% capacity',
      'Read replica streaming lag is < 5MB',
      'P99 query latency stabilizes < 120ms'
    ]
  },
  {
    name: 'Envoy Edge Gateway Upstream Circuit Breaker Reset',
    service: 'Gateway',
    severity: 'SEV-1',
    duration: '5 mins',
    steps: [
      { title: 'Check Upstream Cluster Ejection Count', cmd: 'curl -s http://envoy-admin.internal:9901/clusters | grep "outlier_detection.ejections_enforced"', desc: 'Locates impaired upstream cluster instances' },
      { title: 'Emergency Shunt to Healthy Zone', cmd: 'kubectl patch destinationrule api-gateway-dr -n networking --type merge -p \'{"spec":{"trafficPolicy":{"loadBalancer":{"simple":"ROUND_ROBIN"}}}}\'', desc: 'Rebalances traffic across all ready zone endpoints' },
      { title: 'Reset Envoy Outlier State', cmd: 'curl -X POST http://envoy-admin.internal:9901/reset_counters', desc: 'Transitions circuit breakers from OPEN to HALF-OPEN' }
    ],
    checklist: [
      'HTTP 503 response rate drops to 0.00%',
      'Ingress CPU utilization stabilizes < 60%',
      'Active endpoints in Ready state across all nodes'
    ]
  },
  {
    name: 'Kafka Consumer Partition Backpressure & Lag Drain',
    service: 'Kafka',
    severity: 'SEV-2',
    duration: '8 mins',
    steps: [
      { title: 'Inspect Lag Across Consumer Partitions', cmd: 'kafka-consumer-groups --bootstrap-server kafka.internal:9092 --describe --group payments-processor', desc: 'Identifies stalled worker partitions' },
      { title: 'Scale Kubernetes Worker Pod Concurrency', cmd: 'kubectl scale deployment/payment-consumer -n streaming --replicas=16', desc: 'Doubles ingestion processing rate' },
      { title: 'Monitor Backlog Drain Velocity', cmd: 'watch -n 3 "kafka-consumer-groups --bootstrap-server kafka.internal:9092 --describe --group payments-processor | awk \'{sum+=\\$6} END {print \\"Total Lag:\\", sum}\'"', desc: 'Ensures queue empties cleanly' }
    ],
    checklist: [
      'Partition assignment balanced across all 16 pods',
      'Commit latency stabilizes < 35ms',
      '0 messages in dead-letter overflow'
    ]
  },
  {
    name: 'Redis Cache Cluster Replica Buffer Storm Mitigation',
    service: 'Redis',
    severity: 'SEV-2',
    duration: '6 mins',
    steps: [
      { title: 'Expand Client Output Buffer Limit', cmd: 'redis-cli -h redis-master.internal CONFIG SET client-output-buffer-limit "replica 536870912 268435456 120"', desc: 'Prevents replica disconnects during resync' },
      { title: 'Enable Diskless Streaming Replication', cmd: 'redis-cli -h redis-master.internal CONFIG SET repl-diskless-sync yes', desc: 'Streams RDB data straight into replica network sockets' },
      { title: 'Verify Sync Offset Convergence', cmd: 'redis-cli -h redis-replica.internal INFO replication | grep master_repl_offset', desc: 'Verifies offset convergence to 0' }
    ],
    checklist: [
      'Master memory usage is stable < 80%',
      'Replica round-trip latency returns to < 2ms',
      'Persistence backup background job finishes cleanly'
    ]
  },
  {
    name: 'Kubernetes Pod OOMKilled & Memory Limit Surge Recovery',
    service: 'Kubernetes Fleet',
    severity: 'SEV-1',
    duration: '5 mins',
    steps: [
      { title: 'Filter OOMKilled Container Failures', cmd: 'kubectl get pods -A -o jsonpath=\'{range .items[*]}{.metadata.name}{"\\t"}{.status.containerStatuses[*].lastState.terminated.reason}{"\\n"}{end}\' | grep OOMKilled', desc: 'Pinpoints specific worker pods hitting kernel cgroup memory ceiling' },
      { title: 'Expand Container Memory Ceiling via Patch', cmd: 'kubectl patch deployment api-worker -n core --patch \'{"spec":{"template":{"spec":{"containers":[{"name":"worker","resources":{"limits":{"memory":"4Gi"},"requests":{"memory":"2Gi"}}}]}}}}\'', desc: 'Doubles memory limits to absorb unexpected payload spikes' },
      { title: 'Verify Pod Rollout and Probe Health', cmd: 'kubectl rollout status deployment/api-worker -n core --timeout=60s', desc: 'Ensures all replica pods pass liveness and readiness checks' }
    ],
    checklist: [
      'Container memory utilization drops < 70%',
      'Pod restart counter ceases incrementing',
      'Zero 504 gateway timeout responses in logs'
    ]
  },
  {
    name: 'Istio Service Mesh Strict mTLS Certificate Renewal',
    service: 'Security & Ingress',
    severity: 'SEV-1',
    duration: '4 mins',
    steps: [
      { title: 'Inspect Envoy Sidecar Sync Status and Cert Expiry', cmd: 'istioctl proxy-status | grep -v SYNCED', desc: 'Flags proxies whose mTLS certificates failed auto-rotation' },
      { title: 'Drain and Restart Istio Control Plane (istiod)', cmd: 'kubectl rollout restart deployment/istiod -n istio-system', desc: 'Triggers fresh CA certificate distribution across mesh' },
      { title: 'Restart Ingress Gateway Sidecars', cmd: 'kubectl rollout restart deployment/istio-ingressgateway -n istio-system', desc: 'Refreshes edge TLS termination sockets' }
    ],
    checklist: [
      'All proxy endpoints show status SYNCED',
      'Internal service-to-service 503 errors drop to zero',
      'Valid TLS handshake verified with openssl s_client'
    ]
  }
];

const INITIAL_SEED_IDS = new Set([
  'rb-pg-pool', 'rb-auth-token', 'rb-k8s-crashloop', 'rb-waf-ratelimit',
  'rb-kafka-lag', 'rb-ebs-iops', 'rb-vault-token', 'rb-dns-propagation',
  'rb-redis-buffer', 'rb-payment-gateway', 'rb-argo-pipeline', 'rb-waf-redo',
  'rb-es-shard', 'rb-istio-mtls', 'rb-rabbitmq-deadlock', 'rb-s3-replication'
]);

export default function RunbooksPage() {
  const { currentUser } = useAuth();
  const [runbooks, setRunbooks] = useState([]);
  const [activeRunbook, setActiveRunbook] = useState(null);
  const [completedSteps, setCompletedSteps] = useState({});
  const [copiedCmd, setCopiedCmd] = useState(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // Filters & Search
  const [authorFilter, setAuthorFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Custom Playbook Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newService, setNewService] = useState('PostgreSQL');
  const [newAuthorId, setNewAuthorId] = useState('current');
  const [newSeverity, setNewSeverity] = useState('SEV-1');
  const [newDuration, setNewDuration] = useState('6 mins');
  const [newSteps, setNewSteps] = useState([
    { title: 'Check System Telemetry Metrics', cmd: 'curl -s https://metrics.internal/health', desc: 'Verify baseline telemetry and current error rates' },
    { title: 'Execute Remediation Command', cmd: 'kubectl rollout restart deployment/service -n prod', desc: 'Apply target fix to restore healthy state' }
  ]);
  const [newChecklist, setNewChecklist] = useState([
    'Error rate normalizes < 0.01%',
    'P99 latency drops below SLA ceiling'
  ]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getRunbooks();
      setRunbooks(data || []);
      if (data && data.length > 0) setActiveRunbook(data[0]);
    }
    load();

    const handleUpdate = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setRunbooks(e.detail);
      }
    };
    window.addEventListener('oryn_runbooks_updated', handleUpdate);
    return () => window.removeEventListener('oryn_runbooks_updated', handleUpdate);
  }, []);

  const filteredRunbooks = React.useMemo(() => {
    return runbooks.filter((rb) => {
      // Author filter
      if (authorFilter !== 'all') {
        const authorLower = (rb.author || '').toLowerCase();
        if (authorFilter === 'alex' && !authorLower.includes('alex')) return false;
        if (authorFilter === 'elena' && !authorLower.includes('elena')) return false;
        if (authorFilter === 'marcus' && !authorLower.includes('marcus')) return false;
        if (authorFilter === 'sarah' && !authorLower.includes('sarah')) return false;
        if (authorFilter === 'david' && !authorLower.includes('david')) return false;
        if (authorFilter === 'rachel' && !authorLower.includes('rachel')) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (rb.title || '').toLowerCase().includes(q);
        const matchesService = (rb.service || '').toLowerCase().includes(q);
        const matchesAuthor = (rb.author || '').toLowerCase().includes(q);
        const matchesSteps = (rb.steps || []).some(s => 
          (s.title || '').toLowerCase().includes(q) || 
          (s.cmd || s.command || '').toLowerCase().includes(q)
        );
        const matchesTags = (rb.tags || []).some(t => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesService && !matchesAuthor && !matchesSteps && !matchesTags) return false;
      }

      return true;
    });
  }, [runbooks, authorFilter, searchQuery]);

  // Keep active runbook in sync
  useEffect(() => {
    if (filteredRunbooks.length > 0) {
      if (!activeRunbook || !filteredRunbooks.some(r => r.id === activeRunbook.id)) {
        setActiveRunbook(filteredRunbooks[0]);
        setCompletedSteps({});
      }
    } else {
      setActiveRunbook(null);
    }
  }, [filteredRunbooks]);

  const toggleStep = (stepId) => {
    setCompletedSteps(prev => {
      const next = { ...prev, [stepId]: !prev[stepId] };
      const allDone = activeRunbook?.steps?.every(s => next[s.id || s.step]);
      if (allDone) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        toast.success("All remediation steps verified! Telemetry restored.");
      }
      return next;
    });
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    toast.success("Command copied to clipboard");
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleExportPDF = () => {
    if (!activeRunbook) return;
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFillColor(24, 27, 38);
      doc.rect(0, 0, 210, 38, 'F');
      
      doc.setTextColor(195, 192, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("ORYN SRE RECOVERY PLAYBOOK", 14, 16);
      
      doc.setFontSize(9);
      doc.setTextColor(200, 200, 210);
      doc.text(`SERVICE: ${activeRunbook.service.toUpperCase()} | VER: ${activeRunbook.version || 'v2.0'} | GENERATED: ${new Date().toLocaleDateString()}`, 14, 25);
      doc.text(`AUTHOR: ${activeRunbook.author || 'SRE Platform Team'} (${activeRunbook.authorRole || 'Lead'}) | CONTACT: ${activeRunbook.authorEmail || 'sre@oryn.internal'}`, 14, 32);

      // Title & Overview
      doc.setTextColor(30, 30, 40);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text(activeRunbook.title, 14, 48);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Estimated Duration: ${activeRunbook.estimatedDuration || '10 mins'} | Success Rate: ${activeRunbook.successRate || '99%'} | Executions: ${activeRunbook.executionCount || 20}`, 14, 56);

      // Steps Table
      const tableData = (activeRunbook.steps || []).map((s, idx) => [
        `Step ${idx + 1}`,
        s.title || s.name,
        s.cmd || s.command || 'N/A',
        s.desc || s.description || 'Verified remediation step'
      ]);

      doc.autoTable({
        startY: 64,
        head: [['#', 'Action', 'Command', 'Description']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
          2: { font: 'courier' }
        }
      });

      // Verification Checklist
      const finalY = doc.lastAutoTable.finalY + 12;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Validation & Verification Checklist:", 14, finalY);

      const checklistItems = activeRunbook.checklist || [
        "Verify error rate drops < 0.01%",
        "Ensure p99 latency stabilizes < 180ms"
      ];

      checklistItems.forEach((item, index) => {
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(`[ ] ${item}`, 18, finalY + 7 + (index * 6));
      });

      doc.save(`ORYN_Runbook_${activeRunbook.service}_${Date.now()}.pdf`);
      toast.success("Audit-ready PDF runbook exported successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF: " + err.message);
    }
  };

  const handleSynthesizeRunbook = async () => {
    setIsSynthesizing(true);
    toast.loading("Gemini AI synthesizing autonomous runbook...");
    try {
      const authorName = currentUser?.displayName ? `${currentUser.displayName} (AI Assisted)` : "Alex Rivera (AI Assisted)";
      const authorEmail = currentUser?.email || "alex.rivera@oryn.internal";
      const authorRole = currentUser?.role || "admin";

      const generated = await generateRunbook({
        incidentTitle: "Cascading Edge Timeout & Latency Surge",
        service: "Gateway",
        rootCause: "Envoy HTTP/2 stream reset exhaustion",
        errorSignature: "HTTP2_RST_STREAM_FLOOD"
      });

      const newRb = await createRunbook({
        title: generated.title,
        service: "Gateway",
        author: authorName,
        authorEmail,
        authorRole,
        version: "v1.0-ai",
        tags: ["gateway", "envoy", "ai-synthesized", "autonomous"],
        estimatedDuration: `${generated.estimatedTimeMinutes || 12} mins`,
        successRate: "98.8%",
        executionCount: 1,
        steps: generated.steps.map((s, i) => ({
          id: i + 1,
          title: s.name,
          cmd: s.command,
          desc: s.description
        })),
        checklist: generated.validationChecklist
      });

      setRunbooks(prev => [newRb, ...prev]);
      setActiveRunbook(newRb);
      setCompletedSteps({});
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      toast.dismiss();
      toast.success(`New AI Recovery Playbook generated and saved persistently!`);
    } catch (err) {
      toast.dismiss();
      toast.error("Failed to synthesize runbook: " + err.message);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const loadPresetTemplate = (templateIndex) => {
    const t = PRESET_TEMPLATES[templateIndex];
    if (!t) return;
    setNewTitle(t.name);
    setNewService(t.service);
    setNewSeverity(t.severity);
    setNewDuration(t.duration);
    setNewSteps(t.steps.map(s => ({ ...s })));
    setNewChecklist([...t.checklist]);
    toast.info(`Loaded template: ${t.name}`);
  };

  const handleAddStep = () => {
    setNewSteps(prev => [
      ...prev,
      { title: '', cmd: '', desc: '' }
    ]);
  };

  const handleRemoveStep = (index) => {
    if (newSteps.length <= 1) return;
    setNewSteps(prev => prev.filter((_, i) => i !== index));
  };

  const handleStepChange = (index, field, value) => {
    setNewSteps(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddChecklistItem = () => {
    setNewChecklist(prev => [...prev, '']);
  };

  const handleRemoveChecklistItem = (index) => {
    if (newChecklist.length <= 1) return;
    setNewChecklist(prev => prev.filter((_, i) => i !== index));
  };

  const handleChecklistChange = (index, value) => {
    setNewChecklist(prev => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const handleCreateCustomRunbook = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error("Please enter a title for the playbook.");
      return;
    }

    setIsSaving(true);
    toast.loading("Saving and publishing playbook to fleet memory...");

    try {
      let targetAccount = DEMO_ACCOUNTS.find(a => a.id === newAuthorId);
      if (!targetAccount || newAuthorId === 'current') {
        targetAccount = currentUser || DEMO_ACCOUNTS[0];
      }

      const authorName = targetAccount.displayName || 'Alex Rivera';
      const authorEmail = targetAccount.email || 'alex.rivera@oryn.internal';
      const authorRole = targetAccount.role || 'admin';

      const validSteps = newSteps
        .filter(s => s.title.trim())
        .map((s, idx) => ({
          id: idx + 1,
          title: s.title.trim(),
          cmd: s.cmd.trim(),
          desc: s.desc.trim() || 'Verified SRE procedure step'
        }));

      const validChecklist = newChecklist.filter(c => c.trim());

      const created = await createRunbook({
        title: newTitle.trim(),
        service: newService,
        author: authorName,
        authorEmail,
        authorRole,
        severity: newSeverity,
        version: 'v1.0',
        tags: [newService.toLowerCase(), newSeverity.toLowerCase(), 'custom-authored', 'verified'],
        estimatedDuration: newDuration || '8 mins',
        successRate: '99.4%',
        executionCount: 1,
        steps: validSteps.length > 0 ? validSteps : [
          { id: 1, title: 'Verify Cluster Status', cmd: 'curl -s https://metrics.internal/health', desc: 'Inspect current telemetry state' }
        ],
        checklist: validChecklist.length > 0 ? validChecklist : [
          'Verify error rates drop < 0.01%',
          'Ensure p99 latency normalizes within baseline'
        ]
      });

      setRunbooks(prev => [created, ...prev]);
      setActiveRunbook(created);
      setCompletedSteps({});
      setShowCreateModal(false);
      setNewTitle('');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.dismiss();
      toast.success(`Playbook "${created.title}" saved persistently and published!`);
    } catch (err) {
      console.error(err);
      toast.dismiss();
      toast.error("Failed to save playbook: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicateRunbook = (rb) => {
    const target = rb || activeRunbook;
    if (!target) return;
    setNewTitle(`${target.title} (Clone)`);
    setNewService(target.service || 'PostgreSQL');
    setNewSeverity(target.severity || 'SEV-1');
    setNewDuration(target.estimatedDuration || '6 mins');
    setNewSteps((target.steps || []).map(s => ({
      title: s.title || s.name || '',
      cmd: s.cmd || s.command || '',
      desc: s.desc || s.description || ''
    })));
    setNewChecklist([...(target.checklist || ['Verify error rates drop < 0.01%'])]);
    setShowCreateModal(true);
    toast.info(`Loaded "${target.title}" into playbook authoring canvas`);
  };

  const handleDeleteRunbook = async (runbookId) => {
    if (!window.confirm("Remove this playbook from persistent storage?")) return;
    try {
      const updated = await deleteRunbook(runbookId);
      setRunbooks(updated);
      toast.success("Playbook removed from fleet memory.");
    } catch (err) {
      toast.error("Failed to delete playbook: " + err.message);
    }
  };

  const authorFilterPills = [
    { id: 'all', name: 'All Playbooks', count: runbooks.length },
    { id: 'alex', name: 'Alex Rivera', role: 'Admin', avatar: 'AR', color: 'bg-primary-container text-on-primary-container' },
    { id: 'elena', name: 'Elena Rostova', role: 'Staff SRE', avatar: 'ER', color: 'bg-secondary-container text-on-secondary-container' },
    { id: 'marcus', name: 'Marcus Chen', role: 'Infra Arch', avatar: 'MC', color: 'bg-tertiary-container text-on-tertiary-container' },
    { id: 'sarah', name: 'Sarah Lin', role: 'Platform Lead', avatar: 'SL', color: 'bg-amber-500/20 text-amber-400' },
    { id: 'david', name: 'David Kim', role: 'Streaming Lead', avatar: 'DK', color: 'bg-cyan-500/20 text-cyan-400' },
    { id: 'rachel', name: 'Rachel Green', role: 'Security Arch', avatar: 'RG', color: 'bg-pink-500/20 text-pink-400' },
  ];

  // Calculate executed step percentage
  const totalSteps = activeRunbook?.steps?.length || 0;
  const executedStepsCount = activeRunbook?.steps?.filter(s => !!completedSteps[s.id || s.step]).length || 0;
  const stepPercent = totalSteps > 0 ? Math.round((executedStepsCount / totalSteps) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-secondary-container/40 flex items-center justify-center text-secondary">
              <BookOpenCheck className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
              Recovery Playbooks
            </h1>
          </div>
          <p className="text-sm text-on-surface-variant mt-1">
            Dynamic, evidence-backed step execution checklists and exportable SRE runbooks.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Author New Playbook */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary text-on-primary font-semibold text-xs shadow-md hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Author New Playbook</span>
          </button>

          {/* AI Synthesize Button */}
          <button
            onClick={handleSynthesizeRunbook}
            disabled={isSynthesizing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-primary-container to-secondary-container text-on-primary-container font-semibold text-xs shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isSynthesizing ? 'Synthesizing...' : 'Synthesize with AI'}</span>
          </button>
        </div>
      </div>

      {/* Author Filter Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {authorFilterPills.map((pill) => {
          const isSelected = authorFilter === pill.id;
          const count = pill.id === 'all' 
            ? runbooks.length 
            : runbooks.filter(r => (r.author || '').toLowerCase().includes(pill.id)).length;

          return (
            <button
              key={pill.id}
              onClick={() => setAuthorFilter(pill.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                isSelected
                  ? 'bg-primary text-on-primary border-primary shadow-md'
                  : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant border-outline-variant/30'
              }`}
            >
              {pill.avatar && (
                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[9px] font-bold ${
                  isSelected ? 'bg-on-primary/20 text-on-primary' : pill.color
                }`}>
                  {pill.avatar}
                </span>
              )}
              <span>{pill.name}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                isSelected ? 'bg-on-primary/20 text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Split: Runbook Selector vs Active Step-by-Step Execution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Playbooks Selector (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-3 min-w-0">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search playbooks by title, service, command..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center justify-between px-1">
            <span className="font-mono text-xs uppercase text-on-surface-variant font-semibold">
              AVAILABLE PLAYBOOKS ({filteredRunbooks.length})
            </span>
            {authorFilter !== 'all' && (
              <button 
                onClick={() => setAuthorFilter('all')}
                className="text-[11px] font-mono text-primary hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2.5 max-h-[720px] overflow-y-auto pr-1">
            {filteredRunbooks.map((rb) => {
              const isSelected = activeRunbook?.id === rb.id;
              const authorAvatar = (rb.author || 'SRE').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

              return (
                <div
                  key={rb.id}
                  onClick={() => {
                    setActiveRunbook(rb);
                    setCompletedSteps({});
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                    isSelected
                      ? 'bg-surface-container border-primary shadow-lg ring-1 ring-primary/40'
                      : 'bg-surface-container-low border-outline-variant/20 hover:border-outline-variant/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-primary font-bold">{rb.service}</span>
                      {(!INITIAL_SEED_IDS.has(rb.id) || rb.tags?.includes('custom-authored') || rb.tags?.includes('ai-synthesized')) && (
                        <span className="font-mono text-[9px] text-tertiary bg-tertiary-container/30 px-1.5 py-0.5 rounded border border-tertiary/30 font-semibold">
                          SAVED
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-tertiary bg-tertiary-container/20 px-2 py-0.5 rounded border border-tertiary/20">
                      {rb.successRate || '99%'} success
                    </span>
                  </div>

                  <h3 className="font-bold text-on-surface text-sm leading-snug">
                    {rb.title}
                  </h3>

                  {/* Author Avatar Chip & Stats */}
                  <div className="flex items-center justify-between text-xs text-on-surface-variant pt-1 border-t border-outline-variant/10">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-mono text-[9px] font-bold">
                        {authorAvatar}
                      </div>
                      <span className="font-medium text-on-surface text-[11px] truncate max-w-[130px]">
                        {rb.author || 'SRE Team'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span>{rb.estimatedDuration || '8m'}</span>
                      <span>•</span>
                      <span>{rb.steps?.length || 0} steps</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredRunbooks.length === 0 && (
              <div className="p-8 text-center rounded-2xl bg-surface-container-low border border-outline-variant/20 text-on-surface-variant text-xs">
                No playbooks match the selected author or search criteria.
              </div>
            )}
          </div>
        </div>

        {/* Right: Active Playbook Execution Deck (8 cols) */}
        <div className="lg:col-span-8 min-w-0">
          {activeRunbook ? (
            <div className="p-6 sm:p-8 rounded-2xl bg-surface-container-low border border-outline-variant/20 shadow-sm flex flex-col gap-6">
              {/* Playbook Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-outline-variant/20">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">{activeRunbook.service}</span>
                    <span className="text-on-surface-variant font-mono text-xs">•</span>
                    <span className="font-mono text-xs text-on-surface-variant">{activeRunbook.version || 'v2.0'}</span>
                    <span className="text-on-surface-variant font-mono text-xs">•</span>
                    {(!INITIAL_SEED_IDS.has(activeRunbook.id) || activeRunbook.tags?.includes('custom-authored') || activeRunbook.tags?.includes('ai-synthesized')) ? (
                      <span className="font-mono text-[10px] text-tertiary bg-tertiary-container/20 px-2 py-0.5 rounded border border-tertiary/20">
                        SAVED PLAYBOOK
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] text-tertiary bg-tertiary-container/20 px-2 py-0.5 rounded border border-tertiary/20">
                        ENTERPRISE TESTED
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
                    {activeRunbook.title}
                  </h2>

                  {/* Author Profile */}
                  <div className="flex items-center gap-2.5 mt-1">
                    <div className="w-7 h-7 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-mono text-xs font-bold shadow-sm">
                      {(activeRunbook.author || 'SRE').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                        <span>{activeRunbook.author || 'Platform Reliability SRE'}</span>
                        <span className="text-[10px] font-mono text-primary font-normal bg-primary-container/20 px-2 py-0.2 rounded border border-primary/20">
                          {activeRunbook.authorRole?.toUpperCase() || 'ENGINEER'}
                        </span>
                      </p>
                      <p className="text-[10px] font-mono text-on-surface-variant">
                        {activeRunbook.authorEmail || 'sre-support@oryn.internal'} • Est: {activeRunbook.estimatedDuration || '8 mins'} • {activeRunbook.executionCount || 24} Executions
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions: Clone & Customize, PDF Export, and Delete */}
                <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                  <button
                    onClick={() => handleDuplicateRunbook(activeRunbook)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs border border-outline-variant/30 shadow-sm transition-all"
                    title="Load into authoring modal to clone and customize"
                  >
                    <CopyPlus className="w-3.5 h-3.5 text-primary" />
                    <span>Clone & Edit</span>
                  </button>

                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs border border-outline-variant/30 shadow-sm transition-all"
                  >
                    <Download className="w-3.5 h-3.5 text-secondary" />
                    <span>Audit PDF</span>
                  </button>

                  {(!INITIAL_SEED_IDS.has(activeRunbook.id) || activeRunbook.tags?.includes('custom-authored') || activeRunbook.tags?.includes('ai-synthesized')) && (
                    <button
                      onClick={() => handleDeleteRunbook(activeRunbook.id)}
                      className="p-2 rounded-xl bg-surface-container hover:bg-error-container/40 text-on-surface-variant hover:text-error border border-outline-variant/30 shadow-sm transition-all"
                      title="Delete saved playbook"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Execution Bar */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-surface-container border border-outline-variant/20">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-on-surface-variant flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-tertiary" />
                    <span>Remediation Progress</span>
                  </span>
                  <span className="font-bold text-tertiary">
                    {executedStepsCount} of {totalSteps} steps completed ({stepPercent}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-tertiary transition-all duration-300 rounded-full"
                    style={{ width: `${stepPercent}%` }}
                  />
                </div>
              </div>

              {/* Execution Steps */}
              <div className="flex flex-col gap-4">
                <span className="font-mono text-xs uppercase font-semibold text-on-surface-variant flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-primary" /> REMEDIATION SEQUENCE
                </span>

                {activeRunbook.steps?.map((step, idx) => {
                  const stepId = step.id || step.step || idx + 1;
                  const isChecked = !!completedSteps[stepId];
                  return (
                    <div
                      key={stepId}
                      className={`p-4 rounded-xl border transition-all flex flex-col gap-2.5 ${
                        isChecked 
                          ? 'bg-tertiary-container/10 border-tertiary/40' 
                          : 'bg-surface-container border-outline-variant/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleStep(stepId)}
                            className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                          />
                          <span className={`text-sm font-bold ${isChecked ? 'text-tertiary line-through' : 'text-on-surface'}`}>
                            Step {idx + 1}: {step.title || step.name}
                          </span>
                        </label>
                        {isChecked && (
                          <span className="text-[10px] font-mono font-bold text-tertiary flex items-center gap-1 bg-tertiary-container/20 px-2 py-0.5 rounded border border-tertiary/20">
                            <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-on-surface-variant pl-7">
                        {step.desc || step.description}
                      </p>

                      {/* Command Block */}
                      {(step.cmd || step.command) && (
                        <div className="ml-7 flex items-center justify-between p-2.5 rounded-lg bg-surface-container-lowest font-mono text-xs border border-outline-variant/20">
                          <code className="text-primary truncate flex-1 pr-2">
                            {step.cmd || step.command}
                          </code>
                          <button
                            onClick={() => copyToClipboard(step.cmd || step.command, stepId)}
                            className="p-1 rounded text-on-surface-variant hover:text-on-surface transition-colors flex-shrink-0"
                            title="Copy command"
                          >
                            {copiedCmd === stepId ? <Check className="w-3.5 h-3.5 text-tertiary" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Validation Checklist */}
              {activeRunbook.checklist && activeRunbook.checklist.length > 0 && (
                <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20 flex flex-col gap-2">
                  <span className="font-mono text-xs uppercase font-semibold text-tertiary flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> POST-EXECUTION VERIFICATION CRITERIA
                  </span>
                  <ul className="flex flex-col gap-1.5 text-xs text-on-surface-variant mt-1">
                    {activeRunbook.checklist.map((chk, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-tertiary flex-shrink-0" />
                        <span>{chk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-surface-container-low border border-outline-variant/20 text-on-surface-variant">
              Select a playbook from the left column to execute recovery commands.
            </div>
          )}
        </div>
      </div>

      {/* Author New Playbook Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-surface-container-low border border-outline-variant/30 rounded-2xl shadow-2xl p-6 sm:p-7 flex flex-col gap-5 my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <BookOpenCheck className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg text-on-surface">
                  Author New Recovery Playbook
                </h3>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                ✕
              </button>
            </div>

            {/* Quick Template Picker */}
            <div className="p-3.5 rounded-xl bg-surface-container border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <BookmarkPlus className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-on-surface">Quick-Start Templates:</span>
              </div>
              <select
                onChange={(e) => {
                  if (e.target.value !== '') {
                    loadPresetTemplate(parseInt(e.target.value, 10));
                  }
                }}
                defaultValue=""
                className="p-1.5 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="" disabled>Load a production template...</option>
                {PRESET_TEMPLATES.map((t, idx) => (
                  <option key={idx} value={idx}>{t.name} ({t.service})</option>
                ))}
              </select>
            </div>

            <form onSubmit={handleCreateCustomRunbook} className="flex flex-col gap-4">
              {/* Title & Service */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono text-on-surface-variant mb-1">
                    Playbook Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PostgreSQL Read Replica Failover & DNS Cutover"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-surface-container border border-outline-variant/30 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-on-surface-variant mb-1">
                    Target Service
                  </label>
                  <select
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-surface-container border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="PostgreSQL">PostgreSQL</option>
                    <option value="Payment API">Payment API</option>
                    <option value="Redis">Redis</option>
                    <option value="Gateway">Gateway</option>
                    <option value="Kafka">Kafka</option>
                    <option value="Authentication">Authentication</option>
                    <option value="Kubernetes Fleet">Kubernetes Fleet</option>
                    <option value="Security & Ingress">Security & Ingress</option>
                    <option value="DNS & Networking">DNS & Networking</option>
                  </select>
                </div>
              </div>

              {/* Author & Severity & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono text-on-surface-variant mb-1">
                    Author / Lead
                  </label>
                  <select
                    value={newAuthorId}
                    onChange={(e) => setNewAuthorId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-surface-container border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="current">Current: {currentUser?.displayName || 'Alex Rivera'}</option>
                    {DEMO_ACCOUNTS.map(a => (
                      <option key={a.id} value={a.id}>{a.displayName} ({a.title})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-on-surface-variant mb-1">
                    Severity Ceiling
                  </label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-surface-container border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="SEV-1">SEV-1 (Critical Outage)</option>
                    <option value="SEV-2">SEV-2 (Major Impairment)</option>
                    <option value="SEV-3">SEV-3 (Minor / Degraded)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-on-surface-variant mb-1">
                    Estimated Duration
                  </label>
                  <input
                    type="text"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    placeholder="e.g. 6 mins"
                    className="w-full p-2.5 rounded-xl bg-surface-container border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Steps Sequence */}
              <div className="flex flex-col gap-2.5 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase font-semibold text-on-surface-variant flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-primary" />
                    <span>Remediation Steps ({newSteps.length})</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Step
                  </button>
                </div>

                <div className="flex flex-col gap-3 max-h-56 overflow-y-auto pr-1">
                  {newSteps.map((step, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col gap-2 relative">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-primary">Step {idx + 1}</span>
                        {newSteps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveStep(idx)}
                            className="text-on-surface-variant hover:text-error p-1"
                            title="Remove step"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        placeholder="Step action title (e.g. Flush idle connection slots)"
                        value={step.title}
                        onChange={(e) => handleStepChange(idx, 'title', e.target.value)}
                        className="w-full p-2 rounded-lg bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:border-primary"
                      />

                      <input
                        type="text"
                        placeholder="CLI Command (e.g. psql -h master -c 'SELECT pg_terminate_backend(...)')"
                        value={step.cmd}
                        onChange={(e) => handleStepChange(idx, 'cmd', e.target.value)}
                        className="w-full p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-xs font-mono text-primary focus:outline-none focus:border-primary"
                      />

                      <input
                        type="text"
                        placeholder="Step explanation or expected result..."
                        value={step.desc}
                        onChange={(e) => handleStepChange(idx, 'desc', e.target.value)}
                        className="w-full p-2 rounded-lg bg-surface-container-low border border-outline-variant/30 text-[11px] text-on-surface-variant focus:outline-none focus:border-primary"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Verification Checklist */}
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase font-semibold text-on-surface-variant flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-tertiary" />
                    <span>Verification Criteria Checklist</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddChecklistItem}
                    className="text-xs font-semibold text-tertiary hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Criteria
                  </button>
                </div>

                <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {newChecklist.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-tertiary flex-shrink-0" />
                      <input
                        type="text"
                        placeholder="Validation criteria (e.g. Active pool capacity < 75%)"
                        value={item}
                        onChange={(e) => handleChecklistChange(idx, e.target.value)}
                        className="flex-1 p-2 rounded-lg bg-surface-container border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:border-primary"
                      />
                      {newChecklist.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveChecklistItem(idx)}
                          className="text-on-surface-variant hover:text-error p-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/20 mt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !newTitle.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-on-primary font-semibold text-xs shadow-md hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all"
                >
                  <BookOpenCheck className="w-4 h-4" />
                  <span>{isSaving ? 'Publishing...' : 'Save & Publish Playbook'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
