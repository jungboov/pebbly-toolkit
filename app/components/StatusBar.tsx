import { PixelGauge } from './PixelGauge';

interface StatusBarProps {
  modelStatus: 'idle' | 'loading' | 'ready' | 'error';
  modelProgress: number;
  batchStatus: 'idle' | 'processing' | 'ready';
  batchStats: {
    completed: number;
    total: number;
    active: number;
    avgMs: number;
    etaMs: number;
    totalTimeMs: number;
  };
  overallPercentage: number;
  onRetryModel: () => void;
}

function formatSec(ms: number) {
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatEta(ms: number) {
  return ms <= 0 ? '—' : `~${Math.ceil(ms / 1000)}s`;
}

export function StatusBar({
  modelStatus,
  modelProgress,
  batchStatus,
  batchStats,
  overallPercentage,
  onRetryModel,
}: StatusBarProps) {
  if (modelStatus === 'loading') {
    return (
      <div className="flex items-center gap-3 px-3 py-2 border border-[#00ff00] bg-[#00ff00]/5 text-[10px] tracking-[0.12em] font-black uppercase min-w-0">
        <span aria-live="polite" className="text-[#00ff00] animate-pulse">⋯</span>
        <span className="text-[#00ff00] whitespace-nowrap">INITIALIZING</span>
        <span className="text-[#00ff00]/60 whitespace-nowrap font-mono">{modelProgress}% / 43MB</span>
        <div className="flex-1 min-w-0">
          <PixelGauge value={modelProgress} blocks={10} height="sm" glow />
        </div>
        <span className="text-[#00ff00]/60 whitespace-nowrap">—</span>
      </div>
    );
  }

  if (modelStatus === 'error') {
    return (
      <div className="flex items-center gap-3 px-3 py-2 border border-red-500 bg-red-500/5 text-[10px] tracking-[0.12em] font-black uppercase min-w-0">
        <span aria-live="polite" className="text-red-500">!!</span>
        <span className="text-red-500 whitespace-nowrap">MODEL_ERROR</span>
        <span className="flex-1 min-w-0 text-red-400/70 truncate normal-case tracking-normal">network or cache issue</span>
        <button
          onClick={onRetryModel}
          className="flex-shrink-0 px-2 py-1 text-[9px] font-black uppercase tracking-[0.2em] border border-red-500 text-red-500 hover:bg-red-500 hover:text-black transition-all"
        >
          &gt;&gt; Retry
        </button>
      </div>
    );
  }

  if (batchStatus === 'idle') {
    return (
      <div className="flex items-center gap-3 px-3 py-2 border border-[#00ff00] bg-transparent text-[10px] tracking-[0.12em] font-black uppercase min-w-0 opacity-60">
        <span aria-live="polite" className="text-[#00ff00]">○</span>
        <span className="text-[#00ff00] whitespace-nowrap">IDLE</span>
        <span className="text-[#00ff00]/60 whitespace-nowrap font-mono">0/0</span>
        <div className="flex-1 min-w-0">
          <PixelGauge value={0} blocks={10} height="sm" />
        </div>
        <span className="text-[#00ff00]/60 whitespace-nowrap">대기</span>
      </div>
    );
  }

  if (batchStatus === 'processing') {
    return (
      <div className="flex items-center gap-3 px-3 py-2 border border-[#00ff00] bg-[#00ff00]/5 text-[10px] tracking-[0.12em] font-black uppercase min-w-0">
        <span aria-live="polite" className="text-[#00ff00] animate-pulse">●</span>
        <span className="text-[#00ff00] whitespace-nowrap">PROCESSING</span>
        <span className="text-[#00ff00]/80 whitespace-nowrap font-mono">
          {batchStats.completed}/{batchStats.total}
        </span>
        <div className="flex-1 min-w-0">
          <PixelGauge value={overallPercentage} blocks={10} height="sm" glow />
        </div>
        <span className="text-[#00ff00]/80 whitespace-nowrap font-mono">ETA {formatEta(batchStats.etaMs)}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2 border border-[#00ff00] bg-[#00ff00]/5 text-[10px] tracking-[0.12em] font-black uppercase min-w-0">
      <span aria-live="polite" className="text-[#00ff00]">✓</span>
      <span className="text-[#00ff00] whitespace-nowrap">READY</span>
      <span className="text-[#00ff00]/80 whitespace-nowrap font-mono">
        {batchStats.completed}/{batchStats.total}
      </span>
      <div className="flex-1 min-w-0">
        <PixelGauge value={100} blocks={10} height="sm" glow />
      </div>
      <span className="text-[#00ff00]/80 whitespace-nowrap font-mono">
        DONE {batchStats.totalTimeMs > 0 ? formatSec(batchStats.totalTimeMs) : '—'}
      </span>
    </div>
  );
}
