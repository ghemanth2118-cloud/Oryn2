import React, { useState, useEffect } from 'react';
import { 
  getPostmortems, 
  createPostmortem, 
  updatePostmortem, 
  deletePostmortem, 
  createMemory, 
  getIncidents 
} from '../services/firestoreService';
import { summarizePostmortem, generateFallbackPostmortem } from '../services/geminiService';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { 
  FileText, 
  BrainCircuit, 
  Sparkles, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Plus, 
  Check, 
  Download,
  AlertTriangle,
  History,
  Search,
  User,
  Users,
  ShieldCheck,
  Tag,
  Calendar,
  Layers,
  ChevronDown,
  CopyPlus,
  Trash2,
  Edit3,
  BookmarkPlus,
  PlusCircle
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

const INITIAL_SEED_PM_IDS = new Set([
  'pm-4092', 'pm-4091', 'pm-4090', 'pm-4089', 'pm-4088', 'pm-4087'
]);

const PRESET_POSTMORTEM_TEMPLATES = [
  {
    name: 'Database Connection Pool Starvation & Query Stall',
    service: 'PostgreSQL',
    title: 'Postmortem: PostgreSQL Connection Starvation & Read-Replica Failover',
    impact: '26 minutes degraded checkout transactions. 1,420 transactions delayed. 0 data loss.',
    rootCause: 'Long-running unindexed analytics query held row-level exclusive locks, exhausting client connections in PgBouncer pool.',
    timeline: [
      { time: '14:10 UTC', text: 'Telemetry alarm: active PgBouncer client pool hit 100% capacity.' },
      { time: '14:14 UTC', text: 'Checkout service threads began timing out with PGRES_FATAL_ERROR.' },
      { time: '14:18 UTC', text: 'ORYN identified blocked query PID and recommended connection termination.' },
      { time: '14:23 UTC', text: 'Terminated offending worker backend and adjusted idle-in-transaction timeout.' },
      { time: '14:36 UTC', text: 'Read replica replication lag normalized < 2MB; checkout P99 latency dropped to 85ms.' }
    ],
    whatWentWell: [
      'Automated alerting triggered within 60 seconds of pool saturation',
      'PgBouncer connection pooler prevented direct RDS engine crash',
      'Zero corrupted customer records recorded during recovery'
    ],
    whatWentWrong: [
      'Analytics service was connected to write-master instead of dedicated read replica',
      'Default idle_in_transaction_session_timeout was set to 0 (disabled)'
    ],
    actionItems: [
      { action: 'Route all analytics workers strictly through read-replica endpoint', owner: 'Alex Rivera', status: 'Done' },
      { action: 'Enforce idle_in_transaction_session_timeout = 15000 in postgresql.conf', owner: 'DB Infra SRE', status: 'In Progress' }
    ]
  },
  {
    name: 'Edge Ingress Envoy Gateway Worker CPU Saturation',
    service: 'Gateway',
    title: 'Postmortem: Edge Envoy Gateway Ingress Worker CPU Saturation & HTTP 503 Spike',
    impact: '18 minutes elevated p99 latency (1,850ms). 1.8% packet drop on mobile clients.',
    rootCause: 'Coordinated bot traffic flooded edge PoPs with malformed TLS ClientHello payloads, exhausting worker CPU cycles in nghttp2.',
    timeline: [
      { time: '08:22 UTC', text: 'Ingress Envoy worker CPU pinned at 100% across all 4 edge availability zones.' },
      { time: '08:25 UTC', text: 'Mobile client requests began reporting HTTP 503 Service Unavailable.' },
      { time: '08:29 UTC', text: 'ORYN matched rapid reset frame flood pattern from incident history.' },
      { time: '08:33 UTC', text: 'Applied edge rate limiting rule and enabled Cloudflare scrub profile.' },
      { time: '08:40 UTC', text: 'Worker CPU usage stabilized < 45%; 0 dropped requests recorded.' }
    ],
    whatWentWell: [
      'Cloudflare edge integration allowed rapid policy deployment without pod redeployment',
      'Internal microservices remained completely insulated behind gateway barrier'
    ],
    whatWentWrong: [
      'Edge ingress gateway did not auto-scale horizontally fast enough for the 10x traffic spike',
      'Initial pager alert lacked automated bot signature correlation'
    ],
    actionItems: [
      { action: 'Configure horizontal pod autoscaler (HPA) to scale on Envoy CPU > 65%', owner: 'Elena Rostova', status: 'Done' },
      { action: 'Deploy automated IP reputation throttling on edge ingress', owner: 'Security Lead', status: 'In Progress' }
    ]
  },
  {
    name: 'Kafka Consumer Partition Rebalance Loop & Lag Backpressure',
    service: 'Kafka',
    title: 'Postmortem: Kafka Consumer Partition Rebalance Storm on Payment Webhooks',
    impact: '35 minutes event ingestion latency. 120,000 delayed notifications. 0 lost messages.',
    rootCause: 'Garbage collection pause in Node.js worker exceeded max.poll.interval.ms, triggering continuous partition rebalances across the consumer group.',
    timeline: [
      { time: '03:15 UTC', text: 'Kafka consumer lag on payment-webhooks topic exceeded 50,000 events.' },
      { time: '03:18 UTC', text: 'Consumer group coordinator triggered partition revocation loop.' },
      { time: '03:24 UTC', text: 'ORYN diagnosed GC pause and recommended increasing poll timeout.' },
      { time: '03:31 UTC', text: 'Deployed hotfix increasing max.poll.interval.ms from 300s to 600s and reduced batch size.' },
      { time: '03:50 UTC', text: 'Backlog fully cleared through 8 scaled consumer pods.' }
    ],
    whatWentWell: [
      'Kafka persistent commit log retained all 120,000 messages with 100% fidelity',
      'Kubernetes worker scaling absorbed backlog drain within 19 minutes'
    ],
    whatWentWrong: [
      'Consumer worker memory heap limit was set too low for high-volume end-of-month batch runs',
      'Rebalance notification alert was routed to low-priority email instead of Slack SRE channel'
    ],
    actionItems: [
      { action: 'Increase consumer worker container memory allocation to 2GiB', owner: 'David Kim', status: 'Done' },
      { action: 'Route consumer lag > 10,000 alarms directly to SRE on-call PagerDuty', owner: 'Platform Lead', status: 'Done' }
    ]
  }
];

export default function PostmortemPage() {
  const { currentUser } = useAuth();
  const [postmortems, setPostmortems] = useState([]);
  const [selectedPostmortem, setSelectedPostmortem] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRetaining, setIsRetaining] = useState(false);

  // Filters & Search
  const [leadFilter, setLeadFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalTab, setModalTab] = useState('ai'); // 'ai' or 'manual'
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // AI Tab State
  const [selectedIncidentId, setSelectedIncidentId] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState('current');
  const [customNotes, setCustomNotes] = useState('');

  // Manual Authoring Tab State
  const [manualTitle, setManualTitle] = useState('');
  const [manualService, setManualService] = useState('PostgreSQL');
  const [manualLeadId, setManualLeadId] = useState('current');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualImpact, setManualImpact] = useState('');
  const [manualRootCause, setManualRootCause] = useState('');
  const [manualTimeline, setManualTimeline] = useState([
    { time: '10:00 UTC', text: 'Telemetry alarm triggered on worker node' },
    { time: '10:05 UTC', text: 'ORYN Memory Engine matched historical mitigation pattern' },
    { time: '10:22 UTC', text: 'Remediation completed and verified with normal SLAs' }
  ]);
  const [manualWhatWentWell, setManualWhatWentWell] = useState([
    'Automated error signature detection isolated impaired nodes within 45s',
    'Zero sensitive customer data or credentials compromised'
  ]);
  const [manualWhatWentWrong, setManualWhatWentWrong] = useState([
    'Worker thread pool was under-provisioned for unexpected traffic spike',
    'Secondary failover route experienced 4 minutes of transient timeout'
  ]);
  const [manualActionItems, setManualActionItems] = useState([
    { action: 'Audit and standardize worker connection timeouts in Terraform', owner: 'Alex Rivera', status: 'In Progress' },
    { action: 'Deploy automated synthetic latency probe in Prometheus', owner: 'Platform SRE', status: 'Open' }
  ]);
  const [isSavingManual, setIsSavingManual] = useState(false);

  useEffect(() => {
    async function load() {
      const [pms, incs] = await Promise.all([
        getPostmortems(),
        getIncidents()
      ]);
      setPostmortems(pms || []);
      setIncidents(incs || []);
      if (pms && pms.length > 0) setSelectedPostmortem(pms[0]);
      if (incs && incs.length > 0) setSelectedIncidentId(incs[0].id);
    }
    load();

    const handleUpdate = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setPostmortems(e.detail);
      }
    };
    window.addEventListener('oryn_postmortems_updated', handleUpdate);
    return () => window.removeEventListener('oryn_postmortems_updated', handleUpdate);
  }, []);

  // Filtered postmortems
  const filteredPostmortems = React.useMemo(() => {
    return postmortems.filter((pm) => {
      // Lead Filter
      if (leadFilter !== 'all') {
        const leadLower = (pm.lead || '').toLowerCase();
        if (leadFilter === 'alex' && !leadLower.includes('alex')) return false;
        if (leadFilter === 'elena' && !leadLower.includes('elena')) return false;
        if (leadFilter === 'marcus' && !leadLower.includes('marcus')) return false;
        if (leadFilter === 'sarah' && !leadLower.includes('sarah')) return false;
        if (leadFilter === 'david' && !leadLower.includes('david')) return false;
        if (leadFilter === 'rachel' && !leadLower.includes('rachel')) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (pm.title || '').toLowerCase().includes(q);
        const matchesService = (pm.service || '').toLowerCase().includes(q);
        const matchesLead = (pm.lead || '').toLowerCase().includes(q);
        const matchesRoot = (pm.rootCause || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesService && !matchesLead && !matchesRoot) return false;
      }

      return true;
    });
  }, [postmortems, leadFilter, searchQuery]);

  // Keep selected postmortem valid when filters change
  useEffect(() => {
    if (filteredPostmortems.length > 0) {
      if (!selectedPostmortem || !filteredPostmortems.some(p => p.id === selectedPostmortem.id)) {
        setSelectedPostmortem(filteredPostmortems[0]);
      }
    } else {
      setSelectedPostmortem(null);
    }
  }, [filteredPostmortems]);

  const openAICreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setModalTab('ai');
    if (!selectedIncidentId && incidents.length > 0) {
      setSelectedIncidentId(incidents[0].id);
    }
    setShowCreateModal(true);
  };

  const openManualCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setModalTab('manual');
    setManualTitle('');
    setManualImpact('');
    setManualRootCause('');
    setShowCreateModal(true);
  };

  const handleCreatePostmortemWithAI = async () => {
    const inc = incidents.find(i => i.id === selectedIncidentId) || incidents[0];
    if (!inc) {
      toast.error("Please select an incident to investigate.");
      return;
    }

    setIsGenerating(true);
    toast.loading("Gemini AI synthesizing blameless postmortem...");

    try {
      let targetAccount = DEMO_ACCOUNTS.find(a => a.id === selectedLeadId);
      if (!targetAccount || selectedLeadId === 'current') {
        targetAccount = currentUser || DEMO_ACCOUNTS[0];
      }

      const leadName = targetAccount?.displayName || 'Alex Rivera';
      const leadRole = targetAccount?.title || 'SRE Lead (Admin)';
      const leadEmail = targetAccount?.email || 'alex.rivera@oryn.internal';
      const avatar = targetAccount?.avatar || leadName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'AR';

      let summary;
      try {
        summary = await summarizePostmortem({
          incident: inc,
          notes: customNotes,
          resolutionDetails: inc.successfulResolution
        });
      } catch (aiErr) {
        console.warn("AI postmortem generation fallback:", aiErr);
        summary = generateFallbackPostmortem({
          incident: inc,
          notes: customNotes,
          resolutionDetails: inc.successfulResolution
        });
      }

      if (!summary) {
        summary = generateFallbackPostmortem({ incident: inc });
      }

      // Safe impact string
      const formattedImpact = typeof summary.impact === 'string'
        ? summary.impact
        : `${summary.impact?.durationMinutes || inc.durationMinutes || 28} minutes total downtime. ${summary.impact?.affectedUsers || '12,000'} affected sessions. ${summary.impact?.revenueImpact ? `${summary.impact.revenueImpact} transient impact.` : ''}`;

      // Safe timeline formatting
      const rawTimeline = summary.timeline || [];
      const formattedTimeline = Array.isArray(rawTimeline) && rawTimeline.length > 0
        ? rawTimeline.map(t => ({
            time: typeof t === 'object' && t !== null ? (t.time || '00:00 UTC') : '00:00 UTC',
            text: typeof t === 'object' && t !== null ? (t.text || t.event || 'Telemetry update') : String(t)
          }))
        : [
            { time: '00:00 UTC', text: `Alert triggered on ${inc.service}` },
            { time: '00:04 UTC', text: `ORYN Memory Engine identified error pattern` },
            { time: `00:${inc.durationMinutes || 24} UTC`, text: `Remediation runbook completed and verified` }
          ];

      const sanitizeList = (list, defaultItems) => {
        if (!Array.isArray(list) || list.length === 0) return defaultItems;
        return list.map(item => {
          if (typeof item === 'string') return item;
          if (typeof item === 'object' && item !== null) {
            return item.point || item.text || item.description || item.item || JSON.stringify(item);
          }
          return String(item);
        });
      };

      const whatWentWell = sanitizeList(summary.whatWentWell, [
        'Automated error signature localization triggered within 30 seconds',
        'Runbook execution prevented catastrophic cascading outage',
        'Zero sensitive customer data or credentials compromised'
      ]);

      const whatWentWrong = sanitizeList(summary.whatWentWrong, [
        `${inc.service} connection ceiling was under-provisioned for traffic surge`,
        'Downstream timeouts were not configured with aggressive circuit-breaker defaults'
      ]);

      const rawActionItems = summary.preventativeActionItems || summary.actionItems || [];
      const actionItems = Array.isArray(rawActionItems) && rawActionItems.length > 0
        ? rawActionItems.map(a => ({
            action: typeof a === 'object' && a !== null ? (a.action || a.title || a.description || a.task || 'Audit service resilience') : String(a),
            owner: typeof a === 'object' && a !== null ? (a.owner || a.assignee || leadName) : leadName,
            status: typeof a === 'object' && a !== null && a.status ? a.status : 'Open'
          }))
        : [
            { action: `Audit ${inc.service} connection pool limits via Terraform`, owner: leadName, status: 'Open' },
            { action: `Deploy automated synthetic heartbeat probes for ${inc.errorSignature || 'telemetry'}`, owner: 'Telemetry SRE', status: 'In Progress' }
          ];

      const newPm = await createPostmortem({
        incidentId: inc.id,
        title: `Postmortem: ${inc.title}`,
        service: inc.service,
        lead: leadName,
        leadRole,
        leadEmail,
        avatar,
        date: new Date().toISOString().split('T')[0],
        impact: formattedImpact,
        rootCause: summary.rootCauseAnalysis || summary.rootCause || inc.rootCause || 'Cascading thread saturation and connection queue backlog under high load.',
        timeline: formattedTimeline,
        whatWentWell,
        whatWentWrong,
        actionItems,
        isCustom: true
      });

      setPostmortems(prev => [newPm, ...prev.filter(p => p.id !== newPm.id)]);
      setSelectedPostmortem(newPm);
      setShowCreateModal(false);
      setCustomNotes('');
      confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
      toast.dismiss();
      toast.success(`Postmortem successfully generated by AI and saved to memory!`);
    } catch (err) {
      console.error(err);
      toast.dismiss();
      toast.error("Generation failed: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const loadPresetPostmortemTemplate = (idx) => {
    const t = PRESET_POSTMORTEM_TEMPLATES[idx];
    if (!t) return;
    setManualTitle(t.title);
    setManualService(t.service);
    setManualImpact(t.impact);
    setManualRootCause(t.rootCause);
    setManualTimeline(t.timeline.map(x => ({ ...x })));
    setManualWhatWentWell([...t.whatWentWell]);
    setManualWhatWentWrong([...t.whatWentWrong]);
    setManualActionItems(t.actionItems.map(x => ({ ...x })));
    toast.info(`Loaded template: ${t.name}`);
  };

  const handleSaveManualPostmortem = async (e) => {
    e.preventDefault();
    if (!manualTitle.trim()) {
      toast.error("Please enter a title for the postmortem report.");
      return;
    }

    setIsSavingManual(true);
    toast.loading("Saving postmortem report to persistent memory...");

    try {
      let targetAccount = DEMO_ACCOUNTS.find(a => a.id === manualLeadId);
      if (!targetAccount || manualLeadId === 'current') {
        targetAccount = currentUser || DEMO_ACCOUNTS[0];
      }

      const leadName = targetAccount?.displayName || 'Alex Rivera';
      const leadRole = targetAccount?.title || 'SRE Lead';
      const leadEmail = targetAccount?.email || 'alex.rivera@oryn.internal';
      const avatar = targetAccount?.avatar || leadName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

      const validTimeline = manualTimeline.filter(t => t.text.trim());
      const validWell = manualWhatWentWell.filter(w => w.trim());
      const validWrong = manualWhatWentWrong.filter(w => w.trim());
      const validActions = manualActionItems.filter(a => a.action.trim());

      const postmortemData = {
        title: manualTitle.trim(),
        service: manualService,
        lead: leadName,
        leadRole,
        leadEmail,
        avatar,
        date: manualDate || new Date().toISOString().split('T')[0],
        impact: manualImpact.trim() || 'Service latency degradation under peak traffic.',
        rootCause: manualRootCause.trim() || 'Resource bottleneck in worker threads.',
        timeline: validTimeline.length > 0 ? validTimeline : [
          { time: '00:00 UTC', text: 'Telemetry alarm triggered' },
          { time: '00:15 UTC', text: 'Remediation completed' }
        ],
        whatWentWell: validWell.length > 0 ? validWell : ['Automated alerting isolated impaired worker'],
        whatWentWrong: validWrong.length > 0 ? validWrong : ['Connection timeouts exceeded baseline limits'],
        actionItems: validActions.length > 0 ? validActions : [
          { action: 'Review service capacity headroom', owner: leadName, status: 'Open' }
        ],
        isCustom: true
      };

      if (isEditing && editingId) {
        await updatePostmortem(editingId, postmortemData);
        const updated = { id: editingId, ...postmortemData };
        setPostmortems(prev => prev.map(p => p.id === editingId ? updated : p));
        setSelectedPostmortem(updated);
        toast.dismiss();
        toast.success(`Postmortem "${manualTitle}" updated and saved!`);
      } else {
        const created = await createPostmortem(postmortemData);
        setPostmortems(prev => [created, ...prev.filter(p => p.id !== created.id)]);
        setSelectedPostmortem(created);
        toast.dismiss();
        toast.success(`Postmortem "${manualTitle}" saved persistently!`);
      }

      confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
      setShowCreateModal(false);
      setIsEditing(false);
      setEditingId(null);
    } catch (err) {
      console.error(err);
      toast.dismiss();
      toast.error("Failed to save postmortem: " + err.message);
    } finally {
      setIsSavingManual(false);
    }
  };

  const handleEditPostmortem = (pm) => {
    const target = pm || selectedPostmortem;
    if (!target) return;
    setIsEditing(true);
    setEditingId(target.id);
    setModalTab('manual');
    setManualTitle(target.title || '');
    setManualService(target.service || 'PostgreSQL');
    const matchedAccount = DEMO_ACCOUNTS.find(a => a.displayName === target.lead);
    setManualLeadId(matchedAccount ? matchedAccount.id : 'current');
    setManualDate(target.date || new Date().toISOString().split('T')[0]);
    setManualImpact(target.impact || '');
    setManualRootCause(target.rootCause || '');
    setManualTimeline((target.timeline || []).map(t => ({
      time: typeof t === 'object' ? (t.time || '00:00 UTC') : '00:00 UTC',
      text: typeof t === 'object' ? (t.text || t.event || '') : String(t)
    })));
    setManualWhatWentWell((target.whatWentWell || []).map(w => typeof w === 'object' ? (w.point || w.text || JSON.stringify(w)) : String(w)));
    setManualWhatWentWrong((target.whatWentWrong || []).map(w => typeof w === 'object' ? (w.point || w.text || JSON.stringify(w)) : String(w)));
    setManualActionItems((target.actionItems || []).map(a => ({
      action: typeof a === 'object' ? (a.action || a.title || a.task || '') : String(a),
      owner: typeof a === 'object' ? (a.owner || a.assignee || target.lead || 'SRE Team') : (target.lead || 'SRE Team'),
      status: typeof a === 'object' && a.status ? a.status : 'Open'
    })));
    setShowCreateModal(true);
    toast.info("Opened report in editor. Make adjustments and click Save.");
  };

  const handleClonePostmortem = (pm) => {
    const target = pm || selectedPostmortem;
    if (!target) return;
    setIsEditing(false);
    setEditingId(null);
    setModalTab('manual');
    setManualTitle(`${target.title} (Clone)`);
    setManualService(target.service || 'PostgreSQL');
    const matchedAccount = DEMO_ACCOUNTS.find(a => a.displayName === target.lead);
    setManualLeadId(matchedAccount ? matchedAccount.id : 'current');
    setManualDate(new Date().toISOString().split('T')[0]);
    setManualImpact(target.impact || '');
    setManualRootCause(target.rootCause || '');
    setManualTimeline((target.timeline || []).map(t => ({
      time: typeof t === 'object' ? (t.time || '00:00 UTC') : '00:00 UTC',
      text: typeof t === 'object' ? (t.text || t.event || '') : String(t)
    })));
    setManualWhatWentWell((target.whatWentWell || []).map(w => typeof w === 'object' ? (w.point || w.text || JSON.stringify(w)) : String(w)));
    setManualWhatWentWrong((target.whatWentWrong || []).map(w => typeof w === 'object' ? (w.point || w.text || JSON.stringify(w)) : String(w)));
    setManualActionItems((target.actionItems || []).map(a => ({
      action: typeof a === 'object' ? (a.action || a.title || a.task || '') : String(a),
      owner: typeof a === 'object' ? (a.owner || a.assignee || target.lead || 'SRE Team') : (target.lead || 'SRE Team'),
      status: typeof a === 'object' && a.status ? a.status : 'Open'
    })));
    setShowCreateModal(true);
    toast.info(`Cloned "${target.title}" into report authoring canvas`);
  };

  const handleDeletePostmortem = async (id) => {
    if (!window.confirm("Remove this postmortem report from persistent storage?")) return;
    try {
      const updated = await deletePostmortem(id);
      setPostmortems(updated);
      toast.success("Postmortem report deleted from memory.");
    } catch (err) {
      toast.error("Failed to delete postmortem: " + err.message);
    }
  };

  const handleToggleActionStatus = async (actionIdx) => {
    if (!selectedPostmortem || !selectedPostmortem.actionItems) return;
    const currentStatus = selectedPostmortem.actionItems[actionIdx]?.status;
    const nextStatus = currentStatus === 'Done' ? 'In Progress' : 'Done';
    const updatedActions = selectedPostmortem.actionItems.map((a, idx) => 
      idx === actionIdx ? { ...a, status: nextStatus } : a
    );

    const updatedPm = {
      ...selectedPostmortem,
      actionItems: updatedActions
    };

    setSelectedPostmortem(updatedPm);
    setPostmortems(prev => prev.map(p => p.id === updatedPm.id ? updatedPm : p));
    await updatePostmortem(updatedPm.id, { actionItems: updatedActions });
    if (nextStatus === 'Done') {
      confetti({ particleCount: 50, spread: 45, origin: { y: 0.7 } });
      toast.success("Action item marked Done and saved!");
    } else {
      toast.info("Action item updated to In Progress.");
    }
  };

  const handleRetainToMemory = async () => {
    if (!selectedPostmortem) return;
    setIsRetaining(true);

    try {
      await createMemory({
        incidentId: selectedPostmortem.incidentId || `inc-${Date.now()}`,
        title: selectedPostmortem.title,
        service: selectedPostmortem.service,
        severity: 'SEV-1',
        errorSignature: `${selectedPostmortem.service.toUpperCase()}_OUTAGE_SIGNATURE`,
        confidenceScore: 98,
        rootCause: selectedPostmortem.rootCause,
        recoverySteps: selectedPostmortem.whatWentWell || ['Verified automated runbook execution'],
        tags: [selectedPostmortem.service.toLowerCase(), 'postmortem', 'retained', selectedPostmortem.lead?.toLowerCase() || 'lead']
      });

      confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
      toast.success("Retained into Organizational Memory! Future incidents will leverage this knowledge.");
    } catch (err) {
      toast.error("Failed to retain: " + err.message);
    } finally {
      setIsRetaining(false);
    }
  };

  const handleExportPDF = () => {
    if (!selectedPostmortem) return;
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFillColor(24, 27, 38);
      doc.rect(0, 0, 210, 38, 'F');
      
      doc.setTextColor(195, 192, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("ORYN BLAMELESS SRE POSTMORTEM", 14, 16);
      
      doc.setFontSize(9);
      doc.setTextColor(200, 200, 210);
      doc.text(`SERVICE: ${selectedPostmortem.service.toUpperCase()} | DATE: ${selectedPostmortem.date} | INCIDENT: ${selectedPostmortem.incidentId || 'INC-LIVE'}`, 14, 25);
      doc.text(`LEAD: ${selectedPostmortem.lead} (${selectedPostmortem.leadRole || 'Lead'}) | EMAIL: ${selectedPostmortem.leadEmail || 'sre@oryn.internal'}`, 14, 32);

      // Title & Impact
      doc.setTextColor(30, 30, 40);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text(selectedPostmortem.title, 14, 48);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Customer & Service Impact: ${selectedPostmortem.impact}`, 14, 56);
      doc.text(`Root Cause: ${selectedPostmortem.rootCause}`, 14, 62);

      // Timeline Table
      const timelineData = (selectedPostmortem.timeline || []).map(t => [t.time, t.text || t.event || 'Milestone']);
      doc.autoTable({
        startY: 70,
        head: [['Time', 'Event Sequence']],
        body: timelineData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
        styles: { fontSize: 8, cellPadding: 3 }
      });

      // What Went Well / What Went Wrong
      let nextY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Retrospective Analysis:", 14, nextY);

      nextY += 6;
      doc.setFontSize(9);
      doc.setTextColor(16, 185, 129); // Green
      doc.text("What Went Well:", 14, nextY);
      doc.setTextColor(50, 50, 60);
      doc.setFont("helvetica", "normal");
      (selectedPostmortem.whatWentWell || []).forEach(item => {
        nextY += 5;
        const text = typeof item === 'object' ? (item.point || item.text || JSON.stringify(item)) : String(item);
        doc.text(`+ ${text}`, 18, nextY);
      });

      nextY += 8;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(239, 68, 68); // Red
      doc.text("What Went Wrong:", 14, nextY);
      doc.setTextColor(50, 50, 60);
      doc.setFont("helvetica", "normal");
      (selectedPostmortem.whatWentWrong || []).forEach(item => {
        nextY += 5;
        const text = typeof item === 'object' ? (item.point || item.text || JSON.stringify(item)) : String(item);
        doc.text(`- ${text}`, 18, nextY);
      });

      // Action Items Table
      if (selectedPostmortem.actionItems && selectedPostmortem.actionItems.length > 0) {
        nextY += 10;
        const actionData = selectedPostmortem.actionItems.map(a => [
          typeof a === 'object' ? (a.action || a.title || a.task) : String(a),
          typeof a === 'object' ? (a.owner || a.assignee || 'SRE') : 'SRE',
          typeof a === 'object' ? (a.status || 'Open') : 'Open'
        ]);

        doc.autoTable({
          startY: nextY,
          head: [['Preventative Action Item', 'Owner', 'Status']],
          body: actionData,
          theme: 'grid',
          headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
          styles: { fontSize: 8, cellPadding: 3 }
        });
      }

      doc.save(`Postmortem_${selectedPostmortem.incidentId || 'report'}_${selectedPostmortem.service}.pdf`);
      toast.success("Audit-ready Postmortem PDF exported successfully!");
    } catch (e) {
      toast.error("PDF export error: " + e.message);
    }
  };

  const authorPills = [
    { id: 'all', name: 'All Leads', count: postmortems.length },
    { id: 'alex', name: 'Alex Rivera', role: 'Admin', avatar: 'AR', color: 'bg-primary-container text-on-primary-container' },
    { id: 'elena', name: 'Elena Rostova', role: 'Staff SRE', avatar: 'ER', color: 'bg-secondary-container text-on-secondary-container' },
    { id: 'marcus', name: 'Marcus Chen', role: 'Infra Arch', avatar: 'MC', color: 'bg-tertiary-container text-on-tertiary-container' },
    { id: 'sarah', name: 'Sarah Lin', role: 'Platform Lead', avatar: 'SL', color: 'bg-amber-500/20 text-amber-400' },
    { id: 'david', name: 'David Kim', role: 'Streaming Lead', avatar: 'DK', color: 'bg-cyan-500/20 text-cyan-400' },
    { id: 'rachel', name: 'Rachel Green', role: 'Security Arch', avatar: 'RG', color: 'bg-pink-500/20 text-pink-400' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-container/40 flex items-center justify-center text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
              Postmortem Documentation
            </h1>
          </div>
          <p className="text-sm text-on-surface-variant mt-1">
            Blameless retrospective investigations, systemic failure timelines, and organizational memory retention.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Author New Postmortem */}
          <button
            onClick={openManualCreateModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary text-on-primary font-semibold text-xs shadow-md hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Author New Report</span>
          </button>

          {/* AI Draft Postmortem */}
          <button
            onClick={openAICreateModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-primary-container to-secondary-container text-on-primary-container font-semibold text-xs shadow-md hover:shadow-lg transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Draft with AI</span>
          </button>
        </div>
      </div>

      {/* Author / Lead Filter Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {authorPills.map((pill) => {
          const isSelected = leadFilter === pill.id;
          const count = pill.id === 'all' 
            ? postmortems.length 
            : postmortems.filter(p => (p.lead || '').toLowerCase().includes(pill.id)).length;

          return (
            <button
              key={pill.id}
              onClick={() => setLeadFilter(pill.id)}
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

      {/* Main Split: Select Postmortem vs Detailed Document */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Postmortems List (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-3 min-w-0">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search postmortems by keyword, lead, service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center justify-between px-1">
            <span className="font-mono text-xs uppercase text-on-surface-variant font-semibold">
              REPORTS ({filteredPostmortems.length})
            </span>
            {leadFilter !== 'all' && (
              <button 
                onClick={() => setLeadFilter('all')}
                className="text-[11px] font-mono text-primary hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2.5 max-h-[720px] overflow-y-auto pr-1">
            {filteredPostmortems.map((pm) => {
              const isSelected = selectedPostmortem?.id === pm.id;
              const avatar = pm.avatar || (pm.lead ? pm.lead.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'LE');
              const isCustomReport = !INITIAL_SEED_PM_IDS.has(pm.id) || pm.isCustom || pm.createdAt;

              return (
                <div
                  key={pm.id}
                  onClick={() => setSelectedPostmortem(pm)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                    isSelected
                      ? 'bg-surface-container border-primary shadow-lg ring-1 ring-primary/40'
                      : 'bg-surface-container-low border-outline-variant/20 hover:border-outline-variant/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-primary font-bold">{pm.service}</span>
                      {isCustomReport && (
                        <span className="font-mono text-[9px] text-tertiary bg-tertiary-container/30 px-1.5 py-0.5 rounded border border-tertiary/30 font-semibold">
                          SAVED
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-on-surface-variant flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {pm.date}
                    </span>
                  </div>

                  <h3 className="font-bold text-on-surface text-sm leading-snug">
                    {pm.title}
                  </h3>

                  {/* Lead Avatar Chip */}
                  <div className="flex items-center justify-between text-xs text-on-surface-variant pt-1 border-t border-outline-variant/10">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-mono text-[9px] font-bold">
                        {avatar}
                      </div>
                      <span className="font-medium text-on-surface text-[11px] truncate max-w-[130px]">{pm.lead}</span>
                    </div>
                    <span className="font-mono text-[10px] text-on-surface-variant bg-surface-container-high px-1.5 py-0.5 rounded">
                      {pm.leadRole || 'Lead'}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredPostmortems.length === 0 && (
              <div className="p-8 text-center rounded-2xl bg-surface-container-low border border-outline-variant/20 text-on-surface-variant text-xs">
                No postmortems match the selected lead or search criteria.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Detailed Document View (8 cols) */}
        <div className="lg:col-span-8 min-w-0">
          {selectedPostmortem ? (
            <div className="p-6 sm:p-8 rounded-2xl bg-surface-container-low border border-outline-variant/20 shadow-sm flex flex-col gap-6">
              {/* Header and Actions */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-outline-variant/20">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">{selectedPostmortem.service}</span>
                    <span className="text-on-surface-variant font-mono text-xs">•</span>
                    <span className="font-mono text-xs text-on-surface-variant">{selectedPostmortem.date}</span>
                    <span className="text-on-surface-variant font-mono text-xs">•</span>
                    {(!INITIAL_SEED_PM_IDS.has(selectedPostmortem.id) || selectedPostmortem.isCustom || selectedPostmortem.createdAt) ? (
                      <span className="font-mono text-[10px] text-tertiary bg-tertiary-container/20 px-2 py-0.5 rounded border border-tertiary/20">
                        SAVED REPORT
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] text-tertiary bg-tertiary-container/20 px-2 py-0.5 rounded border border-tertiary/20">
                        BLAMELESS AUDIT
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
                    {selectedPostmortem.title}
                  </h2>

                  {/* Lead Profile Banner */}
                  <div className="flex items-center gap-2.5 mt-1">
                    <div className="w-7 h-7 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-mono text-xs font-bold shadow-sm">
                      {selectedPostmortem.avatar || selectedPostmortem.lead?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                        <span>{selectedPostmortem.lead}</span>
                        <span className="text-[10px] font-mono text-primary font-normal bg-primary-container/20 px-2 py-0.2 rounded border border-primary/20">
                          {selectedPostmortem.leadRole || 'Investigation Lead'}
                        </span>
                      </p>
                      <p className="text-[10px] font-mono text-on-surface-variant">
                        {selectedPostmortem.leadEmail || `${selectedPostmortem.lead?.toLowerCase().replace(' ', '.')}@oryn.internal`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                  {/* Clone & Edit */}
                  <button
                    onClick={() => handleClonePostmortem(selectedPostmortem)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs border border-outline-variant/30 shadow-sm transition-all"
                    title="Clone this postmortem report into the authoring canvas"
                  >
                    <CopyPlus className="w-3.5 h-3.5 text-primary" />
                    <span>Clone</span>
                  </button>

                  {/* Edit Report */}
                  <button
                    onClick={() => handleEditPostmortem(selectedPostmortem)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs border border-outline-variant/30 shadow-sm transition-all"
                    title="Edit and update this postmortem report"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-secondary" />
                    <span>Edit</span>
                  </button>

                  {/* Retain to Memory Button */}
                  <button
                    onClick={handleRetainToMemory}
                    disabled={isRetaining}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-tertiary-container text-on-tertiary-container font-semibold text-xs shadow-md hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    <BrainCircuit className="w-3.5 h-3.5" />
                    <span>{isRetaining ? 'Retaining...' : 'Retain'}</span>
                  </button>

                  {/* Export PDF */}
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs border border-outline-variant/30 shadow-sm transition-all"
                  >
                    <Download className="w-3.5 h-3.5 text-primary" />
                    <span>Audit PDF</span>
                  </button>

                  {/* Delete Report for custom postmortems */}
                  {(!INITIAL_SEED_PM_IDS.has(selectedPostmortem.id) || selectedPostmortem.isCustom || selectedPostmortem.createdAt) && (
                    <button
                      onClick={() => handleDeletePostmortem(selectedPostmortem.id)}
                      className="p-2 rounded-xl bg-surface-container hover:bg-error-container/40 text-on-surface-variant hover:text-error border border-outline-variant/30 shadow-sm transition-all"
                      title="Delete saved postmortem report"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Impact Banner */}
              <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col gap-1.5">
                <span className="font-mono text-xs uppercase font-semibold text-on-surface-variant flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-error" /> IMPACT ASSESSMENT
                </span>
                <p className="text-xs text-on-surface leading-relaxed">
                  {selectedPostmortem.impact}
                </p>
              </div>

              {/* Root Cause Analysis */}
              <div className="flex flex-col gap-2">
                <span className="font-mono text-xs uppercase font-semibold text-on-surface-variant">
                  ROOT CAUSE INVESTIGATION
                </span>
                <p className="text-xs text-on-surface-variant leading-relaxed p-4 rounded-xl bg-surface-container border border-outline-variant/20">
                  {selectedPostmortem.rootCause}
                </p>
              </div>

              {/* Timeline Sequence */}
              <div className="flex flex-col gap-3">
                <span className="font-mono text-xs uppercase font-semibold text-on-surface-variant flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" /> SYSTEMIC EVENT TIMELINE
                </span>
                <div className="flex flex-col gap-2">
                  {(selectedPostmortem.timeline || []).map((t, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-xs">
                      <span className="font-mono text-primary font-bold whitespace-nowrap bg-primary-container/20 px-2 py-0.5 rounded border border-primary/20">
                        {t.time}
                      </span>
                      <span className="text-on-surface flex-1 pt-0.5">
                        {t.text || t.event || 'Incident milestone'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Analysis Split: What went well / What went wrong */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col gap-2.5">
                  <span className="font-mono text-xs uppercase font-semibold text-tertiary flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> WHAT WENT WELL
                  </span>
                  <ul className="flex flex-col gap-2 text-xs text-on-surface-variant">
                    {(selectedPostmortem.whatWentWell || []).map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-tertiary mt-0.5 flex-shrink-0" />
                        <span>{typeof item === 'object' ? (item.point || item.text || item.description || JSON.stringify(item)) : String(item)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col gap-2.5">
                  <span className="font-mono text-xs uppercase font-semibold text-error flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" /> WHAT WENT WRONG
                  </span>
                  <ul className="flex flex-col gap-2 text-xs text-on-surface-variant">
                    {(selectedPostmortem.whatWentWrong || []).map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-error mt-0.5 flex-shrink-0" />
                        <span>{typeof item === 'object' ? (item.point || item.text || item.description || JSON.stringify(item)) : String(item)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Preventative Action Items */}
              {selectedPostmortem.actionItems && selectedPostmortem.actionItems.length > 0 && (
                <div className="flex flex-col gap-3">
                  <span className="font-mono text-xs uppercase font-semibold text-on-surface-variant flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-tertiary" /> PREVENTATIVE ACTION ITEMS
                  </span>
                  <div className="overflow-x-auto rounded-xl border border-outline-variant/20">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-surface-container-high text-on-surface-variant font-mono text-[11px] uppercase border-b border-outline-variant/20">
                        <tr>
                          <th className="px-4 py-2.5 font-semibold">Action Item</th>
                          <th className="px-4 py-2.5 font-semibold">Owner</th>
                          <th className="px-4 py-2.5 font-semibold">Status (Click to Toggle)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10 font-sans">
                        {selectedPostmortem.actionItems.map((action, idx) => {
                          const actionText = typeof action === 'object' ? (action.action || action.title || action.task || action.description) : String(action);
                          const ownerText = typeof action === 'object' ? (action.owner || action.assignee || 'SRE Team') : 'SRE Team';
                          const statusText = typeof action === 'object' ? (action.status || 'Open') : 'Open';
                          return (
                            <tr key={idx} className="bg-surface-container-low hover:bg-surface-container transition-colors">
                              <td className="px-4 py-3 text-on-surface font-medium">{actionText}</td>
                              <td className="px-4 py-3 font-mono text-on-surface-variant">{ownerText}</td>
                              <td className="px-4 py-3">
                                <button
                                  type="button"
                                  onClick={() => handleToggleActionStatus(idx)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                                    statusText === 'Done'
                                      ? 'bg-tertiary-container/30 text-tertiary border border-tertiary/40'
                                      : 'bg-primary-container/30 text-primary border border-primary/40'
                                  }`}
                                  title="Click to toggle status: Done / In Progress"
                                >
                                  {statusText}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-surface-container-low border border-outline-variant/20 text-on-surface-variant">
              Select a postmortem from the left column to view the full investigative report.
            </div>
          )}
        </div>
      </div>

      {/* Creation & Editing Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-surface-container-low border border-outline-variant/30 rounded-2xl shadow-2xl p-6 sm:p-7 flex flex-col gap-5 my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg text-on-surface">
                  {isEditing ? 'Edit Postmortem Report' : 'Draft Postmortem Report'}
                </h3>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-on-surface-variant hover:text-on-surface text-sm font-mono"
              >
                ✕
              </button>
            </div>

            {/* Mode Switcher Tabs (Only when not in direct edit mode) */}
            {!isEditing && (
              <div className="flex items-center gap-2 p-1 rounded-xl bg-surface-container border border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setModalTab('ai')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                    modalTab === 'ai'
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Synthesize with AI</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('manual')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                    modalTab === 'manual'
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Manual Author / Template</span>
                </button>
              </div>
            )}

            {/* Tab 1: AI Synthesizer */}
            {modalTab === 'ai' && !isEditing && (
              <div className="flex flex-col gap-4">
                <p className="text-xs text-on-surface-variant">
                  Select an active or historical incident to synthesize an enterprise blameless postmortem using Gemini AI:
                </p>

                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs font-mono text-on-surface-variant mb-1">
                      Source Incident
                    </label>
                    <select
                      value={selectedIncidentId}
                      onChange={(e) => setSelectedIncidentId(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-surface-container border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:border-primary"
                    >
                      {incidents.map(i => (
                        <option key={i.id} value={i.id}>
                          [{i.service}] {i.title} ({i.severity})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-on-surface-variant mb-1">
                      Investigation Lead
                    </label>
                    <select
                      value={selectedLeadId}
                      onChange={(e) => setSelectedLeadId(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-surface-container border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:border-primary"
                    >
                      <option value="current">Current Session: {currentUser?.displayName || 'Alex Rivera'}</option>
                      {DEMO_ACCOUNTS.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.displayName} — {a.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-on-surface-variant mb-1">
                      Additional Operator Notes (Optional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Paste telemetry insights, slack communications, or specific root causes..."
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-surface-container border border-outline-variant/30 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/20">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:text-on-surface"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreatePostmortemWithAI}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-xs shadow-md hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isGenerating ? 'Synthesizing Report...' : 'Synthesize & Save Report'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Manual Authoring & Editing */}
            {(modalTab === 'manual' || isEditing) && (
              <form onSubmit={handleSaveManualPostmortem} className="flex flex-col gap-4">
                {/* Preset Template Quick-Select (Only when not editing) */}
                {!isEditing && (
                  <div className="p-3 rounded-xl bg-surface-container border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <BookmarkPlus className="w-4 h-4 text-primary" />
                      <span className="text-xs font-semibold text-on-surface">Quick-Start Templates:</span>
                    </div>
                    <select
                      onChange={(e) => {
                        if (e.target.value !== '') {
                          loadPresetPostmortemTemplate(parseInt(e.target.value, 10));
                        }
                      }}
                      defaultValue=""
                      className="p-1.5 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:border-primary"
                    >
                      <option value="" disabled>Load an enterprise template...</option>
                      {PRESET_POSTMORTEM_TEMPLATES.map((t, idx) => (
                        <option key={idx} value={idx}>{t.name} ({t.service})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Title & Service */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-mono text-on-surface-variant mb-1">
                      Postmortem Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Postmortem: PostgreSQL Connection Pool Starvation & Recovery"
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-surface-container border border-outline-variant/30 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-on-surface-variant mb-1">
                      Target Service
                    </label>
                    <select
                      value={manualService}
                      onChange={(e) => setManualService(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-surface-container border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:border-primary"
                    >
                      <option value="PostgreSQL">PostgreSQL</option>
                      <option value="Payment API">Payment API</option>
                      <option value="Gateway">Gateway</option>
                      <option value="Redis">Redis</option>
                      <option value="Kafka">Kafka</option>
                      <option value="Authentication">Authentication</option>
                      <option value="Kubernetes Fleet">Kubernetes Fleet</option>
                      <option value="Security & Ingress">Security & Ingress</option>
                      <option value="DNS & Networking">DNS & Networking</option>
                    </select>
                  </div>
                </div>

                {/* Lead & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-on-surface-variant mb-1">
                      Investigation Lead
                    </label>
                    <select
                      value={manualLeadId}
                      onChange={(e) => setManualLeadId(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-surface-container border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:border-primary"
                    >
                      <option value="current">Current: {currentUser?.displayName || 'Alex Rivera'}</option>
                      {DEMO_ACCOUNTS.map(a => (
                        <option key={a.id} value={a.id}>{a.displayName} — {a.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-on-surface-variant mb-1">
                      Incident Date
                    </label>
                    <input
                      type="date"
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-surface-container border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Impact Assessment */}
                <div>
                  <label className="block text-xs font-mono text-on-surface-variant mb-1">
                    Impact Assessment Summary
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. 24 minutes total downtime. 1,420 checkout transactions delayed. 0 data loss."
                    value={manualImpact}
                    onChange={(e) => setManualImpact(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-surface-container border border-outline-variant/30 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                {/* Root Cause Analysis */}
                <div>
                  <label className="block text-xs font-mono text-on-surface-variant mb-1">
                    Root Cause Investigation
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. Heavy unindexed query held row-level exclusive locks in long-running transaction."
                    value={manualRootCause}
                    onChange={(e) => setManualRootCause(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-surface-container border border-outline-variant/30 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                {/* Timeline Milestones */}
                <div className="flex flex-col gap-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono uppercase font-semibold text-on-surface-variant flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span>Timeline Milestones ({manualTimeline.length})</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setManualTimeline(prev => [...prev, { time: '00:00 UTC', text: '' }])}
                      className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Milestone
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
                    {manualTimeline.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Time (e.g. 14:15 UTC)"
                          value={item.time}
                          onChange={(e) => {
                            const copy = [...manualTimeline];
                            copy[idx].time = e.target.value;
                            setManualTimeline(copy);
                          }}
                          className="w-28 p-2 rounded-lg bg-surface-container border border-outline-variant/30 font-mono text-xs text-primary focus:outline-none focus:border-primary flex-shrink-0"
                        />
                        <input
                          type="text"
                          placeholder="Event description"
                          value={item.text}
                          onChange={(e) => {
                            const copy = [...manualTimeline];
                            copy[idx].text = e.target.value;
                            setManualTimeline(copy);
                          }}
                          className="flex-1 p-2 rounded-lg bg-surface-container border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:border-primary"
                        />
                        {manualTimeline.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setManualTimeline(prev => prev.filter((_, i) => i !== idx))}
                            className="text-on-surface-variant hover:text-error p-1"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preventative Action Items */}
                <div className="flex flex-col gap-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono uppercase font-semibold text-on-surface-variant flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-tertiary" />
                      <span>Preventative Action Items ({manualActionItems.length})</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setManualActionItems(prev => [...prev, { action: '', owner: currentUser?.displayName || 'Alex Rivera', status: 'Open' }])}
                      className="text-xs font-semibold text-tertiary hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Action Item
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
                    {manualActionItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Action item task"
                          value={item.action}
                          onChange={(e) => {
                            const copy = [...manualActionItems];
                            copy[idx].action = e.target.value;
                            setManualActionItems(copy);
                          }}
                          className="flex-1 p-2 rounded-lg bg-surface-container border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:border-primary"
                        />
                        <input
                          type="text"
                          placeholder="Owner"
                          value={item.owner}
                          onChange={(e) => {
                            const copy = [...manualActionItems];
                            copy[idx].owner = e.target.value;
                            setManualActionItems(copy);
                          }}
                          className="w-28 p-2 rounded-lg bg-surface-container border border-outline-variant/30 font-mono text-xs text-on-surface-variant focus:outline-none focus:border-primary flex-shrink-0"
                        />
                        <select
                          value={item.status}
                          onChange={(e) => {
                            const copy = [...manualActionItems];
                            copy[idx].status = e.target.value;
                            setManualActionItems(copy);
                          }}
                          className="w-24 p-2 rounded-lg bg-surface-container border border-outline-variant/30 font-mono text-xs text-on-surface focus:outline-none focus:border-primary flex-shrink-0"
                        >
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Done">Done</option>
                        </select>
                        {manualActionItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setManualActionItems(prev => prev.filter((_, i) => i !== idx))}
                            className="text-on-surface-variant hover:text-error p-1"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit Actions */}
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
                    disabled={isSavingManual || !manualTitle.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-xs shadow-md hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all"
                  >
                    <FileText className="w-4 h-4" />
                    <span>{isSavingManual ? 'Saving Report...' : isEditing ? 'Update & Save Report' : 'Save & Publish Report'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
