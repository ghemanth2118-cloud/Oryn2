import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  ShieldCheck, 
  Mail, 
  Briefcase, 
  Award, 
  Clock, 
  Terminal, 
  CheckCircle2 
} from 'lucide-react';

export default function ProfilePage() {
  const { currentUser } = useAuth();

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header Profile Card */}
      <div className="p-8 rounded-2xl bg-surface-container-low border border-outline-variant/20 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="relative flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center text-3xl font-bold shadow-lg">
            {currentUser?.displayName?.slice(0, 2).toUpperCase() || 'AR'}
          </div>
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-tertiary border-4 border-surface-container-low" />
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <h1 className="text-2xl font-bold text-on-surface">
              {currentUser?.displayName || 'Alex Rivera'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-primary-container text-on-primary-container font-mono text-xs font-bold uppercase tracking-wider">
              {currentUser?.role || 'ADMIN'}
            </span>
          </div>
          <p className="text-sm text-on-surface-variant mt-1 font-mono">
            {currentUser?.title || 'Principal SRE • Reliability Engineering Lead'}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-mono text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-primary" /> {currentUser?.email || 'alex.rivera@oryn.internal'}
            </span>
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-secondary" /> Mission Critical Fleet
            </span>
          </div>
        </div>
      </div>

      {/* SRE Clearance & Activity Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
          <span className="text-2xl font-bold text-tertiary">42</span>
          <span className="block text-[11px] font-mono text-on-surface-variant uppercase mt-1">
            Incidents Mitigated
          </span>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
          <span className="text-2xl font-bold text-primary">14.2m</span>
          <span className="block text-[11px] font-mono text-on-surface-variant uppercase mt-1">
            Personal MTTR Avg
          </span>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
          <span className="text-2xl font-bold text-secondary">100%</span>
          <span className="block text-[11px] font-mono text-on-surface-variant uppercase mt-1">
            SLA Attainment
          </span>
        </div>
      </div>

      {/* Account & Session Controls */}
      <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-on-surface text-base">Authentication & Workspace Session</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Switch between SRE profiles, authenticate with another Firebase email, or register a new engineer.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <NavLink
            to="/login"
            className="px-4 py-2 rounded-xl bg-primary text-on-primary font-semibold text-xs shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-1.5"
          >
            <span>Switch / Login</span>
          </NavLink>
          <NavLink
            to="/dashboard"
            className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs border border-outline-variant/30 transition-all"
          >
            <span>Back to Dashboard</span>
          </NavLink>
        </div>
      </div>
    </div>
  );
}
