import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMemories, createMemory } from '../services/firestoreService';
import { 
  BrainCircuit, 
  Search, 
  Filter, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  Layers, 
  Clock, 
  Tag, 
  X, 
  BookOpenCheck,
  Zap,
  ShieldCheck,
  Server
} from 'lucide-react';
import { toast } from 'sonner';

export default function MemoryPage() {
  const navigate = useNavigate();
  const [memories, setMemories] = useState([]);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getMemories();
      setMemories(data);
      if (data.length > 0) setSelectedMemory(data[0]);
      setLoading(false);
    }
    load();
  }, []);

  const filteredMemories = memories.filter(mem => {
    const matchesSearch = 
      mem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mem.errorSignature.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mem.rootCause.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mem.service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesService = serviceFilter === 'ALL' || mem.service === serviceFilter;
    return matchesSearch && matchesService;
  });

  const services = ['ALL', 'PostgreSQL', 'Payment API', 'Redis', 'Gateway', 'Kafka', 'Authentication'];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-container/40 flex items-center justify-center text-primary">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
              Organizational Memory Engine
            </h1>
          </div>
          <p className="text-sm text-on-surface-variant mt-1">
            Semantic archive indexing every production failure, verified fix, and mechanical root cause.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs font-mono">
            <Sparkles className="w-4 h-4 text-tertiary" />
            <span className="text-on-surface">Zero Repeat Outages: <strong>96.8%</strong></span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/20 shadow-sm">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search by error signature, root cause, or service (e.g. PG_CONN_POOL)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container text-xs text-on-surface placeholder:text-on-surface-variant border border-outline-variant/20 focus:outline-none focus:border-primary"
          />
        </div>

        {/* Service Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {services.map(svc => (
            <button
              key={svc}
              onClick={() => setServiceFilter(svc)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                serviceFilter === svc
                  ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {svc}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split: Memory Cards Grid vs Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Memory Cards List (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3.5">
          {filteredMemories.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-surface-container-low border border-outline-variant/20 text-on-surface-variant text-sm">
              No organizational memories matched your query.
            </div>
          ) : (
            filteredMemories.map(mem => (
              <div
                key={mem.id}
                onClick={() => setSelectedMemory(mem)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-3 ${
                  selectedMemory?.id === mem.id
                    ? 'bg-surface-container border-primary shadow-lg ring-1 ring-primary/40'
                    : 'bg-surface-container-low border-outline-variant/20 hover:border-outline-variant/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">{mem.id}</span>
                    <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-mono text-[10px]">
                      {mem.service}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                      mem.severity === 'SEV-1' ? 'bg-error-container text-on-error-container' : 'bg-secondary-container/40 text-secondary'
                    }`}>
                      {mem.severity}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-tertiary font-semibold">{mem.confidenceScore}% confidence</span>
                    <span className="text-on-surface-variant">•</span>
                    <span className="text-on-surface-variant">{mem.timesRecalled} recalls</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-on-surface text-sm sm:text-base leading-snug">
                    {mem.title}
                  </h3>
                  <p className="text-xs text-on-surface-variant line-clamp-2 mt-1 leading-relaxed">
                    {mem.rootCause}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-outline-variant/10 text-xs">
                  <span className="font-mono text-[11px] text-primary bg-primary-container/20 px-2 py-0.5 rounded border border-primary/20">
                    {mem.errorSignature}
                  </span>
                  <span className="font-mono text-[11px] text-tertiary flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {mem.verifiedSuccessRate}% verified success
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column: Expandable Detail Drawer (5 cols) */}
        <div className="lg:col-span-5">
          {selectedMemory ? (
            <div className="sticky top-24 p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 shadow-xl flex flex-col gap-5">
              <div className="flex items-start justify-between pb-3 border-b border-outline-variant/20">
                <div>
                  <span className="font-mono text-xs font-bold text-primary">{selectedMemory.id}</span>
                  <h2 className="text-lg font-bold text-on-surface mt-1 leading-snug">
                    {selectedMemory.title}
                  </h2>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/20">
                  <span className="block text-xl font-bold text-tertiary">{selectedMemory.verifiedSuccessRate}%</span>
                  <span className="text-[10px] text-on-surface-variant font-mono uppercase">Verified Fix Rate</span>
                </div>
                <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/20">
                  <span className="block text-xl font-bold text-primary">{selectedMemory.timesRecalled}x</span>
                  <span className="text-[10px] text-on-surface-variant font-mono uppercase">Recalled In Outages</span>
                </div>
              </div>

              {/* Error Signature */}
              <div className="flex flex-col gap-1 text-xs">
                <span className="font-mono text-[10px] text-on-surface-variant uppercase font-semibold">
                  Normalized Error Signature
                </span>
                <code className="p-2.5 rounded-lg bg-surface-container font-mono text-xs text-primary font-bold border border-primary/20">
                  {selectedMemory.errorSignature}
                </code>
              </div>

              {/* Root Cause Detail */}
              <div className="flex flex-col gap-1 text-xs">
                <span className="font-semibold text-on-surface">Mechanical Root Cause</span>
                <p className="text-on-surface-variant leading-relaxed bg-surface-container p-3 rounded-xl border border-outline-variant/20">
                  {selectedMemory.rootCause}
                </p>
              </div>

              {/* Recovery Steps */}
              <div className="flex flex-col gap-1.5 text-xs">
                <span className="font-semibold text-on-surface">Verified Recovery Sequence</span>
                <div className="flex flex-col gap-2">
                  {selectedMemory.recoverySteps?.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface-container border border-outline-variant/20">
                      <span className="w-5 h-5 rounded-full bg-primary-container text-on-primary-container font-mono text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-on-surface text-xs">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => navigate('/runbooks')}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary-container to-secondary-container text-on-primary-container font-semibold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  <BookOpenCheck className="w-4 h-4" />
                  <span>Execute Dynamic Recovery Playbook</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-surface-container-low border border-outline-variant/20 text-on-surface-variant text-sm">
              Select an organizational memory to inspect its recovery runbook.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
