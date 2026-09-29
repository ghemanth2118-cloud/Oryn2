import React from 'react';
import { NavLink } from 'react-router-dom';
import OrynLogo from '../components/common/OrynLogo';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="flex flex-col items-center gap-4 max-w-md">
        <OrynLogo />
        <div className="w-16 h-16 rounded-2xl bg-error-container/30 border border-error/40 flex items-center justify-center text-error mt-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-on-surface">404: Subsystem Not Found</h1>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          The requested routing target or organizational memory document does not exist in the active cluster index.
        </p>
        <NavLink
          to="/dashboard"
          className="mt-4 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-xs flex items-center gap-2 shadow-md hover:opacity-90 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Incident Deck</span>
        </NavLink>
      </div>
    </div>
  );
}
