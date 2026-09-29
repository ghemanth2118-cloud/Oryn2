import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center bg-surface-container-low border border-error/30 rounded-2xl m-6">
          <div className="w-12 h-12 rounded-xl bg-error-container/30 text-error flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-on-surface">Subsystem Rendering Anomaly</h2>
          <p className="text-xs text-on-surface-variant max-w-md mt-1 mb-4">
            {this.state.error?.message || "An unexpected error occurred while rendering this interface."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl bg-primary text-on-primary font-semibold text-xs flex items-center gap-2 shadow-md hover:opacity-90"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Interface</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
