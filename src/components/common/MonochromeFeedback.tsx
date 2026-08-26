import React from 'react';
import { RefreshCw, ShieldAlert, FolderOpen, ArrowRight, Activity, Terminal } from 'lucide-react';
import { getStatusBadge, StatusGlyphType } from '../../styles/designSystem';

/**
 * Stage-by-stage contextual loading indicator for RAW, AI, and Export pipelines.
 */
export interface LoadingStep {
  label: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'SKIPPED';
  detail?: string;
}

export interface ContextualLoadingProps {
  title: string;
  steps: LoadingStep[];
  currentWorker?: string;
  hardwareSummary?: string;
  onCancel?: () => void;
}

export const ContextualLoading: React.FC<ContextualLoadingProps> = ({
  title,
  steps,
  currentWorker = 'Worker Pool Active',
  hardwareSummary = 'WebGL2 32-bit Float Pipeline',
  onCancel,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-zinc-950 border border-zinc-800 rounded-lg max-w-md w-full shadow-2xl text-zinc-100 font-sans select-none">
      <div className="flex items-center justify-between w-full pb-3 border-b border-zinc-850 mb-4">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-zinc-300 animate-spin" />
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-200">{title}</span>
        </div>
        <span className="text-[10px] font-mono text-zinc-500">{hardwareSummary}</span>
      </div>

      <div className="w-full space-y-2 mb-4">
        {steps.map((step, idx) => {
          let glyph = '○';
          let statusStyle = 'text-zinc-500';
          if (step.status === 'COMPLETED') {
            glyph = '✓';
            statusStyle = 'text-zinc-100 font-semibold';
          } else if (step.status === 'RUNNING') {
            glyph = '◐';
            statusStyle = 'text-zinc-200 font-bold animate-pulse';
          } else if (step.status === 'SKIPPED') {
            glyph = '—';
            statusStyle = 'text-zinc-600';
          }

          return (
            <div key={idx} className="flex items-center justify-between text-xs font-mono px-2 py-1 bg-zinc-900/60 rounded border border-zinc-850">
              <span className="text-zinc-300">{step.label}</span>
              <div className="flex items-center gap-2">
                {step.detail && <span className="text-[10px] text-zinc-500">{step.detail}</span>}
                <span className={`font-mono ${statusStyle}`}>{glyph}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between w-full pt-3 border-t border-zinc-850 text-[11px] font-mono text-zinc-400">
        <span>{currentWorker}</span>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-2.5 py-1 text-[11px] font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 rounded transition-colors"
          >
            Abort
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Informative Empty State component explaining what is missing, why it matters, and next steps.
 */
export interface ContextualEmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  icon?: React.ReactNode;
}

export const ContextualEmptyState: React.FC<ContextualEmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto my-auto select-none">
      <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 text-zinc-400">
        {icon || <FolderOpen className="w-5 h-5 text-zinc-400" />}
      </div>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-200 mb-1">{title}</h3>
      <p className="text-xs text-zinc-400 leading-relaxed mb-5">{description}</p>
      
      <div className="flex items-center gap-3">
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="px-4 py-2 text-xs font-semibold bg-zinc-100 hover:bg-white text-zinc-950 rounded transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>{actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <button
            onClick={onSecondaryAction}
            className="px-4 py-2 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-750 rounded transition-colors"
          >
            {secondaryActionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Professional Error state protecting user data and providing non-cryptic recovery actions.
 */
export interface ContextualErrorProps {
  errorCode: string;
  message?: string;
  onRetry?: () => void;
  onContinueOffline?: () => void;
  onOpenDiagnostics?: () => void;
}

export const ContextualErrorState: React.FC<ContextualErrorProps> = ({
  errorCode,
  message = 'An unexpected condition was detected during processing. Your project state has been preserved locally in IndexedDB.',
  onRetry,
  onContinueOffline,
  onOpenDiagnostics,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-zinc-950 border border-zinc-800 rounded-lg max-w-md w-full shadow-2xl text-zinc-200 font-sans select-none">
      <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center mb-3">
        <ShieldAlert className="w-5 h-5 text-zinc-200" />
      </div>
      
      <h3 className="text-sm font-bold tracking-tight text-zinc-100 mb-1">Processing Interrupted</h3>
      <p className="text-xs text-zinc-400 text-center mb-3 leading-relaxed">{message}</p>
      
      <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded p-2.5 mb-4 text-center font-mono text-[11px] text-zinc-400">
        Reference Code: <span className="text-zinc-200 font-bold">{errorCode}</span> • Zero Data Loss Certified
      </div>

      <div className="flex items-center gap-2 w-full">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex-1 py-2 text-xs font-semibold bg-zinc-100 hover:bg-white text-zinc-950 rounded transition-colors text-center"
          >
            Retry
          </button>
        )}
        {onContinueOffline && (
          <button
            onClick={onContinueOffline}
            className="flex-1 py-2 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 rounded transition-colors text-center"
          >
            Continue Offline
          </button>
        )}
        {onOpenDiagnostics && (
          <button
            onClick={onOpenDiagnostics}
            className="px-3 py-2 text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 rounded transition-colors flex items-center justify-center"
            title="Open Engineering Diagnostics Console"
          >
            <Terminal className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Monochrome status badge helper component
 */
export const MonochromeBadge: React.FC<{
  type: StatusGlyphType;
  label?: string;
  className?: string;
}> = ({ type, label, className = '' }) => {
  const badge = getStatusBadge(type, label);
  return (
    <span className={`${badge.className} ${className}`}>
      <span className="text-[12px]">{badge.symbol}</span>
      <span>{badge.label}</span>
    </span>
  );
};
