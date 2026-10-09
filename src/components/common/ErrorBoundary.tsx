import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error captured by Climora ErrorBoundary:', error, errorInfo);
  }

  private handleResetData = () => {
    try {
      localStorage.clear();
    } catch (e) {
      console.warn('Failed to clear localStorage:', e);
    }
    window.location.reload();
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-fin-bg text-fin-text flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl bg-fin-card border border-rose-500/30 p-6 shadow-2xl text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mx-auto">
              <div className="w-11 h-11 rounded-xl bg-fin-sunken border border-fin-border overflow-hidden shadow-sm">
                <img src="/Climora-logo.jpg" alt="Climora Logo" className="w-full h-full object-cover" />
              </div>
              <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-700 dark:text-rose-300">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-fin-text tracking-tight">Application Render Interrupted</h2>
              <p className="text-xs text-fin-muted mt-1">
                An unexpected state error was safely intercepted by Climora's resilience boundary.
              </p>
            </div>
            {this.state.error && (
              <div className="p-3 rounded-lg bg-fin-inset border border-fin-border text-[11px] font-mono text-rose-700 dark:text-rose-300 text-left overflow-x-auto">
                {this.state.error.message}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={this.handleRetry}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-fin-inset hover:bg-fin-hover text-xs font-semibold text-fin-text transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
                <span>Retry View</span>
              </button>
              <button
                onClick={this.handleResetData}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-rose-50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Cache & Reload</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
