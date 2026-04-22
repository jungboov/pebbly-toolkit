interface ControlRowProps {
  completedCount: number;
  isDownloading: boolean;
  onDownload: () => void;
  onClear: () => void;
}

export function ControlRow({ completedCount, isDownloading, onDownload, onClear }: ControlRowProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onDownload}
        disabled={isDownloading || completedCount === 0}
        className="flex-[2] py-3 md:py-5 bg-[#00ff00] text-black text-[11px] tracking-[0.2em] font-black uppercase disabled:opacity-20 hover:bg-white transition-all"
      >
        {isDownloading ? '>> ARCHIVING...' : `DOWNLOAD_RESULTS (${completedCount})`}
      </button>
      <button
        onClick={onClear}
        className="flex-1 py-3 md:py-5 border border-[#00ff00] text-[#00ff00] text-[11px] tracking-[0.2em] font-black uppercase opacity-50 hover:opacity-100 transition-all"
      >
        CLEAR
      </button>
    </div>
  );
}
