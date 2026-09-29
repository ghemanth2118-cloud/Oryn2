import React from 'react';

export default function OrynLogo({ className = "h-8", showEngine = true }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Geometric Logo Icon: Intersecting Memory Loop / Quantum Synapse */}
      <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-[#181B26] border border-[#2D3348] shadow-sm flex-shrink-0">
        <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none">
          <defs>
            <linearGradient id="oryn_grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818CF8" />
              <stop offset="50%" stopColor="#4F46E5" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <path d="M10 22L16 10L22 22" stroke="url(#oryn_grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="16" cy="10" r="2.5" fill="#818CF8" filter="url(#glow)" />
          <circle cx="10" cy="22" r="2" fill="#4F46E5" />
          <circle cx="22" cy="22" r="2" fill="#2563EB" />
          <path d="M12 18H20" stroke="#818CF8" strokeWidth="1.75" strokeLinecap="round" strokeDasharray="1 3"/>
        </svg>
      </div>

      <div className="flex items-center gap-2">
        <span className="font-headline-sm font-bold text-on-surface tracking-tight text-lg">
          ORYN
        </span>
        {showEngine && (
          <span className="px-1.5 py-0.5 rounded bg-surface-container-highest text-primary font-mono text-[10px] uppercase font-semibold tracking-wider border border-outline-variant/30">
            ENGINE
          </span>
        )}
      </div>
    </div>
  );
}
