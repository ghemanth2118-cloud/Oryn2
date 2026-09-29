import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { seedDatabaseIfEmpty } from '../services/firestoreService';
import { 
  Settings, 
  Database, 
  Sparkles, 
  ShieldCheck, 
  RefreshCw, 
  Key, 
  CheckCircle2, 
  Bell, 
  Server,
  Terminal
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { currentUser, demoLogin } = useAuth();
  const [isReseeding, setIsReseeding] = useState(false);

  const handleReseed = async () => {
    setIsReseeding(true);
    localStorage.removeItem('oryn_db_seeded_v1');
    localStorage.removeItem('oryn_local_incidents');
    localStorage.removeItem('oryn_local_memories');
    localStorage.removeItem('oryn_local_runbooks');
    localStorage.removeItem('oryn_local_postmortems');
    
    await seedDatabaseIfEmpty();
    setIsReseeding(false);
    toast.success("Database reseeded with 25 realistic production incidents across all 6 services!");
    setTimeout(() => window.location.reload(), 800);
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface">
            <Settings className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
            Platform Settings & Integrations
          </h1>
        </div>
        <p className="text-sm text-on-surface-variant mt-1">
          Configure Firebase fleet backend, Gemini AI model parameters, and role-based permissions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Firebase Configuration Card */}
        <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
            <div className="flex items-center gap-2.5">
              <Database className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-on-surface text-base">Firebase Cloud Infrastructure</h3>
            </div>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-tertiary-container/30 text-on-tertiary-container font-semibold">
              CONNECTED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/20">
              <span className="text-on-surface-variant block text-[10px]">PROJECT ID</span>
              <span className="text-on-surface font-bold text-sm">team-99962</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/20">
              <span className="text-on-surface-variant block text-[10px]">AUTH DOMAIN</span>
              <span className="text-on-surface font-bold text-sm">team-99962.firebaseapp.com</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/20">
              <span className="text-on-surface-variant block text-[10px]">STORAGE BUCKET</span>
              <span className="text-on-surface font-bold text-sm">team-99962.firebasestorage.app</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/20">
              <span className="text-on-surface-variant block text-[10px]">SECURITY RULES</span>
              <span className="text-tertiary font-bold text-sm">Role-Based Access (Admin / Engineer)</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-on-surface-variant">
              Re-populate 25 hyper-realistic incidents across Payment API, Redis, PostgreSQL, Gateway, Kafka, and Authentication.
            </span>
            <button
              onClick={handleReseed}
              disabled={isReseeding}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs border border-outline-variant/30 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-primary ${isReseeding ? 'animate-spin' : ''}`} />
              <span>{isReseeding ? 'Reseeding...' : 'Reseed 25 Incidents'}</span>
            </button>
          </div>
        </div>

        {/* Gemini AI Settings */}
        <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-secondary" />
              <h3 className="font-bold text-on-surface text-base">Gemini 2.5 Flash Autonomous Engine</h3>
            </div>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-primary-container/30 text-primary font-semibold border border-primary/30">
              ACTIVE
            </span>
          </div>

          <p className="text-xs text-on-surface-variant leading-relaxed">
            The ORYN Autonomous Engine utilizes Google Gemini 2.5 Flash with structured JSON output schema for 
            sub-second incident log analysis, dynamic runbook synthesis, and blameless postmortem generation.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/20">
              <span className="text-on-surface-variant block text-[10px]">PRIMARY MODEL</span>
              <span className="text-on-surface font-bold">gemini-flash-latest</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/20">
              <span className="text-on-surface-variant block text-[10px]">INFERENCE TEMPERATURE</span>
              <span className="text-on-surface font-bold">0.2 (Deterministic SRE)</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/20">
              <span className="text-on-surface-variant block text-[10px]">FALLBACK ENGINE</span>
              <span className="text-tertiary font-bold">Multi-model Heuristic Safety</span>
            </div>
          </div>
        </div>

        {/* RBAC Role Switcher */}
        <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-tertiary" />
              <h3 className="font-bold text-on-surface text-base">Role-Based Access Control (RBAC)</h3>
            </div>
            <span className="font-mono text-xs font-bold uppercase text-on-surface">
              CURRENT: <strong className="text-primary">{currentUser?.role || 'ENGINEER'}</strong>
            </span>
          </div>

          <p className="text-xs text-on-surface-variant">
            Test how different roles interact with Firestore security permissions and dashboard action access.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => demoLogin('admin')}
              className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase transition-all ${
                currentUser?.role === 'admin'
                  ? 'bg-primary text-on-primary shadow-md'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Admin Role (Full Firestore Write & Delete)
            </button>
            <button
              onClick={() => demoLogin('engineer')}
              className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase transition-all ${
                currentUser?.role === 'engineer'
                  ? 'bg-secondary text-on-secondary shadow-md'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Engineer Role (Incident Triage & Mitigation)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
