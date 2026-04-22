import type { BatchItem } from '../hooks/useBatchProcessor';

interface ViewerProps {
  selectedItem: BatchItem | null;
  compareSlider: number;
  onCompareChange: (v: number) => void;
  onFileInputClick: () => void;
}

export function Viewer({ selectedItem, compareSlider, onCompareChange, onFileInputClick }: ViewerProps) {
  return (
    <div className="relative w-full max-w-[600px] mx-auto bg-black border-4 border-[#00ff00] aspect-square flex items-center justify-center overflow-hidden bg-black/40">
      {!selectedItem ? (
        <div className="text-center cursor-pointer group" onClick={onFileInputClick}>
          <div className="w-16 h-16 border-2 border-[#00ff00] flex items-center justify-center mx-auto mb-4 text-2xl font-bold group-hover:bg-[#00ff00] group-hover:text-black transition-all">+</div>
          <span className="text-[10px] font-black tracking-[0.4em] uppercase opacity-60">Click or Drag Images Here</span>
        </div>
      ) : (
        <div className="relative w-full h-full p-4 md:p-8 flex items-center justify-center">
          <div className="relative max-w-full max-h-full shadow-2xl bg-checkerboard overflow-hidden border-2 border-[#00ff00]">
            <img
              src={selectedItem.processed || selectedItem.original}
              className={`max-w-full max-h-full object-contain block ${selectedItem.status === 'processing' ? 'opacity-30 blur-sm' : ''}`}
              alt="Main View"
            />

            {selectedItem.processed && (
              <>
                <div className="absolute inset-0 overflow-hidden z-10" style={{ clipPath: `inset(0 0 0 ${compareSlider}%)` }}>
                  <img src={selectedItem.original} className="max-w-full max-h-full object-contain block" alt="Original Layer" />
                </div>

                <div className="absolute top-0 bottom-0 w-[2px] bg-[#00ff00] z-20 pointer-events-none shadow-[0_0_10px_#00ff00]" style={{ left: `${compareSlider}%` }}>
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-black border-2 border-[#00ff00] text-[#00ff00] text-[9px] font-black uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(0,255,0,0.5)] whitespace-nowrap z-30">
                    {compareSlider > 50 ? 'SRC_ORIGIN' : 'OUT_PROCESS'}
                  </div>

                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-black border-2 border-[#00ff00] flex items-center justify-center text-[#00ff00] shadow-[0_0_20px_rgba(0,255,0,0.4)] transform rotate-45">
                    <div className="transform -rotate-45 font-black text-xs">↔</div>
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={compareSlider}
                  onChange={(e) => onCompareChange(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                />
              </>
            )}

            {selectedItem.status === 'processing' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-40">
                <span className="text-5xl font-black italic tracking-tight text-[#00ff00] animate-pulse">{selectedItem.progress}%</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
