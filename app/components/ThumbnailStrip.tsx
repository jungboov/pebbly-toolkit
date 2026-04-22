import type { BatchItem } from '../hooks/useBatchProcessor';
import { PixelGauge } from './PixelGauge';

interface ThumbnailStripProps {
  items: BatchItem[];
  selectedIndex: number | null;
  onSelect: (idx: number) => void;
  onAdd: () => void;
}

export function ThumbnailStrip({ items, selectedIndex, onSelect, onAdd }: ThumbnailStripProps) {
  return (
    <div className="flex gap-2 overflow-x-auto py-1 scrollbar-hide">
      <button
        onClick={onAdd}
        className="flex-shrink-0 w-11 h-11 md:w-14 md:h-14 border-2 border-[#00ff00] opacity-30 hover:opacity-100 flex items-center justify-center text-xl transition-all"
      >
        +
      </button>
      {items.map((item, idx) => {
        const isSelected = selectedIndex === idx;
        const stateClass = isSelected
          ? 'border-[#00ff00] scale-105 shadow-[0_0_8px_#00ff00]'
          : item.status === 'processing'
            ? 'border-[#00ff00]/60 opacity-40 hover:opacity-100'
            : item.status === 'completed'
              ? 'border-transparent opacity-60 hover:opacity-100 shadow-[0_0_6px_rgba(0,255,0,0.25)]'
              : 'border-transparent opacity-40 hover:opacity-100';

        return (
          <div
            key={item.id}
            onClick={() => onSelect(idx)}
            className={`flex-shrink-0 w-11 h-11 md:w-14 md:h-14 overflow-hidden border-2 cursor-pointer relative transition-all hover:scale-105 ${stateClass} ${item.status === 'processing' ? 'animate-pulse' : ''}`}
          >
            <img
              src={item.original}
              className={`w-full h-full object-cover pointer-events-none ${item.status === 'pending' ? 'grayscale opacity-30' : ''}`}
              alt="Thumbnail"
            />
            {item.status === 'completed' && (
              <div className="absolute top-0.5 right-0.5 w-3 h-3 md:w-4 md:h-4 bg-[#00ff00] text-black font-bold flex items-center justify-center text-[7px] md:text-[8px] z-10 shadow-md">
                OK
              </div>
            )}
            {item.status === 'processing' && (
              <>
                <div className="absolute inset-0 bg-black/40 z-10" />
                <div className="absolute top-0.5 right-0.5 bg-black/70 text-[#00ff00] text-[8px] md:text-[9px] font-black px-1 leading-none py-0.5 z-20">
                  {item.progress}%
                </div>
                <div className="absolute bottom-0.5 left-0.5 right-0.5 z-20">
                  <PixelGauge value={item.progress} blocks={5} height="sm" />
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
